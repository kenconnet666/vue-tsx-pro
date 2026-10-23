/**
 * 假后端的流转模拟：按组件库 workflow/ 的流程定义推进流程实例，替后端自研引擎演示（接上后端后整个目录去掉）。
 * 规则写在这里一处，单元测试覆盖：
 * - 节点：人工节点生成待办（岗位收件箱、指定的人、发起人、与某节点同一处理人、会签）；排他网关按条件走；
 *   并行网关分叉、汇合（等所有入边都到）；终止结束取消其余分支；
 * - 收件箱：认领（先点先得）、退回收件箱（原因必填，同一人不能再认领）、负责人指定、申请改派；
 *   退回的连线落到那个节点原来的处理人，提级的连线进上级岗位的收件箱；
 * - 时限：工作日、自然日、变量里的日期；tick() 处理超时自动完成（超时视为无异议）与没人认领转负责人指定；
 * - 处理：处理结果要求的意见、附件、字段不全时拒绝；会签全部处理完才往下，否决一票即止。
 * 状态是一个可以存进 localStorage 的普通对象，命令直接改它
 */
import { addWorkdays, shiftIsoDate, type WorkCalendar } from '@vue-tsx-pro/ui';
import {
  applyProcessEffects,
  nextProcessEdge,
  processGraph,
  processOutcome,
  resolveProcessValue,
  type ProcessDefinition,
  type ProcessEdge,
  type ProcessInstance,
  type ProcessTaskNode,
  type WorkflowEvent,
  type WorkItem,
} from '@vue-tsx-pro/ui/workflow';

/** 流转模拟的状态：可以原样存进 localStorage */
export interface WorkflowState {
  /** 流程实例 */
  instances: ProcessInstance[];
  /** 待办 */
  items: WorkItem[];
  /** 流转记录（旧的在前） */
  events: WorkflowEvent[];
  /** 并行汇合网关已经到了几路：实例 → 网关 → 条数 */
  joins: Record<string, Record<string, number>>;
  /** 编号的流水 */
  serial: number;
}

/** 空的状态 */
export const emptyWorkflowState = (): WorkflowState => ({
  instances: [],
  items: [],
  events: [],
  joins: {},
  serial: 0,
});

/** 人员与岗位：谁在哪个收件箱、收件箱的负责人 */
export interface WorkflowDirectory {
  /** 这个人在不在这个收件箱 */
  inGroup(user: string, group: string): boolean;
  /** 收件箱的负责人；没有时为 null */
  leaderOf(group: string): string | null;
}

/** 流转模拟的依赖 */
export interface WorkflowEngineOptions {
  /** 流程定义（同一个 key 的多个版本都放进来，发起时用最新版本） */
  definitions: readonly ProcessDefinition[];
  /** 人员与岗位 */
  directory: WorkflowDirectory;
  /** 工作日历 */
  calendar: WorkCalendar;
  /** 现在（ISO 日期时间，不带时区）：演示数据固定日期，播种时按里程碑的日期走 */
  now: () => string;
  /** 没人认领多少个工作日后转负责人指定，默认 3 */
  unclaimedWorkdays?: number;
}

/** 流转出错的种类：假接口按它给出状态码 */
export interface WorkflowErrorCodes {
  /** 找不到（404） */
  'not-found': unknown;
  /** 没有权限（403） */
  forbidden: unknown;
  /** 状态不对：已处理、已被认领、流程已暂停（409） */
  conflict: unknown;
  /** 缺少意见、附件、字段，或处理结果不存在（400） */
  invalid: unknown;
}

/** 流转出错：带上给人看的说明 */
export class WorkflowError extends Error {
  /** 出错的种类 */
  readonly code: keyof WorkflowErrorCodes;
  /** 出错的种类与说明 */
  constructor(code: keyof WorkflowErrorCodes, message: string) {
    super(message);
    this.name = 'WorkflowError';
    this.code = code;
  }
}

/** 处理一条待办时交上来的内容 */
export interface CompleteInput {
  /** 处理结果 */
  outcome: string;
  /** 意见 */
  comment?: string;
  /** 附件（文件名或地址） */
  attachments?: readonly string[];
  /** 业务表单填的流程变量 */
  variables?: Readonly<Record<string, unknown>>;
}

/** 发起流程 */
export interface StartInput {
  /** 流程标识 */
  key: string;
  /** 业务单据的编号 */
  businessKey: string;
  /** 标题 */
  title: string;
  /** 发起人 */
  actor: string;
  /** 一开始的流程变量 */
  variables?: Readonly<Record<string, unknown>>;
  /** 从这些节点开始（存量数据迁移：一期的项目已经走到中途）；不写时从开始节点走 */
  at?: readonly string[];
}

/** 系统自动的操作人 */
export const SYSTEM = 'system';

const isEmpty = (value: unknown) =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0);

/** 流转模拟 */
export function createWorkflowEngine(state: WorkflowState, options: WorkflowEngineOptions) {
  const { directory, calendar } = options;
  const unclaimedWorkdays = options.unclaimedWorkdays ?? 3;
  const today = () => options.now().slice(0, 10);
  const nextId = (prefix: string) => `${prefix}-${++state.serial}`;

  const definitionOf = (key: string, version?: number) => {
    const candidates = options.definitions.filter((item) => item.key === key);
    const found =
      version == null
        ? candidates.reduce<ProcessDefinition | undefined>(
            (latest, item) => (!latest || item.version > latest.version ? item : latest),
            undefined,
          )
        : candidates.find((item) => item.version === version);
    if (!found)
      throw new WorkflowError('not-found', `没有流程 ${key}${version ? ` v${version}` : ''}`);
    return found;
  };
  const graphOf = (instance: ProcessInstance) =>
    processGraph(definitionOf(instance.key, instance.version));

  function instanceOf(id: string): ProcessInstance {
    const found = state.instances.find((item) => item.id === id);
    if (!found) throw new WorkflowError('not-found', '流程不存在');
    return found;
  }
  function itemOf(id: string): WorkItem {
    const found = state.items.find((item) => item.id === id);
    if (!found) throw new WorkflowError('not-found', '待办不存在');
    return found;
  }
  /** 改实例：实例是只读类型，状态里换成新对象 */
  function patch(instance: ProcessInstance, changes: Partial<ProcessInstance>): ProcessInstance {
    const next = { ...instance, ...changes };
    state.instances = state.instances.map((item) => (item.id === instance.id ? next : item));
    return next;
  }
  function patchItem(item: WorkItem, changes: Partial<WorkItem>): WorkItem {
    const next = { ...item, ...changes };
    state.items = state.items.map((entry) => (entry.id === item.id ? next : entry));
    return next;
  }
  function record(
    instance: ProcessInstance,
    type: WorkflowEvent['type'],
    actor: string,
    extra: Partial<WorkflowEvent> = {},
  ): void {
    state.events.push({
      id: nextId('ev'),
      instanceId: instance.id,
      type,
      at: options.now(),
      actor,
      node: null,
      workItem: null,
      edge: null,
      outcome: null,
      comment: '',
      attachments: [],
      ...extra,
    });
  }

  /** 节点最后一次的处理人（退回、sameAs 用） */
  const lastHandler = (instanceId: string, node: string) =>
    state.items
      .filter((item) => item.instanceId === instanceId && item.node === node && item.completion)
      .at(-1)?.completion?.by ?? null;

  function dueOf(node: ProcessTaskNode, variables: Record<string, unknown>): string | null {
    const due = node.due;
    if (!due) return null;
    if ('workdays' in due) return addWorkdays(today(), due.workdays, calendar);
    if ('days' in due) return shiftIsoDate(today(), { days: due.days });
    const value = variables[due.var];
    return typeof value === 'string' && value ? value.slice(0, 10) : null;
  }

  /** 到达人工节点：按处理人的写法生成待办 */
  function arriveTask(
    instance: ProcessInstance,
    node: ProcessTaskNode,
    via: ProcessEdge | null,
    from: WorkItem['from'],
  ): void {
    const graph = graphOf(instance);
    const variables = instance.variables as Record<string, unknown>;
    const arrival: WorkItem['arrival'] = !via
      ? 'start'
      : via.kind === 'return'
        ? 'return'
        : via.kind === 'escalate'
          ? 'escalate'
          : 'forward';
    const base: Omit<WorkItem, 'id' | 'pool' | 'assignee' | 'assignment' | 'participant'> = {
      instanceId: instance.id,
      processKey: instance.key,
      businessKey: instance.businessKey,
      title: instance.title,
      node: node.id,
      name: node.name,
      arrival,
      from,
      state: 'open',
      createdAt: options.now(),
      dueOn: dueOf(node, variables),
      claimedAt: null,
      releasedBy: [],
      needsDesignation: false,
      reassignRequest: null,
      completion: null,
    };
    const laneGroup = graph.lane(node.lane)?.group ?? null;
    const add = (fields: Pick<WorkItem, 'pool' | 'assignee' | 'assignment' | 'participant'>) => {
      const item: WorkItem = { ...base, ...fields, id: nextId('wi') };
      state.items.push(item);
      record(instance, 'arrived', from.user ?? SYSTEM, {
        node: node.id,
        workItem: item.id,
        edge: via?.id ?? null,
      });
    };

    if (node.multi) {
      const participants = resolveProcessValue(node.multi.participants, variables);
      const list = Array.isArray(participants) ? (participants as string[]) : [];
      for (const user of list)
        add({ pool: null, assignee: user, assignment: 'direct', participant: user });
      return;
    }
    // 退回：落到这个节点原来的处理人
    const previous = arrival === 'return' ? lastHandler(instance.id, node.id) : null;
    if (previous) {
      add({ pool: null, assignee: previous, assignment: 'direct', participant: null });
      return;
    }
    const assignee = node.assignee;
    const pool = (group: string | null) =>
      add({ pool: group, assignee: null, assignment: 'pool', participant: null });
    const direct = (user: string | null | undefined, fallback: string | null) =>
      user
        ? add({ pool: null, assignee: user, assignment: 'direct', participant: null })
        : pool(fallback);
    switch (assignee?.type) {
      case 'pool':
        pool(resolveProcessValue(assignee.group, variables) ?? laneGroup);
        break;
      case 'user':
        direct(resolveProcessValue(assignee.user, variables), laneGroup);
        break;
      case 'initiator':
        direct(instance.startedBy, laneGroup);
        break;
      case 'sameAs':
        direct(
          lastHandler(instance.id, assignee.node),
          graph.lane(graph.node(assignee.node)?.lane)?.group ?? laneGroup,
        );
        break;
      default:
        pool(laneGroup);
    }
  }

  /** 结束实例：终止结束时取消其余的待办 */
  function finish(
    instance: ProcessInstance,
    nodeId: string,
    result: string | null,
    terminate: boolean,
  ) {
    if (terminate)
      for (const item of state.items)
        if (item.instanceId === instance.id && item.state === 'open')
          patchItem(item, { state: 'canceled' });
    const current = instanceOf(instance.id);
    const active = terminate ? [] : current.active.filter((id) => id !== nodeId);
    const done = terminate || active.length === 0;
    const next = patch(current, {
      active,
      ...(done ? { status: 'completed' as const, result, endedAt: options.now() } : {}),
    });
    record(next, 'ended', SYSTEM, { node: nodeId });
  }

  /** 沿一条边走到下一个节点 */
  function traverse(instanceId: string, edge: ProcessEdge, from: WorkItem['from']): void {
    let instance = instanceOf(instanceId);
    if (edge.effects?.length)
      instance = patch(instance, {
        variables: applyProcessEffects(edge.effects, instance.variables),
      });
    enter(instance, edge.to, edge, from);
  }

  function enter(
    instance: ProcessInstance,
    nodeId: string,
    via: ProcessEdge | null,
    from: WorkItem['from'],
  ): void {
    const graph = graphOf(instance);
    const node = graph.node(nodeId);
    if (!node) throw new WorkflowError('invalid', `流程里没有节点 ${nodeId}`);
    switch (node.type) {
      case 'task': {
        if (!instance.active.includes(node.id))
          instance = patch(instance, { active: [...instance.active, node.id] });
        arriveTask(instance, node, via, from);
        return;
      }
      case 'exclusive': {
        const edge = nextProcessEdge(graph, node.id, null, instance.variables);
        if (!edge) throw new WorkflowError('invalid', `“${node.name}”没有可走的出边`);
        record(instance, 'arrived', from.user ?? SYSTEM, { node: node.id, edge: via?.id ?? null });
        traverse(instance.id, edge, from);
        return;
      }
      case 'parallel': {
        record(instance, 'arrived', from.user ?? SYSTEM, { node: node.id, edge: via?.id ?? null });
        const incoming = graph.incoming(node.id).length;
        if (incoming > 1) {
          const joins = (state.joins[instance.id] ??= {});
          joins[node.id] = (joins[node.id] ?? 0) + 1;
          if (joins[node.id]! < incoming) return;
          joins[node.id] = 0;
        }
        for (const edge of graph.outgoing(node.id)) traverse(instance.id, edge, from);
        return;
      }
      case 'end':
        record(instance, 'arrived', from.user ?? SYSTEM, { node: node.id, edge: via?.id ?? null });
        finish(instance, node.id, node.result ?? null, node.terminate ?? false);
        return;
      case 'start':
        throw new WorkflowError('invalid', '不能回到开始节点');
    }
  }

  /** 节点处理完（会签的最后一份、或签的第一份、否决的一票）：离开节点，按结果走出边 */
  function leave(item: WorkItem, outcome: string, actor: string): void {
    let instance = instanceOf(item.instanceId);
    const graph = graphOf(instance);
    for (const sibling of state.items)
      if (
        sibling.instanceId === item.instanceId &&
        sibling.node === item.node &&
        sibling.state === 'open'
      )
        patchItem(sibling, { state: 'canceled' });
    instance = patch(instance, { active: instance.active.filter((id) => id !== item.node) });
    const edge = nextProcessEdge(graph, item.node, outcome, instance.variables);
    if (!edge) throw new WorkflowError('invalid', `“${item.name}”的结果没有出边`);
    const completed = state.events.findLast(
      (event) => event.workItem === item.id && event.type !== 'arrived',
    );
    if (completed) completed.edge = edge.id;
    traverse(instance.id, edge, { node: item.node, user: actor });
  }

  function assertActive(instance: ProcessInstance) {
    if (instance.status === 'suspended')
      throw new WorkflowError('conflict', '流程已暂停，恢复后才能处理');
    if (instance.status !== 'active') throw new WorkflowError('conflict', '流程已经结束');
  }
  function assertOpen(item: WorkItem) {
    if (item.state !== 'open')
      throw new WorkflowError('conflict', '这条待办已经处理或取消了，请刷新');
  }

  const api = {
    state,
    definitionOf,

    /** 发起流程：从开始节点走，或从给定的节点开始（迁移存量数据） */
    start(input: StartInput): ProcessInstance {
      const definition = definitionOf(input.key);
      const graph = processGraph(definition);
      const instance: ProcessInstance = {
        id: nextId('pi'),
        key: definition.key,
        version: definition.version,
        businessKey: input.businessKey,
        title: input.title,
        status: 'active',
        active: [],
        result: null,
        variables: { ...input.variables },
        startedBy: input.actor,
        startedAt: options.now(),
        endedAt: null,
      };
      state.instances.push(instance);
      record(instance, 'started', input.actor, { node: graph.start?.id ?? null });
      const from = { node: graph.start?.id ?? null, user: input.actor };
      if (input.at?.length) {
        for (const node of input.at) enter(instanceOf(instance.id), node, null, from);
      } else {
        const edge =
          graph.start && nextProcessEdge(graph, graph.start.id, null, instance.variables);
        if (!edge) throw new WorkflowError('invalid', `${definition.name}没有开始节点或出边`);
        const completed = state.events.at(-1)!;
        completed.edge = edge.id;
        traverse(instance.id, edge, from);
      }
      return instanceOf(instance.id);
    },

    /** 认领：岗位收件箱里的、没被认领的、自己没退回过的 */
    claim(itemId: string, actor: string): WorkItem {
      const item = itemOf(itemId);
      assertOpen(item);
      if (!item.pool || item.assignment !== 'pool')
        throw new WorkflowError('conflict', '已经有人认领了');
      if (!directory.inGroup(actor, item.pool))
        throw new WorkflowError('forbidden', '不在这个岗位的收件箱里');
      if (item.releasedBy.includes(actor))
        throw new WorkflowError('forbidden', '你退回过这一条，不能再认领（同一人不得二次认领）');
      const next = patchItem(item, {
        assignee: actor,
        assignment: 'claimed',
        claimedAt: options.now(),
        needsDesignation: false,
      });
      record(instanceOf(item.instanceId), 'claimed', actor, { node: item.node, workItem: item.id });
      return next;
    },

    /** 退回收件箱：认领的人放回去，原因必填并留痕 */
    release(itemId: string, actor: string, reason: string): WorkItem {
      const item = itemOf(itemId);
      assertOpen(item);
      if (item.assignment !== 'claimed' || item.assignee !== actor)
        throw new WorkflowError('forbidden', '只有认领的人能退回收件箱');
      if (!reason.trim()) throw new WorkflowError('invalid', '写明退回收件箱的原因');
      const next = patchItem(item, {
        assignee: null,
        assignment: 'pool',
        claimedAt: null,
        releasedBy: [...item.releasedBy, actor],
      });
      record(instanceOf(item.instanceId), 'released', actor, {
        node: item.node,
        workItem: item.id,
        comment: reason.trim(),
      });
      return next;
    },

    /** 负责人指定承办人：指定即生效，被指定的人只能申请改派 */
    designate(itemId: string, actor: string, assignee: string): WorkItem {
      const item = itemOf(itemId);
      assertOpen(item);
      const group = item.pool;
      if (!group || directory.leaderOf(group) !== actor)
        throw new WorkflowError('forbidden', '只有岗位负责人能指定承办人');
      if (!directory.inGroup(assignee, group))
        throw new WorkflowError('invalid', '被指定的人不在这个岗位');
      const next = patchItem(item, {
        assignee,
        assignment: 'designated',
        claimedAt: options.now(),
        needsDesignation: false,
        reassignRequest: null,
      });
      record(instanceOf(item.instanceId), 'designated', actor, {
        node: item.node,
        workItem: item.id,
        comment: assignee,
      });
      return next;
    },

    /** 申请改派：被指定或流程直接给的，原因必填，负责人处理 */
    requestReassign(itemId: string, actor: string, reason: string): WorkItem {
      const item = itemOf(itemId);
      assertOpen(item);
      if (item.assignee !== actor || item.assignment === 'claimed' || item.assignment === 'pool')
        throw new WorkflowError('forbidden', '认领的可以直接退回收件箱，不用申请改派');
      if (!reason.trim()) throw new WorkflowError('invalid', '写明申请改派的原因');
      const next = patchItem(item, {
        reassignRequest: { by: actor, reason: reason.trim(), at: options.now() },
      });
      record(instanceOf(item.instanceId), 'reassign-requested', actor, {
        node: item.node,
        workItem: item.id,
        comment: reason.trim(),
      });
      return next;
    },

    /** 处理：检查处理结果要求的意见、附件、字段，合并变量，会签按规则汇总后离开节点 */
    complete(itemId: string, actor: string, input: CompleteInput, force = false): WorkItem {
      const item = itemOf(itemId);
      assertOpen(item);
      let instance = instanceOf(item.instanceId);
      assertActive(instance);
      if (!force) {
        if (item.assignee == null) throw new WorkflowError('conflict', '先认领再处理');
        if (item.assignee !== actor) throw new WorkflowError('forbidden', '这条待办不是你的');
      }
      const node = graphOf(instance).node(item.node);
      const outcome = processOutcome(node, input.outcome);
      if (!outcome)
        throw new WorkflowError('invalid', `“${item.name}”没有“${input.outcome}”这个处理结果`);
      const comment = input.comment?.trim() ?? '';
      const attachments = input.attachments ?? [];
      if (outcome.comment === 'required' && !comment)
        throw new WorkflowError('invalid', `${outcome.label}：意见必填`);
      if (outcome.attachments === 'required' && attachments.length === 0)
        throw new WorkflowError('invalid', `${outcome.label}：要上传附件`);
      const variables = { ...instance.variables, ...input.variables };
      const missing = (outcome.fields ?? []).filter((field) => isEmpty(variables[field]));
      if (missing.length)
        throw new WorkflowError('invalid', `${outcome.label}：还要填 ${missing.join('、')}`);
      instance = patch(instance, { variables });
      const done = patchItem(item, {
        state: 'done',
        assignee: item.assignee ?? actor,
        completion: { outcome: outcome.key, comment, attachments, by: actor, at: options.now() },
      });
      record(instance, actor === SYSTEM ? 'auto-completed' : 'completed', actor, {
        node: item.node,
        workItem: item.id,
        outcome: outcome.key,
        comment,
        attachments,
      });
      // 会签：否决一票即止；或签第一份即止；会签等全部处理完，按出现过的否决结果、否则按这一份的结果
      const siblings = state.items.filter(
        (entry) =>
          entry.instanceId === item.instanceId && entry.node === item.node && entry.id !== item.id,
      );
      const waiting = siblings.some((entry) => entry.state === 'open');
      if (
        node?.type === 'task' &&
        node.multi &&
        !outcome.veto &&
        node.multi.complete === 'all' &&
        waiting
      )
        return done;
      leave(done, outcome.key, actor);
      return itemOf(item.id);
    },

    /** 催办：给当前处理人（或岗位负责人）发通知，留痕 */
    remind(itemId: string, actor: string, comment = ''): void {
      const item = itemOf(itemId);
      assertOpen(item);
      record(instanceOf(item.instanceId), 'reminded', actor, {
        node: item.node,
        workItem: item.id,
        comment,
      });
    },

    /** 留言：不改变流程 */
    comment(
      instanceId: string,
      actor: string,
      text: string,
      attachments: readonly string[] = [],
    ): void {
      if (!text.trim()) throw new WorkflowError('invalid', '留言不能为空');
      record(instanceOf(instanceId), 'commented', actor, { comment: text.trim(), attachments });
    },

    /** 暂停：原因必填；待办保留但不能处理 */
    suspend(instanceId: string, actor: string, reason: string): ProcessInstance {
      const instance = instanceOf(instanceId);
      assertActive(instance);
      if (!reason.trim()) throw new WorkflowError('invalid', '写明暂停的原因与恢复条件');
      const next = patch(instance, { status: 'suspended' });
      record(next, 'suspended', actor, { comment: reason.trim() });
      return next;
    },

    /** 恢复 */
    resume(instanceId: string, actor: string): ProcessInstance {
      const instance = instanceOf(instanceId);
      if (instance.status !== 'suspended') throw new WorkflowError('conflict', '流程没有暂停');
      const next = patch(instance, { status: 'active' });
      record(next, 'resumed', actor);
      return next;
    },

    /** 终止：原因必填，取消全部待办 */
    terminate(instanceId: string, actor: string, reason: string): ProcessInstance {
      const instance = instanceOf(instanceId);
      if (instance.status === 'completed' || instance.status === 'terminated')
        throw new WorkflowError('conflict', '流程已经结束');
      if (!reason.trim()) throw new WorkflowError('invalid', '写明终止的原因');
      for (const item of state.items)
        if (item.instanceId === instanceId && item.state === 'open')
          patchItem(item, { state: 'canceled' });
      const next = patch(instance, { status: 'terminated', active: [], endedAt: options.now() });
      record(next, 'terminated', actor, { comment: reason.trim() });
      return next;
    },

    /**
     * 业务数据变了（计划调整同意后换了主办、改了日期）：合并流程变量；from 手上还没处理的待办转给 to，记作指定
     */
    handover(
      instanceId: string,
      actor: string,
      input: { variables?: Readonly<Record<string, unknown>>; from?: string; to?: string },
    ): ProcessInstance {
      const instance = instanceOf(instanceId);
      const next = patch(instance, { variables: { ...instance.variables, ...input.variables } });
      if (!input.from || !input.to || input.from === input.to) return next;
      for (const item of state.items)
        if (
          item.instanceId === instanceId &&
          item.state === 'open' &&
          item.assignee === input.from
        ) {
          patchItem(item, {
            assignee: input.to,
            assignment: 'designated',
            claimedAt: options.now(),
            reassignRequest: null,
          });
          record(next, 'designated', actor, {
            node: item.node,
            workItem: item.id,
            comment: input.to,
          });
        }
      return next;
    },

    /**
     * 流程调整：取消正在处理的待办，把流程移到 nodes（驳回到任意节点、数据修正）；原因必填。
     * 移到的人工节点按退回的规则落到那个节点原来的处理人
     */
    move(
      instanceId: string,
      actor: string,
      nodes: readonly string[],
      reason: string,
    ): ProcessInstance {
      const instance = instanceOf(instanceId);
      assertActive(instance);
      if (!reason.trim()) throw new WorkflowError('invalid', '写明调整的原因');
      for (const item of state.items)
        if (item.instanceId === instanceId && item.state === 'open')
          patchItem(item, { state: 'canceled' });
      state.joins[instanceId] = {};
      const moved = patch(instance, { active: [] });
      record(moved, 'moved', actor, { node: nodes.join(','), comment: reason.trim() });
      const from = { node: instance.active[0] ?? null, user: actor };
      for (const node of nodes)
        enter(
          instanceOf(instanceId),
          node,
          { id: 'moved', from: from.node ?? '', to: node, kind: 'return' },
          from,
        );
      return instanceOf(instanceId);
    },

    /** 处理到期：超时自动完成（节点写了 overdue.outcome），没人认领超过约定工作日的转负责人指定 */
    tick(): void {
      const day = today();
      for (const item of [...state.items]) {
        if (item.state !== 'open') continue;
        const instance = instanceOf(item.instanceId);
        if (instance.status !== 'active') continue;
        const node = graphOf(instance).node(item.node);
        const auto = node?.type === 'task' ? node.overdue?.outcome : undefined;
        if (auto && item.dueOn && item.dueOn < day) {
          api.complete(item.id, SYSTEM, { outcome: auto, comment: '超过时限，视为无异议' }, true);
          continue;
        }
        if (
          item.assignment === 'pool' &&
          !item.needsDesignation &&
          day > addWorkdays(item.createdAt.slice(0, 10), unclaimedWorkdays, calendar)
        ) {
          patchItem(item, { needsDesignation: true });
          record(instance, 'unclaimed', SYSTEM, { node: item.node, workItem: item.id });
        }
      }
    },

    /** 流程实例 */
    instance: instanceOf,
    /** 待办 */
    item: itemOf,
    /** 业务单据的流程实例（同一单据多个流程时按 key 取；取最新发起的） */
    instanceFor(businessKey: string, key?: string): ProcessInstance | undefined {
      return state.instances.findLast(
        (item) => item.businessKey === businessKey && (key == null || item.key === key),
      );
    },
    /** 实例的流转记录（旧的在前） */
    eventsOf(instanceId: string): WorkflowEvent[] {
      return state.events.filter((event) => event.instanceId === instanceId);
    },
    /** 实例的待办 */
    itemsOf(instanceId: string): WorkItem[] {
      return state.items.filter((item) => item.instanceId === instanceId);
    },
  };
  return api;
}

/** 流转模拟 */
export type WorkflowEngine = ReturnType<typeof createWorkflowEngine>;
