// LoadingBar：延迟后才显示、先快后慢停在 90% 前；finish 走满后淡出归零；error 变危险色；很快完成的不显示
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { hasStyles, mount } from '../../utils/.test/mount';
import { createLoadingBar, LoadingBar, loadingBarStyles } from '../LoadingBar';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createLoadingBar', () => {
  it('延迟后显示并逐步前进，不超过 90；finish 走满、淡出后归零', () => {
    const bar = createLoadingBar();
    bar.start();
    expect(bar.visible).toBe(false);
    vi.advanceTimersByTime(200);
    expect(bar.visible).toBe(true);
    const first = bar.progress;
    vi.advanceTimersByTime(600);
    expect(bar.progress).toBeGreaterThan(first);
    vi.advanceTimersByTime(60_000);
    expect(bar.progress).toBeLessThanOrEqual(90);
    bar.finish();
    expect(bar.progress).toBe(100);
    vi.advanceTimersByTime(300);
    expect(bar.visible).toBe(false);
    vi.advanceTimersByTime(300);
    expect(bar.progress).toBe(0);
  });

  it('延迟之内就完成：一直不显示', () => {
    const bar = createLoadingBar({ delay: 200 });
    bar.start();
    vi.advanceTimersByTime(100);
    bar.finish();
    vi.advanceTimersByTime(1000);
    expect(bar.visible).toBe(false);
    expect(bar.progress).toBe(0);
  });

  it('error：标记失败并走满；再次 start 清除失败', () => {
    const bar = createLoadingBar({ delay: 0 });
    bar.start();
    vi.advanceTimersByTime(0);
    bar.error();
    expect(bar.failed).toBe(true);
    expect(bar.progress).toBe(100);
    bar.start();
    expect(bar.failed).toBe(false);
  });
});

describe('LoadingBar', () => {
  it('progressbar 的数值跟随控制器；空闲时对读屏隐藏，出错时用危险色', async () => {
    const bar = createLoadingBar({ delay: 0 });
    const root = mount(() => <LoadingBar controller={bar} />);
    const element = root.querySelector<HTMLElement>('[role="progressbar"]')!;
    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(element.dataset.state).toBe('idle');
    bar.start();
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(element.hasAttribute('aria-hidden')).toBe(false);
    expect(element.getAttribute('aria-busy')).toBe('true');
    expect(element.getAttribute('aria-valuenow')).toBe(String(Math.round(bar.progress)));
    expect(hasStyles(element, loadingBarStyles.visible)).toBe(true);
    bar.error();
    await nextTick();
    expect(element.dataset.state).toBe('error');
    expect(hasStyles(element.firstElementChild!, loadingBarStyles.failed)).toBe(true);
  });
});
