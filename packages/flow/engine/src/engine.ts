/**
 * 流程引擎（docs/decisions/0001 第 5 节）：一个入口 run(command, actor)，每个命令一个事务，第一条语句锁住实例行；
 * 查询（待办、已办、实例详情）与作业（定时、异步的自动节点）也在这里。
 *
 *   const engine = createFlowEngine({ adapter: sqlite(new DatabaseSync('flow.db')), org, extensions });
 *   await engine.createTables();
 *   await engine.publish(purchase);
 *   const { workItems } = await engine.run({ type: 'start', process: 'purchase', variables: { amount: 120 } }, alice);
 *   await engine.run({ type: 'complete', workItem: workItems[0].id, outcome: 'approve' }, bob);
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { and, createDb, or, type Cond, type Row } from '@zerodep-dev/easy-query-ts';
import {
  gatewayPairs,
  isRef,
  validateProcess,
  type AssigneeSource,
  type CallNode,
  type Outcome,
  type ProcessDefinition,
  type TaskNode,
} from '@zerodep-dev/flow-ts-model';
import { decideCountersign } from './countersign.ts';
import {
  FlowCandidate,
  FlowCc,
  FlowDefinition,
  FlowEvent,
  FlowInstance,
  FlowJob,
  FlowWorkItem,
  flowSchema,
  type FlowDb,
} from './entities.ts';
import { FlowError } from './errors.ts';
import {
  dueAt,
  Execution,
  workItemSummary,
  type InstanceRow,
  type WorkItemRow,
} from './execution.ts';
import { emptyRunState } from './state.ts';
import type {
  Actor,
  FlowCommand,
  FlowEngineOptions,
  FlowEventView,
  RunResult,
  SignalInput,
  WorkItemSummary,
} from './types.ts';

/** 作业最多试几次（第一次加两次重试） */
const MAX_ATTEMPTS = 3;
/** 领到的作业锁多久：进程死掉后别的进程过了这段时间能接手 */
const LEASE_MS = 5 * 60_000;

/** 待办列表里的一行：待办加所属实例的标题、流程与摘要列（定义里 summary 列出的字段） */
export interface TodoItem extends WorkItemSummary {
  readonly processKey: string;
  readonly title: string | null;
  readonly summary: Readonly<Record<string, unknown>>;
}

/** 待办详情：待办、实例、能选的结果，这个人能不能认领、能不能处理 */
export interface WorkItemDetail {
  readonly workItem: WorkItemRow;
  readonly instance: InstanceRow;
  readonly outcomes: readonly Outcome[];
  readonly claimable: boolean;
  readonly completable: boolean;
}

/** 抄送列表里的一行 */
export interface CcItem {
  readonly id: number;
  readonly instanceId: number;
  /** 抄送节点；手动抄送时为空 */
  readonly node: string | null;
  readonly recipient: string;
  /** 谁抄送的；抄送节点时为空 */
  readonly sender: string | null;
  readonly message: string | null;
  readonly at: Date;
  readonly readAt: Date | null;
  readonly processKey: string;
  readonly title: string | null;
  readonly status: InstanceRow['status'];
}

/** 失败的作业（异常） */
export interface Incident {
  readonly jobId: number;
  readonly instanceId: number;
  readonly instanceTitle: string | null;
  readonly kind: string;
  readonly node: string | null;
  readonly nodeName: string | null;
  readonly attempts: number;
  readonly error: string | null;
  /** 异步动作能跳过（按选的结果往下走） */
  readonly skippable: boolean;
  /** 跳过时能选的结果 */
  readonly outcomes: readonly string[];
}

/** 实例详情 */
export interface InstanceDetail {
  readonly instance: InstanceRow;
  /** 实例按的那个版本的定义（画流程图） */
  readonly definition: ProcessDefinition;
  /** 正在处理的节点与名称 */
  readonly current: readonly { readonly node: string; readonly name: string }[];
  readonly workItems: readonly WorkItemSummary[];
  readonly events: readonly FlowEventView[];
}

/** 流程引擎 */
export interface FlowEngine {
  /** 建引擎的表（开发、测试；生产用自己的迁移脚本） */
  createTables(): Promise<void>;
  /** 发布一个版本：校验不过报 invalid-definition，details.problems 是问题列表 */
  publish(definition: ProcessDefinition, actor?: Actor): Promise<{ key: string; version: number }>;
  /** 执行一个命令 */
  run(command: FlowCommand, actor: Actor): Promise<RunResult>;
  /** 外部事件（对方盖章、付款到账）：在等它的实例往下走，返回这些实例的结果 */
  signal(input: SignalInput, actor: Actor): Promise<RunResult[]>;
  readonly query: {
    /** 我的待办：落到我的、我能认领的 */
    todo(actor: Actor): Promise<TodoItem[]>;
    /** 我处理过的 */
    done(actor: Actor): Promise<TodoItem[]>;
    /** 实例详情：实例、全部待办、流转记录 */
    instance(id: number): Promise<InstanceDetail>;
    /** 待办详情 */
    workItem(id: number, actor: Actor): Promise<WorkItemDetail>;
    /** 我发起的实例，新的在前 */
    started(actor: Actor): Promise<InstanceRow[]>;
    /** 抄送给我的，没读的在前 */
    cc(actor: Actor): Promise<CcItem[]>;
    /** 失败的作业（异常）；给实例时只看这个实例的 */
    incidents(instance?: number): Promise<Incident[]>;
  };
  /** 重试失败的作业 */
  retryJob(job: number, actor: Actor): Promise<boolean>;
  /** 把抄送给我的这个实例标成已读，返回标了几条 */
  readCc(instance: number, actor: Actor): Promise<number>;
  readonly jobs: {
    /** 执行到点的作业，返回执行了几个；Nitro 的定时任务或接入方自己定时调用 */
    runDue(options?: { limit?: number; worker?: string }): Promise<number>;
  };
  /** 引擎用的 Db（查询自己的表、和业务表做报表） */
  readonly db: FlowDb;
}

/** 建一个引擎 */
export function createFlowEngine(options: FlowEngineOptions): FlowEngine {
  const db = createDb({ schema: flowSchema, adapter: options.adapter });
  const now = () => options.clock?.() ?? new Date();
  const definitions = new Map<number, ProcessDefinition>();
  const running = new AsyncLocalStorage<FlowCommand>();

  async function definitionOf(tx: FlowDb, id: number): Promise<ProcessDefinition> {
    const cached = definitions.get(id);
    if (cached) return cached;
    const row = await tx.queryable(FlowDefinition).findOrThrow(id, `没有流程定义 ${id}`);
    definitions.set(id, row.model);
    return row.model;
  }

  /** 锁住实例，在推进现场里做事，最后写回 */
  async function withInstance(
    id: number,
    actor: Actor | null,
    work: (exec: Execution, tx: FlowDb) => Promise<void>,
  ): Promise<RunResult> {
    return db.transaction(async (tx) => {
      if (!(await tx.lock(FlowInstance, id))) throw new FlowError('not-found', `没有实例 ${id}`);
      const instance = await tx.queryable(FlowInstance).findOrThrow(id);
      const exec = execution(tx, await definitionOf(tx, instance.definitionId), instance, actor);
      await work(exec, tx);
      const { instance: summary, events } = await exec.flush();
      await afterFlush(tx, exec);
      const result = { instance: summary, workItems: exec.created.map(workItemSummary), events };
      const command = running.getStore();
      if (command && actor) await options.intercept?.after?.(command, result, actor);
      return result;
    });
  }

  /** 待办所在的实例（先读一次，锁住实例后再重读待办） */
  async function instanceOfItem(id: number): Promise<number> {
    const item = await db.queryable(FlowWorkItem).find(id);
    if (!item) throw new FlowError('not-found', `没有待办 ${id}`);
    return item.instanceId;
  }

  /** 锁住实例后重读待办：要开着、实例要在进行中 */
  async function openItem(exec: Execution, tx: FlowDb, id: number): Promise<WorkItemRow> {
    const item = await tx.queryable(FlowWorkItem).findOrThrow(id);
    if (exec.status !== 'active')
      throw new FlowError('instance-not-active', `实例 ${exec.instance.id} 不在进行中`);
    if (item.state !== 'open')
      throw new FlowError('already-handled', `待办 ${id} 已经处理过或取消了`);
    return item;
  }

  /** 这个人能不能处理：落到他的，或收件箱里他是候选 */
  async function isCandidate(tx: FlowDb, item: WorkItemRow, actor: Actor): Promise<boolean> {
    if (item.assignee) return item.assignee === actor.id;
    const candidates = await tx
      .queryable(FlowCandidate)
      .where((c) => c.workItemId.eq(item.id))
      .toList();
    return candidates.some((c) => matches(c, actor));
  }

  /** 建推进现场：调用流程时由引擎发起子实例 */
  function execution(
    tx: FlowDb,
    definition: ProcessDefinition,
    instance: InstanceRow,
    actor: Actor | null,
  ) {
    const exec = new Execution(tx, options, definition, instance, actor, now());
    exec.startChild = startChild;
    return exec;
  }

  /** 流程的最新启用版本 */
  async function latestDefinition(tx: FlowDb, key: string) {
    const definition = await tx
      .queryable(FlowDefinition)
      .where((d) => [d.processKey.eq(key), d.enabled.eq(true)])
      .orderBy((d) => d.version.desc())
      .first();
    if (!definition) throw new FlowError('not-found', `没有可发起的流程 ${key}`);
    definitions.set(definition.id, definition.model);
    return definition;
  }

  /** 建一个实例并从开始节点走起（发起与调用流程共用），返回推进现场（还没写回） */
  async function launch(
    tx: FlowDb,
    definition: Row<typeof FlowDefinition>,
    variables: Readonly<Record<string, unknown>>,
    actor: Actor,
    extra: Pick<InstanceRow, 'businessKey' | 'title' | 'parentId' | 'parentNode'>,
  ): Promise<Execution> {
    const model = definition.model;
    const values = {
      definitionId: definition.id,
      processKey: model.key,
      version: definition.version,
      status: 'active' as const,
      result: null,
      current: [],
      variables: { ...defaultsOf(model), ...variables },
      state: emptyRunState(),
      startedBy: actor.id,
      startedAt: now(),
      endedAt: null,
      rev: 0,
      ...extra,
    };
    const id = Number(await tx.insert(FlowInstance).values(values).returnId());
    const exec = execution(tx, model, { id, ...values }, actor);
    exec.addEvent(
      'instance.started',
      extra.parentId === null ? {} : { data: { parentId: extra.parentId } },
    );
    const startNode = model.nodes.find((node) => node.type === 'start');
    if (!startNode) throw new FlowError('invalid-definition', `流程 ${model.key} 没有开始节点`);
    exec.lastHandler = actor.id;
    await exec.enter(startNode.id, 'start');
    return exec;
  }

  async function start(
    command: Extract<FlowCommand, { type: 'start' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return db.transaction(async (tx) => {
      const definition = await latestDefinition(tx, command.process);
      if (definition.model.starters && !canStart(definition.model.starters, actor)) {
        throw new FlowError('forbidden', `${actor.id} 不能发起 ${command.process}`);
      }
      const exec = await launch(tx, definition, command.variables ?? {}, actor, {
        businessKey: command.businessKey ?? null,
        title: command.title ?? null,
        parentId: null,
        parentNode: null,
      });
      const { instance, events } = await exec.flush();
      const result = { instance, workItems: exec.created.map(workItemSummary), events };
      await options.intercept?.after?.(command, result, actor);
      return result;
    });
  }

  /**
   * 调用流程（同步、单个）：在同一个事务里发起子实例；子实例当场就结束时直接按它的结果往下走，否则父实例在这个节点等，
   * 子实例结束时 afterFlush 回到父实例。input 的键是子流程的变量，值是父流程这边的值（引用或直接写）
   */
  async function startChild(parent: Execution, node: CallNode): Promise<void> {
    if (node.forEach || node.mode === 'async') {
      throw new FlowError(
        'invalid-definition',
        '这一版只支持单个同步的调用流程（forEach、异步不支持）',
        { node: node.id },
      );
    }
    const definition = await latestDefinition(parent.tx, node.process);
    const input = Object.fromEntries(
      Object.entries(node.input ?? {}).map(([name, value]) => [
        variableName(name),
        isRef(value) ? parent.read(value.ref) : value,
      ]),
    );
    const actor: Actor = { id: parent.instance.startedBy };
    const child = await launch(parent.tx, definition, input, actor, {
      businessKey: parent.instance.businessKey,
      title: null,
      parentId: parent.instance.id,
      parentNode: node.id,
    });
    const { instance } = await child.flush();
    parent.addEvent('call.started', {
      node: node.id,
      data: { child: instance.id, process: node.process },
    });
    parent.current.add(node.id);
    if (child.finished) await returnToParent(parent, node, child);
  }

  /** 子实例结束了：父实例收 output、按子实例的结果往下走 */
  async function returnToParent(
    parent: Execution,
    node: CallNode,
    child: Execution,
  ): Promise<void> {
    for (const [variable, name] of Object.entries(node.output ?? {})) {
      parent.setVariables({ [variableName(variable)]: child.read(name) });
    }
    parent.current.delete(node.id);
    parent.addEvent('call.finished', {
      node: node.id,
      outcome: child.result,
      data: { child: child.instance.id, status: child.status },
    });
    await parent.leave(node.id, child.status === 'completed' ? child.result : null);
  }

  /**
   * 命令写回之后：子实例结束了就锁住父实例、回到它（父实例在等这个调用节点时）；
   * 实例被终止、撤回时，还在进行的子实例一起终止
   */
  async function afterFlush(tx: FlowDb, exec: Execution): Promise<void> {
    if (exec.finished && exec.instance.parentId !== null && exec.instance.parentNode !== null) {
      const parentId = exec.instance.parentId;
      if (await tx.lock(FlowInstance, parentId)) {
        const row = await tx.queryable(FlowInstance).findOrThrow(parentId);
        const parent = execution(tx, await definitionOf(tx, row.definitionId), row, null);
        const node = parent.graph.node(exec.instance.parentNode);
        if (parent.status === 'active' && node?.type === 'call' && parent.current.has(node.id)) {
          await returnToParent(parent, node, exec);
          await parent.flush();
          await afterFlush(tx, parent);
        }
      }
    }
    if (exec.status === 'terminated' || exec.status === 'withdrawn') {
      const children = await tx
        .queryable(FlowInstance)
        .where((i) => [i.parentId.eq(exec.instance.id), i.status.in(['active', 'suspended'])])
        .toList();
      for (const row of children) {
        await tx.lock(FlowInstance, row.id);
        const child = execution(tx, await definitionOf(tx, row.definitionId), row, null);
        await child.finish('terminated', 'parent-terminated');
        await child.flush();
        await afterFlush(tx, child);
      }
    }
  }

  async function claim(id: number, actor: Actor): Promise<RunResult> {
    return withInstance(await instanceOfItem(id), actor, async (exec, tx) => {
      const item = await openItem(exec, tx, id);
      if (item.assignee) throw new FlowError('already-handled', `待办 ${id} 已经有人处理`);
      if (!(await isCandidate(tx, item, actor)))
        throw new FlowError('forbidden', `${actor.id} 不能认领待办 ${id}`);
      await tx
        .update(FlowWorkItem)
        .set({ assignee: actor.id, assignment: 'claimed' })
        .where((w) => [w.id.eq(id), w.state.eq('open'), w.assignee.isNull()])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${id} 被别人认领了`))
        .execute();
      exec.addEvent('workItem.claimed', { workItemId: id, node: item.node });
    });
  }

  async function complete(
    command: Extract<FlowCommand, { type: 'complete' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(await instanceOfItem(command.workItem), actor, async (exec, tx) => {
      const item = await openItem(exec, tx, command.workItem);
      if (!(await isCandidate(tx, item, actor))) {
        throw new FlowError('forbidden', `${actor.id} 不能处理待办 ${item.id}`);
      }
      const node = exec.node(item.node) as TaskNode;
      const outcome = node.outcomes.find((o) => o.key === command.outcome);
      if (!outcome) {
        throw new FlowError('invalid-input', `节点 ${node.name} 没有结果 ${command.outcome}`, {
          field: 'outcome',
        });
      }
      if (outcome.comment === 'required' && !command.comment?.trim()) {
        throw new FlowError('invalid-input', `“${outcome.label}”要写意见`, { field: 'comment' });
      }
      if (command.variables) exec.setVariables(command.variables);
      for (const name of outcome.guards ?? []) {
        const guard = options.extensions?.guards?.[name];
        if (!guard) throw new FlowError('invalid-definition', `没有注册守卫 ${name}`);
        const verdict = await guard({
          ...exec.context(),
          node: node.id,
          outcome: outcome.key,
          actor,
        });
        if (verdict !== true) throw new FlowError('guard-rejected', verdict, { guard: name });
      }
      await finishItem(exec, tx, item, node, outcome.key, {
        actor: actor.id,
        comment: command.comment ?? null,
        returnTo: command.returnTo,
      });
    });
  }

  /**
   * 一份待办处理完：带状态条件写成 done、记事件，会签判断这一组结束了没有，结束了按结果往下走。
   * 人处理（complete）与超时自动处理（overdue 作业，actor 为 null）共用
   */
  async function finishItem(
    exec: Execution,
    tx: FlowDb,
    item: WorkItemRow,
    node: TaskNode,
    outcomeKey: string,
    by: { actor: string | null; comment: string | null; returnTo?: string | undefined },
  ): Promise<void> {
    await tx
      .update(FlowWorkItem)
      .set({
        state: 'done',
        outcome: outcomeKey,
        comment: by.comment,
        completedAt: exec.now,
        completedBy: by.actor,
        assignee: by.actor ?? item.assignee,
      })
      .where((w) => [w.id.eq(item.id), w.state.eq('open')])
      .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
      .execute();
    exec.addEvent('workItem.completed', {
      workItemId: item.id,
      node: node.id,
      outcome: outcomeKey,
      comment: by.comment,
      actor: by.actor,
      data: { outcomeLabel: node.outcomes.find((o) => o.key === outcomeKey)?.label ?? outcomeKey },
    });
    if (by.actor) {
      exec.state.handledBy[node.id] = by.actor;
      exec.lastHandler = by.actor;
    }

    let decided = outcomeKey;
    if (node.multi && item.signGroup) {
      const group = item.signGroup;
      // 会签组的键只在实例里唯一
      const votes = await tx
        .queryable(FlowWorkItem)
        .where((w) => [w.instanceId.eq(item.instanceId), w.signGroup.eq(group)])
        .toList();
      const queue = exec.state.queues[group] ?? [];
      const result = decideCountersign(node.multi, node.outcomes, votes, queue.length);
      if (result === undefined) {
        const [next, ...rest] = queue;
        if (node.multi.complete === 'sequential' && next !== undefined) {
          exec.state.queues[group] = rest;
          if (rest.length === 0) delete exec.state.queues[group];
          await exec.insertItem(node, item.round, 'forward', {
            assignee: next,
            assignment: 'direct',
            state: 'open',
            signGroup: group,
            signSeq: (item.signSeq ?? 0) + 1,
          });
        }
        return;
      }
      delete exec.state.queues[group];
      await exec.cancelWhere((w) => [w.signGroup.eq(group)]);
      exec.addEvent('countersign.decided', { node: node.id, outcome: result });
      decided = result;
    }
    exec.current.delete(node.id);
    await advanceFromTask(exec, node, decided, by.returnTo);
  }

  /** 人工节点有了结果：按结果的种类往下走 */
  async function advanceFromTask(
    exec: Execution,
    node: TaskNode,
    key: string,
    returnTo?: string,
  ): Promise<void> {
    const outcome = node.outcomes.find((o) => o.key === key)!;
    const kind = outcome.kind ?? 'approve';
    if (kind === 'terminate') return exec.finish('terminated', outcome.result ?? key);
    if (kind === 'return' && outcome.target === 'choose') {
      if (!returnTo) {
        throw new FlowError('invalid-input', '退回要选退回到哪个节点', {
          field: 'returnTo',
          code: 'required',
        });
      }
      if (!returnTargets(exec, node.id).includes(returnTo)) {
        throw new FlowError('invalid-input', `${returnTo} 不是上游走到过的人工节点`, {
          field: 'returnTo',
          code: 'not-upstream',
        });
      }
      const target = exec.graph.node(returnTo);
      if (
        !target ||
        target.type !== 'task' ||
        !exec.state.rounds[target.id] ||
        target.id === node.id
      ) {
        throw new FlowError(
          'invalid-input',
          `退回的目标 ${returnTo ?? '（没写）'} 不是走过的人工节点`,
          {
            field: 'returnTo',
          },
        );
      }
      exec.state.returnedFrom[target.id] = node.id;
      exec.addEvent('node.left', { node: node.id, outcome: key, data: { returnTo: target.id } });
      await exec.leaveRegions(node.id, target.id);
      return exec.enter(target.id, 'return');
    }
    // 被退回后重新提交：退回它的节点写了 returnTo: 'resubmit' 时直接回到那里，不再从头走
    const returnedFrom = exec.state.returnedFrom[node.id];
    delete exec.state.returnedFrom[node.id];
    const returner = returnedFrom ? exec.graph.node(returnedFrom) : undefined;
    if (kind === 'approve' && returner?.type === 'task' && returner.returnTo === 'resubmit') {
      exec.addEvent('node.left', {
        node: node.id,
        outcome: key,
        data: { resubmitTo: returner.id },
      });
      return exec.enter(returner.id, 'resubmit');
    }
    return exec.leave(node.id, key);
  }

  async function transfer(
    command: Extract<FlowCommand, { type: 'transfer' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(await instanceOfItem(command.workItem), actor, async (exec, tx) => {
      const item = await openItem(exec, tx, command.workItem);
      if (item.assignee !== actor.id && !actor.admin) {
        throw new FlowError('forbidden', `${actor.id} 不能转办待办 ${item.id}`);
      }
      const node = exec.node(item.node) as TaskNode;
      if (node.allow?.transfer === false)
        throw new FlowError('forbidden', `节点 ${node.name} 不允许转办`);
      await tx
        .update(FlowWorkItem)
        .set({
          state: 'canceled',
          completedAt: exec.now,
          completedBy: actor.id,
          comment: command.comment ?? null,
        })
        .where((w) => [w.id.eq(item.id), w.state.eq('open')])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
        .execute();
      await exec.insertItem(node, item.round, 'transfer', {
        assignee: command.to,
        assignment: 'direct',
        state: 'open',
        signGroup: item.signGroup,
        signSeq: item.signSeq,
      });
      exec.addEvent('workItem.transferred', {
        workItemId: item.id,
        node: node.id,
        comment: command.comment ?? null,
        data: { to: command.to },
      });
    });
  }

  async function withdraw(
    command: Extract<FlowCommand, { type: 'withdraw' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(command.instance, actor, async (exec, tx) => {
      if (exec.status !== 'active')
        throw new FlowError('instance-not-active', `实例 ${command.instance} 不在进行中`);
      if (exec.instance.startedBy !== actor.id)
        throw new FlowError('forbidden', '只有发起人能撤回');
      const mode = exec.definition.settings?.withdraw ?? 'beforeAction';
      const items = await tx
        .queryable(FlowWorkItem)
        .where((w) => w.instanceId.eq(command.instance))
        .toList();
      const acted = items.some((w) => w.state === 'done' && w.completedBy !== actor.id);
      const claimed = items.some((w) => w.assignment === 'claimed');
      if (mode === 'never' || acted || (mode === 'beforeClaim' && claimed)) {
        throw new FlowError('forbidden', '已经有人处理了，不能撤回');
      }
      await exec.finish('withdrawn', 'withdrawn');
    });
  }

  async function terminate(
    command: Extract<FlowCommand, { type: 'terminate' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能终止');
    return withInstance(command.instance, actor, async (exec) => {
      if (exec.finished)
        throw new FlowError('instance-not-active', `实例 ${command.instance} 已经结束`);
      await exec.finish('terminated', command.result ?? 'terminated');
    });
  }

  /** 管理员改派：把开着的待办交给另一个人 */
  async function reassign(
    command: Extract<FlowCommand, { type: 'reassign' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能改派');
    return withInstance(await instanceOfItem(command.workItem), actor, async (exec, tx) => {
      const item = await openItem(exec, tx, command.workItem);
      await tx
        .update(FlowWorkItem)
        .set({
          state: 'canceled',
          completedAt: exec.now,
          completedBy: actor.id,
          comment: command.comment ?? null,
        })
        .where((w) => [w.id.eq(item.id), w.state.eq('open')])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
        .execute();
      const node = exec.node(item.node) as TaskNode;
      await exec.insertItem(node, item.round, 'reassign', {
        assignee: command.to,
        assignment: 'direct',
        state: 'open',
        signGroup: item.signGroup,
        signSeq: item.signSeq,
      });
      exec.addEvent('workItem.reassigned', {
        workItemId: item.id,
        node: node.id,
        comment: command.comment ?? null,
        data: { to: command.to },
      });
    });
  }

  /** 管理员跳转：取消所有开着的待办、清掉等待状态，从指定节点重新走 */
  async function jump(
    command: Extract<FlowCommand, { type: 'jump' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能跳转');
    return withInstance(command.instance, actor, async (exec) => {
      if (exec.status !== 'active') {
        throw new FlowError('instance-not-active', `实例 ${command.instance} 不在进行中`);
      }
      const target = exec.graph.node(command.node);
      if (!target || target.type === 'start') {
        throw new FlowError('invalid-input', `不能跳到 ${command.node}`, { field: 'node' });
      }
      await exec.cancelWhere(() => []);
      exec.current.clear();
      exec.state.waiting = {};
      exec.state.queues = {};
      exec.addEvent('instance.jumped', {
        comment: command.comment ?? null,
        data: { to: command.node },
      });
      await exec.enter(command.node, 'jump');
    });
  }

  async function suspendOrResume(
    command: Extract<FlowCommand, { type: 'suspend' | 'resume' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能暂停、恢复');
    return withInstance(command.instance, actor, async (exec) => {
      const from = command.type === 'suspend' ? 'active' : 'suspended';
      if (exec.status !== from) {
        throw new FlowError(
          'instance-not-active',
          `实例 ${command.instance} 不是${from === 'active' ? '进行中' : '暂停'}的`,
        );
      }
      exec.status = command.type === 'suspend' ? 'suspended' : 'active';
      exec.addEvent(command.type === 'suspend' ? 'instance.suspended' : 'instance.resumed', {
        comment: command.type === 'suspend' ? (command.comment ?? null) : null,
      });
    });
  }

  async function remind(
    command: Extract<FlowCommand, { type: 'remind' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(command.instance, actor, async (exec, tx) => {
      if (exec.status !== 'active')
        throw new FlowError('instance-not-active', `实例 ${command.instance} 不在进行中`);
      if (exec.instance.startedBy !== actor.id && !actor.admin) {
        throw new FlowError('forbidden', '只有发起人或管理员能催办');
      }
      const items = await tx
        .queryable(FlowWorkItem)
        .where((w) => [
          w.instanceId.eq(command.instance),
          w.state.eq('open'),
          ...(command.workItem !== undefined ? [w.id.eq(command.workItem)] : []),
        ])
        .toList();
      for (const item of items) {
        exec.addEvent('workItem.reminded', {
          workItemId: item.id,
          node: item.node,
          comment: command.message ?? null,
          data: { reason: 'manual' },
        });
      }
    });
  }

  /** 外部事件：在等它的实例往下走，返回这些实例的结果；不在等的只记一条 signal.ignored */
  async function signal(command: SignalInput, actor: Actor): Promise<RunResult[]> {
    const ids =
      command.instance !== undefined
        ? [command.instance]
        : (
            await db
              .queryable(FlowInstance)
              .where((i) => [i.businessKey.eq(command.businessKey ?? ''), i.status.eq('active')])
              .select((i) => ({ id: i.id }))
              .toList()
          ).map((row) => row.id);
    const results: RunResult[] = [];
    for (const id of ids) {
      let received = false;
      const result = await withInstance(id, actor, async (exec) => {
        const waiting = [...exec.current].find((nodeId) => {
          const node = exec.graph.node(nodeId);
          return node?.type === 'receive' && node.event === command.event;
        });
        const node = waiting ? exec.node(waiting) : undefined;
        if (!node || node.type !== 'receive' || exec.status !== 'active') {
          exec.addEvent('signal.ignored', {
            outcome: command.outcome ?? null,
            data: { event: command.event },
          });
          return;
        }
        if (command.outcome !== undefined && !(node.outcomes ?? []).includes(command.outcome)) {
          throw new FlowError(
            'invalid-input',
            `事件 ${command.event} 没有结果 ${command.outcome}`,
            { field: 'outcome' },
          );
        }
        for (const [variable, name] of Object.entries(node.output ?? {})) {
          const target = variable.startsWith('form.') ? variable.slice(5) : variable;
          exec.setVariables({ [target]: command.data?.[name] });
        }
        exec.current.delete(node.id);
        exec.addEvent('signal.received', {
          node: node.id,
          outcome: command.outcome ?? null,
          data: { event: command.event, data: command.data ?? null },
        });
        received = true;
        await exec.leave(node.id, command.outcome ?? null);
      });
      // 按实例送的事件：没在等也给出这个实例的结果（只记了一笔）；按业务编号送的只给往下走了的
      if (received || command.instance !== undefined) results.push(result);
    }
    return results;
  }

  /** 拦截之后执行命令；正在执行的命令记在 running 里，提交前的 after 钩子从这里取 */
  async function run(input: FlowCommand, actor: Actor): Promise<RunResult> {
    const command = (await options.intercept?.before?.(input, actor)) ?? input;
    return running.run(command, () => dispatch(command, actor));
  }

  async function dispatch(command: FlowCommand, actor: Actor): Promise<RunResult> {
    switch (command.type) {
      case 'start':
        return start(command, actor);
      case 'claim':
        return claim(command.workItem, actor);
      case 'complete':
        return complete(command, actor);
      case 'transfer':
        return transfer(command, actor);
      case 'withdraw':
        return withdraw(command, actor);
      case 'terminate':
        return terminate(command, actor);
      case 'suspend':
      case 'resume':
        return suspendOrResume(command, actor);
      case 'skipJob':
        return skipJob(command, actor);
      case 'reassign':
        return reassign(command, actor);
      case 'jump':
        return jump(command, actor);
      case 'remind':
        return remind(command, actor);
      case 'comment':
        return withInstance(command.instance, actor, async (exec) => {
          exec.addEvent('instance.commented', { comment: command.text });
        });
      case 'cc':
        if (command.users.length === 0) {
          throw new FlowError('invalid-input', '抄送要选人', { field: 'users', code: 'required' });
        }
        return withInstance(command.instance, actor, async (exec) => {
          await exec.sendCc(
            null,
            command.users.map((user) => ({ user: user as `${bigint}` })),
            command.message,
          );
        });
    }
  }

  async function publish(definition: ProcessDefinition, actor?: Actor) {
    const problems = validateProcess(definition).filter((problem) => problem.severity === 'error');
    if (problems.length > 0) {
      throw new FlowError(
        'invalid-definition',
        `流程 ${definition.key} 有 ${problems.length} 处错误`,
        { problems },
      );
    }
    return db.transaction(async (tx) => {
      const latest = await tx
        .queryable(FlowDefinition)
        .where((d) => d.processKey.eq(definition.key))
        .orderBy((d) => d.version.desc())
        .first();
      const version = (latest?.version ?? 0) + 1;
      const model = { ...definition, version };
      await tx
        .insert(FlowDefinition)
        .values({
          processKey: definition.key,
          version,
          name: definition.name,
          model,
          enabled: true,
          publishedBy: actor?.id ?? null,
          publishedAt: now(),
        })
        .execute();
      return { key: definition.key, version };
    });
  }

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
    incidents: (instance) => incidents(instance),
    workItem: async (id, actor) => {
      const workItem = await db.queryable(FlowWorkItem).find(id);
      if (!workItem) throw new FlowError('not-found', `没有待办 ${id}`);
      const instance = await db.queryable(FlowInstance).findOrThrow(workItem.instanceId);
      const node = (await definitionOf(db, instance.definitionId)).nodes.find(
        (n) => n.id === workItem.node,
      );
      const open = workItem.state === 'open' && instance.status === 'active';
      const candidate = open && (await isCandidate(db, workItem, actor));
      return {
        workItem,
        instance,
        outcomes: node?.type === 'task' ? node.outcomes : [],
        claimable: candidate && workItem.assignee === null,
        completable: candidate,
      };
    },
    started: (actor) =>
      db
        .queryable(FlowInstance)
        .where((i) => i.startedBy.eq(actor.id))
        .orderBy((i) => i.id.desc())
        .toList(),
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
              w.candidates.any((c) => or(...candidateConditions(c, actor))),
            ),
          ),
        ])
        .orderBy((w) => w.id)
        .select(todoColumns)
        .toList()
        .then(withSummary),
    done: (actor) =>
      db
        .queryable(FlowWorkItem)
        .where((w) => [w.state.eq('done'), w.completedBy.eq(actor.id)])
        .orderBy((w) => w.id.desc())
        .select(todoColumns)
        .toList()
        .then(withSummary),
    instance: async (id) => {
      const instance = await db.queryable(FlowInstance).find(id);
      if (!instance) throw new FlowError('not-found', `没有实例 ${id}`);
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
      return { instance, definition, current, workItems: items.map(workItemSummary), events };
    },
  };

  async function runDue({ limit = 50, worker = `worker-${process.pid}` } = {}): Promise<number> {
    const at = now();
    const due = await db
      .queryable(FlowJob)
      .where((j) => [
        j.state.eq('pending'),
        j.dueAt.le(at),
        or(j.lockedUntil.isNull(), j.lockedUntil.lt(at)),
      ])
      .orderBy((j) => j.dueAt)
      .limit(limit)
      .toList();
    let ran = 0;
    for (const job of due) {
      const claimed = await db
        .update(FlowJob)
        .set({ lockedBy: worker, lockedUntil: new Date(at.getTime() + LEASE_MS) })
        .where((j) => [
          j.id.eq(job.id),
          j.state.eq('pending'),
          or(j.lockedUntil.isNull(), j.lockedUntil.lt(at)),
        ])
        .execute();
      if (claimed === 0) continue;
      try {
        await withInstance(job.instanceId, null, async (exec, tx) => {
          // 暂停的实例：作业往后推一小时，恢复后再做
          if (exec.status === 'suspended') {
            await tx
              .update(FlowJob)
              .set({ dueAt: new Date(at.getTime() + 3_600_000), lockedBy: null, lockedUntil: null })
              .where((j) => j.id.eq(job.id))
              .execute();
            return;
          }
          await tx
            .delete(FlowJob)
            .where((j) => j.id.eq(job.id))
            .execute();
          await runJob(exec, job);
        });
      } catch (error) {
        await jobFailed(job, error, at);
      }
      ran++;
    }
    return ran;
  }

  /** 一个作业：节点还在等、轮次没变才做 */
  async function runJob(exec: Execution, job: Row<typeof FlowJob>) {
    const node = job.node;
    if (exec.status !== 'active' || !node || !exec.current.has(node)) return;
    if (job.round !== null && exec.state.rounds[node] !== job.round) return;
    if (job.kind === 'timer') {
      exec.current.delete(node);
      return exec.leave(node);
    }
    if (job.kind === 'action') {
      const result = await exec.callAction(node);
      exec.current.delete(node);
      return exec.leave(node, result?.outcome ?? null);
    }
    if (job.kind === 'receiveTimeout') {
      const waiting = exec.node(node);
      if (waiting.type !== 'receive') return;
      exec.addEvent('node.overdue', { node, actor: null, data: { dueAt: isoSeconds(job.dueAt) } });
      if (waiting.overdue?.action === 'complete') {
        exec.current.delete(node);
        return exec.leave(node, waiting.overdue.outcome);
      }
      return;
    }
    if (job.kind === 'overdue' || job.kind === 'remind' || job.kind === 'unclaimed') {
      return runDeadline(exec, job);
    }
    throw new FlowError('invalid-definition', `不认识的作业 ${job.kind}`);
  }

  /** 时限与提醒：待办还开着才做；超时按节点的 overdue 记一笔或自动处理 */
  async function runDeadline(exec: Execution, job: Row<typeof FlowJob>) {
    const item =
      job.workItemId === null
        ? undefined
        : await exec.tx.queryable(FlowWorkItem).find(job.workItemId);
    if (!item || item.state !== 'open') return;
    const node = exec.node(item.node) as TaskNode;
    const fields = { workItemId: item.id, node: node.id, actor: null };
    if (job.kind === 'remind') {
      exec.addEvent('workItem.reminded', {
        ...fields,
        data: { auto: true, reason: job.payload['reason'] },
      });
      return;
    }
    if (job.kind === 'unclaimed') {
      if (item.assignee) return;
      exec.addEvent('workItem.reminded', { ...fields, data: { auto: true, reason: 'unclaimed' } });
      return;
    }
    exec.addEvent('workItem.overdue', {
      ...fields,
      data: { dueAt: item.dueAt ? isoSeconds(item.dueAt) : null },
    });
    if (node.overdue?.action === 'complete') {
      await finishItem(exec, exec.tx, item, node, node.overdue.outcome, {
        actor: null,
        comment: null,
      });
    }
  }

  /** 作业失败：回滚了它的事务，这里记次数与错误，按 n² 分钟重试，用完标失败 */
  /**
   * 作业失败：它的事务已经回滚，这里另开事务记次数与错误。异步的自动节点按 retry.times 重试（间隔 retry.backoff，
   * 不写时 n² 分钟），其余作业试 MAX_ATTEMPTS 次；用完标 failed、记 job.failed（data 里有作业编号），
   * 自动节点写了 onFailure: 'error' 时同时暂停实例
   */
  async function jobFailed(job: Row<typeof FlowJob>, error: unknown, at: Date) {
    const attempts = job.attempts + 1;
    const message = error instanceof Error ? error.message : String(error);
    await db.transaction(async (tx) => {
      const instance = await tx.queryable(FlowInstance).find(job.instanceId);
      const definition = instance ? await definitionOf(tx, instance.definitionId) : undefined;
      const node = job.node ? definition?.nodes.find((n) => n.id === job.node) : undefined;
      const service = job.kind === 'action' && node?.type === 'service' ? node : undefined;
      const maxAttempts = service ? (service.retry?.times ?? 0) + 1 : MAX_ATTEMPTS;
      const gaveUp = attempts >= maxAttempts;
      const backoff = service?.retry?.backoff;
      const delay = backoff
        ? dueAt(backoff, at, () => undefined, options).getTime() - at.getTime()
        : attempts * attempts * 60_000;
      await tx
        .update(FlowJob)
        .set({
          attempts,
          lastError: message.slice(0, 2000),
          lockedBy: null,
          lockedUntil: null,
          state: gaveUp ? 'failed' : 'pending',
          dueAt: new Date(at.getTime() + delay),
        })
        .where((j) => j.id.eq(job.id))
        .execute();
      if (!gaveUp || !instance || !definition) return;
      await tx.lock(FlowInstance, instance.id);
      const row = await tx.queryable(FlowInstance).findOrThrow(instance.id);
      const exec = execution(tx, definition, row, null);
      exec.addEvent('job.failed', {
        node: job.node,
        actor: null,
        data: { jobId: job.id, kind: job.kind, error: message.slice(0, 500) },
      });
      if (service?.onFailure === 'error' && exec.status === 'active') {
        exec.status = 'suspended';
        exec.addEvent('instance.suspended', { actor: null, data: { reason: 'job.failed' } });
      }
      await exec.flush();
    });
  }

  /** 失败的作业（异常）：带节点、能不能跳过、能选的结果 */
  async function incidents(instance?: number): Promise<Incident[]> {
    const jobs = await db
      .queryable(FlowJob)
      .where((j) => [
        j.state.eq('failed'),
        ...(instance !== undefined ? [j.instanceId.eq(instance)] : []),
      ])
      .orderBy((j) => j.id)
      .toList();
    const rows: Incident[] = [];
    for (const job of jobs) {
      const row = await db.queryable(FlowInstance).findOrThrow(job.instanceId);
      const definition = await definitionOf(db, row.definitionId);
      const node = job.node ? definition.nodes.find((n) => n.id === job.node) : undefined;
      rows.push({
        jobId: job.id,
        instanceId: job.instanceId,
        instanceTitle: row.title,
        kind: job.kind,
        node: job.node,
        nodeName: node?.name ?? null,
        attempts: job.attempts,
        error: job.lastError,
        skippable: job.kind === 'action',
        outcomes: skipOutcomes(definition, job.node),
      });
    }
    return rows;
  }

  /** 重试失败的作业：回到待执行，马上到点（谁能重试由接入方在接口层或 intercept 里管） */
  async function retryJob(id: number, _actor: Actor): Promise<boolean> {
    const revived = await db
      .update(FlowJob)
      .set({ state: 'pending', attempts: 0, dueAt: now(), lockedBy: null, lockedUntil: null })
      .where((j) => [j.id.eq(id), j.state.eq('failed')])
      .execute();
    if (revived === 0) throw new FlowError('not-found', `没有失败的作业 ${id}`);
    return true;
  }

  /** 管理员跳过失败的异步动作：按指定的结果往下走（结果要是这个节点出边上写的） */
  async function skipJob(
    command: Extract<FlowCommand, { type: 'skipJob' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能跳过作业');
    const job = await db.queryable(FlowJob).find(command.job);
    if (!job || job.state !== 'failed' || job.kind !== 'action' || !job.node) {
      throw new FlowError('not-found', `没有能跳过的失败作业 ${command.job}`);
    }
    const node = job.node;
    return withInstance(job.instanceId, actor, async (exec, tx) => {
      if (exec.status !== 'active') {
        throw new FlowError('instance-not-active', `实例 ${job.instanceId} 不在进行中`);
      }
      const outcomes = skipOutcomes(exec.definition, node);
      if (!command.outcome && outcomes.length > 0) {
        throw new FlowError('invalid-input', '跳过要选结果', {
          field: 'outcome',
          code: 'required',
        });
      }
      if (command.outcome && !outcomes.includes(command.outcome)) {
        throw new FlowError('invalid-input', `${node} 的出边上没有结果 ${command.outcome}`, {
          field: 'outcome',
          code: 'unknown-outcome',
        });
      }
      await tx
        .delete(FlowJob)
        .where((j) => j.id.eq(job.id))
        .execute();
      exec.current.delete(node);
      exec.addEvent('job.skipped', {
        node,
        outcome: command.outcome ?? null,
        comment: command.reason ?? null,
      });
      await exec.leave(node, command.outcome ?? null);
    });
  }

  const readCc = (instance: number, actor: Actor) =>
    db
      .update(FlowCc)
      .set({ readAt: now() })
      .where((c) => [c.instanceId.eq(instance), c.recipient.eq(actor.id), c.readAt.isNull()])
      .execute();

  return {
    db,
    signal,
    retryJob,
    readCc,
    createTables: () => db.createTables(),
    publish,
    run,
    query,
    jobs: { runDue },
  };
}

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
  processKey: w.instance.processKey,
  title: w.instance.title,
  definitionId: w.instance.definitionId,
  variables: w.instance.variables,
});

/** 候选匹配这个人 */
function matches(candidate: { kind: string; value: string }, actor: Actor): boolean {
  switch (candidate.kind) {
    case 'user':
      return candidate.value === actor.id;
    case 'role':
      return actor.roles?.includes(candidate.value) ?? false;
    case 'department':
      return actor.departments?.includes(candidate.value) ?? false;
    default:
      return actor.groups?.includes(candidate.value) ?? false;
  }
}

/** 待办查询里“候选是这个人”的条件 */
function candidateConditions(c: any, actor: Actor): Cond[] {
  const conditions: Cond[] = [and(c.kind.eq('user'), c.value.eq(actor.id))];
  const add = (kind: string, values: readonly string[] | undefined) => {
    if (values && values.length > 0) conditions.push(and(c.kind.eq(kind), c.value.in([...values])));
  };
  add('role', actor.roles);
  add('department', actor.departments);
  add('group', actor.groups);
  return conditions;
}

/**
 * 退回时能选的节点：沿前进的连线往上游找、走到过的人工节点；已经汇合了的并行区域里的节点不算（那些分支已经结束）
 */
export function returnTargets(exec: Execution, from: string): string[] {
  const definition = exec.definition;
  const pairs = gatewayPairs(definition);
  const ancestors = new Set<string>();
  const queue = [from];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const edge of exec.graph.incoming(id)) {
      if (edge.kind === 'return' || edge.kind === 'escalate' || ancestors.has(edge.from)) continue;
      ancestors.add(edge.from);
      queue.push(edge.from);
    }
  }
  const closed = (id: string) =>
    definition.nodes.some((n) => {
      const join = pairs.joinOf(n.id);
      return join !== undefined && ancestors.has(join) && pairs.region(n.id).has(id);
    });
  return [...ancestors].filter(
    (id) => exec.graph.node(id)?.type === 'task' && exec.state.rounds[id] && !closed(id),
  );
}

/** 定义里写的变量名：`form.字段` 就是流程变量里的“字段” */
const variableName = (name: string): string => (name.startsWith('form.') ? name.slice(5) : name);

/** 跳过失败的自动节点时能选的结果：它的出边上写的结果 */
function skipOutcomes(definition: ProcessDefinition, node: string | null): string[] {
  if (!node) return [];
  const outcomes = definition.edges
    .filter((e) => e.from === node && e.outcome)
    .map((e) => e.outcome!);
  return [...new Set(outcomes)];
}

/** 时刻写成 ISO 文字，整秒时不带毫秒（同线上的写法） */
const isoSeconds = (at: Date): string => at.toISOString().replace('.000Z', 'Z');

/** 定义里直接写的编号（引用在发起前取不到值） */
const literal = (value: unknown): string | undefined =>
  isRef(value) ? undefined : String(value as string | number);

/** 能不能发起：发起人名单里的人、角色、部门 */
function canStart(starters: readonly AssigneeSource[], actor: Actor): boolean {
  return starters.some((source) => {
    if ('user' in source) return literal(source.user) === actor.id;
    if ('role' in source) return actor.roles?.includes(literal(source.role) ?? '') ?? false;
    if ('department' in source) {
      return actor.departments?.includes(literal(source.department) ?? '') ?? false;
    }
    return false;
  });
}

/** 变量声明里的默认值 */
function defaultsOf(definition: ProcessDefinition): Record<string, unknown> {
  return Object.fromEntries(
    (definition.variables ?? [])
      .filter((v) => v.default !== undefined)
      .map((v) => [v.name, v.default]),
  );
}
