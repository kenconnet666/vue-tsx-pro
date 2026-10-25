/**
 * 流程定义：审批流程的数据模型（纯 JSON，可序列化、可存库、可在设计器里编辑）。前端用它画流程图、在设计器里改、
 * 按它显示审批的按钮与要填的内容；流程怎么走由后端的流程引擎按同一份定义执行，这里不含运行时。
 *
 * 概念对应 BPMN 2.0 的一个子集，后端引擎照这里实现即可对接：
 *
 *   ProcessLane           ≈ lane：泳道，一个岗位；group 是岗位收件箱（候选组 candidateGroups）
 *   type: 'task'          ≈ userTask：人工节点；assignee 决定进岗位收件箱等认领，还是直接落到某个人
 *   type: 'exclusive'     ≈ exclusiveGateway：按出边的条件只走一条，都不满足走 default
 *   type: 'parallel'      ≈ parallelGateway：分叉时每条出边各走一路，汇合时等所有入边都到了再往下
 *   type: 'start' / 'end' ≈ startEvent / endEvent；terminate 的结束 ≈ terminateEndEvent（结束整个流程）
 *   ProcessEdge           ≈ sequenceFlow：outcome 是人工节点的处理结果（按钮），when 是条件，effects 改流程变量
 *   multi                 ≈ multiInstance：会签（all）与或签（any）
 *
 * 和 BPMN 不同的取舍：条件写成可序列化的表达式树（ProcessCondition），不写脚本字符串，前后端各自求值、结果一致；
 * 人工节点可以直接按处理结果分出多条边（相当于节点后面紧跟一个排他网关），流程图更接近业务画的样子。
 *
 *   const flow: ProcessDefinition = {
 *     key: 'suggestion', name: '供应商建议', version: 1,
 *     lanes: [{ id: 'supplier', name: '供应商' }, { id: 'cost', name: '财务部', group: 'cost' }],
 *     nodes: [
 *       { id: 'start', type: 'start', name: '提交', lane: 'supplier' },
 *       { id: 'check', type: 'task', name: '齐全性检查', lane: 'cost', due: { workdays: 2 },
 *         outcomes: [{ key: 'pass', label: '齐全' }, { key: 'back', label: '退回补充', kind: 'return', comment: 'required' }] },
 *       { id: 'supplement', type: 'task', name: '补充材料', lane: 'supplier', assignee: { type: 'initiator' },
 *         outcomes: [{ key: 'resubmit', label: '重新提交' }] },
 *       { id: 'end', type: 'end', name: '受理', result: 'accepted' },
 *     ],
 *     edges: [
 *       { id: 'e1', from: 'start', to: 'check' },
 *       { id: 'e2', from: 'check', to: 'end', outcome: 'pass' },
 *       { id: 'e3', from: 'check', to: 'supplement', outcome: 'back', kind: 'return' },
 *       { id: 'e4', from: 'supplement', to: 'check' },
 *     ],
 *   };
 */

/** 一个流程（一个版本） */
export interface ProcessDefinition {
  /** 流程的标识，同一流程的各个版本相同（'suggestion'） */
  key: string;
  /** 名称 */
  name: string;
  /** 版本：每次发布加一；进行中的流程按发起时的版本走完，新发起的用最新版本 */
  version: number;
  /** 说明 */
  description?: string;
  /** 泳道（岗位），按显示的先后排；没有泳道的流程画成一条 */
  lanes?: readonly ProcessLane[];
  /** 节点 */
  nodes: readonly ProcessNode[];
  /** 连线 */
  edges: readonly ProcessEdge[];
}

/** 泳道：一个岗位 */
export interface ProcessLane {
  /** 标识 */
  id: string;
  /** 名称（“财务部”） */
  name: string;
  /** 岗位收件箱（候选组）：泳道里的人工节点没写 assignee 时进这个收件箱，岗位里的人认领 */
  group?: string;
}

/** 节点的共同字段 */
export interface ProcessNodeBase {
  /** 标识，流程内唯一 */
  id: string;
  /** 名称（“齐全性检查”） */
  name: string;
  /** 所在泳道 */
  lane?: string;
  /** 说明：流程图的提示、设计器里的备注 */
  description?: string;
  /** 线下动作（如商务洽谈）：流程图画成虚线框；平台上仍要有人回填结果 */
  offline?: boolean;
  /** 在流程图上的位置（设计器拖动后记下，单位 px）；没有时自动排布 */
  position?: ProcessPoint;
  /** 业务附加信息：如这个节点对应的业务状态（{ status: 'evaluating' }），引擎不解释 */
  meta?: Readonly<Record<string, string | number | boolean>>;
}

/** 流程图上的一个点 */
export interface ProcessPoint {
  /** 横坐标 */
  x: number;
  /** 纵坐标 */
  y: number;
}

/** 开始 */
export interface ProcessStartNode extends ProcessNodeBase {
  /** 节点类型 */
  type: 'start';
}

/** 结束 */
export interface ProcessEndNode extends ProcessNodeBase {
  /** 节点类型 */
  type: 'end';
  /** 结束的结果（'approved'、'rejected'、'shelved'）：业务据此判断流程是怎么结束的 */
  result?: string;
  /** 终止结束：到这里就结束整个流程，并行的其他分支一起取消（同 BPMN 的 terminateEndEvent） */
  terminate?: boolean;
}

/** 人工节点：有人处理、给出一个处理结果 */
export interface ProcessTaskNode extends ProcessNodeBase {
  /** 节点类型 */
  type: 'task';
  /** 谁处理；不写时进所在泳道的岗位收件箱 */
  assignee?: ProcessAssignee;
  /** 时限 */
  due?: ProcessDue;
  /** 超过时限怎么办；不写时只标出超时 */
  overdue?: ProcessOverdue;
  /** 处理结果：每个是一个按钮（“齐全”“退回补充”），至少一个 */
  outcomes: readonly ProcessOutcome[];
  /** 会签、或签：一组人各处理一份 */
  multi?: ProcessMultiInstance;
  /** 处理时用的表单：业务自己的标识，前端按它渲染（'estimate'） */
  form?: string;
}

/** 网关：排他（按条件走一条）或并行（分叉、汇合） */
export interface ProcessGatewayNode extends ProcessNodeBase {
  /** 节点类型 */
  type: 'exclusive' | 'parallel';
}

/** 节点 */
export type ProcessNode = ProcessStartNode | ProcessEndNode | ProcessTaskNode | ProcessGatewayNode;

/** 节点的类型 */
export type ProcessNodeType = ProcessNode['type'];

/** 取流程变量里的值（“派给哪个产品团队”由派单时选定） */
export interface ProcessVariableRef {
  /** 变量名 */
  var: string;
}

/** 一个值：直接写，或取流程变量 */
export type ProcessValue<T> = T | ProcessVariableRef;

/** 人工节点由谁处理 */
export type ProcessAssignee =
  /** 进岗位收件箱：岗位里的人认领，先点先得 */
  | { type: 'pool'; group: ProcessValue<string> }
  /** 直接落到一个人（如供应商的主账号、任务的主办责任人） */
  | { type: 'user'; user: ProcessValue<string> }
  /** 发起人 */
  | { type: 'initiator' }
  /** 与另一个节点最后的处理人相同 */
  | { type: 'sameAs'; node: string };

/** 时限：几个工作日、几个自然日，或流程变量里的截止日（ISO 日期） */
export type ProcessDue = { workdays: number } | { days: number } | ProcessVariableRef;

/** 超时的处理 */
export interface ProcessOverdue {
  /** 超时后自动按这个处理结果完成（“超时视为无异议”）；不写时不自动完成 */
  outcome?: string;
  /** 超时时提醒处理人与岗位负责人 */
  remind?: boolean;
}

/** 处理结果的种类：决定按钮的外观与收件箱里的动作 */
export interface ProcessOutcomeKinds {
  /** 通过、提交（默认） */
  approve: unknown;
  /** 否决、不通过 */
  reject: unknown;
  /** 退回：回到之前的节点，默认落到那个节点原来的处理人 */
  return: unknown;
  /** 提级：争议无法收敛，交给上级岗位 */
  escalate: unknown;
  /** 终止：结束流程 */
  terminate: unknown;
}

/** 处理结果的种类 */
export type ProcessOutcomeKind = keyof ProcessOutcomeKinds;

/** 填写要求：必填、可填 */
export type ProcessRequirement = 'required' | 'optional';

/** 人工节点的一个处理结果（一个按钮） */
export interface ProcessOutcome {
  /** 标识，节点内唯一；出边的 outcome 指向它 */
  key: string;
  /** 按钮上的文字（“齐全”“退回补充”） */
  label: string;
  /** 种类，默认 approve */
  kind?: ProcessOutcomeKind;
  /** 意见：必填、可填；不写时不显示意见框 */
  comment?: ProcessRequirement;
  /** 附件：必填、可填；不写时不显示上传 */
  attachments?: ProcessRequirement;
  /** 处理时必须给出的流程变量（派单时选的团队 'team'）：业务表单负责填 */
  fields?: readonly string[];
  /** 会签时一票否决：任何一人选了它，节点立即按它结束 */
  veto?: boolean;
}

/** 会签与或签 */
export interface ProcessMultiInstance {
  /** 参与的人：流程变量里的用户列表 */
  participants: ProcessVariableRef;
  /** all：所有人都处理完才往下（会签）；any：任何一人处理完就往下（或签） */
  complete: 'all' | 'any';
}

/** 连线 */
export interface ProcessEdge {
  /** 标识，流程内唯一 */
  id: string;
  /** 起点节点 */
  from: string;
  /** 终点节点 */
  to: string;
  /** 起点是人工节点时：哪个处理结果走这条；不写时任何结果都可以走（再看 when） */
  outcome?: string;
  /** 条件：满足才走；排他网关按出边的先后取第一条满足的 */
  when?: ProcessCondition;
  /** 排他网关的默认出边：其余都不满足时走它 */
  default?: boolean;
  /** 退回或提级：决定流程图上的画法与目标节点怎样分配处理人（退回落到原处理人，提级进上级岗位的收件箱） */
  kind?: 'return' | 'escalate';
  /** 流程图上的文字；不写时用处理结果的名字 */
  label?: string;
  /** 走这条边时改流程变量（如协商轮次加一） */
  effects?: readonly ProcessEffect[];
}

/** 比较的方式 */
export interface ProcessCompareOps {
  /** 等于 */
  eq: unknown;
  /** 不等于 */
  ne: unknown;
  /** 大于 */
  gt: unknown;
  /** 大于等于 */
  gte: unknown;
  /** 小于 */
  lt: unknown;
  /** 小于等于 */
  lte: unknown;
  /** 在列表里 */
  in: unknown;
  /** 有值（不是 null、undefined、空字符串、空数组） */
  exists: unknown;
}

/** 比较的方式 */
export type ProcessCompareOp = keyof ProcessCompareOps;

/** 条件：比较一个流程变量，或用 all / any / not 组合（可序列化，前后端各自求值） */
export type ProcessCondition =
  | { var: string; op: ProcessCompareOp; value?: unknown }
  | { all: readonly ProcessCondition[] }
  | { any: readonly ProcessCondition[] }
  | { not: ProcessCondition };

/** 改流程变量：赋值，或加一个数（计数） */
export type ProcessEffect = { set: string; value: unknown } | { increment: string; by?: number };

/** 流程变量 */
export type ProcessVariables = Readonly<Record<string, unknown>>;

const isEmpty = (value: unknown) =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0);

/** 两个值按大小比：数字与能读成数字的文字按数值，其余按文字（ISO 日期按文字比就是先后） */
function compare(a: unknown, b: unknown): number {
  const x = typeof a === 'string' && a.trim() !== '' && !Number.isNaN(Number(a)) ? Number(a) : a;
  const y = typeof b === 'string' && b.trim() !== '' && !Number.isNaN(Number(b)) ? Number(b) : b;
  if (typeof x === 'number' && typeof y === 'number') return x - y;
  return String(x).localeCompare(String(y));
}

/** 条件成不成立；变量没有时按 undefined 比较（exists 不成立，eq undefined 成立） */
export function evaluateProcessCondition(
  condition: ProcessCondition,
  variables: ProcessVariables,
): boolean {
  if ('all' in condition)
    return condition.all.every((item) => evaluateProcessCondition(item, variables));
  if ('any' in condition)
    return condition.any.some((item) => evaluateProcessCondition(item, variables));
  if ('not' in condition) return !evaluateProcessCondition(condition.not, variables);
  const actual = variables[condition.var];
  const { value } = condition;
  switch (condition.op) {
    case 'eq':
      return actual === value;
    case 'ne':
      return actual !== value;
    case 'gt':
      return !isEmpty(actual) && compare(actual, value) > 0;
    case 'gte':
      return !isEmpty(actual) && compare(actual, value) >= 0;
    case 'lt':
      return !isEmpty(actual) && compare(actual, value) < 0;
    case 'lte':
      return !isEmpty(actual) && compare(actual, value) <= 0;
    case 'in':
      return Array.isArray(value) && value.includes(actual);
    case 'exists':
      return !isEmpty(actual);
  }
}

/** 按顺序应用变量的改动，返回新的变量（不改原对象）；increment 把没有或不是数字的当作 0 */
export function applyProcessEffects(
  effects: readonly ProcessEffect[],
  variables: ProcessVariables,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...variables };
  for (const effect of effects) {
    if ('set' in effect) next[effect.set] = effect.value;
    else {
      const current = next[effect.increment];
      next[effect.increment] = (typeof current === 'number' ? current : 0) + (effect.by ?? 1);
    }
  }
  return next;
}

/** 取值：直接写的原样返回，变量引用取流程变量 */
export function resolveProcessValue<T>(
  value: ProcessValue<T>,
  variables: ProcessVariables,
): T | undefined {
  return typeof value === 'object' && value !== null && 'var' in value
    ? (variables[value.var] as T | undefined)
    : value;
}

/** 流程的结构索引：按标识找节点、泳道，按节点找出边、入边 */
export interface ProcessGraph {
  /** 流程定义 */
  definition: ProcessDefinition;
  /** 按标识找节点 */
  node(id: string): ProcessNode | undefined;
  /** 按标识找泳道 */
  lane(id: string | undefined): ProcessLane | undefined;
  /** 从这个节点出去的边，按定义的先后 */
  outgoing(id: string): readonly ProcessEdge[];
  /** 进这个节点的边 */
  incoming(id: string): readonly ProcessEdge[];
  /** 开始节点；定义不合法、没有开始时为 undefined */
  start: ProcessStartNode | undefined;
}

const graphs = new WeakMap<ProcessDefinition, ProcessGraph>();

/** 流程的结构索引（同一个定义对象只建一次） */
export function processGraph(definition: ProcessDefinition): ProcessGraph {
  const cached = graphs.get(definition);
  if (cached) return cached;
  const nodes = new Map(definition.nodes.map((node) => [node.id, node]));
  const lanes = new Map((definition.lanes ?? []).map((lane) => [lane.id, lane]));
  const outgoing = new Map<string, ProcessEdge[]>();
  const incoming = new Map<string, ProcessEdge[]>();
  for (const edge of definition.edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]);
  }
  const graph: ProcessGraph = {
    definition,
    node: (id) => nodes.get(id),
    lane: (id) => (id == null ? undefined : lanes.get(id)),
    outgoing: (id) => outgoing.get(id) ?? [],
    incoming: (id) => incoming.get(id) ?? [],
    start: definition.nodes.find((node): node is ProcessStartNode => node.type === 'start'),
  };
  graphs.set(definition, graph);
  return graph;
}

/** 人工节点的处理结果；不是人工节点或没有这个结果时为 undefined */
export function processOutcome(
  node: ProcessNode | undefined,
  key: string,
): ProcessOutcome | undefined {
  return node?.type === 'task' ? node.outcomes.find((outcome) => outcome.key === key) : undefined;
}

/**
 * 节点走哪条出边：when 成立的边里，先取写明了这个处理结果的，再取没写处理结果的，都没有时走默认边；
 * 网关的 outcome 传 null。变量是处理时填好、走边之前的；找不到时为 undefined（定义有漏洞，校验会报出来）
 */
export function nextProcessEdge(
  graph: ProcessGraph,
  nodeId: string,
  outcome: string | null,
  variables: ProcessVariables,
): ProcessEdge | undefined {
  const edges = graph.outgoing(nodeId);
  const candidates = edges.filter(
    (edge) =>
      (edge.outcome == null || edge.outcome === outcome) &&
      !edge.default &&
      (edge.when == null || evaluateProcessCondition(edge.when, variables)),
  );
  return (
    candidates.find((edge) => edge.outcome === outcome) ??
    candidates[0] ??
    edges.find((edge) => edge.default && (edge.outcome == null || edge.outcome === outcome))
  );
}
