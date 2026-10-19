// usePresence：关闭后保持挂载等离场结束；离场中又打开就不卸载
import { _component } from '@vue-tsx-pro/tsx';
import { nextTick, shallowRef } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../.test/mount';
import { usePresence, type PresenceOptions } from '../presence';

function setup(options: PresenceOptions = {}) {
  const open = shallowRef(true);
  const Panel = _component(() => {
    const presence = usePresence(() => open.value, options);
    return () => presence.mounted && <div ref={presence.ref} data-state={presence.state} />;
  });
  const host = mount(() => <Panel />);
  return { open, panel: () => host.querySelector('div') };
}

describe('usePresence', () => {
  it('关闭后先写 closed，离场结束再卸载并调用 onExited', async () => {
    const onExited = vi.fn();
    let finish!: () => void;
    const exit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { open, panel } = setup({ onExited, exit });
    expect(panel()?.dataset.state).toBe('open');

    open.value = false;
    await nextTick();
    expect(panel()?.dataset.state).toBe('closed');
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(panel()));
    expect(onExited).not.toHaveBeenCalled();

    finish();
    await vi.waitFor(() => expect(panel()).toBeNull());
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it('没有离场动画时下一轮就卸载', async () => {
    const { open, panel } = setup();
    open.value = false;
    await vi.waitFor(() => expect(panel()).toBeNull());
    open.value = true;
    await nextTick();
    expect(panel()?.dataset.state).toBe('open');
  });

  it('离场中又打开：停在打开状态，不卸载、不调用 onExited', async () => {
    const onExited = vi.fn();
    let finish!: () => void;
    const { open, panel } = setup({
      onExited,
      exit: () => new Promise<void>((resolve) => (finish = resolve)),
    });
    open.value = false;
    await vi.waitFor(() => expect(finish).toBeDefined());
    open.value = true;
    await nextTick();
    finish();
    await new Promise((resolve) => setTimeout(resolve));
    expect(panel()?.dataset.state).toBe('open');
    expect(onExited).not.toHaveBeenCalled();
  });
});
