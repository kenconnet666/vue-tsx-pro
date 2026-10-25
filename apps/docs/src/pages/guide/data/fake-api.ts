/**
 * “请求与数据”指南的假接口：内存里的供应商（虚构），经一个假的 fetch 交给 createHttpClient。
 * 回应带 300–800 ms 的随机延迟、遵守取消，数据包在 { code, data, message } 里，与常见后端一致；
 * failure.next 让下一次请求返回业务错误，演示出错与重试。
 */
import { createHttpClient, HttpError, parseSorts } from '@vue-tsx-pro/ui';

/** 一家供应商 */
export interface Supplier {
  id: string;
  name: string;
  city: string;
  category: string;
}

/** 一页结果 */
export interface SupplierPage {
  rows: Supplier[];
  total: number;
}

const prefixes = ['华辰', '启航', '远图', '恒润', '青禾', '北辰', '云帆', '若水', '明川', '星屿'];
const kinds = ['精密生产', '研发成型', '钣金', '标准件', '线束', '密封件'];
const cities = ['上海', '苏州', '西安', '成都', '沈阳', '南昌'];

const suppliers: Supplier[] = prefixes.flatMap((prefix, row) =>
  kinds.slice(0, 3 + (row % 4)).map((kind, column) => ({
    id: `S${String(row * 10 + column + 1).padStart(3, '0')}`,
    name: `${prefix}${kind}有限公司`,
    city: cities[(row + column) % cities.length]!,
    category: kind,
  })),
);

/** 让下一次请求失败（演示出错与重试） */
export const failure = { next: false };

interface Envelope<T> {
  code: number;
  data: T;
  message: string;
}

const respond = <T>(body: Envelope<T>) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

/** 假的 fetch：GET /api/suppliers?keyword=&page=&pageSize=&sort=-name,city（tableParams 写出的参数，同 query 库的 parseTableRequest） */
async function fakeFetch(input: RequestInfo | URL): Promise<Response> {
  const request = input as Request;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 300 + Math.random() * 500);
    request.signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(request.signal.reason);
    });
  });
  if (failure.next) {
    failure.next = false;
    return respond({ code: 50001, data: null, message: '供应商服务暂时不可用，请稍后重试' });
  }
  const url = new URL(request.url);
  if (url.pathname !== '/api/suppliers') return new Response(null, { status: 404 });
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
  const matched = suppliers.filter(
    (item) => !keyword || item.name.includes(keyword) || item.city.includes(keyword),
  );
  // 排序：逗号分隔的字段名，减号是倒序（formatSorts 的写法）
  const sorts = parseSorts(url.searchParams.get('sort') ?? '');
  matched.sort((a, b) => {
    for (const { key, direction } of sorts) {
      const order = a[key as keyof Supplier].localeCompare(b[key as keyof Supplier], 'zh-CN');
      if (order !== 0) return direction === 'ascending' ? order : -order;
    }
    return 0;
  });
  const rows = matched.slice((page - 1) * pageSize, page * pageSize);
  return respond({ code: 0, data: { rows, total: matched.length }, message: '' });
}

/** 演示用的客户端：拆掉 { code, data, message }，code 不是 0 时抛 HttpError */
export const demoHttp = createHttpClient({
  baseURL: '/api',
  fetch: fakeFetch,
  onResponse: (body, context) => {
    const envelope = body as Envelope<unknown>;
    if (envelope.code !== 0) throw new HttpError(envelope.message, { ...context, data: body });
    return envelope.data;
  },
});
