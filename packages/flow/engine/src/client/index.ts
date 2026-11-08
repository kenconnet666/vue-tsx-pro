/**
 * 引擎的客户端（`@zerodep-dev/flow-ts-engine/client`）：页面经它用引擎，不带身份、不导入引擎本身（浏览器主线程也能用）。
 * 传输可换：Worker 的消息端口（portTransport），或自己写一个经 HTTP 的。见 docs/decisions/0009 第 2 节
 */
export { createFlowClient, type DraftInput, type FlowClient } from './client.ts';
export { portTransport, servePort, type MessagePortLike } from './port.ts';
export type { FlowRequest, FlowResponse, FlowTransport } from './protocol.ts';
export { FlowError, type FlowErrorCode } from '../core/errors.ts';
