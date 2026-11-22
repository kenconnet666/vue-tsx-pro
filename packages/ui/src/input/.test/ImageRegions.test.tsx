// ImageRegions：图片加载后画出各区域，点框选中，键盘挪、改大小，只读时不改，锚点、控制器
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import {
  createImageRegionsController,
  ImageRegions,
  type ImageRegion,
  type ImageRegionChange,
} from '../ImageRegions';

const regions: ImageRegion[] = [
  { id: 'a', label: '甲', x: 0, y: 0, width: 16, height: 16, anchor: { x: 8, y: 16 } },
  { id: 'b', label: '乙', x: 16, y: 0, width: 16, height: 16 },
];

/** 装上组件并让图片“加载好”（happy-dom 不加载图片：给出原始尺寸，手动发 load） */
async function setup(props: Record<string, unknown> = {}) {
  const changes: [ImageRegion, ImageRegionChange][] = [];
  let selected = _state<string | null>(null);
  const root = mount(() => (
    <ImageRegions
      src="sheet.png"
      regions={regions}
      _selected={selected}
      onRegionChange={(region: ImageRegion, change: ImageRegionChange) =>
        changes.push([region, change])
      }
      aria-label="精灵"
      {...props}
    />
  ));
  const image = root.querySelector('img')!;
  Object.defineProperty(image, 'naturalWidth', { value: 64 });
  Object.defineProperty(image, 'naturalHeight', { value: 32 });
  image.dispatchEvent(new Event('load'));
  await nextTick();
  const viewport = root.querySelector<HTMLElement>('[role="group"]')!;
  const key = async (name: string, options: KeyboardEventInit = {}) => {
    viewport.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options }),
    );
    await nextTick();
  };
  return { root, viewport, changes, key, selected: () => selected };
}

describe('ImageRegions', () => {
  it('图片加载后按原始尺寸画出各区域；按下一个框就选中它，选中的带八个把手', async () => {
    const { root, selected } = await setup();
    const frames = root.querySelectorAll<SVGRectElement>('[data-part="region"]');
    expect(frames).toHaveLength(2);
    expect(root.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 64 32');
    expect(root.querySelectorAll('[data-part="handle"]')).toHaveLength(0);
    frames[1]!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    await nextTick();
    expect(selected()).toBe('b');
    expect(root.querySelectorAll('[data-part="handle"]')).toHaveLength(8);
    expect(root.querySelector('[data-state="selected"]')!.querySelector('title')!.textContent).toBe(
      '乙',
    );
  });

  it('方向键挪选中的框（Shift 十格，锚点跟着走），Alt + 方向键改宽高，都是一次 end', async () => {
    const { root, changes, key } = await setup({ anchors: true });
    root
      .querySelector('[data-part="region"]')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    await nextTick();
    expect(root.querySelector('[data-part="anchor"]')).not.toBeNull();
    await key('ArrowRight');
    await key('ArrowDown', { shiftKey: true });
    await key('ArrowRight', { altKey: true });
    expect(changes).toEqual([
      [{ ...regions[0], x: 1, anchor: { x: 9, y: 16 } }, { phase: 'end' }],
      [{ ...regions[0], y: 10, anchor: { x: 8, y: 26 } }, { phase: 'end' }],
      [{ ...regions[0], width: 17 }, { phase: 'end' }],
    ]);
  });

  it('snap 取整、minSize 限最小；只读时能选不能改', async () => {
    const snapped = await setup({ snap: 4, _selected: 'a' });
    await snapped.key('ArrowLeft', { altKey: true });
    expect(snapped.changes[0]![0]).toMatchObject({ width: 12 });
    const locked = await setup({ readonly: true });
    locked.root
      .querySelector('[data-part="region"]')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    await nextTick();
    await locked.key('ArrowRight');
    expect(locked.selected()).toBe('a');
    expect(locked.changes).toEqual([]);
    expect(locked.root.querySelectorAll('[data-part="handle"]')).toHaveLength(0);
  });

  it('控制器挂上组件的命令，卸载前一直能调', async () => {
    const view = createImageRegionsController();
    await setup({ controller: view });
    expect(() => {
      view.fit();
      view.zoomIn();
      view.zoomOut();
    }).not.toThrow();
  });
});
