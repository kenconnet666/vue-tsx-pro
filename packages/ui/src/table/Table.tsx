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
 * 外观（密度、样式、斑马纹）与 DataTable 相同（配方 tableRecipe，对齐、换行与 DataTable 共用 dataTableStateStyles）；
 * 单元格默认可以换行，列宽按内容分配。
 * 表格比容器宽时在外层横向滚动（ScrollArea：浮层滚动条，不占高度），不撑宽页面。
 */
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  dataTableStateStyles,
  type DataTableDensities,
  type DataTableOptions,
  type DataTableVariants,
} from './table-styles';

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
  /** 外层（横向滚动的 ScrollArea）的部件属性 */
  propsRoot?: Partial<ScrollAreaProps>;
  children?: VNodeChild;
}

/**
 * 静态表格的配方：部件对应原生 table 的各个元素，密度、样式、斑马纹是档位。
 * 表体、表尾里的行标题（th）是 `[s.cell.sx, s.rowHeader.sx]`，表尾的格再叠上 `s.footCell.sx`
 */
export const tableRecipe = css.recipe({
  name: 'Table',
  parts: [
    'root',
    'table',
    'caption',
    'head',
    'body',
    'foot',
    'row',
    'headerCell',
    'rowHeader',
    'cell',
    'footCell',
  ],
  base: {
    // contain: inline-size：宽表格不撑宽外层的 grid / flex 容器，放不下的在这里横向滚动
    root: { minWidth: 0, contain: 'inline-size' },
    // 列宽按内容分配：DataTable 为虚拟滚动与列宽拖动用固定布局，静态表格不需要
    table: {
      width: '_full',
      tableLayout: 'auto',
      borderCollapse: 'separate',
      borderSpacing: 0,
      color: '_text',
      lineHeight: '_normal',
    },
    caption: {
      captionSide: 'top',
      paddingBlock: '_sm',
      paddingInline: '_md',
      color: '_textMuted',
      fontSize: '_sm',
      textAlign: 'start',
    },
    headerCell: {
      position: 'relative',
      boxSizing: 'border-box',
      paddingInline: '_md',
      borderBottomWidth: '_xs',
      borderBottomStyle: 'solid',
      borderBottomColor: '_border',
      backgroundColor: '_fill',
      color: '_textMuted',
      fontSize: '_sm',
      fontWeight: '_semibold',
      textAlign: 'start',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    // 表体、表尾里的行标题（scope=row）：和普通单元格一样的底色与字号，只是字重高一点
    rowHeader: { fontWeight: '_medium', textAlign: 'start' },
    // 数字等宽：金额、数量、日期上下对齐（文字不受影响）
    cell: {
      boxSizing: 'border-box',
      fontVariantNumeric: 'tabular-nums',
      paddingInline: '_md',
      borderBottomWidth: '_xs',
      borderBottomStyle: 'solid',
      borderBottomColor: '_borderMuted',
      backgroundColor: 'inherit',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
    },
    // 表尾（合计行）：上面一条分隔线，文字加粗，th 与 td 一致
    footCell: {
      fontWeight: '_semibold',
      borderTopWidth: '_xs',
      borderTopStyle: 'solid',
      borderTopColor: '_border',
      borderBottomWidth: 0,
    },
  },
  variants: {
    // 单元格的上下内边距；紧凑时字号也小一档
    density: {
      compact: {
        table: { fontSize: '_sm' },
        headerCell: { paddingBlock: '_xs' },
        cell: { paddingBlock: '_xs' },
      },
      standard: { headerCell: { paddingBlock: '_sm' }, cell: { paddingBlock: '_sm' } },
      comfortable: { headerCell: { paddingBlock: '_md' }, cell: { paddingBlock: '_md' } },
    },
    variant: {
      surface: {
        root: {
          borderWidth: '_xs',
          borderStyle: 'solid',
          borderColor: '_border',
          borderRadius: '_lg',
          backgroundColor: '_surface',
        },
        row: { backgroundColor: { default: '_surface', ':hover': '_fillHover' } },
      },
      ghost: {
        root: { backgroundColor: '_background' },
        row: { backgroundColor: { default: '_background', ':hover': '_fillHover' } },
      },
    },
    striped: {
      true: { row: { backgroundColor: { default: null, ':nth-child(even)': '_fill' } } },
    },
  },
});

/** 静态表格的部件（createUi / Provider 的 styles.Table 按它定制） */
export type TablePart = (typeof tableRecipe.parts)[number];

/** 静态表格的动态样式：列宽 */
export const tableDynamicStyles = css.create({
  width: (width: string) => ({ width }),
});

/** 单元格所在的区域：表头的 th 是列标题，表体与表尾的 th 是行标题 */
export type TableSection = 'head' | 'body' | 'foot';

/** 单元格所在区域的上下文：TableHead、TableBody、TableFoot 提供 */
export const TableSectionContext = createContext<TableSection>('TableSection');

/** 表格里的元素按所在 Table 的外观取部件层：在 setup 里调用，渲染时调用返回的函数 */
function useTableParts() {
  const table = TableContext.inject(standalone);
  const recipe = useRecipe(tableRecipe);
  return () => recipe(table);
}

/** 静态表格（table）：外层可横向滚动；外观经上下文交给行与单元格 */
export const Table = _component(
  ({ density, variant, striped, propsRoot, children, ...rest }: TableProps) => {
    const appearance = useDefaults('Table', () => ({ density, variant, striped }), {
      density: 'standard',
      variant: 'surface',
      striped: false,
    });
    const recipe = useRecipe(tableRecipe);
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
    return () => {
      const s = recipe(appearance());
      return (
        <ScrollArea {...mergePartProps<ScrollAreaProps>({ ...s.root, axis: 'x' }, propsRoot)}>
          <table {...mergeAttrs<'table'>(s.table, rest)}>{children}</table>
        </ScrollArea>
      );
    };
  },
);

/** 表格标题（caption）：同时是表格的名称；不想显示时包进 VisuallyHidden */
export const TableCaption = _component(
  ({ children, ...rest }: PartProps<'caption'> & { children?: VNodeChild }) => {
    const parts = useTableParts();
    return () => <caption {...mergeAttrs<'caption'>(parts().caption, rest)}>{children}</caption>;
  },
);

/** 表头（thead） */
export const TableHead = _component(
  ({ children, ...rest }: PartProps<'thead'> & { children?: VNodeChild }) => {
    TableSectionContext.provide('head');
    const parts = useTableParts();
    return () => <thead {...mergeAttrs<'thead'>(parts().head, rest)}>{children}</thead>;
  },
);

/** 表体（tbody） */
export const TableBody = _component(
  ({ children, ...rest }: PartProps<'tbody'> & { children?: VNodeChild }) => {
    TableSectionContext.provide('body');
    const parts = useTableParts();
    return () => <tbody {...mergeAttrs<'tbody'>(parts().body, rest)}>{children}</tbody>;
  },
);

/** 表尾（tfoot）：合计行 */
export const TableFoot = _component(
  ({ children, ...rest }: PartProps<'tfoot'> & { children?: VNodeChild }) => {
    TableSectionContext.provide('foot');
    const parts = useTableParts();
    return () => <tfoot {...mergeAttrs<'tfoot'>(parts().foot, rest)}>{children}</tfoot>;
  },
);

/** 行（tr）：底色随表格的样式，斑马纹时隔行浅色底 */
export const TableRow = _component(
  ({ children, ...rest }: PartProps<'tr'> & { children?: VNodeChild }) => {
    const parts = useTableParts();
    return () => <tr {...mergeAttrs<'tr'>(parts().row, rest)}>{children}</tr>;
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

/** 未声明的属性落到 th 上；原生的 align、width 属性已废弃，用同名的 prop */
export interface TableHeaderCellProps extends PartProps<'th', 'align' | 'width'>, TableCellOptions {
  /** 表头单元格对应的方向，默认 col（列标题）；行标题写 row */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  /** 列宽（CSS 长度，数字按 px）：日期、数字、操作这类按内容定宽的列；不写的列分剩下的 */
  width?: number | string;
}

/** 未声明的属性落到 td 上；对齐用 align prop */
export interface TableCellProps extends PartProps<'td', 'align'>, TableCellOptions {}

/** 表头单元格（th）：表头里是列标题，表体与表尾里是行标题 */
export const TableHeaderCell = _component(
  ({
    align = 'start',
    nowrap = false,
    scope = 'col',
    width,
    children,
    ...rest
  }: TableHeaderCellProps) => {
    const parts = useTableParts();
    const section = TableSectionContext.inject('head');
    return () => {
      const s = parts();
      return (
        <th
          {...mergeAttrs<'th'>(
            {
              ...(section === 'head' ? s.headerCell : s.rowHeader),
              sx: [
                section === 'head' ? s.headerCell.sx : [s.cell.sx, s.rowHeader.sx],
                section === 'foot' && s.footCell.sx,
                dataTableStateStyles[align],
                !nowrap && dataTableStateStyles.wrap,
                width != null &&
                  tableDynamicStyles.width(typeof width === 'number' ? `${width}px` : width),
              ],
              scope,
            },
            rest,
          )}
        >
          {children}
        </th>
      );
    };
  },
);

/** 单元格（td） */
export const TableCell = _component(
  ({ align = 'start', nowrap = false, children, ...rest }: TableCellProps) => {
    const parts = useTableParts();
    const section = TableSectionContext.inject('body');
    return () => {
      const s = parts();
      return (
        <td
          {...mergeAttrs<'td'>(
            {
              ...(section === 'foot' ? s.footCell : s.cell),
              sx: [
                s.cell.sx,
                section === 'foot' && s.footCell.sx,
                dataTableStateStyles[align],
                !nowrap && dataTableStateStyles.wrap,
              ],
            },
            rest,
          )}
        >
          {children}
        </td>
      );
    };
  },
);
