/**
 * 流程运行时的数据：后端流程引擎返回的流程实例、待办（收件箱里的一条）与流转记录。前端只读这些数据来显示
 * 收件箱、审批按钮、流转记录与流程图上的进度；推进流程（认领、处理、退回、提级、催办）是调用后端的接口。
 *
 * 收件箱的规则（岗位收件箱、认领制）：
 * - 流转到一个岗位：进岗位收件箱（pool），岗位里的人都看得到，先认领先得；认领后别人看不到；
 * - 认领后可以退回收件箱（要写原因），同一人不能再认领同一条；
 * - 超过约定的工作日没人认领：岗位负责人指定承办人，指定即生效，被指定的人只能申请改派；
 * - 退回：直接落到那个节点原来的处理人，不进收件箱；提级：进上级岗位的收件箱。
 */
import type { ProcessDefinition, ProcessOutcome, ProcessVariables } from './definition';
import { processGraph } from './definition';

/** 流程实例的状态 */
export interface ProcessInstanceStatuses {
  /** 进行中 */
  active: unknown;
  /** 暂停：待办留着，但不能处理 */
  suspended: unknown;
  /** 走到了结束节点 */
  completed: unknown;
  /** 被终止 */
  terminated: unknown;
}

/** 一个流程实例（一张建议卡、方案卡、任务卡各有一个） */
export interface ProcessInstance {
  /** 标识 */
  id: string;
  /** 流程标识 */
  key: string;
  /** 按哪个版本走 */
  version: number;
  /** 业务单据的编号（建议编号、任务编号） */
  businessKey: string;
  /** 标题：收件箱、通知里显示 */
  title: string;
  /** 状态 */
  status: keyof ProcessInstanceStatuses;
  /** 正在处理的节点（并行时多个） */
  active: readonly string[];
  /** 走到的结束节点的结果；没结束时为 null */
  result: string | null;
  /** 流程变量 */
  variables: ProcessVariables;
  /** 发起人 */
  startedBy: string;
  /** 发起时间（ISO） */
  startedAt: string;
  /** 结束时间；没结束时为 null */
  endedAt: string | null;
}

/** 待办怎么到这个人、这个岗位的（收件箱里的“动作”） */
export interface WorkItemArrivals {
  /** 流程开始后的第一个节点 */
  start: unknown;
  /** 转派：跨岗位流转，进岗位收件箱等认领 */
  forward: unknown;
  /** 退回：落到原来的处理人 */
  return: unknown;
  /** 提级：进上级岗位的收件箱 */
  escalate: unknown;
}

/** 待办落到人的方式 */
export interface WorkItemAssignments {
  /** 在岗位收件箱里，还没人认领 */
  pool: unknown;
  /** 自己认领的 */
  claimed: unknown;
  /** 流程直接落到这个人（退回、指定的处理人、会签的参与人） */
  direct: unknown;
  /** 岗位负责人指定的：不能拒绝，只能申请改派 */
  designated: unknown;
}

/** 待办的状态 */
export interface WorkItemStates {
  /** 待处理 */
  open: unknown;
  /** 已处理 */
  done: unknown;
  /** 已取消（流程终止、会签被否决、并行分支被结束） */
  canceled: unknown;
}

/** 一条待办：一个人工节点上的一份工作 */
export interface WorkItem {
  /** 标识 */
  id: string;
  /** 所属的流程实例 */
  instanceId: string;
  /** 流程标识 */
  processKey: string;
  /** 业务单据的编号 */
  businessKey: string;
  /** 流程实例的标题 */
  title: string;
  /** 节点 */
  node: string;
  /** 节点名称 */
  name: string;
  /** 岗位收件箱；直接落到人的为 null */
  pool: string | null;
  /** 处理人：认领、指定或流程直接给的；在收件箱里等认领时为 null */
  assignee: string | null;
  /** 怎么落到这个人的 */
  assignment: keyof WorkItemAssignments;
  /** 怎么到这个节点的 */
  arrival: keyof WorkItemArrivals;
  /** 从哪个节点、谁那里来的；流程开始的第一个节点是发起人 */
  from: { node: string | null; user: string | null };
  /** 状态 */
  state: keyof WorkItemStates;
  /** 到达时间（ISO） */
  createdAt: string;
  /** 截止日（ISO 日期）；没有时限时为 null */
  dueOn: string | null;
  /** 认领、指定的时间 */
  claimedAt: string | null;
  /** 退回过收件箱的人：不能再认领这一条 */
  releasedBy: readonly string[];
  /** 没人认领超过约定的工作日，等岗位负责人指定 */
  needsDesignation: boolean;
  /** 申请改派：谁、为什么 */
  reassignRequest: { by: string; reason: string; at: string } | null;
  /** 会签的参与人 */
  participant: string | null;
  /** 处理的结果、意见、附件、处理人与时间；没处理时为 null */
  completion: {
    outcome: string;
    comment: string;
    attachments: readonly string[];
    by: string;
    at: string;
  } | null;
}

/** 流转记录的种类 */
export interface WorkflowEventTypes {
  /** 发起 */
  started: unknown;
  /** 到达一个节点（生成待办） */
  arrived: unknown;
  /** 认领 */
  claimed: unknown;
  /** 退回收件箱 */
  released: unknown;
  /** 负责人指定 */
  designated: unknown;
  /** 申请改派 */
  'reassign-requested': unknown;
  /** 处理 */
  completed: unknown;
  /** 超时后自动处理 */
  'auto-completed': unknown;
  /** 没人认领、等负责人指定 */
  unclaimed: unknown;
  /** 催办 */
  reminded: unknown;
  /** 留言 */
  commented: unknown;
  /** 暂停 */
  suspended: unknown;
  /** 恢复 */
  resumed: unknown;
  /** 终止 */
  terminated: unknown;
  /** 走到结束节点 */
  ended: unknown;
}

/** 一条流转记录 */
export interface WorkflowEvent {
  /** 标识 */
  id: string;
  /** 流程实例 */
  instanceId: string;
  /** 种类 */
  type: keyof WorkflowEventTypes;
  /** 时间（ISO） */
  at: string;
  /** 操作人；系统自动的为 'system' */
  actor: string;
  /** 节点 */
  node: string | null;
  /** 待办 */
  workItem: string | null;
  /** 走过的连线（处理后流向下一个节点） */
  edge: string | null;
  /** 处理结果 */
  outcome: string | null;
  /** 意见、原因 */
  comment: string;
  /** 附件 */
  attachments: readonly string[];
}

/** 流程图上节点的进度 */
export interface ProcessNodeStates {
  /** 走过了 */
  done: unknown;
  /** 正在处理 */
  active: unknown;
  /** 还没到 */
  pending: unknown;
}

/** 流程图上的进度：每个节点的状态、走过的连线 */
export interface ProcessProgress {
  /** 节点 → 状态；没列出的是 pending */
  nodes: Readonly<Record<string, keyof ProcessNodeStates>>;
  /** 走过的连线 */
  edges: ReadonlySet<string>;
}

/**
 * 从流转记录推出流程图上的进度：处理过的节点是 done，实例正在处理的是 active，走过的连线都标出（退回的也算）。
 * 结束了的实例，走到的结束节点是 done
 */
export function processProgress(
  instance: Pick<ProcessInstance, 'active' | 'status'>,
  events: readonly Pick<WorkflowEvent, 'type' | 'node' | 'edge'>[],
): ProcessProgress {
  const nodes: Record<string, keyof ProcessNodeStates> = {};
  const edges = new Set<string>();
  for (const event of events) {
    if (event.edge) edges.add(event.edge);
    if (event.node && ['started', 'completed', 'auto-completed', 'ended'].includes(event.type))
      nodes[event.node] = 'done';
  }
  if (instance.status === 'active' || instance.status === 'suspended')
    for (const node of instance.active) nodes[node] = 'active';
  return { nodes, edges };
}

/** 待办所在节点的处理结果（审批按钮）；节点不在定义里时是空数组 */
export function workItemOutcomes(
  definition: ProcessDefinition,
  item: Pick<WorkItem, 'node'>,
): readonly ProcessOutcome[] {
  const node = processGraph(definition).node(item.node);
  return node?.type === 'task' ? node.outcomes : [];
}
