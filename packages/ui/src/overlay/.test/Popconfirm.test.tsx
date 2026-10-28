// Popconfirm：alertdialog 的名称与说明、取消在前；确认等 Promise、返回 false 或失败时保持打开；取消（含按钮）报告 onCancel
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { Button } from '../../base/Button';
import { mount } from '../../utils/.test/mount';
import { Popconfirm } from '../Popconfirm';

// happy-dom 没有 popover 的方法
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

async function render(onConfirm: () => unknown, onCancel = vi.fn()) {
  const state = reactive({ open: true });
  const root = mount(() => (
    <Popconfirm
      _open={state.open}
      lazy={false}
      title="删除这条记录？"
      description="删除后无法恢复"
      tone="danger"
      confirmText="删除"
      onConfirm={onConfirm}
      onCancel={onCancel}
      trigger={(props) => <Button {...props}>删除</Button>}
    />
  ));
  // 面板挂载后的下一次渲染才出现
  await nextTick();
  const panel = root.querySelector<HTMLElement>('[role="alertdialog"]')!;
  const button = (text: string) =>
    [...panel.querySelectorAll('button')].find((item) => item.textContent === text)!;
  return { panel, button, isOpen: () => state.open, onCancel };
}

describe('Popconfirm', () => {
  it('alertdialog 以标题为名称、说明为描述；取消在确认之前且自动聚焦', async () => {
    const { panel } = await render(() => {});
    const title = document.getElementById(panel.getAttribute('aria-labelledby')!)!;
    expect(title.textContent).toBe('删除这条记录？');
    const description = document.getElementById(panel.getAttribute('aria-describedby')!)!;
    expect(description.textContent).toBe('删除后无法恢复');
    const buttons = [...panel.querySelectorAll('button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['取消', '删除']);
    expect(buttons[0]!.hasAttribute('autofocus')).toBe(true);
  });

  it('确认返回 Promise：等它完成再关闭，不算取消', async () => {
    let finish!: () => void;
    const { button, isOpen, onCancel } = await render(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    button('删除').click();
    await flush();
    expect(isOpen()).toBe(true);
    expect(button('取消').disabled).toBe(true);
    finish();
    await flush();
    expect(isOpen()).toBe(false);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('确认返回 false 或失败时保持打开；点取消关闭并报告 onCancel', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const refuse = await render(() => false);
    refuse.button('删除').click();
    await flush();
    expect(refuse.isOpen()).toBe(true);

    const failing = await render(() => Promise.reject(new Error('网络错误')));
    failing.button('删除').click();
    await flush();
    expect(failing.isOpen()).toBe(true);
    expect(error).toHaveBeenCalled();
    error.mockRestore();

    failing.button('取消').click();
    await flush();
    expect(failing.isOpen()).toBe(false);
    expect(failing.onCancel).toHaveBeenCalledTimes(1);
  });
});
