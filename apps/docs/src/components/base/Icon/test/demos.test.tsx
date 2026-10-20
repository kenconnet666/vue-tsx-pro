// Icon 的示例：装饰性与有名称的图标、自定义图标数据
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Custom from '../demo/Custom';
import Labelled from '../demo/Labelled';

it('Labelled：旁边有文字的图标对读屏隐藏，单独的图标有名称', () => {
  const [decorative, named] = mount(Labelled).querySelectorAll('svg');
  expect(decorative!.getAttribute('aria-hidden')).toBe('true');
  expect([named!.getAttribute('role'), named!.getAttribute('aria-label')]).toEqual([
    'img',
    '有未保存的修改',
  ]);
});

it('Custom：按 Lucide 格式写的节点照常渲染，画布默认 24', () => {
  const svg = mount(Custom).querySelector('svg')!;
  expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
  expect(svg.querySelectorAll('path, circle')).toHaveLength(2);
});
