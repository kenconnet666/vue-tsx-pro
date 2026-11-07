// SignaturePad 在真实浏览器里：拖一笔后值是 PNG，撤销回到 null；只读时拖动不写；导出 SVG 有路径
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { SignaturePad, type SignaturePadHandle } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { nextTick } from 'vue';
import { mount } from '../../../../test/mount';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function stroke(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const at = (x: number, y: number, type: string) =>
    new PointerEvent(type, {
      clientX: rect.left + x,
      clientY: rect.top + y,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
  canvas.dispatchEvent(at(20, 40, 'pointerdown'));
  for (let step = 1; step <= 12; step++) {
    canvas.dispatchEvent(at(20 + step * 15, 40 + Math.sin(step) * 20, 'pointermove'));
    await nextFrame();
  }
  canvas.dispatchEvent(at(200, 40, 'pointerup'));
  await nextTick();
}

it('写一笔：值变成 PNG，SVG 有路径；撤销回到 null', async () => {
  await page.viewport(900, 700);
  let read!: () => string | null;
  let pad!: SignaturePadHandle;
  const root = mount(
    _component(() => {
      let signature = _state<string | null>(null);
      read = () => signature;
      return () => (
        <SignaturePad _value={signature} handle={(handle) => (pad = handle)} aria-label="签名" />
      );
    }),
  );
  const canvas = root.querySelector('canvas')!;
  expect(canvas.getAttribute('role')).toBe('img');
  await stroke(canvas);
  await expect.poll(() => read()).toMatch(/^data:image\/png;base64,/);
  expect(pad.toSvg()).toContain('<path');
  root.querySelector<HTMLButtonElement>('button[aria-label="撤销上一笔"]')!.click();
  await expect.poll(() => read()).toBeNull();
});

it('只读：拖动不写，显示“未签名”', async () => {
  await page.viewport(900, 700);
  let pad!: SignaturePadHandle;
  const root = mount(
    _component(() => () => (
      <SignaturePad readonly handle={(handle) => (pad = handle)} aria-label="签名" />
    )),
  );
  await stroke(root.querySelector('canvas')!);
  expect(pad.toPng()).toBeNull();
  expect(root.textContent).toContain('未签名');
  expect(root.querySelector('button')).toBeNull();
});
