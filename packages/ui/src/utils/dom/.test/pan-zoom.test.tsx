// usePanZoom：以指针为中心缩放、拖动平移、键盘、滚轮的两种模式、限制平移与 fit；zoomAround、clampPan 的计算
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import { mount } from '../../.test/mount';
import { clampPan, usePanZoom, zoomAround, type PanZoom, type PanZoomOptions } from '../pan-zoom';

describe('计算', () => {
  it('zoomAround：中心下的内容点缩放前后不动', () => {
    const next = zoomAround({ x: 10, y: 20, scale: 1 }, 2, { x: 50, y: 50 });
    // 缩放前 (50, 50) 下的内容点是 (40, 30)，缩放后仍在 (50, 50)
    expect(next).toEqual({ x: -30, y: -10, scale: 2 });
    expect(40 * next.scale + next.x).toBe(50);
  });
  it('clampPan：内容比视口大时不露空白，比视口小时居中', () => {
    const view = { width: 100, height: 100 };
    expect(clampPan({ x: 30, y: -500, scale: 2 }, view, { width: 100, height: 100 })).toEqual({
      x: 0,
      y: -100,
      scale: 2,
    });
    expect(clampPan({ x: 30, y: 0, scale: 1 }, view, { width: 50, height: 100 })).toEqual({
      x: 25,
      y: 0,
      scale: 1,
    });
  });
});

function render(options: Partial<PanZoomOptions> = {}) {
  const box = shallowRef<HTMLElement | null>(null);
  let view!: PanZoom;
  const host = mount(() =>
    h(
      defineComponent({
        setup() {
          view = usePanZoom({ viewport: () => box.value, ...options });
          return () =>
            h('div', { ref: box, tabindex: 0, ...view.viewportProps }, [
              h('img', { style: { transform: view.transform } }),
            ]);
        },
      }),
    ),
  );
  const element = host.firstElementChild as HTMLElement;
  return { element, view: () => view };
}

// happy-dom 的 WheelEvent 不带 clientX、clientY、ctrlKey：补上
const wheel = (init: WheelEventInit) => {
  const event = new WheelEvent('wheel', init);
  for (const key of ['clientX', 'clientY', 'ctrlKey'] as const)
    Object.defineProperty(event, key, { value: init[key] ?? (key === 'ctrlKey' ? false : 0) });
  return event;
};

const pointer = (type: string, x: number, y: number) =>
  new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, button: 0, bubbles: true });

describe('usePanZoom', () => {
  it('滚轮缩放（以指针为中心）；pan 模式下滚轮平移，按住 Ctrl 才缩放', async () => {
    const zoom = render();
    const pan = render({ wheel: 'pan' });
    // 滚轮监听在挂载后的更新里绑上
    await nextTick();
    zoom.element.dispatchEvent(wheel({ deltaY: -100, clientX: 0, clientY: 0 }));
    expect(zoom.view().scale).toBeGreaterThan(1);
    expect(zoom.view().x).toBe(0);

    pan.element.dispatchEvent(wheel({ deltaX: 10, deltaY: 30 }));
    expect(pan.view()).toMatchObject({ x: -10, y: -30, scale: 1 });
    pan.element.dispatchEvent(wheel({ deltaY: 100, ctrlKey: true }));
    expect(pan.view().scale).toBeLessThan(1);
  });

  it('拖动平移；键盘 + / − / 0 与方向键；缩放限制在 min–max', async () => {
    const { element, view } = render({ max: 2 });
    element.dispatchEvent(pointer('pointerdown', 10, 10));
    element.dispatchEvent(pointer('pointermove', 40, 30));
    element.dispatchEvent(pointer('pointerup', 40, 30));
    expect(view()).toMatchObject({ x: 30, y: 20 });
    await nextTick();
    expect(element.querySelector('img')!.style.transform).toBe('translate(30px, 20px) scale(1)');

    const key = (name: string) =>
      element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    key('ArrowLeft');
    expect(view().x).toBe(70);
    for (let i = 0; i < 10; i++) key('+');
    expect(view().scale).toBe(2);
    key('-');
    expect(view().scale).toBe(1.6);
    key('0');
    expect(view()).toMatchObject({ x: 0, y: 0, scale: 1 });
  });

  it('双击放大，再双击回到初始；fit 把内容整个放进视口', () => {
    const { element, view } = render();
    element.dispatchEvent(new MouseEvent('dblclick', { clientX: 0, clientY: 0, bubbles: true }));
    expect(view().scale).toBeCloseTo(1.5625);
    element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(view().scale).toBe(1);
    Object.defineProperty(element, 'clientWidth', { value: 200 });
    Object.defineProperty(element, 'clientHeight', { value: 100 });
    expect(view().fit({ width: 400, height: 100 })).toBe(0.5);
    expect(view()).toMatchObject({ x: 0, y: 25, scale: 0.5 });
    // 内容不从原点开始：平移把它的左上角挪进来
    expect(view().fit({ x: 100, y: -40, width: 100, height: 50 }, 10)).toBe(1);
    expect(view()).toMatchObject({ x: -50, y: 65, scale: 1 });
  });

  it('filter 挑掉的事件不处理：按住 Shift 拖动、按键都不平移', async () => {
    const { element, view } = render({ wheel: 'pan', filter: (event) => !event.shiftKey });
    await nextTick();
    element.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 0,
        clientY: 0,
        pointerId: 1,
        button: 0,
        shiftKey: true,
        bubbles: true,
      }),
    );
    element.dispatchEvent(pointer('pointermove', 50, 40));
    element.dispatchEvent(pointer('pointerup', 50, 40));
    expect(view()).toMatchObject({ x: 0, y: 0 });
    element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true }),
    );
    expect(view().x).toBe(0);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(view().x).toBe(40);
  });
});
