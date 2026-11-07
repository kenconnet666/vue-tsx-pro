// ColorPicker 在真实浏览器里：点色板跳过去；选预设后进最近使用；ColorField 点色块弹出取色器，拖动写回
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { ColorField, ColorPicker } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../../../test/mount';

const pointer = (type: string, x: number, y: number) =>
  new PointerEvent(type, {
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    bubbles: true,
    cancelable: true,
  });

it('点色板左下角是黑色；选预设后它进最近使用', async () => {
  await page.viewport(900, 700);
  let read!: () => string;
  const root = mount(
    _component(() => {
      let color = _state('#ff0000');
      read = () => color;
      return () => <ColorPicker _value={color} presets={['#12a594']} alpha={false} />;
    }),
  );
  const area = root.querySelector<HTMLElement>('[role="slider"]')!.parentElement!;
  const rect = area.getBoundingClientRect();
  area.dispatchEvent(pointer('pointerdown', rect.left + 1, rect.bottom - 1));
  area.dispatchEvent(pointer('pointerup', rect.left + 1, rect.bottom - 1));
  await expect.poll(() => read()).toMatch(/^#0[0-2]0[0-2]0[0-2]$/);
  root.querySelector<HTMLButtonElement>('[aria-label="#12a594"]')!.click();
  await expect.poll(() => read()).toBe('#12a594');
  const recent = root.querySelector('[role="group"][aria-label="最近使用"]')!;
  expect(recent.querySelector('[aria-label="#12a594"]')).not.toBeNull();
});

it('ColorField：点色块弹出取色器，在色板上按方向键写回', async () => {
  await page.viewport(900, 700);
  let read!: () => string;
  const root = mount(
    _component(() => {
      let color = _state('#3e63dd');
      read = () => color;
      return () => <ColorField _value={color} aria-label="品牌色" />;
    }),
  );
  root.querySelector<HTMLButtonElement>('button[aria-label="选择颜色"]')!.click();
  const thumb = await expect
    .poll(() => document.querySelector('[aria-label="饱和度与明度"]'))
    .toBeTruthy()
    .then(() => document.querySelector<HTMLElement>('[aria-label="饱和度与明度"]')!);
  thumb.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }),
  );
  await expect.poll(() => read()).not.toBe('#3e63dd');
  expect(root.querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe(read());
});
