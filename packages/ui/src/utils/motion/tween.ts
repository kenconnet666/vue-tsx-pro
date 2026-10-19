/**
 * 跟随数值的过渡（对标 Svelte 5 的 Tween / Spring）：read 的结果变化时，current 从当前值过渡到新值。
 *
 *   const shown = useTween(() => value, { duration: 'lg' });   // 渲染里读 shown.current
 *   const scale = useSpring(() => (pressed ? 0.95 : 1));
 *
 * 用 Anime.js 驱动一个普通对象，逐帧写进 shallowRef；时长、缓动、弹簧取主题（useAnimate），
 * 减少动态效果时当场到位。过渡中目标又变了，从当时的值接着过渡到新目标。
 */
import { computed, shallowRef, watch } from 'vue';
import { useAnimate, type ThemeTransitionOptions } from './animation';

/** useTween / useSpring 的返回值 */
export interface Tweened {
  /** 当前值：过渡中逐帧变化，响应式 */
  readonly current: number;
  /** 目标值：read 的最新结果 */
  readonly target: number;
}

/** useTween 的选项 */
export interface TweenOptions {
  /** 时长档位，默认 md */
  duration?: ThemeTransitionOptions['duration'];
  /** 缓动曲线，默认 standard */
  ease?: ThemeTransitionOptions['ease'];
  /** 挂载时从这个值过渡到第一个目标；不给时第一个目标直接显示 */
  from?: number;
}

/** useSpring 的选项 */
export interface SpringOptions {
  /** 回弹程度（0 不回弹，越大越弹，建议不超过 0.5），默认 0.25 */
  bounce?: number;
  /** 弹簧的感知时长档位，默认 md */
  duration?: ThemeTransitionOptions['duration'];
  /** 挂载时从这个值过渡到第一个目标；不给时第一个目标直接显示 */
  from?: number;
}

/** 数值变化时按主题时长与缓动过渡（在 setup 里调用） */
export function useTween(read: () => number, { from, ...transition }: TweenOptions = {}): Tweened {
  return useTweened(read, from, transition);
}

/** 数值变化时用弹簧过渡（在 setup 里调用） */
export function useSpring(
  read: () => number,
  { from, bounce = 0.25, duration }: SpringOptions = {},
): Tweened {
  return useTweened(read, from, { bounce, duration });
}

function useTweened(
  read: () => number,
  from: number | undefined,
  transition: ThemeTransitionOptions,
): Tweened {
  const animate = useAnimate();
  const target = computed(read);
  // Anime.js 改的是这个普通对象，每帧再同步给响应式的 current
  const state = { value: from ?? target.value };
  const current = shallowRef(state.value);
  watch(
    target,
    (value) => {
      void animate(state, { value, onUpdate: () => (current.value = state.value) }, transition);
    },
    { immediate: from != null },
  );
  return {
    get current() {
      return current.value;
    },
    get target() {
      return target.value;
    },
  };
}
