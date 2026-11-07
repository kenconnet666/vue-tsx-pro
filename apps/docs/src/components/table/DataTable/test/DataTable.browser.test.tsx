// DataTable 在真实浏览器里：勾选列、单选列的 24px 控件不把行撑高，表头和各行与没有勾选列时一样高
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { DataTable, type DataTableColumn } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';

interface Item {
  id: string;
  name: string;
}

const rows: Item[] = [
  { id: 'a', name: '甲' },
  { id: 'b', name: '乙' },
];
const columns: DataTableColumn<Item>[] = [{ key: 'name', header: '名称' }];

const heights = (table: Element) =>
  [...table.querySelectorAll('tr')].map((row) => row.getBoundingClientRect().height);

it.each(['multiple', 'single'] as const)(
  'selectionMode="%s"：有控件的行与纯文字的行一样高',
  async (mode) => {
    const root = mount(
      _component(() => () => (
        <div>
          <DataTable rows={rows} columns={columns} getKey={(item) => item.id} aria-label="对照" />
          <DataTable
            rows={rows}
            columns={columns}
            getKey={(item) => item.id}
            selectionMode={mode}
            aria-label="勾选"
          />
        </div>
      )),
    );
    const [plain, selectable] = root.querySelectorAll('table');
    // 部件标记与负外边距在外层 label 上（撑出 24px 的是它）；数据行等虚拟列表量好尺寸后才渲染
    await expect
      .poll(() => selectable!.querySelectorAll('label[data-scope="data-table"]').length)
      .toBe(mode === 'multiple' ? rows.length + 1 : rows.length);
    expect(heights(selectable!)).toEqual(heights(plain!));
    // 勾选框、单选框在格子里上下居中
    for (const input of selectable!.querySelectorAll('input')) {
      const box = input.getBoundingClientRect();
      const cell = input.closest('td, th')!.getBoundingClientRect();
      expect(Math.abs(box.top + box.height / 2 - (cell.top + cell.height / 2))).toBeLessThan(1);
    }
  },
);

it('展开详情的按钮也不把行撑高', async () => {
  const root = mount(
    _component(() => () => (
      <div>
        <DataTable rows={rows} columns={columns} getKey={(item) => item.id} aria-label="对照" />
        <DataTable
          rows={rows}
          columns={columns}
          getKey={(item) => item.id}
          renderDetail={(item) => item.name}
          aria-label="详情"
        />
      </div>
    )),
  );
  const [plain, detailed] = root.querySelectorAll('table');
  await expect
    .poll(() => detailed!.querySelectorAll('button[data-part="detailToggle"]').length)
    .toBe(rows.length);
  expect(heights(detailed!)).toEqual(heights(plain!));
});
