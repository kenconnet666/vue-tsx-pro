/**
 * 宽度调整手柄：所在元素结束边的一条细线（role="separator"），悬停、聚焦时显示。
 * 拖动（startMove）或聚焦后用 ← / →（WCAG 2.5.7 拖动的替代操作）调整，从右到左排版下方向自动镜像；
 * 双击回到 defaultWidth。宽度从父元素量起，所以要放在要调整的那个元素里（它需要 position: relative 或 fixed）。
 * AppShell 的抽屉式侧栏、DataTable 的列宽（ColumnResizer）都用它。
 *
 *   <aside style="position: relative; width: …">…<ResizeHandle aria-label="调整侧栏宽度" width={width} onWidthChange={(px) => (width = px)} /></aside>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { isRtl } from '../utils/dom/direction';
import { startMove } from '../utils/dom/move';
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
  /** 拖动或用键盘调整了宽度（已经夹在最小、最大宽度之间） */
  onWidthChange: (width: number) => void;
}

/** ResizeHandle 的样式：贴着父元素结束边的细线 */
export const resizeHandleStyles = stylex.create({
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
});

/** 宽度调整手柄：拖动或用 ← / → 调整父元素的宽度 */
export const ResizeHandle = _component(
  ({
    width,
    minWidth = 64,
    maxWidth = Number.POSITIVE_INFINITY,
    defaultWidth,
    step = 16,
    onWidthChange,
    ...rest
  }: ResizeHandleProps) => {
    const parentOf = (event: Event) => (event.currentTarget as HTMLElement).parentElement!;
    const clamp = (px: number) => Math.round(Math.min(maxWidth, Math.max(minWidth, px)));

    function onPointerdown(event: PointerEvent) {
      const parent = parentOf(event);
      const from = parent.getBoundingClientRect().width;
      const rtl = isRtl(parent);
      event.preventDefault();
      startMove(event, {
        onMove: ({ deltaX }) => onWidthChange(clamp(from + (rtl ? -deltaX : deltaX))),
      });
    }

    function onKeydown(event: KeyboardEvent) {
      const parent = parentOf(event);
      const forward = isRtl(parent) ? 'ArrowLeft' : 'ArrowRight';
      const backward = isRtl(parent) ? 'ArrowRight' : 'ArrowLeft';
      const delta = event.key === forward ? step : event.key === backward ? -step : 0;
      if (!delta) return;
      event.preventDefault();
      onWidthChange(clamp((width ?? parent.getBoundingClientRect().width) + delta));
    }

    return () => (
      <span
        {...mergeAttrs<'span'>({ sx: resizeHandleStyles.handle }, rest, {
          role: 'separator',
          tabindex: 0,
          'aria-orientation': 'vertical',
          'aria-valuenow': width,
          'aria-valuemin': minWidth,
          'aria-valuemax': Number.isFinite(maxWidth) ? maxWidth : undefined,
          onPointerdown,
          onKeydown,
          onDblclick: defaultWidth == null ? undefined : () => onWidthChange(clamp(defaultWidth)),
        })}
      />
    );
  },
);
