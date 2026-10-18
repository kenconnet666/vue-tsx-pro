// 拖动验证的状态、键盘替代操作与结果；真实拖动见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { SlideVerify, type SlideVerifyResult } from '../SlideVerify';

const handleOf = (root: Element) => root.querySelector<HTMLElement>('[role="slider"]')!;
const key = (element: HTMLElement, name: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

describe('SlideVerify', () => {
  it('滑块有名称（语言包的提示）与取值；轨道上显示提示', () => {
    const root = mount(() => <SlideVerify />);
    const handle = handleOf(root);
    expect(handle.getAttribute('aria-label')).toBe('拖动滑块完成验证');
    expect(handle.getAttribute('aria-valuenow')).toBe('0');
    expect(root.textContent).toContain('拖动滑块完成验证');
  });

  it('键盘：End 到头，Enter 松手，结果带位置与轨迹', () => {
    const onRelease = vi.fn<(result: SlideVerifyResult) => void>();
    const root = mount(() => <SlideVerify onRelease={onRelease} />);
    key(handleOf(root), 'ArrowRight');
    key(handleOf(root), 'End');
    key(handleOf(root), 'Enter');
    const result = onRelease.mock.calls[0]![0];
    expect(result.position).toBe(1);
    expect(result.trail.map((point) => point.position)).toEqual([0.05, 1]);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('target="end" 没到头就松手：弹回起点，不触发 onRelease', async () => {
    let position = _state(0);
    const onRelease = vi.fn();
    const root = mount(() => <SlideVerify position={_bind(position)} onRelease={onRelease} />);
    key(handleOf(root), 'ArrowRight');
    expect(position).toBeCloseTo(0.05);
    key(handleOf(root), 'Enter');
    expect(position).toBe(0);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('target="free"（拼图）：任意位置松手都交给应用判断', () => {
    const onRelease = vi.fn<(result: SlideVerifyResult) => void>();
    const root = mount(() => <SlideVerify target="free" onRelease={onRelease} />);
    for (let i = 0; i < 6; i++) key(handleOf(root), 'ArrowRight');
    key(handleOf(root), ' ');
    expect(onRelease.mock.calls[0]![0].position).toBeCloseTo(0.3);
  });

  it('状态由应用控制：verifying 时锁定并播报，设回 idle 时回到起点', async () => {
    let status = _state<'idle' | 'verifying' | 'success' | 'error'>('idle');
    let position = _state(0);
    const root = mount(() => (
      <SlideVerify status={status} target="free" position={_bind(position)} />
    ));
    key(handleOf(root), 'End');
    status = 'verifying';
    await nextTick();
    expect(handleOf(root).getAttribute('aria-disabled')).toBe('true');
    expect(root.querySelector('[aria-live]')!.textContent).toBe('验证中…');
    key(handleOf(root), 'Home');
    expect(position).toBe(1);

    status = 'error';
    await nextTick();
    expect(root.querySelector('[aria-live]')!.textContent).toBe('验证失败，请重试');
    status = 'idle';
    await nextTick();
    expect(position).toBe(0);
  });
});
