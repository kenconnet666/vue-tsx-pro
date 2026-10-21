// PropsTable：列标题取语言包，必填与可绑定的标记，默认值，档位类 prop 的可选值说明
import { expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { PropsTable, type ApiProp } from '../PropsTable';

const props: ApiProp[] = [
  {
    name: 'value',
    kind: 'prop',
    type: 'string',
    required: true,
    bindable: true,
    description: '选中的值',
  },
  {
    name: 'size',
    kind: 'prop',
    type: 'keyof Sizes',
    required: false,
    default: "'md'",
    description: '尺寸',
    values: [
      { value: 'sm', description: '紧凑' },
      { value: 'md', description: '常规' },
    ],
  },
];

it('一行一个 prop：名称、标记、类型、默认值、说明与可选值', () => {
  const root = mount(() => <PropsTable props={props} caption="属性" />);
  expect(root.querySelector('caption')!.textContent).toBe('属性');
  expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
    '名称',
    '类型',
    '默认值',
    '说明',
  ]);
  const [value, size] = root.querySelectorAll<HTMLTableRowElement>('tbody tr');
  expect(value!.cells[0]!.textContent).toBe('value必填可绑定');
  expect(value!.cells[2]!.textContent).toBe('—');
  expect(size!.cells[2]!.textContent).toBe("'md'");
  expect([...size!.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(['sm', 'md']);
  expect(size!.querySelector('dd')!.textContent).toBe('紧凑');
});
