// 测试用：在 H5 里派发触摸事件，以及换掉宿主的测量（happy-dom 不排版，量出来都是 0）
import { defineComponent, provide, type VNodeChild } from 'vue';
import { HOST_KEY, webHost, type HostRect } from '../host';

/** 派发一次触摸（touches 与 changedTouches 都是这一个点） */
export function touch(target: Element, type: string, x: number, y: number) {
  const point = { identifier: 0, clientX: x, clientY: y, pageX: x, pageY: y, target };
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { touches: type === 'touchend' ? [] : [point], changedTouches: [point] });
  target.dispatchEvent(event);
  return event;
}

/** 从 from 拖到 to：按下、分几步移动、松手 */
export function swipe(target: Element, from: [number, number], to: [number, number], steps = 4) {
  touch(target, 'touchstart', ...from);
  for (let step = 1; step <= steps; step++)
    touch(
      target,
      'touchmove',
      from[0] + ((to[0] - from[0]) * step) / steps,
      from[1] + ((to[1] - from[1]) * step) / steps,
    );
  touch(target, 'touchend', ...to);
}

/** 宿主的测量换成固定的大小，包住 children */
export const FixedMeasure = defineComponent(
  (props: { rect: Partial<HostRect>; scrollTop?: number }, { slots }) => {
    provide(HOST_KEY, {
      ...webHost,
      measure: async () => ({ top: 0, left: 0, width: 0, height: 0, ...props.rect }),
      scrollTop: () => props.scrollTop ?? 0,
    });
    return () => slots.default?.() as VNodeChild;
  },
  { props: ['rect', 'scrollTop'] },
);
