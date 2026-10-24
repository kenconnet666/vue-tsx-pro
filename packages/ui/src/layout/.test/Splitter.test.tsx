// 拖动的实际比例见文档站；这里看分隔条的取值、键盘与收起
import { describe, expect, it } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { Splitter } from '../Splitter';

const key = (element: Element, name: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

describe('Splitter', () => {
  it('分隔条是可聚焦的 separator，带当前比例与范围；两栏按比例分', () => {
    const root = mount(() => <Splitter size={30} start="列表" end="预览" />);
    const handle = root.querySelector('[role="separator"]')!;
    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    expect(handle.getAttribute('aria-valuenow')).toBe('30');
    expect(handle.getAttribute('aria-valuemin')).toBe('20');
    expect(handle.getAttribute('aria-valuemax')).toBe('80');
    expect(styleTextOf(root.firstElementChild!)).toContain('minmax(0, 30fr)');
  });

  it('←/→ 每次 5%，Home / End 到最小、最大，写回 size', async () => {
    const size = shallowRef(50);
    const root = mount(() => (
      <Splitter
        size={size.value}
        {...{ 'onUpdate:size': (next: number) => (size.value = next) }}
        start="a"
        end="b"
      />
    ));
    const handle = root.querySelector('[role="separator"]')!;
    key(handle, 'ArrowRight');
    expect(size.value).toBe(55);
    key(handle, 'ArrowLeft');
    key(handle, 'ArrowLeft');
    expect(size.value).toBe(45);
    key(handle, 'Home');
    expect(size.value).toBe(20);
    key(handle, 'End');
    await nextTick();
    expect(size.value).toBe(80);
  });

  it('collapsible：Enter 或按钮收起那一侧（hidden），再按展开；不能收起时没有按钮', async () => {
    const collapsed = shallowRef(false);
    const root = mount(() => (
      <Splitter
        collapsible="end"
        collapsed={collapsed.value}
        {...{ 'onUpdate:collapsed': (next: boolean) => (collapsed.value = next) }}
        start="a"
        end="b"
      />
    ));
    const handle = root.querySelector('[role="separator"]')!;
    // 分隔条在中间那一格里，收起按钮与它并排（交互元素不能嵌套）
    const track = handle.parentElement!;
    const end = track.nextElementSibling as HTMLElement;
    key(handle, 'Enter');
    await nextTick();
    expect(collapsed.value).toBe(true);
    expect(end.hidden).toBe(true);
    expect(handle.getAttribute('aria-valuenow')).toBe('100');
    expect(handle.querySelector('button')).toBeNull();
    const toggle = track.querySelector('button')!;
    expect(toggle.getAttribute('aria-label')).toBe('展开');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    await nextTick();
    expect(collapsed.value).toBe(false);
    expect(end.hidden).toBe(false);

    const plain = mount(() => <Splitter start="a" end="b" />);
    expect(plain.querySelector('button')).toBeNull();
  });

  it('上下排列：分隔条是横向的，用 ↑/↓', () => {
    const size = shallowRef(50);
    const root = mount(() => (
      <Splitter
        orientation="vertical"
        size={size.value}
        {...{ 'onUpdate:size': (next: number) => (size.value = next) }}
        start="a"
        end="b"
      />
    ));
    const handle = root.querySelector('[role="separator"]')!;
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    key(handle, 'ArrowDown');
    expect(size.value).toBe(55);
  });
});
