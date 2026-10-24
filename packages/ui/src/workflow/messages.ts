/**
 * 流程组件（FlowDiagram、FlowDesigner、WorkflowTimeline、ApprovalActions）自带的文案：中文与英文各一份，
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
  /** 处理按钮的说明（一组按钮的 aria-label） */
  readonly approvalActions: string;
  /** 设计器：还没选节点时属性面板的提示 */
  readonly designerPickNode: string;
  /** 设计器：属性面板的名称 */
  readonly designerProperties: string;
  /** 设计器的字段：名称、泳道、处理人、时限、超时、超时提醒、处理结果、说明、结束的结果、终止流程 */
  readonly designerFields: {
    readonly name: string;
    readonly lane: string;
    readonly assignee: string;
    readonly due: string;
    readonly overdue: string;
    readonly remind: string;
    readonly outcomes: string;
    readonly description: string;
    readonly result: string;
    readonly terminate: string;
  };
  /** 设计器：处理人的方式 */
  readonly designerAssignees: {
    readonly lane: string;
    readonly pool: string;
    readonly user: string;
    readonly initiator: string;
    readonly sameAs: string;
  };
  /** 设计器：处理人取流程变量时的说明：`('team')` → “取流程变量 team” */
  readonly designerVariable: (name: string) => string;
  /** 设计器：时限的单位 */
  readonly designerDueUnits: { readonly workdays: string; readonly days: string };
  /** 设计器：时限留空的说明，默认“不填没有时限” */
  readonly designerNoDue: string;
  /** 设计器：超时只标出、不自动处理 */
  readonly designerOverdueMark: string;
  /** 设计器：超时自动按某个处理结果完成：`('同意')` → “自动按“同意”处理” */
  readonly designerOverdueAuto: (outcome: string) => string;
  /** 设计器：终止流程的说明 */
  readonly designerTerminateHint: string;
  /** 设计器：校验结果：`(1, 2)` → “1 个错误、2 个警告”；都为 0 时“校验通过” */
  readonly designerProblems: (errors: number, warnings: number) => string;
  /** 设计器：问题列表的名称 */
  readonly designerProblemList: string;
  /** 设计器：发布按钮：`(4)` → “发布 v4” */
  readonly designerPublish: (version: number) => string;
  /** 设计器：比上一个版本有改动，默认“有未发布的修改” */
  readonly designerDirty: string;
  /** 设计器：没有改动时发布按钮的说明，默认“和 v3 一样，没有要发布的修改” */
  readonly designerClean: (version: number) => string;
  /** 设计器：有错误时发布按钮的说明 */
  readonly designerPublishBlocked: string;
  /** 设计器：发布失败 */
  readonly designerPublishFailed: string;
  /** 设计器：节点的类型 */
  readonly designerNodeTypes: Readonly<
    Record<'start' | 'end' | 'task' | 'exclusive' | 'parallel', string>
  >;
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
    approvalActions: '处理',
    designerPickNode: '点流程图上的一个节点，在这里改它的属性',
    designerProperties: '节点属性',
    designerFields: {
      name: '名称',
      lane: '泳道',
      assignee: '处理人',
      due: '时限',
      overdue: '超时',
      remind: '超时提醒处理人与岗位负责人',
      outcomes: '处理结果',
      description: '说明',
      result: '结束的结果',
      terminate: '终止流程',
    },
    designerAssignees: {
      lane: '泳道的岗位收件箱',
      pool: '指定岗位收件箱',
      user: '指定的人',
      initiator: '发起人',
      sameAs: '同另一节点的处理人',
    },
    designerVariable: (name) => `取流程变量 ${name}`,
    designerDueUnits: { workdays: '工作日', days: '自然日' },
    designerNoDue: '不填没有时限',
    designerOverdueMark: '只标出超时',
    designerOverdueAuto: (outcome) => `自动按“${outcome}”处理`,
    designerTerminateHint: '到这里结束整个流程，并行的其他分支一起取消',
    designerProblems: (errors, warnings) =>
      errors + warnings === 0
        ? '校验通过'
        : [errors && `${errors} 个错误`, warnings && `${warnings} 个警告`]
            .filter(Boolean)
            .join('、'),
    designerProblemList: '校验问题',
    designerPublish: (version) => `发布 v${version}`,
    designerDirty: '有未发布的修改',
    designerClean: (version) => `和 v${version} 一样，没有要发布的修改`,
    designerPublishBlocked: '有错误，改完才能发布',
    designerPublishFailed: '发布失败，请重试',
    designerNodeTypes: {
      start: '开始',
      end: '结束',
      task: '人工节点',
      exclusive: '排他网关',
      parallel: '并行网关',
    },
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
    approvalActions: 'Actions',
    designerPickNode: 'Select a node in the flowchart to edit it here',
    designerProperties: 'Node properties',
    designerFields: {
      name: 'Name',
      lane: 'Lane',
      assignee: 'Assignee',
      due: 'Due in',
      overdue: 'When overdue',
      remind: 'Remind the assignee and the lead when overdue',
      outcomes: 'Outcomes',
      description: 'Description',
      result: 'Result',
      terminate: 'Terminate the process',
    },
    designerAssignees: {
      lane: "The lane's inbox",
      pool: 'A specific inbox',
      user: 'A specific person',
      initiator: 'The initiator',
      sameAs: 'Same as another node',
    },
    designerVariable: (name) => `From process variable ${name}`,
    designerDueUnits: { workdays: 'Workdays', days: 'Days' },
    designerNoDue: 'Leave empty for no deadline',
    designerOverdueMark: 'Only mark as overdue',
    designerOverdueAuto: (outcome) => `Complete as “${outcome}”`,
    designerTerminateHint: 'Ends the whole process and cancels parallel branches',
    designerProblems: (errors, warnings) =>
      errors + warnings === 0
        ? 'No problems'
        : [
            errors && `${errors} error${errors === 1 ? '' : 's'}`,
            warnings && `${warnings} warning${warnings === 1 ? '' : 's'}`,
          ]
            .filter(Boolean)
            .join(', '),
    designerProblemList: 'Problems',
    designerPublish: (version) => `Publish v${version}`,
    designerDirty: 'Unpublished changes',
    designerClean: (version) => `Same as v${version}, nothing to publish`,
    designerPublishBlocked: 'Fix the errors before publishing',
    designerPublishFailed: 'Could not publish, please try again',
    designerNodeTypes: {
      start: 'Start',
      end: 'End',
      task: 'User task',
      exclusive: 'Exclusive gateway',
      parallel: 'Parallel gateway',
    },
  },
};
