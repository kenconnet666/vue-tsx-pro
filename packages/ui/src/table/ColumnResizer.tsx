/**
 * 列宽调整手柄：表头单元格结束边的 ResizeHandle，名称取语言包（调整“列名”的列宽），最小宽度默认 COLUMN_MIN_WIDTH。
 * 宽度从所在单元格量起，所以要放在 th 里；DataTableView 的可调整列都用它。
 *
 *   <th>…<ColumnResizer label="金额" width={widths.amount} onWidthChange={(px) => …} /></th>
 */
import { _component } from '@vue-tsx-pro/tsx';
import { useLang } from '../config/context';
import {
  ResizeHandle,
  type ResizeHandleManaged,
  type ResizeHandleProps,
} from '../layout/ResizeHandle';
import { COLUMN_MIN_WIDTH } from './columns';

/** 分隔条的角色、可聚焦、名称与取值由组件管理 */
export type ColumnResizerManaged = ResizeHandleManaged | 'aria-label';

/** 未声明的属性落到手柄（span）上 */
export interface ColumnResizerProps extends Omit<ResizeHandleProps, 'aria-label'> {
  /** 列名：手柄的无障碍名称取语言包（调整“列名”的列宽） */
  label: string;
  /** 拖动或用键盘调整了宽度 */
  onWidthChange: (width: number) => void;
}

/** 列宽调整手柄：拖动或用 ← / → 调整所在列的宽度 */
export const ColumnResizer = _component(
  ({ label, minWidth = COLUMN_MIN_WIDTH, onWidthChange, ...rest }: ColumnResizerProps) => {
    const lang = useLang();
    return () => (
      <ResizeHandle
        {...rest}
        minWidth={minWidth}
        onWidthChange={onWidthChange}
        aria-label={lang.tableResizeColumn(label)}
      />
    );
  },
);
