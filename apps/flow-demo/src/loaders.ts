/**
 * 页面的 loader（只在服务端导入）：待办、我发起的、能发起的流程、实例详情。页面里用 src/client.ts 的 usePageData 取
 */
import { FlowInstance } from '@zerodep-dev/flow-ts-engine';
import type { ProcessDefinition, VariableDeclaration } from '@zerodep-dev/flow-ts-model';
import { defineLoaders } from '@zerodep-dev/vue-tsx-pro-kit';
import { currentActor, USERS } from './server/context.ts';
import { engine } from './server/flow.ts';

/** 流转记录里的人：示例的用户表里有名字的用名字 */
const nameOf = (id: string | null) => (id ? (USERS[id]?.name ?? id) : '系统');

/** 日期部分（YYYY-MM-DD，UTC）：时限标记按天算，服务端与浏览器用同一个“今天” */
const dayOf = (date: Date) => date.toISOString().slice(0, 10);

/** 节点的名字、按钮的名字（记录里存的是标识） */
function namesOf(definition: ProcessDefinition) {
  const node = (id: string) => definition.nodes.find((n) => n.id === id);
  return {
    node: (id: string) => node(id)?.name ?? id,
    outcome: (id: string, key: string) => {
      const found = node(id);
      return found?.type === 'task'
        ? (found.outcomes.find((o) => o.key === key)?.label ?? key)
        : key;
    },
  };
}

export const loaders = defineLoaders({
  '/': async () => {
    const actor = currentActor();
    const [todo, started] = await Promise.all([
      engine.query.todo(actor),
      engine.query.started(actor),
    ]);
    return {
      today: dayOf(new Date()),
      todo: todo.map((item) => ({
        id: item.id,
        instanceId: item.instanceId,
        node: item.nodeName,
        title: item.title,
        claimable: item.assignee === null,
        due: item.dueAt && dayOf(item.dueAt),
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
            reject: o.kind === 'reject',
          })),
        });
    }
    const names = namesOf(detail.definition);
    // 会签：参与人各一份待办，列出每个人处理了没有、选了什么（只看最近一轮）
    const multiNodes = detail.definition.nodes.filter((n) => n.type === 'task' && n.multi);
    const signs = multiNodes
      .map((node) => {
        const items = detail.workItems.filter((w) => w.node === node.id);
        const round = Math.max(0, ...items.map((w) => w.round));
        return {
          node: node.name,
          people: items
            .filter((w) => w.round === round && w.state !== 'canceled')
            .map((w) => {
              const done = detail.events.findLast(
                (e) =>
                  e.type === 'workItem.completed' && e.node === node.id && e.actor === w.assignee,
              );
              return {
                id: w.id,
                name: nameOf(w.assignee),
                state: w.state,
                outcome:
                  w.state === 'done' && done?.outcome ? names.outcome(node.id, done.outcome) : null,
              };
            }),
        };
      })
      .filter((sign) => sign.people.length > 0);
    // 调用流程：上级实例与发起的子实例
    const parentId = detail.instance.parentId;
    const parent = parentId === null ? null : await engine.query.instance(parentId);
    const children = await engine.db
      .queryable(FlowInstance)
      .where((i) => [i.parentId.eq(id)])
      .toList();
    return {
      // 留言的相对时间按它算：服务端与浏览器一致
      now: Date.now(),
      instance: {
        id,
        title: detail.instance.title,
        status: detail.instance.status,
        result: detail.instance.result,
        startedBy: detail.instance.startedBy,
        variables: detail.instance.variables,
      },
      current: detail.current,
      today: dayOf(new Date()),
      // 正在处理的待办的时限（同一节点取最早的）
      due:
        detail.workItems
          .filter((w) => w.state === 'open' && w.dueAt)
          .map((w) => dayOf(w.dueAt!))
          .sort()[0] ?? null,
      signs,
      parent: parent && { id: parent.instance.id, title: parent.instance.title },
      children: children.map((child) => ({
        id: child.id,
        title: child.title,
        status: child.status,
        result: child.result,
      })),
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
          node: e.node && names.node(e.node),
          actor: nameOf(e.actor),
          outcome: e.outcome && (e.node ? names.outcome(e.node, e.outcome) : e.outcome),
          comment: e.comment,
          at: e.at.toISOString(),
        })),
      comments: detail.events
        .filter((e) => e.type === 'instance.commented')
        .map((e, index) => ({
          id: String(index),
          author: nameOf(e.actor),
          content: e.comment ?? '',
          time: e.at.toISOString(),
        })),
      actions: mine,
      withdrawable: detail.instance.startedBy === actor.id && detail.instance.status === 'active',
    };
  },
});
