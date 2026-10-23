/**
 * 流程（子路径 `@vue-tsx-pro/ui/workflow`）：流程定义（BPMN 2.0 的子集，纯 JSON）与校验、排布、后端流程实例的类型，
 * 以及流程图 FlowDiagram、流转记录 WorkflowTimeline、审批按钮 ApprovalActions。
 *
 *   import { FlowDiagram, validateProcess, type ProcessDefinition } from '@vue-tsx-pro/ui/workflow';
 *
 * 流程的执行在后端引擎，这里只描述流程、显示进度、给出处理的交互。审批领域的组件不放在主入口；
 * 文案自带中英文（messages.ts），别的语言在 Lang.messages.workflow 里补。
 */
export { ApprovalActions, type ApprovalActionsProps, type ApprovalInput } from './ApprovalActions';
export {
  FlowDiagram,
  flowDiagramStyles,
  type FlowDiagramProps,
  type FlowDiagramSizes,
  type FlowNodeState,
} from './FlowDiagram';
export {
  applyProcessEffects,
  evaluateProcessCondition,
  nextProcessEdge,
  processGraph,
  processOutcome,
  resolveProcessValue,
  type ProcessAssignee,
  type ProcessCompareOp,
  type ProcessCompareOps,
  type ProcessCondition,
  type ProcessDefinition,
  type ProcessDue,
  type ProcessEdge,
  type ProcessEffect,
  type ProcessEndNode,
  type ProcessGatewayNode,
  type ProcessGraph,
  type ProcessLane,
  type ProcessMultiInstance,
  type ProcessNode,
  type ProcessNodeBase,
  type ProcessNodeType,
  type ProcessOutcome,
  type ProcessOutcomeKind,
  type ProcessOutcomeKinds,
  type ProcessOverdue,
  type ProcessPoint,
  type ProcessRequirement,
  type ProcessStartNode,
  type ProcessTaskNode,
  type ProcessValue,
  type ProcessVariableRef,
  type ProcessVariables,
} from './definition';
export {
  layoutProcess,
  type FlowLayout,
  type FlowLayoutEdge,
  type FlowLayoutLane,
  type FlowLayoutNode,
  type FlowLayoutOptions,
} from './layout';
export { workflowMessages, type WorkflowEventText, type WorkflowMessages } from './messages';
export {
  processProgress,
  workItemOutcomes,
  type ProcessInstance,
  type ProcessInstanceStatuses,
  type ProcessNodeStates,
  type ProcessProgress,
  type WorkflowEvent,
  type WorkflowEventTypes,
  type WorkItem,
  type WorkItemArrivals,
  type WorkItemAssignments,
  type WorkItemStates,
} from './runtime';
export {
  useWorkflowTimeline,
  workflowTimelineStyles,
  type WorkflowTimelineOptions,
} from './timeline';
export { validateProcess, type ProcessProblem, type ProcessProblemSeverities } from './validate';
