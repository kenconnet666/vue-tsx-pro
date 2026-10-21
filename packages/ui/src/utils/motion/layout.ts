/**
 * 布局动画（FLIP）：改数据前记下子元素的位置，DOM 更新后从旧位置过渡到新位置（Anime.js 的 createLayout）。
 *
 *   const layout = useLayoutAnimation(() => list, { children: '[data-item]' });
 *   layout.change(() => items.splice(index, 1));   // 其余项平移补位，新项淡入
 *
 * 时长、缓动取主题；减少动态效果（时长为 0）时只改数据，不记录也不播。
 * 被 Vue 移除的元素直接消失：离场动画交给 usePresence，这里只管其余元素的位移。
 */
import { createLayout, type AutoLayout } from 'animejs';
import { nextTick, onScopeDispose } from 'vue';
import { toElement } from '../dom/element';
import { themeTransitionOrInstant, type ThemeTransitionOptions } from './animation';

/** useLayoutAnimation 的选项 */
export interface LayoutAnimationOptions {
  /** 参与动画的子元素（选择器），默认容器的所有后代 */
  children?: string;
  /** 时长档位，默认 md */
  duration?: ThemeTransitionOptions['duration'];
  /** 缓动曲线，默认 standard */
  ease?: ThemeTransitionOptions['ease'];
}

/** useLayoutAnimation 的返回值 */
export interface LayoutAnimation {
  /** 记下位置 → 调用 mutate 改数据 → 等 DOM 更新后过渡到新位置；动画结束时完成 */
  change(mutate: () => void): Promise<void>;
}

/** 容器里的子元素换位置时平移过去（在 setup 里调用）；container 读取容器（元素或组件实例），没挂载时为 null */
export function useLayoutAnimation(
  container: () => unknown,
  { children, duration, ease }: LayoutAnimationOptions = {},
): LayoutAnimation {
  let layout: AutoLayout | undefined;
  onScopeDispose(() => layout?.revert());

  return {
    async change(mutate) {
      const root = toElement(container());
      const timing = root ? themeTransitionOrInstant(root, { duration, ease }) : { duration: 0 };
      if (!root || !timing.duration) {
        mutate();
        await nextTick();
        return;
      }
      // 容器换了（重新挂载）时重建
      if (layout?.root !== root) {
        layout?.revert();
        layout = createLayout(root, children ? { children } : {});
      }
      layout.record();
      mutate();
      await nextTick();
      await layout.animate(timing);
    },
  };
}
