/**
 * 任务卡的推进：下一步做什么、推进后哪些字段跟着变（完成里程碑、锁定 A、回填 B、关闭材料）。
 * 后端按它改任务卡，详情页按它给出“下一步”按钮；任务池接入流程定义后由流程节点驱动，规则不变
 */
import { TODAY } from '../clock';
import { latestEstimate } from './benefit';
import { canClose, taskFlow } from './status';
import type { ClosingMaterials, CostTask, Milestone, MilestoneLabel, TaskStatus } from './types';

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

/** 完成一个里程碑（已完成的不动），交付证据先用“<名称>证据.pdf”占位 */
const finishMilestone = (task: CostTask, label: MilestoneLabel) =>
  task.milestones.map((item) =>
    item.label === label && !item.done
      ? { ...item, done: TODAY, evidence: `${label}证据.pdf` }
      : item,
  );

/**
 * 把任务推进到 next：完成对应的里程碑、补上金额与关闭材料。
 * 验证完成 → 验证窗结论；认定 → 锁定 A 与收益认定意见；兑现 → 回填 B、归因与商务谈定记录
 */
export function advanceTask(task: CostTask, next: TaskStatus): CostTask {
  switch (next) {
    case 'verifying':
      return { ...task, status: next, milestones: finishMilestone(task, '方案确定') };
    case 'awaiting':
      return {
        ...task,
        status: next,
        milestones: finishMilestone(task, '验证完成'),
        closing: { ...task.closing, verification: true },
      };
    case 'confirmed':
      return {
        ...task,
        status: next,
        milestones: finishMilestone(task, '收益确认'),
        a: task.a ?? latestEstimate(task),
        closing: { ...task.closing, benefit: true },
      };
    case 'realized': {
      const a = task.a ?? task.expected;
      return {
        ...task,
        status: next,
        valueState: 'committed',
        b: a.times(0.98).toDecimalPlaces(2),
        gapReason: task.gapReason ?? '商务条件置换',
        closing: { ...task.closing, business: true },
        // 兑现时降 DMC 的实施节点都已完成
        dmcNodes: task.dmcNodes.map((node) => ({ ...node, done: node.done ?? TODAY })),
      };
    }
    case 'closed':
      return { ...task, status: next, valueState: 'realized' };
    default:
      return { ...task, status: next };
  }
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
