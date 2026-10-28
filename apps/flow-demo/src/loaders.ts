/**
 * 页面的 loader（只在服务端导入）：待办、我发起的、能发起的流程、实例详情。页面里用 src/client.ts 的 usePageData 取
 */
import type { VariableDeclaration } from '@zerodep-dev/flow-ts-model';
import { defineLoaders } from './framework/data.ts';
import { processes } from './processes.ts';
import { currentActor } from './server/context.ts';
import { engine } from './server/flow.ts';

export const loaders = defineLoaders({
  '/': async () => {
    const actor = currentActor();
    const [todo, started] = await Promise.all([
      engine.query.todo(actor),
      engine.query.started(actor),
    ]);
    return {
      todo: todo.map((item) => ({
        id: item.id,
        instanceId: item.instanceId,
        node: item.nodeName,
        title: item.title,
        claimable: item.assignee === null,
      })),
      started: started.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        result: i.result,
      })),
    };
  },
  '/start': () =>
    processes.map((p) => ({
      key: p.key as string,
      name: p.name as string,
      variables: (p.variables as readonly VariableDeclaration[]).map((v) => ({
        name: v.name,
        type: v.type,
        label: v.label ?? v.name,
      })),
    })),
  '/instances/:id': async ({ params }) => {
    const actor = currentActor();
    const id = Number(params['id']);
    const detail = await engine.query.instance(id);
    const open = detail.workItems.filter((w) => w.state === 'open');
    const mine = [];
    for (const item of open) {
      const view = await engine.query.workItem(item.id, actor);
      if (view.completable)
        mine.push({
          id: item.id,
          node: item.nodeName,
          claimable: view.claimable,
          outcomes: view.outcomes.map((o) => ({
            key: o.key,
            label: o.label,
            comment: o.comment === 'required',
          })),
        });
    }
    return {
      instance: {
        id,
        title: detail.instance.title,
        status: detail.instance.status,
        result: detail.instance.result,
        startedBy: detail.instance.startedBy,
        variables: detail.instance.variables,
      },
      current: detail.current,
      timeline: detail.events
        .filter((e) =>
          [
            'instance.started',
            'workItem.created',
            'workItem.completed',
            'workItem.claimed',
            'instance.finished',
            'instance.withdrawn',
          ].includes(e.type),
        )
        .map((e) => ({
          type: e.type,
          node: e.node,
          actor: e.actor,
          outcome: e.outcome,
          comment: e.comment,
          at: e.at.toISOString(),
        })),
      actions: mine,
      withdrawable: detail.instance.startedBy === actor.id && detail.instance.status === 'active',
    };
  },
});
