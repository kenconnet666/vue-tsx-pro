/**
 * 经 HTTP 的传输（服务端部署，docs/decisions/0009 第 2 节）：页面 POST 一次调用，服务端的端点按会话定身份。
 * 服务端只用 Web 标准的 Request / Response，Nitro、Hono、Bun、Deno 的路由里都能直接挂：
 *
 *   // 服务端（Nitro：server/api/flow.post.ts）
 *   const endpoint = flowEndpoint<Request>(engine, { actor: (request) => actorOfSession(request) });
 *   const handle = flowHttpHandler(endpoint);
 *   export default defineEventHandler((event) => handle(toWebRequest(event)));
 *   // 页面
 *   const flow = createFlowClient(httpTransport('/api/flow', { subscribe }));
 *
 * “数据变了”的推送不走这条路（HTTP 拉不到推送）：endpoint.onChange 接到应用自己的推送（kit 的失效推送、SSE、WebSocket），
 * 页面那头经 subscribe 交给客户端。
 */
import type { FlowEndpoint } from './endpoint.ts';
import type { FlowRequest, FlowResponse, FlowTransport } from './protocol.ts';

/** 引擎的错误代号 → HTTP 状态（响应体照样是 FlowResponse，状态只给日志、监控、网关看） */
const STATUS: Readonly<Record<string, number>> = {
  'not-found': 404,
  forbidden: 403,
  'invalid-input': 400,
  internal: 500,
};

const json = (body: FlowResponse, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const refused = (status: number, message: string) =>
  json({ ok: false, error: { code: 'invalid-input', message, details: '{}' } }, status);

const isRequest = (body: unknown): body is FlowRequest =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as FlowRequest).method === 'string' &&
  typeof (body as FlowRequest).args === 'string';

/** 服务端：POST 的 JSON 体是一次调用，回 FlowResponse；端点拿到的上下文就是这个 Request（按它的 cookie、头定身份） */
export function flowHttpHandler(
  endpoint: FlowEndpoint<Request>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== 'POST') return refused(405, '流程的接口只收 POST');
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return refused(400, '请求体不是 JSON');
    }
    if (!isRequest(body)) return refused(400, '请求体要是 { method, args }');
    const response = await endpoint.handle(body, request);
    return json(response, response.ok ? 200 : (STATUS[response.error.code] ?? 409));
  };
}

/** httpTransport 的选项 */
export interface HttpTransportOptions {
  /** 发请求的函数，默认全局的 fetch（测试、带重试的封装时换掉） */
  readonly fetch?: typeof fetch;
  /** 每次请求带上的头（令牌、CSRF）；给函数时每次调用时取 */
  readonly headers?: HeadersInit | (() => HeadersInit);
  /** 订阅“数据变了”：接到应用自己的推送上；不给时客户端的 onChange 不会触发 */
  readonly subscribe?: FlowTransport['subscribe'];
}

/** 页面这一头：每次调用 POST 到 url；网关报错、回的不是 JSON 时成 internal 错误 */
export function httpTransport(url: string, options: HttpTransportOptions = {}): FlowTransport {
  const send = options.fetch ?? fetch;
  return {
    async call(request) {
      const headers = typeof options.headers === 'function' ? options.headers() : options.headers;
      const response = await send(url, {
        method: 'POST',
        headers: {
          ...Object.fromEntries(new Headers(headers)),
          'content-type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'same-origin',
      });
      try {
        return (await response.json()) as FlowResponse;
      } catch {
        return {
          ok: false,
          error: {
            code: 'internal',
            message: `流程的接口回了 HTTP ${response.status}`,
            details: '{}',
          },
        };
      }
    },
    ...(options.subscribe ? { subscribe: options.subscribe } : {}),
  };
}
