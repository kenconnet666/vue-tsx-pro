/**
 * 通知（DESIGN.md §6.14）：从流转模拟的状态按人推出来，不单独存；只存谁读过哪几条。
 * 新到的待办（到我或我所在的岗位收件箱）、被退回、被提级、催办、超时、待指定（岗位负责人）；
 * 近 14 天的，新的在前。后端引擎接上后由它在流转时写通知，接口的形状不变
 */
import { shiftIsoDate } from '@vue-tsx-pro/ui';

import type { ProcessInstance, WorkflowEvent, WorkItem } from '@vue-tsx-pro/ui/workflow';
import type { InboxView, InboxViewer } from './inbox';

/** 通知的类型（通知中心的筛选按钮） */
export const notificationTypes = [
  { key: 'todo', label: '待办' },
  { key: 'returned', label: '退回' },
  { key: 'escalated', label: '提级' },
  { key: 'remind', label: '催办' },
  { key: 'overdue', label: '超时' },
  { key: 'designate', label: '待指定' },
] as const;

/** 通知的类型 */
export type NotificationType = (typeof notificationTypes)[number]['key'];

/** 一条通知 */
export interface WorkflowNotification {
  /** 标识：同一件事每次推出来都一样（记已读靠它） */
  id: string;
  /** 类型 */
  type: NotificationType;
  /** 标题 */
  title: string;
  /** 补充：卡的编号与标题、催办的话 */
  description: string;
  /** 时间（ISO） */
  time: string;
  /** 色调：超时、催办是 danger，退回、提级、待指定是 warning */
  tone: 'accent' | 'warning' | 'danger';
  /** 相关的待办（点了去收件箱里的这一条） */
  workItem: string;
  /** 这一条在收件箱的哪个页签里 */
  view: InboxView;
  /** 读过了 */
  read: boolean;
}

/** 流转模拟的状态里要用到的 */
interface WorkflowTables {
  instances: readonly ProcessInstance[];
  items: readonly WorkItem[];
  events: readonly WorkflowEvent[];
}

/** 看多久以内的 */
const DAYS = 14;
/** 最多几条 */
const LIMIT = 50;

/** 一个人的通知：read 是他读过的通知标识 */
export function notificationsFor(
  { items, events }: WorkflowTables,
  viewer: InboxViewer,
  options: { today: string; read: ReadonlySet<string>; poolName: (pool: string) => string },
): WorkflowNotification[] {
  const since = shiftIsoDate(options.today, { days: -DAYS });
  const about = (item: WorkItem) => `${item.businessKey} · ${item.title}`;
  const mine = (item: WorkItem) =>
    item.assignee === viewer.user || (item.pool != null && viewer.groups.includes(item.pool));
  /** 这条待办现在在哪个页签：还开着的看在谁手上，处理过的看是不是我处理的 */
  const viewOf = (item: WorkItem): InboxView =>
    item.state === 'open'
      ? item.assignee === viewer.user
        ? 'mine'
        : 'pool'
      : item.completion?.by === viewer.user
        ? 'done'
        : 'mine';
  const list: Omit<WorkflowNotification, 'read'>[] = [];

  for (const item of items) {
    if (item.createdAt < since || !mine(item)) continue;
    const toPool = item.assignment === 'pool' && item.pool != null;
    list.push(
      item.arrival === 'return'
        ? {
            id: `arrive:${item.id}`,
            type: 'returned',
            title: `被退回：${item.name}`,
            description: about(item),
            time: item.createdAt,
            tone: 'warning',
            workItem: item.id,
            view: viewOf(item),
          }
        : item.arrival === 'escalate'
          ? {
              id: `arrive:${item.id}`,
              type: 'escalated',
              title: `提级到${options.poolName(item.pool ?? '')}：${item.name}`,
              description: about(item),
              time: item.createdAt,
              tone: 'warning',
              workItem: item.id,
              view: viewOf(item),
            }
          : {
              id: `arrive:${item.id}`,
              type: 'todo',
              title: toPool
                ? `${options.poolName(item.pool!)}收件箱有新的待办：${item.name}`
                : `新的待办：${item.name}`,
              description: about(item),
              time: item.createdAt,
              tone: 'accent',
              workItem: item.id,
              view: viewOf(item),
            },
    );
    // 超时：还在我手上、过了截止日
    if (
      item.state === 'open' &&
      item.assignee === viewer.user &&
      item.dueOn &&
      item.dueOn < options.today
    )
      list.push({
        id: `overdue:${item.id}`,
        type: 'overdue',
        title: `超时：${item.name}`,
        description: `${about(item)} · 截止 ${item.dueOn}`,
        time: `${shiftIsoDate(item.dueOn, { days: 1 })}T09:00:00`,
        tone: 'danger',
        workItem: item.id,
        view: 'mine',
      });
  }

  // 待指定：我负责的收件箱里没人认领超时的、有人申请改派的
  for (const item of items) {
    if (item.state !== 'open' || item.pool == null || !viewer.leads.includes(item.pool)) continue;
    if (!item.needsDesignation && !item.reassignRequest) continue;
    list.push({
      id: `designate:${item.id}:${item.reassignRequest ? item.reassignRequest.at : 'unclaimed'}`,
      type: 'designate',
      title: item.reassignRequest
        ? `申请改派，待指定承办人：${item.name}`
        : `没人认领，待指定承办人：${item.name}`,
      description: item.reassignRequest
        ? `${about(item)} · ${item.reassignRequest.reason}`
        : about(item),
      time: item.reassignRequest?.at ?? item.createdAt,
      tone: 'warning',
      workItem: item.id,
      view: 'designate',
    });
  }

  // 催办：催的是我手上或我岗位里还开着的待办
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const event of events) {
    if (event.type !== 'reminded' || event.at < since || !event.workItem) continue;
    const item = byId.get(event.workItem);
    if (!item || item.state !== 'open' || !mine(item)) continue;
    list.push({
      id: `remind:${event.id}`,
      type: 'remind',
      title: `催办：${item.name}`,
      description: event.comment ? `${about(item)} · ${event.comment}` : about(item),
      time: event.at,
      tone: 'danger',
      workItem: item.id,
      view: viewOf(item),
    });
  }

  return list
    .toSorted((a, b) => b.time.localeCompare(a.time))
    .slice(0, LIMIT)
    .map((notice) => ({ ...notice, read: options.read.has(notice.id) }));
}
