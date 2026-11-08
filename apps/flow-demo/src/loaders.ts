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

/** 事件里记的“给了谁”（转办、改派的 to 是一个人，抄送的是几个人）：写成名字 */
function targetsOf(data: Readonly<Record<string, unknown>> | null): string | null {
  const to = data?.['to'];
  const ids = Array.isArray(to) ? to : typeof to === 'string' ? [to] : [];
  return ids.length ? ids.map((id) => nameOf(String(id))).join('、') : null;
}

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
  // 工作台：待办、已办、抄送我的、我发起的；流程名与结果的文字按各流程最新的定义
  '/': async () => {
    const actor = currentActor();
    const [todo, done, cc, started, processes] = await Promise.all([
      engine.query.todo(actor),
      engine.query.done(actor),
      engine.query.cc(actor),
      engine.query.started(actor),
      engine.query.processes(),
    ]);
    const byKey = new Map(processes.map((p) => [p.key as string, p]));
    const processName = (key: string) => byKey.get(key)?.name ?? key;
    const outcomeLabel = (key: string, node: string, outcome: string) => {
      const definition = byKey.get(key);
      return definition ? namesOf(definition).outcome(node, outcome) : outcome;
    };
    return {
      today: dayOf(new Date()),
      processes: processes.map((p) => ({ value: p.key as string, label: p.name as string })),
      todo: todo.map((item) => ({
        id: item.id,
        instanceId: item.instanceId,
        processKey: item.processKey,
        process: processName(item.processKey),
        node: item.nodeName,
        title: item.title,
        claimable: item.assignee === null,
        due: item.dueAt && dayOf(item.dueAt),
      })),
      done: done.map((item) => ({
        id: item.id,
        instanceId: item.instanceId,
        processKey: item.processKey,
        process: processName(item.processKey),
        node: item.nodeName,
        title: item.title,
        outcome: item.outcome && outcomeLabel(item.processKey, item.node, item.outcome),
        completedAt: item.completedAt?.toISOString() ?? null,
        instanceStatus: item.instanceStatus,
      })),
      cc: cc.map((item) => ({
        id: item.id,
        instanceId: item.instanceId,
        processKey: item.processKey,
        process: processName(item.processKey),
        title: item.title,
        sender: item.sender ? nameOf(item.sender) : null,
        message: item.message,
        at: item.at.toISOString(),
        unread: item.readAt === null,
        status: item.status,
      })),
      started: started.map((i) => ({
        id: i.id,
        processKey: i.processKey,
        process: processName(i.processKey),
        title: i.title,
        status: i.status,
        result: i.result,
      })),
    };
  },
  // 设计页：调用流程时能选的流程（已发布的）
  '/design': async () =>
    (await engine.query.processes()).map((p) => ({
      value: p.key as string,
      label: p.name as string,
    })),
  // 异常作业（管理员）：重试用完还失败的作业，能跳过的带上能选的结果
  '/incidents': async () =>
    (await engine.query.incidents()).map((incident) => ({
      ...incident,
      outcomes: [...incident.outcomes],
    })),
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
    // 打开了就算看过：抄送给我的这张标成已读
    await engine.readCc(id, actor);
    const detail = await engine.query.instance(id);
    const open = detail.workItems.filter((w) => w.state === 'open');
    const mine = [];
    // 能处理时单据按这一步的表单权限显示（隐藏的不列、能改的可编辑）；只是来看的显示全部字段
    let fields: Awaited<ReturnType<typeof engine.query.workItem>>['fields'] | null = null;
    for (const item of open) {
      const view = await engine.query.workItem(item.id, actor);
      if (view.completable) fields ??= view.fields;
      if (view.completable)
        mine.push({
          id: item.id,
          node: item.nodeName,
          claimable: view.claimable,
          transferable: view.operations.some((o) => o.name === 'transfer'),
          outcomes: view.outcomes.map((o) => ({
            key: o.key,
            label: o.label,
            comment: o.comment === 'required',
            reject: o.kind === 'reject',
            // 退回到运行时选的节点：处理时先选退回到哪
            choose: o.kind === 'return' && o.target === 'choose',
            targets: o.targets.map((t) => ({ node: t.node, name: t.nodeName })),
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
      fields:
        fields?.map((field) => ({ ...field, value: field.value as string | number | null })) ??
        null,
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
            'workItem.transferred',
            'workItem.reassigned',
            'workItem.reminded',
            'workItem.overdue',
            'instance.cc',
            'instance.suspended',
            'instance.resumed',
            'instance.jumped',
            'job.failed',
            'job.skipped',
          ].includes(e.type),
        )
        .map((e) => ({
          type: e.type,
          node: e.node && names.node(e.node),
          actor: nameOf(e.actor),
          outcome: e.outcome && (e.node ? names.outcome(e.node, e.outcome) : e.outcome),
          // 转办、改派、抄送给了谁；跳转跳到哪个节点
          target:
            e.type === 'instance.jumped' ? names.node(String(e.data?.['to'])) : targetsOf(e.data),
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
      // 催办：发起人或管理员，实例进行中、还有开着的待办
      remindable:
        (detail.instance.startedBy === actor.id || !!actor.admin) &&
        detail.instance.status === 'active' &&
        open.length > 0,
      // 管理员：暂停、恢复、终止、跳转（能跳到的节点）、改派（开着的待办）
      admin: actor.admin
        ? {
            nodes: detail.definition.nodes
              .filter((node) => node.type !== 'start')
              .map((node) => ({ value: node.id, label: node.name })),
            openItems: open.map((w) => ({
              value: String(w.id),
              label: `${w.nodeName} · ${w.assignee ? nameOf(w.assignee) : '收件箱'}`,
            })),
          }
        : null,
      // 转办、抄送时选人：示例的用户表（除了自己）
      people: Object.values(USERS)
        .filter((user) => user.id !== actor.id)
        .map((user) => ({ value: user.id, label: user.name })),
    };
  },
});
