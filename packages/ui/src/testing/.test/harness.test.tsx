// 测试辅助：按名称找控件，用 harness 驱动 Select、Cascader、TreeSelect、DateField / DatePicker、Tree、DataTable
import { beforeAll, describe, expect, it } from 'vitest';
import { DatePicker } from '../../date/DatePicker';
import { DateField } from '../../date/DateField';
import { Tree } from '../../display/Tree';
import { Field } from '../../form/Field';
import { Cascader } from '../../input/Cascader';
import { Select } from '../../input/Select';
import { TreeSelect } from '../../input/TreeSelect';
import { DataTable } from '../../table/DataTable';
import { mount } from '../../utils/.test/mount';
import {
  cascaderHarness,
  dataTableHarness,
  dateFieldHarness,
  datePickerHarness,
  getControl,
  selectHarness,
  settle,
  setupTestingDom,
  treeHarness,
  treeSelectHarness,
} from '..';

beforeAll(() => setupTestingDom());

interface Region {
  code: string;
  name: string;
  children?: Region[];
}
const regions: Region[] = [
  {
    code: 'zj',
    name: '浙江',
    children: [{ code: 'hz', name: '杭州', children: [{ code: 'xh', name: '西湖区' }] }],
  },
  { code: 'js', name: '江苏', children: [{ code: 'sz', name: '苏州' }] },
];
const accessors = {
  getKey: (region: Region) => region.code,
  getLabel: (region: Region) => region.name,
  getChildren: (region: Region) => region.children,
};

describe('testing', () => {
  it('getControl 按 Field 的标签与 aria-label 找控件；找不到时列出有的名称', () => {
    const root = mount(() => (
      <>
        <Field label="城市">
          <Select items={['北京', '上海']} />
        </Field>
        <Select items={['甲']} aria-label="类别" />
      </>
    ));
    expect(getControl(root, '城市').getAttribute('role')).toBe('combobox');
    expect(getControl(root, '类别').getAttribute('role')).toBe('combobox');
    expect(() => getControl(root, '省份')).toThrow(/城市/);
  });

  it('selectHarness：打开、列出选项、按文字选中，单选后显示所选', async () => {
    let city = _state<string | null>(null);
    const root = mount(() => <Select items={['北京', '上海']} _value={city} aria-label="城市" />);
    const select = selectHarness(getControl(root, '城市'));
    expect(await select.options()).toEqual(['北京', '上海']);
    await select.choose('上海');
    expect(city).toBe('上海');
    expect(select.text()).toBe('上海');
    await expect(select.choose('广州')).rejects.toThrow(/北京、上海/);
  });

  it('cascaderHarness：按路径一级一级点下去', async () => {
    let path = _state<readonly string[] | null>(null);
    const root = mount(() => (
      <Cascader items={regions} {...accessors} _value={path} aria-label="地区" />
    ));
    const cascader = cascaderHarness(getControl(root, '地区'));
    await cascader.choose('浙江', '杭州', '西湖区');
    expect(path).toEqual(['zj', 'hz', 'xh']);
  });

  it('treeSelectHarness：展开到最后一级并选中', async () => {
    let code = _state<string | null>(null);
    const root = mount(() => (
      <TreeSelect items={regions} {...accessors} _value={code} aria-label="地区" />
    ));
    await treeSelectHarness(getControl(root, '地区')).choose('浙江', '杭州');
    expect(code).toBe('hz');
  });

  it('dateFieldHarness / datePickerHarness：按 ISO 写法逐段键入', async () => {
    let day = _state<string | null>(null);
    let delivery = _state<string | null>(null);
    const root = mount(() => (
      <>
        <Field label="生日">
          <DateField _value={day} />
        </Field>
        <Field label="交货日期">
          <DatePicker _value={delivery} />
        </Field>
      </>
    ));
    await dateFieldHarness(getControl(root, '生日')).fill('1990-05-17');
    expect(day).toBe('1990-05-17');
    await datePickerHarness(getControl(root, '交货日期')).pick('2026-11-07');
    expect(delivery).toBe('2026-11-07');
  });

  it('treeHarness：展开、看节点、点选', async () => {
    let selected = _state<string[]>([]);
    const root = mount(() => (
      <Tree
        items={regions}
        {...accessors}
        selectionMode="single"
        _selected={selected}
        aria-label="地区"
      />
    ));
    // 虚拟滚动的行在挂载后第一次测量时才出来
    await settle();
    const tree = treeHarness(getControl(root, '地区'));
    expect(tree.labels()).toEqual(['浙江', '江苏']);
    await tree.expand('浙江');
    expect(tree.labels()).toEqual(['浙江', '杭州', '江苏']);
    await tree.click('杭州');
    expect(tree.selected()).toEqual(['杭州']);
  });

  it('dataTableHarness：表头、各行各格、点列标题排序', async () => {
    const rows = [
      { id: 'a', name: '华东钢铁', amount: 3 },
      { id: 'b', name: '西南铝业', amount: 1 },
    ];
    const root = mount(() => (
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: '供应商' },
          { key: 'amount', header: '数量', sortable: true },
        ]}
        getKey={(row) => row.id}
        aria-label="采购单"
      />
    ));
    await settle();
    const table = dataTableHarness(getControl(root, '采购单'));
    expect(table.headers()).toEqual(['供应商', '数量']);
    expect(table.rows()).toEqual([
      ['华东钢铁', '3'],
      ['西南铝业', '1'],
    ]);
    await table.sort('数量');
    expect(table.sortOf('数量')).toBe('ascending');
    expect(table.cell(0, 0)).toBe('西南铝业');
  });
});
