/**
 * 服务端分页的列表：页码、每页条数、排序、表头筛选、已应用的筛选条件、总数、加载与出错一起管（参考 ProTable 的 request、
 * alova 的 usePagination）。请求交给 useRequest：只采用最后一次、取消上一次、翻页时保留当前这页。
 *
 *   const tasks = useTableQuery(
 *     (query, signal) => http.request<TablePage<Task>>({ url: '/tasks', query: tableParams(query, columns), signal }),
 *     { filters: blankFilters(), pageSize: 20 },
 *   );
 *   <FilterBar onSearch={() => tasks.search({ ...draft })} … />
 *   <DataTable rows={tasks.rows} loading={tasks.loading} _sort={_bind(tasks.sort)} manualSort … />
 *   <PaginationBar _page={_bind(tasks.page)} _pageSize={_bind(tasks.pageSize)} total={tasks.total} />
 *
 * 排序是几列（sorts，前面的优先）：单列排序的表格绑 sort（第一列），多列排序（DataTable 的 multiSort）绑 sorts。
 * 表头筛选（DataTable 的 filters，manualFilter）绑 columnFilters。换排序、每页条数、筛选条件或 params 时回到第一页；
 * 删掉数据后当前页空了，退到最后一页。只翻页、换排序或条数时，交给 fetcher 的 total 是上一次的总数，服务端可以不再数行数。
 * syncToUrl 把页码、条数、排序（sort=-amount,name：减号是倒序，同 JSON:API）、筛选条件放进地址的查询参数（见 useQueryState）。
 *
 * tableParams 把一次查询写成接口的参数，与 query 库的 parseTableRequest、Java 的 TableRequest.parse 一一对应（query 仓库的 0016）。
 */
import { shallowRef, watch, type Ref } from 'vue';
import {
  useQueryState,
  useQueryStates,
  type QueryCodec,
  type QueryCodecs,
} from '../config/query-state';
import type { QueryValue } from '../utils/request/http';
import { useRequest } from '../utils/request/use-request';
import { toWire, wireText, type WireScalar } from '../utils/request/wire';
import {
  columnFilter,
  formatSorts,
  parseSorts,
  type DataTableColumn,
  type SortState,
} from './columns';

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
  /** 排序，前面的优先；空数组是默认顺序。发给服务端时写成 formatSorts(sorts)（`-amount,name`） */
  sorts: readonly SortState[];
  /** 表头筛选：列 key → 选中的值（关键字筛选时是 [关键字]），同 DataTable 的 filters */
  columnFilters: Readonly<Record<string, readonly string[]>>;
  /**
   * 已知的总条数：只翻页、换排序或每页条数时是上一次结果的 total，服务端可以不再数行数；
   * 筛选条件、表头筛选、params 变了，或“查询”、refresh 时为 undefined
   */
  total: number | undefined;
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
  /** 一开始的排序，前面的优先 */
  sorts?: readonly SortState[];
  /** 一开始的表头筛选 */
  columnFilters?: Record<string, string[]>;
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

/** 排序：sort=amount 正序，sort=-amount,name 先按 amount 倒序再按 name，sort= 是默认顺序 */
const sortCodec: QueryCodec<readonly SortState[]> = {
  parse: (value) => parseSorts(typeof value === 'string' ? value : (value[0] ?? '')),
  serialize: formatSorts,
};

/** useTableQuery 的返回值：page、pageSize、sort（或 sorts）可以直接 _bind 到 PaginationBar（或 Pagination、PageSizeSelect）、DataTable */
export interface TableQueryState<Result extends TablePage<unknown>, Filters> {
  /** 第几页：改了立即请求 */
  page: number;
  /** 每页条数：改了回到第一页 */
  pageSize: number;
  /** 排序的第一列，给单列排序的表格绑定：改了回到第一页；设置时换掉全部排序，null 是默认顺序 */
  sort: SortState | null;
  /** 全部排序，前面的优先，给多列排序（multiSort）的表格绑定：改了回到第一页 */
  sorts: SortState[];
  /** 表头筛选，给 DataTable 的 filters（manualFilter）绑定：改了回到第一页 */
  columnFilters: Record<string, string[]>;
  /** 已应用的筛选条件 */
  readonly filters: Filters;
  /** 应用新的筛选条件（查询栏的“查询”）：回到第一页，条件没变也重新请求（并重新数总数） */
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
  /** 按当前条件重新请求（新建、删除之后），重新数总数 */
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
  const sorts = url
    ? useQueryState<readonly SortState[]>('sort', options.sorts ?? [], sortCodec)
    : shallowRef<readonly SortState[]>(options.sorts ?? []);
  const columnFilters = shallowRef<Record<string, string[]>>(options.columnFilters ?? {});
  const filters: Ref<Filters> =
    url && options.filters
      ? (useQueryStates(options.filters, url.filters as QueryCodecs<object>) as Ref<Filters>)
      : shallowRef(options.filters as Filters);
  const readParams = () => options.params?.() as Params;
  // 上一次结果的总数，以及它所属的条件（筛选条件、表头筛选、params）；不是响应式的，记下它不会引起请求
  let known: { scope: string; total: number } | undefined;
  const scopeOf = (
    query: Pick<TableQuery<Filters, Params>, 'filters' | 'columnFilters' | 'params'>,
  ) => JSON.stringify(toWire([query.filters, query.columnFilters, query.params]));

  const request = useRequest(fetcher, {
    params: () => {
      const query = {
        page: page.value,
        pageSize: pageSize.value,
        sorts: sorts.value,
        columnFilters: columnFilters.value,
        filters: filters.value,
        params: readParams(),
      };
      return { ...query, total: known?.scope === scopeOf(query) ? known.total : undefined };
    },
    onSuccess: (result, query) => {
      known = { scope: scopeOf(query), total: result.total };
      // 删掉数据后当前页空了：退到最后一页（侦听器随即按新页码请求）
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
      return sorts.value[0] ?? null;
    },
    set sort(value) {
      sorts.value = value ? [value] : [];
      page.value = 1;
    },
    get sorts() {
      return [...sorts.value];
    },
    set sorts(value) {
      sorts.value = value;
      page.value = 1;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    set columnFilters(value) {
      columnFilters.value = value;
      page.value = 1;
    },
    get filters() {
      return filters.value;
    },
    search(next) {
      known = undefined;
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
    refresh: () => {
      known = undefined;
      return request.refresh();
    },
  };
}

/** 区间：DateRangePicker 的 { start, end }（两端都含） */
interface RangeValue {
  start?: WireScalar;
  end?: WireScalar;
}

/** 是区间 { start, end } */
const isRange = (value: unknown): value is RangeValue =>
  typeof value === 'object' && value !== null && ('start' in value || 'end' in value);

/**
 * 一次查询写成接口的地址栏参数，与 query 库的 parseTableRequest、Java 的 TableRequest.parse 一一对应（query 仓库的 0016）：
 * page、pageSize；有排序时 sort=-amount,name；已知总数时 total；表头筛选里多选的列写成 filter.列=值（可重复），
 * 关键字的列（列定义的 filter.options 是 'text'，要给 columns 才分得清）写成 search.列=关键字；查询栏的条件按字段名平铺，
 * 值按线上的文字写（wireText：Decimal 不用科学计数法、日期是 ISO），数组写成重复的参数，区间 { start, end } 写成两个同名参数
 * （空的一端是空字符串），空值不写。page、pageSize、sort、total 与 filter.、search. 开头的名字留给这里，查询栏的字段不要用。
 */
export function tableParams<Filters, Params>(
  query: TableQuery<Filters, Params>,
  columns: readonly DataTableColumn<never>[] = [],
): Record<string, QueryValue> {
  const out: Record<string, QueryValue> = { page: query.page, pageSize: query.pageSize };
  const sort = formatSorts(query.sorts);
  if (sort) out.sort = sort;
  if (query.total !== undefined) out.total = query.total;
  const keyword = new Set(
    columns
      .filter((column) => columnFilter(column)?.options === 'text')
      .map((column) => column.key),
  );
  for (const [key, values] of Object.entries(query.columnFilters)) {
    const kept = values.filter((value) => value.trim() !== '');
    if (kept.length === 0) continue;
    if (keyword.has(key)) out[`search.${key}`] = kept[0];
    else out[`filter.${key}`] = kept;
  }
  if (typeof query.filters === 'object' && query.filters !== null) {
    for (const [key, value] of Object.entries(query.filters)) {
      const param = filterParam(value);
      if (param !== undefined) out[key] = param;
    }
  }
  return out;
}

/** 查询栏里一个条件写成参数：空值不写；数组、区间写成几个同名参数；其余是线上的文字 */
function filterParam(value: unknown): QueryValue | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const items = Array.isArray(value)
    ? (value as WireScalar[]).map(wireText)
    : isRange(value)
      ? [wireText(value.start), wireText(value.end)]
      : undefined;
  if (items) return items.every((item) => item === '') ? undefined : items;
  return wireText(value as WireScalar);
}
