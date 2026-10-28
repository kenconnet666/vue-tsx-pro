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
import { and, createDb, or, type Cond } from '@zerodep-dev/easy-query-ts';
import {
  isRef,
  validateProcess,
  type AssigneeSource,
  type ProcessDefinition,
  type TaskNode,
} from '@zerodep-dev/flow-ts-model';
import { decideCountersign } from './countersign.ts';
import {
  FlowCandidate,
  FlowDefinition,
  FlowEvent,
  FlowInstance,
  FlowJob,
  FlowWorkItem,
  flowSchema,
  type FlowDb,
} from './entities.ts';
import { FlowError } from './errors.ts';
import { Execution, workItemSummary, type InstanceRow, type WorkItemRow } from './execution.ts';
import { emptyRunState } from './state.ts';
import type {
  Actor,
  FlowCommand,
  FlowEngineOptions,
  FlowEventView,
  RunResult,
  WorkItemSummary,
} from './types.ts';

/** 作业最多试几次（第一次加两次重试） */
const MAX_ATTEMPTS = 3;
/** 领到的作业锁多久：进程死掉后别的进程过了这段时间能接手 */
const LEASE_MS = 5 * 60_000;

/** 待办列表里的一行：待办加所属实例的标题与流程 */
export interface TodoItem extends WorkItemSummary {
  readonly processKey: string;
  readonly title: string | null;
}

/** 实例详情 */
export interface InstanceDetail {
  readonly instance: InstanceRow;
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
  readonly query: {
    /** 我的待办：落到我的、我能认领的 */
    todo(actor: Actor): Promise<TodoItem[]>;
    /** 我处理过的 */
    done(actor: Actor): Promise<TodoItem[]>;
    /** 实例详情：实例、全部待办、流转记录 */
    instance(id: number): Promise<InstanceDetail>;
  };
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
      const exec = new Execution(
        tx,
        options,
        await definitionOf(tx, instance.definitionId),
        instance,
        actor,
        now(),
      );
      await work(exec, tx);
      const { instance: summary, events } = await exec.flush();
      return { instance: summary, workItems: exec.created.map(workItemSummary), events };
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

  async function start(
    command: Extract<FlowCommand, { type: 'start' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return db.transaction(async (tx) => {
      const definition = await tx
        .queryable(FlowDefinition)
        .where((d) => [d.processKey.eq(command.process), d.enabled.eq(true)])
        .orderBy((d) => d.version.desc())
        .first();
      if (!definition) throw new FlowError('not-found', `没有可发起的流程 ${command.process}`);
      const model = definition.model;
      if (model.starters && !canStart(model.starters, actor)) {
        throw new FlowError('forbidden', `${actor.id} 不能发起 ${command.process}`);
      }
      const variables = { ...defaultsOf(model), ...command.variables };
      const values = {
        definitionId: definition.id,
        processKey: model.key,
        version: definition.version,
        businessKey: command.businessKey ?? null,
        title: command.title ?? null,
        status: 'active' as const,
        result: null,
        current: [],
        variables,
        state: emptyRunState(),
        startedBy: actor.id,
        startedAt: now(),
        endedAt: null,
        parentId: null,
        parentNode: null,
        rev: 0,
      };
      const id = Number(await tx.insert(FlowInstance).values(values).returnId());
      definitions.set(definition.id, model);
      const exec = new Execution(tx, options, model, { id, ...values }, actor, now());
      exec.addEvent('instance.started');
      const startNode = model.nodes.find((node) => node.type === 'start');
      if (!startNode) throw new FlowError('invalid-definition', `流程 ${model.key} 没有开始节点`);
      exec.lastHandler = actor.id;
      await exec.enter(startNode.id, 'start');
      const { instance, events } = await exec.flush();
      return { instance, workItems: exec.created.map(workItemSummary), events };
    });
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
      await tx
        .update(FlowWorkItem)
        .set({
          state: 'done',
          outcome: outcome.key,
          comment: command.comment ?? null,
          completedAt: exec.now,
          completedBy: actor.id,
          assignee: actor.id,
        })
        .where((w) => [w.id.eq(item.id), w.state.eq('open')])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
        .execute();
      exec.addEvent('workItem.completed', {
        workItemId: item.id,
        node: node.id,
        outcome: outcome.key,
        comment: command.comment ?? null,
      });
      exec.state.handledBy[node.id] = actor.id;
      exec.lastHandler = actor.id;

      let decided = outcome.key;
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
      await advanceFromTask(exec, node, decided, command.returnTo);
    });
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
      const target = returnTo ? exec.graph.node(returnTo) : undefined;
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

  async function signal(
    command: Extract<FlowCommand, { type: 'signal' }>,
    actor: Actor,
  ): Promise<RunResult[]> {
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
      results.push(
        await withInstance(id, actor, async (exec) => {
          const waiting = [...exec.current].find((nodeId) => {
            const node = exec.graph.node(nodeId);
            return node?.type === 'receive' && node.event === command.event;
          });
          const node = waiting ? exec.node(waiting) : undefined;
          if (!node || node.type !== 'receive' || exec.status !== 'active') {
            exec.addEvent('signal.ignored', { data: { event: command.event } });
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
            data: { event: command.event },
          });
          await exec.leave(node.id, command.outcome ?? null);
        }),
      );
    }
    return results;
  }

  async function run(command: FlowCommand, actor: Actor): Promise<RunResult> {
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
      case 'signal': {
        const results = await signal(command, actor);
        const first = results[0];
        if (!first) throw new FlowError('not-found', `没有实例在等事件 ${command.event}`);
        return first;
      }
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

  const query: FlowEngine['query'] = {
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
        .toList() as Promise<TodoItem[]>,
    done: (actor) =>
      db
        .queryable(FlowWorkItem)
        .where((w) => [w.state.eq('done'), w.completedBy.eq(actor.id)])
        .orderBy((w) => w.id.desc())
        .select(todoColumns)
        .toList() as Promise<TodoItem[]>,
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
      return { instance, workItems: items.map(workItemSummary), events };
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
          await tx
            .delete(FlowJob)
            .where((j) => j.id.eq(job.id))
            .execute();
          await runJob(exec, job);
        });
        ran++;
      } catch (error) {
        await jobFailed(job, error, at);
      }
    }
    return ran;
  }

  /** 一个作业：节点还在等、轮次没变才做 */
  async function runJob(
    exec: Execution,
    job: { kind: string; node: string | null; round: number | null },
  ) {
    const node = job.node;
    if (exec.status !== 'active' || !node || !exec.current.has(node)) return;
    if (job.round !== null && exec.state.rounds[node] !== job.round) return;
    if (job.kind === 'timer') {
      exec.current.delete(node);
      exec.addEvent('timer.fired', { node });
      return exec.leave(node);
    }
    if (job.kind === 'action') {
      const result = await exec.callAction(node);
      exec.current.delete(node);
      return exec.leave(node, result?.outcome ?? null);
    }
    throw new FlowError('invalid-definition', `不认识的作业 ${job.kind}`);
  }

  /** 作业失败：回滚了它的事务，这里记次数与错误，按 n² 分钟重试，用完标失败 */
  async function jobFailed(
    job: { id: number; attempts: number; instanceId: number; node: string | null },
    error: unknown,
    at: Date,
  ) {
    const attempts = job.attempts + 1;
    const message = error instanceof Error ? error.message : String(error);
    const gaveUp = attempts >= MAX_ATTEMPTS;
    await db.transaction(async (tx) => {
      await tx
        .update(FlowJob)
        .set({
          attempts,
          lastError: message.slice(0, 2000),
          lockedBy: null,
          lockedUntil: null,
          state: gaveUp ? 'failed' : 'pending',
          dueAt: new Date(at.getTime() + attempts * attempts * 60_000),
        })
        .where((j) => j.id.eq(job.id))
        .execute();
      if (gaveUp) {
        await tx
          .insert(FlowEvent)
          .values({
            instanceId: job.instanceId,
            workItemId: null,
            type: 'job.failed',
            at,
            actor: null,
            node: job.node,
            edge: null,
            outcome: null,
            comment: null,
            data: { error: message.slice(0, 500) },
          })
          .execute();
      }
    });
  }

  return {
    db,
    createTables: () => db.createTables(),
    publish,
    run,
    query,
    jobs: { runDue },
  };
}

/** 待办列表的列：待办加所属实例的流程与标题 */
const todoColumns = (w: any): Record<keyof TodoItem, any> => ({
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
