/**
 * 跟着当前项走的指示条：Tabs 的下划线、ToggleGroup 的选中滑块。
 *
 *   useActiveIndicator(() => ({
 *     container: list, indicator, active: '[aria-selected="true"]', axis: 'horizontal', value: tabs.value,
 *   }));
 *
 * 量出当前项相对容器的位置写到指示条上（transform 与宽高）：value 变化时滑过去（取主题时长），
 * 挂载时与尺寸变化（字体加载、容器变宽）时直接对齐；axis 变了先清掉旧的内联样式。
 * 指示条按当前项的 offsetLeft / offsetTop 定位，容器要是它的定位容器（position: relative）。
 */
import { utils, type AnimationParams } from 'animejs';
import { onMounted, onScopeDispose, watch } from 'vue';
import { useResizeObserver } from '../dom/resize';
import { useAnimate } from './animation';

/** 指示条沿哪个方向跟随 */
export interface IndicatorAxes {
  /** 横排：写 x 与宽度（下划线） */
  horizontal: unknown;
  /** 竖排：写 y 与高度（竖排的侧边线） */
  vertical: unknown;
  /** 两个方向：写 x、y 与宽高，盖住整个当前项（选中滑块） */
  both: unknown;
}

/** useActiveIndicator 每次读取的选项 */
export interface ActiveIndicatorOptions {
  /** 各项所在的容器（指示条的定位容器）；还没挂载时为 null */
  container: HTMLElement | null;
  /** 指示条元素；不显示时为 null */
  indicator: HTMLElement | null;
  /** 在容器里找当前项的选择器 */
  active: string;
  /** 跟随方向 */
  axis: keyof IndicatorAxes;
  /** 当前选中的值：变化时滑到新的当前项 */
  value: unknown;
}

/** 指示条跟着当前项（在 setup 里调用） */
export function useActiveIndicator(read: () => ActiveIndicatorOptions): void {
  const animate = useAnimate();

  function place(animated: boolean) {
    const { container, indicator, active, axis } = read();
    const item = container?.querySelector<HTMLElement>(active);
    if (!indicator || !item) return;
    const x = axis === 'vertical' ? 0 : item.offsetLeft;
    const y = axis === 'horizontal' ? 0 : item.offsetTop;
    const target: AnimationParams = { x, y };
    if (axis !== 'vertical') target.width = item.offsetWidth;
    if (axis !== 'horizontal') target.height = item.offsetHeight;
    if (animated) void animate(indicator, target);
    else void utils.set(indicator, target);
  }

  onMounted(() => place(false));
  watch(
    () => read().value,
    () => place(true),
    { flush: 'post' },
  );
  // 换了方向（或指示条重新渲染）：横排时写的宽度、竖排时写的高度不再适用，清掉后重新对齐
  watch(
    // 分开的两个来源：read 里别的字段（如 value）变化时不触发
    [() => read().axis, () => read().indicator],
    ([, indicator]) => {
      for (const property of ['width', 'height', 'transform'])
        indicator?.style.removeProperty(property);
      place(false);
    },
    { flush: 'post' },
  );
  // 各项的位置会随字体加载、容器变宽而变：下一帧直接对齐（不在 ResizeObserver 回调里同步改样式）
  let frame = 0;
  useResizeObserver(
    () => read().container,
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => place(false));
    },
  );
  onScopeDispose(() => cancelAnimationFrame(frame));
}
