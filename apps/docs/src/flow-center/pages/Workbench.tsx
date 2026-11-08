/**
 * 工作台（docs/decisions/0009 第 4 节）：左边是列表——待办、已办、抄送我的、我发起的、草稿，右边是选中的审批单，像邮件一样不用来回换页。
 * 待办里超时、快到期的排前面并标出来；处理完一条自动换到下一条；数据变了（别人处理了、作业跑了）列表自己刷新。
 * 批量：勾几条待办一起同意（各用节点上不要求写意见的同意结果），逐条给出结果，没办成的留着并写出原因。
 * 键盘：J / K（焦点在列表里时也可以 ↑ ↓）换一条，回车去处理（焦点到第一个结果按钮），X 勾选。
 * 选中的格子与单子记在地址栏里（box、instance、item），刷新、分享链接都还在。
 */
import { Square, SquareCheck } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { CcItem, InstanceRow, TodoItem } from '@zerodep-dev/flow-ts-engine';
import {
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Icon,
  ItemList,
  ItemListItem,
  Kbd,
  SkeletonText,
  Small,
  Tab,
  TabList,
  Tabs,
  toElement,
  useHotkeys,
  type StatusTone,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { onScopeDispose, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { processOf } from '../processes';
import { ApprovalPanel } from '../parts/ApprovalPanel';
import { STATUS, timeText, who } from '../parts/labels';
import { showError, toaster } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';

/** 左边的几个格子 */
type Box = 'todo' | 'done' | 'cc' | 'started' | 'drafts';
const BOXES: readonly { value: Box; label: string }[] = [
  { value: 'todo', label: '待办' },
  { value: 'done', label: '已办' },
  { value: 'cc', label: '抄送我的' },
  { value: 'started', label: '我发起的' },
  { value: 'drafts', label: '草稿' },
];

/** 列表里的一行（几种格子统一成它） */
interface Entry {
  key: string;
  instance: number;
  workItem: number | null;
  title: string;
  description: string;
  badge?: { label: string; tone: StatusTone };
  /** 草稿：点了去发起页接着填 */
  href?: string;
  /** 待办能批量同意时用的结果 */
  quickOutcome?: string;
}

const styles = css.create({
  layout: {
    display: 'grid',
    gap: '_lg',
    containerType: 'inline-size',
    gridTemplateColumns: { default: '1fr', '@media (min-width: 64rem)': '22rem minmax(0, 1fr)' },
    alignItems: 'start',
  },
  list: { position: { default: 'static', '@media (min-width: 64rem)': 'sticky' }, top: '4.5rem' },
  bar: { paddingBlock: '_sm', paddingInline: '_xs' },
});

const processName = (key: string) => processOf(key)?.definition.name ?? key;

/** 待办的排序：超时的、快到期的在前，再按到达的先后（新的在前） */
function urgency(item: TodoItem, now: Date): number {
  if (!item.dueAt) return Number.MAX_SAFE_INTEGER;
  return new Date(item.dueAt).getTime() - now.getTime();
}

function deadline(item: TodoItem, now: Date): Entry['badge'] {
  if (!item.dueAt)
    return item.assignment === 'pool' ? { label: '收件箱', tone: 'neutral' } : undefined;
  const left = new Date(item.dueAt).getTime() - now.getTime();
  if (left < 0) return { label: '已超时', tone: 'danger' };
  if (left < 24 * 3_600_000) return { label: '今天到期', tone: 'warning' };
  return { label: `${timeText(item.dueAt, now)} 到期`, tone: 'neutral' };
}

export default _component(() => {
  const center = useFlowCenter();
  const route = useRoute();
  const router = useRouter();
  let entries = _state.raw<Entry[] | null>(null);
  /** 批量模式与勾上的条目（Entry.key） */
  let batch = _state(false);
  let checked = _state<string[]>([]);
  let approving = _state(false);
  // 存成响应式的：挂载后列表里的方向键才绑得上
  let listElement = _state.raw<HTMLElement | null>(null);

  const box = () =>
    (BOXES.some((b) => b.value === route.query['box']) ? route.query['box'] : 'todo') as Box;
  const selected = () => ({
    instance: Number(route.query['instance']) || null,
    item: Number(route.query['item']) || null,
  });
  // 列表是异步取的：取完时人可能已经要去别的页面了（导航开始了、页面还在懒加载），这时再改地址会取消那次导航、
  // 把人拽回工作台。所以导航一开始（beforeEach）就记下要离开，之后不再改地址
  const path = route.path;
  let leaving = false;
  onScopeDispose(router.beforeEach((to) => void (leaving = to.path !== path)));
  onScopeDispose(() => (leaving = true));
  const select = (entry: Entry | undefined) => {
    if (leaving) return;
    void router.replace({
      path,
      query: {
        box: box(),
        ...(entry ? { instance: String(entry.instance) } : {}),
        ...(entry?.workItem ? { item: String(entry.workItem) } : {}),
      },
    });
  };

  async function load(which: Box): Promise<Entry[]> {
    const now = center.state.now;
    const { client } = center;
    switch (which) {
      case 'todo':
        return (await client.todo())
          .sort(
            (a, b) =>
              urgency(a, now) - urgency(b, now) || +new Date(b.createdAt) - +new Date(a.createdAt),
          )
          .map((t) => ({
            key: `w${t.id}`,
            instance: t.instanceId,
            workItem: t.id,
            title: t.title ?? processName(t.processKey),
            description: `${t.nodeName} · ${timeText(t.createdAt, now)} 到达`,
            ...withBadge(deadline(t, now)),
            ...(t.quickOutcome ? { quickOutcome: t.quickOutcome } : {}),
          }));
      case 'done':
        return (await client.done()).map((t) => ({
          key: `w${t.id}`,
          instance: t.instanceId,
          workItem: t.id,
          title: t.title ?? processName(t.processKey),
          description: `${t.nodeName} · ${timeText(t.completedAt, now)} 处理`,
          badge: STATUS[t.instanceStatus],
        }));
      case 'cc':
        return (await client.cc()).map((c: CcItem) => ({
          key: `c${c.id}`,
          instance: c.instanceId,
          workItem: null,
          title: c.title ?? processName(c.processKey),
          description: `${c.sender ? `${who(c.sender)}抄送` : '流程抄送'} · ${timeText(c.at, now)}`,
          ...(c.readAt ? {} : { badge: { label: '未读', tone: 'accent' as const } }),
        }));
      case 'started':
        return (await client.started()).map((i: InstanceRow) => ({
          key: `i${i.id}`,
          instance: i.id,
          workItem: null,
          title: i.title ?? processName(i.processKey),
          description: `${processName(i.processKey)} · ${timeText(i.startedAt, now)} 发起`,
          badge: STATUS[i.status],
        }));
      case 'drafts':
        return (await client.drafts.list()).map((d: InstanceRow) => ({
          key: `d${d.id}`,
          instance: d.id,
          workItem: null,
          title: processName(d.processKey),
          description: `${timeText(d.startedAt, now)} 存的草稿`,
          href: `/flow/start/${d.processKey}?draft=${d.id}`,
        }));
    }
  }

  watch(
    () => [box(), center.state.revision, center.state.actor] as const,
    async ([which]) => {
      entries = await load(which);
      checked = checked.filter((key) => entries!.some((e) => e.key === key));
      if (which !== 'todo') batch = false;
      // 选中的不在列表里了（处理完了、换了身份）：换到第一条
      const current = selected();
      const still = entries.some(
        (e) => e.instance === current.instance && (e.workItem ?? null) === (current.item ?? null),
      );
      if (!still && which !== 'drafts') select(entries[0]);
    },
    { immediate: true },
  );

  const isCurrent = (entry: Entry) => {
    const current = selected();
    return entry.instance === current.instance && entry.workItem === current.item;
  };

  /** 键盘换一条：step 是 +1（下一条）或 -1 */
  function move(step: number) {
    const list = (entries ?? []).filter((e) => !e.href);
    if (list.length === 0) return;
    const at = list.findIndex(isCurrent);
    select(list[Math.min(list.length - 1, Math.max(0, at + step))]);
  }

  function toggle(entry: Entry) {
    if (!entry.quickOutcome) return;
    checked = checked.includes(entry.key)
      ? checked.filter((key) => key !== entry.key)
      : [...checked, entry.key];
  }

  /** 去处理：焦点到审批单的第一个结果按钮（没有能做的就不动） */
  function focusHandling() {
    document.querySelector<HTMLElement>('[data-flow-outcomes] button')?.focus();
  }

  useHotkeys(() => ({
    J: () => move(1),
    K: () => move(-1),
    X: () => {
      const entry = entries?.find(isCurrent);
      if (batch && entry) toggle(entry);
    },
  }));
  useHotkeys(
    () => ({
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Enter: focusHandling,
    }),
    { target: () => listElement },
  );

  /** 勾上的待办一起同意：每条一个事务，各自成败；没办成的留着勾上，写出原因 */
  async function approveChecked() {
    const targets = (entries ?? []).filter((e) => checked.includes(e.key) && e.quickOutcome);
    if (targets.length === 0) return;
    approving = true;
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
      approving = false;
    }
  }

  function renderBatchBar(list: Entry[]) {
    const quick = list.filter((e) => e.quickOutcome);
    if (box() !== 'todo' || quick.length === 0) return null;
    if (!batch)
      return (
        <Flex justify="end" sx={styles.bar}>
          <Button
            size="sm"
            variant="ghost"
            tone="neutral"
            icon={SquareCheck}
            onClick={() => (batch = true)}
          >
            批量处理
          </Button>
        </Flex>
      );
    const all = quick.every((e) => checked.includes(e.key));
    return (
      <Flex gap="xs" align="center" wrap sx={styles.bar}>
        <Button
          size="sm"
          variant="ghost"
          tone="neutral"
          onClick={() => (checked = all ? [] : quick.map((e) => e.key))}
        >
          {all ? '全不选' : '全选'}
        </Button>
        <Button
          size="sm"
          loading={approving}
          disabled={checked.length === 0}
          onClick={() => void approveChecked()}
        >
          同意{checked.length > 0 ? `（${checked.length}）` : ''}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          tone="neutral"
          onClick={() => {
            batch = false;
            checked = [];
          }}
        >
          取消
        </Button>
      </Flex>
    );
  }

  return () => {
    const list = entries;
    const current = selected();
    return (
      <div {...css.attrs(styles.layout)}>
        <Card padding="sm" sx={styles.list}>
          <Tabs
            _value={box()}
            onUpdate:_value={(value: string) => void router.replace({ query: { box: value } })}
          >
            <TabList aria-label="工作台">
              {BOXES.map((b) => (
                <Tab key={b.value} value={b.value}>
                  {b.label}
                </Tab>
              ))}
            </TabList>
          </Tabs>
          {list && renderBatchBar(list)}
          {!list ? (
            <SkeletonText lines={5} />
          ) : list.length === 0 ? (
            <Empty title="这里是空的" description={box() === 'todo' ? '没有要处理的' : undefined} />
          ) : (
            <div ref={(value: unknown) => (listElement = toElement(value))}>
              <ItemList aria-label={BOXES.find((b) => b.value === box())!.label}>
                {list.map((entry) => (
                  <ItemListItem
                    key={entry.key}
                    title={entry.title}
                    description={entry.description}
                    start={
                      batch &&
                      entry.quickOutcome && (
                        <Icon
                          icon={checked.includes(entry.key) ? SquareCheck : Square}
                          tone={checked.includes(entry.key) ? 'accent' : 'muted'}
                        />
                      )
                    }
                    end={entry.badge && <Badge tone={entry.badge.tone}>{entry.badge.label}</Badge>}
                    {...(entry.href
                      ? { href: entry.href }
                      : {
                          selected: isCurrent(entry),
                          // 批量模式下点一条是勾选它（不能批量的照常打开）
                          onSelect: () =>
                            batch && entry.quickOutcome ? toggle(entry) : select(entry),
                        })}
                  />
                ))}
              </ItemList>
            </div>
          )}
          {list && list.length > 0 && (
            <Small tone="muted" sx={styles.bar}>
              <Kbd>J</Kbd> <Kbd>K</Kbd> 换一条，<Kbd>Enter</Kbd> 去处理
              {batch && (
                <>
                  ，<Kbd>X</Kbd> 勾选
                </>
              )}
            </Small>
          )}
        </Card>
        <div>
          {current.instance ? (
            <ApprovalPanel
              key={`${current.instance}-${current.item ?? ''}`}
              instance={current.instance}
              workItem={current.item}
            />
          ) : (
            <Empty title="选一张单" description="左边点一条，在这里看、处理。" />
          )}
        </div>
      </div>
    );
  };
});

/** 有角标时才带上 */
const withBadge = (badge: Entry['badge']) => (badge ? { badge } : {});
