/**
 * 经消息端口的传输（docs/decisions/0009 第 2 节）：引擎跑在 Web Worker 里时，页面经 Worker 调用、Worker 里的端点回结果，
 * 数据变了由 Worker 广播。消息带 `flow` 标记，同一个端口上别的消息（演示的身份、时钟）不受影响。
 *
 *   // Worker 里
 *   servePort(self, flowEndpoint(engine, { actor: () => current }));
 *   // 页面
 *   const flow = createFlowClient(portTransport(new Worker(url, { type: 'module' })));
 */
import type { FlowEndpoint } from './endpoint.ts';
import type { FlowRequest, FlowResponse, FlowTransport } from './protocol.ts';

/** 能收发消息的端口：Worker、Worker 里的 self、MessagePort */
export interface MessagePortLike {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  /** MessagePort 要先 start 才收得到 addEventListener 的消息；Worker 没有它 */
  start?(): void;
}

/** 端口上的消息 */
type PortMessage =
  | { readonly flow: 'call'; readonly id: number; readonly request: FlowRequest }
  | { readonly flow: 'result'; readonly id: number; readonly response: FlowResponse }
  | { readonly flow: 'changed' };

const isPortMessage = (data: unknown): data is PortMessage =>
  typeof data === 'object' && data !== null && 'flow' in data;

/** 端点这一头：收调用、回结果，数据变了广播；返回停止服务的函数 */
export function servePort(port: MessagePortLike, endpoint: FlowEndpoint<void>): () => void {
  const onMessage = (event: MessageEvent) => {
    const data: unknown = event.data;
    if (!isPortMessage(data) || data.flow !== 'call') return;
    void endpoint.handle(data.request).then((response) => {
      port.postMessage({ flow: 'result', id: data.id, response } satisfies PortMessage);
    });
  };
  port.addEventListener('message', onMessage);
  port.start?.();
  const stop = endpoint.onChange(() => port.postMessage({ flow: 'changed' } satisfies PortMessage));
  return () => {
    port.removeEventListener('message', onMessage);
    stop();
  };
}

/** 页面这一头：调用发给端口，按编号等结果 */
export function portTransport(port: MessagePortLike): FlowTransport {
  let next = 0;
  const waiting = new Map<number, (response: FlowResponse) => void>();
  const listeners = new Set<() => void>();
  port.addEventListener('message', (event) => {
    const data: unknown = event.data;
    if (!isPortMessage(data)) return;
    if (data.flow === 'result') {
      waiting.get(data.id)?.(data.response);
      waiting.delete(data.id);
    } else if (data.flow === 'changed') {
      for (const listener of listeners) listener();
    }
  });
  port.start?.();
  return {
    call(request) {
      const id = ++next;
      return new Promise((resolve) => {
        waiting.set(id, resolve);
        port.postMessage({ flow: 'call', id, request } satisfies PortMessage);
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
