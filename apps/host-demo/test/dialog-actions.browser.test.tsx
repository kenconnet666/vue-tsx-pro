// 对话框的 onConfirm（Dialog、Drawer、AlertDialog 共用）：等待时加载中、关不掉；返回 false 或失败时留着，成功才关
import { _component } from '@vue-tsx-pro/tsx';
import { createUi, Dialog } from '@vue-tsx-pro/ui';
import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, type App } from 'vue';

let app: App | undefined;
let root: HTMLElement;

afterEach(() => {
  app?.unmount();
  root.remove();
});

/** 每次确认的结果按顺序取：'false' 返回 false、'fail' 失败、'ok' 成功；都等 release() 才给出 */
function mountDialog(results: ('false' | 'fail' | 'ok')[]) {
  const calls: (() => void)[] = [];
  const Demo = _component(() => {
    let open = _state(true);
    const confirm = () =>
      new Promise<boolean | void>((resolve, reject) => {
        const result = results.shift();
        calls.push(() =>
          result === 'fail'
            ? reject(new Error('保存失败'))
            : resolve(result === 'false' ? false : undefined),
        );
      });
    return () => (
      <Dialog _open={_bind(open)} title="编辑资料" confirmText="保存" onConfirm={confirm}>
        正文
      </Dialog>
    );
  });
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(Demo);
  app.use(createUi());
  app.mount(root);
  const dialog = document.querySelector('dialog')!;
  const button = (text: string) =>
    [...dialog.querySelectorAll('button')].find((item) => item.textContent === text)!;
  return { dialog, button, release: () => calls.shift()!() };
}

describe('Dialog 的 onConfirm', () => {
  it('等待时确认按钮加载中，取消、关闭按钮不可用，Esc 关不掉；返回 false 时留着', async () => {
    const { dialog, button, release } = mountDialog(['false']);
    await expect.poll(() => dialog.open).toBe(true);
    await userEvent.click(button('保存'));
    await expect.poll(() => button('保存').getAttribute('aria-busy')).toBe('true');
    expect(button('取消').disabled).toBe(true);
    expect(dialog.querySelector<HTMLButtonElement>('button[aria-label="关闭"]')!.disabled).toBe(
      true,
    );
    await userEvent.keyboard('{Escape}');
    expect(dialog.open).toBe(true);
    release();
    await expect.poll(() => button('保存').getAttribute('aria-busy')).toBeNull();
    expect(dialog.open).toBe(true);
    expect(button('取消').disabled).toBe(false);
  });

  it('失败时留着、可以再试；成功后关闭', async () => {
    const { dialog, button, release } = mountDialog(['fail', 'ok']);
    await expect.poll(() => dialog.open).toBe(true);
    await userEvent.click(button('保存'));
    release();
    await expect.poll(() => button('保存').getAttribute('aria-busy')).toBeNull();
    expect(dialog.open).toBe(true);
    await userEvent.click(button('保存'));
    release();
    await expect.poll(() => dialog.open).toBe(false);
  });

  it('取消按钮关闭对话框', async () => {
    const { dialog, button } = mountDialog([]);
    await expect.poll(() => dialog.open).toBe(true);
    await userEvent.click(button('取消'));
    await expect.poll(() => dialog.open).toBe(false);
  });
});
