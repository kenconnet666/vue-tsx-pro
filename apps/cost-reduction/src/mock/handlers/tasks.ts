/** 假接口：任务卡的台账查询、读写、删除、推进与异常状态 */
import { http, HttpResponse } from 'msw';
import { decodeTask, type Wire } from '../../api/wire';
import { advanceTask, nextStepOf } from '../../domain/task/lifecycle';
import { nextTaskCode } from '../../domain/task/code';
import {
  blankLedgerQuery,
  queryLedger,
  type LedgerQuery,
  type LedgerRequest,
} from '../../domain/task/query';
import { isFinished } from '../../domain/task/status';
import type { CostKind, CostTask, TaskStatus } from '../../domain/task/types';
import type { MockDatabase } from '../db';
import { bodyOf, fail, latency, route } from '../respond';

/** 地址的查询参数 → 台账的请求（sort=-key 是倒序；没给的条件是 null） */
function ledgerRequestOf(url: URL): LedgerRequest {
  const params = url.searchParams;
  const filters = blankLedgerQuery();
  for (const key of Object.keys(filters) as (keyof LedgerQuery)[]) {
    const value = params.get(key);
    if (value != null) (filters as unknown as Record<string, string>)[key] = value;
  }
  const sort = params.get('sort');
  return {
    kind: (params.get('kind') ?? 'unit') as CostKind,
    view: params.get('view') ?? 'all',
    filters,
    sort: sort
      ? sort.startsWith('-')
        ? { key: sort.slice(1), direction: 'descending' }
        : { key: sort, direction: 'ascending' }
      : null,
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: Math.max(1, Number(params.get('pageSize')) || 20),
  };
}

/** 任务卡的路由 */
export const taskHandlers = (db: MockDatabase) => {
  const teamCode = (team: string) =>
    db.master.teams.find((item) => item.name === team)?.code ?? 'ZT';
  /** 取任务卡；没有时给出 404 的响应 */
  const found = (code: unknown) => {
    const task = db.task(String(code));
    return task ? { task } : { error: fail(404, `没有找到项目 ${String(code)}`) };
  };

  return [
    http.get(route('tasks'), async ({ request }) => {
      await latency();
      return HttpResponse.json(queryLedger(db.tables.tasks, ledgerRequestOf(new URL(request.url))));
    }),
    http.post(route('tasks'), async ({ request }) => {
      await latency();
      const task = decodeTask((await request.json()) as Wire<CostTask>);
      const code = nextTaskCode(
        db.tables.tasks.map((item) => item.code),
        task.kind,
        task.year,
        teamCode(task.team),
      );
      const created = { ...task, code };
      db.saveTask(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    // 写在 /tasks/:code 前面：否则 selection 会被当成编号
    http.get(route('taskSelection'), ({ request }) => {
      const codes = new URL(request.url).searchParams.getAll('codes');
      return HttpResponse.json(codes.flatMap((code) => db.task(code) ?? []));
    }),
    http.get(route('task'), async ({ params }) => {
      await latency();
      const { task, error } = found(params.code);
      return error ?? HttpResponse.json(task);
    }),
    http.put(route('task'), async ({ request, params }) => {
      await latency();
      const task = decodeTask((await request.json()) as Wire<CostTask>);
      if (task.code !== params.code) return fail(400, '地址与内容里的项目编码不一致');
      db.saveTask(task);
      return HttpResponse.json(task);
    }),
    http.delete(route('task'), async ({ params }) => {
      await latency();
      const { task, error } = found(params.code);
      if (error) return error;
      if (task.status !== 'pending')
        return fail(409, '只有待启动的项目可以删除；已经开始的请用“终止”');
      db.removeTask(task.code);
      return HttpResponse.json(task);
    }),
    http.post(route('taskAdvance'), async ({ request, params }) => {
      await latency();
      const { task, error } = found(params.code);
      if (error) return error;
      const { next } = await bodyOf<{ next: TaskStatus }>(request);
      // 状态只进不跳：只能推进到当前状态的下一步
      if (!next || nextStepOf(task)?.next !== next)
        return fail(409, `${task.code} 现在不能推进到这个状态，请刷新后再试`);
      const advanced = advanceTask(task, next);
      db.saveTask(advanced);
      return HttpResponse.json(advanced);
    }),
    http.post(route('taskPause'), async ({ params }) => {
      await latency();
      const { task, error } = found(params.code);
      if (error) return error;
      if (isFinished(task) || task.status === 'paused')
        return fail(409, `${task.code} 已结束或已暂停`);
      const paused: CostTask = { ...task, status: 'paused' };
      db.saveTask(paused);
      return HttpResponse.json(paused);
    }),
    http.post(route('taskTerminate'), async ({ params }) => {
      await latency();
      const { task, error } = found(params.code);
      if (error) return error;
      if (isFinished(task)) return fail(409, `${task.code} 已经结束`);
      const terminated: CostTask = { ...task, status: 'terminated' };
      db.saveTask(terminated);
      return HttpResponse.json(terminated);
    }),
  ];
};
