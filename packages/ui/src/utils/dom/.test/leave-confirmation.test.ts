// useLeaveConfirmation：有修改时 beforeunload 被拦住，没有时不注册；作用域结束后解除
import { effectScope, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { useLeaveConfirmation } from '../leave-confirmation';

const unload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

describe('useLeaveConfirmation', () => {
  it('read() 为 true 时拦住页面卸载，变回 false 或作用域结束后不再拦', async () => {
    const dirty = ref(false);
    const scope = effectScope();
    scope.run(() => useLeaveConfirmation(() => dirty.value));
    expect(unload()).toBe(false);
    dirty.value = true;
    await nextTick();
    expect(unload()).toBe(true);
    dirty.value = false;
    await nextTick();
    expect(unload()).toBe(false);
    dirty.value = true;
    await nextTick();
    scope.stop();
    expect(unload()).toBe(false);
  });
});
