/**
 * 页面的 loader（只在服务端导入）：待办、我发起的、能发起的流程、实例详情。页面里用 src/client.ts 的 usePageData 取
 */
import type { VariableDeclaration } from '@zerodep-dev/flow-ts-model';
import { defineLoaders } from '@zerodep-dev/vue-tsx-pro-kit';
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
  // 发布过的流程（含设计器里刚发布的）：每个流程最新的启用版本
  '/start': async () =>
    (await engine.query.processes()).map((p) => ({
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
      definition: detail.definition,
      // 走过的节点与连线：流转记录里离开过的
      done: [
        ...new Set(
          detail.events
            .filter((e) => e.type === 'node.left')
            .flatMap((e) => [e.node, e.edge])
            .filter((id): id is string => id !== null),
        ),
      ],
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
