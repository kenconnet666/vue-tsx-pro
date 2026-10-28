/**
 * 一次命令里的推进（docs/decisions/0001 第 9 节）：实例行已经锁住，这里按定义进入、离开节点，攒下待办、事件、作业，
 * 最后 flush 一起写回。规则沿用 Java 版：选边见模型包的 selectEdges，并行与包容的汇合按分叉时记下的分支数等，
 * 退回跳出并行区域时取消区域里还开着的待办，一个命令最多推进 1000 步。
 */
import {
  applyEffects,
  gatewayPairs,
  processGraph,
  selectEdges,
  type ProcessDefinition,
  type ProcessEdge,
  type ProcessGraph,
  type ProcessNode,
  type CallNode,
  type TaskNode,
} from '@zerodep-dev/flow-ts-model';
import type { Row } from '@zerodep-dev/easy-query-ts';
import { expandToUsers, resolveCandidates, type Candidate } from './assignees.ts';
import {
  FlowCc,
  FlowEvent,
  FlowInstance,
  FlowJob,
  FlowWorkItem,
  FlowCandidate,
  type FlowDb,
} from './entities.ts';
import { loadCode } from './code.ts';
import { FlowError } from './errors.ts';
import type { RunState } from './state.ts';
import type {
  Actor,
  ExtensionContext,
  FlowEngineOptions,
  FlowEventView,
  InstanceSummary,
  WorkItemSummary,
} from './types.ts';

/** 实例行 */
export type InstanceRow = Row<typeof FlowInstance>;
/** 待办行 */
export type WorkItemRow = Row<typeof FlowWorkItem>;

/** 一个命令最多推进的步数：网关绕圈时报错，不卡死 */
const MAX_STEPS = 1000;

/** 记一条事件时可以带的 */
type EventFields = Partial<Omit<FlowEventView, 'type' | 'instanceId' | 'at'>>;

/** 待办行 → 概要 */
export const workItemSummary = (row: WorkItemRow): WorkItemSummary => ({
  id: row.id,
  instanceId: row.instanceId,
  node: row.node,
  nodeName: row.nodeName,
  round: row.round,
  state: row.state,
  assignment: row.assignment,
  assignee: row.assignee,
  arrival: row.arrival,
  createdAt: row.createdAt,
  dueAt: row.dueAt,
});

/** 推进的现场 */
export class Execution {
  readonly graph: ProcessGraph;
  readonly variables: Record<string, unknown>;
  readonly state: RunState;
  readonly current: Set<string>;
  status: InstanceRow['status'];
  result: string | null;
  endedAt: Date | null;
  /** 这次新建的待办 */
  readonly created: WorkItemRow[] = [];
  private readonly events: FlowEventView[] = [];
  private steps = 0;
  /** 刚处理完上一步的人（自动跳过的“与上一步相同”） */
  lastHandler: string | null = null;
  /** 流程自带的 TS 模块的导出（prepare 时加载） */
  private code: Readonly<Record<string, unknown>> | undefined;
  /** 调用流程：引擎在同一个事务里发起子实例（engine.ts 设置） */
  startChild: ((exec: Execution, node: CallNode) => Promise<void>) | undefined;

  readonly tx: FlowDb;
  readonly options: FlowEngineOptions;
  readonly definition: ProcessDefinition;
  readonly instance: InstanceRow;
  readonly actor: Actor | null;
  readonly now: Date;

  constructor(
    tx: FlowDb,
    options: FlowEngineOptions,
    definition: ProcessDefinition,
    instance: InstanceRow,
    actor: Actor | null,
    now: Date,
  ) {
    this.tx = tx;
    this.options = options;
    this.definition = definition;
    this.instance = instance;
    this.actor = actor;
    this.now = now;
    this.graph = processGraph(definition);
    this.variables = { ...instance.variables };
    this.state = structuredClone(instance.state);
    this.current = new Set(instance.current);
    this.status = instance.status;
    this.result = instance.result;
    this.endedAt = instance.endedAt;
  }

  /** 推进前的准备：加载流程自带的 TS 模块（条件求值是同步的，要先加载好） */
  async prepare(): Promise<this> {
    const compiled = this.definition.code?.compiled;
    if (compiled) this.code = await loadCode(compiled);
    return this;
  }

  /**
   * 按名字找扩展：`code.名字` 是流程自带的 TS 模块的导出，其余是引擎选项里注册的
   */
  extension<K extends keyof NonNullable<FlowEngineOptions['extensions']>>(
    kind: K,
    name: string,
  ): NonNullable<NonNullable<FlowEngineOptions['extensions']>[K]>[string] | undefined {
    if (name.startsWith('code.')) {
      const value = this.code?.[name.slice(5)];
      return typeof value === 'function' ? (value as never) : undefined;
    }
    return this.options.extensions?.[kind]?.[name] as never;
  }

  get finished(): boolean {
    return this.status !== 'active' && this.status !== 'suspended';
  }

  /** 扩展与条件取值的现场 */
  context(args: Readonly<Record<string, unknown>> = {}): ExtensionContext {
    return {
      instance: {
        id: this.instance.id,
        processKey: this.instance.processKey,
        businessKey: this.instance.businessKey,
        startedBy: this.instance.startedBy,
      },
      variables: this.variables,
      read: this.read,
      args,
    };
  }

  /** 按字段名取值：`sys.名字`、`fn.名字`、`form.字段`（就是流程变量）、流程变量 */
  readonly read = (field: string): unknown => {
    if (field.startsWith('sys.')) {
      const name = field.slice(4);
      if (name === 'initiator') return this.instance.startedBy;
      if (name === 'businessKey') return this.instance.businessKey;
      if (name === 'now') return this.now.toISOString();
      if (name === 'actor') return this.actor?.id ?? null;
      return undefined;
    }
    if (field.startsWith('fn.')) {
      const fn = this.extension('functions', field.slice(3));
      if (!fn) throw new FlowError('invalid-definition', `没有注册计算值 ${field}`);
      const { args: _, ...context } = this.context();
      return fn(context);
    }
    const name = field.startsWith('form.') ? field.slice(5) : field;
    return this.variables[name];
  };

  /** 记一条事件（flush 时写入，提交后通知监听） */
  addEvent(type: string, fields: EventFields = {}): void {
    this.events.push({
      type,
      instanceId: this.instance.id,
      workItemId: fields.workItemId ?? null,
      at: this.now,
      actor: fields.actor ?? this.actor?.id ?? null,
      node: fields.node ?? null,
      edge: fields.edge ?? null,
      outcome: fields.outcome ?? null,
      comment: fields.comment ?? null,
      data: fields.data ?? null,
    });
  }

  /** 改流程变量 */
  setVariables(values: Readonly<Record<string, unknown>>): void {
    Object.assign(this.variables, values);
  }

  node(id: string): ProcessNode {
    const node = this.graph.node(id);
    if (!node)
      throw new FlowError('invalid-definition', `流程 ${this.definition.key} 里没有节点 ${id}`);
    return node;
  }

  /** 离开一个节点：按结果选出边，依次进入目标节点 */
  async leave(nodeId: string, outcome: string | null = null): Promise<void> {
    if (this.finished) return;
    const edges = selectEdges(this.graph, nodeId, { outcome, read: this.read });
    if (edges.length === 0) {
      throw new FlowError(
        'invalid-definition',
        `节点 ${nodeId} 选不出出边（结果 ${outcome ?? '无'}）`,
        {
          node: nodeId,
          outcome,
        },
      );
    }
    const node = this.node(nodeId);
    if (node.type === 'parallel' || node.type === 'inclusive') {
      const join = gatewayPairs(this.definition).joinOf(nodeId);
      if (join) this.state.waiting[join] = edges.length;
    }
    for (const edge of edges) {
      if (this.finished) return;
      await this.follow(nodeId, edge, outcome);
    }
  }

  /** 走一条线：记事件、执行副作用、退回的处理，进入目标节点 */
  async follow(from: string, edge: ProcessEdge, outcome: string | null): Promise<void> {
    this.addEvent('node.left', { node: from, edge: edge.id, outcome });
    this.setVariables(applyEffects(edge.effects ?? [], this.variables, this.read));
    if (edge.kind === 'return') {
      this.state.returnedFrom[edge.to] = from;
      await this.leaveRegions(from, edge.to);
    }
    const arrival =
      edge.kind === 'return' || edge.kind === 'escalate'
        ? edge.kind
        : this.graph.node(from)?.type === 'start'
          ? 'start'
          : 'forward';
    await this.enter(edge.to, arrival);
  }

  /** 进入一个节点 */
  async enter(nodeId: string, arrival: string): Promise<void> {
    if (this.finished) return;
    if (++this.steps > MAX_STEPS) {
      throw new FlowError(
        'invalid-definition',
        `一个命令里推进超过 ${MAX_STEPS} 步，流程可能在绕圈`,
      );
    }
    const node = this.node(nodeId);
    // 开始节点不记“进入”（同 Java 版）：发起本身就是 instance.started
    if (node.type !== 'start') this.addEvent('node.entered', { node: nodeId });
    switch (node.type) {
      case 'start':
        return this.leave(nodeId);
      case 'end':
        return this.finish('completed', node.result ?? null);
      case 'task':
        return this.arriveTask(node, arrival);
      case 'exclusive':
        return this.leave(nodeId);
      case 'parallel':
      case 'inclusive': {
        // 汇合：等分叉时记下的分支都到了才往下走
        if (gatewayPairs(this.definition).forkOf(nodeId) !== undefined) {
          const left = (this.state.waiting[nodeId] ?? 1) - 1;
          if (left > 0) {
            this.state.waiting[nodeId] = left;
            return;
          }
          delete this.state.waiting[nodeId];
        }
        return this.leave(nodeId);
      }
      case 'service':
        return this.runService(nodeId);
      case 'cc':
        await this.sendCc(nodeId, node.to, node.message);
        return this.leave(nodeId);
      case 'timer':
        return this.waitTimer(nodeId);
      case 'call':
        if (!this.startChild) throw new FlowError('invalid-definition', '没有发起子流程的引擎');
        return this.startChild(this, node);
      case 'receive': {
        // 等外部事件；写了时限时排一个等超时的作业
        this.current.add(nodeId);
        const round = this.bumpRound(nodeId);
        if (node.due) {
          await this.schedule(
            'receiveTimeout',
            dueAt(node.due, this.now, this.read, this.options),
            {
              node: nodeId,
              round,
            },
          );
        }
        return;
      }
      default:
        throw new FlowError('invalid-definition', `这一版不支持 ${node.type} 节点`, {
          node: nodeId,
        });
    }
  }

  /** 人工节点：解析处理人、建待办；会签每个参与人一份；可以自动跳过 */
  private async arriveTask(node: TaskNode, arrival: string): Promise<void> {
    const round = (this.state.rounds[node.id] ?? 0) + 1;
    this.state.rounds[node.id] = round;
    const scope = {
      context: this.context(),
      handledBy: this.state.handledBy,
      options: this.options,
      resolver: (name: string) => this.extension('resolvers', name),
    };
    const settings = this.definition.settings ?? {};

    // 退回到这里、重新提交回到这里：落回上次的处理人
    const previous = this.state.handledBy[node.id];
    if ((arrival === 'return' || arrival === 'resubmit') && previous && !node.multi) {
      return this.createItems(node, round, arrival, { users: [previous], pool: [] });
    }

    if (node.multi) {
      const sources = Array.isArray(node.multi.participants)
        ? node.multi.participants
        : [{ user: node.multi.participants as never }];
      const users = await expandToUsers(await resolveCandidates(sources, scope), this.options);
      if (users.length === 0) return this.emptyAssignee(node, round);
      return this.createSignItems(node, round, arrival, users);
    }

    const sources = node.assignees ?? laneInbox(this.graph, node);
    const candidates = await resolveCandidates(sources, scope);
    if (candidates.length === 0) return this.emptyAssignee(node, round);
    const users = candidates.filter((c) => c.kind === 'user').map((c) => c.value);
    const direct = candidates.length === 1 && users.length === 1 ? users[0]! : null;

    // 自动跳过：落到一个人、这个人是发起人或刚处理完上一步的人
    const skip = node.autoSkip ?? settings.autoSkip;
    const approve = node.outcomes.find((o) => (o.kind ?? 'approve') === 'approve');
    if (direct && approve && skip && (arrival === 'forward' || arrival === 'start')) {
      const byInitiator = skip.initiator && direct === this.instance.startedBy;
      const bySame = skip.sameAsPrevious && direct === this.lastHandler;
      if (byInitiator || bySame) {
        this.addEvent('node.skipped', {
          node: node.id,
          actor: direct,
          outcome: approve.key,
          data: { reason: byInitiator ? 'initiator' : 'sameAsPrevious' },
        });
        this.state.handledBy[node.id] = direct;
        this.lastHandler = direct;
        return this.leave(node.id, approve.key);
      }
    }
    return this.createItems(node, round, arrival, {
      users: direct ? [direct] : [],
      pool: direct ? [] : candidates,
    });
  }

  /** 处理人解析为空：按节点或流程的设置自动通过、交给管理员或报错 */
  private async emptyAssignee(node: TaskNode, round: number): Promise<void> {
    const mode = node.emptyAssignee ?? this.definition.settings?.emptyAssignee ?? 'admin';
    if (mode === 'error') {
      throw new FlowError('no-assignee', `节点 ${node.name} 解析不出处理人`, { node: node.id });
    }
    if (mode === 'autoPass') {
      const approve = node.outcomes.find((o) => (o.kind ?? 'approve') === 'approve');
      this.addEvent('node.skipped', { node: node.id, data: { reason: 'emptyAssignee' } });
      return this.leave(node.id, approve?.key ?? null);
    }
    const admins = this.options.admins ?? [];
    if (admins.length === 0) {
      throw new FlowError('no-assignee', `节点 ${node.name} 解析不出处理人，也没有配置管理员`, {
        node: node.id,
      });
    }
    return this.createItems(node, round, 'emptyAssignee', {
      users: [],
      pool: admins.map((value) => ({ kind: 'user', value })),
    });
  }

  /** 建一个待办：落到一个人，或进以候选为成员的收件箱 */
  async createItems(
    node: TaskNode,
    round: number,
    arrival: string,
    target: { users: readonly string[]; pool: readonly Candidate[] },
  ): Promise<void> {
    const assignee =
      target.users.length === 1 && target.pool.length === 0 ? target.users[0]! : null;
    const row = await this.insertItem(node, round, arrival, {
      assignee,
      assignment: assignee ? 'direct' : 'pool',
      state: 'open',
    });
    const pool = assignee
      ? []
      : [...target.pool, ...target.users.map((value) => ({ kind: 'user' as const, value }))];
    if (pool.length > 0) {
      await this.tx
        .insert(FlowCandidate)
        .values(pool.map((c) => ({ workItemId: row.id, kind: c.kind, value: c.value })))
        .execute();
    }
    this.current.add(node.id);
  }

  /** 会签：每个参与人一份待办；依次会签先开第一份，其余排队 */
  private async createSignItems(
    node: TaskNode,
    round: number,
    arrival: string,
    users: readonly string[],
  ) {
    const group = `${node.id}#${round}`;
    const sequential = node.multi!.complete === 'sequential';
    for (const [seq, user] of users.entries()) {
      if (sequential && seq > 0) break;
      await this.insertItem(node, round, arrival, {
        assignee: user,
        assignment: 'direct',
        state: 'open',
        signGroup: group,
        signSeq: seq + 1,
      });
    }
    if (sequential && users.length > 1) this.state.queues[group] = users.slice(1);
    this.current.add(node.id);
  }

  /** 插入一行待办，记事件 */
  async insertItem(
    node: TaskNode,
    round: number,
    arrival: string,
    fields: Pick<WorkItemRow, 'assignee' | 'assignment' | 'state'> &
      Partial<Pick<WorkItemRow, 'signGroup' | 'signSeq'>>,
  ): Promise<WorkItemRow> {
    const values = {
      instanceId: this.instance.id,
      node: node.id,
      nodeName: node.name,
      round,
      arrival,
      signGroup: fields.signGroup ?? null,
      signSeq: fields.signSeq ?? null,
      createdAt: this.now,
      dueAt: node.due ? dueAt(node.due, this.now, this.read, this.options) : null,
      completedAt: null,
      completedBy: null,
      outcome: null,
      comment: null,
      ...fields,
    };
    const id = Number(await this.tx.insert(FlowWorkItem).values(values).returnId());
    const row = { id, ...values } as WorkItemRow;
    this.created.push(row);
    this.addEvent('workItem.created', {
      workItemId: id,
      node: node.id,
      data: { assignee: row.assignee },
    });
    await this.scheduleDeadlines(node, row);
    return row;
  }

  /**
   * 待办的时限与提醒：到期时记超时并按 overdue 处理；before 的提醒在到期前，every 的在到期后每隔一段、最多 times 次；
   * 进收件箱后 unclaimed.after 还没人认领时提醒。作业执行时待办已不开着（或已认领）就什么也不做
   */
  private async scheduleDeadlines(node: TaskNode, item: WorkItemRow): Promise<void> {
    const at = { node: node.id, round: item.round, workItemId: item.id };
    if (item.dueAt) {
      const due = item.dueAt.getTime();
      await this.schedule('overdue', item.dueAt, at);
      for (const reminder of node.reminders ?? []) {
        if ('before' in reminder) {
          const when = due - durationMs(reminder.before);
          if (when > this.now.getTime())
            await this.schedule('remind', new Date(when), { ...at, reason: 'dueSoon' });
        } else {
          const step = durationMs(reminder.every);
          for (let n = 1; n <= (reminder.times ?? 1); n++) {
            await this.schedule('remind', new Date(due + n * step), { ...at, reason: 'overdue' });
          }
        }
      }
    }
    if (node.unclaimed && item.assignment === 'pool') {
      const when = new Date(this.now.getTime() + durationMs(node.unclaimed.after));
      await this.schedule('unclaimed', when, { ...at, action: node.unclaimed.action });
    }
  }

  /** 退回跳出并行区域：取消区域里还开着的待办，清掉汇合计数 */
  async leaveRegions(from: string, to: string): Promise<void> {
    const pairs = gatewayPairs(this.definition);
    for (const fork of pairs.forksAround(from)) {
      const region = pairs.region(fork);
      if (region.has(to)) continue;
      const join = pairs.joinOf(fork);
      if (join) delete this.state.waiting[join];
      const nodes = [...region].filter((id) => id !== from);
      if (nodes.length > 0) await this.cancelItems(nodes);
      for (const id of region) this.current.delete(id);
    }
  }

  /** 取消这些节点上还开着（或排队）的待办 */
  async cancelItems(nodes: readonly string[]): Promise<void> {
    if (nodes.length === 0) return;
    await this.cancelWhere((w) => [w.node.in(nodes as string[])]);
    for (const key of Object.keys(this.state.queues)) {
      if (nodes.includes(key.slice(0, key.lastIndexOf('#')))) delete this.state.queues[key];
    }
  }

  /** 自动节点：同步执行注册的动作，按它给的结果走；异步的交给作业 */
  private async runService(nodeId: string): Promise<void> {
    const node = this.node(nodeId);
    if (node.type !== 'service') return;
    if ((node.mode ?? 'async') === 'async') {
      this.current.add(nodeId);
      await this.schedule('action', this.now, { node: nodeId, round: this.bumpRound(nodeId) });
      return;
    }
    const result = await this.callAction(nodeId);
    return this.leave(nodeId, result?.outcome ?? null);
  }

  /** 执行自动节点注册的动作，改变量，返回它给的结果 */
  async callAction(nodeId: string): Promise<{ outcome?: string } | undefined> {
    const node = this.node(nodeId);
    if (node.type !== 'service') return undefined;
    const action = this.extension('actions', node.action);
    if (!action)
      throw new FlowError('invalid-definition', `没有注册动作 ${node.action}`, { node: nodeId });
    let result: Awaited<ReturnType<typeof action>>;
    try {
      result = await action({ ...this.context(node.args ?? {}), node: nodeId });
    } catch (error) {
      // 同步的动作出错整个命令失败；异步的由作业重试（作业那边按普通错误处理）
      if ((node.mode ?? 'async') === 'sync') {
        throw new FlowError('extension-failed', `动作 ${node.action} 出错：${String(error)}`, {
          node: nodeId,
        });
      }
      throw error;
    }

    if (result?.variables) this.setVariables(result.variables);
    this.addEvent('service.done', { node: nodeId, outcome: result?.outcome ?? null });
    return result ?? undefined;
  }

  /** 定时等待：到点的作业 */
  private async waitTimer(nodeId: string): Promise<void> {
    const node = this.node(nodeId);
    if (node.type !== 'timer') return;
    const at = dueAt(node.wait, this.now, this.read, this.options);
    if (at <= this.now) return this.leave(nodeId);
    this.current.add(nodeId);
    await this.schedule('timer', at, { node: nodeId, round: this.bumpRound(nodeId) });
  }

  /** 节点进入一轮（定时、自动节点等的作业按轮次判断是否过时） */
  bumpRound(nodeId: string): number {
    const round = (this.state.rounds[nodeId] ?? 0) + 1;
    this.state.rounds[nodeId] = round;
    return round;
  }

  /** 抄送：展开成人，每人一条；手动抄送时节点为空 */
  async sendCc(
    nodeId: string | null,
    sources: Parameters<typeof resolveCandidates>[0],
    message?: string,
  ): Promise<void> {
    const scope = {
      context: this.context(),
      handledBy: this.state.handledBy,
      options: this.options,
      resolver: (name: string) => this.extension('resolvers', name),
    };
    const users = await expandToUsers(await resolveCandidates(sources, scope), this.options);
    if (users.length === 0) return;
    await this.tx
      .insert(FlowCc)
      .values(
        users.map((recipient) => ({
          instanceId: this.instance.id,
          node: nodeId,
          recipient,
          sender: nodeId === null ? (this.actor?.id ?? null) : null,
          message: message ?? null,
          at: this.now,
          readAt: null,
        })),
      )
      .execute();
    this.addEvent('instance.cc', {
      node: nodeId,
      comment: message ?? null,
      data: { to: users },
    });
  }

  /** 排一个作业（和命令同一事务） */
  async schedule(
    kind: string,
    at: Date,
    payload: { node?: string; round?: number; workItemId?: number } & Record<string, unknown>,
  ): Promise<void> {
    await this.tx
      .insert(FlowJob)
      .values({
        kind,
        instanceId: this.instance.id,
        workItemId: payload.workItemId ?? null,
        node: payload.node ?? null,
        round: payload.round ?? null,
        dueAt: at,
        payload,
        attempts: 0,
        state: 'pending',
        lockedBy: null,
        lockedUntil: null,
        lastError: null,
      })
      .execute();
  }

  /** 结束实例：取消还开着的待办，删掉还没到点的作业 */
  async finish(
    status: Exclude<InstanceRow['status'], 'active' | 'suspended'>,
    result: string | null,
  ): Promise<void> {
    if (this.finished) return;
    this.status = status;
    this.result = result;
    this.endedAt = this.now;
    await this.cancelWhere(() => []);
    await this.tx
      .delete(FlowJob)
      .where((j) => [j.instanceId.eq(this.instance.id), j.state.eq('pending')])
      .execute();
    this.current.clear();
    this.state.waiting = {};
    this.state.queues = {};
    // 正常走到结束记 instance.finished，其余按状态（instance.withdrawn、instance.terminated），同 Java 版
    this.addEvent(status === 'completed' ? 'instance.finished' : `instance.${status}`, {
      data: result ? { result } : null,
    });
  }

  /** 取消这个实例上符合条件、还开着（或排队）的待办，每份记一条事件 */
  async cancelWhere(filter: (w: any) => unknown[]): Promise<void> {
    const where = (w: any) => [
      w.instanceId.eq(this.instance.id),
      w.state.in(['open', 'waiting']),
      ...filter(w),
    ];
    const open = await this.tx
      .queryable(FlowWorkItem)
      .where(where as never)
      .orderBy((w) => w.id)
      .toList();
    if (open.length === 0) return;
    await this.tx
      .update(FlowWorkItem)
      .set({ state: 'canceled', completedAt: this.now })
      .where(where as never)
      .execute();
    for (const item of open)
      this.addEvent('workItem.canceled', { workItemId: item.id, node: item.node });
  }

  /** 写回实例、事件；监听在提交后执行 */
  async flush(): Promise<{ instance: InstanceSummary; events: FlowEventView[] }> {
    const title = renderTitle(this.definition.title, this.read) ?? this.instance.title;
    const rev = this.instance.rev + 1;
    await this.tx
      .update(FlowInstance)
      .set({
        variables: this.variables,
        state: this.state,
        current: [...this.current],
        status: this.status,
        result: this.result,
        endedAt: this.endedAt,
        title,
        rev,
      })
      .where((i) => i.id.eq(this.instance.id))
      .execute();
    if (this.events.length > 0) {
      await this.tx
        .insert(FlowEvent)
        .values(this.events.map((event) => ({ ...event })))
        .execute();
      const listeners = this.options.on;
      if (listeners) {
        const events = [...this.events];
        this.tx.afterCommit(async () => {
          for (const event of events) {
            await listeners[event.type]?.(event);
            await listeners['*']?.(event);
          }
        });
      }
    }
    return {
      instance: {
        id: this.instance.id,
        processKey: this.instance.processKey,
        version: this.instance.version,
        status: this.status,
        result: this.result,
        title,
        current: [...this.current].map((node) => ({
          node,
          name: this.graph.node(node)?.name ?? node,
        })),
        variables: { ...this.variables },
      },
      events: [...this.events],
    };
  }
}

/** 没写处理人时用所在泳道的收件箱 */
function laneInbox(graph: ProcessGraph, node: TaskNode): Parameters<typeof resolveCandidates>[0] {
  const inbox = graph.lane(node.lane)?.inbox;
  if (!inbox) return [];
  if ('role' in inbox) return [{ role: inbox.role }];
  if ('department' in inbox) return [{ department: inbox.department }];
  return [{ group: inbox.group, id: inbox.id }];
}

/** 实例标题：模板里花括号中是字段名 */
function renderTitle(
  template: string | undefined,
  read: (field: string) => unknown,
): string | null {
  if (!template) return null;
  return template.replace(/\{([^}]+)\}/g, (_, field: string) => {
    const value = read(field.trim());
    return value === undefined || value === null ? '' : String(value as string | number);
  });
}

/** 一段时长的毫秒数（工作日按自然日算，只用于提醒的间隔） */
function durationMs(duration: import('@zerodep-dev/flow-ts-model').Duration): number {
  if ('minutes' in duration) return duration.minutes * 60_000;
  if ('hours' in duration) return duration.hours * 3_600_000;
  if ('days' in duration) return duration.days * 86_400_000;
  return duration.workdays * 86_400_000;
}

/** 时长或时刻 → 到点的时刻（工作日跳过非工作日） */
export function dueAt(
  due: import('@zerodep-dev/flow-ts-model').Due,
  from: Date,
  read: (field: string) => unknown,
  options: FlowEngineOptions,
): Date {
  if ('until' in due) {
    const value = typeof due.until === 'string' ? due.until : read(due.until.ref);
    return new Date(value as string);
  }
  if ('minutes' in due) return new Date(from.getTime() + due.minutes * 60_000);
  if ('hours' in due) return new Date(from.getTime() + due.hours * 3_600_000);
  if ('days' in due) return new Date(from.getTime() + due.days * 86_400_000);
  const isWorkday =
    options.isWorkday ?? ((day: Date) => day.getUTCDay() !== 0 && day.getUTCDay() !== 6);
  const at = new Date(from);
  let left = due.workdays;
  while (left > 0) {
    at.setUTCDate(at.getUTCDate() + 1);
    if (isWorkday(at)) left--;
  }
  return at;
}
