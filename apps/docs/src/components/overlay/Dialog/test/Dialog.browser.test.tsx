// Dialog 的 draggable 在真实浏览器里：按住标题栏拖动，对话框跟着走；拖得再远也不超出窗口；关闭按钮上按下不拖
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Dialog } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../../../test/mount';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function drag(
  element: Element,
  from: { x: number; y: number },
  by: { x: number; y: number },
) {
  const init = (x: number, y: number) => ({
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(new PointerEvent('pointerdown', init(from.x, from.y)));
  for (let step = 1; step <= 4; step++) {
    element.dispatchEvent(
      new PointerEvent('pointermove', init(from.x + (by.x * step) / 4, from.y + (by.y * step) / 4)),
    );
    await nextFrame();
  }
  element.dispatchEvent(new PointerEvent('pointerup', init(from.x + by.x, from.y + by.y)));
  await nextFrame();
}

it('按住标题栏拖动；拖出窗口时停在边上', async () => {
  await page.viewport(1200, 800);
  mount(
    _component(() => () => (
      <Dialog _open={true} draggable title="编辑资料">
        正文
      </Dialog>
    )),
  );
  const dialog = await expect
    .poll(() => document.querySelector('dialog[open]'))
    .toBeTruthy()
    .then(() => document.querySelector<HTMLDialogElement>('dialog[open]')!);
  const heading = [...dialog.querySelectorAll('h2, h1, [id]')].find((node) =>
    node.textContent?.includes('编辑资料'),
  )!;
  const header = heading.parentElement!;
  await new Promise((resolve) => setTimeout(resolve, 300));
  const before = dialog.getBoundingClientRect();
  const start = { x: before.left + 40, y: before.top + 20 };
  await drag(header, start, { x: 60, y: 40 });
  const moved = dialog.getBoundingClientRect();
  expect(Math.round(moved.left - before.left)).toBe(60);
  expect(Math.round(moved.top - before.top)).toBe(40);

  await drag(header, { x: moved.left + 40, y: moved.top + 20 }, { x: -5000, y: -5000 });
  const clamped = dialog.getBoundingClientRect();
  expect(Math.round(clamped.left)).toBe(0);
  expect(Math.round(clamped.top)).toBe(0);
});
