// useTableQuery：翻页立即请求；换排序、条数、筛选、params 回到第一页且只请求一次；“查询”总是重新请求；当前页空了退到最后一页；
// 只翻页时带上已知的总数。tableParams：写成 query 库认的接口参数
import { CalendarDate } from '@internationalized/date';
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import type { DataTableColumn } from '../columns';
import { tableParams, useTableQuery, type TablePage, type TableQuery } from '../use-table-query';

interface Filters {
  keyword: string;
}

/** 假接口：记下每次的查询条件；rows 按 total 与页码算 */
function fakeApi(total = { value: 45 }) {
  const queries: TableQuery<Filters, string | undefined>[] = [];
  const fetcher = async (
    query: TableQuery<Filters, string | undefined>,
  ): Promise<TablePage<number>> => {
    queries.push(query);
    const start = (query.page - 1) * query.pageSize;
    const count = Math.max(0, Math.min(query.pageSize, total.value - start));
    return {
      rows: Array.from({ length: count }, (_, index) => start + index + 1),
      total: total.value,
    };
  };
  return { fetcher, queries, total };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

function setup(
  options: Parameters<typeof useTableQuery<TablePage<number>, Filters, string | undefined>>[1] = {},
  total?: { value: number },
) {
  const api = fakeApi(total);
  const scope = effectScope();
  const table = scope.run(() =>
    useTableQuery(api.fetcher, { filters: { keyword: '' }, ...options }),
  )!;
  return { table, api, stop: () => scope.stop() };
}

describe('useTableQuery', () => {
  it('一开始按第一页、默认条数请求；结果给出 rows 与 total', async () => {
    const { table, api, stop } = setup();
    await flush();
    expect(api.queries[0]).toMatchObject({
      page: 1,
      pageSize: 10,
      sorts: [],
      columnFilters: {},
      total: undefined,
      filters: { keyword: '' },
    });
    expect([table.rows.length, table.total, table.loading]).toEqual([10, 45, false]);
    stop();
  });

  it('翻页立即请求；换排序、每页条数回到第一页', async () => {
    const { table, api, stop } = setup();
    await flush();
    table.page = 3;
    await flush();
    expect(api.queries.at(-1)!.page).toBe(3);
    expect(table.rows[0]).toBe(21);

    table.sort = { key: 'due', direction: 'descending' };
    await flush();
    expect(api.queries.at(-1)).toMatchObject({ page: 1, sorts: [{ key: 'due' }] });
    table.page = 2;
    await flush();
    table.pageSize = 20;
    await flush();
    expect(api.queries.at(-1)).toMatchObject({ page: 1, pageSize: 20 });
    stop();
  });

  it('多列排序：sorts 前面的优先，sort 是第一列，设置 sort 换掉全部', async () => {
    const { table, api, stop } = setup({ sorts: [{ key: 'due', direction: 'descending' }] });
    await flush();
    table.page = 2;
    await flush();
    table.sorts = [...table.sorts, { key: 'name', direction: 'ascending' }];
    await flush();
    expect(api.queries.at(-1)).toMatchObject({ page: 1, sorts: [{ key: 'due' }, { key: 'name' }] });
    expect(table.sort).toEqual({ key: 'due', direction: 'descending' });
    table.sort = null;
    await flush();
    expect(api.queries.at(-1)!.sorts).toEqual([]);
    stop();
  });

  it('“查询”应用新条件并回到第一页；条件没变也重新请求', async () => {
    const { table, api, stop } = setup();
    await flush();
    table.page = 2;
    await flush();
    const before = api.queries.length;
    table.search({ keyword: '研发' });
    await flush();
    expect(api.queries.at(-1)).toMatchObject({ page: 1, filters: { keyword: '研发' } });
    expect(api.queries.length).toBe(before + 1);
    table.search({ keyword: '研发' });
    await flush();
    expect(api.queries.length).toBe(before + 2);
    stop();
  });

  it('params 变了回到第一页，只按新条件请求一次', async () => {
    const tab = ref('all');
    const { table, api, stop } = setup({ params: () => tab.value });
    await flush();
    table.page = 3;
    await flush();
    const before = api.queries.length;
    tab.value = 'overdue';
    await nextTick();
    await flush();
    expect(api.queries.slice(before)).toEqual([
      expect.objectContaining({ page: 1, params: 'overdue' }),
    ]);
    stop();
  });

  it('只翻页、换排序时带上已知的总数；表头筛选、“查询”、refresh 之后重新数', async () => {
    const { table, api, stop } = setup();
    await flush();
    table.page = 2;
    await flush();
    expect(api.queries.at(-1)).toMatchObject({ page: 2, total: 45 });
    table.sort = { key: 'due', direction: 'ascending' };
    await flush();
    expect(api.queries.at(-1)).toMatchObject({ page: 1, total: 45 });
    table.columnFilters = { status: ['draft'] };
    await flush();
    expect(api.queries.at(-1)).toMatchObject({
      page: 1,
      columnFilters: { status: ['draft'] },
      total: undefined,
    });
    table.page = 2;
    await flush();
    expect(api.queries.at(-1)!.total).toBe(45);
    void table.refresh();
    await flush();
    expect(api.queries.at(-1)!.total).toBeUndefined();
    table.search({ keyword: '' });
    await flush();
    expect(api.queries.at(-1)!.total).toBeUndefined();
    stop();
  });

  it('删掉数据后当前页空了：退到最后一页', async () => {
    const total = { value: 45 };
    const { table, stop } = setup({}, total);
    await flush();
    table.page = 5;
    await flush();
    expect(table.rows).toEqual([41, 42, 43, 44, 45]);
    total.value = 38;
    void table.refresh();
    await flush();
    await flush();
    expect([table.page, table.rows.at(-1)]).toEqual([4, 38]);
    stop();
  });
});

describe('tableParams', () => {
  const columns: DataTableColumn<never>[] = [
    { key: 'status', header: '状态', filter: true },
    { key: 'supplier', header: '供应商', filter: { options: 'text' } },
  ];

  it('写成 query 库 parseTableRequest 认的参数：sort、total、filter.、search.，查询栏的条件按线上的文字平铺，条件树写成 JSON', () => {
    const query: TableQuery<Record<string, unknown>, undefined> = {
      page: 2,
      pageSize: 20,
      sorts: [
        { key: 'amount', direction: 'descending' },
        { key: 'id', direction: 'ascending' },
      ],
      columnFilters: { status: ['draft', 'paid'], supplier: [' 启航 '], empty: [' '] },
      total: 368,
      filters: {
        keyword: '泵',
        min: new Decimal('1e-7'),
        id: 9007199254740993n,
        created: { start: new CalendarDate(2026, 1, 1), end: null },
        amount: [null, 500],
        none: { start: null, end: null },
        blank: '',
        missing: undefined,
        categories: ['生产', '研发'],
        condition: { any: [{ field: 'amount', op: 'gte', value: 1000 }] },
      },
      params: undefined,
    };
    expect(tableParams(query, columns)).toEqual({
      page: 2,
      pageSize: 20,
      sort: '-amount,id',
      total: 368,
      'filter.status': ['draft', 'paid'],
      'search.supplier': ' 启航 ',
      keyword: '泵',
      min: '0.0000001',
      id: '9007199254740993',
      created: ['2026-01-01', ''],
      amount: ['', '500'],
      categories: ['生产', '研发'],
      // 条件树（FilterBar 的高级筛选）写成 JSON 文字，后端的 TableRequest 读 condition 参数（query 的 0017）
      condition: '{"any":[{"field":"amount","op":"gte","value":1000}]}',
    });
  });

  it('没有排序、总数、表头筛选时只有页码与条数；不给 columns 时表头筛选都按多选', () => {
    const query: TableQuery<undefined, undefined> = {
      page: 1,
      pageSize: 10,
      sorts: [],
      columnFilters: { supplier: ['启航'] },
      total: undefined,
      filters: undefined,
      params: undefined,
    };
    expect(tableParams(query)).toEqual({ page: 1, pageSize: 10, 'filter.supplier': ['启航'] });
  });
});
