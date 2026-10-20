// 不依赖 WebGL 的效果：倾斜卡片、聚光卡片、流光边框的结构、无障碍与指针交互
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { BorderBeam } from '../BorderBeam';
import { SpotlightCard } from '../SpotlightCard';
import { TiltCard } from '../TiltCard';

afterEach(() => vi.unstubAllGlobals());

/** 让元素有尺寸，并在上面移动指针 */
function movePointer(element: HTMLElement, x: number, y: number) {
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }) as DOMRect;
  element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
}

describe('TiltCard', () => {
  it('包住内容；高光层对读屏隐藏', () => {
    const root = mount(() => (
      <TiltCard class="tilt">
        <button>内容</button>
      </TiltCard>
    ));
    const tilt = root.querySelector<HTMLElement>('.tilt')!;
    expect(tilt.querySelector('button')).not.toBeNull();
    expect(tilt.querySelector('span')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('指针移动时倾斜（读不到主题时长时直接到位），离开后回正', async () => {
    const root = mount(() => <TiltCard class="tilt" maxTilt={10} />);
    const tilt = root.querySelector<HTMLElement>('.tilt')!;
    movePointer(tilt, 200, 50);
    await nextTick();
    expect(tilt.getAttribute('style')).toContain('rotateY(10deg)');
    // 指针移出卡片（监听的是整个窗口）
    movePointer(tilt, 500, 500);
    await nextTick();
    expect(tilt.getAttribute('style')).toContain('rotateY(0deg)');
  });

  it('disabled、减少动态效果时不倾斜', async () => {
    const root = mount(() => <TiltCard class="tilt" disabled glare={false} />);
    const tilt = root.querySelector<HTMLElement>('.tilt')!;
    expect(tilt.dataset.disabled).toBe('true');
    expect(tilt.querySelector('span')).toBeNull();
    movePointer(tilt, 200, 50);
    await nextTick();
    expect(tilt.getAttribute('style')).toContain('rotateY(0deg)');

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    }));
    const reduced = mount(() => <TiltCard class="tilt" />).querySelector<HTMLElement>('.tilt')!;
    movePointer(reduced, 200, 50);
    await nextTick();
    expect(reduced.getAttribute('style')).toContain('rotateY(0deg)');
  });
});

describe('SpotlightCard', () => {
  it('表面与边框两层光，对读屏隐藏；指针进入时亮起、离开后熄灭', async () => {
    const root = mount(() => <SpotlightCard class="spot">内容</SpotlightCard>);
    const spot = root.querySelector<HTMLElement>('.spot')!;
    const layers = spot.querySelectorAll('span');
    expect(layers).toHaveLength(2);
    for (const layer of layers) expect(layer.getAttribute('aria-hidden')).toBe('true');
    movePointer(spot, 40, 30);
    await nextTick();
    // 位置是百分比：40 / 200、30 / 100
    expect(layers[0]!.getAttribute('style')).toContain('20% 30%');
    expect(layers[0]!.getAttribute('style')).toMatch(/opacity: ?1/);
    movePointer(spot, 500, 500);
    await nextTick();
    expect(layers[0]!.getAttribute('style')).toMatch(/opacity: ?0/);
  });

  it('border 关掉时只有表面的光', () => {
    const root = mount(() => <SpotlightCard class="spot" border={false} />);
    expect(root.querySelectorAll('.spot span')).toHaveLength(1);
  });
});

describe('BorderBeam', () => {
  it('整个对读屏隐藏；光带带上时长与延迟', () => {
    const root = mount(() => <BorderBeam class="beam" duration={4} delay={1} />);
    const beam = root.querySelector<HTMLElement>('.beam')!;
    expect(beam.getAttribute('aria-hidden')).toBe('true');
    const style = beam.querySelector('span')!.getAttribute('style')!;
    expect(style).toContain('4s');
    expect(style).toContain('-1s');
  });
});
