/**
 * 工作台（docs/decisions/0009 第 4 节）：左边是列表——待办、已办、抄送我的、我发起的、草稿，右边是选中的审批单，像邮件一样不用来回换页。
 * 待办里超时、快到期的排前面并标出来；处理完一条自动换到下一条；数据变了（别人处理了、作业跑了）列表自己刷新。
 * 选中的格子与单子记在地址栏里（box、instance、item），刷新、分享链接都还在。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { CcItem, InstanceRow, TodoItem } from '@zerodep-dev/flow-ts-engine';
import {
  Badge,
  Card,
  Empty,
  ItemList,
  ItemListItem,
  SkeletonText,
  Tab,
  TabList,
  Tabs,
  type StatusTone,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { processOf } from '../processes';
import { ApprovalPanel } from '../parts/ApprovalPanel';
import { STATUS, timeText, who } from '../parts/labels';
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

  const box = () =>
    (BOXES.some((b) => b.value === route.query['box']) ? route.query['box'] : 'todo') as Box;
  const selected = () => ({
    instance: Number(route.query['instance']) || null,
    item: Number(route.query['item']) || null,
  });
  const select = (entry: Entry | undefined) =>
    void router.replace({
      query: {
        box: box(),
        ...(entry ? { instance: String(entry.instance) } : {}),
        ...(entry?.workItem ? { item: String(entry.workItem) } : {}),
      },
    });

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
      // 选中的不在列表里了（处理完了、换了身份）：换到第一条
      const current = selected();
      const still = entries.some(
        (e) => e.instance === current.instance && (e.workItem ?? null) === (current.item ?? null),
      );
      if (!still && which !== 'drafts') select(entries[0]);
    },
    { immediate: true },
  );

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
          {!list ? (
            <SkeletonText lines={5} />
          ) : list.length === 0 ? (
            <Empty title="这里是空的" description={box() === 'todo' ? '没有要处理的' : undefined} />
          ) : (
            <ItemList aria-label={BOXES.find((b) => b.value === box())!.label}>
              {list.map((entry) => (
                <ItemListItem
                  key={entry.key}
                  title={entry.title}
                  description={entry.description}
                  end={entry.badge && <Badge tone={entry.badge.tone}>{entry.badge.label}</Badge>}
                  {...(entry.href
                    ? { href: entry.href }
                    : {
                        selected:
                          entry.instance === current.instance && entry.workItem === current.item,
                        onSelect: () => select(entry),
                      })}
                />
              ))}
            </ItemList>
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
