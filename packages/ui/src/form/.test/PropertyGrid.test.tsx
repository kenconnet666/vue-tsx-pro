// 属性面板：按字段描述画行，改一处交出“路径加值”；可选字段设回默认值时去掉、写了的可以去掉；没写的一组设置先“添加”；
// 列表加删项，几种之一换种类时留下共有的字段；多选的值显示“多个值”；使用方的种类走 editors；值的工具函数
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { PropertyEditor, PropertyGrid } from '../PropertyGrid';
import {
  emptyPropertyValue,
  hexToPropertyColor,
  propertyColorToHex,
  PROPERTY_MIXED,
  setPropertyPath,
  type PropertyField,
  type PropertyPath,
} from '../property-types';

type Asset = { readonly kind: 'asset'; readonly folder: string };

const fields: PropertyField<Asset>[] = [
  {
    name: 'intensity',
    label: '强度',
    type: { kind: 'number', min: 0 },
    optional: true,
    default: 1,
  },
  { name: 'enabled', type: { kind: 'bool' } },
  { name: 'mode', type: { kind: 'enum', values: ['a', 'b'], labels: { a: '甲', b: '乙' } } },
  { name: 'note', type: { kind: 'string' }, optional: true },
  {
    name: 'shadow',
    type: { kind: 'object', fields: [{ name: 'bias', type: { kind: 'number' } }] },
    optional: true,
  },
  { name: 'tags', type: { kind: 'list', item: { kind: 'string' } } },
  {
    name: 'shape',
    type: {
      kind: 'union',
      tag: 'type',
      common: [{ name: 'size', type: { kind: 'number' } }],
      variants: { box: [{ name: 'depth', type: { kind: 'number' } }], sphere: [] },
    },
  },
  { name: 'texture', type: { kind: 'asset', folder: 'textures' }, nullable: true },
];

function setup(value: Record<string, unknown>) {
  const changes: [PropertyPath, unknown][] = [];
  const root = mount(() => (
    <PropertyGrid
      fields={fields}
      value={value}
      onSet={(path, next) => changes.push([path, next])}
      editors={{
        asset: {
          render: ({ type, value: current, label }) =>
            h('span', { 'data-asset': type.folder, 'aria-label': label }, String(current)),
          empty: () => '',
        },
      }}
    />
  ));
  return { root, changes };
}

const rowOf = (root: Element, label: string) =>
  [...root.querySelectorAll('[data-part="row"]')].find(
    (row) => row.querySelector('[data-part="label"]')?.textContent?.replace(' *', '') === label,
  )!;

describe('PropertyGrid', () => {
  it('每个字段一行；没写的可选字段名字淡一点，必填没设的带 *', () => {
    const { root } = setup({
      enabled: true,
      mode: 'a',
      tags: [],
      shape: { type: 'box', size: 1, depth: 2 },
    });
    // 只看第一层的行（几种之一的字段嵌在 shape 里）
    const labels = [
      ...root.querySelectorAll(':scope > div > [data-part="row"] > [data-part="label"]'),
    ].map((label) => label.textContent);
    expect(labels.slice(0, 8)).toEqual([
      '强度',
      'enabled',
      'mode',
      'note',
      'shadow',
      'tags',
      'shape',
      'texture *',
    ]);
    expect(rowOf(root, '强度').querySelector('input')!.value).toBe('1');
    expect(rowOf(root, 'texture').querySelector('[data-asset="textures"]')!.textContent).toBe(
      'undefined',
    );
  });

  it('可选字段设回默认值时去掉这个键；写了的没有默认值的可选字段能去掉', async () => {
    const { root, changes } = setup({
      intensity: 1.1,
      note: '备注',
      tags: [],
      shape: { type: 'sphere' },
    });
    const input = rowOf(root, '强度').querySelector('input')!;
    // 方向键减一步（0.1）回到默认值 1
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();
    const last = changes.at(-1)!;
    expect(last[0]).toEqual(['intensity']);
    expect(
      typeof last[1] === 'function' ? (last[1] as (v: unknown) => unknown)(1.1) : last[1],
    ).toBeUndefined();
    rowOf(root, 'note').querySelector<HTMLButtonElement>('button[aria-label="去掉note"]')!.click();
    expect(changes.at(-1)).toEqual([['note'], undefined]);
  });

  it('没写的一组设置先“添加”；可空字段是 null 时“设置”', () => {
    const { root, changes } = setup({ texture: null, tags: [], shape: { type: 'sphere' } });
    [...rowOf(root, 'shadow').querySelectorAll('button')]
      .find((b) => b.textContent?.includes('添加'))!
      .click();
    expect(changes.at(-1)).toEqual([['shadow'], { bias: 0 }]);
    [...rowOf(root, 'texture').querySelectorAll('button')]
      .find((b) => b.textContent?.includes('设置'))!
      .click();
    expect(changes.at(-1)).toEqual([['texture'], '']);
  });

  it('列表加一项、删一项；几种之一换种类时留下共有的字段', () => {
    const { root, changes } = setup({
      tags: ['x', 'y'],
      shape: { type: 'box', size: 3, depth: 2 },
    });
    [...rowOf(root, 'tags').querySelectorAll('button')]
      .find((b) => b.textContent?.includes('添加'))!
      .click();
    expect(changes.at(-1)).toEqual([['tags', 2], '']);
    rowOf(root, 'tags')
      .querySelector<HTMLButtonElement>('button[aria-label="删掉tags的第 1 项"]')!
      .click();
    const [path, remove] = changes.at(-1)!;
    expect(path).toEqual(['tags']);
    expect((remove as (v: unknown) => unknown)(['x', 'y'])).toEqual(['y']);
    // 换种类的结果按原来的值算
    const shapeRow = rowOf(root, 'shape');
    expect(shapeRow.querySelectorAll('[data-part="row"]').length).toBe(2);
  });

  it('多选时不一样的值显示“多个值”', () => {
    const { root } = setup({
      enabled: PROPERTY_MIXED,
      note: PROPERTY_MIXED,
      tags: PROPERTY_MIXED,
      shape: { type: 'box' },
    });
    expect(rowOf(root, 'enabled').textContent).toContain('多个值');
    expect(rowOf(root, 'note').querySelector('input')!.placeholder).toBe('多个值');
    expect(rowOf(root, 'tags').textContent).toContain('多个值');
  });

  it('PropertyEditor 只画一个值：向量的分量各改各的', () => {
    const changes: [PropertyPath, unknown][] = [];
    const root = mount(() => (
      <PropertyEditor
        type={{ kind: 'vector', size: 3 }}
        value={[1, 2, 3]}
        label="位置"
        onSet={(path, next) => changes.push([path, next])}
      />
    ));
    const inputs = [...root.querySelectorAll('input')];
    expect(inputs.map((input) => input.getAttribute('aria-label'))).toEqual([
      '位置 X',
      '位置 Y',
      '位置 Z',
    ]);
  });
});

describe('值的工具', () => {
  it('setPropertyPath 不改原值，undefined 去掉键，函数按原来的值算', () => {
    const root = { a: { b: 1, c: 2 }, list: [1, 2] };
    expect(setPropertyPath(root, ['a', 'b'], 5)).toEqual({ a: { b: 5, c: 2 }, list: [1, 2] });
    expect(setPropertyPath(root, ['a', 'c'], undefined)).toEqual({ a: { b: 1 }, list: [1, 2] });
    expect(setPropertyPath(root, ['list', 1], (v: unknown) => (v as number) * 10)).toEqual({
      a: { b: 1, c: 2 },
      list: [1, 20],
    });
    expect(setPropertyPath(undefined, ['x', 0], 1)).toEqual({ x: [1] });
    expect(root).toEqual({ a: { b: 1, c: 2 }, list: [1, 2] });
  });

  it('emptyPropertyValue：必填字段的初值，使用方的种类问 custom', () => {
    expect(emptyPropertyValue({ kind: 'number', min: 2 })).toBe(2);
    expect(emptyPropertyValue({ kind: 'color', alpha: true })).toEqual([1, 1, 1, 1]);
    expect(emptyPropertyValue<Asset>({ kind: 'object', fields }, () => 'none')).toEqual({
      enabled: false,
      mode: 'a',
      tags: [],
      shape: { type: 'box', size: 0, depth: 0 },
      texture: null,
    });
  });

  it('线性颜色和取色器的 sRGB 互换', () => {
    expect(propertyColorToHex([1, 0.5, 0], 'srgb')).toBe('#ff8000');
    // HDR 的值（超过 1）在取色器上夹住
    expect(propertyColorToHex([4, -1, 0.5])).toBe('#ff0080');
    expect(propertyColorToHex([0.21586, 0, 0], 'linear')).toBe('#800000');
    expect(hexToPropertyColor('#800000', 'linear', [0, 0, 0, 0.5])).toEqual([0.21586, 0, 0, 0.5]);
  });
});
