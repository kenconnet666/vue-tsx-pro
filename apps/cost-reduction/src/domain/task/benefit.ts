/**
 * 收益认定：验证完成后 10 个工作日内由成本团队认定，按协商收敛后的最新一版测算锁定测算金额 A，此后不可改；
 * 商务谈定后回填 B，差额 D = B − A 必须选归因
 */
import { deadlineOf, type Deadline } from '@vue-tsx-pro/ui';
import type Decimal from 'decimal.js';
import { TODAY } from '../clock';
import { taskSerial } from './code';
import { reached } from './status';
import type { ConfirmReturn, CostKind, CostTask, MilestoneLabel } from './types';

/** 收益认定的时限：验证完成后几个工作日 */
export const CONFIRM_WORKDAYS = 10;

/** 里程碑的完成日期；没完成时为 null */
export const milestoneDone = (task: Pick<CostTask, 'milestones'>, label: MilestoneLabel) =>
  task.milestones.find((item) => item.label === label)?.done ?? null;

/** 待认定的项目的认定时限（截止日、剩余工作日、状态；3 个工作日内算快到期）；还没验证完成时为 null */
export function confirmDeadline(task: Pick<CostTask, 'milestones'>): Deadline | null {
  const verified = milestoneDone(task, '验证完成');
  return verified == null
    ? null
    : deadlineOf({ start: verified, workdays: CONFIRM_WORKDAYS, today: TODAY, soon: 3 });
}

/** 最新一版测算的金额：认定时锁定为 A（测算版本上线前按预期收益的 97% 演示） */
export const latestEstimate = (task: Pick<CostTask, 'expected'>): Decimal =>
  task.expected.times(0.97).toDecimalPlaces(2);

/** 协商轮次：成本团队与供应商就测算来回了几轮（测算版本上线前按编号演示） */
export const negotiationRounds = (task: Pick<CostTask, 'code'>) => 1 + (taskSerial(task.code) % 3);

/** 差额 D = B − A；还没有 A 或 B 时为 null */
export const gapOf = (task: Pick<CostTask, 'a' | 'b'>): Decimal | null =>
  task.a && task.b ? task.b.minus(task.a) : null;

/** 收益认定的页签 */
export type ConfirmView = 'awaiting' | 'confirmed' | 'returned';

/** 收益认定的一行：任务卡，退回页签里加上退回的原因与日期 */
export interface ConfirmRow {
  /** 任务卡 */
  task: CostTask;
  /** 退回的原因与日期；不是退回页签时为 null */
  returned: Omit<ConfirmReturn, 'code'> | null;
}

/** 收益认定三个页签的行：一种降本类型、关键字（编码、名称）下 */
export function confirmRows(
  tasks: readonly CostTask[],
  returns: readonly ConfirmReturn[],
  query: { kind: CostKind; keyword: string },
): Record<ConfirmView, ConfirmRow[]> {
  const own = tasks.filter(
    (task) =>
      task.kind === query.kind &&
      (!query.keyword || task.code.includes(query.keyword) || task.name.includes(query.keyword)),
  );
  return {
    awaiting: own
      .filter((task) => task.status === 'awaiting')
      .map((task) => ({ task, returned: null })),
    confirmed: own
      .filter((task) => task.a != null && reached(task.status, 'confirmed'))
      .map((task) => ({ task, returned: null })),
    returned: returns.flatMap(({ code, ...returned }) => {
      const task = own.find((item) => item.code === code);
      return task ? [{ task, returned }] : [];
    }),
  };
}
