// Watermark：包着内容加一层不挡操作、读屏不念的平铺层；canvas 画好后作为背景；fullscreen 不包内容时只渲染那一层
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { hasStyles, mount } from '../../utils/.test/mount';
import { Watermark, watermarkStyles } from '../Watermark';

// happy-dom 没有 canvas 绘图：给一个记录调用的假 2d 上下文
const drawn: string[] = [];
beforeEach(() => {
  drawn.length = 0;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    font: '',
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
    scale() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    measureText: (text: string) => ({ width: text.length * 10 }),
    fillText: (text: string) => drawn.push(text),
    drawImage() {},
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
    () => `data:image/png;base64,${drawn.join('|')}`,
  );
});
afterEach(() => vi.restoreAllMocks());

const flush = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

describe('Watermark', () => {
  it('内容在下、水印层在上：aria-hidden、不挡点击；多行文字逐行画出', async () => {
    const root = mount(() => (
      <Watermark content={['林小满', '2026-10-24']}>
        <p>报表</p>
      </Watermark>
    ));
    await flush();
    const layer = root.querySelector<HTMLElement>('[data-watermark]')!;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(hasStyles(layer, watermarkStyles.layer)).toBe(true);
    expect(layer.previousElementSibling?.textContent).toBe('报表');
    // 平铺单元里斜对角各画一份
    expect(drawn).toEqual(['林小满', '2026-10-24', '林小满', '2026-10-24']);
  });

  it('内容变了重新画', async () => {
    let text = _state('内部资料');
    const root = mount(() => <Watermark content={text} />);
    await flush();
    expect(drawn).toEqual(['内部资料', '内部资料']);
    text = '机密';
    await flush();
    expect(drawn.at(-1)).toBe('机密');
    expect(root.querySelector('[data-watermark]')).not.toBeNull();
  });

  it('fullscreen 且不包内容：只渲染固定定位的那一层', async () => {
    const root = mount(() => <Watermark content="内部资料" fullscreen />);
    await flush();
    const layer = root.firstElementChild as HTMLElement;
    expect(layer.hasAttribute('data-watermark')).toBe(true);
    expect(hasStyles(layer, watermarkStyles.fullscreen)).toBe(true);
  });
});
