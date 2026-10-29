// 列定义与排序、DataTable、TreeDataTable：虚拟滚动的行、排序、勾选、展开、加载与空状态（真实滚动与列宽拖动见浏览器测试）
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { CalendarDate } from '@internationalized/date';
import Decimal from 'decimal.js';
import { hasStyles, mount, styleTextOf } from '../../utils/.test/mount';
import { createStatusMap } from '../../utils/data/status';
import {
  COLUMN_FLEX_MIN_WIDTH,
  columnType,
  headerLayout,
  nextSort,
  sortRows,
  sumColumn,
  tableMinWidth,
  type SortState,
  type DataTableColumn,
} from '../columns';
import { DataTable } from '../DataTable';
import { dataTableDynamicStyles, type DataTableHandle } from '../DataTableView';
import { dataTableStateStyles } from '../table-styles';
import { TreeDataTable } from '../TreeDataTable';

// happy-dom 不排版：给滚动容器一个 400px 的视口（行是虚拟滚动的）
const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { get: () => 400 });
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
});

interface Person {
  id: string;
  name: string;
  age: number | null;
  children?: Person[];
}

const people: Person[] = [
  { id: 'a', name: '张三', age: 30 },
  { id: 'b', name: '李四', age: null },
  { id: 'c', name: 'Ada', age: 25 },
];
const columns: DataTableColumn<Person>[] = [
  { key: 'name', header: '姓名', sortable: true },
  { key: 'age', header: '年龄', align: 'end', sortable: true },
];
const flush = async () => {
  for (let i = 0; i < 3; i++) await nextTick();
};

describe('sortRows / nextSort', () => {
  it('升序、降序；空值总在最后；原数组不变', () => {
    const ages = (sort: SortState) => sortRows(people, columns, sort, 'zh-CN').map((p) => p.age);
    expect(ages({ key: 'age', direction: 'ascending' })).toEqual([25, 30, null]);
    expect(ages({ key: 'age', direction: 'descending' })).toEqual([30, 25, null]);
    expect(people.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('数字类的列里十进制字符串按数值排（按文字比较时 2.5 会排在 2.10 前面）；文字列照常按文字', () => {
    const amounts = [{ v: '2.5' }, { v: '2.10' }, { v: '-5' }, { v: '-10' }];
    const sorted = (column: DataTableColumn<{ v: string }>) =>
      sortRows(amounts, [column], { key: 'v', direction: 'ascending' }, 'zh-CN').map((r) => r.v);
    expect(sorted({ key: 'v', header: '金额', type: 'number' })).toEqual([
      '-10',
      '-5',
      '2.10',
      '2.5',
    ]);
    expect(sorted({ key: 'v', header: '版本' })).not.toEqual(['-10', '-5', '2.10', '2.5']);
  });

  it('点表头：不排 → 升序 → 降序 → 不排；换一列从升序开始', () => {
    expect(nextSort(null, 'name')).toEqual({ key: 'name', direction: 'ascending' });
    expect(nextSort({ key: 'name', direction: 'ascending' }, 'name')!.direction).toBe('descending');
    expect(nextSort({ key: 'name', direction: 'descending' }, 'name')).toBeNull();
    expect(nextSort({ key: 'name', direction: 'descending' }, 'age')!.key).toBe('age');
  });
});

describe('列的值类型', () => {
  it('写了数字格式或合计是 sum 的列是数字列：这一页全是空值时也是', () => {
    const empty = [{ v: null }, { v: null }];
    expect(columnType({ key: 'v', header: 'v', format: { maximumFractionDigits: 2 } }, empty)).toBe(
      'number',
    );
    expect(columnType({ key: 'v', header: 'v', summary: 'sum' }, empty)).toBe('number');
    expect(columnType({ key: 'v', header: 'v' }, empty)).toBe('text');
  });

  it('没写 type 时看第一个非空值：数字类 → number，日期 → date，ISO 字符串与其余 → text', () => {
    const typeOf = (...values: unknown[]) =>
      columnType<{ v: unknown }>({ key: 'v', header: '' }, values.map((v) => ({ v })) as never);
    expect(typeOf(null, 3)).toBe('number');
    expect(typeOf(new Decimal('1.5'))).toBe('number');
    expect(typeOf(10n)).toBe('number');
    expect(typeOf(new Date())).toBe('date');
    expect(typeOf(new CalendarDate(2026, 10, 21))).toBe('date');
    expect(typeOf('2026-10-21')).toBe('text');
    expect(typeOf()).toBe('text');
  });

  it('没写 cell 时按类型与语言格式化；数字类默认靠结束边，写了 align、cell 的不动', async () => {
    interface Line {
      id: string;
      count: number;
      price: string;
      ratio: Decimal;
      size: number;
      day: string;
      at: Date;
      note: string;
    }
    const lines: Line[] = [
      {
        id: 'a',
        count: 12345,
        price: '19999.9',
        ratio: new Decimal('0.125'),
        size: 1_234_567,
        day: '2026-10-21',
        at: new Date(2026, 9, 21, 14, 30),
        note: '加急',
      },
    ];
    const root = mount(() => (
      <DataTable
        aria-label="明细"
        rows={lines}
        getKey={(line) => line.id}
        columns={[
          { key: 'count', header: '数量' },
          { key: 'price', header: '金额', type: 'currency' },
          { key: 'ratio', header: '占比', type: 'percent' },
          { key: 'size', header: '大小', type: 'fileSize', align: 'center' },
          { key: 'day', header: '日期', type: 'date' },
          { key: 'at', header: '时间', type: 'dateTime' },
          { key: 'note', header: '备注', cell: (line) => `[${line.note}]` },
        ]}
      />
    ));
    await flush();
    const cells = [...root.querySelectorAll('tbody tr[aria-rowindex] td')];
    expect(cells.map((td) => td.textContent)).toEqual([
      '12,345',
      '¥19,999.90',
      '12.5%',
      '1.2 MB',
      '2026年10月21日',
      '2026年10月21日 14:30',
      '[加急]',
    ]);
    const headers = [...root.querySelectorAll('thead th')];
    expect(hasStyles(headers[0]!, dataTableStateStyles.end)).toBe(true);
    expect(hasStyles(cells[1]!, dataTableStateStyles.end)).toBe(true);
    expect(hasStyles(cells[3]!, dataTableStateStyles.center)).toBe(true);
    expect(hasStyles(cells[4]!, dataTableStateStyles.start)).toBe(true);
  });
});

describe('DataTable', () => {
  it('原生 table 语义：列标题 scope、aria-sort、aria-rowcount / aria-rowindex；点表头排序', async () => {
    let sort = _state<SortState | null>(null);
    const root = mount(() => (
      <DataTable
        rows={people}
        columns={columns}
        getKey={(p) => p.id}
        _sort={sort}
        aria-label="人员"
      />
    ));
    await flush();
    const table = root.querySelector('table')!;
    expect(table.getAttribute('aria-rowcount')).toBe('4');
    const [name, age] = root.querySelectorAll('th');
    expect([name!.getAttribute('scope'), name!.getAttribute('aria-sort')]).toEqual(['col', 'none']);
    age!.querySelector('button')!.click();
    await flush();
    expect(sort).toEqual({ key: 'age', direction: 'ascending' });
    expect(age!.getAttribute('aria-sort')).toBe('ascending');
    const cells = [...root.querySelectorAll('tbody tr[aria-rowindex] td:first-child')].map(
      (td) => td.textContent,
    );
    expect(cells).toEqual(['Ada', '张三', '李四']);
    expect(root.querySelector('tbody tr[aria-rowindex]')!.getAttribute('aria-rowindex')).toBe('2');
  });

  it('多选：每行勾选框写回 selected，表头全选有部分选中状态', async () => {
    let picked = _state<string[]>(['a']);
    const root = mount(() => (
      <DataTable
        rows={people}
        columns={columns}
        getKey={(p) => p.id}
        selectionMode="multiple"
        _selected={picked}
        aria-label="人员"
      />
    ));
    await flush();
    const all = root.querySelector<HTMLInputElement>('thead input[type=checkbox]')!;
    expect([all.checked, all.indeterminate]).toEqual([false, true]);
    all.click();
    await flush();
    expect(picked).toEqual(['a', 'b', 'c']);
    const rowBoxes = root.querySelectorAll<HTMLInputElement>('tbody input[type=checkbox]');
    rowBoxes[1]!.click();
    await flush();
    expect(picked).toEqual(['a', 'c']);
    expect(root.querySelectorAll('tbody tr[aria-selected="true"]')).toHaveLength(2);
  });

  it('单选：每行是同一组的单选框（同一个 name），选中写回 selected；表头没有全选', async () => {
    let picked = _state<string[]>(['a']);
    const root = mount(() => (
      <DataTable
        rows={people}
        columns={columns}
        getKey={(p) => p.id}
        selectionMode="single"
        _selected={picked}
        propsSelectRadio={{ class: 'pick' }}
        aria-label="人员"
      />
    ));
    await flush();
    expect(root.querySelector('thead input')).toBeNull();
    expect(root.querySelector('tbody input[type=checkbox]')).toBeNull();
    const radios = [...root.querySelectorAll<HTMLInputElement>('tbody input[type=radio]')];
    expect(radios).toHaveLength(3);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(radios.map((radio) => radio.checked)).toEqual([true, false, false]);
    expect(radios[1]!.getAttribute('aria-label')).toBe('选择第 2 行');
    expect(radios[1]!.classList).toContain('pick');
    radios[2]!.click();
    await flush();
    expect(picked).toEqual(['c']);
    expect(root.querySelectorAll('tbody tr[aria-selected="true"]')).toHaveLength(1);
  });

  it('性能：五万行全选、取消全选各在 1 秒内', async () => {
    // 曾经逐个 includes（O(n²)），五万行全选要好几秒；正常时几十毫秒，给慢的 CI 机器留足余量
    const many = Array.from({ length: 50_000 }, (_, index) => ({
      id: String(index),
      name: `第 ${index} 行`,
      age: index,
    }));
    let picked = _state<string[]>([]);
    const root = mount(() => (
      <DataTable
        rows={many}
        columns={columns}
        getKey={(p) => p.id}
        selectionMode="multiple"
        _selected={picked}
        aria-label="很多"
      />
    ));
    await flush();
    const all = root.querySelector<HTMLInputElement>('thead input[type=checkbox]')!;
    for (const expected of [50_000, 0]) {
      const start = performance.now();
      all.click();
      await flush();
      expect(performance.now() - start).toBeLessThan(1000);
      expect(picked).toHaveLength(expected);
    }
  });

  it('虚拟滚动：一万行只渲染一部分，上下有占位行；没有数据时加载显示骨架、否则显示空状态', async () => {
    const many = Array.from({ length: 10_000 }, (_, index) => ({
      id: String(index),
      name: `第 ${index} 行`,
      age: index,
    }));
    const root = mount(() => (
      <>
        <DataTable rows={many} columns={columns} getKey={(p) => p.id} aria-label="很多" />
        <DataTable rows={[]} columns={columns} getKey={(p) => p.id} loading aria-label="加载中" />
        <DataTable rows={[]} columns={columns} getKey={(p) => p.id} aria-label="空" />
      </>
    ));
    await flush();
    const [long, pending, blank] = root.querySelectorAll('table');
    const rendered = long!.querySelectorAll('tbody tr[aria-rowindex]').length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(60);
    expect(long!.getAttribute('aria-rowcount')).toBe('10001');
    expect(pending!.getAttribute('aria-busy')).toBe('true');
    expect(pending!.querySelectorAll('tbody tr[aria-hidden="true"]').length).toBeGreaterThan(0);
    expect(blank!.textContent).toContain('暂无数据');
  });

  it('刷新（已有数据时 loading）：表体换成骨架行，不再另加进度条；加载完数据行回来', async () => {
    let loading = _state(true);
    const root = mount(() => (
      <DataTable
        rows={people}
        columns={columns}
        getKey={(p) => p.id}
        loading={loading}
        aria-label="人员"
      />
    ));
    await flush();
    const table = root.querySelector('table')!;
    expect(table.getAttribute('aria-busy')).toBe('true');
    expect(table.querySelector('[role="progressbar"]')).toBeNull();
    expect(table.querySelectorAll('tbody tr[aria-rowindex]')).toHaveLength(0);
    expect(table.querySelectorAll('tbody tr[aria-hidden="true"]').length).toBeGreaterThan(0);
    loading = false;
    // 骨架出现后至少保持 500ms（防闪烁，见 useDelayedLoading）
    await new Promise((resolve) => setTimeout(resolve, 550));
    await flush();
    expect(table.querySelectorAll('tbody tr[aria-rowindex]')).toHaveLength(people.length);
    expect(table.getAttribute('aria-busy')).toBeNull();
  });

  it('滚动加载（有 onRangeChange）：已有数据时骨架接在末尾，已有的行留着', async () => {
    const root = mount(() => (
      <DataTable
        rows={people}
        columns={columns}
        getKey={(p) => p.id}
        loading
        onRangeChange={() => {}}
        aria-label="滚动加载"
      />
    ));
    await flush();
    const body = root.querySelector('tbody')!;
    expect(body.querySelectorAll('tr[aria-rowindex]')).toHaveLength(people.length);
    expect(body.lastElementChild!.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('部件属性：表头、排序文字、勾选列、leading 与内容、空状态单元格', async () => {
    const root = mount(() => (
      <>
        <DataTable
          rows={people}
          columns={columns}
          getKey={(p) => p.id}
          selectionMode="multiple"
          leading={() => <i>›</i>}
          propsHead={{ class: 'head' }}
          propsSortLabel={{ class: 'sort-label' }}
          propsSelectHeaderCell={{ class: 'select-th' }}
          propsSelectCell={{ class: 'select-td' }}
          propsLeading={{ class: 'leading' }}
          propsContent={{ class: 'content' }}
          aria-label="人员"
        />
        <DataTable
          rows={[]}
          columns={columns}
          getKey={(p) => p.id}
          propsEmptyCell={{ class: 'empty' }}
          aria-label="空"
        />
      </>
    ));
    await flush();
    const [table, blank] = root.querySelectorAll('table');
    expect(table!.querySelector('thead')!.classList).toContain('head');
    expect(table!.querySelectorAll('th .sort-label')).toHaveLength(2);
    expect(table!.querySelector('th.select-th')!.getAttribute('scope')).toBe('col');
    expect(table!.querySelectorAll('tbody td.select-td')).toHaveLength(3);
    const leading = table!.querySelector('tbody .leading')!;
    expect(leading.querySelector('.content')!.textContent).toBe('张三');
    const empty = blank!.querySelector('td.empty')!;
    expect([empty.getAttribute('colspan'), empty.textContent]).toEqual(['2', '暂无数据']);
  });

  it('部件属性：表头那一行、全选框、每行的勾选框；aria-rowindex、勾选状态、切换与每行的名称由组件管理', async () => {
    let picked = _state<string[]>([]);
    const root = mount(() => (
      <DataTable
        rows={people}
        columns={columns}
        getKey={(p) => p.id}
        selectionMode="multiple"
        _selected={picked}
        propsHeadRow={{ class: 'head-row', ...({ 'aria-rowindex': 9 } as object) }}
        propsSelectAll={{ class: 'all', 'aria-label': '全选人员' }}
        propsSelectCheckbox={{ class: 'box', ...({ checked: true } as object) }}
        aria-label="人员"
      />
    ));
    await flush();
    const headRow = root.querySelector('thead tr.head-row')!;
    expect(headRow.getAttribute('aria-rowindex')).toBe('1');
    expect(root.querySelector('thead input.all')!.getAttribute('aria-label')).toBe('全选人员');
    const boxes = [...root.querySelectorAll<HTMLInputElement>('tbody input.box[type=checkbox]')];
    expect(boxes).toHaveLength(3);
    // 每行的名称不同，读屏能区分
    expect(new Set(boxes.map((box) => box.getAttribute('aria-label'))).size).toBe(3);
    expect(boxes.some((box) => box.checked)).toBe(false);
    boxes[0]!.click();
    await flush();
    expect(picked).toEqual(['a']);
  });
});

describe('DataTable 的台账能力', () => {
  interface Task {
    id: string;
    status: string;
    estimate: Decimal | null;
    agreed: string | null;
  }
  const tasks: Task[] = [
    { id: 'a', status: 'verifying', estimate: new Decimal('155353.2'), agreed: null },
    { id: 'b', status: 'closed', estimate: new Decimal('109600'), agreed: '98000.10' },
    { id: 'c', status: 'archived', estimate: null, agreed: '0.20' },
  ];
  const statuses = createStatusMap({
    verifying: { label: '验证中', tone: 'info' },
    closed: { label: '关闭', tone: 'success' },
  });
  const ledgerColumns: DataTableColumn<Task>[] = [
    { key: 'id', header: '编码' },
    { key: 'status', header: '状态', statuses },
    {
      key: 'estimate',
      header: '测算（万元）',
      format: { scale: 10_000, maximumFractionDigits: 2 },
      summary: 'sum',
    },
    { key: 'agreed', header: '谈定（元）', type: 'number', empty: '待定价', summary: 'sum' },
  ];

  it('状态列显示 StatusBadge；空值显示 empty；合计行精确相加并按列的格式显示', async () => {
    const root = mount(() => (
      <DataTable
        aria-label="台账"
        rows={tasks}
        getKey={(task) => task.id}
        columns={ledgerColumns}
      />
    ));
    await flush();
    const rows = [...root.querySelectorAll('tbody tr[aria-rowindex]')];
    const text = (row: Element) => [...row.querySelectorAll('td')].map((td) => td.textContent);
    expect(text(rows[0]!)).toEqual(['a', '验证中', '15.54', '待定价']);
    // 不认识的状态显示 key；没有测算值显示默认的 —
    expect(text(rows[2]!)).toEqual(['c', 'archived', '—', '0.2']);
    expect(rows[0]!.querySelector('[data-status="verifying"]')).not.toBeNull();
    const summary = root.querySelector('tfoot tr')!;
    expect(text(summary)).toEqual(['合计', '', '26.5', '98,000.3']);
    expect(root.querySelector('table')!.getAttribute('aria-rowcount')).toBe('5');
  });

  it('rowTone 给整行着色；isRowSelectable 不能勾选的行勾选框不可用，全选跳过它；hiddenColumns 隐藏列', async () => {
    let picked = _state<string[]>([]);
    const root = mount(() => (
      <DataTable
        aria-label="台账"
        rows={tasks}
        getKey={(task) => task.id}
        columns={ledgerColumns}
        selectionMode="multiple"
        _selected={picked}
        isRowSelectable={(task) => task.status !== 'closed'}
        rowTone={(task) => (task.estimate == null ? 'danger' : undefined)}
        _hiddenColumns={['agreed']}
      />
    ));
    await flush();
    const rows = [...root.querySelectorAll<HTMLElement>('tbody tr[aria-rowindex]')];
    expect(rows.map((row) => row.dataset.tone)).toEqual([undefined, undefined, 'danger']);
    const boxes = rows.map((row) => row.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    expect(boxes.map((box) => box.disabled)).toEqual([false, true, false]);
    root.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!.click();
    await flush();
    expect(picked).toEqual(['a', 'c']);
    // 能勾选的都勾上了：全选框是勾上的，不是部分选中
    const all = root.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!;
    expect([all.checked, all.indeterminate]).toEqual([true, false]);
    expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '',
      '编码',
      '状态',
      '测算（万元）',
    ]);
  });

  it('分组表头：两行，组标题跨组里的列，没分组的列与勾选列跨两行；行号从表头之后算起；隐藏列不算进组', async () => {
    const groups = [{ key: 'money', header: '金额', columns: ['estimate', 'agreed'] }];
    let hidden = _state<string[]>([]);
    const root = mount(() => (
      <DataTable
        aria-label="台账"
        rows={tasks}
        getKey={(task) => task.id}
        columns={ledgerColumns}
        columnGroups={groups}
        selectionMode="multiple"
        _hiddenColumns={hidden}
      />
    ));
    await flush();
    const head = () =>
      [...root.querySelectorAll('thead tr[aria-rowindex]')].map((tr) =>
        [...tr.children].map(
          (th) =>
            `${th.textContent}:${th.getAttribute('colspan') ?? th.getAttribute('rowspan') ?? 1}`,
        ),
      );
    expect(head()).toEqual([
      [':2', '编码:2', '状态:2', '金额:2'],
      ['测算（万元）:1', '谈定（元）:1'],
    ]);
    expect(root.querySelector('th[scope="colgroup"]')!.textContent).toBe('金额');
    const table = root.querySelector('table')!;
    expect(table.getAttribute('aria-rowcount')).toBe(String(tasks.length + 2 + 1));
    expect(root.querySelector('tbody tr[aria-rowindex]')!.getAttribute('aria-rowindex')).toBe('3');
    expect(root.querySelector('tfoot tr')!.getAttribute('aria-rowindex')).toBe(
      String(tasks.length + 3),
    );

    hidden = ['agreed'];
    await flush();
    expect(head()).toEqual([[':2', '编码:2', '状态:2', '金额:1'], ['测算（万元）:1']]);
    // 组里的列全隐藏：回到一行表头
    hidden = ['agreed', 'estimate'];
    await flush();
    expect(head()).toEqual([[':1', '编码:1', '状态:1']]);
  });
});

describe('DataTable 的详情行', () => {
  it('展开按钮带 aria-expanded 与 aria-controls；展开后下面多一行跨全部列的详情，行号随之顺延；hasDetail 为 false 的行没有按钮', async () => {
    let expanded = _state<string[]>([]);
    const root = mount(() => (
      <DataTable
        aria-label="人员"
        rows={people}
        getKey={(person) => person.name}
        columns={columns}
        selectionMode="multiple"
        renderDetail={(person) => <p class="detail">{person.name} 的简历</p>}
        hasDetail={(person) => person.name !== 'Ada'}
        _expandedRows={expanded}
      />
    ));
    await flush();
    const toggles = () => [
      ...root.querySelectorAll<HTMLButtonElement>('tbody button[aria-expanded]'),
    ];
    expect(toggles()).toHaveLength(people.length - 1);
    expect(toggles()[0]!.getAttribute('aria-label')).toBe(`${people[0]!.name} 的详情`);
    expect(toggles()[0]!.getAttribute('aria-expanded')).toBe('false');

    toggles()[0]!.click();
    await flush();
    expect(expanded).toEqual([people[0]!.name]);
    const toggle = toggles()[0]!;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const cell = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(cell.textContent).toBe(`${people[0]!.name} 的简历`);
    // 勾选列 + 详情列 + 数据列
    expect(cell.getAttribute('colspan')).toBe(String(columns.length + 2));
    const indexes = [...root.querySelectorAll('tbody tr[aria-rowindex]')].map((tr) =>
      tr.getAttribute('aria-rowindex'),
    );
    expect(indexes.slice(0, 3)).toEqual(['2', '3', '4']);
    expect(root.querySelector('table')!.getAttribute('aria-rowcount')).toBe(
      String(people.length + 2),
    );

    // 内容让过勾选列（44）与展开列（40），和第一个数据列对齐
    const content = cell.firstElementChild!;
    expect(hasStyles(content, dataTableDynamicStyles.indent(84))).toBe(true);
    expect(styleTextOf(content)).toContain('84px');

    expanded = [];
    await flush();
    expect(root.querySelector('.detail')).toBeNull();
  });
});

describe('tableMinWidth', () => {
  it('写了宽度的列按宽度，没写宽度的按 minWidth，都没写的按 COLUMN_FLEX_MIN_WIDTH；加上前面的控制列', () => {
    const list: DataTableColumn<unknown>[] = [
      { key: 'code', header: '编码', width: 140 },
      { key: 'name', header: '名称', minWidth: 200 },
      { key: 'note', header: '备注' },
    ];
    expect(tableMinWidth(list, (column) => column.width, 84)).toBe(
      84 + 140 + 200 + COLUMN_FLEX_MIN_WIDTH,
    );
  });
});

describe('DataTable 的 handle', () => {
  it('挂载后交出 scrollToRow：没渲染的行也能滚到；找不到的 key 返回 false、不滚动', async () => {
    const many = Array.from({ length: 1000 }, (_, index) => ({
      id: String(index),
      name: `第 ${index} 人`,
      age: index,
    }));
    let table: DataTableHandle | undefined;
    const root = mount(() => (
      <DataTable
        aria-label="人员"
        rows={many}
        getKey={(person) => person.id}
        columns={columns}
        handle={(api) => (table = api)}
      />
    ));
    await flush();
    expect(table).toBeDefined();
    // ScrollArea 的视口 > 内容层 > table（视口只在内容超出时才可聚焦，不能按 tabindex 找）
    const viewport = root.querySelector('table')!.parentElement!.parentElement!;
    expect(table!.scrollToRow('nobody')).toBe(false);
    expect(viewport.scrollTop).toBe(0);
    expect(table!.scrollToRow('500', { align: 'start' })).toBe(true);
    expect(viewport.scrollTop).toBeGreaterThan(400);
  });
});

describe('headerLayout', () => {
  it('组里的列被别的列隔开时另起一格；不在任何组里的列单独一格', () => {
    const column = (key: string) => ({ key, header: key });
    const cells = headerLayout(['a', 'b', 'x', 'c'].map(column), [
      { key: 'g', header: 'G', columns: ['a', 'b', 'c'] },
    ]);
    expect(
      cells.map((cell) =>
        cell.kind === 'group'
          ? `${cell.group.key}[${cell.columns.map((c) => c.key).join(',')}]`
          : cell.column.key,
      ),
    ).toEqual(['g[a,b]', 'x', 'g[c]']);
  });
});

describe('sumColumn', () => {
  it('有 Decimal 时按 Decimal 精确相加；全是 bigint 时整数相加；十进制字符串按数字；没有数值时 null', () => {
    const column = { key: 'v', header: 'v' } as DataTableColumn<{ v: unknown }>;
    const sum = (values: unknown[]) => sumColumn(column, values.map((v) => ({ v })) as never);
    expect(String(sum([new Decimal('0.1'), 0.2, null]))).toBe('0.3');
    expect(sum([1n, 2n])).toBe(3n);
    expect(sum(['1.5', 2])).toBe(3.5);
    expect(sum([null, '', 'abc'])).toBeNull();
  });
});

describe('TreeDataTable', () => {
  const tree: Person[] = [
    {
      id: 'dept',
      name: '研发部',
      age: null,
      children: [
        { id: 'x', name: '小王', age: 28 },
        { id: 'y', name: '小李', age: 24 },
      ],
    },
    { id: 'lazy', name: '市场部', age: null },
  ];

  it('展开按钮带 aria-expanded，展开后显示子项（同级按排序）；懒加载时调用 loadChildren', async () => {
    let open = _state<string[]>([]);
    const loaded: string[] = [];
    const root = mount(() => (
      <TreeDataTable
        rows={tree}
        columns={columns}
        getKey={(p) => p.id}
        getChildren={(p) => p.children}
        hasChildren={(p) => p.id === 'dept' || p.id === 'lazy'}
        loadChildren={(p) => void loaded.push(p.id)}
        _expanded={open}
        _sort={{ key: 'age', direction: 'ascending' }}
        aria-label="组织"
      />
    ));
    await flush();
    const names = () =>
      [...root.querySelectorAll('tbody tr[aria-rowindex] td:first-child')].map(
        (td) => td.textContent,
      );
    expect(names()).toEqual(['研发部', '市场部']);
    const toggle = root.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    expect(toggle.getAttribute('aria-label')).toBe('研发部 的子项');
    toggle.click();
    await flush();
    expect(open).toEqual(['dept']);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(names()).toEqual(['研发部', '小李', '小王', '市场部']);
    root.querySelectorAll<HTMLButtonElement>('button[aria-expanded]')[1]!.click();
    await flush();
    expect(loaded).toEqual(['lazy']);
  });

  it('propsToggle 落到展开按钮上；propsIcon 与箭头的转向合并，aria-expanded 与点击仍由组件管理', async () => {
    let open = _state<string[]>([]);
    const root = mount(() => (
      <TreeDataTable
        rows={tree}
        columns={columns}
        getKey={(p) => p.id}
        getChildren={(p) => p.children}
        _expanded={open}
        propsToggle={{
          class: 'toggle',
          // 类型里已经去掉了受管属性：模拟 JS 使用方强行传入
          ...({ 'aria-expanded': false } as object),
          propsIcon: { class: 'chevron' },
        }}
        aria-label="组织"
      />
    ));
    await flush();
    const toggle = root.querySelector<HTMLButtonElement>('button.toggle')!;
    const chevron = toggle.querySelector('svg')!;
    expect(chevron.classList.contains('chevron')).toBe(true);
    const closedClass = chevron.getAttribute('class');
    toggle.click();
    await flush();
    expect(open).toEqual(['dept']);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.querySelector('svg')!.getAttribute('class')).not.toBe(closedClass);
  });

  it('多选默认父子联动：勾父行连带子孙，只勾一个子行时父行半选；checkStrictly 时各自勾选', async () => {
    let picked = _state<string[]>([]);
    let strict = _state<string[]>([]);
    const root = mount(() => (
      <>
        <TreeDataTable
          class="linked"
          rows={tree}
          columns={columns}
          getKey={(p) => p.id}
          getChildren={(p) => p.children}
          _expanded={['dept']}
          selectionMode="multiple"
          _selected={picked}
          aria-label="联动"
        />
        <TreeDataTable
          class="strict"
          rows={tree}
          columns={columns}
          getKey={(p) => p.id}
          getChildren={(p) => p.children}
          _expanded={['dept']}
          selectionMode="multiple"
          checkStrictly
          _selected={strict}
          aria-label="各自"
        />
      </>
    ));
    await flush();
    const boxes = (table: string) => [
      ...root.querySelectorAll<HTMLInputElement>(`.${table} tbody input[type=checkbox]`),
    ];
    // 行的顺序：研发部、小王、小李、市场部（不排序时按数据）
    boxes('linked')[0]!.click();
    await flush();
    expect([...picked].sort()).toEqual(['dept', 'x', 'y']);
    boxes('linked')[1]!.click();
    await flush();
    expect(picked).toEqual(['y']);
    expect(boxes('linked')[0]!.indeterminate).toBe(true);
    boxes('strict')[0]!.click();
    await flush();
    expect(strict).toEqual(['dept']);
    expect(boxes('strict')[1]!.checked).toBe(false);
  });

  it('manualSort：同级之间不在本地排序，只写回 sort', async () => {
    let sort = _state<SortState | null>({ key: 'age', direction: 'ascending' });
    const root = mount(() => (
      <TreeDataTable
        rows={tree}
        columns={columns}
        getKey={(p) => p.id}
        getChildren={(p) => p.children}
        _expanded={['dept']}
        manualSort
        _sort={sort}
        aria-label="组织"
      />
    ));
    await flush();
    const names = [...root.querySelectorAll('tbody tr[aria-rowindex] td:first-child')].map(
      (td) => td.textContent,
    );
    expect(names).toEqual(['研发部', '小王', '小李', '市场部']);
  });

  it('性能：两万个展开的节点挂载在 1 秒内', async () => {
    // 展开时曾经对每个节点在 expanded 里逐个 includes（O(n²)）
    const parents: Person[] = Array.from({ length: 20_000 }, (_, index) => ({
      id: `p${index}`,
      name: `部门 ${index}`,
      age: null,
      children: [{ id: `c${index}`, name: `成员 ${index}`, age: index }],
    }));
    const open = parents.map((p) => p.id);
    const start = performance.now();
    const root = mount(() => (
      <TreeDataTable
        rows={parents}
        columns={columns}
        getKey={(p) => p.id}
        getChildren={(p) => p.children}
        _expanded={open}
        aria-label="很多"
      />
    ));
    await flush();
    expect(performance.now() - start).toBeLessThan(1000);
    expect(root.querySelector('table')!.getAttribute('aria-rowcount')).toBe('40001');
  });
});
