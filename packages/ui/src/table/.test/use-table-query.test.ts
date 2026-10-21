// useTableQuery：翻页立即请求；换排序、条数、筛选、params 回到第一页且只请求一次；“查询”总是重新请求；当前页空了退到最后一页
import { describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useTableQuery, type TablePage, type TableQuery } from '../use-table-query';

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
      sort: null,
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
    expect(api.queries.at(-1)).toMatchObject({ page: 1, sort: { key: 'due' } });
    table.page = 2;
    await flush();
    table.pageSize = 20;
    await flush();
    expect(api.queries.at(-1)).toMatchObject({ page: 1, pageSize: 20 });
    stop();
  });

  it('“查询”应用新条件并回到第一页；条件没变也重新请求', async () => {
    const { table, api, stop } = setup();
    await flush();
    table.page = 2;
    await flush();
    const before = api.queries.length;
    table.search({ keyword: '复材' });
    await flush();
    expect(api.queries.at(-1)).toMatchObject({ page: 1, filters: { keyword: '复材' } });
    expect(api.queries.length).toBe(before + 1);
    table.search({ keyword: '复材' });
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
