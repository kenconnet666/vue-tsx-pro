/**
 * 列宽调整手柄：表头单元格结束边的一条细线（role="separator"），悬停、聚焦时显示。
 * 拖动（startMove）或聚焦后用 ← / →（WCAG 2.5.7 拖动的替代操作）调整，从右到左排版下方向自动镜像。
 * 宽度从所在单元格量起，所以要放在 th 里；TableView 的可调整列都用它。
 *
 *   <th>…<ColumnResizer label="金额" width={widths.amount} onWidthChange={(px) => …} /></th>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useLang } from '../config/context';
import { isRtl } from '../utils/dom/direction';
import { startMove } from '../utils/dom/move';
import { mergeAttrs, type PartProps } from '../utils/props';
import { COLUMN_MIN_WIDTH } from './columns';

/** 分隔条的角色、可聚焦与取值由组件管理 */
export type ColumnResizerManaged =
  'role' | 'tabindex' | 'aria-orientation' | 'aria-label' | 'aria-valuenow' | 'aria-valuemin';

/** 未声明的属性落到手柄（span）上 */
export interface ColumnResizerProps extends PartProps<'span', ColumnResizerManaged> {
  /** 列名：手柄的无障碍名称取语言包（调整“列名”的列宽） */
  label: string;
  /** 当前宽度（px）；没有时从所在单元格的实际宽度起算 */
  width?: number;
  /** 最小宽度（px），默认 COLUMN_MIN_WIDTH（64） */
  minWidth?: number;
  /** 键盘每按一次调整多少（px），默认 16 */
  step?: number;
  /** 拖动或用键盘调整了宽度 */
  onWidthChange: (width: number) => void;
}

/** 手柄的样式：贴着单元格结束边的细线 */
export const columnResizerStyles = stylex.create({
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

/** 列宽调整手柄：拖动或用 ← / → 调整所在列的宽度 */
export const ColumnResizer = _component(
  ({
    label,
    width,
    minWidth = COLUMN_MIN_WIDTH,
    step = 16,
    onWidthChange,
    ...rest
  }: ColumnResizerProps) => {
    const lang = useLang();
    const cellOf = (event: Event) => (event.currentTarget as HTMLElement).parentElement!;

    function onPointerdown(event: PointerEvent) {
      const cell = cellOf(event);
      const from = cell.getBoundingClientRect().width;
      const rtl = isRtl(cell);
      event.preventDefault();
      startMove(event, {
        onMove: ({ deltaX }) => onWidthChange(Math.max(minWidth, from + (rtl ? -deltaX : deltaX))),
      });
    }

    function onKeydown(event: KeyboardEvent) {
      const cell = cellOf(event);
      const forward = isRtl(cell) ? 'ArrowLeft' : 'ArrowRight';
      const backward = isRtl(cell) ? 'ArrowRight' : 'ArrowLeft';
      const delta = event.key === forward ? step : event.key === backward ? -step : 0;
      if (!delta) return;
      event.preventDefault();
      const from = width ?? cell.getBoundingClientRect().width;
      onWidthChange(Math.max(minWidth, from + delta));
    }

    return () => (
      <span
        {...mergeAttrs<'span'>({ sx: columnResizerStyles.handle }, rest, {
          role: 'separator',
          tabindex: 0,
          'aria-orientation': 'vertical',
          'aria-label': lang.tableResizeColumn(label),
          'aria-valuenow': width,
          'aria-valuemin': minWidth,
          onPointerdown,
          onKeydown,
        })}
      />
    );
  },
);
