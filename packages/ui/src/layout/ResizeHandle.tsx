/**
 * 宽度调整手柄：所在元素结束边（edge="start" 时是起始边，如从右侧滑入的抽屉）的一条细线（role="separator"），悬停、聚焦时显示。
 * 拖动（startMove）或聚焦后用 ← / →（WCAG 2.5.7 拖动的替代操作）调整，从右到左排版下方向自动镜像；
 * 双击回到 defaultWidth。宽度从父元素量起，所以要放在要调整的那个元素里（它需要 position: relative 或 fixed）。
 * orientation="horizontal" 时是一条横线，贴着父元素的下边（edge="start" 时是上边，如从底部升起的抽屉），
 * 拖动或用 ↑ / ↓ 调整的是**高度**：width、minWidth、maxWidth、defaultWidth、onWidthChange 这时都指高度。
 * AppShell 的抽屉式侧栏、DataTable 的列宽（ColumnResizer）都用它。
 *
 *   <aside style="position: relative; width: …">…<ResizeHandle aria-label="调整侧栏宽度" width={width} onWidthChange={(px) => (width = px)} /></aside>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { clamp } from '../utils/data/number';
import { inlineArrows, isRtl } from '../utils/dom/direction';
import { startMove } from '../utils/dom/move';
import { useResizeObserver } from '../utils/dom/resize';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 分隔条的角色、可聚焦与取值由组件管理 */
export type ResizeHandleManaged =
  'role' | 'tabindex' | 'aria-orientation' | 'aria-valuenow' | 'aria-valuemin' | 'aria-valuemax';

/** 未声明的属性落到手柄（span）上；无障碍名称写 aria-label */
export interface ResizeHandleProps extends PartProps<'span', ResizeHandleManaged> {
  /** 当前宽度（px）；没有时从父元素的实际宽度起算 */
  width?: number;
  /** 最小宽度（px），默认 64 */
  minWidth?: number;
  /** 最大宽度（px），默认不限 */
  maxWidth?: number;
  /** 双击回到的宽度（px）；不写时双击不做什么 */
  defaultWidth?: number;
  /** 键盘每按一次调整多少（px），默认 16 */
  step?: number;
  /** 手柄在父元素的哪一边，默认 end；start 时往起始方向拖是变宽（从结束边滑入的抽屉）；horizontal 时 start 是上边、end 是下边 */
  edge?: 'start' | 'end';
  /** vertical（默认）：竖线，调整宽度；horizontal：横线，调整高度（见文件开头） */
  orientation?: 'vertical' | 'horizontal';
  /** 拖动或用键盘调整了宽度（已经夹在最小、最大宽度之间） */
  onWidthChange: (width: number) => void;
}

/** ResizeHandle 的样式：贴着父元素结束边的细线 */
export const resizeHandleStyles = css.create({
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    insetInlineEnd: 0,
    width: '_space.sm',
    cursor: 'col-resize',
    touchAction: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': '_borderStrong',
      ':focus-visible': '_accent',
    },
    outlineStyle: 'none',
  },
  start: { insetInlineEnd: 'auto', insetInlineStart: 0 },
  // 横线：贴着父元素的下边（start 时是上边），调整高度
  horizontal: {
    top: 'auto',
    bottom: 0,
    insetInlineStart: 0,
    insetInlineEnd: 0,
    width: 'auto',
    height: '_space.sm',
    cursor: 'row-resize',
  },
  horizontalStart: { top: 0, bottom: 'auto' },
});

/** 宽度调整手柄：拖动或用 ← / → 调整父元素的宽度；orientation="horizontal" 时调整高度（↑ / ↓） */
export const ResizeHandle = _component(
  ({
    width,
    minWidth = 64,
    maxWidth = Number.POSITIVE_INFINITY,
    defaultWidth,
    step = 16,
    edge = 'end',
    orientation = 'vertical',
    onWidthChange,
    ...rest
  }: ResizeHandleProps) => {
    const horizontal = () => orientation === 'horizontal';
    const parentOf = (event: Event) => (event.currentTarget as HTMLElement).parentElement!;
    const sizeOf = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return horizontal() ? rect.height : rect.width;
    };
    const fit = (px: number) => Math.round(clamp(px, minWidth, maxWidth));
    // 没给 width 时量父元素的实际宽度：可聚焦的分隔条必须有当前值（aria-valuenow）
    let handle = _state.raw<HTMLElement | null>(null);
    let measured = _state<number | undefined>(undefined);
    useResizeObserver(
      () => (width == null ? handle?.parentElement : null),
      () => {
        const parent = handle?.parentElement;
        if (parent) measured = Math.round(sizeOf(parent));
      },
    );

    function onPointerdown(event: PointerEvent) {
      const parent = parentOf(event);
      const from = sizeOf(parent);
      // 起始边的手柄往起始方向拖是变宽：方向与结束边相反；横线不受从右到左排版的影响
      const sign = (horizontal() ? 1 : isRtl(parent) ? -1 : 1) * (edge === 'start' ? -1 : 1);
      event.preventDefault();
      startMove(event, {
        onMove: ({ deltaX, deltaY }) =>
          onWidthChange(fit(from + sign * (horizontal() ? deltaY : deltaX))),
      });
    }

    function onKeydown(event: KeyboardEvent) {
      const parent = parentOf(event);
      const { forward, backward } = horizontal()
        ? { forward: 'ArrowDown', backward: 'ArrowUp' }
        : inlineArrows(isRtl(parent));
      const delta =
        (event.key === forward ? step : event.key === backward ? -step : 0) *
        (edge === 'start' ? -1 : 1);
      if (!delta) return;
      event.preventDefault();
      onWidthChange(fit((width ?? sizeOf(parent)) + delta));
    }

    return () => (
      <span
        {...mergeAttrs<'span'>(
          {
            sx: [
              resizeHandleStyles.handle,
              horizontal()
                ? [
                    resizeHandleStyles.horizontal,
                    edge === 'start' && resizeHandleStyles.horizontalStart,
                  ]
                : edge === 'start' && resizeHandleStyles.start,
            ],
          },
          rest,
          {
            ref: (element: unknown) => (handle = element instanceof HTMLElement ? element : null),
            role: 'separator',
            tabindex: 0,
            'aria-orientation': orientation,
            'aria-valuenow': width ?? measured ?? minWidth,
            'aria-valuemin': minWidth,
            'aria-valuemax': Number.isFinite(maxWidth) ? maxWidth : undefined,
            onPointerdown,
            onKeydown,
            onDblclick: defaultWidth == null ? undefined : () => onWidthChange(fit(defaultWidth)),
          },
        )}
      />
    );
  },
);
