// QueryTable：查询栏改草稿、点“查询”才交给 query.search，“重置”回到一开始的条件；工具栏的刷新、行高、列设置；
// 表格名称是 title，分页绑定 query 的页码与总数；勾选后出现批量操作栏
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { Field } from '../../form/Field';
import { TextField } from '../../input/TextField';
import type { DataTableColumn } from '../../table/columns';
import type { TablePage, TableQueryState } from '../../table/use-table-query';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { QueryTable } from '../QueryTable';

const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { get: () => 400 });
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
});

interface Order {
  id: string;
  supplier: string;
}
interface Filters {
  keyword: string;
}

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

/** 一个最小的 useTableQuery 状态：记下 search、refresh 的调用 */
function fakeQuery() {
  const state = reactive({
    page: 1,
    pageSize: 10,
    sort: null,
    filters: { keyword: '' } as Filters,
    rows: [
      { id: 'o1', supplier: '华辰' },
      { id: 'o2', supplier: '启航' },
    ] as Order[],
    total: 42,
    data: undefined,
    loading: false,
    error: undefined,
    search: vi.fn((filters: Filters) => (state.filters = filters)),
    refresh: vi.fn(async () => undefined),
  });
  return state as unknown as TableQueryState<TablePage<Order>, Filters> & {
    search: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
}

const columns: DataTableColumn<Order>[] = [
  { key: 'id', header: '单号' },
  { key: 'supplier', header: '供应商' },
];

describe('QueryTable', () => {
  it('查询栏改草稿，点“查询”才交给 query.search；“重置”回到一开始的条件并查询', async () => {
    const query = fakeQuery();
    const root = mount(() => (
      <QueryTable
        query={query}
        columns={columns}
        getKey={(order) => order.id}
        title="采购单"
        filters={(draft) => (
          <Field label="关键字">
            <TextField _value={draft.keyword} />
          </Field>
        )}
      />
    ));
    await flush();
    const input = root.querySelector<HTMLInputElement>('form input')!;
    input.value = '华辰';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    expect(query.search).not.toHaveBeenCalled();
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(query.search).toHaveBeenLastCalledWith({ keyword: '华辰' });
    [...root.querySelectorAll<HTMLButtonElement>('form button')]
      .find((button) => button.textContent === '重置')!
      .click();
    await flush();
    expect(query.search).toHaveBeenLastCalledWith({ keyword: '' });
    expect(input.value).toBe('');
  });

  it('表格名称是 title，分页显示 query 的总数；刷新按钮调 query.refresh；列设置隐藏列', async () => {
    const query = fakeQuery();
    const root = mount(() => (
      <QueryTable query={query} columns={columns} getKey={(order) => order.id} title="采购单" />
    ));
    await flush();
    expect(root.querySelector('table')!.getAttribute('aria-label')).toBe('采购单');
    expect(root.textContent).toContain('第 1–10 条，共 42 条');
    expect(root.querySelector('nav[aria-label="采购单分页"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('button[aria-label="刷新"]')!.click();
    expect(query.refresh).toHaveBeenCalled();

    root.querySelector<HTMLButtonElement>('button[aria-label="列设置"]')!.click();
    await flush();
    const supplier = [...document.querySelectorAll('label')].find((label) =>
      label.textContent?.includes('供应商'),
    )!;
    supplier.querySelector('input')!.click();
    await flush();
    expect(root.querySelectorAll('thead th[scope="col"]')).toHaveLength(1);
  });

  it('多选：勾选后出现批量操作栏，batchActions 拿到已选的 key', async () => {
    const query = fakeQuery();
    let selected = _state<string[]>(['o2']);
    const root = mount(() => (
      <QueryTable
        query={query}
        columns={columns}
        getKey={(order) => order.id}
        title="采购单"
        selectionMode="multiple"
        _selected={selected}
        batchActions={(keys) => <button>批量作废 {keys.join(',')}</button>}
      />
    ));
    await flush();
    expect(root.textContent).toContain('已选 1 项');
    expect(root.textContent).toContain('批量作废 o2');
  });

  it('有查询栏时标题、自己的按钮、刷新并进查询栏那一行（压成一行），表格上方没有单独的工具栏', async () => {
    const query = fakeQuery();
    const root = mount(() => (
      <QueryTable
        query={query}
        columns={columns}
        getKey={(order) => order.id}
        title="采购单"
        filters={(draft) => (
          <Field label="关键字">
            <TextField _value={draft.keyword} />
          </Field>
        )}
        toolbar={<button>新建</button>}
      />
    ));
    await flush();
    const form = root.querySelector('form')!;
    expect(form.textContent).toContain('采购单');
    expect([...form.querySelectorAll('button')].map((button) => button.textContent)).toContain(
      '新建',
    );
    expect(form.querySelector('button[aria-label="刷新"]')).not.toBeNull();
    // 标题只出现一次：表格上方没有再画一行工具栏
    expect(root.querySelectorAll('button[aria-label="刷新"]')).toHaveLength(1);
  });

  it('没有查询栏时，工具栏是表格上方单独的一行', async () => {
    const query = fakeQuery();
    const root = mount(() => (
      <QueryTable
        query={query}
        columns={columns}
        getKey={(order) => order.id}
        title="采购单"
        toolbar={<button>新建</button>}
      />
    ));
    await flush();
    expect(root.querySelector('form')).toBeNull();
    expect(root.textContent).toContain('采购单');
    expect([...root.querySelectorAll('button')].map((button) => button.textContent)).toContain(
      '新建',
    );
  });

  it('条件多时 moreFilters 收起，点“展开”后更多条件排在下面', async () => {
    const query = fakeQuery();
    const root = mount(() => (
      <QueryTable
        query={query}
        columns={columns}
        getKey={(order) => order.id}
        title="采购单"
        filters={(draft) => (
          <Field label="关键字">
            <TextField _value={draft.keyword} />
          </Field>
        )}
        moreFilters={() => (
          <Field label="供应商">
            <TextField />
          </Field>
        )}
      />
    ));
    await flush();
    expect(root.querySelector('form')!.textContent).not.toContain('供应商');
    [...root.querySelectorAll<HTMLButtonElement>('form button')]
      .find((button) => button.textContent === '展开')!
      .click();
    await flush();
    expect(root.querySelector('form')!.textContent).toContain('供应商');
  });

  it('fill：整块占满到窗口底边，表格不再限高', async () => {
    const query = fakeQuery();
    const root = mount(() => (
      <QueryTable
        query={query}
        columns={columns}
        getKey={(order) => order.id}
        title="采购单"
        fill
      />
    ));
    await flush();
    expect(styleTextOf(root.firstElementChild as HTMLElement)).toContain('100dvh');
    expect(styleTextOf(root.querySelector<HTMLElement>('[aria-label="采购单"]')!)).not.toContain(
      '32em',
    );
  });
});
