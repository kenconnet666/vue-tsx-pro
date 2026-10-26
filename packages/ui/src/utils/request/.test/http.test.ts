// createHttpClient：地址与 query、JSON 请求体、typed JSON、按类型读响应、拆响应体与业务错误码、状态码、超时、取消、钩子
import { CalendarDate } from '@internationalized/date';
import Decimal from 'decimal.js';
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

  it('typed JSON：请求体里的 bigint、Decimal、日期写成文字并附上 $types，地址栏参数写成同样的文字', async () => {
    const { fetch, requests } = fakeFetch(() => json({}));
    const http = createHttpClient({ baseURL: 'https://example.test', fetch });
    await http.post('/orders', {
      id: 9007199254740993n,
      amount: new Decimal('12.50'),
      on: new CalendarDate(2024, 1, 31),
    });
    await http.get('/orders', {
      query: { min: new Decimal('1e-7'), on: [new CalendarDate(2024, 1, 1), null], id: 5n },
    });
    expect(await requests[0]!.json()).toEqual({
      id: '9007199254740993',
      amount: '12.5',
      on: '2024-01-31',
      $types: { id: 'bigint', amount: 'decimal', on: 'date' },
    });
    expect(requests[1]!.url).toBe(
      'https://example.test/orders?min=0.0000001&on=2024-01-01&on=&id=5',
    );
  });
});

describe('typed JSON 的响应', () => {
  it('带 $types 的响应先还原再交给 onResponse；wire: false 时原样', async () => {
    const body = {
      code: 0,
      data: { id: '9007199254740993', amount: '12.50' },
      $types: { 'data.id': 'bigint', 'data.amount': 'decimal' },
    };
    const { fetch } = fakeFetch(() => json(body));
    const http = createHttpClient({
      baseURL: 'https://example.test',
      fetch,
      wire: { decimal: Decimal },
      onResponse: (data) => (data as { data: unknown }).data,
    });
    const value = await http.get<{ id: bigint; amount: Decimal }>('/orders/1');
    expect(value.id).toBe(9007199254740993n);
    expect(value.amount.equals('12.5')).toBe(true);
    const plain = createHttpClient({ baseURL: 'https://example.test', fetch, wire: false });
    expect(await plain.get('/orders/1')).toEqual(body);
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
    expect([error.code, error.params, error.status, error.data, error.request.url]).toEqual([
      'http.status',
      { status: 403 },
      403,
      { message: '没有权限' },
      '/admin',
    ]);
    expect(error.message).toBe('请求失败（403 Forbidden）：GET /admin');
  });

  it('envelope: false 时 onRequest 改请求头，onResponse 自己拆 { code: 0, data }、把业务错误变成 HttpError', async () => {
    const { fetch, requests } = fakeFetch((request) =>
      request.url.endsWith('/ok')
        ? json({ code: 0, data: [1, 2], message: '' })
        : json({ code: 40001, data: null, message: '名称重复' }),
    );
    const http = createHttpClient({
      baseURL: 'https://example.test',
      fetch,
      envelope: false,
      onRequest: (request) => request.headers.set('authorization', 'Bearer t'),
      onResponse: (body, context) => {
        const envelope = body as { code: number; data: unknown; message: string };
        if (envelope.code !== 0)
          throw new HttpError(envelope.message, {
            ...context,
            code: `app.${envelope.code}`,
            data: body,
          });
        return envelope.data;
      },
    });
    expect(await http.get('/ok')).toEqual([1, 2]);
    expect(requests[0]!.headers.get('authorization')).toBe('Bearer t');
    const error = (await http.get('/bad').catch((caught: unknown) => caught)) as HttpError;
    expect([error.message, error.code, error.status]).toEqual(['名称重复', 'app.40001', 200]);
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
    expect([error.code, error.params, error.status, error.message]).toEqual([
      'http.timeout',
      { seconds: 0.02 },
      0,
      '请求超时（0.02 秒）：GET /slow',
    ]);
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
    expect([error.code, error.status, error.message, error.cause]).toEqual([
      'http.network',
      0,
      '网络错误：GET /x',
      cause,
    ]);
  });
});

describe('业务错误码的响应体（0008）', () => {
  const client = (body: unknown, init?: Omit<ResponseInit, 'headers'>) =>
    createHttpClient({
      baseURL: 'https://example.test',
      fetch: fakeFetch(() => json(body, init)).fetch,
    });

  it('{ code: "ok", data } 交出 data，data 里的 $types 照样还原', async () => {
    expect(await client({ code: 'ok', data: [1, 2] }).get('/a')).toEqual([1, 2]);
    const page = await client({
      code: 'ok',
      data: { total: '9007199254740993', $types: { total: 'bigint' } },
    }).get('/b');
    expect(page).toEqual({ total: 9007199254740993n });
    expect(await client({ code: 'ok' }).get('/c')).toBeUndefined();
  });

  it('失败的码抛 HttpError，带 message、params、errors；非 2xx 时也以响应体的码为准', async () => {
    const body = {
      code: 'flow.validation-failed',
      message: '表单校验不通过',
      errors: [{ field: 'amount', code: 'max' }],
    };
    const error = (await client(body)
      .post('/submit')
      .catch((caught: unknown) => caught)) as HttpError;
    expect(error).toBeInstanceOf(HttpError);
    expect([error.code, error.message, error.errors, error.status]).toEqual([
      'flow.validation-failed',
      '表单校验不通过',
      [{ field: 'amount', code: 'max' }],
      200,
    ]);
    const proxied = (await client(
      { code: 'flow.forbidden', params: { action: 'claim' } },
      { status: 403 },
    )
      .get('/x')
      .catch((caught: unknown) => caught)) as HttpError;
    expect([proxied.code, proxied.params, proxied.message]).toEqual([
      'flow.forbidden',
      { action: 'claim' },
      'flow.forbidden',
    ]);
  });

  it('不是包装的对象原样交出：有别的键、code 不是文字', async () => {
    expect(await client({ code: 'PO-1', amount: 3 }).get('/order')).toEqual({
      code: 'PO-1',
      amount: 3,
    });
    expect(await client({ code: 0, data: 1 }).get('/legacy')).toEqual({ code: 0, data: 1 });
  });

  it('声明是 JSON 却解析不了：2xx 是 http.parse，非 2xx 仍是 http.status', async () => {
    const html = (status: number) =>
      createHttpClient({
        baseURL: 'https://example.test',
        fetch: fakeFetch(
          () => new Response('<html>', { status, headers: { 'content-type': 'application/json' } }),
        ).fetch,
      });
    const parse = (await html(200)
      .get('/x')
      .catch((caught: unknown) => caught)) as HttpError;
    expect([parse.code, parse.data]).toEqual(['http.parse', '<html>']);
    const status = (await html(502)
      .get('/x')
      .catch((caught: unknown) => caught)) as HttpError;
    expect([status.code, status.data]).toEqual(['http.status', '<html>']);
  });
});
