/**
 * 计划调整（DESIGN.md §3.5）：方案调整、延期须经 PEMO 同意，不得自行改日期。主办提交调整申请（计划完成、主办、原因），
 * 走 task-change 流程由 PEMO 审批；同意后写回任务卡并记一条变更记录，不同意或撤回时申请作废
 */
import { isFinished } from './status';
import type { CostTask, PendingPlanChange, PlanChange, TaskChangeRecord } from './types';

/** 现在能不能提交计划调整：已经结束、已有一项在审批中时返回说明 */
export function planChangeBlocked(task: CostTask): string | null {
  if (isFinished(task)) return `${task.code} 已经结束，不能再调整计划`;
  if (task.pendingChange) return '已有一项计划调整在审批中，等 PEMO 处理完再提交';
  return null;
}

/** 提交前的检查（前后端同一条规则）：返回说明时不能提交 */
export function planChangeProblem(task: CostTask, change: PlanChange): string | null {
  const blocked = planChangeBlocked(task);
  if (blocked) return blocked;
  if (!change.due || !change.owner) return '计划完成与主办都要填';
  if (change.due === task.due && change.owner === task.owner) return '计划完成和主办都没有变';
  if (!change.reason.trim()) return '写明调整的原因';
  return null;
}

/** 申请改了哪几项：没改的为 null */
export const changedValues = (task: Pick<CostTask, 'due' | 'owner'>, change: PlanChange) => ({
  due: change.due === task.due ? null : { before: task.due, after: change.due },
  owner: change.owner === task.owner ? null : { before: task.owner, after: change.owner },
});

/** PEMO 同意：调整写回任务卡，记一条变更记录（新的在前），审批中的申请清掉 */
export function applyPlanChange(
  task: CostTask,
  change: PendingPlanChange,
  approval: { at: string; approvedBy: string },
): CostTask {
  const record: TaskChangeRecord = {
    at: approval.at,
    by: change.by,
    approvedBy: approval.approvedBy,
    reason: change.reason,
    ...changedValues(task, change),
  };
  return {
    ...task,
    due: change.due,
    owner: change.owner,
    pendingChange: null,
    changes: [record, ...task.changes],
  };
}

/** 一项改动的写法：“2026-12-31 → 2027-03-31”；name 把值换成显示的名称（工号换姓名） */
export const changeText = (
  value: { before: string; after: string },
  name: (value: string) => string = (text) => text,
) => `${name(value.before)} → ${name(value.after)}`;
