/**
 * 接口上的数据格式：金额一律是十进制字符串（'12345.60'），不用 JSON 的数字（浮点会丢精度）；日期是 ISO 字符串。
 * 发出时 Decimal 由 JSON.stringify 自动写成字符串（Decimal 的 toJSON）；收到时按字段换回 Decimal。
 * Wire<T> 是一个类型在接口上的样子：Decimal 换成 string，其余不变
 */
import Decimal from 'decimal.js';
import type { DashboardSummary } from '../domain/ledger/dashboard';
import type { ValueLedgerRow } from '../domain/ledger/value';
import type { ConfirmRow, ConfirmView } from '../domain/task/benefit';
import type { CostTask, PartChange, PartSide } from '../domain/task/types';

/** 类型在接口上的样子：Decimal 换成十进制字符串 */
export type Wire<T> = T extends Decimal
  ? string
  : T extends readonly (infer Item)[]
    ? Wire<Item>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;

/** 十进制字符串 → Decimal */
export const toDecimal = (value: string | number) => new Decimal(value);

/** 可以为空的十进制字符串 → Decimal 或 null */
export const toDecimalOrNull = (value: string | number | null) =>
  value == null ? null : new Decimal(value);

const decodeSide = (side: Wire<PartSide> | null): PartSide | null =>
  side && {
    ...side,
    quota: toDecimal(side.quota),
    materialPrice: toDecimal(side.materialPrice),
    laborHours: toDecimal(side.laborHours),
    laborRate: toDecimal(side.laborRate),
  };

const decodeChange = (change: Wire<PartChange>): PartChange => ({
  ...change,
  before: decodeSide(change.before),
  after: decodeSide(change.after),
});

/** 任务卡 */
export const decodeTask = (task: Wire<CostTask>): CostTask => ({
  ...task,
  expected: toDecimal(task.expected),
  a: toDecimalOrNull(task.a),
  b: toDecimalOrNull(task.b),
  unitDetail: task.unitDetail && {
    ...task.unitDetail,
    parts: task.unitDetail.parts.map(decodeChange),
  },
});

/** 收益认定的三个页签 */
export const decodeConfirmRows = (
  rows: Wire<Record<ConfirmView, ConfirmRow[]>>,
): Record<ConfirmView, ConfirmRow[]> => {
  const decode = (list: Wire<ConfirmRow>[]) =>
    list.map((row) => ({ ...row, task: decodeTask(row.task) }));
  return {
    awaiting: decode(rows.awaiting),
    confirmed: decode(rows.confirmed),
    returned: decode(rows.returned),
  };
};

/** 一本账的行 */
export const decodeLedgerRow = (row: Wire<ValueLedgerRow>): ValueLedgerRow => ({
  ...row,
  amount: toDecimalOrNull(row.amount),
});

/** 统计看板 */
export const decodeDashboard = (summary: Wire<DashboardSummary>): DashboardSummary => ({
  ...summary,
  states: summary.states.map((item) => ({ ...item, amount: toDecimal(item.amount) })),
  gaps: summary.gaps.map((item) => ({ ...item, amount: toDecimal(item.amount) })),
  bases: summary.bases.map((item) => ({ ...item, amount: toDecimalOrNull(item.amount) })),
});
