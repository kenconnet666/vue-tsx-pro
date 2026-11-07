// 图片预览（Lightbox）的键盘：←→ 切换相册里的图（loop 时到头接着另一头），Esc 关闭、焦点回到点开的那张
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Gallery from '../demo/Gallery';

it('←→ 切换，Esc 关闭并把焦点还回去', async () => {
  const root = mount(Gallery);
  const triggers = [...root.querySelectorAll<HTMLElement>('button[aria-label]')];
  expect(triggers.length).toBeGreaterThan(1);
  await userEvent.click(triggers[0]!);
  await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
  const dialog = document.querySelector('dialog[open]')!;
  const caption = () => dialog.querySelector('figcaption')?.textContent ?? dialog.textContent;
  const first = caption();
  await userEvent.keyboard('{ArrowRight}');
  await expect.poll(caption).not.toBe(first);
  await userEvent.keyboard('{ArrowLeft}');
  await expect.poll(caption).toBe(first);
  // loop：第一张往回是最后一张
  await userEvent.keyboard('{ArrowLeft}');
  await expect.poll(caption).not.toBe(first);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => document.querySelector('dialog[open]')).toBeNull();
  expect(document.activeElement).toBe(triggers[0]);
});
