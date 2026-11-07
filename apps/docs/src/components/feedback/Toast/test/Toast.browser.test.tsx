// 通知（ToastItem）的键盘：焦点在通知里（关闭按钮、操作）时 Esc 关掉这一条
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Basic from '../demo/Basic';

it('焦点在通知里时 Esc 关掉它', async () => {
  const root = mount(Basic);
  const show = [...root.querySelectorAll('button')].find((button) =>
    button.textContent?.includes('已保存'),
  )!;
  await userEvent.click(show);
  const item = () =>
    [...document.querySelectorAll<HTMLElement>('[role="status"], li')].find((element) =>
      element.textContent?.includes('改动已同步到所有设备'),
    );
  await expect.poll(item).toBeTruthy();
  item()!.querySelector<HTMLElement>('button')!.focus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(item).toBeUndefined();
});
