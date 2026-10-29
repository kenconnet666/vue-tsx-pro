// 测试用：在 H5 里派发触摸事件，以及换掉宿主的能力（happy-dom 不排版，量出来都是 0；选图要弹系统界面）
import { defineComponent, provide, type VNodeChild } from 'vue';
import { HOST_KEY, webHost, type Host, type HostRect } from '../host';

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

/** 换掉宿主的部分能力（测量、滚动位置、选图），包住 children */
export const WithHost = defineComponent(
  (props: { host: Partial<Host> }, { slots }) => {
    provide(HOST_KEY, { ...webHost, ...props.host });
    return () => slots.default?.() as VNodeChild;
  },
  { props: ['host'] },
);

/** 测量总是给出这个大小（缺的项是 0） */
export const measureAs =
  (rect: Partial<HostRect>): Host['measure'] =>
  async () => ({ top: 0, left: 0, width: 0, height: 0, ...rect });
