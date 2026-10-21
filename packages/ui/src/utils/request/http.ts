/**
 * 请求层：组件（远程选项、上传、列表查询）只依赖 HttpClient 接口，应用经 createUi / Provider 的 http 给出实现。
 * 默认实现 createHttpClient 是原生 fetch 的薄封装（参考 ky、ofetch）：baseURL、query、JSON 请求体、超时与取消、
 * 状态码错误（HttpError）、请求与响应钩子。用 axios、ky 时只要写一个 request：
 *
 *   createUi({ http: { request: (r) => axios.request({ ...r, params: r.query, data: r.body }).then((res) => res.data) } })
 *
 * 后端把数据包在 { code, data, message } 里时，在 onResponse 里拆开，业务错误抛 HttpError：
 *
 *   const http = createHttpClient({
 *     baseURL: '/api',
 *     onRequest: (request) => request.headers.set('Authorization', `Bearer ${token()}`),
 *     onResponse: (body: Envelope, context) => {
 *       if (body.code !== 0) throw new HttpError(body.message, { ...context, data: body });
 *       return body.data;
 *     },
 *   });
 */
import { useConfig } from '../../config/context';

/** 请求方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

/** query 里的一个值：null、undefined 不写进地址，数组写成重复的键（a=1&a=2） */
export type QueryValue =
  string | number | boolean | null | undefined | readonly (string | number | boolean)[];

/** 一次请求 */
export interface HttpRequest {
  /** 请求方法，默认 GET */
  method?: HttpMethod;
  /** 地址：相对地址拼在 baseURL 后面，完整地址（https://…）原样使用 */
  url: string;
  /** 查询参数 */
  query?: Readonly<Record<string, QueryValue>>;
  /** 请求体：普通对象与数组按 JSON 发送；FormData、Blob、URLSearchParams、字符串原样发送 */
  body?: unknown;
  /** 请求头，盖过客户端的默认请求头 */
  headers?: Readonly<Record<string, string>>;
  /** 取消：abort 后请求中止，Promise 以 AbortError 拒绝 */
  signal?: AbortSignal;
  /** 超时（毫秒），盖过客户端的设置；0 表示不限 */
  timeout?: number;
  /** 怎样读响应体，默认按 content-type：JSON 解析，text/* 读成文字，其余读成 Blob */
  responseType?: 'json' | 'text' | 'blob';
}

/** 组件依赖的请求接口：发出请求，返回解析（拆包）后的数据；失败时拒绝 */
export interface HttpClient {
  /** 发出一次请求，返回解析（拆包）后的数据；失败时以 HttpError 拒绝，取消时以 AbortError 拒绝 */
  request<T = unknown>(request: HttpRequest): Promise<T>;
}

/** 请求失败时的上下文：发生在哪个请求、拿到的响应 */
export interface HttpErrorContext {
  /** 出错的请求 */
  request: HttpRequest;
  /** 响应；网络错误、超时时没有 */
  response?: Response;
  /** 响应体（错误详情），读得到时带上 */
  data?: unknown;
  /** 底层的错误（网络错误、超时） */
  cause?: unknown;
}

/** 请求失败：状态码不是 2xx、网络错误、超时，或 onResponse 判定的业务错误 */
export class HttpError extends Error {
  /** 错误名，同类名：日志与 instanceof 之外的判断用 */
  override readonly name = 'HttpError';
  /** 出错的请求 */
  readonly request: HttpRequest;
  /** 响应；网络错误、超时时没有 */
  readonly response?: Response;
  /** HTTP 状态码；网络错误、超时为 0 */
  readonly status: number;
  /** 响应体（错误详情） */
  readonly data?: unknown;

  constructor(message: string, { request, response, data, cause }: HttpErrorContext) {
    super(message, { cause });
    this.request = request;
    this.response = response;
    this.status = response?.status ?? 0;
    this.data = data;
  }
}

/** 是不是主动取消（abort）造成的拒绝：界面上不当作错误 */
export const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

/** createHttpClient 的选项 */
export interface HttpClientOptions {
  /** 相对地址的前缀，如 '/api' */
  baseURL?: string;
  /** 每个请求都带的请求头 */
  headers?: Readonly<Record<string, string>>;
  /** 超时（毫秒），默认 30000；0 表示不限 */
  timeout?: number;
  /** 发出之前改请求（加令牌、追踪编号）；可以返回一个新的 Request */
  onRequest?: (request: Request) => Request | void | Promise<Request | void>;
  /** 2xx 响应解析后的数据交给它：拆掉后端的包装、判定业务错误（抛 HttpError），返回值就是请求的结果 */
  onResponse?: (data: unknown, context: { request: HttpRequest; response: Response }) => unknown;
  /** 换掉 fetch（测试、SSR、注入公共处理） */
  fetch?: typeof fetch;
}

/** createHttpClient 的结果：request 之外，再给常用方法的简写 */
export interface FetchClient extends HttpClient {
  /** GET：参数写在 options.query 里 */
  get<T = unknown>(url: string, options?: Omit<HttpRequest, 'url' | 'method'>): Promise<T>;
  /** DELETE */
  delete<T = unknown>(url: string, options?: Omit<HttpRequest, 'url' | 'method'>): Promise<T>;
  /** POST：普通对象的 body 按 JSON 发送 */
  post<T = unknown>(
    url: string,
    body?: unknown,
    options?: Omit<HttpRequest, 'url' | 'method' | 'body'>,
  ): Promise<T>;
  /** PUT：普通对象的 body 按 JSON 发送 */
  put<T = unknown>(
    url: string,
    body?: unknown,
    options?: Omit<HttpRequest, 'url' | 'method' | 'body'>,
  ): Promise<T>;
  /** PATCH：普通对象的 body 按 JSON 发送 */
  patch<T = unknown>(
    url: string,
    body?: unknown,
    options?: Omit<HttpRequest, 'url' | 'method' | 'body'>,
  ): Promise<T>;
}

/** 原生 fetch 的薄封装（见文件开头） */
export function createHttpClient(options: HttpClientOptions = {}): FetchClient {
  const { baseURL = '', timeout: defaultTimeout = 30_000, onRequest, onResponse } = options;

  async function request<T>(spec: HttpRequest): Promise<T> {
    const { method = 'GET', body, signal, timeout = defaultTimeout } = spec;
    const headers = new Headers({ ...options.headers, ...spec.headers });
    const json = isJsonBody(body);
    if (json && !headers.has('content-type')) headers.set('content-type', 'application/json');
    const signals = [signal, timeout > 0 ? AbortSignal.timeout(timeout) : undefined].filter(
      (item): item is AbortSignal => item != null,
    );
    let prepared = new Request(buildUrl(baseURL, spec.url, spec.query), {
      method,
      headers,
      body: json ? JSON.stringify(body) : (body as BodyInit | undefined),
      signal: signals.length > 1 ? AbortSignal.any(signals) : signals[0],
    });
    prepared = (await onRequest?.(prepared)) ?? prepared;

    let response: Response;
    try {
      response = await (options.fetch ?? fetch)(prepared);
    } catch (cause) {
      // 调用方取消的：原样交出（AbortError），界面据此不当作错误
      if (signal?.aborted) throw cause;
      const timedOut = cause instanceof DOMException && cause.name === 'TimeoutError';
      const message = timedOut
        ? `请求超时（${timeout / 1000} 秒）：${method} ${spec.url}`
        : `网络错误：${method} ${spec.url}`;
      throw new HttpError(message, { request: spec, cause });
    }
    const data = await readBody(response, spec.responseType);
    if (!response.ok) {
      const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
      throw new HttpError(`请求失败（${status}）：${method} ${spec.url}`, {
        request: spec,
        response,
        data,
      });
    }
    return (onResponse ? onResponse(data, { request: spec, response }) : data) as T;
  }

  const withBody =
    (method: HttpMethod) =>
    <T>(url: string, body?: unknown, rest?: Omit<HttpRequest, 'url' | 'method' | 'body'>) =>
      request<T>({ ...rest, method, url, body });
  return {
    request,
    get: (url, rest) => request({ ...rest, method: 'GET', url }),
    delete: (url, rest) => request({ ...rest, method: 'DELETE', url }),
    post: withBody('POST'),
    put: withBody('PUT'),
    patch: withBody('PATCH'),
  };
}

let fallback: FetchClient | undefined;

/**
 * 当前配置的请求客户端（在 setup 里调用）：createUi / Provider 的 http；都没给时是一个默认的 createHttpClient()
 */
export function useHttp(): HttpClient {
  return useConfig().http ?? (fallback ??= createHttpClient());
}

/** 地址 + query：相对地址拼在 baseURL 后面（斜杠不重复），null、undefined 的参数跳过 */
function buildUrl(baseURL: string, url: string, query: HttpRequest['query']): string {
  const absolute = /^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('//');
  let full =
    absolute || !baseURL ? url : `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, String(item));
  }
  const search = params.toString();
  if (search) full += `${full.includes('?') ? '&' : '?'}${search}`;
  return full;
}

/** 普通对象与数组按 JSON 发送 */
function isJsonBody(body: unknown): boolean {
  if (body == null || typeof body !== 'object') return false;
  const prototype = Object.getPrototypeOf(body) as unknown;
  return Array.isArray(body) || prototype === Object.prototype || prototype === null;
}

async function readBody(response: Response, type: HttpRequest['responseType']): Promise<unknown> {
  if (
    response.status === 204 ||
    response.status === 205 ||
    response.headers.get('content-length') === '0'
  ) {
    return undefined;
  }
  const contentType = response.headers.get('content-type') ?? '';
  const kind =
    type ??
    (/[/+]json\b/.test(contentType) ? 'json' : contentType.startsWith('text/') ? 'text' : 'blob');
  if (kind === 'blob') return response.blob();
  const text = await response.text();
  if (kind === 'text') return text;
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    // 声明是 JSON 却解析不了（网关的 HTML 错误页）：交出原文，状态码错误里还能看到
    return text;
  }
}
