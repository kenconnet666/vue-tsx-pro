// useHoverIntent：停留 delay 后打开、离开 closeDelay 后关闭；同组只开一个，刚关掉一个时下一个直接打开
import { effectScope } from 'vue';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHoverGroup, useHoverIntent } from '../hover-intent';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const enter = new PointerEvent('pointerenter', { pointerType: 'mouse' });

function create(group = createHoverGroup()) {
  const state = { open: false };
  const scope = effectScope();
  const hover = scope.run(() =>
    useHoverIntent(
      group,
      () => ({ delay: 500, closeDelay: 100 }),
      (next) => (state.open = next),
    ),
  )!;
  return { state, hover, group };
}

it('停留 delay 后打开；离开后 closeDelay 内移到浮层上不关', () => {
  const { state, hover } = create();
  hover.trigger.onPointerenter(enter);
  vi.advanceTimersByTime(499);
  expect(state.open).toBe(false);
  vi.advanceTimersByTime(1);
  expect(state.open).toBe(true);
  hover.trigger.onPointerleave();
  vi.advanceTimersByTime(50);
  hover.panel.onPointerenter();
  vi.advanceTimersByTime(1000);
  expect(state.open).toBe(true);
});

it('触屏不打开；同组打开另一个时关掉前一个，刚关掉时下一个不用等', () => {
  const first = create();
  const second = create(first.group);
  first.hover.trigger.onPointerenter(new PointerEvent('pointerenter', { pointerType: 'touch' }));
  vi.advanceTimersByTime(1000);
  expect(first.state.open).toBe(false);

  first.hover.trigger.onPointerenter(enter);
  vi.advanceTimersByTime(500);
  first.hover.opened();
  second.hover.trigger.onPointerenter(enter);
  expect(second.state.open).toBe(true);
  second.hover.opened();
  expect(first.state.open).toBe(false);
});
