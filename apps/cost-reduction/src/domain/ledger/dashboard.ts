/**
 * 统计看板的口径（《需求定义方案》“收益测算与一本账”的计数纪律）：
 * - 一个视图只有一种单位：单机降本（万元）与降 DMC（美元 / FH）分开算；
 * - 任务池总数只出现一次；已确认收益、挂账待定、方案待定三桶互斥、加总等于总数（终止的回流储备库，不计入）；
 * - 预测、承诺、实现三种收益分开挂账，不跨状态合计；金额与一本账同一套算法（ledgerAmount）；
 * - 进度 × 收益状态交叉成矩阵（行与台账的页签一致），不用“其中”；金额口径分栏
 */
import Decimal from 'decimal.js';
import { confirmDeadline } from '../task/benefit';
import { overdueDays, statusGroups, taskFocuses, type StatusGroup } from '../task/status';
import type { CostKind, CostTask, TaskStatus, ValueState } from '../task/types';
import { ledgerAmount, onLedger } from './value';

/** 三桶：互斥，加总等于任务池总数 */
export const poolBuckets = [
  {
    value: 'confirmed',
    label: '已确认收益',
    statuses: ['confirmed', 'negotiating', 'realized', 'closed'],
  },
  { value: 'unpriced', label: '挂账待定', statuses: ['unpriced'] },
  {
    value: 'plan',
    label: '方案待定',
    statuses: ['pending', 'designing', 'verifying', 'awaiting', 'paused'],
  },
] as const satisfies readonly { value: string; label: string; statuses: readonly TaskStatus[] }[];

/** 收益状态的先后（矩阵的列） */
export const valueStateOrder: readonly ValueState[] = [
  'forecast',
  'committed',
  'realized',
  'unpriced',
];

/** 有金额的三种收益状态（挂账待定没有金额） */
export const pricedStates: readonly ValueState[] = ['forecast', 'committed', 'realized'];

/** 统计看板“需要处理”的几项件数 */
export interface DashboardTodos {
  /** 超时 */
  overdue: number;
  /** 7 天内到期 */
  soon: number;
  /** 待认定 */
  awaiting: number;
  /** 认定超期 */
  confirmOverdue: number;
  /** 可关闭 */
  closable: number;
  /** 关闭材料不全 */
  missing: number;
}

/** 统计看板的数据（一种降本类型） */
export interface DashboardSummary {
  /** 降本类型 */
  kind: CostKind;
  /** 需要处理 */
  todos: DashboardTodos;
  /** 任务池总数（不含终止） */
  pool: number;
  /** 终止、回流储备库的项数 */
  terminated: number;
  /** 三桶的件数 */
  buckets: { value: string; label: string; count: number }[];
  /** 三种收益：件数与金额 */
  states: { state: ValueState; count: number; amount: Decimal }[];
  /** 进度 × 收益状态：每个状态分组一行（没有异常时不列异常） */
  matrix: {
    group: StatusGroup;
    label: string;
    counts: Record<ValueState, number>;
    total: number;
  }[];
  /** 各收益状态的小计（件数） */
  stateTotals: Record<ValueState, number>;
  /** 超时最久的几项 */
  late: { code: string; name: string; status: TaskStatus; days: number }[];
  /** 各团队在各状态分组里的件数 */
  teams: { team: string; counts: Record<StatusGroup, number> }[];
  /** 差额 D 的归因：各归因的金额（绝对值之和） */
  gaps: { reason: string; amount: Decimal }[];
  /** 金额口径 × 收益状态的金额；没有项目的格子为 null */
  bases: { state: ValueState; basis: string; amount: Decimal | null }[];
}

const sum = (tasks: readonly CostTask[]) =>
  tasks.reduce((total, task) => total.plus(ledgerAmount(task) ?? 0), new Decimal(0));

const countBy = <K extends string>(keys: readonly K[], test: (key: K) => number) =>
  Object.fromEntries(keys.map((key) => [key, test(key)])) as Record<K, number>;

/** 统计看板的数据：一种降本类型下的全部口径 */
export function dashboardSummary(
  tasks: readonly CostTask[],
  kind: CostKind,
  dictionaries: {
    teams: readonly string[];
    gapReasons: readonly string[];
    amountBases: readonly string[];
  },
): DashboardSummary {
  const ofKind = tasks.filter((task) => task.kind === kind);
  const pool = ofKind.filter(onLedger);
  const inGroup = (task: CostTask, group: StatusGroup) =>
    (statusGroups.find((item) => item.value === group)!.statuses as readonly string[]).includes(
      task.status,
    );
  const focusCount = (value: (typeof taskFocuses)[number]['value']) =>
    pool.filter(taskFocuses.find((item) => item.value === value)!.test).length;
  const awaiting = pool.filter((task) => task.status === 'awaiting');
  const groupKeys = statusGroups.map((group) => group.value);

  return {
    kind,
    todos: {
      overdue: focusCount('overdue'),
      soon: focusCount('soon'),
      awaiting: awaiting.length,
      confirmOverdue: awaiting.filter((task) => confirmDeadline(task)?.state === 'overdue').length,
      closable: focusCount('closable'),
      missing: focusCount('missing'),
    },
    pool: pool.length,
    terminated: ofKind.length - pool.length,
    buckets: poolBuckets.map((bucket) => ({
      value: bucket.value,
      label: bucket.label,
      count: pool.filter((task) => (bucket.statuses as readonly string[]).includes(task.status))
        .length,
    })),
    states: pricedStates.map((state) => {
      const rows = pool.filter((task) => task.valueState === state);
      return { state, count: rows.length, amount: sum(rows) };
    }),
    matrix: statusGroups
      .filter(
        (group) => group.value !== 'abnormal' || pool.some((task) => inGroup(task, 'abnormal')),
      )
      .map((group) => {
        const rows = pool.filter((task) => inGroup(task, group.value));
        return {
          group: group.value,
          label: group.label,
          counts: countBy(
            valueStateOrder,
            (state) => rows.filter((task) => task.valueState === state).length,
          ),
          total: rows.length,
        };
      }),
    stateTotals: countBy(
      valueStateOrder,
      (state) => pool.filter((task) => task.valueState === state).length,
    ),
    late: pool
      .filter((task) => overdueDays(task) > 0)
      .toSorted((a, b) => overdueDays(b) - overdueDays(a))
      .slice(0, 6)
      .map((task) => ({
        code: task.code,
        name: task.name,
        status: task.status,
        days: overdueDays(task),
      })),
    teams: dictionaries.teams.map((team) => ({
      team,
      counts: countBy(
        groupKeys,
        (group) => pool.filter((task) => task.team === team && inGroup(task, group)).length,
      ),
    })),
    gaps: dictionaries.gapReasons.map((reason) => ({
      reason,
      amount: pool
        .filter((task) => task.gapReason === reason && task.a && task.b)
        .reduce((total, task) => total.plus(task.b!.minus(task.a!).abs()), new Decimal(0)),
    })),
    bases: pricedStates.flatMap((state) =>
      dictionaries.amountBases.map((basis) => {
        const rows = pool.filter((task) => task.valueState === state && task.basis === basis);
        return { state, basis, amount: rows.length ? sum(rows) : null };
      }),
    ),
  };
}
