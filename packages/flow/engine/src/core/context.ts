/**
 * 引擎核心：各模块共用的数据库、选项、时钟、定义与逻辑的缓存，以及锁实例、建推进现场、读待办这些基本动作。
 * 各模块（发起、处理、动作、调用流程、作业……）建好后挂在核心上（core.tasks、core.calls……），
 * 彼此调用都经核心，模块之间不直接导入，也就没有循环依赖。
 */
import { createDb, type Row } from '@zerodep-dev/easy-query-ts';
import { type ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { actorTokens } from '../runtime/assignees.ts';
import { FlowDefinition, FlowInstance, FlowWorkItem, flowSchema, type FlowDb } from './entities.ts';
import { FlowError } from './errors.ts';
import {
  Execution,
  workItemSummary,
  type InstanceRow,
  type WorkItemRow,
} from '../runtime/execution.ts';
import { excludeToken, operationsOf } from '../commands/operations.ts';
import { linkProject } from '../publish/project.ts';
import type { FlowLogic } from '../extensions.ts';
import type { Actor, FlowCommand, FlowEngineOptions, RunResult } from '../types.ts';
import type { Calls } from '../runtime/calls.ts';
import type { Starts } from '../commands/start.ts';
import type { Tasks } from '../commands/complete.ts';
import type { Ops } from '../commands/operate.ts';
import type { Admin } from '../commands/admin.ts';
import type { Signals } from '../commands/signal.ts';
import type { Commands } from '../commands/dispatch.ts';
import type { Publishing } from '../publish/publish.ts';
import type { Queries } from '../queries/queries.ts';
import type { Jobs } from '../jobs/jobs.ts';
import type { Notifications } from '../notify/inbox.ts';
import type { Proxies } from '../proxy/proxies.ts';
import type { Stats } from '../queries/stats.ts';

/** 引擎核心：共用的部分，加上各模块（createFlowEngine 依次装上） */
export interface EngineCore {
  readonly db: FlowDb;
  readonly options: FlowEngineOptions;
  /** 现在（测试里是假时钟） */
  readonly now: () => Date;
  /** 定义的缓存：版本号 → 定义 */
  readonly definitions: Map<number, ProcessDefinition>;
  /** 版本 → 流程工程的逻辑（每个版本加载一次） */
  readonly logics: Map<number, Promise<FlowLogic | undefined>>;
  /** 待办上的动作：内置的加上选项里的 */
  readonly operations: ReturnType<typeof operationsOf>;
  readonly logicOf: (tx: FlowDb, id: number) => Promise<FlowLogic | undefined>;
  readonly definitionOf: (tx: FlowDb, id: number) => Promise<ProcessDefinition>;
  readonly withInstance: (
    id: number,
    actor: Actor | null,
    work: (exec: Execution, tx: FlowDb) => Promise<void>,
    command?: FlowCommand,
  ) => Promise<RunResult>;
  readonly instanceOfItem: (id: number) => Promise<number>;
  readonly openItem: (exec: Execution, tx: FlowDb, id: number) => Promise<WorkItemRow>;
  readonly isCandidate: (item: WorkItemRow, actor: Actor) => boolean;
  readonly execution: (
    tx: FlowDb,
    definition: ProcessDefinition,
    instance: InstanceRow,
    actor: Actor | null,
  ) => Promise<Execution>;
  readonly latestDefinition: (tx: FlowDb, key: string) => Promise<Row<typeof FlowDefinition>>;
  readonly itemsOf: (tx: FlowDb, instanceId: number) => Promise<WorkItemRow[]>;
  // ── 各模块（createFlowEngine 依次装上；彼此调用都经这里） ──
  /** 调用流程：发起子实例、子实例结束后回到父实例（runtime/calls.ts） */
  calls: Calls;
  /** 发起与发起前的草稿（commands/start.ts） */
  starts: Starts;
  /** 处理待办与会签推进（commands/complete.ts） */
  tasks: Tasks;
  /** 待办上的动作（commands/operate.ts） */
  ops: Ops;
  /** 实例上的操作：撤回、终止、跳转、暂停、催办、改数据、迁移（commands/admin.ts） */
  admin: Admin;
  /** 外部消息（commands/signal.ts） */
  signals: Signals;
  /** 命令入口与批量执行（commands/dispatch.ts） */
  commands: Commands;
  /** 发布与版本（publish/publish.ts） */
  publishing: Publishing;
  /** 查询（queries/queries.ts） */
  queries: Queries;
  /** 作业（jobs/jobs.ts） */
  jobs: Jobs;
  /** 通知的信箱与发件箱（notify/inbox.ts） */
  notifications: Notifications;
  /** 代理规则（proxy/proxies.ts） */
  proxies: Proxies;
  /** 监控与统计（queries/stats.ts） */
  stats: Stats;
}

/** 建引擎核心；各模块的槽由 createFlowEngine 依次装上 */
export function createCore(options: FlowEngineOptions): EngineCore {
  const db = createDb({ schema: flowSchema, adapter: options.adapter });

  const now = () => options.clock?.() ?? new Date();

  const definitions = new Map<number, ProcessDefinition>();

  const operations = operationsOf(options.operations);

  /** 版本 → 流程工程的逻辑（每个版本加载一次） */
  const logics = new Map<number, Promise<FlowLogic | undefined>>();

  function logicOf(tx: FlowDb, id: number): Promise<FlowLogic | undefined> {
    let logic = logics.get(id);
    if (!logic) {
      logic = tx
        .queryable(FlowDefinition)
        .where((d) => d.id.eq(id))
        .select((d) => ({ modules: d.modules }))
        .first()
        .then(async (row) =>
          row?.modules ? (await linkProject(row.modules, options.modules)).logic : undefined,
        );
      logics.set(id, logic);
      logic.catch(() => logics.delete(id));
    }
    return logic;
  }

  async function definitionOf(tx: FlowDb, id: number): Promise<ProcessDefinition> {
    const cached = definitions.get(id);
    if (cached) return cached;
    const row = await tx.queryable(FlowDefinition).findOrThrow(id, `没有流程定义 ${id}`);
    definitions.set(id, row.model);
    return row.model;
  }

  /** 锁住实例，在推进现场里做事，最后写回；是命令时提交前交给 intercept.after */
  async function withInstance(
    id: number,
    actor: Actor | null,
    work: (exec: Execution, tx: FlowDb) => Promise<void>,
    command?: FlowCommand,
  ): Promise<RunResult> {
    return db.transaction(async (tx) => {
      if (!(await tx.lock(FlowInstance, id))) throw new FlowError('not-found', `没有实例 ${id}`);
      const instance = await tx.queryable(FlowInstance).findOrThrow(id);
      const exec = await execution(
        tx,
        await definitionOf(tx, instance.definitionId),
        instance,
        actor,
      );
      await work(exec, tx);
      const { instance: summary, events } = await exec.flush();
      await core.calls.afterFlush(tx, exec);
      const result = { instance: summary, workItems: exec.created.map(workItemSummary), events };
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
  function isCandidate(item: WorkItemRow, actor: Actor): boolean {
    if (item.assignee) return item.assignee === actor.id;
    if (item.candidates.includes(excludeToken(actor.id))) return false;
    const tokens = actorTokens(actor);
    return item.candidates.some((token) => tokens.includes(token));
  }

  /** 建推进现场：调用流程时由引擎发起子实例 */
  async function execution(
    tx: FlowDb,
    definition: ProcessDefinition,
    instance: InstanceRow,
    actor: Actor | null,
  ): Promise<Execution> {
    const exec = new Execution(tx, options, definition, instance, actor, now());
    exec.startChild = (parent, node) => core.calls.startChild(parent, node);
    exec.onNotified = () => core.notifications.deliverPending();
    exec.logic = await logicOf(tx, instance.definitionId);
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

  /** 实例上的全部待办 */
  function itemsOf(tx: FlowDb, instanceId: number): Promise<WorkItemRow[]> {
    return tx
      .queryable(FlowWorkItem)
      .where((w) => w.instanceId.eq(instanceId))
      .orderBy((w) => w.id)
      .toList();
  }

  const core: EngineCore = {
    db,
    options,
    now,
    definitions,
    logics,
    operations,
    logicOf,
    definitionOf,
    withInstance,
    instanceOfItem,
    openItem,
    isCandidate,
    execution,
    latestDefinition,
    itemsOf,
    // 各模块先占位：createFlowEngine 建完核心马上依次装好，之后才会有调用
    calls: undefined as never,
    starts: undefined as never,
    tasks: undefined as never,
    ops: undefined as never,
    admin: undefined as never,
    signals: undefined as never,
    commands: undefined as never,
    publishing: undefined as never,
    queries: undefined as never,
    jobs: undefined as never,
    notifications: undefined as never,
    proxies: undefined as never,
    stats: undefined as never,
  };
  return core;
}
