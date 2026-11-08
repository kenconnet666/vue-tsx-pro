/**
 * 查询：待办、已办、抄送、我发起的、查单据、实例与待办详情、发起视图、能发起的流程。
 */
import { and, not, or, type Ref } from '@zerodep-dev/easy-query-ts';
import {
  fieldStates,
  processGraph,
  formManifest,
  type ProcessDefinition,
  type TaskNode,
  type VariableDeclaration,
} from '@zerodep-dev/flow-ts-model';
import { actorTokens } from '../runtime/assignees.ts';
import { nextSteps, picksOf } from '../runtime/next-steps.ts';
import {
  FlowCc,
  FlowDefinition,
  FlowEvent,
  FlowInstance,
  FlowWorkItem,
  type flowSchema,
} from '../core/entities.ts';
import { FlowError } from '../core/errors.ts';
import { workItemSummary } from '../runtime/execution.ts';
import { availableOperations, excludeToken } from '../commands/operations.ts';
import { remindable, withdrawable } from '../commands/admin.ts';
import type { EngineCore } from '../core/context.ts';
import { stepsAfter } from '../runtime/next-steps.ts';
import { defaultsOf } from '../commands/start.ts';
import { outcomesFor, returnTargets } from '../commands/complete.ts';
import type { TodoItem, OutcomeView, WorkItemField } from '../views.ts';
import type { FlowEngine } from '../engine.ts';
import type { Actor, ListFilter } from '../types.ts';

type InstanceRef = Ref<typeof flowSchema, 'FlowInstance'>;

/** 发起的时刻在这段时间里、是这个流程的 */
const startedWithin = (i: InstanceRef, filter: ListFilter) => [
  ...(filter.processKey ? [i.processKey.eq(filter.processKey)] : []),
  ...(filter.from ? [i.startedAt.ge(new Date(filter.from))] : []),
  ...(filter.to ? [i.startedAt.le(new Date(filter.to))] : []),
];

/** 待办列表的列：待办加所属实例的流程与标题 */
const todoColumns = (
  w: any,
): Record<Exclude<keyof TodoItem, 'summary'> | 'definitionId' | 'variables', any> => ({
  id: w.id,
  instanceId: w.instanceId,
  node: w.node,
  nodeName: w.nodeName,
  round: w.round,
  state: w.state,
  assignment: w.assignment,
  assignee: w.assignee,
  arrival: w.arrival,
  createdAt: w.createdAt,
  dueAt: w.dueAt,
  completedAt: w.completedAt,
  outcome: w.outcome,
  processKey: w.instance.processKey,
  instanceStatus: w.instance.status,
  title: w.instance.title,
  definitionId: w.instance.definitionId,
  variables: w.instance.variables,
});

/** 待办详情的字段：变量当字段清单，按环节的表单权限算；不能处理时一律只读 */
function fieldsOf(
  definition: ProcessDefinition,
  task: TaskNode | undefined,
  variables: Readonly<Record<string, unknown>>,
  candidate: boolean,
): WorkItemField[] {
  const manifest = formManifest(definition);
  const states = fieldStates(manifest, {
    access: task?.form,
    read: (name) => variables[name.startsWith('form.') ? name.slice(5) : name],
  });
  return Object.entries(manifest).flatMap(([name, field]) => {
    const state = states.get(name);
    if (!state?.visible) return [];
    return [
      {
        name,
        label: field.label,
        type: field.type as VariableDeclaration['type'],
        value: variables[name] ?? null,
        editable: candidate && state.editable,
        required: candidate && state.required,
      },
    ];
  });
}

/** 查询：装进引擎核心（core.queries），别的模块经它调用 */
export function createQueries(core: EngineCore) {
  const {
    options,
    db,
    operations,
    definitionOf,
    isCandidate,
    execution,
    latestDefinition,
    itemsOf,
  } = core;

  /** 这个人经手过实例：发起的、待办落到他或他处理过、在他能认领的收件箱里、抄送给他 */
  const involves = (i: InstanceRef, actor: Actor) =>
    or(
      i.startedBy.eq(actor.id),
      i.id.in(
        db
          .queryable(FlowWorkItem)
          .where((w) =>
            or(
              w.assignee.eq(actor.id),
              w.completedBy.eq(actor.id),
              and(w.state.eq('open'), w.assignee.isNull(), w.candidates.hasAny(actorTokens(actor))),
            ),
          )
          .select((w) => w.instanceId),
      ),
      i.id.in(
        db
          .queryable(FlowCc)
          .where((c) => c.recipient.eq(actor.id))
          .select((c) => c.instanceId),
      ),
    );

  /** 列表行补上摘要列：按实例的定义里 summary 列出的字段取流程变量 */
  async function withSummary(rows: Record<string, any>[]): Promise<TodoItem[]> {
    const result: TodoItem[] = [];
    for (const { definitionId, variables, ...row } of rows) {
      const fields = (await definitionOf(db, definitionId as number)).summary ?? [];
      const values = variables as Record<string, unknown>;
      const summary = Object.fromEntries(
        fields.map((field) => [field, values[field.startsWith('form.') ? field.slice(5) : field]]),
      );
      result.push({ ...(row as Omit<TodoItem, 'summary'>), summary });
    }
    return result;
  }

  const query: FlowEngine['query'] = {
    incidents: (instance) => core.jobs.incidents(instance),
    processes: async () => {
      const rows = await db
        .queryable(FlowDefinition)
        .where((d) => d.enabled.eq(true))
        .orderBy((d) => [d.processKey, d.version.desc()])
        .toList();
      const latest = new Map<string, ProcessDefinition>();
      for (const row of rows)
        if (!latest.has(row.processKey)) latest.set(row.processKey, row.model);
      return [...latest.values()];
    },
    startView: async (key, actor) => {
      const row = await latestDefinition(db, key);
      const model = row.model;
      const startNode = model.nodes.find((node) => node.type === 'start');
      const values = defaultsOf(model);
      // 还没有实例：按发起人与默认值预测下一步
      const read = (field: string) => values[field.startsWith('form.') ? field.slice(5) : field];
      const next = startNode
        ? await nextSteps(
            {
              context: {
                instance: { id: 0, processKey: key, businessKey: null, startedBy: actor.id },
                variables: values,
                read,
                args: {},
              },
              handledBy: {},
              options,
              resolver: (name: string) => options.extensions?.resolvers?.[name],
              graph: processGraph(model),
              definition: model,
              previous: actor.id,
            },
            startNode.id,
            { read },
          )
        : [];
      return {
        process: { key, name: model.name, version: row.version },
        manifest: formManifest(model),
        access: startNode?.type === 'start' ? (startNode.form ?? null) : null,
        values,
        next,
        picks: picksOf(next),
      };
    },
    workItem: async (id, actor) => {
      const workItem = await db.queryable(FlowWorkItem).find(id);
      if (!workItem) throw new FlowError('not-found', `没有待办 ${id}`);
      const instance = await db.queryable(FlowInstance).findOrThrow(workItem.instanceId);
      const definition = await definitionOf(db, instance.definitionId);
      const node = definition.nodes.find((n) => n.id === workItem.node);
      const task = node?.type === 'task' ? node : undefined;
      const open = workItem.state === 'open' && instance.status === 'active';
      const candidate = open && isCandidate(workItem, actor);
      const graph = processGraph(definition);
      // 暂存只给处理人看：别人看到的待办没有它，字段显示存着的值
      const draft = workItem.assignee === actor.id ? workItem.draft : null;
      // 能处理的人才看到各个结果之后要给谁选处理人
      const exec = task && candidate ? await execution(db, definition, instance, actor) : undefined;
      const outcomes: OutcomeView[] = [];
      for (const outcome of task ? outcomesFor(task, workItem) : []) {
        const next = exec ? await stepsAfter(options, exec, task!, outcome, actor.id) : [];
        const chooses = exec && outcome.kind === 'return' && outcome.target === 'choose';
        const targets = chooses
          ? returnTargets({ definition, graph, state: instance.state }, workItem.node).map(
              (id) => ({
                node: id,
                nodeName: graph.node(id)?.name ?? id,
                handler: instance.state.handledBy[id] ?? null,
              }),
            )
          : [];
        outcomes.push({ ...outcome, next, picks: picksOf(next), targets });
      }
      return {
        workItem: { ...workItem, draft },
        draft,
        instance,
        outcomes,
        claimable: candidate && workItem.assignee === null,
        completable: candidate,
        operations: task
          ? availableOperations(operations, {
              item: workItem,
              node: task,
              instance,
              actor,
              candidate: isCandidate(workItem, actor),
              items: await itemsOf(db, instance.id),
            })
          : [],
        fields: fieldsOf(
          definition,
          task,
          { ...instance.variables, ...(draft?.values ?? {}) },
          candidate,
        ),
      };
    },
    started: (actor, filter = {}) =>
      db
        .queryable(FlowInstance)
        .where((i) => [i.startedBy.eq(actor.id), i.status.ne('draft'), ...startedWithin(i, filter)])
        .orderBy((i) => i.id.desc())
        .toList(),
    search: async (actor, filter = {}) => {
      const scope = filter.scope ?? 'involved';
      if (scope === 'all' && !actor.admin)
        throw new FlowError('forbidden', '只有管理员能查全部单据');
      const text = filter.text?.trim();
      const status = filter.status?.length ? [...filter.status] : undefined;
      return db
        .queryable(FlowInstance)
        .where((i) => [
          status ? i.status.in(status) : i.status.ne('draft'),
          ...(scope === 'started' ? [i.startedBy.eq(actor.id)] : []),
          ...(scope === 'involved' ? [involves(i, actor)] : []),
          ...(text
            ? [
                or(
                  i.title.like(text, { ignoreCase: true }),
                  i.businessKey.like(text, { ignoreCase: true }),
                ),
              ]
            : []),
          ...startedWithin(i, filter),
        ])
        .orderBy((i) => i.id.desc())
        .toPage(Math.max(1, filter.page ?? 1), Math.min(200, Math.max(1, filter.size ?? 20)));
    },
    cc: (actor) =>
      db
        .queryable(FlowCc)
        .where((c) => c.recipient.eq(actor.id))
        .orderBy((c) => [c.readAt.isNull().desc(), c.id.desc()])
        .select((c) => ({
          id: c.id,
          instanceId: c.instanceId,
          node: c.node,
          recipient: c.recipient,
          sender: c.sender,
          message: c.message,
          at: c.at,
          readAt: c.readAt,
          processKey: c.instance.processKey,
          title: c.instance.title,
          status: c.instance.status,
        }))
        .toList(),
    todo: (actor) =>
      db
        .queryable(FlowWorkItem)
        .where((w) => [
          w.state.eq('open'),
          or(
            w.assignee.eq(actor.id),
            and(
              w.assignee.isNull(),
              w.candidates.hasAny(actorTokens(actor)),
              not(w.candidates.has(excludeToken(actor.id))),
            ),
          ),
        ])
        .orderBy((w) => w.id)
        .select(todoColumns)
        .toList()
        .then(withSummary),
    done: (actor, filter = {}) =>
      db
        .queryable(FlowWorkItem)
        .where((w) => [
          w.state.eq('done'),
          w.completedBy.eq(actor.id),
          ...(filter.processKey ? [w.instance.processKey.eq(filter.processKey)] : []),
          ...(filter.from ? [w.completedAt.ge(new Date(filter.from))] : []),
          ...(filter.to ? [w.completedAt.le(new Date(filter.to))] : []),
        ])
        .orderBy((w) => w.id.desc())
        .select(todoColumns)
        .toList()
        .then(withSummary),
    designations: (actor) =>
      db
        .queryable(FlowWorkItem)
        .where((w) => [
          w.state.eq('open'),
          w.awaitingDesignation.eq(true),
          w.designator.eq(actor.id),
        ])
        .orderBy((w) => w.id)
        .select(todoColumns)
        .toList()
        .then(withSummary),
    instance: async (id, actor) => {
      const instance = await db.queryable(FlowInstance).find(id);
      if (!instance) throw new FlowError('not-found', `没有实例 ${id}`);
      if (
        actor &&
        !actor.admin &&
        !(await db
          .queryable(FlowInstance)
          .where((i) => [i.id.eq(id), involves(i, actor)])
          .any())
      )
        throw new FlowError('forbidden', `实例 ${id} 不是你经手的`);
      const items = await db
        .queryable(FlowWorkItem)
        .where((w) => w.instanceId.eq(id))
        .orderBy((w) => w.id)
        .toList();
      const events = await db
        .queryable(FlowEvent)
        .where((e) => e.instanceId.eq(id))
        .orderBy((e) => e.id)
        .toList();
      const definition = await definitionOf(db, instance.definitionId);
      const nodes = definition.nodes;
      const current = instance.current.map((node) => ({
        node,
        name: nodes.find((n) => n.id === node)?.name ?? node,
      }));
      const active = instance.status === 'active';
      const starter = actor?.id === instance.startedBy;
      const actions = {
        withdraw: active && starter && withdrawable(definition, items, instance.startedBy),
        remind:
          active &&
          (starter || actor?.admin === true) &&
          items.some((w) => w.state === 'open' && remindable(definition, w.node)),
        manage: actor?.admin === true && ['active', 'suspended'].includes(instance.status),
      };
      return {
        instance,
        definition,
        current,
        workItems: items.map(workItemSummary),
        events,
        actions,
      };
    },
  };

  return { withSummary, query };
}

/** createQueries 给出的函数 */
export type Queries = ReturnType<typeof createQueries>;
