// 表格的多列排序、表头筛选、列菜单：纯函数（nextSorts、formatSorts / parseSorts、sortRows 多列、filterOptions、filterRows、arrangeColumns）
// 与 DataTable 里的交互（Shift 点追加排序、筛选按钮写回 filters 并只留下匹配的行、列菜单的隐藏 / 固定 / 移动）
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { createStatusMap } from '../../utils/data/status';
import {
  arrangeColumns,
  filterOptions,
  filterRows,
  formatSorts,
  nextSorts,
  parseSorts,
  sortRows,
  type ColumnStickies,
  type DataTableColumn,
  type SortState,
} from '../columns';
import { DataTable } from '../DataTable';

// happy-dom 不排版：视口 400px，列标题 120px 宽（固定没写宽度的列时记下它）
const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { get: () => 400 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { get: () => 120 });
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth);
});

interface Order {
  id: string;
  team: string;
  status: string;
  amount: number;
}

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  paid: { label: '已付款', tone: 'success' },
});

const orders: Order[] = [
  { id: 'o1', team: '机加', status: 'paid', amount: 300 },
  { id: 'o2', team: '复材', status: 'draft', amount: 100 },
  { id: 'o3', team: '机加', status: 'draft', amount: 200 },
  { id: 'o4', team: '复材', status: 'paid', amount: 400 },
];

const columns: DataTableColumn<Order>[] = [
  { key: 'id', header: '编号', width: 80 },
  { key: 'team', header: '团队', sortable: true, filter: true },
  { key: 'status', header: '状态', statuses, filter: true },
  { key: 'amount', header: '金额', sortable: true, filter: { options: 'text' } },
];

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

describe('多列排序与筛选的纯函数', () => {
  it('nextSorts：不追加时只按这一列；追加时加在后面、再点切换方向、降序时去掉', () => {
    const asc = (key: string): SortState => ({ key, direction: 'ascending' });
    expect(nextSorts([asc('team')], 'amount', false)).toEqual([asc('amount')]);
    expect(nextSorts([asc('team')], 'amount', true)).toEqual([asc('team'), asc('amount')]);
    expect(nextSorts([asc('team'), asc('amount')], 'amount', true)).toEqual([
      asc('team'),
      { key: 'amount', direction: 'descending' },
    ]);
    expect(
      nextSorts([asc('team'), { key: 'amount', direction: 'descending' }], 'amount', true),
    ).toEqual([asc('team')]);
  });

  it('formatSorts / parseSorts：-amount,team 是两列，减号是倒序；空的项跳过', () => {
    const sorts: SortState[] = [
      { key: 'amount', direction: 'descending' },
      { key: 'team', direction: 'ascending' },
    ];
    expect(formatSorts(sorts)).toBe('-amount,team');
    expect(formatSorts(null)).toBe('');
    expect(parseSorts('-amount, team,,-')).toEqual(sorts);
    expect(parseSorts('')).toEqual([]);
  });

  it('sortRows 多列：前一列相等时比下一列', () => {
    const sorted = sortRows(
      orders,
      columns,
      [
        { key: 'team', direction: 'ascending' },
        { key: 'amount', direction: 'descending' },
      ],
      'zh-CN',
    );
    // 复材（f）在机加（j）前；同一团队里金额从大到小
    expect(sorted.map((order) => order.id)).toEqual(['o4', 'o2', 'o1', 'o3']);
  });

  it('filterOptions 列出出现过的值（状态按阶段顺序、用状态名）；filterRows 按选中的值与关键字筛', () => {
    expect(filterOptions(columns[1]!, orders, 'zh-CN').map((option) => option.value)).toEqual([
      '复材',
      '机加',
    ]);
    expect(filterOptions(columns[2]!, orders, 'zh-CN')).toEqual([
      { value: 'draft', label: '草稿' },
      { value: 'paid', label: '已付款' },
    ]);
    const kept = filterRows(
      orders,
      columns,
      { team: ['机加'], amount: ['0'], status: [] },
      'zh-CN',
    );
    expect(kept.map((order) => order.id)).toEqual(['o1', 'o3']);
  });

  it('arrangeColumns：按 order 排，没列到的在后面；pins 覆盖固定并挪到边上', () => {
    const pins: Record<string, keyof ColumnStickies | null> = { amount: 'start' };
    const keys = arrangeColumns(columns, ['status', 'team'], pins).map((column) => column.key);
    expect(keys).toEqual(['amount', 'status', 'team', 'id']);
  });
});

describe('DataTable 的行拖动', () => {
  const key = (element: HTMLElement, name: string) =>
    element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

  it('把手在第一列前面：空格拿起、↓ 移动、空格放下，onReorder 得到新顺序；排序时没有把手', async () => {
    let rows = _state(orders);
    let sort = _state<SortState | null>(null);
    const root = mount(() => (
      <DataTable
        rows={rows}
        columns={columns}
        getKey={(order) => order.id}
        _sort={sort}
        onReorder={(next) => (rows = next)}
        aria-label="订单"
      />
    ));
    await flush();
    const handle = root.querySelector<HTMLButtonElement>('button[aria-label="移动 o1"]')!;
    expect(
      document.getElementById(handle.getAttribute('aria-describedby')!)!.textContent,
    ).toContain('按空格拿起');
    handle.focus();
    key(handle, ' ');
    await flush();
    key(handle, 'ArrowDown');
    await flush();
    key(handle, ' ');
    await flush();
    expect(rows.map((order) => order.id)).toEqual(['o2', 'o1', 'o3', 'o4']);

    sort = { key: 'amount', direction: 'ascending' };
    await flush();
    expect(root.querySelector('button[aria-label^="移动"]')).toBeNull();
  });
});

describe('DataTable 的表头筛选、多列排序与列菜单', () => {
  const ids = (root: Element) =>
    [...root.querySelectorAll('tbody tr[aria-rowindex]')].map(
      (row) => row.querySelector('td')!.textContent,
    );

  it('筛选按钮：勾选值写回 filters，只留下匹配的行；按钮名称说明已筛选', async () => {
    let filters = _state<Record<string, string[]>>({});
    const root = mount(() => (
      <DataTable
        rows={orders}
        columns={columns}
        getKey={(order) => order.id}
        _filters={filters}
        aria-label="订单"
      />
    ));
    await flush();
    const trigger = root.querySelector<HTMLButtonElement>('button[aria-label="筛选“状态”"]')!;
    trigger.click();
    await flush();
    const paid = [...document.querySelectorAll('label')].find((label) =>
      label.textContent?.includes('已付款'),
    )!;
    paid.querySelector('input')!.click();
    await flush();
    expect(filters).toEqual({ status: ['paid'] });
    expect(ids(root)).toEqual(['o1', 'o4']);
    expect(root.querySelector('button[aria-label="筛选“状态”（已筛选）"]')).not.toBeNull();
  });

  it('multiSort：点是只按这一列，Shift 点追加；第一排序列带 aria-sort，其余的写给读屏', async () => {
    let sorts = _state<SortState[]>([]);
    const root = mount(() => (
      <DataTable
        rows={orders}
        columns={columns}
        getKey={(order) => order.id}
        multiSort
        _sorts={sorts}
        aria-label="订单"
      />
    ));
    await flush();
    const sortButton = (text: string) =>
      [...root.querySelectorAll<HTMLButtonElement>('th button')].find((button) =>
        button.textContent?.startsWith(text),
      )!;
    sortButton('团队').click();
    await flush();
    sortButton('金额').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    await flush();
    expect(sorts).toEqual([
      { key: 'team', direction: 'ascending' },
      { key: 'amount', direction: 'ascending' },
    ]);
    expect(ids(root)).toEqual(['o2', 'o4', 'o3', 'o1']);
    const headers = [...root.querySelectorAll('th[scope="col"]')];
    expect(headers.map((th) => th.getAttribute('aria-sort'))).toEqual([
      null,
      'ascending',
      null,
      'none',
    ]);
    expect(headers[3]!.textContent).toContain('第 2 排序，升序');
  });

  it('列菜单：隐藏写回 hiddenColumns；固定写回 columnPins 并记下没写宽度的列的宽度；向后移写回 columnOrder', async () => {
    let hidden = _state<string[]>([]);
    let pins = _state<Record<string, keyof ColumnStickies | null>>({});
    let order = _state<string[]>([]);
    let widths = _state<Record<string, number>>({});
    const root = mount(() => (
      <DataTable
        rows={orders}
        columns={columns}
        getKey={(order) => order.id}
        columnMenu
        _hiddenColumns={hidden}
        _columnPins={pins}
        _columnOrder={order}
        _columnWidths={widths}
        aria-label="订单"
      />
    ));
    await flush();
    const act = async (column: string, item: string) => {
      root.querySelector<HTMLButtonElement>(`button[aria-label="“${column}”列的操作"]`)!.click();
      await flush();
      // 每个列标题都有自己的菜单：在刚打开的那个里找
      const menu = document.querySelector<HTMLElement>('[role="menu"][data-state="open"]')!;
      [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')]
        .find((element) => element.textContent === item)!
        .click();
      await flush();
    };
    await act('团队', '向后移');
    expect(order).toEqual(['id', 'status', 'team', 'amount']);
    await act('状态', '固定在开头');
    expect(pins).toEqual({ status: 'start' });
    expect(Object.keys(widths)).toEqual(['status']);
    await act('金额', '隐藏这一列');
    expect(hidden).toEqual(['amount']);
    // 列标题的文字（不含收起的菜单、筛选弹层）
    const headerTexts = [...root.querySelectorAll('th[scope="col"]')].map((th) => {
      const copy = th.cloneNode(true) as Element;
      copy.querySelectorAll('[popover]').forEach((panel) => panel.remove());
      return copy.textContent;
    });
    expect(headerTexts).toEqual(['状态', '编号', '团队']);
  });
});
