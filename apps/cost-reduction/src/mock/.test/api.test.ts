// 接口与假后端的往返：页面用的 api 函数经 MSW（Node 版）打到假后端，金额按字符串传、收到后是 Decimal；
// 业务规则在后端生效（新建时生成编码、只有待启动能删、状态只进不跳），错误带上给人看的说明
import { HttpError } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getValueLedger } from '../../api/benefit';
import { setRequestUser } from '../../api/client';
import { getMe, getMyTasks } from '../../api/session';
import {
  advanceTask,
  createTask,
  deleteTask,
  getTask,
  getTaskBoard,
  listTasks,
  requestPlanChange,
} from '../../api/tasks';
import {
  claimWorkItem,
  completeWorkItem,
  getWorkflowTrace,
  listWorkItems,
} from '../../api/workflow';
import { errorMessage } from '../../app/feedback';
import { blankLedgerQuery } from '../../domain/task/query';
import { createDatabase } from '../db';
import { createHandlers } from '../index';

const db = createDatabase(null);
/** PEMO：建卡、删除、推进 */
const PEMO = 'E40287';
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

  it('新建时由后端生成编码（序号接在最大的后面）；建卡归 PEMO', async () => {
    setRequestUser(() => PEMO);
    const template = await getTask((await ledger('all')).rows[0]!.code);
    const created = await createTask({
      ...template,
      code: '',
      year: '2027',
      team: '起落架液压系统集成团队',
    });
    expect(created).toMatchObject({ code: 'DJ-2027-QY-87', status: 'pending' });
    setRequestUser(() => 'E10732');
    const denied = await createTask({ ...template, code: '' }).catch(errorMessage);
    expect(denied).toContain('你的角色不能新建任务');
  });

  it('只有待启动能删；状态只能推进到下一步；出错时说明在响应体里', async () => {
    setRequestUser(() => PEMO);
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

  it('流程接口：岗位待认领、认领、处理；任务卡的状态跟着流程走', async () => {
    setRequestUser(() => PEMO);
    const pool = await listWorkItems('pool');
    expect(pool.counts.pool).toBe(pool.items.length);
    const item = pool.items.find((entry) => entry.node === 'create')!;
    await claimWorkItem(item.id);
    expect((await listWorkItems('mine')).items.map((entry) => entry.id)).toContain(item.id);
    const task = await getTask(item.businessKey);
    await completeWorkItem(item.id, { outcome: 'create', variables: { owner: task.owner } });
    expect((await getTask(item.businessKey)).status).toBe('designing');
    const trace = await getWorkflowTrace(item.businessKey, 'task');
    expect(trace.instance.active).toEqual(['design']);
    expect(trace.events.map((event) => event.type)).toContain('claimed');
    // 不是自己的待办不能处理；缺附件不能处理
    const design = trace.items.find((entry) => entry.node === 'design' && entry.state === 'open')!;
    await expect(
      completeWorkItem(design.id, { outcome: 'done' }).catch(errorMessage),
    ).resolves.toMatch(/不是你的|附件/);
  });

  it('任务看板与台账带上正在处理的环节；结束的任务没有', async () => {
    const cards = await getTaskBoard('unit');
    expect(cards.every((card) => card.task.kind === 'unit')).toBe(true);
    const running = cards.find((card) => card.task.status === 'designing')!;
    expect(running.item).toMatchObject({ businessKey: running.task.code, state: 'open' });
    expect(cards.find((card) => card.task.status === 'closed')!.item).toBeNull();
    const page = await ledger('doing');
    const code = page.rows.find((task) => task.status === 'designing')!.code;
    expect(page.current[code]!.node).toBe('design');
  });

  it('计划调整：主办提交、不能重复提交；PEMO 同意后写回、记变更记录，手上的环节转给新主办', async () => {
    const card = (await getTaskBoard('unit')).find(
      (entry) => entry.task.status === 'designing' && !entry.task.pendingChange,
    )!;
    const task = card.task;
    const successor = task.owner === 'E10855' ? 'E10916' : 'E10855';
    setRequestUser(() => task.owner);
    const change = { due: '2027-06-30', owner: successor, reason: '工装交付推迟' };
    const pending = await requestPlanChange(task.code, change);
    expect(pending.pendingChange).toMatchObject({ ...change, by: task.owner });
    expect(pending.due).toBe(task.due);
    await expect(requestPlanChange(task.code, change).catch(errorMessage)).resolves.toContain(
      '在审批中',
    );

    setRequestUser(() => PEMO);
    const trace = await getWorkflowTrace(task.code, 'task-change');
    const approve = trace.items.find((entry) => entry.state === 'open')!;
    await claimWorkItem(approve.id);
    await completeWorkItem(approve.id, { outcome: 'agree' });
    const updated = await getTask(task.code);
    expect(updated).toMatchObject({ due: '2027-06-30', owner: successor, pendingChange: null });
    expect(updated.changes[0]).toMatchObject({
      by: task.owner,
      approvedBy: PEMO,
      due: { before: task.due, after: '2027-06-30' },
      owner: { before: task.owner, after: successor },
    });
    const flow = await getWorkflowTrace(task.code, 'task');
    expect(flow.items.find((entry) => entry.state === 'open')!.assignee).toBe(successor);
  });

  it('降 DMC：建卡后发起实施审批链，节点通过时回填实施节点的完成日期', async () => {
    setRequestUser(() => PEMO);
    const task = (await getTaskBoard('dmc')).find(
      (entry) => entry.task.status === 'designing',
    )!.task;
    const chain = await getWorkflowTrace(task.code, 'dmc-implementation');
    expect(chain.instance.status).toBe('active');
    const open = chain.items.find((entry) => entry.state === 'open')!;
    const form = open.node === 'ecp' ? 'ECP 批准' : open.node === 'mi' ? 'MI 批准' : null;
    // 岗位的负责人认领、通过
    const lead = open.pool === 'product:QY' ? 'E20418' : 'E10855';
    setRequestUser(() => lead);
    await claimWorkItem(open.id);
    await completeWorkItem(open.id, { outcome: 'approve' });
    const updated = await getTask(task.code);
    if (form) expect(updated.dmcNodes.find((node) => node.form === form)!.done).not.toBeNull();
    expect((await getWorkflowTrace(task.code, 'dmc-implementation')).instance.active).not.toEqual(
      chain.instance.active,
    );
  });
});
