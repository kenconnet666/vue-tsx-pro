// onOpenChange 的原因：Dialog 的关闭按钮、确认、Esc，父级改 open 时不通知；beforeClose 拿到原因；
// Popover 的触发器与 light dismiss；Menu 执行一项；useDialog 的句柄（content 拿到句柄、update、close、closed）
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import type { OpenChangeDetails } from '../../utils/dom/open-change';
import { mount } from '../../utils/.test/mount';
import { Dialog, useDialog, type DialogApi } from '../Dialog';
import { Menu, MenuItem } from '../Menu';
import { Popover } from '../Popover';

const flush = async () => {
  for (let i = 0; i < 6; i++) await nextTick();
};

// happy-dom 没有 popover API
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const reasons = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls.map(([open, details]) => `${open}:${details.reason}`);

describe('Dialog 的 onOpenChange', () => {
  it('关闭按钮是 close、确认是 confirm、Esc 是 escape；父级改 open 不通知', async () => {
    let open = _state(true);
    const onOpenChange = vi.fn();
    const root = mount(() => (
      <Dialog _open={_bind(open)} title="编辑" onOpenChange={onOpenChange} onConfirm={() => {}}>
        正文
      </Dialog>
    ));
    await flush();
    const dialog = root.querySelector('dialog')!;
    dialog.querySelector<HTMLButtonElement>('button[aria-label="关闭"]')!.click();
    await flush();
    expect(open).toBe(false);

    open = true;
    await flush();
    [...dialog.querySelectorAll('button')].find((b) => b.textContent === '确定')!.click();
    await flush();

    open = true;
    await flush();
    dialog.dispatchEvent(new Event('cancel'));
    dialog.close();
    await flush();

    open = true;
    await flush();
    open = false;
    await flush();
    expect(reasons(onOpenChange)).toEqual(['false:close', 'false:confirm', 'false:escape']);
  });

  it('beforeClose 拿到原因：返回 false 时不关', async () => {
    let open = _state(true);
    const beforeClose = vi.fn((_details: OpenChangeDetails) => false);
    const root = mount(() => (
      <Dialog _open={_bind(open)} title="编辑" beforeClose={beforeClose}>
        正文
      </Dialog>
    ));
    await flush();
    root.querySelector<HTMLButtonElement>('button[aria-label="关闭"]')!.click();
    await flush();
    expect(open).toBe(true);
    expect(beforeClose.mock.calls[0]![0].reason).toBe('close');
  });
});

describe('Popover 与 Menu 的 onOpenChange', () => {
  it('Popover：点触发器是 trigger，浏览器关掉（点外面）是 outside', async () => {
    const onOpenChange = vi.fn();
    const root = mount(() => (
      <Popover onOpenChange={onOpenChange} trigger={(props) => <button {...props}>筛选</button>}>
        内容
      </Popover>
    ));
    root.querySelector('button')!.click();
    await flush();
    const panel = root.querySelector<HTMLElement>('[popover]')!;
    panel.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
    await flush();
    expect(reasons(onOpenChange)).toEqual(['true:trigger', 'false:outside']);
  });

  it('Menu：执行一项是 select', async () => {
    const onOpenChange = vi.fn();
    const root = mount(() => (
      <Menu _open onOpenChange={onOpenChange} trigger={(props) => <button {...props}>操作</button>}>
        <MenuItem onAction={() => {}}>重命名</MenuItem>
      </Menu>
    ));
    await flush();
    root.querySelector<HTMLElement>('[role="menuitem"]')!.click();
    await flush();
    expect(reasons(onOpenChange)).toEqual(['false:select']);
  });
});

describe('useDialog', () => {
  function setup() {
    let api!: DialogApi;
    mount(() =>
      h(
        defineComponent({
          setup() {
            api = useDialog();
            return () => null;
          },
        }),
      ),
    );
    return () => api;
  }

  it('open 渲染对话框，content 拿到句柄；update 改标题；close 关上，closed 得到 imperative', async () => {
    const dialog = setup();
    const onOpenChange = vi.fn();
    const handle = dialog().open({
      title: '订单详情',
      onOpenChange,
      content: (self) => <button onClick={() => self.update({ title: '已发货' })}>标记发货</button>,
    });
    await flush();
    const element = document.querySelector<HTMLDialogElement>('dialog')!;
    expect(element.textContent).toContain('订单详情');
    element.querySelector<HTMLButtonElement>('button:not([aria-label])')!.click();
    await flush();
    expect(element.querySelector('h2')!.textContent).toBe('已发货');
    handle.close();
    await flush();
    expect(await handle.closed).toBe('imperative');
    expect(reasons(onOpenChange)).toEqual(['true:imperative', 'false:imperative']);
  });

  it('用户点确认关上：closed 得到 confirm', async () => {
    const dialog = setup();
    const handle = dialog().open({ title: '提交审批？', onConfirm: () => {} });
    await flush();
    const element = [...document.querySelectorAll<HTMLDialogElement>('dialog')].at(-1)!;
    [...element.querySelectorAll('button')].find((b) => b.textContent === '确定')!.click();
    await flush();
    expect(await handle.closed).toBe('confirm');
  });
});
