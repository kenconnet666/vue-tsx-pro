/**
 * 工作台的几个格子——待办、已办、抄送我的、我发起的、草稿（docs/decisions/0009 第 4 节）：顶栏的一排页签（NavBar），
 * 带待办数、未读抄送数；选中的格子在工作台上列成表格。这里是格子的定义、取列表（几种格子统一成 Entry）与页签。
 * 待办里超时、快到期的排前面并标出来。
 */
import type { CcItem, InstanceRow, TodoItem } from '@zerodep-dev/flow-ts-engine';
import type { NavBarItem, StatusTone } from '@zerodep-dev/vue-tsx-pro-ui';
import { processOf } from '../processes';
import type { FlowCenter } from '../runtime/center';
import { STATUS, timeText, who } from './labels';

export type Box = 'todo' | 'done' | 'cc' | 'started' | 'drafts';
export const BOXES: readonly { value: Box; label: string }[] = [
  { value: 'todo', label: '待办' },
  { value: 'done', label: '已办' },
  { value: 'cc', label: '抄送我的' },
  { value: 'started', label: '我发起的' },
  { value: 'drafts', label: '草稿' },
];

export const WORK_PATH = '/flow/work';

/** 地址栏里的格子（不认识的当待办） */
export const boxOf = (value: unknown): Box =>
  BOXES.some((b) => b.value === value) ? (value as Box) : 'todo';

/** 列表里的一行（几种格子统一成它） */
export interface Entry {
  key: string;
  instance: number;
  workItem: number | null;
  title: string;
  /** 流程的名字 */
  process: string;
  /** 环节（待办、已办）、谁抄送的（抄送）、现在到哪（我发起的） */
  step: string;
  /** 到达、处理、抄送、发起、保存的时间 */
  at: Date;
  badge?: { label: string; tone: StatusTone };
  /** 草稿：点了去发起页接着填 */
  href?: string;
  /** 待办能批量同意时用的结果 */
  quickOutcome?: string;
}

/** 工作台上看这一条的地址 */
export const entryQuery = (box: Box, entry: Entry | undefined) => ({
  box,
  ...(entry ? { instance: String(entry.instance) } : {}),
  ...(entry?.workItem ? { item: String(entry.workItem) } : {}),
});

const processName = (key: string) => processOf(key)?.definition.name ?? key;

/** 节点编号写成名字（按流程现在的定义） */
const nodeName = (row: InstanceRow, node: string) =>
  processOf(row.processKey)?.definition.nodes.find((n) => n.id === node)?.name ?? node;

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

/** 有角标时才带上 */
const withBadge = (badge: Entry['badge']) => (badge ? { badge } : {});

/** 取一个格子的列表 */
export async function loadBox(center: FlowCenter, which: Box): Promise<Entry[]> {
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
          process: processName(t.processKey),
          step: t.nodeName,
          at: new Date(t.createdAt),
          ...withBadge(deadline(t, now)),
          ...(t.quickOutcome ? { quickOutcome: t.quickOutcome } : {}),
        }));
    case 'done':
      return (await client.done()).map((t) => ({
        key: `w${t.id}`,
        instance: t.instanceId,
        workItem: t.id,
        title: t.title ?? processName(t.processKey),
        process: processName(t.processKey),
        step: t.nodeName,
        at: new Date(t.completedAt ?? t.createdAt),
        badge: STATUS[t.instanceStatus],
      }));
    case 'cc':
      return (await client.cc()).map((c: CcItem) => ({
        key: `c${c.id}`,
        instance: c.instanceId,
        workItem: null,
        title: c.title ?? processName(c.processKey),
        process: processName(c.processKey),
        step: c.sender ? who(c.sender) : '流程抄送',
        at: new Date(c.at),
        ...(c.readAt ? {} : { badge: { label: '未读', tone: 'accent' as const } }),
      }));
    case 'started':
      return (await client.started()).map((i: InstanceRow) => ({
        key: `i${i.id}`,
        instance: i.id,
        workItem: null,
        title: i.title ?? processName(i.processKey),
        process: processName(i.processKey),
        step: i.current.map((node) => nodeName(i, node)).join('、') || '—',
        at: new Date(i.startedAt),
        badge: STATUS[i.status],
      }));
    case 'drafts':
      return (await client.drafts.list()).map((d: InstanceRow) => ({
        key: `d${d.id}`,
        instance: d.id,
        workItem: null,
        title: processName(d.processKey),
        process: processName(d.processKey),
        step: '草稿',
        at: new Date(d.startedAt),
        href: `/flow/start/${d.processKey}?draft=${d.id}`,
      }));
  }
}

/** 顶栏的几个页签：计数（待办数、未读抄送数）由外壳取好传进来；current 是工作台上选中的格子 */
export function workBoxItems(
  current: Box | null,
  counts: Partial<Record<Box, number>>,
): NavBarItem[] {
  return BOXES.map((b) => ({
    label: b.label,
    href: `${WORK_PATH}?box=${b.value}`,
    badge: counts[b.value] ?? 0,
    current: current === b.value,
  }));
}
