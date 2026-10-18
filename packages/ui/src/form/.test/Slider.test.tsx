// 滑块的取值、键盘与无障碍属性；真实拖动见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Slider } from '../Slider';

const thumbOf = (root: Element) => root.querySelector<HTMLElement>('[role="slider"]')!;
const key = (element: HTMLElement, name: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

describe('Slider', () => {
  it('滑块是 role="slider"，带取值范围与名称；属性落到滑块上', () => {
    const root = mount(() => <Slider value={30} aria-label="音量" valueText={(v) => `${v}%`} />);
    const thumb = thumbOf(root);
    expect(thumb.getAttribute('aria-label')).toBe('音量');
    expect(thumb.getAttribute('aria-valuemin')).toBe('0');
    expect(thumb.getAttribute('aria-valuemax')).toBe('100');
    expect(thumb.getAttribute('aria-valuenow')).toBe('30');
    expect(thumb.getAttribute('aria-valuetext')).toBe('30%');
    expect(thumb.getAttribute('aria-orientation')).toBe('horizontal');
    expect(thumb.getAttribute('tabindex')).toBe('0');
  });

  it('键盘：方向键 ±step、Page 键 ±bigStep、Home/End 到两端，夹在范围内；每次都提交', async () => {
    let value = _state(50);
    const commit = vi.fn();
    const root = mount(() => (
      <Slider value={_bind(value)} step={5} aria-label="x" onValueCommit={commit} />
    ));
    const thumb = thumbOf(root);
    key(thumb, 'ArrowRight');
    expect(value).toBe(55);
    key(thumb, 'ArrowDown');
    expect(value).toBe(50);
    key(thumb, 'PageUp');
    expect(value).toBe(60);
    key(thumb, 'End');
    key(thumb, 'ArrowUp');
    expect(value).toBe(100);
    key(thumb, 'Home');
    expect(value).toBe(0);
    expect(commit).toHaveBeenLastCalledWith(0);
    await nextTick();
    expect(thumb.getAttribute('aria-valuenow')).toBe('0');
  });

  it('小数步长不带浮点误差', () => {
    let value = _state(0.1);
    const root = mount(() => (
      <Slider value={_bind(value)} min={0} max={1} step={0.1} aria-label="x" />
    ));
    key(thumbOf(root), 'ArrowRight');
    key(thumbOf(root), 'ArrowRight');
    expect(value).toBe(0.3);
  });

  it('点击轨道跳到对应位置（按轨道的位置换算并对齐步长）', () => {
    let value = _state(0);
    const root = mount(() => <Slider value={_bind(value)} step={10} aria-label="x" />);
    const track = thumbOf(root).previousElementSibling as HTMLElement;
    track.getBoundingClientRect = () =>
      ({ left: 0, width: 200, top: 0, bottom: 10, height: 10 }) as DOMRect;
    root.firstElementChild!.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 130, button: 0, pointerId: 1, bubbles: true }),
    );
    expect(value).toBe(70);
  });

  it('不可用：不能聚焦，键盘与指针都不改值；给了 name 就带隐藏 input', () => {
    let value = _state(20);
    const root = mount(() => <Slider value={_bind(value)} disabled name="volume" aria-label="x" />);
    const thumb = thumbOf(root);
    expect(thumb.hasAttribute('tabindex')).toBe(false);
    expect(thumb.getAttribute('aria-disabled')).toBe('true');
    key(thumb, 'ArrowRight');
    expect(value).toBe(20);
    expect(root.querySelector<HTMLInputElement>('input[name="volume"]')!.value).toBe('20');
  });
});
