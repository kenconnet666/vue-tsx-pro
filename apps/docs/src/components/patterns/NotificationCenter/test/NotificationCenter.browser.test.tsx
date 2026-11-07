// NotificationList、NotificationCenter 的键盘操作：没有 href 的通知是按钮，Enter、Space 都是点它（标为已读）；铃铛的面板 Esc 关闭、焦点回到铃铛
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import TopBar from '../demo/TopBar';
import Widget from '../demo/Widget';

it('没有 href 的通知：Enter、Space 标为已读', async () => {
  const root = mount(Widget);
  const items = () => [...root.querySelectorAll<HTMLElement>('li > [role="button"]')];
  expect(items()).toHaveLength(3);
  items()[0]!.focus();
  await userEvent.keyboard('{Enter}');
  // 示例在 onRead 里把已读的拿掉
  await expect.poll(() => items().length).toBe(2);
  items()[0]!.focus();
  await userEvent.keyboard(' ');
  await expect.poll(() => items().length).toBe(1);
});

it('铃铛打开面板，Tab 进到通知；Esc 关闭，焦点回到铃铛', async () => {
  const root = mount(TopBar);
  const bell = root.querySelector<HTMLElement>('button[aria-haspopup]')!;
  bell.focus();
  await userEvent.keyboard('{Enter}');
  await expect.poll(() => document.querySelector(':popover-open')).not.toBeNull();
  const panel = document.querySelector(':popover-open')!;
  await userEvent.keyboard('{Tab}');
  expect(panel.contains(document.activeElement)).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => document.querySelector(':popover-open')).toBeNull();
  expect(document.activeElement).toBe(bell);
});
