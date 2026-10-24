// Card 的装饰效果：外层定位的 div 接住未声明的属性，光层对读屏隐藏；倾斜跟随指针、减少动态效果时不倾斜；
// 聚光两层光随指针亮起、离开后熄灭；流光一条光带
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { Card } from '../Card';

afterEach(() => vi.unstubAllGlobals());

/** 让元素有尺寸，并在上面移动指针 */
function movePointer(element: HTMLElement, x: number, y: number) {
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }) as DOMRect;
  element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
}

describe('Card 的 effect', () => {
  it('没有效果时只有卡片一层；有效果时外层接住属性，卡片在里面，光层对读屏隐藏', () => {
    const plain = mount(() => <Card class="card">内容</Card>);
    expect(plain.querySelector('.card > span')).toBeNull();
    const root = mount(() => (
      <Card class="card" effect="tilt" loading>
        <button>内容</button>
      </Card>
    ));
    const frame = root.querySelector<HTMLElement>('.card')!;
    expect(frame.getAttribute('aria-busy')).toBe('true');
    expect(frame.firstElementChild!.tagName).toBe('DIV');
    const layer = frame.querySelector(':scope > span')!;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
  });

  it('tilt：指针移动时倾斜（读不到主题时长时直接到位），离开后回正；减少动态效果时不倾斜', async () => {
    const root = mount(() => <Card class="card" effect="tilt" />);
    const frame = root.querySelector<HTMLElement>('.card')!;
    movePointer(frame, 200, 50);
    await nextTick();
    expect(styleTextOf(frame)).toContain('rotateY(10deg)');
    movePointer(frame, 500, 500);
    await nextTick();
    expect(styleTextOf(frame)).toContain('rotateY(0deg)');

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    }));
    const reduced = mount(() => <Card class="card" effect="tilt" />).querySelector<HTMLElement>(
      '.card',
    )!;
    movePointer(reduced, 200, 50);
    await nextTick();
    expect(styleTextOf(reduced)).toContain('rotateY(0deg)');
  });

  it('spotlight：表面与边框两层光，指针进入时亮起、离开后熄灭', async () => {
    const root = mount(() => <Card class="card" effect="spotlight" />);
    const frame = root.querySelector<HTMLElement>('.card')!;
    const layers = frame.querySelectorAll(':scope > span');
    expect(layers).toHaveLength(2);
    movePointer(frame, 40, 30);
    await nextTick();
    // 位置是百分比：40 / 200、30 / 100
    expect(styleTextOf(layers[0]!)).toContain('20% 30%');
    expect(styleTextOf(layers[0]!)).toMatch(/opacity: ?1/);
    movePointer(frame, 500, 500);
    await nextTick();
    expect(styleTextOf(layers[0]!)).toMatch(/opacity: ?0/);
  });

  it('beam：边框一圈里一条光带，路径跟着卡片的圆角；propsEffect 落在光层上', () => {
    const root = mount(() => (
      <Card class="card" effect="beam" radius="sm" propsEffect={{ class: 'light' }} />
    ));
    const layer = root.querySelector<HTMLElement>('.card > .light')!;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(styleTextOf(layer.querySelector('span')!)).toContain('rect(0 auto auto 0 round');
  });
});
