/**
 * 流程引擎：createFlowEngine 建引擎，engine.run(command, actor) 执行命令；设计见 packages/flow/docs/decisions/0001-design.md
 */
export { createFlowEngine, type FlowEngine } from './engine.ts';
export type {
  CcItem,
  Incident,
  InstanceActions,
  InstanceDetail,
  OutcomeView,
  PublishOptions,
  ReturnTarget,
  StartView,
  TodoItem,
  TypedProcess,
  CatalogEntry,
  CheckResult,
  MigrationCandidate,
  NotificationView,
  VersionInfo,
  WorkItemDetail,
  WorkItemField,
} from './views.ts';
export { FlowError, type FlowErrorCode } from './core/errors.ts';
export { flowEndpoint, type FlowEndpoint, type FlowEndpointOptions } from './client/endpoint.ts';
export { flowHttpHandler, httpTransport, type HttpTransportOptions } from './client/http.ts';
export {
  createFlowClient,
  portTransport,
  servePort,
  type DraftInput,
  type FlowClient,
  type FlowRequest,
  type FlowResponse,
  type FlowTransport,
  type MessagePortLike,
} from './client/index.ts';
export { type NextStep, type PickPrompt, type Picks } from './runtime/next-steps.ts';
export {
  FlowCc,
  FlowDefinition,
  FlowEvent,
  FlowInstance,
  FlowJob,
  FlowNotification,
  FlowWorkItem,
  flowSchema,
  type FlowDb,
} from './core/entities.ts';
export {
  BUILTIN_OPERATIONS,
  type OperationContext,
  type OperationField,
  type OperationScope,
  type OperationView,
  type WorkItemOperation,
} from './commands/operations.ts';
export { defineLogic, defineScenarios, type FlowLogic } from './extensions.ts';
export {
  buildProject,
  compileProject,
  linkProject,
  type CompiledProject,
  type HostModule,
  type HostModules,
  type LinkedProject,
  type TransformCode,
} from './publish/project.ts';
export type { RunState } from './runtime/state.ts';
export type { InstanceRow, WorkItemRow } from './runtime/execution.ts';
export type * from './types.ts';
