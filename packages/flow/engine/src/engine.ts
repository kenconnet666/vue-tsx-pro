/**
 * 流程引擎（docs/decisions/0001 第 5 节）：一个入口 run(command, actor)，每个命令一个事务，第一条语句锁住实例行；
 * 查询（待办、已办、实例详情）与作业（定时、异步的自动节点）也从这里给出。
 *
 * 这个文件只放对外的接口 FlowEngine 与组装：引擎核心在 core/context.ts，各部分按职责分在
 * commands/（发起、处理、动作、实例操作、外部消息、命令分发）、runtime/（推进现场、处理人、会签、调用流程、预测下一步）、
 * publish/（发布与版本、流程工程）、queries/（查询）、jobs/（作业）。
 *
 *   const engine = createFlowEngine({ adapter: pglite(db), org, extensions });
 *   await engine.createTables();
 *   await engine.publish(purchase);
 *   const { workItems } = await engine.run({ type: 'start', process: 'purchase', variables: { amount: 120 } }, alice);
 *   await engine.run({ type: 'complete', workItem: workItems[0].id, outcome: 'approve' }, bob);
 */
import {
  type FlowProject,
  type FormManifest,
  type FormValues,
  type ProcessDefinition,
} from '@zerodep-dev/flow-ts-model';
import { FlowCc, type FlowDb } from './core/entities.ts';
import { type InstanceRow } from './runtime/execution.ts';
import type {
  Actor,
  BatchResult,
  FlowCommand,
  InstanceSearch,
  ListFilter,
  ResultPage,
  FlowEngineOptions,
  RunResult,
  SignalInput,
} from './types.ts';
import { createCore } from './core/context.ts';
import { createCalls } from './runtime/calls.ts';
import { createStarts } from './commands/start.ts';
import { createTasks } from './commands/complete.ts';
import { createOps } from './commands/operate.ts';
import { createAdmin } from './commands/admin.ts';
import { createSignals } from './commands/signal.ts';
import { createCommands } from './commands/dispatch.ts';
import { createPublishing } from './publish/publish.ts';
import { createQueries } from './queries/queries.ts';
import { createJobs } from './jobs/jobs.ts';
import type {
  TodoItem,
  WorkItemDetail,
  StartView,
  CcItem,
  Incident,
  InstanceDetail,
  PublishOptions,
  VersionInfo,
  TypedProcess,
} from './views.ts';

/** 流程引擎 */
export interface FlowEngine {
  /** 建引擎的表（开发、测试；生产用自己的迁移脚本） */
  createTables(): Promise<void>;
  /**
   * 发布一个版本：流程定义，或流程工程（编译、加载、单据并进变量、类型检查）。
   * 校验不过报 invalid-definition：details.problems 是定义的问题，details.types 是类型错误
   */
  publish(
    input: ProcessDefinition | FlowProject,
    options?: PublishOptions,
  ): Promise<{ key: string; version: number }>;
  /** 版本：列出、取某版的工程（在线编辑）、回滚 */
  readonly versions: {
    list(key: string): Promise<VersionInfo[]>;
    /** 某个版本的工程（不写版本时是最新的）；只发布过定义的，工程里只有 process.json */
    project(key: string, version?: number): Promise<FlowProject>;
    /** 回滚：把那个版本的工程原样发布成新版本，运行中的实例留在各自的版本上 */
    rollback(
      key: string,
      version: number,
      options?: Omit<PublishOptions, 'note'>,
    ): Promise<{ key: string; version: number }>;
  };
  /** 按单据类型用一个流程：发起、处理时变量写错字段是编译错误（`engine.process<typeof form>('purchase')`） */
  process<Form extends FormManifest>(key: string): TypedProcess<FormValues<Form>>;
  /** 执行一个命令 */
  run(command: FlowCommand, actor: Actor): Promise<RunResult>;
  /** 发起前存的草稿：不进流程、只有自己看得到，只查值不查必填；`start` 带 draft 时从它发起 */
  readonly drafts: {
    /** 存（给 draft 时改那一份，否则按 process 新建） */
    save(
      input: {
        readonly draft?: number;
        readonly process?: string;
        readonly variables?: Readonly<Record<string, unknown>>;
        readonly businessKey?: string;
      },
      actor: Actor,
    ): Promise<InstanceRow>;
    list(actor: Actor): Promise<InstanceRow[]>;
    get(id: number, actor: Actor): Promise<InstanceRow>;
    discard(id: number, actor: Actor): Promise<boolean>;
  };
  /** 批量执行（批量认领、批量处理）：每条一个事务，各自成败，结果按顺序给出 */
  runMany(commands: readonly FlowCommand[], actor: Actor): Promise<BatchResult[]>;
  /** 外部事件（对方盖章、付款到账）：在等它的实例往下走，返回这些实例的结果 */
  signal(input: SignalInput, actor: Actor): Promise<RunResult[]>;
  readonly query: {
    /** 我的待办：落到我的、我能认领的 */
    todo(actor: Actor): Promise<TodoItem[]>;
    /** 我处理过的，新的在前 */
    done(actor: Actor, filter?: ListFilter): Promise<TodoItem[]>;
    /** 等我指定承办人的（我是收件箱的负责人，很久没人认领） */
    designations(actor: Actor): Promise<TodoItem[]>;
    /** 实例详情：实例、全部待办、流转记录；给了 actor 时只给经手的人与管理员看（同 search 的 involved），别人是 forbidden */
    instance(id: number, actor?: Actor): Promise<InstanceDetail>;
    /** 待办详情 */
    workItem(id: number, actor: Actor): Promise<WorkItemDetail>;
    /** 我发起的实例，新的在前 */
    started(actor: Actor, filter?: ListFilter): Promise<InstanceRow[]>;
    /** 查单据：按范围、流程、状态、发起时间、文字筛，新的在前，分页 */
    search(actor: Actor, filter?: InstanceSearch): Promise<ResultPage<InstanceRow>>;
    /** 抄送给我的，没读的在前 */
    cc(actor: Actor): Promise<CcItem[]>;
    /** 失败的作业（异常）；给实例时只看这个实例的 */
    incidents(instance?: number): Promise<Incident[]>;
    /** 能发起的流程：每个流程最新的启用版本 */
    processes(): Promise<ProcessDefinition[]>;
    /** 发起视图：发起页按它渲染单据、列出要选处理人的下一步 */
    startView(key: string, actor: Actor): Promise<StartView>;
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

/** 建一个引擎：先建核心，再按依赖的先后装上各部分 */
export function createFlowEngine(options: FlowEngineOptions): FlowEngine {
  const core = createCore(options);
  core.calls = createCalls(core);
  core.starts = createStarts(core);
  core.tasks = createTasks(core);
  core.ops = createOps(core);
  core.admin = createAdmin(core);
  core.signals = createSignals(core);
  core.commands = createCommands(core);
  core.publishing = createPublishing(core);
  core.queries = createQueries(core);
  core.jobs = createJobs(core);
  const { db, now } = core;

  function process<Form extends FormManifest>(key: string): TypedProcess<FormValues<Form>> {
    return {
      start: (input, actor) => core.commands.run({ type: 'start', process: key, ...input }, actor),
      complete: (input, actor) => core.commands.run({ type: 'complete', ...input }, actor),
    };
  }

  const readCc = (instance: number, actor: Actor) =>
    db
      .update(FlowCc)
      .set({ readAt: now() })
      .where((c) => [c.instanceId.eq(instance), c.recipient.eq(actor.id), c.readAt.isNull()])
      .execute();

  return {
    db,
    signal: core.signals.signal,
    retryJob: core.jobs.retryJob,
    readCc,
    createTables: () => db.createTables(),
    drafts: core.starts.drafts,
    runMany: core.commands.runMany,
    versions: core.publishing.versions,
    process,
    publish: core.publishing.publish,
    run: core.commands.run,
    query: core.queries.query,
    jobs: { runDue: core.jobs.runDue },
  };
}
