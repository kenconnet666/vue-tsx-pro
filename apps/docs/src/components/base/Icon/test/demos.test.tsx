// Icon 的示例：装饰性与有名称的图标、自定义图标数据
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Custom from '../demo/Custom';
import Labelled from '../demo/Labelled';

it('Labelled：旁边有文字的图标对读屏隐藏，单独的图标有名称', () => {
  const root = mount(Labelled);
  const decorative = root.querySelector('svg')!;
  const named = root.querySelector('svg[aria-label="有未保存的修改"]');
  expect(decorative.getAttribute('aria-hidden')).toBe('true');
  expect([named!.getAttribute('role'), named!.getAttribute('aria-label')]).toEqual([
    'img',
    '有未保存的修改',
  ]);
});

it('Custom：按 Lucide 格式写的节点照常渲染，画布默认 24', () => {
  const [logo, , wave] = mount(Custom).querySelectorAll('svg');
  expect(logo!.getAttribute('viewBox')).toBe('0 0 24 24');
  expect(logo!.querySelectorAll('path, circle')).toHaveLength(2);
  expect(wave!.getAttribute('viewBox')).toBe('0 0 32 32');
});
