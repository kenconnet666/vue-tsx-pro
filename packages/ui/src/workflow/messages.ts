/**
 * 流程组件（FlowDiagram、WorkflowTimeline、ApprovalActions）自带的文案：中文与英文各一份，
 * 可以在 createUi 的 lang.messages.workflow 里按字段改写（见 config/lang/messages.ts）
 */
import type { MessageTable } from '../config/lang/messages';

/** 一条流转记录的上下文：谁、在哪个节点、什么结果、补充的说明 */
export interface WorkflowEventText {
  /** 操作人的名字（系统自动的已换成 system 文案） */
  actor: string;
  /** 节点名称 */
  node: string;
  /** 处理结果的名称 */
  outcome: string;
  /** 被指定的人的名字（指定承办人时） */
  target: string;
}

/** 流程组件的文案 */
export interface WorkflowMessages {
  /** 流程图的角色说明（aria-roledescription） */
  readonly diagram: string;
  /** 流程图的说明里正在处理的节点：`，正在处理：齐全性检查` */
  readonly diagramActive: (nodes: string) => string;
  /** 节点状态：已完成 */
  readonly nodeDone: string;
  /** 节点状态：处理中 */
  readonly nodeActive: string;
  /** 节点状态：未到 */
  readonly nodePending: string;
  /** 节点状态：有问题 */
  readonly nodeInvalid: string;
  /** 系统自动的操作人 */
  readonly system: string;
  /** 流转记录：发起 */
  readonly eventStarted: (text: WorkflowEventText) => string;
  /** 流转记录：处理 */
  readonly eventCompleted: (text: WorkflowEventText) => string;
  /** 流转记录：超时自动处理 */
  readonly eventAutoCompleted: (text: WorkflowEventText) => string;
  /** 流转记录：认领 */
  readonly eventClaimed: (text: WorkflowEventText) => string;
  /** 流转记录：退回收件箱 */
  readonly eventReleased: (text: WorkflowEventText) => string;
  /** 流转记录：负责人指定 */
  readonly eventDesignated: (text: WorkflowEventText) => string;
  /** 流转记录：申请改派 */
  readonly eventReassignRequested: (text: WorkflowEventText) => string;
  /** 流转记录：没人认领、转负责人指定 */
  readonly eventUnclaimed: (text: WorkflowEventText) => string;
  /** 流转记录：催办 */
  readonly eventReminded: (text: WorkflowEventText) => string;
  /** 流转记录：留言 */
  readonly eventCommented: (text: WorkflowEventText) => string;
  /** 流转记录：暂停 */
  readonly eventSuspended: (text: WorkflowEventText) => string;
  /** 流转记录：恢复 */
  readonly eventResumed: (text: WorkflowEventText) => string;
  /** 流转记录：终止 */
  readonly eventTerminated: (text: WorkflowEventText) => string;
  /** 流转记录：流程调整 */
  readonly eventMoved: (text: WorkflowEventText) => string;
  /** 流转记录：到达节点 */
  readonly eventArrived: (text: WorkflowEventText) => string;
  /** 流转记录：结束 */
  readonly eventEnded: (text: WorkflowEventText) => string;
  /** 附件列表的说明 */
  readonly attachments: string;
  /** 处理对话框的标题：`退回补充 · 齐全性检查` */
  readonly approvalTitle: (outcome: string, node: string) => string;
  /** 意见 */
  readonly comment: string;
  /** 意见必填时的提示 */
  readonly commentRequired: string;
  /** 附件必传时的提示 */
  readonly attachmentsRequired: string;
  /** 取消 */
  readonly cancel: string;
  /** 处理按钮的说明（一组按钮的 aria-label） */
  readonly approvalActions: string;
}

/** 流程组件的文案表 */
export const workflowMessages: MessageTable<WorkflowMessages> = {
  'zh-CN': {
    diagram: '流程图',
    diagramActive: (nodes) => `，正在处理：${nodes}`,
    nodeDone: '已完成',
    nodeActive: '处理中',
    nodePending: '未到',
    nodeInvalid: '有问题',
    system: '系统',
    eventStarted: ({ actor }) => `${actor} 发起`,
    eventCompleted: ({ actor, node, outcome }) => `${actor} · ${node}：${outcome}`,
    eventAutoCompleted: ({ node, outcome }) => `${node}：${outcome}（超时自动处理）`,
    eventClaimed: ({ actor, node }) => `${actor} 认领了 ${node}`,
    eventReleased: ({ actor, node }) => `${actor} 把 ${node} 退回收件箱`,
    eventDesignated: ({ actor, node, target }) => `${actor} 指定 ${target} 处理 ${node}`,
    eventReassignRequested: ({ actor, node }) => `${actor} 申请改派 ${node}`,
    eventUnclaimed: ({ node }) => `${node} 没人认领，转负责人指定`,
    eventReminded: ({ actor, node }) => `${actor} 催办 ${node}`,
    eventCommented: ({ actor }) => `${actor} 留言`,
    eventSuspended: ({ actor }) => `${actor} 暂停了流程`,
    eventResumed: ({ actor }) => `${actor} 恢复了流程`,
    eventTerminated: ({ actor }) => `${actor} 终止了流程`,
    eventMoved: ({ actor, node }) => `${actor} 把流程调整到 ${node}`,
    eventArrived: ({ node }) => `到达 ${node}`,
    eventEnded: ({ node }) => `结束：${node}`,
    attachments: '附件',
    approvalTitle: (outcome, node) => `${outcome} · ${node}`,
    comment: '意见',
    commentRequired: '写明意见',
    attachmentsRequired: '要上传附件',
    cancel: '取消',
    approvalActions: '处理',
  },
  'en-US': {
    diagram: 'flowchart',
    diagramActive: (nodes) => `, in progress: ${nodes}`,
    nodeDone: 'done',
    nodeActive: 'in progress',
    nodePending: 'not reached',
    nodeInvalid: 'has problems',
    system: 'System',
    eventStarted: ({ actor }) => `${actor} started`,
    eventCompleted: ({ actor, node, outcome }) => `${actor} · ${node}: ${outcome}`,
    eventAutoCompleted: ({ node, outcome }) =>
      `${node}: ${outcome} (overdue, completed automatically)`,
    eventClaimed: ({ actor, node }) => `${actor} claimed ${node}`,
    eventReleased: ({ actor, node }) => `${actor} returned ${node} to the inbox`,
    eventDesignated: ({ actor, node, target }) => `${actor} assigned ${node} to ${target}`,
    eventReassignRequested: ({ actor, node }) => `${actor} asked to reassign ${node}`,
    eventUnclaimed: ({ node }) => `${node} unclaimed, waiting for the lead to assign`,
    eventReminded: ({ actor, node }) => `${actor} sent a reminder for ${node}`,
    eventCommented: ({ actor }) => `${actor} commented`,
    eventSuspended: ({ actor }) => `${actor} suspended the process`,
    eventResumed: ({ actor }) => `${actor} resumed the process`,
    eventTerminated: ({ actor }) => `${actor} terminated the process`,
    eventMoved: ({ actor, node }) => `${actor} moved the process to ${node}`,
    eventArrived: ({ node }) => `Reached ${node}`,
    eventEnded: ({ node }) => `Ended: ${node}`,
    attachments: 'Attachments',
    approvalTitle: (outcome, node) => `${outcome} · ${node}`,
    comment: 'Comment',
    commentRequired: 'A comment is required',
    attachmentsRequired: 'Attach at least one file',
    cancel: 'Cancel',
    approvalActions: 'Actions',
  },
};
