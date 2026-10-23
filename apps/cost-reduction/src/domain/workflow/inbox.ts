/**
 * 收件箱的页签（DESIGN.md §6.2）：我的待办（认领的、指定给我的、流程直接给我的）、岗位待认领（我在的收件箱里没人认领的，
 * 我退回过的不再出现）、待指定（我负责的收件箱里没人认领超时的、有人申请改派的）、我已处理、我发起的（还在流转的）
 */

import type { ProcessInstance, WorkItem } from '@vue-tsx-pro/ui/workflow';

/** 收件箱的页签 */
export interface InboxViews {
  /** 我的待办 */
  mine: unknown;
  /** 岗位待认领 */
  pool: unknown;
  /** 待指定（岗位负责人） */
  designate: unknown;
  /** 我已处理 */
  done: unknown;
  /** 我发起的 */
  started: unknown;
}

/** 收件箱的页签 */
export type InboxView = keyof InboxViews;

/** 收件箱页签的先后 */
export const inboxViews: readonly InboxView[] = ['mine', 'pool', 'designate', 'done', 'started'];

/** 看收件箱的人：工号、所在的收件箱、负责的收件箱 */
export interface InboxViewer {
  /** 工号 */
  user: string;
  /** 所在的收件箱 */
  groups: readonly string[];
  /** 负责的收件箱 */
  leads: readonly string[];
}

/** 一个页签里的待办：待处理的按到达先后（早到的在前），已处理的按处理时间（新的在前） */
export function inboxItems(
  items: readonly WorkItem[],
  instances: readonly ProcessInstance[],
  viewer: InboxViewer,
  view: InboxView,
): WorkItem[] {
  const open = items.filter((item) => item.state === 'open');
  const byArrival = (list: WorkItem[]) =>
    list.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt));
  switch (view) {
    case 'mine':
      return byArrival(open.filter((item) => item.assignee === viewer.user));
    case 'pool':
      return byArrival(
        open.filter(
          (item) =>
            item.assignment === 'pool' &&
            item.pool != null &&
            viewer.groups.includes(item.pool) &&
            !item.releasedBy.includes(viewer.user),
        ),
      );
    case 'designate':
      return byArrival(
        open.filter(
          (item) =>
            item.pool != null &&
            viewer.leads.includes(item.pool) &&
            (item.needsDesignation || item.reassignRequest != null),
        ),
      );
    case 'done':
      return items
        .filter((item) => item.completion?.by === viewer.user)
        .toSorted((a, b) => b.completion!.at.localeCompare(a.completion!.at));
    case 'started': {
      const mine = new Set(
        instances
          .filter((instance) => instance.startedBy === viewer.user && instance.status === 'active')
          .map((instance) => instance.id),
      );
      return byArrival(open.filter((item) => mine.has(item.instanceId)));
    }
  }
}
