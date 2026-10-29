// SlideCaptcha：加载中、键盘微调后松手交出位置与轨迹、各状态的提示与锁定；拖动用指针事件，见浏览器里的示例
import { nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../utils/.test/mount';
import {
  SlideCaptcha,
  type SlideChallenge,
  type SlideResult,
  type SlideStatus,
} from '../SlideCaptcha';

const challenge: SlideChallenge = {
  id: 'c1',
  background: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  piece: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  width: 320,
  height: 160,
  pieceWidth: 57,
};

const slider = (host: HTMLElement) => host.querySelector<HTMLElement>('[role="slider"]')!;
const press = (element: HTMLElement, key: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

describe('SlideCaptcha', () => {
  it('还没拿到图时显示加载中，滑块不能操作', () => {
    const host = mount(() => <SlideCaptcha challenge={null} />);
    expect(host.textContent).toContain('加载中');
    expect(host.querySelectorAll('img')).toHaveLength(0);
    expect(slider(host).getAttribute('aria-disabled')).toBe('true');
    expect(slider(host).tabIndex).toBe(-1);
  });

  it('键盘微调后按 Enter 松手：交出位置、轨迹和时长', async () => {
    const released: SlideResult[] = [];
    const host = mount(() => (
      <SlideCaptcha challenge={challenge} onRelease={(result) => released.push(result)} />
    ));
    const handle = slider(host);
    expect(handle.getAttribute('aria-valuemax')).toBe(
      String(challenge.width - challenge.pieceWidth),
    );
    for (let i = 0; i < 3; i++) press(handle, 'ArrowRight');
    await nextTick();
    expect(handle.getAttribute('aria-valuenow')).toBe('6');
    press(handle, 'Enter');
    expect(released).toHaveLength(1);
    expect(released[0]!.x).toBe(6);
    expect(released[0]!.track).toHaveLength(3);
    expect(released[0]!.duration).toBeGreaterThanOrEqual(0);
  });

  it('Home / End 到两端；没动过就按 Enter 不松手', async () => {
    const onRelease = vi.fn();
    const host = mount(() => <SlideCaptcha challenge={challenge} onRelease={onRelease} />);
    const handle = slider(host);
    press(handle, 'Enter');
    expect(onRelease).not.toHaveBeenCalled();
    press(handle, 'End');
    await nextTick();
    expect(handle.getAttribute('aria-valuenow')).toBe(
      String(challenge.width - challenge.pieceWidth),
    );
    press(handle, 'Home');
    await nextTick();
    expect(handle.getAttribute('aria-valuenow')).toBe('0');
  });

  it('验证中、通过时锁定；没对准时显示提示，设回 idle 滑块回到起点', async () => {
    const status = ref<SlideStatus>('idle');
    const host = mount(() => (
      <SlideCaptcha challenge={challenge} status={status.value} errorText="位置差太多" />
    ));
    const handle = slider(host);
    press(handle, 'ArrowRight');
    await nextTick();
    expect(handle.getAttribute('aria-valuenow')).toBe('2');

    status.value = 'verifying';
    await nextTick();
    expect(host.firstElementChild!.getAttribute('aria-busy')).toBe('true');
    expect(handle.getAttribute('aria-disabled')).toBe('true');

    status.value = 'error';
    await nextTick();
    expect(host.textContent).toContain('位置差太多');

    status.value = 'idle';
    await nextTick();
    expect(handle.getAttribute('aria-valuenow')).toBe('0');
    expect(handle.getAttribute('aria-disabled')).toBeNull();

    status.value = 'success';
    await nextTick();
    expect(host.textContent).toContain('验证通过');
    expect(handle.getAttribute('aria-disabled')).toBe('true');
  });

  it('换了新图，滑块回到起点；“换一张”触发 onRefresh', async () => {
    const current = ref(challenge);
    const onRefresh = vi.fn();
    const host = mount(() => <SlideCaptcha challenge={current.value} onRefresh={onRefresh} />);
    const handle = slider(host);
    press(handle, 'ArrowRight');
    await nextTick();
    current.value = { ...challenge, id: 'c2' };
    await nextTick();
    expect(handle.getAttribute('aria-valuenow')).toBe('0');
    host.querySelector<HTMLButtonElement>('button[aria-label="换一张"]')!.click();
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
