/**
 * 工作台（docs/decisions/0009 第 4 节）：整宽的表格，上面的页签筛格子（待办、已办、抄送我的、我发起的、草稿，带计数，parts/boxes），
 * 再按关键字、流程筛；点一行在抽屉里打开审批单，抽屉里上一条、下一条（J / K）不用回到列表。
 * 处理完一条自动换到下一条，格子空了抽屉收起；数据变了（别人处理了、作业跑了）跟着刷新。
 * 批量：待办勾几条一起同意（各用节点上不要求写意见的同意结果，没有的不能勾），逐条给出结果，没办成的留着勾上并写出原因；
 * 抄送勾几条标为已读。
 * 格子与打开的单子记在地址栏里（box、instance、item），刷新、分享链接都还在。
 */
import { ChevronDown, ChevronUp } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  Empty,
  IconButton,
  Kbd,
  Select,
  SelectionBar,
  Small,
  Tab,
  TabList,
  Tabs,
  TextField,
  useHotkeys,
  useMediaQuery,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { breakpoints } from '@zerodep-dev/vue-tsx-pro-ui/tokens';
import { onScopeDispose, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApprovalPanel } from '../parts/ApprovalPanel';
import {
  BOXES,
  boxOf,
  entryQuery,
  loadBox,
  useBoxCounts,
  type Box,
  type Entry,
} from '../parts/boxes';
import { timeText } from '../parts/labels';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';

const styles = css.create({
  page: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: 0 },
  filters: { display: 'flex', alignItems: 'center', gap: '_sm', flexWrap: 'wrap' },
  search: { width: { default: '100%', [breakpoints.sm]: '16rem' } },
  process: {
    width: { default: 'auto', [breakpoints.sm]: '12rem' },
    flexGrow: { default: 1, [breakpoints.sm]: 0 },
  },
  compact: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  // 表格占满剩下的高度，长了在里面滚
  table: { maxHeight: 'calc(100dvh - 14rem)' },
  nav: { display: 'flex', alignItems: 'center', gap: '_xs', marginBlockEnd: '_sm' },
  hint: { marginInlineStart: 'auto' },
});

/** 各格子的列名：环节一列、时间一列、标记一列写什么 */
const HEADERS: Record<Box, { step: string | null; at: string; badge: string | null }> = {
  todo: { step: '环节', at: '到达', badge: '时限' },
  done: { step: '环节', at: '处理时间', badge: '状态' },
  cc: { step: '抄送人', at: '抄送时间', badge: '' },
  started: { step: '现在到', at: '发起时间', badge: '状态' },
  drafts: { step: null, at: '保存时间', badge: null },
};

/** 手机上的一列：标题，下面一行小字写流程、环节与时间（多列要横着滚，看不全） */
function compactTitle(entry: Entry, now: Date) {
  const meta = [entry.process, entry.step === '草稿' ? '' : entry.step, timeText(entry.at, now)];
  return (
    <span {...css.attrs(styles.compact)}>
      {entry.title}
      <Small tone="muted">{meta.filter(Boolean).join(' · ')}</Small>
    </span>
  );
}

function columnsOf(box: Box, compact: boolean, now: Date): DataTableColumn<Entry>[] {
  const headers = HEADERS[box];
  const badge =
    headers.badge === null
      ? []
      : [
          {
            key: 'badge',
            header: headers.badge,
            width: compact ? 90 : 110,
            cell: (e: Entry) => e.badge && <Badge tone={e.badge.tone}>{e.badge.label}</Badge>,
          },
        ];
  if (compact)
    return [
      { key: 'title', header: '单据', minWidth: 160, cell: (e) => compactTitle(e, now) },
      ...badge,
    ];
  return [
    { key: 'title', header: '单据', minWidth: 240, cell: (e) => e.title },
    { key: 'process', header: '流程', width: 120 },
    ...(headers.step ? [{ key: 'step', header: headers.step, minWidth: 140 }] : []),
    { key: 'at', header: headers.at, width: 170, type: 'dateTime' as const },
    ...badge,
  ];
}

export default _component(() => {
  const center = useFlowCenter();
  const route = useRoute();
  const router = useRouter();
  let entries = _state.raw<Entry[] | null>(null);
  let checked = _state<string[]>([]);
  let busy = _state(false);
  let text = _state('');
  let process = _state<string | null>(null);
  // 窄屏（手机）：表格只留标题与标记两列
  const compact = useMediaQuery(breakpoints.sm.replace('@media ', 'not all and '));
  const counts = useBoxCounts(() => center);

  const box = () => boxOf(route.query['box']);
  const opened = () => ({
    instance: Number(route.query['instance']) || null,
    item: Number(route.query['item']) || null,
  });
  // 列表是异步取的：取完时人可能已经要去别的页面了（导航开始了、页面还在懒加载），这时再改地址会取消那次导航、
  // 把人拽回工作台。所以导航一开始（beforeEach）就记下要离开，之后不再改地址
  const path = route.path;
  let leaving = false;
  onScopeDispose(router.beforeEach((to) => void (leaving = to.path !== path)));
  onScopeDispose(() => (leaving = true));
  const open = (entry: Entry | undefined) => {
    if (leaving) return;
    if (entry?.href) return void router.push(entry.href);
    void router.replace({ path, query: entryQuery(box(), entry) });
  };

  const isOpened = (entry: Entry) => {
    const current = opened();
    return entry.instance === current.instance && entry.workItem === current.item;
  };
  /** 筛过的行（抽屉里的上一条、下一条也按它） */
  const rows = () => {
    const keyword = text.trim();
    return (entries ?? []).filter(
      (e) => (!keyword || e.title.includes(keyword)) && (!process || e.process === process),
    );
  };
  /** 打开的那条在列表里的位置：处理完它离开了列表时，换到同一位置的下一条 */
  let openedAt = -1;

  // 换格子：清掉勾选与筛选
  watch(box, () => {
    checked = [];
    text = '';
    process = null;
  });

  watch(
    () => [box(), center.state.revision, center.state.actor] as const,
    async ([which]) => {
      entries = await loadBox(center, which);
      checked = checked.filter((key) => entries!.some((e) => e.key === key));
      if (!opened().instance || rows().some(isOpened)) return;
      // 打开的那条不在列表里了（处理完了、换了身份）：换到下一条，格子空了就收起
      const list = rows();
      open(list[Math.min(Math.max(openedAt, 0), list.length - 1)]);
    },
    { immediate: true },
  );

  /** 换一条：step 是 +1（下一条）或 -1 */
  function move(step: number) {
    const list = rows().filter((e) => !e.href);
    if (list.length === 0 || !opened().instance) return;
    const at = list.findIndex(isOpened);
    open(list[Math.min(list.length - 1, Math.max(0, at + step))]);
  }

  useHotkeys(() => ({ J: () => move(1), K: () => move(-1) }));

  /** 勾上的待办一起同意：每条一个事务，各自成败；没办成的留着勾上，写出原因 */
  async function approveChecked() {
    const targets = (entries ?? []).filter((e) => checked.includes(e.key) && e.quickOutcome);
    if (targets.length === 0) return;
    busy = true;
    try {
      const results = await center.client.runMany(
        targets.map((e) => ({ type: 'complete', workItem: e.workItem!, outcome: e.quickOutcome! })),
      );
      const failed = targets.flatMap((e, index) => {
        const result = results[index]!;
        return result.ok ? [] : [{ entry: e, message: result.message }];
      });
      const done = targets.length - failed.length;
      if (done > 0) toaster.success(`同意了 ${done} 条`);
      if (failed.length > 0)
        toaster.show({
          tone: 'warning',
          title: `${failed.length} 条没办成，留在列表里`,
          description: failed.map((f) => `${f.entry.title}：${f.message}`).join('；'),
        });
      checked = failed.map((f) => f.entry.key);
    } catch (error) {
      showError(error);
    } finally {
      busy = false;
    }
  }

  async function readChecked() {
    const targets = (entries ?? []).filter((e) => checked.includes(e.key));
    busy = true;
    try {
      await Promise.all(targets.map((e) => center.client.readCc(e.instance)));
      checked = [];
    } catch (error) {
      showError(error);
    } finally {
      busy = false;
    }
  }

  function renderBatch(which: Box) {
    if (which === 'todo')
      return (
        <Button size="sm" loading={busy} onClick={() => void approveChecked()}>
          同意
        </Button>
      );
    return (
      <Button
        size="sm"
        variant="outline"
        tone="neutral"
        loading={busy}
        onClick={() => void readChecked()}
      >
        标为已读
      </Button>
    );
  }

  function renderDrawer(list: Entry[], label: string) {
    const current = opened();
    const openable = list.filter((e) => !e.href);
    const at = openable.findIndex(isOpened);
    if (at >= 0) openedAt = at;
    return (
      <Drawer
        _open={current.instance !== null}
        onUpdate:_open={(value: boolean) => !value && open(undefined)}
        size="lg"
        // 审批单自己有标题：抽屉的标题写在看哪个格子的第几条
        title={at >= 0 ? `${label} · 第 ${at + 1} / ${openable.length} 条` : label}
      >
        <div {...css.attrs(styles.nav)}>
          <IconButton
            size="sm"
            variant="ghost"
            tone="neutral"
            icon={ChevronUp}
            aria-label="上一条（K）"
            disabled={at <= 0}
            onClick={() => move(-1)}
          />
          <IconButton
            size="sm"
            variant="ghost"
            tone="neutral"
            icon={ChevronDown}
            aria-label="下一条（J）"
            disabled={at < 0 || at >= openable.length - 1}
            onClick={() => move(1)}
          />
          {openable.length > 1 && (
            <Small tone="muted" sx={styles.hint}>
              <Kbd>J</Kbd> <Kbd>K</Kbd> 换一条
            </Small>
          )}
        </div>
        {current.instance !== null && (
          <ApprovalPanel
            key={`${current.instance}-${current.item ?? ''}`}
            instance={current.instance}
            workItem={current.item}
          />
        )}
      </Drawer>
    );
  }

  return () => {
    const which = box();
    const list = rows();
    const label = BOXES.find((b) => b.value === which)!.label;
    const processes = [...new Set((entries ?? []).map((e) => e.process))];
    const batchable = which === 'todo' || which === 'cc';
    return (
      <div {...css.attrs(styles.page)}>
        <div {...css.attrs(styles.filters)}>
          <Tabs
            _value={which}
            onUpdate:_value={(value: string) =>
              void router.replace({ path, query: { box: value } })
            }
          >
            <TabList aria-label="工作台">
              {BOXES.map((b) => (
                <Tab key={b.value} value={b.value}>
                  {b.label}
                  {counts.value[b.value] ? (
                    <Badge tone={b.value === 'todo' ? 'danger' : 'accent'}>
                      {counts.value[b.value]}
                    </Badge>
                  ) : null}
                </Tab>
              ))}
            </TabList>
          </Tabs>
          <TextField
            _value={text}
            placeholder="按标题找"
            clearable
            aria-label="关键字"
            sx={styles.search}
          />
          <Select
            items={processes.map((p) => ({ value: p, label: p }))}
            _value={process}
            placeholder="全部流程"
            clearable
            aria-label="流程"
            sx={styles.process}
          />
          <Small tone="muted">共 {list.length} 条</Small>
        </div>
        {batchable && (
          <SelectionBar count={checked.length} onClear={() => (checked = [])}>
            {renderBatch(which)}
          </SelectionBar>
        )}
        <DataTable
          rows={list}
          columns={columnsOf(which, compact.value, center.state.now)}
          getKey={(e) => e.key}
          loading={entries === null}
          aria-label={label}
          empty={
            <Empty title="这里是空的" description={which === 'todo' ? '没有要处理的' : undefined} />
          }
          onRowClick={(e) => open(e)}
          activeKey={list.find(isOpened)?.key ?? null}
          {...(batchable
            ? {
                selectionMode: 'multiple' as const,
                _selected: checked,
                'onUpdate:_selected': (keys: string[]) => (checked = keys),
                ...(which === 'todo' ? { isRowSelectable: (e: Entry) => !!e.quickOutcome } : {}),
              }
            : {})}
          propsRoot={{ sx: styles.table }}
        />
        {renderDrawer(list, label)}
      </div>
    );
  };
});
