// 列定义与排序、DataTable、TreeDataTable：虚拟滚动的行、排序、勾选、展开、加载与空状态（真实滚动与列宽拖动见浏览器测试）
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { nextSort, sortRows, type SortState, type DataTableColumn } from '../columns';
import { DataTable } from '../DataTable';
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

  it('点表头：不排 → 升序 → 降序 → 不排；换一列从升序开始', () => {
    expect(nextSort(null, 'name')).toEqual({ key: 'name', direction: 'ascending' });
    expect(nextSort({ key: 'name', direction: 'ascending' }, 'name')!.direction).toBe('descending');
    expect(nextSort({ key: 'name', direction: 'descending' }, 'name')).toBeNull();
    expect(nextSort({ key: 'name', direction: 'descending' }, 'age')!.key).toBe('age');
  });
});

describe('DataTable', () => {
  it('原生 table 语义：列标题 scope、aria-sort、aria-rowcount / aria-rowindex；点表头排序', async () => {
    let sort = _state<SortState | null>(null);
    const root = mount(() => (
      <DataTable
        rows={people}
        columns={columns}
        rowKey={(p) => p.id}
        sort={_bind(sort)}
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
        rowKey={(p) => p.id}
        selectionMode="multiple"
        selected={_bind(picked)}
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
        rowKey={(p) => p.id}
        selectionMode="multiple"
        selected={_bind(picked)}
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
        <DataTable rows={many} columns={columns} rowKey={(p) => p.id} aria-label="很多" />
        <DataTable rows={[]} columns={columns} rowKey={(p) => p.id} loading aria-label="加载中" />
        <DataTable rows={[]} columns={columns} rowKey={(p) => p.id} aria-label="空" />
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

  it('部件属性：表头、排序文字、勾选列、leading 与内容、进度条、空状态单元格', async () => {
    const root = mount(() => (
      <>
        <DataTable
          rows={people}
          columns={columns}
          rowKey={(p) => p.id}
          selectionMode="multiple"
          loading
          leading={() => <i>›</i>}
          propsHead={{ class: 'head' }}
          propsSortLabel={{ class: 'sort-label' }}
          propsSelectHeaderCell={{ class: 'select-th' }}
          propsSelectCell={{ class: 'select-td' }}
          propsLeading={{ class: 'leading' }}
          propsContent={{ class: 'content' }}
          propsProgress={{ class: 'progress' }}
          aria-label="人员"
        />
        <DataTable
          rows={[]}
          columns={columns}
          rowKey={(p) => p.id}
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
    expect(table!.querySelector('thead .progress[role="progressbar"]')).not.toBeNull();
    const empty = blank!.querySelector('td.empty')!;
    expect([empty.getAttribute('colspan'), empty.textContent]).toEqual(['2', '暂无数据']);
  });

  it('部件属性：表头那一行、勾选框；aria-rowindex、勾选状态与切换由组件管理', async () => {
    let picked = _state<string[]>([]);
    const root = mount(() => (
      <DataTable
        rows={people}
        columns={columns}
        rowKey={(p) => p.id}
        selectionMode="multiple"
        selected={_bind(picked)}
        propsHeadRow={{ class: 'head-row', ...({ 'aria-rowindex': 9 } as object) }}
        propsSelectCheckbox={{ class: 'box', checked: true, 'aria-label': '勾选' }}
        aria-label="人员"
      />
    ));
    await flush();
    const headRow = root.querySelector('thead tr.head-row')!;
    expect(headRow.getAttribute('aria-rowindex')).toBe('1');
    const boxes = [...root.querySelectorAll<HTMLInputElement>('input.box[type=checkbox]')];
    expect(boxes).toHaveLength(4);
    expect(boxes.every((box) => box.getAttribute('aria-label') === '勾选')).toBe(true);
    expect(boxes.some((box) => box.checked)).toBe(false);
    boxes[1]!.click();
    await flush();
    expect(picked).toEqual(['a']);
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
        rowKey={(p) => p.id}
        getChildren={(p) => p.children}
        hasChildren={(p) => p.id === 'dept' || p.id === 'lazy'}
        loadChildren={(p) => void loaded.push(p.id)}
        expanded={_bind(open)}
        sort={{ key: 'age', direction: 'ascending' }}
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
        rowKey={(p) => p.id}
        getChildren={(p) => p.children}
        expanded={_bind(open)}
        propsToggle={{
          class: 'toggle',
          'aria-expanded': false,
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
        rowKey={(p) => p.id}
        getChildren={(p) => p.children}
        expanded={open}
        aria-label="很多"
      />
    ));
    await flush();
    expect(performance.now() - start).toBeLessThan(1000);
    expect(root.querySelector('table')!.getAttribute('aria-rowcount')).toBe('40001');
  });
});
