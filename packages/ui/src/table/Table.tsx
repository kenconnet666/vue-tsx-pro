/**
 * 静态表格：原生 table 的各个元素各一个组件，内容直接写在 JSX 里（说明文字里的表格、props 表）。
 * 要排序、勾选、虚拟滚动、列宽调整的数据表格用 DataTable。
 *
 *   <Table aria-label="属性">
 *     <TableHead>
 *       <TableRow><TableHeaderCell>名称</TableHeaderCell><TableHeaderCell>说明</TableHeaderCell></TableRow>
 *     </TableHead>
 *     <TableBody>
 *       <TableRow><TableCell><Code>size</Code></TableCell><TableCell>尺寸档位</TableCell></TableRow>
 *     </TableBody>
 *   </Table>
 *
 * 外观（密度、样式、斑马纹）与 DataTable 相同，样式表也共用（dataTableStyles）；单元格默认可以换行，列宽按内容分配。
 * 表格比容器宽时在外层横向滚动，不撑宽页面。
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useDefaults } from '../config/defaults';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  dataTableDensityStyles,
  dataTableStyles,
  type DataTableDensities,
  type DataTableOptions,
  type DataTableVariants,
} from './DataTableView';

/** Table 交给各单元格与行的外观 */
export interface TableState {
  /** 密度 */
  readonly density: keyof DataTableDensities;
  /** 样式 */
  readonly variant: keyof DataTableVariants;
  /** 斑马纹 */
  readonly striped: boolean;
}

/** Table 的上下文：行与单元格据此取外观 */
export const TableContext = createContext<TableState>('Table');

/** 单元格的对齐 */
export interface TableAligns {
  /** 起始边（默认） */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 结束边：数字、金额 */
  end: unknown;
}

/** 不在 Table 里单独用行与单元格时的外观 */
const standalone: TableState = { density: 'standard', variant: 'surface', striped: false };

/** 未声明的属性落到 table 上；aria-label 或 TableCaption 是表格的名称 */
export interface TableProps extends PartProps<'table'>, DataTableOptions {
  /** 外层（横向滚动的容器）的部件属性 */
  propsRoot?: PartProps<'div'>;
  children?: VNodeChild;
}

/** 静态表格的样式：外层滚动容器、标题、列宽按内容、斑马纹（其余与 DataTable 共用 dataTableStyles） */
export const tableStyles = stylex.create({
  // contain: inline-size：宽表格不撑宽外层的 grid / flex 容器，放不下的在这里横向滚动
  root: { minWidth: 0, overflowX: 'auto', contain: 'inline-size' },
  caption: {
    captionSide: 'top',
    paddingBlock: '_sm',
    paddingInline: '_md',
    color: '_textMuted',
    fontSize: '_sm',
    textAlign: 'start',
  },
  // 列宽按内容分配：DataTable 为虚拟滚动与列宽拖动用固定布局，静态表格不需要
  layout: { tableLayout: 'auto' },
  stripedRow: { backgroundColor: { default: null, ':nth-child(even)': '_fill' } },
});

/** 静态表格（table）：外层可横向滚动；外观经上下文交给行与单元格 */
export const Table = _component(
  ({ density, variant, striped, propsRoot, children, ...rest }: TableProps) => {
    const appearance = useDefaults('Table', () => ({ density, variant, striped }), {
      density: 'standard',
      variant: 'surface',
      striped: false,
    });
    TableContext.provide({
      get density() {
        return appearance().density;
      },
      get variant() {
        return appearance().variant;
      },
      get striped() {
        return appearance().striped;
      },
    });
    return () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              tableStyles.root,
              appearance().variant === 'ghost' ? dataTableStyles.ghost : dataTableStyles.surface,
            ],
          },
          propsRoot,
        )}
      >
        <table
          {...mergeAttrs<'table'>(
            {
              sx: [
                dataTableStyles.table,
                tableStyles.layout,
                dataTableStyles[appearance().density],
              ],
            },
            rest,
          )}
        >
          {children}
        </table>
      </div>
    );
  },
);

/** 表格标题（caption）：同时是表格的名称；不想显示时包进 VisuallyHidden */
export const TableCaption = _component(
  ({ children, ...rest }: PartProps<'caption'> & { children?: VNodeChild }) =>
    () => (
      <caption {...mergeAttrs<'caption'>({ sx: tableStyles.caption }, rest)}>{children}</caption>
    ),
);

/** 表头（thead） */
export const TableHead = _component(
  ({ children, ...rest }: PartProps<'thead'> & { children?: VNodeChild }) =>
    () => <thead {...mergeAttrs<'thead'>({}, rest)}>{children}</thead>,
);

/** 表体（tbody） */
export const TableBody = _component(
  ({ children, ...rest }: PartProps<'tbody'> & { children?: VNodeChild }) =>
    () => <tbody {...mergeAttrs<'tbody'>({}, rest)}>{children}</tbody>,
);

/** 表尾（tfoot）：合计行 */
export const TableFoot = _component(
  ({ children, ...rest }: PartProps<'tfoot'> & { children?: VNodeChild }) =>
    () => <tfoot {...mergeAttrs<'tfoot'>({}, rest)}>{children}</tfoot>,
);

/** 行（tr）：底色随表格的样式，斑马纹时隔行浅色底 */
export const TableRow = _component(
  ({ children, ...rest }: PartProps<'tr'> & { children?: VNodeChild }) => {
    const table = TableContext.inject(standalone);
    return () => (
      <tr
        {...mergeAttrs<'tr'>(
          {
            sx: [
              table.variant === 'ghost' ? dataTableStyles.rowGhost : dataTableStyles.row,
              table.striped && tableStyles.stripedRow,
            ],
          },
          rest,
        )}
      >
        {children}
      </tr>
    );
  },
);

/** TableHeaderCell、TableCell 共有的属性 */
interface TableCellOptions {
  /** 对齐，默认 start；数字、金额用 end */
  align?: keyof TableAligns;
  /** 不换行（超出时省略号）；默认可以换行 */
  nowrap?: boolean;
  children?: VNodeChild;
}

/** 未声明的属性落到 th 上；原生的 align 属性已废弃，对齐用 align prop */
export interface TableHeaderCellProps extends PartProps<'th', 'align'>, TableCellOptions {
  /** 表头单元格对应的方向，默认 col（列标题）；行标题写 row */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
}

/** 未声明的属性落到 td 上；对齐用 align prop */
export interface TableCellProps extends PartProps<'td', 'align'>, TableCellOptions {}

/** 表头单元格（th） */
export const TableHeaderCell = _component(
  ({ align = 'start', nowrap = false, scope = 'col', children, ...rest }: TableHeaderCellProps) => {
    const table = TableContext.inject(standalone);
    return () => (
      <th
        {...mergeAttrs<'th'>(
          {
            sx: [
              dataTableStyles.headerCell,
              dataTableDensityStyles[table.density],
              dataTableStyles[align],
              !nowrap && dataTableStyles.wrap,
            ],
            scope,
          },
          rest,
        )}
      >
        {children}
      </th>
    );
  },
);

/** 单元格（td） */
export const TableCell = _component(
  ({ align = 'start', nowrap = false, children, ...rest }: TableCellProps) => {
    const table = TableContext.inject(standalone);
    return () => (
      <td
        {...mergeAttrs<'td'>(
          {
            sx: [
              dataTableStyles.cell,
              dataTableDensityStyles[table.density],
              dataTableStyles[align],
              !nowrap && dataTableStyles.wrap,
            ],
          },
          rest,
        )}
      >
        {children}
      </td>
    );
  },
);
