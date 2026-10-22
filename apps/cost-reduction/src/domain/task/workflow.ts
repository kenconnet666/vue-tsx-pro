/**
 * 任务池的节点处理完，任务卡跟着变什么（状态由流程节点决定，见 domain/workflow/task.ts 的 taskStatusOf）：
 * 方案确定、验证完成、收益确认三个里程碑记下日期与证据；验证窗结论、收益认定意见、商务谈定记录是关闭三材料；
 * 认定时锁定 A、商务回填 B 与差额归因；挂账待定与定价改收益状态；验证不达标退回方案设计，两个里程碑作废
 */
import Decimal from 'decimal.js';
import { canClose } from './status';
import type { CostTask, MilestoneLabel } from './types';

/** 一次节点处理：节点、结果、日期、附件、处理时填的流程变量 */
export interface TaskCompletion {
  /** 节点 */
  node: string;
  /** 处理结果 */
  outcome: string;
  /** 处理日期（ISO 日期） */
  on: string;
  /** 附件 */
  attachments: readonly string[];
  /** 流程变量（处理时填的已经并进去） */
  variables: Readonly<Record<string, unknown>>;
}

/** 流程变量里的金额（十进制字符串或数字）→ Decimal；没有时为 null */
const decimalOf = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number'
    ? value === ''
      ? null
      : new Decimal(value)
    : null;

/** 流程变量里的文字；不是文字时用 fallback */
const textOf = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);

const setMilestone = (
  task: CostTask,
  label: MilestoneLabel,
  done: string | null,
  evidence: string | null,
) => task.milestones.map((item) => (item.label === label ? { ...item, done, evidence } : item));

/** 节点处理完后的任务卡（不含状态） */
export function applyTaskCompletion(task: CostTask, completion: TaskCompletion): CostTask {
  const { node, outcome, on, attachments, variables } = completion;
  const evidence = attachments[0] ?? null;
  switch (`${node}:${outcome}`) {
    case 'create:create':
      return { ...task, owner: textOf(variables.owner, task.owner) };
    case 'design:done':
      return { ...task, milestones: setMilestone(task, '方案确定', on, evidence) };
    case 'verify:done':
      return { ...task, milestones: setMilestone(task, '验证完成', on, evidence) };
    case 'conclusion:issue':
      return { ...task, closing: { ...task.closing, verification: true } };
    case 'judge:fail': {
      const reset = setMilestone(task, '验证完成', null, null);
      return {
        ...task,
        milestones: reset.map((item) =>
          item.label === '方案确定' ? { ...item, done: null, evidence: null } : item,
        ),
        closing: { ...task.closing, verification: false },
      };
    }
    case 'confirm:lock':
      return {
        ...task,
        a: decimalOf(variables.a) ?? task.a,
        milestones: setMilestone(task, '收益确认', on, evidence ?? '收益认定意见.pdf'),
        closing: { ...task.closing, benefit: true },
        valueState: 'forecast',
      };
    case 'confirm:unpriced':
      return { ...task, valueState: 'unpriced' };
    case 'pricing:priced':
      return { ...task, valueState: 'forecast' };
    case 'negotiate:record':
      return {
        ...task,
        b: decimalOf(variables.b) ?? task.b,
        gapReason: textOf(variables.gapReason, task.gapReason ?? '') || null,
        valueState: 'committed',
        closing: { ...task.closing, business: true },
      };
    case 'judgeDeal:settled':
      // 谈定时降 DMC 的实施节点都已完成
      return {
        ...task,
        dmcNodes: task.dmcNodes.map((item) => ({ ...item, done: item.done ?? on })),
      };
    case 'close:close':
      return { ...task, valueState: 'realized' };
    default:
      return task;
  }
}

/** 处理任务池的节点前的业务检查：差额 D 不为零时必须选归因；关闭须三材料齐全。没问题时为 null */
export function taskCompletionProblem(
  task: CostTask,
  completion: Pick<TaskCompletion, 'node' | 'outcome' | 'variables'>,
): string | null {
  const { node, outcome, variables } = completion;
  if (node === 'negotiate' && outcome === 'record') {
    const a = task.a;
    const b = decimalOf(variables.b);
    if (a && b && !a.equals(b) && !textOf(variables.gapReason, ''))
      return '差额 D（B − A）不为零时必须选归因';
  }
  if (node === 'close' && outcome === 'close' && !canClose({ ...task, status: 'realized' }))
    return '关闭须验证窗结论、收益认定意见、商务谈定记录三项齐全';
  return null;
}
