/**
 * 假接口：流程（后端自研引擎的接口在这里先演示）。流程定义、一张卡的流程轨迹、收件箱的各个页签，
 * 待办与流程实例的操作；命令经 db.run 执行，执行完回写任务卡。读收件箱前先处理到期（超时自动完成、没人认领转指定）
 */
import { http, HttpResponse } from 'msw';
import { taskCompletionProblem } from '../../domain/task/workflow';
import { processDefinitions } from '../../domain/workflow';
import { taskProcess } from '../../domain/workflow/task';
import { inboxItems, inboxViews, type InboxView } from '../../domain/workflow/inbox';
import type { MockDatabase } from '../db';
import { actorOf, attempt, bodyOf, fail, latency, route } from '../respond';
import { WorkflowError } from '../workflow/engine';
import type { CompleteInput } from '../workflow/engine';

/** 流程的路由 */
export const workflowHandlers = (db: MockDatabase) => {
  const viewerOf = (request: Request) => db.viewer(actorOf(request));

  return [
    http.get(route('workflowDefinitions'), () => HttpResponse.json(processDefinitions)),
    http.get(route('workflowTrace'), async ({ request }) => {
      await latency();
      const params = new URL(request.url).searchParams;
      const instance = db.workflow.instanceFor(
        params.get('businessKey') ?? '',
        params.get('key') ?? undefined,
      );
      if (!instance) return fail(404, '这张卡还没有流程');
      return HttpResponse.json({
        instance,
        events: db.workflow.eventsOf(instance.id),
        items: db.workflow.itemsOf(instance.id),
      });
    }),
    http.get(route('workItems'), async ({ request }) => {
      await latency();
      db.run((engine) => engine.tick());
      const params = new URL(request.url).searchParams;
      const view = (params.get('view') ?? 'mine') as InboxView;
      if (!inboxViews.includes(view)) return fail(400, `没有 ${view} 这个页签`);
      const viewer = viewerOf(request);
      const { items, instances } = db.tables.workflow;
      return HttpResponse.json({
        items: inboxItems(items, instances, viewer, view),
        counts: Object.fromEntries(
          inboxViews.map((name) => [name, inboxItems(items, instances, viewer, name).length]),
        ),
      });
    }),
    http.post(route('workItemAction'), async ({ request, params }) => {
      await latency();
      const id = String(params.id);
      const actor = actorOf(request);
      const body = await bodyOf<
        CompleteInput & { reason: string; assignee: string; comment: string }
      >(request);
      return attempt(() => {
        const item = db.run((engine) => {
          switch (params.action) {
            case 'claim':
              return engine.claim(id, actor);
            case 'release':
              return engine.release(id, actor, body.reason ?? '');
            case 'designate':
              return engine.designate(id, actor, body.assignee ?? '');
            case 'reassign':
              return engine.requestReassign(id, actor, body.reason ?? '');
            case 'complete': {
              // 任务池的节点：先过业务检查（差额归因、关闭三材料）
              const item = engine.item(id);
              const instance = engine.instance(item.instanceId);
              const task =
                instance.key === taskProcess.key ? db.task(instance.businessKey) : undefined;
              const problem =
                task &&
                taskCompletionProblem(task, {
                  node: item.node,
                  outcome: body.outcome ?? '',
                  variables: { ...instance.variables, ...body.variables },
                });
              if (problem) throw new WorkflowError('invalid', problem);
              return engine.complete(id, actor, {
                outcome: body.outcome ?? '',
                comment: body.comment,
                attachments: body.attachments,
                variables: body.variables,
              });
            }
            case 'remind':
              engine.remind(id, actor, body.comment ?? '');
              return engine.item(id);
            default:
              return null;
          }
        });
        return item ? HttpResponse.json(item) : fail(404, `没有 ${String(params.action)} 这个操作`);
      });
    }),
    http.post(route('instanceAction'), async ({ request, params }) => {
      await latency();
      const id = String(params.id);
      const actor = actorOf(request);
      const body = await bodyOf<{ reason: string; text: string; attachments: string[] }>(request);
      return attempt(() => {
        const instance = db.run((engine) => {
          switch (params.action) {
            case 'comment':
              engine.comment(id, actor, body.text ?? '', body.attachments ?? []);
              return engine.instance(id);
            case 'suspend':
              return engine.suspend(id, actor, body.reason ?? '');
            case 'resume':
              return engine.resume(id, actor);
            case 'terminate':
              return engine.terminate(id, actor, body.reason ?? '');
            default:
              return null;
          }
        });
        return instance
          ? HttpResponse.json(instance)
          : fail(404, `没有 ${String(params.action)} 这个操作`);
      });
    }),
  ];
};
