// useLeaveConfirmation：有修改时 beforeunload 被拦住，没有时不注册；站内跳转先确认；作用域结束后解除
import { _component } from '@vue-tsx-pro/tsx';
import { effectScope, nextTick, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from '../../config/Provider';
import { vueRouterAdapter } from '../../config/vue-router';
import { mount } from '../../utils/.test/mount';
import { useLeaveConfirmation } from '../leave-confirmation';

// 对话框本身由 AlertDialog 负责；这里只看守卫有没有在该问的时候问、按回答放行
const confirm = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
vi.mock('../../overlay/AlertDialog', () => ({ useConfirm: () => confirm }));

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

  it('站内跳转：有修改时先确认，取消就留下；没修改、只换 query、卸载之后都不问', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:path(.*)*', component: { render: () => null } }],
    });
    await router.push('/edit');
    const dirty = ref(true);
    const Editor = _component(() => {
      useLeaveConfirmation(() => dirty.value, { title: '放弃这张单据？' });
      return () => null;
    });
    const shown = ref(true);
    mount(() => <Provider router={vueRouterAdapter(router)}>{shown.value && <Editor />}</Provider>);

    confirm.mockResolvedValueOnce(false);
    await router.push('/list');
    expect(router.currentRoute.value.path).toBe('/edit');
    expect(confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: '放弃这张单据？', confirmText: '离开', tone: 'danger' }),
    );

    await router.push('/edit?tab=items');
    expect(confirm).toHaveBeenCalledTimes(1);

    confirm.mockResolvedValueOnce(true);
    await router.push('/list');
    expect(router.currentRoute.value.path).toBe('/list');

    // 测试里编辑器一直挂着（没有 RouterView），回去之前先把修改清掉
    dirty.value = false;
    await router.push('/edit');
    await router.push('/list');
    expect(confirm).toHaveBeenCalledTimes(2);

    dirty.value = true;
    shown.value = false;
    await nextTick();
    await router.push('/home');
    expect([confirm.mock.calls.length, router.currentRoute.value.path]).toEqual([2, '/home']);
  });
});
