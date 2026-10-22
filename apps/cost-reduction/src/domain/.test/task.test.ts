// 任务卡的规则：编码、台账查询（页签条数、排序、分页）、下一步与推进、收益认定的三个页签
import { describe, expect, it } from 'vitest';
import { seedConfirmReturns, seedTasks } from '../../mock/seed/tasks';
import { confirmRows } from '../task/benefit';
import { kindOfCode, nextTaskCode, taskSerial } from '../task/code';
import { nextStepOf, returnForVerification } from '../task/lifecycle';
import { applyTaskCompletion } from '../task/workflow';
import { blankLedgerQuery, queryLedger, tasksInView } from '../task/query';
import { canClose, overdueDays } from '../task/status';

const tasks = seedTasks();

describe('编码', () => {
  it('序号接在已有的最大序号后面；按前缀认出降本类型', () => {
    expect(nextTaskCode(['DJ-2026-FC-3', 'DMC-2026-ZT-12'], 'unit', '2027', 'QY')).toBe(
      'DJ-2027-QY-13',
    );
    expect(taskSerial('DMC-2026-ZT-12')).toBe(12);
    expect(kindOfCode('DMC-2026-ZT-12')).toBe('dmc');
    expect(kindOfCode('DJ-2026-FC-3')).toBe('unit');
  });
});

describe('queryLedger', () => {
  const base = {
    kind: 'unit' as const,
    view: 'all',
    filters: blankLedgerQuery(),
    sort: null,
    page: 1,
    pageSize: 20,
  };

  it('只看一种降本类型；各页签的条数在当前条件下算，状态分组加起来等于全部', () => {
    const page = queryLedger(tasks, base);
    const units = tasks.filter((task) => task.kind === 'unit');
    expect(page.total).toBe(units.length);
    expect(page.rows).toHaveLength(20);
    const groups = ['doing', 'awaiting', 'business', 'realized', 'closed', 'abnormal'];
    expect(groups.reduce((sum, key) => sum + page.counts[key]!, 0)).toBe(page.counts.all);
    expect(page.counts.overdue).toBe(units.filter((task) => overdueDays(task) > 0).length);
  });

  it('超时倒序：超时越久越前；分页按排好的顺序切', () => {
    const sorted = queryLedger(tasks, {
      ...base,
      sort: { key: 'overdue', direction: 'descending' },
      pageSize: 5,
    });
    const days = sorted.rows.map(overdueDays);
    expect(days).toEqual([...days].sort((a, b) => b - a));
    const second = queryLedger(tasks, {
      ...base,
      sort: { key: 'overdue', direction: 'descending' },
      page: 2,
      pageSize: 5,
    });
    expect(second.rows[0]!.code).not.toBe(sorted.rows[0]!.code);
  });

  it('关键字查编码、名称与件号；关注页签“可关闭”只含三材料齐全的已兑现', () => {
    const part = tasks.find((task) => task.unitDetail)!.unitDetail!.parts[0]!.before!.partNo;
    const found = queryLedger(tasks, {
      ...base,
      filters: { ...blankLedgerQuery(), keyword: part },
    });
    expect(found.total).toBeGreaterThan(0);
    expect(tasksInView(tasks, 'closable').every(canClose)).toBe(true);
  });
});

describe('推进', () => {
  it('节点处理完任务卡跟着变：认定锁定 A 与收益认定意见，商务回填 B 与谈定记录，不达标两个里程碑作废', () => {
    const awaiting = tasks.find((task) => task.status === 'awaiting' && task.a == null)!;
    expect(nextStepOf(awaiting)).toMatchObject({ next: 'confirmed' });
    const completion = (node: string, outcome: string, variables = {}) => ({
      node,
      outcome,
      on: '2026-10-21',
      attachments: ['证据.pdf'],
      variables,
    });
    const confirmed = applyTaskCompletion(
      awaiting,
      completion('confirm', 'lock', { a: '12345.60' }),
    );
    expect(confirmed.a?.toString()).toBe('12345.6');
    expect(confirmed.closing.benefit).toBe(true);
    const recorded = applyTaskCompletion(
      confirmed,
      completion('negotiate', 'record', { b: '12000', gapReason: '供应商让利' }),
    );
    expect(recorded).toMatchObject({ valueState: 'committed', gapReason: '供应商让利' });
    expect(recorded.closing.business).toBe(true);
    const failed = applyTaskCompletion(recorded, completion('judge', 'fail'));
    expect(
      failed.milestones.filter((item) => item.label !== '收益确认').every((item) => !item.done),
    ).toBe(true);
    expect(failed.closing.verification).toBe(false);
  });

  it('关闭、终止没有下一步；退回验证时验证窗结论作废', () => {
    expect(nextStepOf({ ...tasks[0]!, status: 'terminated' })).toBeNull();
    const awaiting = tasks.find((task) => task.status === 'awaiting')!;
    const returned = returnForVerification(awaiting);
    expect(returned.status).toBe('verifying');
    expect(returned.closing.verification).toBe(false);
    expect(returned.milestones.find((item) => item.label === '验证完成')!.done).toBeNull();
  });
});

describe('confirmRows', () => {
  it('待认定、已认定、退回三个页签；退回的带原因', () => {
    const rows = confirmRows(tasks, seedConfirmReturns(tasks), { kind: 'unit', keyword: '' });
    expect(rows.awaiting.every((row) => row.task.status === 'awaiting')).toBe(true);
    expect(rows.confirmed.every((row) => row.task.a != null)).toBe(true);
    expect(rows.returned.every((row) => row.returned?.reason)).toBe(true);
  });
});
