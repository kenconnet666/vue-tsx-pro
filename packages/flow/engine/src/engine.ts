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
import { and, createDb, not, or, type Row } from '@zerodep-dev/easy-query-ts';
import {
  fieldStates,
  gatewayPairs,
  isRef,
  mergeSubmission,
  processGraph,
  formManifest,
  typedValue,
  type FieldState,
  type FieldTypeChecks,
  type NodeFormAccess,
  validateManifest,
  validateProcess,
  type AssigneeSource,
  type CallNode,
  type FlowProject,
  type FormManifest,
  type FormValues,
  type Outcome,
  type Problem,
  type ProcessDefinition,
  type TaskNode,
  type VariableDeclaration,
} from '@zerodep-dev/flow-ts-model';
import { actorTokens, parseCandidate } from './assignees.ts';
import {
  checkPicks,
  nextSteps,
  picksOf,
  type NextStep,
  type PickPrompt,
  type Picks,
  type PredictScope,
} from './next-steps.ts';
import { decideCountersign } from './countersign.ts';
import {
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
  renderTitle,
  workItemSummary,
  type CustomNodeDef,
  type InstanceRow,
  type WorkItemRow,
} from './execution.ts';
import {
  availableOperations,
  excludeToken,
  operationsOf,
  type OperationScope,
  type OperationView,
} from './operations.ts';
import { buildProject, linkProject, type FlowLogic } from './project.ts';
import { emptyRunState, renameNodes } from './state.ts';
import type {
  Actor,
  BatchResult,
  FlowCommand,
  ListFilter,
  TypeProblem,
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

/** 手动催办的间隔：同一份待办一小时内只催一次 */
const REMIND_INTERVAL_MS = 3_600_000;

/** 待办列表里的一行：待办加所属实例的标题、流程与摘要列（定义里 summary 列出的字段） */
export interface TodoItem extends WorkItemSummary {
  readonly processKey: string;
  readonly title: string | null;
  readonly summary: Readonly<Record<string, unknown>>;
  /** 实例现在的状态：已办里看得出单子结束了没有 */
  readonly instanceStatus: InstanceRow['status'];
  /** 处理的时间与选的结果（已办；待办时为空） */
  readonly completedAt: Date | null;
  readonly outcome: string | null;
}

/** 退回到运行时选的节点时能选的一个：上游走到过的人工节点与它上次的处理人 */
export interface ReturnTarget {
  readonly node: string;
  readonly nodeName: string;
  /** 上次处理它的人（退回后落回这个人） */
  readonly handler: string | null;
}

/**
 * 待办详情里的一个结果（能处理这份待办的人才有后面几项）：选它之后会到哪些节点、要给哪些节点选处理人；
 * 退回到运行时选的节点（target: 'choose'）时能选的节点
 */
export type OutcomeView = Outcome & {
  readonly next: readonly NextStep[];
  readonly picks: readonly PickPrompt[];
  readonly targets: readonly ReturnTarget[];
};

/** 发起视图：流程、单据的清单与发起时的权限、默认值，接下来要选处理人的节点 */
export interface StartView {
  readonly process: { readonly key: string; readonly name: string; readonly version: number };
  readonly manifest: FormManifest;
  readonly access: NodeFormAccess | null;
  readonly values: Readonly<Record<string, unknown>>;
  /** 发起后会到哪些节点 */
  readonly next: readonly NextStep[];
  readonly picks: readonly PickPrompt[];
}

/** 待办详情：待办、实例、能选的结果，这个人能不能认领、能不能处理、能不能转办，退回时能选的节点 */
export interface WorkItemDetail {
  readonly workItem: WorkItemRow;
  readonly instance: InstanceRow;
  readonly outcomes: readonly OutcomeView[];
  readonly claimable: boolean;
  /** 能选结果处理：是候选人，待办开着，不在委托中（委托出去的由受托人办完交回） */
  readonly completable: boolean;
  /** 处理前暂存的值与意见：只有处理人看得到，别人是 null */
  readonly draft: WorkItemRow['draft'];
  /** 这个人此刻能做的动作（认领、转办、委托、加签……）与要填的 */
  readonly operations: readonly OperationView[];
  /**
   * 单据的字段在这一步的样子：流程声明的变量按环节的表单权限（node.form）算，隐藏的不列；
   * 不是候选人（只是来看的）时一律只读
   */
  readonly fields: readonly WorkItemField[];
}

/** 待办详情里的一个字段 */
export interface WorkItemField {
  readonly name: string;
  readonly label: string;
  readonly type: VariableDeclaration['type'];
  readonly value: unknown;
  readonly editable: boolean;
  readonly required: boolean;
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

/** 发布的选项 */
export interface PublishOptions {
  readonly actor?: Actor;
  /** 发布说明 */
  readonly note?: string;
}

/** 一个已发布的版本 */
export interface VersionInfo {
  readonly id: number;
  readonly version: number;
  readonly name: string;
  readonly enabled: boolean;
  readonly publishedBy: string | null;
  readonly publishedAt: Date;
  readonly note: string | null;
}

/** 带单据类型的流程 */
export interface TypedProcess<V extends object> {
  start(
    input: { readonly variables: V; readonly title?: string; readonly businessKey?: string },
    actor: Actor,
  ): Promise<RunResult>;
  complete(
    input: {
      readonly workItem: number;
      readonly outcome: string;
      readonly variables?: Partial<V>;
      readonly comment?: string;
    },
    actor: Actor,
  ): Promise<RunResult>;
}

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
    /** 实例详情：实例、全部待办、流转记录 */
    instance(id: number): Promise<InstanceDetail>;
    /** 待办详情 */
    workItem(id: number, actor: Actor): Promise<WorkItemDetail>;
    /** 我发起的实例，新的在前 */
    started(actor: Actor, filter?: ListFilter): Promise<InstanceRow[]>;
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

/** 建一个引擎 */
export function createFlowEngine(options: FlowEngineOptions): FlowEngine {
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
      await afterFlush(tx, exec);
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
    exec.startChild = startChild;
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

  /** 建一个实例并从开始节点走起（发起与调用流程共用），返回推进现场（还没写回） */
  async function launch(
    tx: FlowDb,
    definition: Row<typeof FlowDefinition>,
    variables: Readonly<Record<string, unknown>>,
    actor: Actor,
    extra: Pick<InstanceRow, 'businessKey' | 'title' | 'parentId' | 'parentNode' | 'parentRound'>,
    /** 从草稿发起：用草稿那一行（同一个实例） */
    draftId?: number,
    /** 发起人给下一步选的处理人；null 时不查（调用流程发起的子实例没有人选） */
    picks: Picks | null = null,
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
    const id = draftId ?? Number(await tx.insert(FlowInstance).values(values).returnId());
    if (draftId !== undefined)
      await tx
        .update(FlowInstance)
        .set(values)
        .where((i) => i.id.eq(draftId))
        .execute();
    const exec = await execution(tx, model, { id, ...values }, actor);
    exec.addEvent(
      'instance.started',
      extra.parentId === null
        ? {}
        : { data: { parentId: extra.parentId, parentNode: extra.parentNode } },
    );
    const startNode = model.nodes.find((node) => node.type === 'start');
    if (!startNode) throw new FlowError('invalid-definition', `流程 ${model.key} 没有开始节点`);
    exec.lastHandler = actor.id;
    if (picks !== null)
      exec.state.picks = checkPicks(
        picksOf(await nextSteps(predictScope(exec, actor.id), startNode.id, { read: exec.read })),
        picks,
      );
    await exec.enter(startNode.id, 'start');
    return exec;
  }

  /** 预测下一步用的：解析处理人、图与设置，previous 是刚处理完的人（自动跳过按它判断） */
  function predictScope(exec: Execution, previous: string): PredictScope {
    return {
      context: exec.context(),
      handledBy: exec.state.handledBy,
      options,
      resolver: (name: string) => exec.extension('resolvers', name),
      graph: exec.graph,
      definition: exec.definition,
      previous,
    };
  }

  /** 选这个结果之后会到哪些节点：退回、终止不往下走；会签的一份不定下一步 */
  async function stepsAfter(
    exec: Execution,
    node: TaskNode,
    outcome: Outcome,
    actor: string,
  ): Promise<NextStep[]> {
    const kind = outcome.kind ?? 'approve';
    if (node.multi || kind === 'return' || kind === 'terminate') return [];
    return nextSteps(predictScope(exec, actor), node.id, { outcome: outcome.key, read: exec.read });
  }

  async function start(
    command: Extract<FlowCommand, { type: 'start' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return db.transaction(async (tx) => {
      const draft =
        command.draft === undefined ? undefined : await ownDraft(tx, command.draft, actor);
      const definition = await latestDefinition(tx, draft?.processKey ?? command.process);
      if (definition.model.starters && !canStart(definition.model.starters, actor)) {
        throw new FlowError('forbidden', `${actor.id} 不能发起 ${command.process}`);
      }
      const submitted = { ...(draft?.variables ?? {}), ...(command.variables ?? {}) };
      const variables = startValues(definition.model, submitted, { required: true });
      const exec = await launch(
        tx,
        definition,
        variables,
        actor,
        {
          businessKey: command.businessKey ?? draft?.businessKey ?? null,
          title: command.title ?? null,
          parentId: null,
          parentNode: null,
          parentRound: null,
        },
        draft?.id,
        command.picks ?? {},
      );
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
    const definition = await latestDefinition(parent.tx, node.process);
    const round = parent.bumpRound(node.id);
    const sync = node.mode === 'sync';
    // forEach：列表里每一项一个子实例，input 里 `as.字段` 引用那一项
    const items: unknown[] = node.forEach ? listOf(parent.read(node.forEach.ref)) : [undefined];
    const valueOf = (value: unknown, item: unknown) => {
      if (!isRef(value)) return value;
      const as = node.as;
      if (as && (value.ref === as || value.ref.startsWith(`${as}.`))) {
        return value.ref
          .slice(as.length)
          .split('.')
          .filter(Boolean)
          .reduce<unknown>((at, key) => (at as Record<string, unknown> | null)?.[key], item);
      }
      return parent.read(value.ref);
    };
    if (sync) {
      parent.state.calls[node.id] = items.length;
      parent.current.add(node.id);
    }
    const finished: Execution[] = [];
    for (const item of items) {
      const input = Object.fromEntries(
        Object.entries(node.input ?? {}).map(([name, value]) => [
          variableName(name),
          valueOf(value, item),
        ]),
      );
      const child = await launch(
        parent.tx,
        definition,
        input,
        { id: parent.instance.startedBy },
        {
          businessKey: parent.instance.businessKey,
          title: null,
          parentId: parent.instance.id,
          parentNode: node.id,
          parentRound: round,
        },
      );
      const { instance } = await child.flush();
      // 子实例开出的待办也算这个命令的结果（同 Java 版）
      parent.created.push(...child.created);
      parent.addEvent('call.started', {
        node: node.id,
        data: { child: instance.id, process: node.process, title: instance.title },
      });
      if (child.finished) finished.push(child);
    }
    // 异步：发起就往下走；同步：这一轮全在同一个命令里结束了（或列表是空的）就直接回来
    if (!sync) return parent.leave(node.id, null);
    for (const child of finished) await childReturned(parent, node, child);
    if (items.length === 0) await callsSettled(parent, node, []);
  }

  /** 同步调用的一个子实例结束了：少等一个；这一轮都结束了收 output、往下走 */
  async function childReturned(parent: Execution, node: CallNode, child: Execution) {
    const left = (parent.state.calls[node.id] ?? 1) - 1;
    parent.state.calls[node.id] = left;
    if (left > 0) return;
    await callsSettled(parent, node, [child]);
  }

  /**
   * 这一轮的子实例都结束了：output 收进父实例（forEach 时按发起的先后收成列表），几个子实例的结果都一样才按它，
   * 否则走没写结果的出边。justEnded 是这个命令里刚结束、还没从库里读到的
   */
  async function callsSettled(parent: Execution, node: CallNode, justEnded: readonly Execution[]) {
    const round = parent.state.rounds[node.id] ?? 1;
    const rows = await parent.tx
      .queryable(FlowInstance)
      .where((i) => [
        i.parentId.eq(parent.instance.id),
        i.parentNode.eq(node.id),
        i.parentRound.eq(round),
      ])
      .orderBy((i) => i.id)
      .toList();
    const children = rows.map((row) => {
      const live = justEnded.find((c) => c.instance.id === row.id);
      return {
        id: row.id,
        status: live?.status ?? row.status,
        result: live ? live.result : row.result,
        read: (name: string) => (live ? live.read(name) : row.variables[variableName(name)]),
      };
    });
    for (const [variable, name] of Object.entries(node.output ?? {})) {
      const values = children.map((c) => c.read(name) ?? null);
      parent.setVariables({
        [variableName(variable)]: node.forEach ? values : (values[0] ?? null),
      });
    }
    delete parent.state.calls[node.id];
    parent.current.delete(node.id);
    const first = children[0];
    const same =
      first && children.every((c) => c.status === 'completed' && c.result === first.result);
    const outcome = same ? first.result : null;
    parent.addEvent('call.finished', {
      node: node.id,
      outcome,
      data: { children: children.map((c) => c.id) },
    });
    await parent.leave(node.id, outcome);
  }

  /** 父实例恢复时：暂停期间这一轮的子实例都结束了的同步调用节点，补上往下走 */
  async function resumeWaitingCalls(parent: Execution) {
    for (const nodeId of Object.keys(parent.state.calls)) {
      const node = parent.graph.node(nodeId);
      if (node?.type !== 'call') continue;
      const round = parent.state.rounds[nodeId] ?? 1;
      const open = await parent.tx
        .queryable(FlowInstance)
        .where((i) => [
          i.parentId.eq(parent.instance.id),
          i.parentNode.eq(nodeId),
          i.parentRound.eq(round),
          i.status.in(['active', 'suspended']),
        ])
        .count();
      if (open === 0) await callsSettled(parent, node, []);
    }
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
        const parent = await execution(tx, await definitionOf(tx, row.definitionId), row, null);
        const node = parent.graph.node(exec.instance.parentNode);
        // 暂停的父实例不推进（恢复时 resumeWaitingCalls 补上）；旧一轮的子实例不算
        if (
          parent.status === 'active' &&
          node?.type === 'call' &&
          node.mode === 'sync' &&
          parent.current.has(node.id) &&
          exec.instance.parentRound === (parent.state.rounds[node.id] ?? 1)
        ) {
          await childReturned(parent, node, exec);
          await parent.flush();
          // 父实例往下走开出的待办也算这个命令的结果
          exec.created.push(...parent.created);
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
        const child = await execution(tx, await definitionOf(tx, row.definitionId), row, null);
        await child.finish('terminated', 'parent-terminated', exec.endComment);
        await child.flush();
        await afterFlush(tx, child);
      }
    }
  }

  /** 动作：重读待办、按 available 判断，再交给动作的 run（实例已锁住） */
  async function operate(
    command: Extract<FlowCommand, { type: 'operate' }>,
    actor: Actor,
    original: FlowCommand = command,
  ): Promise<RunResult> {
    const operation = operations.find((o) => o.name === command.operation);
    if (!operation) {
      throw new FlowError('invalid-input', `没有动作 ${command.operation}`, { field: 'operation' });
    }
    return withInstance(
      await instanceOfItem(command.workItem),
      actor,
      async (exec, tx) => {
        const item = await tx.queryable(FlowWorkItem).findOrThrow(command.workItem);
        const scope = scopeOf(exec, item, actor, await itemsOf(tx, item.instanceId));
        if (!operation.available(scope)) {
          const code =
            operation.refusal?.(scope) ??
            (exec.status !== 'active'
              ? 'instance-not-active'
              : item.state !== 'open'
                ? 'already-handled'
                : 'forbidden');
          throw new FlowError(code, `${actor.id} 现在不能对待办 ${item.id} ${operation.label}`);
        }
        await operation.run(
          {
            ...scope,
            exec,
            tx,
            cancel: async (comment) => {
              await tx
                .update(FlowWorkItem)
                .set({ state: 'canceled', completedAt: exec.now, completedBy: actor.id, comment })
                .where((w) => [w.id.eq(item.id), w.state.eq('open')])
                .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
                .execute();
            },
            finish: (outcome, comment) =>
              finishItem(exec, tx, item, scope.node, outcome, { actor: actor.id, comment }),
            settle: () => settleParent(exec, tx, item.id, scope.node),
            draftValues: (submitted) => {
              const manifest = formManifest(exec.definition);
              const states = fieldStates(manifest, { access: scope.node.form, read: exec.read });
              const editable = Object.fromEntries(
                Object.entries(submitted).filter(([name]) => states.get(name)?.editable),
              );
              const { errors } = submit(
                manifest,
                states,
                exec.variables,
                editable,
                options.extensions?.fieldTypes,
              );
              throwFormErrors(
                manifest,
                errors.filter((e) => e.code !== 'required'),
              );
              return editable;
            },
          },
          command.input ?? {},
        );
      },
      original,
    );
  }

  /** 判断动作能不能做时看的：实例的样子取推进现场的（锁住后的） */
  function scopeOf(
    exec: Execution,
    item: WorkItemRow,
    actor: Actor,
    items: readonly WorkItemRow[],
  ): OperationScope {
    return {
      item,
      node: exec.node(item.node) as TaskNode,
      instance: { ...exec.instance, status: exec.status },
      actor,
      candidate: isCandidate(item, actor),
      items,
    };
  }

  /** 实例上的全部待办 */
  function itemsOf(tx: FlowDb, instanceId: number): Promise<WorkItemRow[]> {
    return tx
      .queryable(FlowWorkItem)
      .where((w) => w.instanceId.eq(instanceId))
      .orderBy((w) => w.id)
      .toList();
  }

  async function complete(
    command: Extract<FlowCommand, { type: 'complete' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(
      await instanceOfItem(command.workItem),
      actor,
      async (exec, tx) => {
        const item = await openItem(exec, tx, command.workItem);
        if (!isCandidate(item, actor)) {
          throw new FlowError('forbidden', `${actor.id} 不能处理待办 ${item.id}`);
        }
        const node = exec.node(item.node) as TaskNode;
        const outcome = outcomesFor(node, item).find((o) => o.key === command.outcome);
        if (!outcome) {
          throw new FlowError('invalid-input', `节点 ${node.name} 没有结果 ${command.outcome}`, {
            field: 'outcome',
          });
        }
        if (outcome.comment === 'required' && !command.comment?.trim()) {
          throw new FlowError('invalid-input', `“${outcome.label}”要写意见`, { field: 'comment' });
        }
        // 这一步改了哪些值、原来是什么：撤回这一步时恢复
        const before = Object.fromEntries(
          Object.keys(command.variables ?? {}).map((key) => [key, exec.variables[key] ?? null]),
        );
        applySubmission(exec, node, command.variables);
        for (const name of outcome.guards ?? []) {
          const guard = exec.extension('guards', name);
          if (!guard) throw new FlowError('invalid-definition', `没有注册守卫 ${name}`);
          const verdict = await guard({
            ...exec.context(),
            node: node.id,
            outcome: outcome.key,
            actor,
          });
          if (verdict !== true) throw new FlowError('guard-rejected', verdict, { guard: name });
        }
        exec.state.picks = {
          ...exec.state.picks,
          ...checkPicks(picksOf(await stepsAfter(exec, node, outcome, actor.id)), command.picks),
        };
        await finishItem(exec, tx, item, node, outcome.key, {
          actor: actor.id,
          comment: command.comment ?? null,
          returnTo: command.returnTo,
          before,
        });
      },
      command,
    );
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
    by: {
      actor: string | null;
      comment: string | null;
      returnTo?: string | undefined;
      /** 这一步改过的单据值原来是什么（记进事件，撤回这一步时恢复） */
      before?: Readonly<Record<string, unknown>>;
    },
  ): Promise<void> {
    // 后加签：结果先挂着，打开排队的加签待办，等他们办完（signerDone）再生效
    const after = (w: any) => [
      w.parentItemId.eq(item.id),
      w.state.eq('waiting'),
      w.arrival.eq('addSign.after'),
    ];
    if (
      (await tx
        .queryable(FlowWorkItem)
        .where(after as never)
        .count()) > 0
    ) {
      await tx
        .update(FlowWorkItem)
        .set({ state: 'waiting', pendingOutcome: outcomeKey, comment: by.comment })
        .where((w) => [w.id.eq(item.id), w.state.eq('open')])
        .expectRows(1, () => new FlowError('already-handled', `待办 ${item.id} 已经处理过`))
        .execute();
      await tx
        .update(FlowWorkItem)
        .set({ state: 'open' })
        .where(after as never)
        .execute();
      return;
    }
    await tx
      .update(FlowWorkItem)
      .set({
        draft: null,
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
      data: {
        outcomeLabel: node.outcomes.find((o) => o.key === outcomeKey)?.label ?? outcomeKey,
        ...(by.before && Object.keys(by.before).length > 0 ? { before: by.before } : {}),
      },
    });
    if (item.parentItemId !== null) return signerDone(exec, tx, item, node);
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
      const rule =
        exec.logic?.countersign?.[node.multi.complete] ??
        options.extensions?.countersign?.[node.multi.complete];
      const result = decideCountersign(
        node.multi,
        node.outcomes,
        votes,
        queue.length,
        rule && { rule, node: node.id, chosen: outcomeKey },
      );
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

  /**
   * 加签（委托）的人办完一份：同一份待办下的都办完了，前加签与委托回到原来的处理人，后加签让挂着的结果生效——
   * 加签的人里有选了非通过结果的，按第一个这样的结果走
   */
  function signerDone(exec: Execution, tx: FlowDb, signer: WorkItemRow, node: TaskNode) {
    return settleParent(exec, tx, signer.parentItemId!, node);
  }

  /** 原来那份待办下的加签都办完（或减掉）了：恢复它 */
  async function settleParent(exec: Execution, tx: FlowDb, parentId: number, node: TaskNode) {
    const siblings = await tx
      .queryable(FlowWorkItem)
      .where((w) => w.parentItemId.eq(parentId))
      .orderBy((w) => w.id)
      .toList();
    if (siblings.some((w) => w.state === 'open' || w.state === 'waiting')) return;
    const parent = await tx.queryable(FlowWorkItem).findOrThrow(parentId);
    if (parent.state !== 'waiting') return;
    await tx
      .update(FlowWorkItem)
      .set({ state: 'open', pendingOutcome: null })
      .where((w) => w.id.eq(parent.id))
      .execute();
    const reopened = { ...parent, state: 'open' as const, pendingOutcome: null };
    if (parent.pendingOutcome === null) {
      exec.addEvent('workItem.resumed', { workItemId: parent.id, node: node.id });
      return;
    }
    const kindOf = (key: string | null) =>
      node.outcomes.find((o) => o.key === key)?.kind ?? 'approve';
    const objection = siblings.find((w) => w.state === 'done' && kindOf(w.outcome) !== 'approve');
    await finishItem(exec, tx, reopened, node, objection?.outcome ?? parent.pendingOutcome, {
      actor: parent.assignee,
      comment: parent.comment,
    });
  }

  /**
   * 处理时提交的变量：流程声明了变量时按环节的表单权限合并（只收能改的，必填的要有值，其余用存着的；0004 的 4.5），
   * 没声明的变量照旧直接写进去
   */
  function applySubmission(
    exec: Execution,
    node: TaskNode,
    submitted: Readonly<Record<string, unknown>> = {},
  ): void {
    const manifest = formManifest(exec.definition);
    const declared = Object.keys(manifest);
    const others = Object.fromEntries(
      Object.entries(submitted).filter(([name]) => !declared.includes(name)),
    );
    if (declared.length > 0) {
      const states = fieldStates(manifest, { access: node.form, read: exec.read });
      const { values, errors } = submit(
        manifest,
        states,
        exec.variables,
        submitted,
        options.extensions?.fieldTypes,
      );
      throwFormErrors(manifest, errors);
      exec.setVariables(values);
    }
    if (Object.keys(others).length > 0) exec.setVariables(others);
  }

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

  async function withdraw(
    command: Extract<FlowCommand, { type: 'withdraw' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(
      command.instance,
      actor,
      async (exec, tx) => {
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
        await exec.finish('withdrawn', 'withdrawn', command.comment ?? null);
      },
      command,
    );
  }

  async function terminate(
    command: Extract<FlowCommand, { type: 'terminate' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能终止');
    return withInstance(
      command.instance,
      actor,
      async (exec) => {
        if (exec.finished)
          throw new FlowError('instance-not-active', `实例 ${command.instance} 已经结束`);
        await exec.finish('terminated', command.result ?? 'terminated', command.comment ?? null);
      },
      command,
    );
  }

  /** 管理员跳转：取消所有开着的待办、清掉等待状态，从指定节点重新走 */
  async function jump(
    command: Extract<FlowCommand, { type: 'jump' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能跳转');
    return withInstance(
      command.instance,
      actor,
      async (exec) => {
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
      },
      command,
    );
  }

  async function suspendOrResume(
    command: Extract<FlowCommand, { type: 'suspend' | 'resume' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能暂停、恢复');
    return withInstance(
      command.instance,
      actor,
      async (exec) => {
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
        if (command.type === 'resume') await resumeWaitingCalls(exec);
      },
      command,
    );
  }

  async function remind(
    command: Extract<FlowCommand, { type: 'remind' }>,
    actor: Actor,
  ): Promise<RunResult> {
    return withInstance(
      command.instance,
      actor,
      async (exec, tx) => {
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
        // 环节关掉了催办（allow.remind: false）：点名催它时报错，催全部时跳过它
        const remindable = (node: string) => {
          const found = exec.graph.node(node);
          return found?.type !== 'task' || found.allow?.remind !== false;
        };
        if (command.workItem !== undefined && items[0] && !remindable(items[0].node))
          throw new FlowError('forbidden', `节点 ${items[0].nodeName} 不允许催办`);
        // 同一份待办一小时内只催一次（同 Java 版）：带条件地记下催办的时刻，没记上的不催
        const notBefore = new Date(exec.now.getTime() - REMIND_INTERVAL_MS);
        for (const item of items.filter((i) => remindable(i.node))) {
          const marked = await tx
            .update(FlowWorkItem)
            .set({ remindedAt: exec.now })
            .where((w) => [w.id.eq(item.id), or(w.remindedAt.isNull(), w.remindedAt.lt(notBefore))])
            .execute();
          if (marked === 0) continue;
          exec.addEvent('workItem.reminded', {
            workItemId: item.id,
            node: item.node,
            comment: command.message ?? null,
            data: { reason: 'manual' },
          });
        }
      },
      command,
    );
  }

  /** 管理员改单据数据：只记真的变了的字段，改前、改后各一份 */
  async function changeData(
    command: Extract<FlowCommand, { type: 'changeData' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能改单据数据');
    return withInstance(
      command.instance,
      actor,
      async (exec) => {
        const changes: Record<string, { before: unknown; after: unknown }> = {};
        for (const [name, after] of Object.entries(command.variables)) {
          const before = exec.variables[name] ?? null;
          if (JSON.stringify(before) !== JSON.stringify(after)) changes[name] = { before, after };
        }
        if (Object.keys(changes).length === 0) return;
        exec.setVariables(command.variables);
        exec.addEvent('instance.dataChanged', {
          comment: command.comment ?? null,
          data: { form: changes },
        });
      },
      command,
    );
  }

  /** 管理员迁移版本（同 Java 版）：先核对正在用的节点在新版本里都有、类型相同，再换版本、改待办与作业 */
  async function migrate(
    command: Extract<FlowCommand, { type: 'migrate' }>,
    actor: Actor,
  ): Promise<RunResult> {
    if (!actor.admin) throw new FlowError('forbidden', '只有管理员能迁移版本');
    if (!command.comment?.trim()) {
      throw new FlowError('invalid-input', '迁移要写原因', { field: 'comment', code: 'required' });
    }
    return withInstance(
      command.instance,
      actor,
      async (exec, tx) => {
        if (exec.finished)
          throw new FlowError('instance-not-active', `实例 ${command.instance} 已经结束`);
        const target = await tx
          .queryable(FlowDefinition)
          .where((d) => [d.processKey.eq(exec.instance.processKey), d.version.eq(command.version)])
          .first();
        if (!target) {
          throw new FlowError(
            'not-found',
            `没有 ${exec.instance.processKey} 的第 ${command.version} 版`,
          );
        }
        const to = processGraph(target.model);
        const live = await tx
          .queryable(FlowWorkItem)
          .where((w) => [w.instanceId.eq(exec.instance.id), w.state.in(['open', 'waiting'])])
          .toList();
        const inUse = new Set([...exec.current, ...live.map((w) => w.node)]);
        const mapping: Record<string, string> = {};
        for (const node of inUse) {
          const next = command.nodes?.[node] ?? node;
          const before = exec.graph.node(node);
          const after = to.node(next);
          if (!before || !after || before.type !== after.type) {
            throw new FlowError(
              'invalid-input',
              `节点 ${node} 在第 ${command.version} 版里没有对应的节点`,
              {
                field: `nodes.${node}`,
                code: 'no-matching-node',
              },
            );
          }
          mapping[node] = next;
        }
        const renamed = Object.entries(mapping).filter(([from, next]) => from !== next);
        for (const [from, next] of renamed) {
          await tx
            .update(FlowWorkItem)
            .set({ node: next, nodeName: to.node(next)!.name })
            .where((w) => [w.instanceId.eq(exec.instance.id), w.node.eq(from)])
            .execute();
          await tx
            .update(FlowJob)
            .set({ node: next })
            .where((j) => [j.instanceId.eq(exec.instance.id), j.node.eq(from)])
            .execute();
        }
        for (const item of live.filter((w) => w.signGroup && mapping[w.node] !== w.node)) {
          const round = item.signGroup!.slice(item.signGroup!.lastIndexOf('#'));
          await tx
            .update(FlowWorkItem)
            .set({ signGroup: `${mapping[item.node]}${round}` })
            .where((w) => w.id.eq(item.id))
            .execute();
        }
        Object.assign(exec.state, renameNodes(exec.state, mapping));
        const current = [...exec.current].map((node) => mapping[node] ?? node);
        exec.current.clear();
        for (const node of current) exec.current.add(node);
        await tx
          .update(FlowInstance)
          .set({ definitionId: target.id, version: target.version })
          .where((i) => i.id.eq(exec.instance.id))
          .execute();
        exec.addEvent('instance.migrated', {
          comment: command.comment,
          data: { fromVersion: exec.instance.version, toVersion: target.version, nodes: mapping },
        });
      },
      command,
    );
  }

  /** 发起时的值：按发起节点的权限收（只取能改的、显示条件不成立的丢掉），查值；required 时查必填。清单以外的变量原样留着 */
  function startValues(
    model: ProcessDefinition,
    submitted: Readonly<Record<string, unknown>>,
    { required }: { readonly required: boolean },
  ): Record<string, unknown> {
    const manifest = formManifest(model);
    if (Object.keys(manifest).length === 0) return { ...submitted };
    const start = model.nodes.find((node) => node.type === 'start');
    const stored = defaultsOf(model);
    const read = (name: string) => {
      const key = variableName(name);
      return key in submitted ? submitted[key] : stored[key];
    };
    const states = fieldStates(manifest, { access: start?.form, isStart: true, read });
    const { values, errors } = submit(
      manifest,
      states,
      stored,
      submitted,
      options.extensions?.fieldTypes,
    );
    throwFormErrors(manifest, required ? errors : errors.filter((e) => e.code !== 'required'));
    const others = Object.fromEntries(
      Object.entries(submitted).filter(([name]) => !(name in manifest)),
    );
    return { ...others, ...values };
  }

  /** 自己的草稿（别人的、不是草稿的都当没有） */
  async function ownDraft(tx: FlowDb, id: number, actor: Actor): Promise<InstanceRow> {
    const row = await tx.queryable(FlowInstance).find(id);
    if (!row || row.status !== 'draft' || row.startedBy !== actor.id)
      throw new FlowError('not-found', `没有草稿 ${id}`);
    return row;
  }

  const drafts: FlowEngine['drafts'] = {
    save: (input, actor) =>
      db.transaction(async (tx) => {
        const existing =
          input.draft === undefined ? undefined : await ownDraft(tx, input.draft, actor);
        const definition = await latestDefinition(tx, existing?.processKey ?? input.process ?? '');
        const model = definition.model;
        const variables = startValues(
          model,
          { ...(existing?.variables ?? {}), ...(input.variables ?? {}) },
          { required: false },
        );
        const title = renderTitle(model.title, (field) => variables[variableName(field)] ?? null);
        const values = {
          definitionId: definition.id,
          processKey: model.key,
          version: definition.version,
          businessKey: input.businessKey ?? existing?.businessKey ?? null,
          title,
          variables,
          startedAt: now(),
        };
        if (existing) {
          await tx
            .update(FlowInstance)
            .set(values)
            .where((i) => i.id.eq(existing.id))
            .execute();
          return { ...existing, ...values };
        }
        const row = {
          ...values,
          status: 'draft' as const,
          result: null,
          current: [],
          state: emptyRunState(),
          startedBy: actor.id,
          endedAt: null,
          parentId: null,
          parentNode: null,
          parentRound: null,
          rev: 0,
        };
        const id = Number(await tx.insert(FlowInstance).values(row).returnId());
        return { id, ...row };
      }),
    list: (actor) =>
      db
        .queryable(FlowInstance)
        .where((i) => [i.startedBy.eq(actor.id), i.status.eq('draft')])
        .orderBy((i) => i.id.desc())
        .toList(),
    get: (id, actor) => db.transaction((tx) => ownDraft(tx, id, actor)),
    discard: (id, actor) =>
      db.transaction(async (tx) => {
        await ownDraft(tx, id, actor);
        await tx
          .delete(FlowInstance)
          .where((i) => [i.id.eq(id), i.status.eq('draft')])
          .execute();
        return true;
      }),
  };

  async function runMany(commands: readonly FlowCommand[], actor: Actor): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    for (const command of commands) {
      try {
        results.push({ ok: true, result: await run(command, actor) });
      } catch (error) {
        if (!(error instanceof FlowError)) throw error;
        results.push({ ok: false, code: error.code, message: error.message });
      }
    }
    return results;
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
          return (
            (node?.type === 'receive' && node.event === command.event) ||
            exec.state.events[nodeId] === command.event
          );
        });
        const node = waiting ? exec.node(waiting) : undefined;
        // 自定义节点在等这个事件：交给它的 received（不写时按事件带的结果往下走）
        if (node && exec.status === 'active' && exec.state.events[node.id] === command.event) {
          const custom = node as unknown as CustomNodeDef;
          delete exec.state.events[node.id];
          exec.current.delete(node.id);
          exec.addEvent('signal.received', {
            node: node.id,
            outcome: command.outcome ?? null,
            data: { event: command.event, data: command.data ?? null },
          });
          received = true;
          const handler = exec.customNode(custom.type);
          const event = { outcome: command.outcome ?? null, data: command.data ?? {} };
          await exec.applyCustom(
            custom,
            handler?.received
              ? await handler.received(exec.customContext(custom), event)
              : { outcome: event.outcome },
          );
          return;
        }
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

  /** 拦截之后执行命令 */
  async function run(input: FlowCommand, actor: Actor): Promise<RunResult> {
    const command = (await options.intercept?.before?.(input, actor)) ?? input;
    return dispatch(command, actor);
  }

  async function dispatch(command: FlowCommand, actor: Actor): Promise<RunResult> {
    switch (command.type) {
      case 'start':
        return start(command, actor);
      case 'operate':
        return operate(command, actor);
      case 'claim':
        return operate(
          { type: 'operate', workItem: command.workItem, operation: 'claim' },
          actor,
          command,
        );
      case 'complete':
        return complete(command, actor);
      case 'transfer':
      case 'reassign':
        return operate(
          {
            type: 'operate',
            workItem: command.workItem,
            operation: command.type,
            input: { to: command.to, comment: command.comment },
          },
          actor,
          command,
        );
      case 'withdraw':
        return withdraw(command, actor);
      case 'terminate':
        return terminate(command, actor);
      case 'suspend':
      case 'resume':
        return suspendOrResume(command, actor);
      case 'skipJob':
        return skipJob(command, actor);
      case 'jump':
        return jump(command, actor);
      case 'remind':
        return remind(command, actor);
      case 'changeData':
        return changeData(command, actor);
      case 'migrate':
        return migrate(command, actor);
      case 'comment':
        return withInstance(
          command.instance,
          actor,
          async (exec) => {
            exec.addEvent('instance.commented', { comment: command.text });
          },
          command,
        );
      case 'cc':
        if (command.users.length === 0) {
          throw new FlowError('invalid-input', '抄送要选人', { field: 'users', code: 'required' });
        }
        return withInstance(
          command.instance,
          actor,
          async (exec) => {
            await exec.sendCc(
              null,
              command.users.map((user) => ({ user: user as `${bigint}` })),
              command.message,
            );
          },
          command,
        );
    }
  }

  async function publish(
    input: ProcessDefinition | FlowProject,
    { actor, note }: PublishOptions = {},
  ): Promise<{ key: string; version: number }> {
    const project = 'files' in input ? input : undefined;
    const built = project
      ? await buildProject(project, options.transform, options.modules)
      : undefined;
    const definition = built?.definition ?? (input as ProcessDefinition);
    const fieldTypes = options.extensions?.fieldTypes ?? {};
    const problems = [
      ...validateProcess(definition).filter((problem) => problem.severity === 'error'),
      ...logicProblems(definition, built?.linked.logic),
      // 内联的单据：清单自己合不合规（注册的字段类型算认得的）
      ...(definition.form?.manifest
        ? validateManifest(definition.form.manifest, {
            isFieldType: (type) => Object.hasOwn(fieldTypes, type),
          })
        : []),
    ];
    if (problems.length > 0) {
      throw new FlowError(
        'invalid-definition',
        `流程 ${definition.key} 有 ${problems.length} 处错误`,
        { problems },
      );
    }
    const types: readonly TypeProblem[] =
      project && options.checkTypes ? await options.checkTypes(project, options.modules ?? {}) : [];
    if (types.length > 0) {
      const [first] = types;
      throw new FlowError(
        'invalid-definition',
        `流程 ${definition.key} 有 ${types.length} 处类型错误，第一处：${first!.file}:${first!.line} ${first!.message}`,
        { types },
      );
    }
    return db.transaction(async (tx) => {
      // 同一个流程的发布串行：版本号不撞
      await tx.advisoryLock(`flow.publish:${definition.key}`);
      const latest = await tx
        .queryable(FlowDefinition)
        .where((d) => d.processKey.eq(definition.key))
        .orderBy((d) => d.version.desc())
        .first();
      const version = (latest?.version ?? 0) + 1;
      const id = Number(
        await tx
          .insert(FlowDefinition)
          .values({
            processKey: definition.key,
            version,
            name: definition.name,
            model: { ...definition, version },
            enabled: true,
            publishedBy: actor?.id ?? null,
            publishedAt: now(),
            note: note ?? null,
            files: project ? { ...project.files } : null,
            modules: built ? { ...built.modules } : null,
          })
          .returnId(),
      );
      logics.set(id, Promise.resolve(built?.linked.logic));
      return { key: definition.key, version };
    });
  }

  const versions: FlowEngine['versions'] = {
    list: (key) =>
      db
        .queryable(FlowDefinition)
        .where((d) => d.processKey.eq(key))
        .orderBy((d) => d.version.desc())
        .select((d) => ({
          id: d.id,
          version: d.version,
          name: d.name,
          enabled: d.enabled,
          publishedBy: d.publishedBy,
          publishedAt: d.publishedAt,
          note: d.note,
        }))
        .toList(),
    project: async (key, version) => projectOf(await versionRow(key, version)),
    rollback: async (key, version, rest) =>
      publish(projectOf(await versionRow(key, version)), {
        ...rest,
        note: `回滚到第 ${version} 版`,
      }),
  };

  async function versionRow(key: string, version?: number) {
    const row = await db
      .queryable(FlowDefinition)
      .where((d) => [
        d.processKey.eq(key),
        ...(version === undefined ? [] : [d.version.eq(version)]),
      ])
      .orderBy((d) => d.version.desc())
      .first();
    if (!row) {
      throw new FlowError(
        'not-found',
        `没有流程 ${key}${version === undefined ? '' : ` 的第 ${version} 版`}`,
      );
    }
    return row;
  }

  function process<Form extends FormManifest>(key: string): TypedProcess<FormValues<Form>> {
    return {
      start: (input, actor) => run({ type: 'start', process: key, ...input }, actor),
      complete: (input, actor) => run({ type: 'complete', ...input }, actor),
    };
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
        const next = exec ? await stepsAfter(exec, task!, outcome, actor.id) : [];
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
        .where((i) => [
          i.startedBy.eq(actor.id),
          i.status.ne('draft'),
          ...(filter.processKey ? [i.processKey.eq(filter.processKey)] : []),
          ...(filter.from ? [i.startedAt.ge(new Date(filter.from))] : []),
          ...(filter.to ? [i.startedAt.le(new Date(filter.to))] : []),
        ])
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

  /** 这个引擎的作业租约名：多个进程、多个标签页各不相同 */
  const workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;

  async function runDue({ limit = 50, worker = workerId } = {}): Promise<number> {
    const at = now();
    // 一次抢一批：别人锁着的行跳过（SKIP LOCKED），各拿各的；租约写在行上，进程中途退出时租约过期后别人再抢
    const due = await db.transaction(async (tx) => {
      const rows = await tx
        .queryable(FlowJob)
        .where((j) => [
          j.state.eq('pending'),
          j.dueAt.le(at),
          or(j.lockedUntil.isNull(), j.lockedUntil.lt(at)),
        ])
        .orderBy((j) => j.dueAt)
        .limit(limit)
        .forUpdateSkipLocked()
        .toList();
      if (rows.length > 0) {
        await tx
          .update(FlowJob)
          .set({ lockedBy: worker, lockedUntil: new Date(at.getTime() + LEASE_MS) })
          .where((j) => j.id.in(rows.map((row) => row.id)))
          .execute();
      }
      return rows;
    });
    let ran = 0;
    for (const job of due) {
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
      if (node.unclaimed?.action === 'assignByManager') {
        // 转收件箱的负责人指定：记下负责人，进他的“待我指定”（不知道负责人时只记一笔）
        const inbox = item.candidates
          .filter((token) => !token.startsWith('-'))
          .map(parseCandidate)
          .find((c) => c.kind !== 'user');
        const manager =
          inbox && options.org?.inboxManager
            ? await options.org.inboxManager(
                inbox as Parameters<typeof options.org.inboxManager>[0],
              )
            : undefined;
        await exec.tx
          .update(FlowWorkItem)
          .set({ designator: manager ?? null, awaitingDesignation: manager !== undefined })
          .where((w) => [w.id.eq(item.id), w.state.eq('open'), w.assignee.isNull()])
          .execute();
        exec.addEvent('workItem.unclaimed', {
          ...fields,
          data: manager ? { designator: manager } : null,
        });
        return;
      }
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
      const exec = await execution(tx, definition, row, null);
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
    return withInstance(
      job.instanceId,
      actor,
      async (exec, tx) => {
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
      },
      command,
    );
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
    drafts,
    runMany,
    versions,
    process,
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

/** 候选匹配这个人 */
/**
 * 收提交（mergeSubmission）：引擎存的是普通 JSON（小数、日期是文字），清单的值检查要强类型（json-wire 还原的 Decimal、日期），
 * 所以按 typedValue 读成强类型再查；取的值仍是原样的 JSON
 */
function submit(
  manifest: FormManifest,
  states: ReadonlyMap<string, FieldState>,
  stored: Readonly<Record<string, unknown>>,
  submitted: Readonly<Record<string, unknown>>,
  fieldTypes: FieldTypeChecks | undefined,
) {
  const typed = (row: Readonly<Record<string, unknown>>) =>
    Object.fromEntries(
      Object.entries(row).map(([name, value]) => [
        name,
        manifest[name] ? typedValue(manifest[name], value) : value,
      ]),
    );
  const { errors } = mergeSubmission(manifest, states, typed(stored), typed(submitted), fieldTypes);
  const { values } = mergeSubmission(manifest, states, stored, submitted);
  return { values, errors };
}

/** 单据的值不合格：报 invalid-input，details.errors 是全部问题，消息说第一处 */
function throwFormErrors(
  manifest: FormManifest,
  errors: readonly { readonly field: string; readonly code: string }[],
): void {
  const [first] = errors;
  if (!first) return;
  const label = manifest[first.field.split(/[.[]/)[0]!]?.label ?? first.field;
  throw new FlowError(
    'invalid-input',
    first.code === 'required' ? `“${label}”要填` : `“${label}”的值不对`,
    { field: first.field, code: first.code, errors },
  );
}

/** 这份待办能选的结果：加签的人不能退回（退回由原来的处理人决定） */
function outcomesFor(node: TaskNode, item: WorkItemRow): readonly Outcome[] {
  return item.parentItemId === null
    ? node.outcomes
    : node.outcomes.filter((o) => (o.kind ?? 'approve') !== 'return');
}

/** 版本行 → 工程：只发布过定义的，工程里只有 process.json（去掉版本号） */
function projectOf(row: {
  readonly model: ProcessDefinition;
  readonly files: Record<string, string> | null;
}): FlowProject {
  if (row.files) return { files: row.files };
  const { version: _, ...definition } = row.model;
  return { files: { 'process.json': JSON.stringify(definition, null, 2) } };
}

/** 定义里 `logic.名字` 的引用要在 logic.ts 对应的那一类里有 */
function logicProblems(definition: ProcessDefinition, logic: FlowLogic | undefined) {
  const problems: Problem[] = [];
  const check = (kind: keyof FlowLogic, ref: unknown, path: string) => {
    if (typeof ref !== 'string' || !ref.startsWith('logic.')) return;
    const name = ref.slice(6);
    if (!logic?.[kind]?.[name])
      problems.push({
        severity: 'error',
        code: 'logic.missing',
        field: path,
        params: { kind, name },
      });
  };
  const walk = (value: unknown, path: string, node?: { readonly type?: unknown }) => {
    if (typeof value === 'string') {
      if (value.startsWith('fn.logic.')) check('functions', value.slice(3), path);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`, node));
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    const record = value as Record<string, unknown>;
    const here = 'type' in record ? (record as { type?: unknown }) : node;
    for (const [key, item] of Object.entries(record)) {
      const at = `${path}.${key}`;
      if (key === 'resolver') check('resolvers', item, at);
      else if (key === 'guards' && Array.isArray(item))
        item.forEach((guard, i) => check('guards', guard, `${at}[${i}]`));
      else if (key === 'action' && here?.type === 'service') check('actions', item, at);
      else walk(item, at, here);
    }
  };
  walk(definition, '$');
  return problems;
}

/**
 * 退回时能选的节点：沿前进的连线往上游找、走到过的人工节点；已经汇合了的并行区域里的节点不算（那些分支已经结束）
 */
export function returnTargets(
  { definition, graph, state }: Pick<Execution, 'definition' | 'graph' | 'state'>,
  from: string,
): string[] {
  const pairs = gatewayPairs(definition);
  const ancestors = new Set<string>();
  const queue = [from];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const edge of graph.incoming(id)) {
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
  // 按定义里的先后（流程的顺序）：最近的上游在最后
  return definition.nodes
    .map((node) => node.id)
    .filter(
      (id) =>
        ancestors.has(id) && graph.node(id)?.type === 'task' && state.rounds[id] && !closed(id),
    );
}

/** 定义里写的变量名：`form.字段` 就是流程变量里的“字段” */
const variableName = (name: string): string => (name.startsWith('form.') ? name.slice(5) : name);

/** forEach 的列表：不是数组时当没有 */
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

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
