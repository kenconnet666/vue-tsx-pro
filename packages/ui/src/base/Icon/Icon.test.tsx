import { Check } from '@lucide/icons';
import { describe, expect, it } from 'vitest';
import type { VNodeChild } from 'vue';
import { mount } from '../../../test/mount';
import { Icon, type IconData } from './Icon';

const render = (node: () => VNodeChild) => mount(node).querySelector('svg')!;

const dot: IconData = { size: 16, node: [['circle', { cx: 8, cy: 8, r: 4, key: 'dot' }]] };

describe('Icon', () => {
  it('按数据渲染节点，viewBox 跟随图标的画布大小', () => {
    const lucide = render(() => <Icon icon={Check} />);
    expect(lucide.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(lucide.querySelectorAll('path').length).toBe(Check.node.length);

    const custom = render(() => <Icon icon={dot} />);
    expect(custom.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(custom.querySelector('circle')!.getAttribute('r')).toBe('4');
  });

  it('默认是装饰性的；传了 aria-label 才作为图片暴露给读屏', () => {
    const decorative = render(() => <Icon icon={Check} />);
    expect(decorative.getAttribute('aria-hidden')).toBe('true');
    expect(decorative.hasAttribute('role')).toBe(false);

    const labelled = render(() => <Icon icon={Check} aria-label="完成" />);
    expect(labelled.getAttribute('role')).toBe('img');
    expect(labelled.getAttribute('aria-label')).toBe('完成');
    expect(labelled.hasAttribute('aria-hidden')).toBe(false);

    // 带连字符的属性 TypeScript 不做多余属性检查，类型上拦不住；运行时以组件为准
    const forced = render(() => <Icon icon={Check} {...{ 'aria-hidden': 'false' }} />);
    expect(forced.getAttribute('aria-hidden')).toBe('true');
  });

  it('未声明的属性落到 svg；数字尺寸与线宽写成行内样式', () => {
    const svg = render(() => <Icon icon={Check} data-testid="x" size={20} strokeWidth={1.5} />);
    expect(svg.dataset.testid).toBe('x');
    expect(svg.style.fontSize).toBe('20px');
    expect(svg.style.strokeWidth).toBe('1.5');
  });

  it('Lucide 图标是线框：不填充，描边跟随文字颜色', () => {
    const svg = render(() => <Icon icon={Check} />);
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
  });

  it('尺寸档位与 flipInRtl 各自追加样式', () => {
    const classes = (svg: SVGElement) => svg.getAttribute('class')!.split(' ').length;
    const plain = classes(render(() => <Icon icon={Check} />));
    expect(classes(render(() => <Icon icon={Check} size="lg" />))).toBeGreaterThan(plain);
    expect(classes(render(() => <Icon icon={Check} flipInRtl />))).toBeGreaterThan(plain);
  });
});

// 类型：由组件管理的属性不能从外部传入
// @ts-expect-error viewBox 由组件管理
export const managedViewBox = () => <Icon icon={Check} viewBox="0 0 1 1" />;
