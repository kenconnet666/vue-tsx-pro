// PullRefresh：顶部下拉够了松手刷新、不够弹回、不在顶部不接管；Promise 完成后收起，成功提示停留
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { FixedMeasure, swipe, touch } from '../../utils/.test/touch';
import { PullRefresh } from '../PullRefresh';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('PullRefresh（H5）', () => {
  it('拉够了松手刷新，Promise 完成后显示成功提示再收起', async () => {
    let finish!: () => void;
    const onRefresh = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const root = mount(() => (
      <PullRefresh onRefresh={onRefresh} successText="刷新成功" successDuration={50}>
        列表
      </PullRefresh>
    ));
    const box = root.firstElementChild as HTMLElement;

    touch(box, 'touchstart', 100, 100);
    const move = touch(box, 'touchmove', 100, 140);
    expect(move.defaultPrevented).toBe(true);
    await nextTick();
    expect(box.dataset.status).toBe('pulling');
    expect(box.textContent).toContain('下拉即可刷新');
    touch(box, 'touchmove', 100, 180);
    await nextTick();
    expect(box.dataset.status).toBe('loosing');
    touch(box, 'touchend', 100, 180);
    await nextTick();
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(box.dataset.status).toBe('loading');

    finish();
    await wait(0);
    await nextTick();
    expect(box.dataset.status).toBe('success');
    expect(box.textContent).toContain('刷新成功');
    await wait(60);
    expect(box.dataset.status).toBe('normal');
  });

  it('拉不够弹回；页面不在顶部、往上推都不接管', async () => {
    const onRefresh = vi.fn();
    const root = mount(() => <PullRefresh onRefresh={onRefresh}>列表</PullRefresh>);
    const box = root.firstElementChild as HTMLElement;
    swipe(box, [100, 100], [100, 130]);
    await nextTick();
    expect(onRefresh).not.toHaveBeenCalled();
    expect(box.dataset.status).toBe('normal');

    touch(box, 'touchstart', 100, 100);
    expect(touch(box, 'touchmove', 100, 60).defaultPrevented).toBe(false);
    touch(box, 'touchend', 100, 60);

    const scrolled = mount(() => (
      <FixedMeasure rect={{}} scrollTop={200}>
        <PullRefresh onRefresh={onRefresh}>列表</PullRefresh>
      </FixedMeasure>
    ));
    const lower = scrolled.firstElementChild!;
    swipe(lower, [100, 100], [100, 300]);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
