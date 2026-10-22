/**
 * 假接口：任务卡的台账查询、读写、删除，与任务池流程的衔接（新建时发起流程、删除时终止、
 * 推进 / 暂停 / 恢复 / 终止都经流程实例，任务状态按流程节点回写）
 */
import { http, HttpResponse } from 'msw';
import { decodeTask, type Wire } from '../../api/wire';
import { can, type Action } from '../../domain/permissions';
import { nextTaskCode } from '../../domain/task/code';
import { nextStepOf } from '../../domain/task/lifecycle';
import {
  blankLedgerQuery,
  queryLedger,
  type LedgerQuery,
  type LedgerRequest,
} from '../../domain/task/query';
import { canClose, isFinished } from '../../domain/task/status';
import type { CostKind, CostTask, TaskStatus } from '../../domain/task/types';
import { taskProcess } from '../../domain/workflow/task';
import type { MockDatabase } from '../db';
import { actorOf, attempt, bodyOf, fail, latency, route } from '../respond';
import { advanceTaskTo, taskInstance } from '../workflow/task-flow';

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
  /** 当前用户能不能做；不能时给出 403 的响应 */
  const denied = (request: Request, action: Action, what: string) => {
    const roles = db.master.people.find((person) => person.id === actorOf(request))?.roles ?? [];
    return can(roles, action) ? null : fail(403, `你的角色不能${what}`);
  };
  /** 取任务卡；没有时给出 404 的响应 */
  const found = (code: unknown) => {
    const task = db.task(String(code));
    return task ? { task } : { error: fail(404, `没有找到项目 ${String(code)}`) };
  };
  /** 给任务卡发起任务池流程：从“建任务卡”开始，进 PEMO 收件箱 */
  const startFlow = (task: CostTask, actor: string) =>
    db.run((engine) =>
      engine.start({
        key: taskProcess.key,
        businessKey: task.code,
        title: task.name,
        actor,
        variables: { owner: task.owner, kind: task.kind, verifyDue: task.due },
      }),
    );
  /** 任务卡的流程实例（老数据没有时补上） */
  const instanceOf = (task: CostTask, actor: string) =>
    taskInstance(db.workflow, task.code) ?? startFlow(task, actor);

  return [
    http.get(route('tasks'), async ({ request }) => {
      await latency();
      return HttpResponse.json(queryLedger(db.tables.tasks, ledgerRequestOf(new URL(request.url))));
    }),
    http.post(route('tasks'), async ({ request }) => {
      await latency();
      const blocked = denied(request, 'task.create', '新建任务');
      if (blocked) return blocked;
      const task = decodeTask((await request.json()) as Wire<CostTask>);
      const code = nextTaskCode(
        db.tables.tasks.map((item) => item.code),
        task.kind,
        task.year,
        teamCode(task.team),
      );
      const created: CostTask = { ...task, code, status: 'pending' };
      db.saveTask(created);
      startFlow(created, actorOf(request));
      return HttpResponse.json(db.task(code), { status: 201 });
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
      const blocked = denied(request, 'task.edit', '编辑任务');
      if (blocked) return blocked;
      const task = decodeTask((await request.json()) as Wire<CostTask>);
      if (task.code !== params.code) return fail(400, '地址与内容里的项目编码不一致');
      const existing = db.task(task.code);
      // 状态由流程决定：编辑只改信息表字段；不存在时是撤销删除，重新发起流程
      db.saveTask(existing ? { ...task, status: existing.status } : { ...task, status: 'pending' });
      if (!existing) startFlow(task, actorOf(request));
      return HttpResponse.json(db.task(task.code));
    }),
    http.delete(route('task'), async ({ request, params }) => {
      await latency();
      const blocked = denied(request, 'task.delete', '删除任务');
      if (blocked) return blocked;
      const { task, error } = found(params.code);
      if (error) return error;
      if (task.status !== 'pending')
        return fail(409, '只有待启动的项目可以删除；已经开始的请用“终止”');
      return attempt(() => {
        const instance = taskInstance(db.workflow, task.code);
        if (instance && instance.status === 'active')
          db.run((engine) => engine.terminate(instance.id, actorOf(request), '删除待启动的项目'));
        db.removeTask(task.code);
        return HttpResponse.json(task);
      });
    }),
    http.post(route('taskAdvance'), async ({ request, params }) => {
      await latency();
      const blocked = denied(request, 'task.advance', '推进任务');
      if (blocked) return blocked;
      const { task, error } = found(params.code);
      if (error) return error;
      const { next } = await bodyOf<{ next: TaskStatus }>(request);
      // 状态只进不跳：只能推进到当前状态的下一步；关闭须三材料齐全
      if (!next || nextStepOf(task)?.next !== next)
        return fail(409, `${task.code} 现在不能推进到这个状态，请刷新后再试`);
      if (next === 'closed' && !canClose(task))
        return fail(409, '关闭须验证窗结论、收益认定意见、商务谈定记录三项齐全');
      const actor = actorOf(request);
      return attempt(() => {
        const instance = instanceOf(task, actor);
        db.run((engine) =>
          task.status === 'paused'
            ? engine.resume(instance.id, actor)
            : advanceTaskTo(engine, task, next, actor),
        );
        return HttpResponse.json(db.task(task.code));
      });
    }),
    http.post(route('taskPause'), async ({ request, params }) => {
      await latency();
      const blocked = denied(request, 'task.pause', '暂停任务');
      if (blocked) return blocked;
      const { task, error } = found(params.code);
      if (error) return error;
      if (isFinished(task) || task.status === 'paused')
        return fail(409, `${task.code} 已结束或已暂停`);
      const actor = actorOf(request);
      const { reason } = await bodyOf<{ reason: string }>(request);
      return attempt(() => {
        const instance = instanceOf(task, actor);
        db.run((engine) => engine.suspend(instance.id, actor, reason || '暂停（未写原因）'));
        return HttpResponse.json(db.task(task.code));
      });
    }),
    http.post(route('taskTerminate'), async ({ request, params }) => {
      await latency();
      const blocked = denied(request, 'task.terminate', '终止任务');
      if (blocked) return blocked;
      const { task, error } = found(params.code);
      if (error) return error;
      if (isFinished(task)) return fail(409, `${task.code} 已经结束`);
      const actor = actorOf(request);
      const { reason } = await bodyOf<{ reason: string }>(request);
      return attempt(() => {
        const instance = instanceOf(task, actor);
        db.run((engine) => engine.terminate(instance.id, actor, reason || '终止（未写原因）'));
        return HttpResponse.json(db.task(task.code));
      });
    }),
  ];
};
