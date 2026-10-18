// 滚动区域的结构与无障碍；滑块大小、拖动、浮层不占位见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { ScrollArea } from '../ScrollArea';

describe('ScrollArea', () => {
  it('视口可聚焦、带上 propsViewport；属性落到外层；纵向时只有一条滚动条且对读屏隐藏', () => {
    const root = mount(() => (
      <ScrollArea data-x="1" propsViewport={{ 'aria-label': '列表' }}>
        内容
      </ScrollArea>
    )).firstElementChild as HTMLElement;
    expect(root.dataset.x).toBe('1');
    const viewport = root.firstElementChild!;
    expect(viewport.getAttribute('tabindex')).toBe('0');
    expect(viewport.getAttribute('aria-label')).toBe('列表');
    expect(viewport.textContent).toBe('内容');
    const bars = root.querySelectorAll('[aria-hidden="true"][data-axis]');
    expect([...bars].map((bar) => bar.getAttribute('data-axis'))).toEqual(['y']);
    // 内容没有超出时滚动条隐藏
    expect(bars[0]!.getAttribute('data-state')).toBe('hidden');
  });

  it('axis="both" 有两条滚动条', () => {
    const root = mount(() => <ScrollArea axis="both">内容</ScrollArea>);
    const axes = [...root.querySelectorAll('[data-axis]')].map((bar) =>
      bar.getAttribute('data-axis'),
    );
    expect(axes).toEqual(['y', 'x']);
  });
});

describe('ScrollArea 的部件属性', () => {
  it('内容层、滚动条、滑块都能加属性；受管的 aria-hidden 不被覆盖', () => {
    const root = mount(() => (
      <ScrollArea
        propsContent={{ class: 'content' }}
        propsScrollbar={{ class: 'bar' }}
        propsThumb={{ class: 'thumb' }}
      >
        内容
      </ScrollArea>
    ));
    expect(root.querySelector('.content')!.textContent).toBe('内容');
    expect(root.querySelector('.bar')!.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.bar > .thumb')).not.toBeNull();
  });
});
