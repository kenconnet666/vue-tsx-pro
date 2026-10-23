/**
 * 流程的接口（后端自研引擎照这里实现）：流程定义、一张卡的流程轨迹、收件箱的页签，
 * 待办的认领、退回收件箱、指定、申请改派、处理、催办，流程实例的留言、暂停、恢复、终止
 */

import type {
  ProcessDefinition,
  ProcessInstance,
  WorkflowEvent,
  WorkItem,
} from '@vue-tsx-pro/ui/workflow';
import type { InboxView } from '../domain/workflow/inbox';
import { apiPaths, fillPath, http } from './client';

/** 一张卡的流程轨迹 */
export interface WorkflowTrace {
  /** 流程实例 */
  instance: ProcessInstance;
  /** 流转记录（旧的在前） */
  events: WorkflowEvent[];
  /** 待办（含已处理、已取消的） */
  items: WorkItem[];
}

/** 处理一条待办时交上去的内容 */
export interface CompleteRequest {
  /** 处理结果 */
  outcome: string;
  /** 意见 */
  comment?: string;
  /** 附件 */
  attachments?: readonly string[];
  /** 业务表单填的流程变量 */
  variables?: Readonly<Record<string, unknown>>;
}

/** 流程定义（各流程的最新版本） */
export const getProcessDefinitions = (signal?: AbortSignal) =>
  http.get<ProcessDefinition[]>(apiPaths.workflowDefinitions, { signal });

/** 一张卡的流程轨迹；key 是流程（同一张卡有任务池与 DMC 审批两个流程时用） */
export const getWorkflowTrace = (businessKey: string, key?: string, signal?: AbortSignal) =>
  http.get<WorkflowTrace>(apiPaths.workflowTrace, { query: { businessKey, key }, signal });

/** 收件箱的一个页签，以及各页签的条数 */
export const listWorkItems = (view: InboxView, signal?: AbortSignal) =>
  http.get<{ items: WorkItem[]; counts: Record<InboxView, number> }>(apiPaths.workItems, {
    query: { view },
    signal,
  });

const itemAction = (id: string, action: string, body?: object) =>
  http.post<WorkItem>(fillPath(apiPaths.workItemAction, { id, action }), body);
const instanceAction = (id: string, action: string, body?: object) =>
  http.post<ProcessInstance>(fillPath(apiPaths.instanceAction, { id, action }), body);

/** 认领 */
export const claimWorkItem = (id: string) => itemAction(id, 'claim');
/** 退回收件箱（原因必填） */
export const releaseWorkItem = (id: string, reason: string) =>
  itemAction(id, 'release', { reason });
/** 负责人指定承办人 */
export const designateWorkItem = (id: string, assignee: string) =>
  itemAction(id, 'designate', { assignee });
/** 申请改派（原因必填） */
export const requestReassign = (id: string, reason: string) =>
  itemAction(id, 'reassign', { reason });
/** 处理 */
export const completeWorkItem = (id: string, input: CompleteRequest) =>
  itemAction(id, 'complete', input);
/** 催办 */
export const remindWorkItem = (id: string, comment = '') => itemAction(id, 'remind', { comment });
/** 留言（不改变流程） */
export const commentOnInstance = (id: string, text: string, attachments: readonly string[] = []) =>
  instanceAction(id, 'comment', { text, attachments });
/** 暂停（原因与恢复条件必填） */
export const suspendInstance = (id: string, reason: string) =>
  instanceAction(id, 'suspend', { reason });
/** 恢复 */
export const resumeInstance = (id: string) => instanceAction(id, 'resume');
/** 终止（原因必填） */
export const terminateInstance = (id: string, reason: string) =>
  instanceAction(id, 'terminate', { reason });
