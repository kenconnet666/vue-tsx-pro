/**
 * 任务卡的推进：下一步做什么（详情页的“下一步”按钮）、步骤条停在哪一步、新卡的里程碑与关闭材料。
 * 推进本身经任务池流程（domain/workflow/task.ts），节点处理完任务卡怎么变见 ./workflow.ts
 */
import { canClose, taskFlow } from './status';
import type { ClosingMaterials, CostTask, Milestone, TaskStatus } from './types';

/** 新任务卡的里程碑：三个都没完成 */
export const blankMilestones = (): Milestone[] =>
  (['方案确定', '验证完成', '收益确认'] as const).map((label) => ({
    label,
    done: null,
    evidence: null,
  }));

/** 新任务卡的关闭材料：都没有 */
export const blankClosing = (): ClosingMaterials => ({
  verification: false,
  benefit: false,
  business: false,
});

/** 下一步：按钮文字与推进到的状态 */
export interface NextStep {
  /** 按钮文字 */
  label: string;
  /** 推进到的状态 */
  next: TaskStatus;
}

/** 按当前状态的下一步；没有下一步（终止、关闭、材料不全的已兑现）时为 null */
export function nextStepOf(task: CostTask): NextStep | null {
  switch (task.status) {
    case 'pending':
      return { label: '启动方案设计', next: 'designing' };
    case 'designing':
      return { label: '方案确定，进入验证', next: 'verifying' };
    case 'verifying':
      return { label: '验证达标，提交认定', next: 'awaiting' };
    case 'awaiting':
      return { label: '认定收益，锁定 A', next: 'confirmed' };
    case 'confirmed':
      return { label: '开始商务洽谈', next: 'negotiating' };
    case 'negotiating':
      return { label: '商务谈定，回填 B', next: 'realized' };
    case 'realized':
      return canClose(task) ? { label: '关闭归档', next: 'closed' } : null;
    case 'paused':
      return { label: '恢复执行', next: 'designing' };
    case 'unpriced':
      return { label: '完成定价，提交认定', next: 'awaiting' };
    case 'closed':
    case 'terminated':
      return null;
  }
}

/** 步骤条停在哪一步：正常状态就是它自己（关闭时全部完成）；异常状态按完成了几个里程碑推断 */
export function stepIndexOf(task: CostTask): number {
  const index = taskFlow.indexOf(task.status);
  if (index >= 0) return task.status === 'closed' ? taskFlow.length : index;
  return 1 + task.milestones.filter((item) => item.done).length;
}

/** 收益认定退回：任务回到验证中，验证窗结论作废（里程碑“验证完成”清掉） */
export const returnForVerification = (task: CostTask): CostTask => ({
  ...task,
  status: 'verifying',
  milestones: task.milestones.map((item) =>
    item.label === '验证完成' ? { ...item, done: null, evidence: null } : item,
  ),
  closing: { ...task.closing, verification: false },
});
