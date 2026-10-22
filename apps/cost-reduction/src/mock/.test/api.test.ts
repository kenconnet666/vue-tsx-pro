// 接口与假后端的往返：页面用的 api 函数经 MSW（Node 版）打到假后端，金额按字符串传、收到后是 Decimal；
// 业务规则在后端生效（新建时生成编码、只有待启动能删、状态只进不跳），错误带上给人看的说明
import { HttpError } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getValueLedger } from '../../api/benefit';
import { setRequestUser } from '../../api/client';
import { getMe, getMyTasks } from '../../api/session';
import { advanceTask, createTask, deleteTask, getTask, listTasks } from '../../api/tasks';
import { errorMessage } from '../../app/feedback';
import { blankLedgerQuery } from '../../domain/task/query';
import { createDatabase } from '../db';
import { createHandlers } from '../index';

const db = createDatabase(null);
const server = setupServer(...createHandlers(db));

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => {
  db.reset();
  setRequestUser(() => null);
});
afterAll(() => server.close());

const ledger = (view: string) =>
  listTasks({
    kind: 'unit',
    view,
    filters: blankLedgerQuery(),
    sort: null,
    page: 1,
    pageSize: 10,
  });

describe('假后端', () => {
  it('台账分页、页签条数；任务卡的金额收到后是 Decimal', async () => {
    const page = await ledger('all');
    expect(page.rows).toHaveLength(10);
    expect(page.total).toBe(page.counts.all);
    expect(page.rows[0]!.expected).toBeInstanceOf(Decimal);
    const task = await getTask(page.rows[0]!.code);
    expect(task.code).toBe(page.rows[0]!.code);
  });

  it('新建时由后端生成编码（序号接在最大的后面）', async () => {
    const template = await getTask((await ledger('all')).rows[0]!.code);
    const created = await createTask({
      ...template,
      code: '',
      year: '2027',
      team: '起落架液压系统集成团队',
    });
    expect(created.code).toBe('DJ-2027-QY-87');
  });

  it('只有待启动能删；状态只能推进到下一步；出错时说明在响应体里', async () => {
    const started = (await ledger('doing')).rows.find((task) => task.status !== 'pending')!;
    const error = await deleteTask(started.code).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(HttpError);
    expect(errorMessage(error)).toContain('只有待启动的项目可以删除');
    await expect(advanceTask(started.code, 'closed').catch(errorMessage)).resolves.toContain(
      '不能推进到这个状态',
    );
  });

  it('当前用户按请求头切换：我负责的任务跟着变', async () => {
    expect((await getMe()).id).toBe('E10732');
    const mine = await getMyTasks();
    setRequestUser(() => 'E50913');
    expect((await getMe()).name).toBe('王晴');
    const theirs = await getMyTasks();
    expect(theirs.every((task) => task.owner === 'E50913')).toBe(true);
    expect(theirs.map((task) => task.code)).not.toEqual(mine.map((task) => task.code));
  });

  it('一本账：两种单位各有几行，金额是 Decimal 或待定价（null）', async () => {
    const result = await getValueLedger({ kind: 'dmc', basis: 'hard', keyword: '', team: null });
    expect(result.rows).toHaveLength(result.counts.dmc);
    expect(result.rows.every((row) => row.amount == null || row.amount instanceof Decimal)).toBe(
      true,
    );
  });
});
