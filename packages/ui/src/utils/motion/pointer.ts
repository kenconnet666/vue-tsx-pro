/**
 * 指针相对元素的位置（-1 到 1，向上为正，与 WebGL 的坐标一致），用弹簧（useSpring）做阻尼跟随。
 * 3D 效果（着色器的 uPointer）与倾斜卡片、聚光卡片共用：
 *
 *   const pointer = usePointer(() => host);
 *   uniforms.uPointer.value.set(pointer.x, pointer.y);    // 每帧读
 *   const left = (pointer.x + 1) * 50;                    // 换成 CSS 的百分比位置
 *   repel *= pointer.strength;                            // 指针离开元素时淡出
 *
 * 监听整个窗口：背景效果通常在内容下面，指针落在上层的文字、按钮上时也要跟随。
 * 减少动态效果时弹簧的时长为 0，位置直接到位（效果自己决定要不要停下交互）。
 */
import { onScopeDispose, shallowRef } from 'vue';
import { useSpring, type SpringOptions } from './tween';

/** usePointer 的返回值 */
export interface PointerState {
  /** 横向位置：元素左边 -1，右边 1（阻尼后） */
  readonly x: number;
  /** 纵向位置：元素底边 -1，顶边 1（阻尼后） */
  readonly y: number;
  /** 指针在元素上时趋向 1，离开后趋向 0（阻尼后） */
  readonly strength: number;
}

/** usePointer 的选项 */
export type PointerOptions = Pick<SpringOptions, 'bounce' | 'duration'>;

/** 指针相对 scope 元素的阻尼位置（在 setup 里调用） */
export function usePointer(
  scope: () => Element | null | undefined,
  { bounce = 0, duration = 'xl' }: PointerOptions = {},
): PointerState {
  const target = shallowRef({ x: 0, y: 0, inside: false });
  const spring = { bounce, duration, scope };
  const x = useSpring(() => target.value.x, spring);
  const y = useSpring(() => target.value.y, spring);
  const strength = useSpring(() => (target.value.inside ? 1 : 0), spring);

  if (typeof window !== 'undefined') {
    const onMove = (event: PointerEvent) => {
      const rect = scope()?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      // 离开元素时保持最后的位置，只让 strength 淡出：效果不会一下子跳回中心
      if (!inside) {
        if (target.value.inside) target.value = { ...target.value, inside };
        return;
      }
      target.value = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: 1 - ((event.clientY - rect.top) / rect.height) * 2,
        inside,
      };
    };
    const onLeave = () => (target.value = { ...target.value, inside: false });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    onScopeDispose(() => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    });
  }

  return {
    get x() {
      return x.current;
    },
    get y() {
      return y.current;
    },
    get strength() {
      return strength.current;
    },
  };
}
