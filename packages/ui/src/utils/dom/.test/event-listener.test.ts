// useEventListener：作用域销毁时移除；目标是 getter 时变了换绑、null 时不监听；返回的函数立即移除
import { describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, shallowRef } from 'vue';
import { useEventListener } from '../event-listener';

describe('useEventListener', () => {
  it('作用域销毁时移除', () => {
    const listener = vi.fn();
    const scope = effectScope();
    scope.run(() => useEventListener(window, 'resize', listener));
    window.dispatchEvent(new Event('resize'));
    scope.stop();
    window.dispatchEvent(new Event('resize'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('目标是 getter：变了换绑，null 时不监听', async () => {
    const listener = vi.fn();
    const first = document.createElement('div');
    const second = document.createElement('div');
    const target = shallowRef<HTMLElement | null>(first);
    const scope = effectScope();
    scope.run(() => useEventListener(() => target.value, 'click', listener));
    first.click();
    target.value = second;
    await nextTick();
    first.click();
    second.click();
    target.value = null;
    await nextTick();
    second.click();
    expect(listener).toHaveBeenCalledTimes(2);
    scope.stop();
  });

  it('返回的函数立即移除；不在作用域里也能用', () => {
    const listener = vi.fn();
    const stop = useEventListener(document, 'keydown', listener);
    document.dispatchEvent(new KeyboardEvent('keydown'));
    stop();
    document.dispatchEvent(new KeyboardEvent('keydown'));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
