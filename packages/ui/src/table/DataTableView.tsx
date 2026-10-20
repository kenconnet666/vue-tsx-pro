/**
 * 表格的渲染层：DataTable、TreeDataTable 共用（同 Listbox 与 ListboxView 的分工）。只管画，状态（排序、选择、展开、列宽）由外层决定。
 *
 * - 结构：原生 table（读屏按表格念：第几行第几列、列标题）+ table-layout: fixed + colgroup 定列宽，
 *   外层是 ScrollArea（两个方向滚动，视口可聚焦，键盘也能滚）。
 * - 虚拟滚动（useVirtualizer）：只渲染看得见的行，上下各一行占位撑出滚动高度（各列仍在同一张表里对齐）；
 *   行带 aria-rowindex，表格带 aria-rowcount，读屏知道总行数与当前位置。
 * - 吸顶表头、固定列：position: sticky，固定列的偏移按列宽累加（逻辑方向，从右到左排版自动换边）；
 *   固定列的单元格继承行的底色，盖住滚过去的内容。
 * - 排序：可排序的列标题是按钮，th 带 aria-sort；勾选列用 Checkbox（表头的全选有部分选中状态）。
 * - 列宽：表头结束边的 ColumnResizer（拖动或 ← / →）调整；固定列偏移与最小宽度的计算在 columns.ts。
 * - 加载：没有数据时显示骨架行；已有数据（刷新中）时表头下方显示一条进度条；表格带 aria-busy。没有数据时显示 Empty。
 */
import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon } from '../base/Icon';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { useLang } from '../config/context';
import { Empty, type EmptyProps } from '../feedback/Empty';
import { Progress, type ProgressProps } from '../feedback/Progress';
import { Skeleton, type SkeletonProps } from '../feedback/Skeleton';
import { Checkbox, type CheckboxProps } from '../input/Checkbox';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { SelectionModes } from '../utils/data/selection';
import { plainText } from '../utils/data/text';
import { useVirtualizer } from '../utils/virtual/use-virtualizer';
import type { VisibleRange } from '../utils/virtual/virtualizer';
import { ColumnResizer, type ColumnResizerProps } from './ColumnResizer';
import {
  columnValue,
  stickyOffsets,
  tableMinWidth,
  type SortState,
  type StickyOffsets,
  type DataTableColumn,
} from './columns';

/** 表格的密度（行高与字号） */
export interface DataTableDensities {
  /** 紧凑：数据很多、要一屏看更多行（字号也小一档） */
  compact: unknown;
  /** 标准（默认） */
  standard: unknown;
  /** 宽松：行里有头像、两行文字 */
  comfortable: unknown;
}

/** 表格的样式 */
export interface DataTableVariants {
  /** 表面色、外框与圆角（默认） */
  surface: unknown;
  /** 没有外框，底色同页面：放在卡片、对话框里 */
  ghost: unknown;
}

/** 表格的外观选项；可以用 createUi / Provider 的 defaults.DataTable 统一改默认值（TreeDataTable 也用它） */
export interface DataTableOptions {
  /** 密度，默认 standard */
  density?: keyof DataTableDensities;
  /** 样式，默认 surface */
  variant?: keyof DataTableVariants;
  /** 斑马纹：隔行浅色底 */
  striped?: boolean;
}

/** 要渲染的一行：DataTable 是平铺的行，TreeDataTable 是展开后的树（带层级） */
export interface DataTableRowModel<T> {
  /** 行的 key（选择、展开、测量都按它） */
  key: string;
  /** 这一行的数据 */
  data: T;
  /** 层级（TreeDataTable），从 0 开始 */
  depth: number;
}

/** 行、单元格的部件属性：可以按行（与列）计算 */
type RowPartProps<T> = PartProps<'tr'> | ((row: T, index: number) => PartProps<'tr'>);
type CellPartProps<T> = PartProps<'td'> | ((row: T, column: DataTableColumn<T>) => PartProps<'td'>);

/** DataTableView 的属性；未声明的属性落到 table 上（aria-label 或 aria-labelledby 是表格的名称） */
export interface DataTableViewProps<T> extends PartProps<'table', 'role'>, DataTableOptions {
  /** 要渲染的行（已排序、已按展开状态展开） */
  rows: readonly DataTableRowModel<T>[];
  /** 列 */
  columns: readonly DataTableColumn<T>[];
  /** 当前排序 */
  sort?: SortState | null;
  /** 点了可排序的列标题 */
  onSortClick?: (key: string) => void;
  /** 选择方式；不写时没有勾选列。多选时表头有全选 */
  selectionMode?: keyof SelectionModes;
  /** 已选行的 key */
  selectedKeys?: readonly string[];
  /** 勾选或取消一行 */
  onToggleRow?: (key: string) => void;
  /** 表头的全选：全部选中时取消全部，否则全选 */
  onToggleAll?: () => void;
  /** 各列当前的宽度（px）：拖动调整过的、或列定义里写的 */
  widths: Readonly<Record<string, number | undefined>>;
  /** 拖动或用键盘调整了某列的宽度 */
  onResize?: (key: string, width: number) => void;
  /** 列宽可以调整（列定义里的 resizable 优先） */
  resizable?: boolean;
  /** 加载中 */
  loading?: boolean;
  /** 没有数据时显示的内容；默认是 Empty（文案取语言包） */
  empty?: VNodeChild;
  /** 第一个数据列的单元格内容前面加的东西（TreeDataTable 的缩进与展开按钮） */
  leading?: (row: DataTableRowModel<T>, index: number) => VNodeChild;
  /** 行的估计高度（px）；不写时按密度估计，渲染后以实际高度为准 */
  estimateRowHeight?: number;
  /** 可见行范围变化（不含 overscan）：接近末尾时加载更多 */
  onRangeChange?: (range: VisibleRange) => void;
  /** 外层滚动区域（决定表格的高度）的部件属性；高度用 sx 给，默认最高 32em */
  propsRoot?: Partial<ScrollAreaProps>;
  /** 每一行（tr）的部件属性，可以按行计算 */
  propsRow?: RowPartProps<T>;
  /** 每个单元格（td）的部件属性，可以按行与列计算 */
  propsCell?: CellPartProps<T>;
  /** 每个列标题（th）的部件属性，可以按列计算 */
  propsHeaderCell?: PartProps<'th'> | ((column: DataTableColumn<T>) => PartProps<'th'>);
  /** 空状态的部件属性 */
  propsEmpty?: Partial<EmptyProps>;
  /** 加载中占位的部件属性 */
  propsSkeleton?: Partial<SkeletonProps>;
  /** 可排序列标题里的排序按钮的部件属性 */
  propsSortButton?: Partial<ButtonBaseProps>;
  /** 列宽调整手柄的部件属性 */
  propsResizer?: Partial<ColumnResizerProps>;
  /** 可排序列标题里的文字（排序按钮里、图标前）的部件属性 */
  propsSortLabel?: PartProps<'span'>;
  /** 表头（thead，吸顶）的部件属性 */
  propsHead?: PartProps<'thead'>;
  /** 表头那一行（tr）的部件属性 */
  propsHeadRow?: PartProps<'tr', 'aria-rowindex'>;
  /** 表头勾选列（th，多选时里面是全选框）的部件属性 */
  propsSelectHeaderCell?: PartProps<'th', 'scope'>;
  /** 每行勾选列（td）的部件属性 */
  propsSelectCell?: PartProps<'td'>;
  /** 勾选列里的勾选框（每行的与表头的全选）的部件属性；勾选状态与切换由组件管理 */
  propsSelectCheckbox?: Partial<CheckboxProps>;
  /** 第一个数据列里 leading 与内容的外层（有 leading 时才有）的部件属性 */
  propsLeading?: PartProps<'div'>;
  /** 第一个数据列里内容的包装（有 leading 时才有）的部件属性 */
  propsContent?: PartProps<'div'>;
  /** 刷新中表头下方的进度条的部件属性 */
  propsProgress?: Partial<ProgressProps>;
  /** 空状态所在的单元格（td，跨全部列）的部件属性 */
  propsEmptyCell?: PartProps<'td', 'colspan'>;
}

/** 勾选列的宽度（px） */
const SELECT_WIDTH = 44;
/** 加载中显示几行骨架 */
const SKELETON_ROWS = 6;
/** 各密度下行高的估计（px） */
const ROW_HEIGHT: Record<keyof DataTableDensities, number> = {
  compact: 36,
  standard: 44,
  comfortable: 52,
};

/** DataTable、TreeDataTable 的样式：root、surface、ghost、table、sm、md 等 */
export const dataTableStyles = stylex.create({
  // contain: inline-size：宽表格不会把外层的 grid / flex 容器撑宽（它们的最小宽度默认等于内容宽度），
  // 宽度只由所在的容器决定，放不下的部分在表格里横向滚动
  root: { maxHeight: '32em', minWidth: 0, contain: 'inline-size' },
  surface: {
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    backgroundColor: '_surface',
  },
  ghost: { backgroundColor: '_background' },
  table: {
    width: '_full',
    tableLayout: 'fixed',
    borderCollapse: 'separate',
    borderSpacing: 0,
    color: '_text',
    lineHeight: '_normal',
  },
  compact: { fontSize: '_sm' },
  standard: {},
  comfortable: {},
  head: { position: 'sticky', top: 0, zIndex: 2 },
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
  cell: {
    boxSizing: 'border-box',
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
  wrap: { whiteSpace: 'normal', overflowWrap: 'anywhere' },
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
  // 行的底色：固定列的单元格继承它（backgroundColor: inherit），所以必须是不透明的颜色
  row: { backgroundColor: { default: '_surface', ':hover': '_fillHover' } },
  rowGhost: { backgroundColor: { default: '_background', ':hover': '_fillHover' } },
  striped: { backgroundColor: { default: '_fill', ':hover': '_fillHover' } },
  selected: { backgroundColor: { default: '_accentSoft', ':hover': '_accentSoftHover' } },
  // 固定列在普通单元格之上，表头在固定列之上
  sticky: { position: 'sticky', zIndex: 1 },
  // 有起始边的固定列时，勾选列也固定在最前面
  stickySelect: { position: 'sticky', zIndex: 1, insetInlineStart: 0 },
  selectCell: { paddingInline: 0, textAlign: 'center', textOverflow: 'clip' },
  // 去掉按钮默认外观、焦点环、波纹、颜色过渡由 ButtonBase 给出
  sortButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    maxWidth: '_full',
    color: { default: 'inherit', ':hover': '_text' },
  },
  sortLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
  sortIcon: { flexShrink: 0 },
  sortActive: { color: '_accentText' },
  leading: { display: 'flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
  content: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
  spacer: { padding: 0, borderWidth: 0 },
  progressCell: { position: 'relative', height: 0, padding: 0, borderWidth: 0 },
  progress: { position: 'absolute', top: 0, insetInline: 0 },
  skeleton: { display: 'block', height: '1em' },
  emptyCell: { padding: 0, whiteSpace: 'normal' },
});

/** DataTable、TreeDataTable 的样式：单元格按密度的上下内边距 */
export const dataTableDensityStyles = stylex.create({
  compact: { paddingBlock: '_xs' },
  standard: { paddingBlock: '_sm' },
  comfortable: { paddingBlock: '_md' },
});

// 列宽、偏移、占位高度是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** DataTable、TreeDataTable 的样式：width、minWidth、height、start、end、percent */
export const dataTableDynamicStyles = stylex.create({
  width: (px: number) => ({ width: px }),
  minWidth: (px: number) => ({ minWidth: px }),
  height: (px: number) => ({ height: px }),
  start: (px: number) => ({ insetInlineStart: px }),
  end: (px: number) => ({ insetInlineEnd: px }),
  percent: (value: string) => ({ width: value }),
});

/** 固定列单元格的样式：position: sticky 加上按列宽累加的偏移 */
function stickyCellSx(column: DataTableColumn<never>, offsets: StickyOffsets) {
  if (column.sticky === 'start')
    return [dataTableStyles.sticky, dataTableDynamicStyles.start(offsets.start.get(column.key)!)];
  if (column.sticky === 'end')
    return [dataTableStyles.sticky, dataTableDynamicStyles.end(offsets.end.get(column.key)!)];
  return null;
}

/** DataTableRow 的属性：一行要用到的全部数据；除了 row、index、selected，同一张表里各行都相同 */
export interface DataTableRowProps<T> {
  /** 这一行 */
  row: DataTableRowModel<T>;
  /** 在全部行里的序号 */
  index: number;
  /** 是否已选 */
  selected: boolean;
  /** 选择方式；不写时没有勾选列 */
  selectionMode?: keyof SelectionModes;
  /** 列 */
  columns: readonly DataTableColumn<T>[];
  /** 密度 */
  density: keyof DataTableDensities;
  /** 样式 */
  variant: keyof DataTableVariants;
  /** 斑马纹 */
  striped: boolean;
  /** 固定列的偏移 */
  offsets: StickyOffsets;
  /** 第一个数据列前面加的东西（TreeDataTable 的缩进与展开按钮） */
  leading?: (row: DataTableRowModel<T>, index: number) => VNodeChild;
  /** 行的部件属性 */
  propsRow?: RowPartProps<T>;
  /** 单元格的部件属性 */
  propsCell?: CellPartProps<T>;
  /** 勾选列单元格的部件属性 */
  propsSelectCell?: PartProps<'td'>;
  /** 勾选框的部件属性 */
  propsSelectCheckbox?: Partial<CheckboxProps>;
  /** leading 与内容外层的部件属性 */
  propsLeading?: PartProps<'div'>;
  /** 内容包装的部件属性 */
  propsContent?: PartProps<'div'>;
  /** 测量行高（虚拟滚动） */
  measure: (element: unknown) => void;
  /** 勾选或取消这一行 */
  onToggle?: (key: string) => void;
}

/**
 * 表格的一行：单独成组件，props 没变的行在表格重新渲染时直接跳过——
 * 滚动只挂载新进入视口的行，勾选一行只更新这一行（原来每次都重建全部可见行与其中的勾选框）
 */
export const DataTableRow = _component(
  <T,>({
    row,
    index,
    selected,
    selectionMode,
    columns,
    density,
    variant,
    striped,
    offsets,
    leading,
    propsRow,
    propsCell,
    propsSelectCell,
    propsSelectCheckbox,
    propsLeading,
    propsContent,
    measure,
    onToggle,
  }: DataTableRowProps<T>) => {
    const lang = useLang();
    return () => (
      <tr
        {...mergeAttrs<'tr'>(
          {
            sx: [
              variant === 'ghost' ? dataTableStyles.rowGhost : dataTableStyles.row,
              striped && index % 2 === 1 && dataTableStyles.striped,
              selected && dataTableStyles.selected,
            ],
          },
          typeof propsRow === 'function' ? propsRow(row.data, index) : propsRow,
          {
            ref: measure,
            'aria-rowindex': index + 2,
            'aria-selected': selectionMode != null ? selected : undefined,
          },
        )}
        data-index={index}
        data-state={selected ? 'selected' : undefined}
      >
        {selectionMode && (
          <td
            {...mergeAttrs<'td'>(
              {
                sx: [
                  dataTableStyles.cell,
                  dataTableDensityStyles[density],
                  dataTableStyles.selectCell,
                  offsets.start.size > 0 && dataTableStyles.stickySelect,
                ],
              },
              propsSelectCell,
            )}
          >
            <Checkbox
              {...mergePartProps<CheckboxProps>(
                { 'aria-label': lang.tableSelectRow(index + 1) },
                propsSelectCheckbox,
                {
                  checked: selected,
                  indeterminate: false,
                  onChange: () => onToggle?.(row.key),
                },
              )}
            />
          </td>
        )}
        {columns.map((column, position) => {
          const value = column.cell
            ? column.cell(row.data, index)
            : String(columnValue(column, row.data) ?? '');
          return (
            <td
              key={column.key}
              {...mergeAttrs<'td'>(
                {
                  sx: [
                    dataTableStyles.cell,
                    dataTableDensityStyles[density],
                    dataTableStyles[column.align ?? 'start'],
                    column.wrap && dataTableStyles.wrap,
                    stickyCellSx(column, offsets),
                  ],
                },
                typeof propsCell === 'function' ? propsCell(row.data, column) : propsCell,
              )}
            >
              {position === 0 && leading ? (
                <div {...mergeAttrs<'div'>({ sx: dataTableStyles.leading }, propsLeading)}>
                  {leading(row, index)}
                  <div {...mergeAttrs<'div'>({ sx: dataTableStyles.content }, propsContent)}>
                    {value}
                  </div>
                </div>
              ) : (
                value
              )}
            </td>
          );
        })}
      </tr>
    );
  },
);

/** 表格的渲染层：虚拟滚动的行、吸顶表头、固定列、排序、勾选、列宽调整、加载与空状态 */
export const DataTableView = _component(
  <T,>({
    rows,
    columns,
    sort,
    onSortClick,
    selectionMode,
    selectedKeys = [],
    onToggleRow,
    onToggleAll,
    widths,
    onResize,
    resizable = false,
    loading = false,
    empty,
    leading,
    density = 'standard',
    variant = 'surface',
    striped = false,
    estimateRowHeight,
    onRangeChange,
    propsRoot,
    propsRow,
    propsCell,
    propsHeaderCell,
    propsEmpty,
    propsSkeleton,
    propsSortButton,
    propsResizer,
    propsSortLabel,
    propsHead,
    propsHeadRow,
    propsSelectHeaderCell,
    propsSelectCell,
    propsSelectCheckbox,
    propsLeading,
    propsContent,
    propsProgress,
    propsEmptyCell,
    ...rest
  }: DataTableViewProps<T>) => {
    const lang = useLang();
    // 骨架、进度条防闪烁；aria-busy 与空状态按真实的 loading
    const indicator = useDelayedLoading(() => loading);
    const selectedSet = _derived.by(() => new Set(selectedKeys));
    // 遍历全部行：放在派生里，滚动时的重新渲染不必再算一遍
    const allSelected = _derived(rows.length > 0 && rows.every((row) => selectedSet.has(row.key)));
    const someSelected = _derived(!allSelected && rows.some((row) => selectedSet.has(row.key)));
    let viewport = _state.raw<HTMLElement | null>(null);
    let body = _state.raw<HTMLElement | null>(null);

    const virtual = useVirtualizer(() => {
      const current = rows;
      return {
        count: current.length,
        scrollElement: viewport,
        list: body,
        estimateSize: () => estimateRowHeight ?? ROW_HEIGHT[density],
        getItemKey: (index: number) => current[index]!.key,
        overscan: 8,
        onRangeChange,
      };
    });

    /** 列的宽度：调整过的、列定义里的，或者没有（与其他没写宽度的列平分） */
    const widthOf = (column: DataTableColumn<T>) => widths[column.key] ?? column.width;

    const leadingWidth = () => (selectionMode ? SELECT_WIDTH : 0);
    const offsets = _derived.by(() => stickyOffsets(columns, widthOf, leadingWidth()));
    const minWidth = () => tableMinWidth(columns, widthOf, leadingWidth());

    function renderHeaderCell(column: DataTableColumn<T>) {
      const own = typeof propsHeaderCell === 'function' ? propsHeaderCell(column) : propsHeaderCell;
      const sorted = sort?.key === column.key ? sort.direction : undefined;
      const label = plainText(column.header);
      const canResize = column.resizable ?? resizable;
      return (
        <th
          key={column.key}
          {...mergeAttrs<'th'>(
            {
              sx: [
                dataTableStyles.headerCell,
                dataTableDensityStyles[density],
                dataTableStyles[column.align ?? 'start'],
                stickyCellSx(column, offsets),
              ],
            },
            own,
            {
              scope: 'col',
              'aria-sort': column.sortable ? (sorted ?? 'none') : undefined,
            },
          )}
          data-sticky={column.sticky}
        >
          {column.sortable ? (
            <ButtonBase
              {...mergePartProps<ButtonBaseProps>(
                { sx: dataTableStyles.sortButton },
                propsSortButton,
                { onClick: () => onSortClick?.(column.key) },
              )}
            >
              <span {...mergeAttrs<'span'>({ sx: dataTableStyles.sortLabel }, propsSortLabel)}>
                {column.header}
              </span>
              <Icon
                icon={
                  sorted === 'ascending'
                    ? ArrowUp
                    : sorted === 'descending'
                      ? ArrowDown
                      : ArrowUpDown
                }
                sx={[dataTableStyles.sortIcon, sorted && dataTableStyles.sortActive]}
              />
            </ButtonBase>
          ) : (
            column.header
          )}
          {canResize && (
            <ColumnResizer
              {...mergePartProps<ColumnResizerProps>(
                {
                  label: label ?? column.key,
                  width: widthOf(column),
                  minWidth: column.minWidth,
                  onWidthChange: (width: number) => onResize?.(column.key, width),
                },
                propsResizer,
              )}
            />
          )}
        </th>
      );
    }

    return () => {
      const span = columns.length + (selectionMode ? 1 : 0);
      const items = virtual.items;
      const top = items[0]?.start ?? 0;
      const bottom = items.length ? virtual.total - items.at(-1)!.end : 0;
      return (
        <ScrollArea
          {...mergePartProps<ScrollAreaProps>(
            {
              axis: 'both',
              sx: [
                dataTableStyles.root,
                variant === 'ghost' ? dataTableStyles.ghost : dataTableStyles.surface,
              ],
            },
            propsRoot,
            { propsViewport: { ref: _toRef(viewport) } },
          )}
        >
          <table
            {...mergeAttrs<'table'>(
              {
                sx: [
                  dataTableStyles.table,
                  dataTableStyles[density],
                  dataTableDynamicStyles.minWidth(minWidth()),
                ],
              },
              rest,
              {
                'aria-rowcount': rows.length + 1,
                'aria-busy': loading || undefined,
              },
            )}
          >
            <colgroup>
              {selectionMode && (
                <col {...stylex.attrs(dataTableDynamicStyles.width(SELECT_WIDTH))} />
              )}
              {columns.map((column) => {
                const width = widthOf(column);
                return (
                  <col
                    key={column.key}
                    {...(width != null ? stylex.attrs(dataTableDynamicStyles.width(width)) : {})}
                  />
                );
              })}
            </colgroup>
            <thead {...mergeAttrs<'thead'>({ sx: dataTableStyles.head }, propsHead)}>
              <tr {...mergeAttrs<'tr'>({}, propsHeadRow, { 'aria-rowindex': 1 })}>
                {selectionMode && (
                  <th
                    {...mergeAttrs<'th'>(
                      {
                        sx: [
                          dataTableStyles.headerCell,
                          dataTableDensityStyles[density],
                          dataTableStyles.selectCell,
                          offsets.start.size > 0 && dataTableStyles.stickySelect,
                        ],
                      },
                      propsSelectHeaderCell,
                      { scope: 'col' },
                    )}
                  >
                    {selectionMode === 'multiple' && (
                      <Checkbox
                        {...mergePartProps<CheckboxProps>(
                          { 'aria-label': lang.tableSelectAll },
                          propsSelectCheckbox,
                          {
                            checked: allSelected,
                            indeterminate: someSelected,
                            disabled: rows.length === 0,
                            onChange: () => onToggleAll?.(),
                          },
                        )}
                      />
                    )}
                  </th>
                )}
                {columns.map(renderHeaderCell)}
              </tr>
              {indicator.value && rows.length > 0 && (
                <tr aria-hidden="true">
                  <td colspan={span} {...stylex.attrs(dataTableStyles.progressCell)}>
                    <div {...stylex.attrs(dataTableStyles.progress)}>
                      <Progress
                        {...mergePartProps<ProgressProps>(
                          { size: 'xs', 'aria-label': lang.loading },
                          propsProgress,
                        )}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </thead>
            <tbody ref={_toRef(body)}>
              {rows.length === 0 &&
                indicator.value &&
                Array.from({ length: SKELETON_ROWS }, (_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    aria-hidden="true"
                    {...stylex.attrs(
                      variant === 'ghost' ? dataTableStyles.rowGhost : dataTableStyles.row,
                    )}
                  >
                    {selectionMode && (
                      <td
                        {...stylex.attrs(dataTableStyles.cell, dataTableDensityStyles[density])}
                      />
                    )}
                    {columns.map((column, position) => (
                      <td
                        key={column.key}
                        {...stylex.attrs(dataTableStyles.cell, dataTableDensityStyles[density])}
                      >
                        <Skeleton
                          {...mergePartProps<SkeletonProps>(
                            {
                              sx: [
                                dataTableStyles.skeleton,
                                dataTableDynamicStyles.percent(
                                  `${90 - ((index + position) % 4) * 15}%`,
                                ),
                              ],
                            },
                            propsSkeleton,
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td
                    {...mergeAttrs<'td'>(
                      { sx: [dataTableStyles.cell, dataTableStyles.emptyCell] },
                      propsEmptyCell,
                      { colspan: span },
                    )}
                  >
                    {empty ?? (
                      <Empty
                        {...mergePartProps<EmptyProps>(
                          { size: 'sm', title: lang.tableEmpty },
                          propsEmpty,
                        )}
                      />
                    )}
                  </td>
                </tr>
              )}
              {top > 0 && (
                <tr aria-hidden="true">
                  <td
                    colspan={span}
                    {...stylex.attrs(dataTableStyles.spacer, dataTableDynamicStyles.height(top))}
                  />
                </tr>
              )}
              {items.map((item) => {
                const row = rows[item.index]!;
                return (
                  <DataTableRow
                    key={row.key}
                    row={row}
                    index={item.index}
                    selected={selectionMode != null && selectedSet.has(row.key)}
                    selectionMode={selectionMode}
                    columns={columns}
                    density={density}
                    variant={variant}
                    striped={striped}
                    offsets={offsets}
                    leading={leading}
                    propsRow={propsRow}
                    propsCell={propsCell}
                    propsSelectCell={propsSelectCell}
                    propsSelectCheckbox={propsSelectCheckbox}
                    propsLeading={propsLeading}
                    propsContent={propsContent}
                    measure={virtual.measure}
                    onToggle={onToggleRow}
                  />
                );
              })}
              {bottom > 0 && (
                <tr aria-hidden="true">
                  <td
                    colspan={span}
                    {...stylex.attrs(dataTableStyles.spacer, dataTableDynamicStyles.height(bottom))}
                  />
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      );
    };
  },
  { name: 'DataTableView' },
);
