/**
 * 请求层：组件（远程选项、上传、列表查询）只依赖 HttpClient 接口，应用经 createUi / Provider 的 http 给出实现。
 * 默认实现 createHttpClient 是原生 fetch 的薄封装（参考 ky、ofetch）：baseURL、query、JSON 请求体、超时与取消、
 * 拆响应体、带码的错误（HttpError）、请求与响应钩子。用 axios、ky 时只要写一个 request：
 *
 *   createUi({ http: { request: (r) => axios.request({ ...r, params: r.query, data: r.body }).then((res) => res.data) } })
 *
 * 值按线上的 typed JSON 传（见 wire.ts）：请求体里的 bigint、Decimal、CalendarDate 写成文字并附上 `$types`，
 * 地址栏参数写成同样的文字，带 `$types` 的响应先还原再交给 onResponse；`wire: false` 时按普通 JSON。
 *
 * 响应体按业务错误码的约定拆开（flow 仓库 docs/decisions/0008，query、flow 的后端都这样回）：HTTP 一律 200，
 * `{ code: 'ok', data }` 交出 data，`{ code: 'flow.work-item-not-open', message, params, errors }` 抛带这个码的 HttpError；
 * 请求层自己出的错也带码：`http.network`、`http.timeout`、`http.status`（网关回了非 2xx）、`http.parse`（响应读不懂）。
 * 组件按码从语言包取文案（见 error-message.ts）。后端用别的包装（`{ code: 0, data }`）时关掉 envelope，在 onResponse 里拆：
 *
 *   const http = createHttpClient({
 *     baseURL: '/api',
 *     envelope: false,
 *     onRequest: (request) => request.headers.set('Authorization', `Bearer ${token()}`),
 *     onResponse: (body: Envelope, context) => {
 *       if (body.code !== 0) throw new HttpError(body.message, { ...context, code: `app.${body.code}`, data: body });
 *       return body.data;
 *     },
 *   });
 */
import { useConfig } from '../../config/context';
import { fromWire, toWire, wireText, type WireReviveOptions, type WireScalar } from './wire';

/** 请求方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

/**
 * query 里的一个值：null、undefined 不写进地址，数组写成重复的键（a=1&a=2，数组里的 null 是空字符串）；
 * bigint、Decimal、日期等按线上的文字写（wireText：Decimal 不用科学计数法，日期是 ISO）
 */
export type QueryValue = WireScalar | readonly WireScalar[];

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

/** 成功的码 */
export const OK_CODE = 'ok';

/**
 * 请求层自己出的错的码（0008 的 `http.` 命名空间，只在前端产生）。取消不当作错误，仍以 AbortError 拒绝，
 * errorCodeOf 把它认作 `http.aborted`
 */
export const HTTP_ERROR_CODES = [
  'http.network',
  'http.timeout',
  'http.aborted',
  'http.status',
  'http.parse',
] as const;

/** 请求层的错误码 */
export type HttpErrorCode = (typeof HTTP_ERROR_CODES)[number];

/** 后端回的响应体（0008 第 1 节）：成功的 code 是 `ok`，失败是业务错误码 */
export interface ApiEnvelope<T = unknown> {
  /** `ok` 或业务错误码 */
  readonly code: string;
  /** 后端给的说明，只作兜底：界面按 code 取文案 */
  readonly message?: string;
  /** 文案里要填的参数 */
  readonly params?: Readonly<Record<string, unknown>>;
  /** 按字段、按问题的明细（表单校验）：`{ field, code?, message? }` */
  readonly errors?: readonly unknown[];
  /** 成功时的数据 */
  readonly data?: T;
}

/** 请求失败时的上下文：业务错误码、发生在哪个请求、拿到的响应 */
export interface HttpErrorContext {
  /** 业务错误码：后端回的（`flow.`、`query.`、应用自己的）或请求层的（`http.`） */
  code: string;
  /** 文案里要填的参数 */
  params?: Readonly<Record<string, unknown>>;
  /** 按字段、按问题的明细 */
  errors?: readonly unknown[];
  /** 出错的请求 */
  request: HttpRequest;
  /** 响应；网络错误、超时时没有 */
  response?: Response;
  /** 响应体（错误详情），读得到时带上 */
  data?: unknown;
  /** 底层的错误（网络错误、超时） */
  cause?: unknown;
}

/** 请求失败：后端回了业务错误码、状态码不是 2xx、网络错误、超时、响应读不懂，或 onResponse 判定的业务错误 */
export class HttpError extends Error {
  /** 错误名，同类名：日志与 instanceof 之外的判断用 */
  override readonly name = 'HttpError';
  /** 业务错误码（见 HttpErrorContext.code）；界面按它取文案 */
  readonly code: string;
  /** 文案里要填的参数 */
  readonly params: Readonly<Record<string, unknown>>;
  /** 按字段、按问题的明细；useForm 的 submit 据此标到字段上 */
  readonly errors: readonly unknown[];
  /** 出错的请求 */
  readonly request: HttpRequest;
  /** 响应；网络错误、超时时没有 */
  readonly response?: Response;
  /** HTTP 状态码；网络错误、超时为 0 */
  readonly status: number;
  /** 响应体（错误详情） */
  readonly data?: unknown;

  constructor(
    message: string,
    { code, params, errors, request, response, data, cause }: HttpErrorContext,
  ) {
    super(message, { cause });
    this.code = code;
    this.params = params ?? {};
    this.errors = errors ?? [];
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
  /**
   * 按 0008 的约定拆响应体（见文件开头），默认 true：键都在 code、message、params、errors、data 里、code 是文字的对象
   * 才当作包装，其余原样交出。后端用别的包装时给 false，在 onResponse 里拆
   */
  envelope?: boolean;
  /** 成功的响应（拆包之后）的数据交给它：再加工、判定别的业务错误（抛 HttpError），返回值就是请求的结果 */
  onResponse?: (data: unknown, context: { request: HttpRequest; response: Response }) => unknown;
  /**
   * 线上的 typed JSON 怎样还原（见 wire.ts）：给 `{ decimal: Decimal }` 时 decimal 还原成 Decimal，`dates: 'objects'`
   * 时日期还原成 CalendarDate 等；默认 `{}`（bigint 还原成 bigint，decimal 与日期留作文字）。false 时请求体按普通 JSON 发、响应不还原
   */
  wire?: WireReviveOptions | false;
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
  const {
    baseURL = '',
    timeout: defaultTimeout = 30_000,
    onRequest,
    onResponse,
    wire = {},
    envelope: unwrap = true,
  } = options;
  const revive = (value: unknown) => (wire === false ? value : fromWire(value, wire));

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
      body: json
        ? JSON.stringify(wire === false ? body : toWire(body))
        : (body as BodyInit | undefined),
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
      throw new HttpError(message, {
        code: timedOut ? 'http.timeout' : 'http.network',
        params: timedOut ? { seconds: timeout / 1000 } : undefined,
        request: spec,
        cause,
      });
    }
    const context = { request: spec, response };
    const { body: raw, malformed } = await readBody(response, spec.responseType);
    let data: unknown;
    try {
      data = malformed ? raw : revive(raw);
    } catch (cause) {
      throw new HttpError(`响应读不懂：${method} ${spec.url}`, {
        ...context,
        code: 'http.parse',
        data: raw,
        cause,
      });
    }
    const envelope = unwrap && isEnvelope(data) ? data : undefined;
    // 业务错误以响应体的码为准：网关原样转发非 2xx 的业务响应时也认得出
    if (envelope && envelope.code !== OK_CODE) {
      throw new HttpError(envelope.message || envelope.code, {
        ...context,
        code: envelope.code,
        params: envelope.params,
        errors: envelope.errors,
        data,
      });
    }
    if (!response.ok) {
      const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
      throw new HttpError(`请求失败（${status}）：${method} ${spec.url}`, {
        ...context,
        code: 'http.status',
        params: { status: response.status },
        data,
      });
    }
    if (malformed) {
      throw new HttpError(`响应不是 JSON：${method} ${spec.url}`, {
        ...context,
        code: 'http.parse',
        data,
      });
    }
    // 包装里的 data 自己带 $types 时（后端先 toWire 数据再包），再还原一次；已还原过的不再有 $types
    const result = envelope ? revive(envelope.data) : data;
    return (onResponse ? onResponse(result, context) : result) as T;
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
    const items: readonly WireScalar[] = Array.isArray(value) ? value : [value as WireScalar];
    for (const item of items) params.append(key, wireText(item));
  }
  const search = params.toString();
  if (search) full += `${full.includes('?') ? '&' : '?'}${search}`;
  return full;
}

const ENVELOPE_KEYS = new Set(['code', 'message', 'params', 'errors', 'data']);

/** 是不是 0008 的响应体：code 是文字、没有别的键（不把恰好有 code 字段的业务对象当成包装） */
function isEnvelope(value: unknown): value is ApiEnvelope {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.code === 'string' && Object.keys(record).every((key) => ENVELOPE_KEYS.has(key))
  );
}

/** 普通对象与数组按 JSON 发送 */
function isJsonBody(body: unknown): boolean {
  if (body == null || typeof body !== 'object') return false;
  const prototype = Object.getPrototypeOf(body) as unknown;
  return Array.isArray(body) || prototype === Object.prototype || prototype === null;
}

/** 读响应体；声明是 JSON 却解析不了（网关的 HTML 错误页）时交出原文并标上 malformed */
async function readBody(
  response: Response,
  type: HttpRequest['responseType'],
): Promise<{ body: unknown; malformed?: boolean }> {
  if (
    response.status === 204 ||
    response.status === 205 ||
    response.headers.get('content-length') === '0'
  ) {
    return { body: undefined };
  }
  const contentType = response.headers.get('content-type') ?? '';
  const kind =
    type ??
    (/[/+]json\b/.test(contentType) ? 'json' : contentType.startsWith('text/') ? 'text' : 'blob');
  if (kind === 'blob') return { body: await response.blob() };
  const text = await response.text();
  if (kind === 'text') return { body: text };
  if (text === '') return { body: undefined };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { body: text, malformed: true };
  }
}
