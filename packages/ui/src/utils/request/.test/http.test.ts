// createHttpClient：地址与 query、JSON 请求体、按类型读响应、状态码与业务错误、超时、取消、钩子
import { describe, expect, it, vi } from 'vitest';
import { createHttpClient, HttpError, isAbortError } from '../http';

/** 记下发出的请求，按给的函数回应 */
function fakeFetch(respond: (request: Request) => Response | Promise<Response>) {
  const requests: Request[] = [];
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const request = input as Request;
    requests.push(request);
    return respond(request);
  }) as unknown as typeof globalThis.fetch;
  return { fetch, requests };
}

const json = (body: unknown, init: Omit<ResponseInit, 'headers'> = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json' },
  });

describe('地址与请求体', () => {
  it('相对地址拼在 baseURL 后面（斜杠不重复）；null、undefined 的参数跳过，数组写成重复的键', async () => {
    const { fetch, requests } = fakeFetch(() => json({}));
    const http = createHttpClient({ baseURL: 'https://example.test/api/', fetch });
    await http.get('/users', { query: { page: 2, tags: ['a', 'b'], keyword: null, done: false } });
    await http.get('https://other.test/x?a=1', { query: { b: 2 } });
    expect(requests.map((request) => request.url)).toEqual([
      'https://example.test/api/users?page=2&tags=a&tags=b&done=false',
      'https://other.test/x?a=1&b=2',
    ]);
  });

  it('普通对象按 JSON 发送并带上 content-type；FormData 原样发送', async () => {
    const { fetch, requests } = fakeFetch(() => json({}));
    const http = createHttpClient({ baseURL: 'https://example.test', fetch });
    await http.post('/users', { name: '林小满' });
    const form = new FormData();
    form.append('file', 'x');
    await http.post('/files', form);
    expect(requests[0]!.method).toBe('POST');
    expect(requests[0]!.headers.get('content-type')).toBe('application/json');
    expect(await requests[0]!.json()).toEqual({ name: '林小满' });
    expect(requests[1]!.headers.get('content-type')).not.toBe('application/json');
  });
});

describe('响应', () => {
  it('按 content-type 读：JSON 解析、文字原样、204 没有内容', async () => {
    const responses = [
      json({ id: 1 }),
      new Response('ok', { headers: { 'content-type': 'text/plain' } }),
      new Response(null, { status: 204 }),
    ];
    const { fetch } = fakeFetch(() => responses.shift()!);
    const http = createHttpClient({ baseURL: 'https://example.test', fetch });
    expect(await http.get('/a')).toEqual({ id: 1 });
    expect(await http.get('/b')).toBe('ok');
    expect(await http.delete('/c')).toBeUndefined();
  });

  it('状态码不是 2xx：HttpError 带状态码、错误详情与请求', async () => {
    const { fetch } = fakeFetch(() =>
      json({ message: '没有权限' }, { status: 403, statusText: 'Forbidden' }),
    );
    const http = createHttpClient({ baseURL: 'https://example.test', fetch });
    const error = (await http.get('/admin').catch((caught: unknown) => caught)) as HttpError;
    expect(error).toBeInstanceOf(HttpError);
    expect([error.status, error.data, error.request.url]).toEqual([
      403,
      { message: '没有权限' },
      '/admin',
    ]);
    expect(error.message).toBe('请求失败（403 Forbidden）：GET /admin');
  });

  it('onRequest 改请求头，onResponse 拆掉 { code, data, message }、把业务错误变成 HttpError', async () => {
    const { fetch, requests } = fakeFetch((request) =>
      request.url.endsWith('/ok')
        ? json({ code: 0, data: [1, 2], message: '' })
        : json({ code: 40001, data: null, message: '名称重复' }),
    );
    const http = createHttpClient({
      baseURL: 'https://example.test',
      fetch,
      onRequest: (request) => request.headers.set('authorization', 'Bearer t'),
      onResponse: (body, context) => {
        const envelope = body as { code: number; data: unknown; message: string };
        if (envelope.code !== 0) throw new HttpError(envelope.message, { ...context, data: body });
        return envelope.data;
      },
    });
    expect(await http.get('/ok')).toEqual([1, 2]);
    expect(requests[0]!.headers.get('authorization')).toBe('Bearer t');
    const error = (await http.get('/bad').catch((caught: unknown) => caught)) as HttpError;
    expect([error.message, error.status]).toEqual(['名称重复', 200]);
  });
});

describe('超时、取消与网络错误', () => {
  /** 一直不回应，直到请求被中止（同原生 fetch：发出时已经中止的直接拒绝） */
  const hang = () =>
    fakeFetch(
      (request) =>
        new Promise((_, reject) => {
          if (request.signal.aborted) reject(request.signal.reason);
          request.signal.addEventListener('abort', () => reject(request.signal.reason));
        }),
    );

  it('超时：HttpError，状态码 0，说明超时多久', async () => {
    const { fetch } = hang();
    const http = createHttpClient({ baseURL: 'https://example.test', fetch, timeout: 20 });
    const error = (await http.get('/slow').catch((caught: unknown) => caught)) as HttpError;
    expect(error).toBeInstanceOf(HttpError);
    expect([error.status, error.message]).toEqual([0, '请求超时（0.02 秒）：GET /slow']);
  });

  it('调用方取消：原样交出 AbortError，不当作 HttpError', async () => {
    const { fetch } = hang();
    const http = createHttpClient({ baseURL: 'https://example.test', fetch });
    const controller = new AbortController();
    const pending = http
      .get('/slow', { signal: controller.signal })
      .catch((caught: unknown) => caught);
    controller.abort();
    const error = await pending;
    expect(isAbortError(error)).toBe(true);
    expect(error).not.toBeInstanceOf(HttpError);
  });

  it('网络错误：HttpError，状态码 0，cause 是底层错误', async () => {
    const cause = new TypeError('Failed to fetch');
    const http = createHttpClient({
      baseURL: 'https://example.test',
      fetch: () => Promise.reject(cause),
    });
    const error = (await http.get('/x').catch((caught: unknown) => caught)) as HttpError;
    expect([error.status, error.message, error.cause]).toEqual([0, '网络错误：GET /x', cause]);
  });
});
