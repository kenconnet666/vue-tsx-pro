/**
 * 布局动画（FLIP）：改数据前记下子元素的位置，DOM 更新后从旧位置过渡到新位置。
 *
 *   const layout = useLayoutAnimation(() => list, { children: '[data-item]' });
 *   layout.change(() => items.splice(index, 1));   // 其余项平移补位，新项淡入
 *
 * 时长、缓动取主题；减少动态效果（时长为 0）时只改数据，不记录也不播。
 * 被 Vue 移除的元素直接消失：离场动画交给 usePresence，这里只管其余元素的位移。
 * 只做平移，不做尺寸过渡；元素上已有内联 transform（正被拖动、滑动）时不参与，免得互相覆盖。
 *
 * 用原生的 Element.animate：不写内联样式，播完不用清理，元素自己的 CSS 过渡也不受影响。
 */
import { nextTick, onScopeDispose } from 'vue';
import { readToken } from '../../config/theme/theme';
import { easings } from '../../config/theme/tokens';
import { toElement } from '../dom/element';
import { themeTransitionOrInstant, type ThemeTransitionOptions } from './animation';

/** useLayoutAnimation 的选项 */
export interface LayoutAnimationOptions {
  /** 参与动画的子元素（选择器），默认容器的直接子元素 */
  children?: string;
  /** 时长档位，默认 md */
  duration?: ThemeTransitionOptions['duration'];
  /** 缓动曲线，默认 standard */
  ease?: ThemeTransitionOptions['ease'];
}

/** useLayoutAnimation 的返回值 */
export interface LayoutAnimation {
  /** 记下位置 → 调用 mutate 改数据 → 等 DOM 更新后过渡到新位置；动画结束（或被下一次 change 接管）时完成 */
  change(mutate: () => void): Promise<void>;
}

/** 容器里的子元素换位置时平移过去（在 setup 里调用）；container 读取容器（元素或组件实例），没挂载时为 null */
export function useLayoutAnimation(
  container: () => unknown,
  { children, duration, ease = 'standard' }: LayoutAnimationOptions = {},
): LayoutAnimation {
  const running = new Set<Animation>();
  const cancelRunning = () => {
    for (const animation of running) animation.cancel();
    running.clear();
  };
  onScopeDispose(cancelRunning);

  const items = (root: Element) =>
    [...(children ? root.querySelectorAll(children) : root.children)] as HTMLElement[];

  return {
    async change(mutate) {
      const root = toElement(container());
      const timing = root ? themeTransitionOrInstant(root, { duration, ease }) : { duration: 0 };
      if (!root || !timing.duration) {
        mutate();
        await nextTick();
        return;
      }
      // 旧位置含上一轮还在跑的位移：中途再变时从眼前的位置接着走
      const before = new Map(items(root).map((item) => [item, item.getBoundingClientRect()]));
      mutate();
      await nextTick();

      cancelRunning();
      // 先量完再动：动画开始后量到的不是布局位置
      const changes = items(root)
        .filter((item) => !item.style.transform)
        .map((item) => {
          const old = before.get(item);
          if (!old) return { item, keyframes: { opacity: [0, 1] } };
          const rect = item.getBoundingClientRect();
          const x = old.left - rect.left;
          const y = old.top - rect.top;
          return {
            item,
            keyframes: x || y ? { transform: [`translate(${x}px, ${y}px)`, 'none'] } : null,
          };
        });
      const options = { duration: timing.duration, easing: readToken(root, easings[ease]) };
      const started: Animation[] = [];
      for (const { item, keyframes } of changes) {
        if (keyframes) started.push(item.animate(keyframes, options));
      }
      for (const animation of started) running.add(animation);
      // 被下一次 change 或卸载取消时 finished 会拒绝，同样算完成
      await Promise.allSettled(started.map((animation) => animation.finished));
      for (const animation of started) running.delete(animation);
    },
  };
}
