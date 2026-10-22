// 一本账与统计看板的口径：金额只落在所属状态那一栏，挂账待定没有金额；三桶互斥、加总等于任务池总数
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { masterSeed } from '../../mock/seed/master';
import { seedOpportunities, seedTasks } from '../../mock/seed/tasks';
import { dashboardSummary } from '../ledger/dashboard';
import { ledgerAmount, valueLedgerRows } from '../ledger/value';

const tasks = seedTasks();
const dictionaries = {
  teams: masterSeed.teams.map((team) => team.name),
  gapReasons: masterSeed.dictionaries.gapReasons.map((item) => item.value),
  amountBases: masterSeed.dictionaries.amountBases.map((item) => item.value),
};

describe('ledgerAmount', () => {
  const task = tasks[0]!;
  it('预测值用 A（没有时用预期），承诺与实现用 B（没有时用 A），挂账待定没有金额', () => {
    const a = new Decimal(90);
    const b = new Decimal(80);
    expect(ledgerAmount({ ...task, valueState: 'forecast', a: null })).toEqual(task.expected);
    expect(ledgerAmount({ ...task, valueState: 'forecast', a })).toEqual(a);
    expect(ledgerAmount({ ...task, valueState: 'committed', a, b })).toEqual(b);
    expect(ledgerAmount({ ...task, valueState: 'realized', a, b: null })).toEqual(a);
    expect(ledgerAmount({ ...task, valueState: 'unpriced', a, b })).toBeNull();
  });
});

describe('valueLedgerRows', () => {
  it('机会在前；终止的不上账；只有当前单位与口径', () => {
    const rows = valueLedgerRows(tasks, seedOpportunities(), {
      kind: 'unit',
      basis: 'hard',
      keyword: '',
      team: null,
    });
    const firstPool = rows.findIndex((row) => row.inPool);
    expect(rows.slice(0, firstPool).every((row) => row.column === 'opportunity')).toBe(true);
    const codes = new Set(rows.map((row) => row.code));
    for (const task of tasks.filter((item) => item.status === 'terminated'))
      expect(codes.has(task.code)).toBe(false);
  });
});

describe('dashboardSummary', () => {
  for (const kind of ['unit', 'dmc'] as const) {
    it(`${kind}：三桶加总等于任务池总数；矩阵各行加总等于总数；收益金额与一本账一致`, () => {
      const summary = dashboardSummary(tasks, kind, { ...dictionaries, target: null });
      expect(summary.buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(summary.pool);
      expect(summary.matrix.reduce((sum, row) => sum + row.total, 0)).toBe(summary.pool);
      const forecast = summary.states.find((item) => item.state === 'forecast')!;
      const expected = tasks
        .filter(
          (task) =>
            task.kind === kind && task.status !== 'terminated' && task.valueState === 'forecast',
        )
        .reduce((sum, task) => sum.plus(ledgerAmount(task)!), new Decimal(0));
      expect(forecast.amount.equals(expected)).toBe(true);
    });

    it(`${kind}：推进漏斗逐级不增、第一环节是任务池；差额瀑布 A 加各项差额等于 B；按月累计不减`, () => {
      const summary = dashboardSummary(tasks, kind, { ...dictionaries, target: new Decimal(1) });
      const counts = summary.progress.map((stage) => stage.count);
      expect(counts[0]).toBe(summary.pool);
      expect(counts.every((count, index) => index === 0 || count <= counts[index - 1]!)).toBe(true);
      const { a, b, reasons } = summary.bridge;
      expect(reasons.reduce((total, item) => total.plus(item.amount), a).equals(b)).toBe(true);
      expect(summary.monthly).toHaveLength(12);
      summary.monthly.slice(1).forEach((month, index) => {
        expect(month.expected.gte(summary.monthly[index]!.expected)).toBe(true);
      });
      // 今天（10 月）之后的月份没有实际值
      expect(summary.monthly.slice(10).every((month) => month.realized === null)).toBe(true);
      expect(summary.target?.toNumber()).toBe(1);
    });
  }
});
