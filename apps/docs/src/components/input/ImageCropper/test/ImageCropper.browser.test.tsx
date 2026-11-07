// ImageCropper 在真实浏览器里：一开始盖满裁剪框（缩小按钮不可用）；输出指定大小；圆形时四角透明；滚轮缩小不到盖不满
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { ImageCropper, type ImageCropperHandle } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import { drawings } from '../../../display/Image/demo/drawings';

function setup(shape: 'rect' | 'round' = 'rect') {
  let cropper!: ImageCropperHandle;
  const root = mount(
    _component(() => () => (
      <ImageCropper
        src={drawings[0]!.src}
        shape={shape}
        handle={(handle) => (cropper = handle)}
        aria-label="裁剪"
      />
    )),
  );
  return { root, cropper: () => cropper };
}

const alphaAt = (canvas: HTMLCanvasElement, x: number, y: number) =>
  canvas.getContext('2d')!.getImageData(x, y, 1, 1).data[3];

it('盖满裁剪框；输出指定大小，矩形四角不透明', async () => {
  await page.viewport(900, 700);
  const { root, cropper } = setup();
  await expect.poll(() => cropper().toCanvas() !== null).toBe(true);
  const zoomOut = root.querySelector<HTMLButtonElement>('button[aria-label="缩小"]')!;
  expect(zoomOut.disabled).toBe(true);
  const canvas = cropper().toCanvas({ width: 200 })!;
  expect([canvas.width, canvas.height]).toEqual([200, 200]);
  expect(alphaAt(canvas, 1, 1)).toBe(255);
  const file = await cropper().toFile('a.png');
  expect(file?.type).toBe('image/png');
});

it('圆形：四角透明、中间不透明；滚轮缩小也停在盖满', async () => {
  await page.viewport(900, 700);
  const { root, cropper } = setup('round');
  await expect.poll(() => cropper().toCanvas() !== null).toBe(true);
  const canvas = cropper().toCanvas({ width: 100 })!;
  expect(alphaAt(canvas, 1, 1)).toBe(0);
  expect(alphaAt(canvas, 50, 50)).toBe(255);
  const viewport = root.querySelector<HTMLElement>('[role="group"]')!;
  const before = cropper().toCanvas()!.width;
  viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 500, bubbles: true, cancelable: true }));
  expect(cropper().toCanvas()!.width).toBe(before);
});
