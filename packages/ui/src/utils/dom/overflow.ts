/**
 * 一行放不下时折起后面的项：量出容器放得下前几项，其余收进“+N”（或“更多”菜单）。
 * Select / TreeSelect 的 maxTagCount、Tabs 溢出、横向导航、工具栏都用它。参考 rc-overflow（Ant Design）的做法：
 * 所有项都渲染，放不下的移出排版、藏起来但仍可测量，宽度变了、项数变了就重新算。
 *
 *   const overflow = useOverflowItems({ container: () => row, count: () => tags.length });
 *   <div ref={row} style="display: flex; gap: 4px">
 *     {tags.map((tag, index) => <Tag {...overflow.itemProps(index)}>{tag}</Tag>)}
 *     <Tag {...overflow.restProps()}>+{overflow.hidden}</Tag>
 *   </div>
 *
 * - 容器是一行（flex、不换行、position: relative）；项与“+N”都是它的直接子元素，间距取容器的 column-gap。
 *   itemProps、restProps 里有 style（藏起来时），与项自己的 style 一起用 mergeAttrs 合并。
 * - 藏起来的项：绝对定位、visibility: hidden、aria-hidden 与 inert，不占位、读屏与 Tab 都跳过。
 *   “+N”在没有折起的项时同样藏起来（仍要量它的宽度，决定最后一项放不放得下）。
 * - 宽度在下一次布局时读（batchLayout，与别的组件的读取合在一次布局里）；量不到布局（服务端、测试环境）时全部显示。
 */
import { shallowRef, watch } from 'vue';
import { batchLayout } from './layout-batch';
import { useResizeObserver } from './resize';
import { isHTMLElement } from './element';

/** useOverflowItems 的选项 */
export interface OverflowItemsOptions {
  /** 一行的容器（元素或组件实例） */
  container: () => unknown;
  /** 项数 */
  count: () => number;
  /** 至少显示几项（再窄也不折起），默认 0 */
  min?: () => number;
  /** 同一行里还要给别的东西留出的宽度（px），如 TagsInput 的输入框，默认 0 */
  reserve?: () => number;
}

/** useOverflowItems 的返回值 */
export interface OverflowItems {
  /** 显示前几项 */
  readonly visible: number;
  /** 折起了几项（count − visible） */
  readonly hidden: number;
  /** 第 index 项的属性：展开到项的根元素上 */
  itemProps(index: number): Record<string, unknown>;
  /** “+N”的属性：展开到它的根元素上 */
  restProps(): Record<string, unknown>;
}

/** 藏起来但仍可测量：移出排版、不可见，读屏与 Tab 跳过 */
const MEASURE_ONLY = {
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
  insetInlineStart: 0,
  insetBlockStart: 0,
} as const;

/** 量出一行放得下几项（在 setup 里调用） */
export function useOverflowItems(options: OverflowItemsOptions): OverflowItems {
  const visible = shallowRef(Number.POSITIVE_INFINITY);
  const container = () => {
    const value = options.container();
    return isHTMLElement(value) ? value : null;
  };

  function measure() {
    batchLayout(() => {
      const root = container();
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>(':scope > [data-overflow-item]')];
      const rest = root.querySelector<HTMLElement>(':scope > [data-overflow-rest]');
      const style = getComputedStyle(root);
      const available =
        root.clientWidth -
        (parseFloat(style.paddingInlineStart) || 0) -
        (parseFloat(style.paddingInlineEnd) || 0) -
        (options.reserve?.() ?? 0);
      const gap = parseFloat(style.columnGap) || 0;
      const widths = items.map((item) => item.getBoundingClientRect().width);
      const restWidth = rest?.getBoundingClientRect().width ?? 0;
      // 量不到布局：全部显示
      if (available <= 0 && widths.every((width) => width === 0)) {
        return () => (visible.value = Number.POSITIVE_INFINITY);
      }
      const fit = fitCount(widths, restWidth, gap, available);
      const next = Math.max(fit, Math.min(options.min?.() ?? 0, widths.length));
      return () => (visible.value = next);
    });
  }

  useResizeObserver(() => {
    const root = container();
    if (!root) return [];
    return [root, ...root.querySelectorAll<HTMLElement>(':scope > [data-overflow-item]')];
  }, measure);
  // 挂载后量一次；项数变了、留出的宽度变了：新的项渲染后重新量
  watch(() => [options.count(), options.reserve?.(), options.min?.()], measure, {
    immediate: true,
    flush: 'post',
  });

  const shown = () => Math.min(visible.value, options.count());
  return {
    get visible() {
      return shown();
    },
    get hidden() {
      return options.count() - shown();
    },
    itemProps: (index) =>
      index < shown()
        ? { 'data-overflow-item': index }
        : { 'data-overflow-item': index, 'aria-hidden': 'true', inert: true, style: MEASURE_ONLY },
    restProps: () =>
      shown() < options.count()
        ? { 'data-overflow-rest': '' }
        : { 'data-overflow-rest': '', 'aria-hidden': 'true', inert: true, style: MEASURE_ONLY },
  };
}

/**
 * 前几项放得下：都放得下时不需要“+N”；否则在留出“+N”的宽度后尽量多放
 * （widths 是各项的宽度，gap 是项之间的间距）
 */
export function fitCount(
  widths: readonly number[],
  restWidth: number,
  gap: number,
  available: number,
): number {
  const total = widths.reduce((sum, width, index) => sum + width + (index ? gap : 0), 0);
  if (total <= available) return widths.length;
  let used = restWidth;
  let count = 0;
  for (const width of widths) {
    const next = used + gap + width;
    if (next > available) break;
    used = next;
    count++;
  }
  return count;
}
