/**
 * 服务端分页的列表：页码、每页条数、排序、已应用的筛选条件、总数、加载与出错一起管（参考 ProTable 的 request、
 * alova 的 usePagination）。请求交给 useRequest：只采用最后一次、取消上一次、翻页时保留当前这页。
 *
 *   const tasks = useTableQuery(
 *     ({ page, pageSize, sort, filters }, signal) =>
 *       http.request<TablePage<Task>>({ url: '/tasks', query: { page, pageSize, ...filters, sort: sort?.key }, signal }),
 *     { filters: blankFilters(), pageSize: 20 },
 *   );
 *   <FilterBar onSearch={() => tasks.search({ ...draft })} … />
 *   <DataTable rows={tasks.rows} loading={tasks.loading} sort={_bind(tasks.sort)} manualSort … />
 *   <PaginationBar page={_bind(tasks.page)} pageSize={_bind(tasks.pageSize)} total={tasks.total} />
 *
 * 换排序、每页条数、筛选条件或 params 时回到第一页；删掉数据后当前页空了，退到最后一页。
 * syncToUrl 把页码、条数、排序（sort=-amount 是倒序，同 JSON:API）、筛选条件放进地址的查询参数（见 useQueryState）。
 */
import { shallowRef, watch, type Ref } from 'vue';
import {
  useQueryState,
  useQueryStates,
  type QueryCodec,
  type QueryCodecs,
} from '../config/query-state';
import { useRequest } from '../utils/request/use-request';
import type { SortState } from './columns';

/** 一页结果；后端多给的字段（各页签的条数）照样留在 data 里 */
export interface TablePage<T> {
  /** 这一页的行 */
  rows: readonly T[];
  /** 符合条件的总条数 */
  total: number;
}

/** 交给 fetcher 的查询条件 */
export interface TableQuery<Filters, Params> {
  /** 第几页，从 1 开始 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 排序；null 是默认顺序 */
  sort: SortState | null;
  /** 已应用的筛选条件 */
  filters: Filters;
  /** options.params 的当前值 */
  params: Params;
}

/** useTableQuery 的选项 */
export interface TableQueryOptions<Filters, Params> {
  /** 一开始已应用的筛选条件 */
  filters?: Filters;
  /** 每页条数，默认 10（同 Pagination、PageSizeSelect） */
  pageSize?: number;
  /** 一开始的排序 */
  sort?: SortState | null;
  /** 筛选条件之外也决定结果的值（当前页签、数据源）：变了回到第一页重新请求 */
  params?: () => Params;
  /**
   * 页码（page）、条数（pageSize）、排序（sort）、筛选条件（键名同 filters）同步到地址：刷新、分享链接、后退回来还是这些条件。
   * 需要路由适配给出 query、replaceQuery（vueRouterAdapter 有）；筛选条件按初始值的类型读写，别的类型在 filters 里给写法
   */
  syncToUrl?: boolean | { filters?: QueryCodecs<Filters> };
}

/** 正整数（页码、条数） */
const positiveInteger: QueryCodec<number> = {
  parse(value) {
    const number = Number(typeof value === 'string' ? value : value[0]);
    return Number.isInteger(number) && number >= 1 ? number : undefined;
  },
  serialize: String,
};

/** 排序：sort=amount 正序，sort=-amount 倒序，sort= 是默认顺序 */
const sortCodec: QueryCodec<SortState | null> = {
  parse(value) {
    const text = typeof value === 'string' ? value : (value[0] ?? '');
    if (text === '') return null;
    return text.startsWith('-')
      ? { key: text.slice(1), direction: 'descending' }
      : { key: text, direction: 'ascending' };
  },
  serialize: (sort) => (sort ? (sort.direction === 'descending' ? '-' : '') + sort.key : ''),
};

/** useTableQuery 的返回值：page、pageSize、sort 可以直接 _bind 到 PaginationBar（或 Pagination、PageSizeSelect）、DataTable */
export interface TableQueryState<Result extends TablePage<unknown>, Filters> {
  /** 第几页：改了立即请求 */
  page: number;
  /** 每页条数：改了回到第一页 */
  pageSize: number;
  /** 排序：改了回到第一页 */
  sort: SortState | null;
  /** 已应用的筛选条件 */
  readonly filters: Filters;
  /** 应用新的筛选条件（查询栏的“查询”）：回到第一页，条件没变也重新请求 */
  search(filters: Filters): void;
  /** 当前页的行；没有结果时为空数组 */
  readonly rows: Result['rows'];
  /** 总条数；第一次结果回来之前为 0 */
  readonly total: number;
  /** 最后一次成功的完整结果（含后端多给的字段） */
  readonly data: Result | undefined;
  /** 正在请求 */
  readonly loading: boolean;
  /** 最后一次失败的原因 */
  readonly error: unknown;
  /** 按当前条件重新请求（新建、删除之后） */
  refresh(): Promise<Result | undefined>;
}

/** 服务端分页的列表状态（在 setup 里调用；见文件开头） */
export function useTableQuery<
  Result extends TablePage<unknown>,
  Filters = undefined,
  Params = undefined,
>(
  fetcher: (query: TableQuery<Filters, Params>, signal: AbortSignal) => Promise<Result>,
  options: TableQueryOptions<Filters, Params> = {},
): TableQueryState<Result, Filters> {
  const url = options.syncToUrl === true ? {} : options.syncToUrl || undefined;
  const page = url ? useQueryState('page', 1, positiveInteger) : shallowRef(1);
  const pageSize = url
    ? useQueryState('pageSize', options.pageSize ?? 10, positiveInteger)
    : shallowRef(options.pageSize ?? 10);
  const sort = url
    ? useQueryState('sort', options.sort ?? null, sortCodec)
    : shallowRef<SortState | null>(options.sort ?? null);
  const filters: Ref<Filters> =
    url && options.filters
      ? (useQueryStates(options.filters, url.filters as QueryCodecs<object>) as Ref<Filters>)
      : shallowRef(options.filters as Filters);
  const readParams = () => options.params?.() as Params;

  const request = useRequest(fetcher, {
    params: () => ({
      page: page.value,
      pageSize: pageSize.value,
      sort: sort.value,
      filters: filters.value,
      params: readParams(),
    }),
    // 删掉数据后当前页空了：退到最后一页（侦听器随即按新页码请求）
    onSuccess: (result, query) => {
      const last = Math.max(1, Math.ceil(result.total / query.pageSize));
      if (result.rows.length === 0 && query.page > last) page.value = last;
    },
  });
  // 同步回到第一页：与 params 的变化在同一轮里交给请求，不会先按旧页码请求一次
  if (options.params) watch(readParams, () => (page.value = 1), { flush: 'sync' });

  return {
    get page() {
      return page.value;
    },
    set page(value) {
      page.value = value;
    },
    get pageSize() {
      return pageSize.value;
    },
    set pageSize(value) {
      pageSize.value = value;
      page.value = 1;
    },
    get sort() {
      return sort.value;
    },
    set sort(value) {
      sort.value = value;
      page.value = 1;
    },
    get filters() {
      return filters.value;
    },
    search(next) {
      filters.value = next;
      page.value = 1;
      void request.refresh();
    },
    get rows() {
      return request.data?.rows ?? ([] as Result['rows']);
    },
    get total() {
      return request.data?.total ?? 0;
    },
    get data() {
      return request.data;
    },
    get loading() {
      return request.loading;
    },
    get error() {
      return request.error;
    },
    refresh: () => request.refresh(),
  };
}
