/**
 * 一本账：四种收益状态分开挂账、不跨状态合计；同一笔收益只在所属状态那一栏出现一次；
 * 挂账待定单独一栏，写“待定价”，不写零也不写估算值；金额口径（硬节约、成本规避、软节约）分栏，不混总数。
 *   机会值：渠道里已识别、还没评估、没进任务池的建议与方案（预期收益量级）
 *   预测值：测算 A（认定前用预期收益）
 *   承诺值、实现值：商务 B（还没谈定用 A）
 * 一本账、统计看板都按这里算，两处的数一致；终止的项目没有收益，不上账
 */
import type Decimal from 'decimal.js';
import type { CostKind, CostTask, ValueState } from '../task/types';

/** 机会值：渠道里还没评估、还没进任务池的建议与方案 */
export interface Opportunity {
  /** 建议编号（JY-）或方案编号（FA-） */
  code: string;
  /** 名称 */
  name: string;
  /** 降本类型 */
  kind: CostKind;
  /** 来源渠道 */
  channel: string;
  /** 责任一级团队 */
  team: string;
  /** 金额口径 */
  basis: string;
  /** 建议卡上的预期收益量级（单机降本是元，降 DMC 是美元 / FH） */
  expected: Decimal;
}

/** 一本账的栏：机会值加上任务的收益状态 */
export type LedgerColumn = 'opportunity' | ValueState;

/** 任务挂在一本账上的金额；挂账待定没有金额（待定价） */
export function ledgerAmount(
  task: Pick<CostTask, 'valueState' | 'a' | 'b' | 'expected'>,
): Decimal | null {
  if (task.valueState === 'unpriced') return null;
  if (task.valueState === 'forecast') return task.a ?? task.expected;
  return task.b ?? task.a ?? task.expected;
}

/** 上不上账：终止的项目没有收益 */
export const onLedger = (task: Pick<CostTask, 'status'>) => task.status !== 'terminated';

/** 一本账的一行 */
export interface ValueLedgerRow {
  /** 编码 */
  code: string;
  /** 名称 */
  name: string;
  /** 责任一级团队 */
  team: string;
  /** 来源渠道 */
  channel: string;
  /** 挂在哪一栏 */
  column: LedgerColumn;
  /** 金额；挂账待定为 null */
  amount: Decimal | null;
  /** 任务池里的任务（有详情页）；机会没有 */
  inPool: boolean;
}

/** 一本账的查询 */
export interface ValueLedgerQuery {
  /** 降本类型：一个视图只有一种单位 */
  kind: CostKind;
  /** 金额口径：一次看一种 */
  basis: string;
  /** 关键字：编码、名称 */
  keyword: string;
  /** 责任一级团队 */
  team: string | null;
}

/** 一本账的行：机会在前，任务按收益状态上账；按单位、口径、关键字与团队筛选 */
export function valueLedgerRows(
  tasks: readonly CostTask[],
  opportunities: readonly Opportunity[],
  query: ValueLedgerQuery,
): ValueLedgerRow[] {
  const fromChannels: ValueLedgerRow[] = opportunities
    .filter((item) => item.kind === query.kind && item.basis === query.basis)
    .map((item) => ({
      code: item.code,
      name: item.name,
      team: item.team,
      channel: item.channel,
      column: 'opportunity',
      amount: item.expected,
      inPool: false,
    }));
  const fromPool: ValueLedgerRow[] = tasks
    .filter((task) => task.kind === query.kind && task.basis === query.basis && onLedger(task))
    .map((task) => ({
      code: task.code,
      name: task.name,
      team: task.team,
      channel: task.channel,
      column: task.valueState,
      amount: ledgerAmount(task),
      inPool: true,
    }));
  return [...fromChannels, ...fromPool].filter(
    (row) =>
      (!query.keyword || row.code.includes(query.keyword) || row.name.includes(query.keyword)) &&
      (!query.team || row.team === query.team),
  );
}
