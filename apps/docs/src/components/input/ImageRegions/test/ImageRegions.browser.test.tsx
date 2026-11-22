// ImageRegions 在真实浏览器里：图片加载后放进视口（小图放大），拖把手改大小按整像素，键盘挪选中的框，拖空白处平移不改框
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  ImageRegions,
  type ImageRegion,
  type ImageRegionChange,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';

const SHEET = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect width="64" height="32" fill="#5b9bd5"/></svg>')}`;

function setup() {
  let regions = _state<ImageRegion[]>([
    { id: 'a', label: '甲', x: 0, y: 0, width: 16, height: 16 },
    { id: 'b', label: '乙', x: 32, y: 0, width: 16, height: 16 },
  ]);
  let selected = _state<string | null>('a');
  const ends: ImageRegion[] = [];
  const root = mount(
    _component(() => () => (
      <div style={{ width: '640px', height: '320px', display: 'flex' }}>
        <ImageRegions
          src={SHEET}
          regions={regions}
          _selected={selected}
          style={{ flexGrow: 1 }}
          onRegionChange={(next: ImageRegion, { phase }: ImageRegionChange) => {
            regions = regions.map((region) => (region.id === next.id ? next : region));
            if (phase === 'end') ends.push(next);
          }}
          aria-label="精灵"
        />
      </div>
    )),
  );
  return { root, ends, regions: () => regions };
}

it('小图加载后放大到装下；拖右下角的把手改大小，按整像素、松开记一次', async () => {
  await page.viewport(900, 700);
  const { root, ends, regions } = setup();
  await expect.poll(() => root.querySelectorAll('[data-part="handle"]').length).toBe(8);
  const frame = root
    .querySelector<SVGRectElement>('[data-state="selected"]')!
    .getBoundingClientRect();
  // 64 × 32 的图在 640 × 320 的视口里放大了好几倍：16 像素的框在屏幕上远大于 16 px
  expect(frame.width).toBeGreaterThan(60);
  // 缩放比例按整张图（svg 没有描边）算；等一帧，适配视口的缩放已经落定
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const scale = root.querySelector('svg')!.getBoundingClientRect().width / 64;
  const grip = root.querySelector<SVGRectElement>('[data-grip="se"]')!;
  const box = grip.getBoundingClientRect();
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const at = (type: string, dx: number, dy: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: x + dx,
      clientY: y + dy,
    });
  // 往右下拖 4 × 2 个图片像素（再多零点二个像素，看取整）
  grip.dispatchEvent(at('pointerdown', 0, 0));
  grip.dispatchEvent(at('pointermove', scale * 2, scale));
  grip.dispatchEvent(at('pointermove', scale * 4.2, scale * 2.2));
  grip.dispatchEvent(at('pointerup', scale * 4.2, scale * 2.2));
  await expect.poll(() => ends.length).toBeGreaterThan(0);
  const a = regions().find((region) => region.id === 'a')!;
  expect(Number.isInteger(a.width) && Number.isInteger(a.height)).toBe(true);
  expect([a.width, a.height]).toEqual([20, 18]);
});

it('键盘：Tab 到视口，方向键挪选中的框，Alt + 方向键改宽', async () => {
  await page.viewport(900, 700);
  const { root, regions } = setup();
  await expect.poll(() => root.querySelectorAll('[data-part="handle"]').length).toBe(8);
  root.querySelector<HTMLElement>('[role="group"]')!.focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}{Shift>}{ArrowDown}{/Shift}');
  expect(regions()[0]).toMatchObject({ x: 2, y: 10, width: 16 });
  await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
  expect(regions()[0]).toMatchObject({ x: 2, width: 17 });
});
