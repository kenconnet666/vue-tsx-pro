/**
 * 表格的渲染层：DataTable、TreeDataTable 共用（同 Listbox 与 ListboxView 的分工）。只管画，状态（排序、选择、展开、列宽）由外层决定。
 *
 * - 结构：原生 table（读屏按表格念：第几行第几列、列标题）+ table-layout: fixed + colgroup 定列宽，
 *   外层是 ScrollArea（两个方向滚动，内容超出时视口可聚焦，键盘也能滚）。
 * - 虚拟滚动（useVirtualizer）：只渲染看得见的行，上下各一行占位撑出滚动高度（各列仍在同一张表里对齐）；
 *   行带 aria-rowindex，表格带 aria-rowcount，读屏知道总行数与当前位置。
 * - 分组表头（columnGroups）：相邻的几列上方共用一个标题，表头两行（th scope="colgroup"），没分组的列跨两行。
 * - 吸顶表头、固定列：position: sticky，固定列的偏移按列宽累加（逻辑方向，从右到左排版自动换边）；
 *   固定列的单元格继承行的底色，盖住滚过去的内容。
 * - 排序：可排序的列标题是按钮，th 带 aria-sort；勾选列用 Checkbox（表头的全选有部分选中状态）。
 * - 列宽：表头结束边的 ColumnResizer（拖动或 ← / →）调整；固定列偏移与最小宽度的计算在 columns.ts。
 * - 详情行（renderDetail）：多一列展开按钮（aria-expanded、aria-controls），展开的行下面多一行跨全部列的详情，
 *   内容让过勾选列与展开列、和第一个数据列对齐；
 *   详情在虚拟滚动里也算一行（测量真实高度），内容贴着视口的起始边，横向滚动时不跟着滚走。
 * - 加载：没有数据时显示骨架行；已有数据（刷新中）时表头下方显示一条进度条；表格带 aria-busy。没有数据时显示 Empty。
 */
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { StatusBadge } from '../base/Badge';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon, type IconProps } from '../base/Icon';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { VisuallyHidden, visuallyHiddenStyles } from '../base/VisuallyHidden';
import { clamp } from '../utils/data/number';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { Empty, type EmptyProps } from '../feedback/Empty';
import { Progress, type ProgressProps } from '../feedback/Progress';
import { Skeleton, type SkeletonProps, type SkeletonShapeProps } from '../feedback/Skeleton';
import { SHIMMER_STAGGER } from '../utils/style/shimmer';
import { Checkbox, type CheckboxProps } from '../input/Checkbox';
import { Radio, RadioGroupContext, type RadioProps } from '../input/Radio';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { disclosureStyles } from '../utils/style/transitions';
import type { SelectionModes } from '../utils/data/selection';
import { plainText } from '../utils/data/text';
import { useVirtualizer } from '../utils/virtual/use-virtualizer';
import type { VirtualScrollOptions, VisibleRange } from '../utils/virtual/virtualizer';
import { ColumnResizer, type ColumnResizerProps } from './ColumnResizer';
import {
  columnAlign,
  columnType,
  columnValue,
  formatCell,
  headerLayout,
  sameStickyOffsets,
  stickyOffsets,
  sumColumn,
  tableMinWidth,
  type ColumnTypes,
  type DataTableColumnGroup,
  type SortState,
  type StickyOffsets,
  type DataTableColumn,
} from './columns';
import {
  dataTableDensityStyles,
  dataTableStyles,
  type DataTableDensities,
  type DataTableOptions,
  type DataTableVariants,
} from './table-styles';

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
  /** 部分勾选的行的 key（树形表格的父行：子孙只勾了一部分）：勾选框显示横线，读屏念“部分选中” */
  partialKeys?: readonly string[];
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
  /** 行的色调：导入校验的错误行、即将超期的行整行着浅色底（不透明，固定列也盖得住） */
  rowTone?: (row: T) => RowTone | undefined;
  /** 主从视图里正在看的那一行的 key：整行高亮、起始边一条竖线，带 aria-current */
  activeKey?: string | null;
  /**
   * 点了一行（点在按钮、链接、输入框上的除外）：主从视图里打开这一行的详情。
   * 只是鼠标的捷径：行里还要有键盘能到的入口（如名称做成按钮或链接）
   */
  onRowClick?: (row: T, key: string) => void;
  /** 这一行能不能勾选：不能的勾选框不可用，全选也跳过它 */
  isRowSelectable?: (row: T) => boolean;
  /** 隐藏的列的 key：列显示设置（用 Menu 的 MenuCheckboxItem 组合）写回这里 */
  hiddenColumns?: readonly string[];
  /** 合计行第一列的文字（第一列自己没写 summary 时），默认取语言包（合计） */
  summaryLabel?: VNodeChild;
  /** 分组表头：相邻的几列上方共用一个标题，表头变成两行；没分组的列跨两行 */
  columnGroups?: readonly DataTableColumnGroup[];
  /** 行的详情：写了它时多一列展开按钮，展开的行下面多一行跨全部列的详情 */
  renderDetail?: (row: T) => VNodeChild;
  /** 这一行有没有详情：没有的不显示展开按钮；默认都有 */
  hasDetail?: (row: T) => boolean;
  /** 展开了详情的行的 key */
  expandedRows?: readonly string[];
  /** 点了一行的展开按钮 */
  onToggleDetail?: (key: string) => void;
  /** 可见行范围变化（不含 overscan）：接近末尾时加载更多 */
  onRangeChange?: (range: VisibleRange) => void;
  /** 挂载后拿到滚动到某一行的方法：`handle={(api) => (table = api)}` */
  handle?: (api: DataTableHandle) => void;
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
  propsSkeleton?: SkeletonShapeProps;
  /** 分组标题（th，跨组里的几列）的部件属性，可以按组计算 */
  propsGroupHeaderCell?: PartProps<'th'> | ((group: DataTableColumnGroup) => PartProps<'th'>);
  /** 可排序列标题里的排序按钮的部件属性 */
  propsSortButton?: Partial<ButtonBaseProps>;
  /** 列宽调整手柄的部件属性 */
  propsResizer?: Partial<ColumnResizerProps>;
  /** 可排序列标题里的文字（排序按钮里、图标前）的部件属性 */
  propsSortLabel?: PartProps<'span'>;
  /** 表头（thead，吸顶）的部件属性 */
  propsHead?: PartProps<'thead'>;
  /** 表头的行（tr）的部件属性；分组表头的两行都用它 */
  propsHeadRow?: PartProps<'tr', 'aria-rowindex'>;
  /** 表头勾选列（th，多选时里面是全选框）的部件属性 */
  propsSelectHeaderCell?: PartProps<'th', 'scope'>;
  /** 每行勾选列（td）的部件属性 */
  propsSelectCell?: PartProps<'td'>;
  /** 表头的全选框（多选时）的部件属性；勾选状态、不可用与切换由组件管理 */
  propsSelectAll?: Omit<Partial<CheckboxProps>, SelectCheckboxManaged | 'disabled'>;
  /** 每一行的勾选框（多选时）的部件属性；勾选状态、切换与名称（选择第 N 行，每行不同）由组件管理 */
  propsSelectCheckbox?: Omit<Partial<CheckboxProps>, SelectCheckboxManaged | 'aria-label'>;
  /** 每一行的单选框（单选时）的部件属性；选中状态、切换与名称由组件管理 */
  propsSelectRadio?: Omit<Partial<RadioProps>, 'value' | 'disabled' | 'aria-label'>;
  /** 第一个数据列里 leading 与内容的外层（有 leading 时才有）的部件属性 */
  propsLeading?: PartProps<'div'>;
  /** 第一个数据列里内容的包装（有 leading 时才有）的部件属性 */
  propsContent?: PartProps<'div'>;
  /** 刷新中表头下方的进度条的部件属性 */
  propsProgress?: Partial<ProgressProps>;
  /** 空状态所在的单元格（td，跨全部列）的部件属性 */
  propsEmptyCell?: PartProps<'td', 'colspan'>;
  /** 详情列的列标题（th，文字只给读屏）的部件属性 */
  propsDetailHeaderCell?: PartProps<'th', 'scope'>;
  /** 每行展开按钮所在单元格（td）的部件属性 */
  propsDetailToggleCell?: PartProps<'td'>;
  /** 展开按钮的部件属性；展开状态、关联的详情与点击由组件管理 */
  propsDetailToggle?: Omit<Partial<IconButtonProps>, 'aria-expanded' | 'aria-controls' | 'onClick'>;
  /** 详情行（tr）的部件属性 */
  propsDetailRow?: PartProps<'tr', 'aria-rowindex'>;
  /** 详情所在的单元格（td，跨全部列）的部件属性 */
  propsDetailCell?: PartProps<'td', 'colspan'>;
  /** 表尾（tfoot，合计行，吸底）的部件属性 */
  propsFoot?: PartProps<'tfoot'>;
  /** 合计行每个单元格的部件属性，可以按列计算 */
  propsSummaryCell?: PartProps<'td'> | ((column: DataTableColumn<T>) => PartProps<'td'>);
}

/** DataTable、TreeDataTable 的 handle 拿到的方法 */
export interface DataTableHandle {
  /**
   * 滚动到 key 这一行：还没渲染（虚拟滚动）的行也行，停在吸顶表头之下、吸底合计行之上；
   * align 默认 auto（已经完整可见就不动）。树形表格里只能滚到已展开的行。找不到这一行时返回 false
   */
  scrollToRow: (key: string, options?: VirtualScrollOptions) => boolean;
}

/** 行的色调：整行浅色底 */
export type RowTone = 'info' | 'success' | 'warning' | 'danger';

/** 勾选列里的勾选框由表格管理的属性 */
type SelectCheckboxManaged = 'checked' | 'indeterminate' | 'onChange';

/** 勾选列的宽度（px） */
const SELECT_WIDTH = 44;
/** 详情列（展开按钮）的宽度（px） */
const DETAIL_WIDTH = 40;
/** 详情行的估计高度（px），渲染后以实际高度为准 */
const DETAIL_HEIGHT = 160;
/** 加载中至少、至多显示几行骨架：在这之间按表体到窗口底边的高度铺满 */
const SKELETON_ROWS = { min: 6, max: 50 };
/** 各密度下行高的估计（px） */
const ROW_HEIGHT: Record<keyof DataTableDensities, number> = {
  compact: 36,
  standard: 44,
  comfortable: 52,
};

/** DataTable、TreeDataTable 的样式：行的色调（不透明的浅色底，悬停加深） */
export const dataTableRowToneStyles = stylex.create({
  info: { backgroundColor: { default: '_infoSoft', ':hover': '_infoSoftHover' } },
  success: { backgroundColor: { default: '_successSoft', ':hover': '_successSoftHover' } },
  warning: { backgroundColor: { default: '_warningSoft', ':hover': '_warningSoftHover' } },
  danger: { backgroundColor: { default: '_dangerSoft', ':hover': '_dangerSoftHover' } },
});

// 列宽、偏移、占位高度是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** DataTable、TreeDataTable 的样式：width、minWidth、height、start、end、percent */
export const dataTableDynamicStyles = stylex.create({
  width: (px: number) => ({ width: px }),
  minWidth: (px: number) => ({ minWidth: px }),
  height: (px: number) => ({ height: px }),
  start: (px: number) => ({ insetInlineStart: px }),
  end: (px: number) => ({ insetInlineEnd: px }),
  // 详情内容让过勾选列与展开列，和第一个数据列对齐
  indent: (px: number) => ({ marginInlineStart: px, maxWidth: `calc(100cqi - ${px}px)` }),
  percent: (value: string) => ({ width: value }),
});

/** 固定列单元格的样式：position: sticky 加上按列宽累加的偏移；挨着滚动列的那一列加一条竖线 */
function stickyCellSx(column: DataTableColumn<never>, offsets: StickyOffsets) {
  if (column.sticky === 'start')
    return [
      dataTableStyles.sticky,
      dataTableDynamicStyles.start(offsets.start.get(column.key)!),
      offsets.startEdge === column.key && dataTableStyles.stickyStartEdge,
    ];
  if (column.sticky === 'end')
    return [
      dataTableStyles.sticky,
      dataTableDynamicStyles.end(offsets.end.get(column.key)!),
      offsets.endEdge === column.key && dataTableStyles.stickyEndEdge,
    ];
  return null;
}

/** 勾选列、详情列在有起始边固定列时也固定，偏移是它前面的列宽 */
function leadingStickySx(sticky: boolean, offset: number) {
  return sticky && [dataTableStyles.sticky, dataTableDynamicStyles.start(offset)];
}

/** 分组标题的固定：组里的列都固定在同一侧时跟着固定，偏移取最靠外的一列；含挨着滚动列的那一列时也画竖线 */
function groupStickySx(columns: readonly DataTableColumn<never>[], offsets: StickyOffsets) {
  const side = columns[0]?.sticky;
  if (!side || columns.some((column) => column.sticky !== side)) return null;
  const [outer, inner] =
    side === 'start' ? [columns[0]!, columns.at(-1)!] : [columns.at(-1)!, columns[0]!];
  return side === 'start'
    ? [
        dataTableStyles.sticky,
        dataTableDynamicStyles.start(offsets.start.get(outer.key)!),
        offsets.startEdge === inner.key && dataTableStyles.stickyStartEdge,
      ]
    : [
        dataTableStyles.sticky,
        dataTableDynamicStyles.end(offsets.end.get(outer.key)!),
        offsets.endEdge === inner.key && dataTableStyles.stickyEndEdge,
      ];
}

/** DataTableRow 的属性：一行要用到的全部数据；除了 row、index、selected，同一张表里各行都相同 */
export interface DataTableRowProps<T> {
  /** 这一行 */
  row: DataTableRowModel<T>;
  /** 在全部行里的序号 */
  index: number;
  /** 是否已选 */
  selected: boolean;
  /** 部分勾选（树形表格的父行） */
  partial?: boolean;
  /** 能不能勾选，默认 true */
  selectable?: boolean;
  /** 整行的色调 */
  tone?: RowTone;
  /** 主从视图里正在看的一行 */
  active?: boolean;
  /** 点了这一行 */
  onRowClick?: (row: T, key: string) => void;
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
  /** 表头有几行（分组表头是两行）：行的 aria-rowindex 从表头之后算起，默认 1 */
  headerRows?: number;
  /** 在表体里的位置（展开的详情也算一行）：测量与 aria-rowindex 用它；默认等于 index */
  position?: number;
  /** 表格有详情列 */
  detailColumn?: boolean;
  /** 这一行有详情（显示展开按钮），默认 true */
  expandable?: boolean;
  /** 详情已展开 */
  expanded?: boolean;
  /** 详情单元格的 id（展开按钮的 aria-controls） */
  detailId?: string;
  /** 详情列单元格的部件属性 */
  propsDetailToggleCell?: PartProps<'td'>;
  /** 展开按钮的部件属性 */
  propsDetailToggle?: DataTableViewProps<T>['propsDetailToggle'];
  /** 点了展开按钮 */
  onToggleDetail?: (key: string) => void;
  /** 第一个数据列前面加的东西（TreeDataTable 的缩进与展开按钮） */
  leading?: (row: DataTableRowModel<T>, index: number) => VNodeChild;
  /** 行的部件属性 */
  propsRow?: RowPartProps<T>;
  /** 单元格的部件属性 */
  propsCell?: CellPartProps<T>;
  /** 勾选列单元格的部件属性 */
  propsSelectCell?: PartProps<'td'>;
  /** 勾选框的部件属性 */
  propsSelectCheckbox?: DataTableViewProps<T>['propsSelectCheckbox'];
  /** 单选框的部件属性 */
  propsSelectRadio?: DataTableViewProps<T>['propsSelectRadio'];
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
    partial = false,
    selectable = true,
    tone,
    active = false,
    onRowClick,
    selectionMode,
    columns,
    density,
    variant,
    striped,
    offsets,
    headerRows = 1,
    position = index,
    detailColumn = false,
    expandable = true,
    expanded = false,
    detailId,
    propsDetailToggleCell,
    propsDetailToggle,
    onToggleDetail,
    leading,
    propsRow,
    propsCell,
    propsSelectCell,
    propsSelectCheckbox,
    propsSelectRadio,
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
              tone && dataTableRowToneStyles[tone],
              selected && dataTableStyles.selected,
              active && dataTableStyles.active,
              onRowClick && dataTableStyles.clickable,
            ],
          },
          typeof propsRow === 'function' ? propsRow(row.data, index) : propsRow,
          {
            ref: measure,
            'aria-rowindex': position + headerRows + 1,
            'aria-selected': selectionMode != null ? selected : undefined,
            'aria-current': active ? 'true' : undefined,
            onClick: onRowClick
              ? (event: MouseEvent) => {
                  // 点在行里的控件上：交给控件自己
                  if (
                    (event.target as Element).closest('a, button, input, select, textarea, label')
                  )
                    return;
                  onRowClick(row.data, row.key);
                }
              : undefined,
          },
        )}
        data-index={position}
        data-state={selected ? 'selected' : undefined}
        data-tone={tone}
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
                  active && dataTableStyles.activeEdge,
                ],
              },
              propsSelectCell,
            )}
          >
            {selectionMode === 'single' ? (
              // 单选：同一个 name 的原生单选框，选中由 DataTableView 提供的 RadioGroupContext 决定
              <Radio
                {...mergePartProps<Partial<RadioProps>>(
                  { sx: dataTableStyles.cellControl },
                  propsSelectRadio,
                  { disabled: !selectable, 'aria-label': lang.tableSelectRow(index + 1) },
                )}
                value={row.key}
              />
            ) : (
              <Checkbox
                {...mergePartProps<CheckboxProps>(
                  // 名称每行不同（选择第 N 行）：类型里不让使用方覆盖
                  { 'aria-label': lang.tableSelectRow(index + 1), sx: dataTableStyles.cellControl },
                  propsSelectCheckbox,
                  {
                    checked: selected,
                    indeterminate: partial,
                    disabled: !selectable,
                    onChange: () => onToggle?.(row.key),
                  },
                )}
              />
            )}
          </td>
        )}
        {detailColumn && (
          <td
            {...mergeAttrs<'td'>(
              {
                sx: [
                  dataTableStyles.cell,
                  dataTableDensityStyles[density],
                  dataTableStyles.selectCell,
                  leadingStickySx(offsets.start.size > 0, selectionMode ? SELECT_WIDTH : 0),
                  active && !selectionMode && dataTableStyles.activeEdge,
                ],
              },
              propsDetailToggleCell,
            )}
          >
            {expandable && (
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  {
                    icon: ChevronRight,
                    size: 'sm',
                    radius: 'full',
                    sx: [dataTableStyles.detailToggle, dataTableStyles.cellControl],
                    'aria-label': lang.tableRowDetails(rowLabel(columns, row)),
                  },
                  propsDetailToggle,
                  {
                    'aria-expanded': expanded,
                    'aria-controls': expanded ? detailId : undefined,
                    // 箭头的转向跟着展开状态：使用方的 propsIcon 合并进来，而不是整个替换掉
                    propsIcon: mergeProps<IconProps>(
                      { flipInRtl: true, sx: disclosureStyles.icon },
                      propsDetailToggle?.propsIcon,
                      expanded ? { sx: dataTableStyles.chevronOpen } : undefined,
                    ),
                    onClick: () => onToggleDetail?.(row.key),
                  },
                )}
              />
            )}
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
                    active &&
                      position === 0 &&
                      !selectionMode &&
                      !detailColumn &&
                      dataTableStyles.activeEdge,
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

/** 行的名称（展开按钮用）：第一列的文字，没有时用行的 key */
function rowLabel<T>(columns: readonly DataTableColumn<T>[], row: DataTableRowModel<T>): string {
  const first = columns[0] ? columnValue(columns[0], row.data) : undefined;
  return first != null && first !== '' ? String(first) : row.key;
}

/** DataTableDetailRow 的属性 */
export interface DataTableDetailRowProps<T> {
  /** 详情所属的行 */
  row: DataTableRowModel<T>;
  /** 在表体里的位置（测量与 aria-rowindex） */
  position: number;
  /** 表头有几行 */
  headerRows: number;
  /** 跨几列（全部列，含勾选列与详情列） */
  span: number;
  /** 勾选列与展开列的宽度（px）：内容让过它们，和第一个数据列对齐 */
  indent: number;
  /** 详情单元格的 id（展开按钮的 aria-controls 指向它） */
  id: string;
  /** 详情的内容 */
  renderDetail: (row: T) => VNodeChild;
  /** 详情行的部件属性 */
  propsDetailRow?: PartProps<'tr', 'aria-rowindex'>;
  /** 详情单元格的部件属性 */
  propsDetailCell?: PartProps<'td', 'colspan'>;
  /** 测量行高（虚拟滚动） */
  measure: (element: unknown) => void;
}

/** 展开的详情：一行一个跨全部列的单元格；单独成组件，滚动时没变的详情不必重渲 */
export const DataTableDetailRow = _component(
  <T,>({
    row,
    position,
    headerRows,
    span,
    indent,
    id,
    renderDetail,
    propsDetailRow,
    propsDetailCell,
    measure,
  }: DataTableDetailRowProps<T>) =>
    () => (
      <tr
        {...mergeAttrs<'tr'>({}, propsDetailRow, {
          ref: measure,
          'aria-rowindex': position + headerRows + 1,
        })}
        data-index={position}
        data-detail=""
      >
        <td
          {...mergeAttrs<'td'>(
            { sx: [dataTableStyles.cell, dataTableStyles.detailCell] },
            propsDetailCell,
            { id, colspan: span },
          )}
        >
          <div
            {...stylex.attrs(dataTableStyles.detailContent, dataTableDynamicStyles.indent(indent))}
          >
            {renderDetail(row.data)}
          </div>
        </td>
      </tr>
    ),
);

/** 表体里的一行：数据行，或某一行展开的详情 */
interface BodyEntry<T> {
  /** 所属的数据行 */
  row: DataTableRowModel<T>;
  /** 数据行在 rows 里的序号 */
  index: number;
  /** 是这一行的详情 */
  detail: boolean;
}

/** 表格的渲染层：虚拟滚动的行、吸顶表头、固定列、排序、勾选、列宽调整、加载与空状态 */
export const DataTableView = _component(
  <T,>({
    rows,
    columns,
    sort,
    onSortClick,
    selectionMode,
    selectedKeys = [],
    partialKeys,
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
    handle,
    rowTone,
    activeKey,
    onRowClick,
    isRowSelectable,
    hiddenColumns,
    summaryLabel,
    columnGroups,
    renderDetail,
    hasDetail,
    expandedRows,
    onToggleDetail,
    propsRoot,
    propsRow,
    propsCell,
    propsHeaderCell,
    propsGroupHeaderCell,
    propsEmpty,
    propsSkeleton,
    propsSortButton,
    propsResizer,
    propsSortLabel,
    propsHead,
    propsHeadRow,
    propsSelectHeaderCell,
    propsSelectCell,
    propsSelectAll,
    propsSelectCheckbox,
    propsSelectRadio,
    propsLeading,
    propsContent,
    propsProgress,
    propsEmptyCell,
    propsFoot,
    propsSummaryCell,
    propsDetailHeaderCell,
    propsDetailToggleCell,
    propsDetailToggle,
    propsDetailRow,
    propsDetailCell,
    ...rest
  }: DataTableViewProps<T>) => {
    const lang = useLang();
    const format = useFormat();
    // 骨架、进度条防闪烁；aria-busy 与空状态按真实的 loading
    const indicator = useDelayedLoading(() => loading);
    const selectedSet = _derived.by(() => new Set(selectedKeys));
    const partialSet = _derived.by(() => new Set(partialKeys));
    // 单选：各行的 Radio 接入这一组（同一个 name，方向键在可见的行之间移动），选中即写回
    const radioName = useId();
    RadioGroupContext.provide({
      get value() {
        return selectedKeys[0] ?? null;
      },
      name: radioName,
      disabled: false,
      readonly: false,
      required: false,
      invalid: false,
      size: undefined,
      tone: 'accent',
      select: (key) => onToggleRow?.(key),
    });
    // 遍历全部行：放在派生里，滚动时的重新渲染不必再算一遍；全选只看能勾选的行
    const selectableRows = _derived(
      isRowSelectable ? rows.filter((row) => isRowSelectable(row.data)) : rows,
    );
    const allSelected = _derived(
      selectableRows.length > 0 && selectableRows.every((row) => selectedSet.has(row.key)),
    );
    const someSelected = _derived(
      !allSelected && selectableRows.some((row) => selectedSet.has(row.key)),
    );
    const hidden = _derived.by(() => new Set(hiddenColumns ?? []));
    const visibleColumns = _derived(
      hidden.size > 0 ? columns.filter((column) => !hidden.has(column.key)) : columns,
    );
    let viewport = _state.raw<HTMLElement | null>(null);
    let body = _state.raw<HTMLElement | null>(null);
    let head = _state.raw<HTMLElement | null>(null);
    let foot = _state.raw<HTMLElement | null>(null);
    // 骨架铺满表体到窗口底边（第一次加载时表格还没有高度，只放几行显得没铺开）；
    // 行高量已经画出来的第一行骨架，估计值与实际差几 px，几十行下来就差出一截
    let skeletonRows = _state(SKELETON_ROWS.min);
    _effect(() => {
      if (!indicator.value || !body || rows.length > 0) return;
      const drawn = (body.firstElementChild as HTMLElement | null)?.offsetHeight;
      const rowHeight = drawn || (estimateRowHeight ?? ROW_HEIGHT[density]);
      const space = window.innerHeight - body.getBoundingClientRect().top;
      skeletonRows = clamp(Math.ceil(space / rowHeight), SKELETON_ROWS.min, SKELETON_ROWS.max);
    });

    const detailIdPrefix = useId();
    const detailId = (index: number) => `${detailIdPrefix}-detail-${index}`;
    const expandedSet = _derived.by(() => new Set(expandedRows ?? []));
    /** 表体里的各行：展开了详情的行后面跟它的详情；没有展开的详情时为 null，直接用 rows */
    const entries = _derived.by((): BodyEntry<T>[] | null => {
      if (!renderDetail || expandedSet.size === 0) return null;
      const list: BodyEntry<T>[] = [];
      rows.forEach((row, index) => {
        list.push({ row, index, detail: false });
        // 展开记录里可能留着已经没有详情的行（数据变了）：只给还有详情的行出详情
        if (expandedSet.has(row.key) && (hasDetail?.(row.data) ?? true)) {
          list.push({ row, index, detail: true });
        }
      });
      return list;
    });
    const entryAt = (position: number): BodyEntry<T> =>
      entries ? entries[position]! : { row: rows[position]!, index: position, detail: false };

    const virtual = useVirtualizer(() => {
      const current = rows;
      const list = entries;
      // 先读出来：估计行高对每一行都要调用一次（几万行），每次都经过 props 的响应式读取很慢
      const rowHeight = estimateRowHeight ?? ROW_HEIGHT[density];
      return {
        count: list?.length ?? current.length,
        scrollElement: viewport,
        list: body,
        estimateSize: (position: number) => (list?.[position]?.detail ? DETAIL_HEIGHT : rowHeight),
        // 详情的 key 是行的 key 加一个不会出现在 key 里的分隔：与数据行的 key 不会重复
        getItemKey: (position: number) => {
          if (!list) return current[position]!.key;
          const entry = list[position]!;
          return entry.detail ? `${entry.row.key}\u0000detail` : entry.row.key;
        },
        overscan: 8,
        onRangeChange,
        // 表头吸顶、合计行吸底：滚动到某一行时停在它们之间，不被挡住
        scrollPaddingStart: () => head?.offsetHeight ?? 0,
        scrollPaddingEnd: () => foot?.offsetHeight ?? 0,
      };
    });

    // 挂载之后才交出 handle：使用方在回调里立即滚动（打开页面就定位到某一行）也能生效
    const api: DataTableHandle = {
      scrollToRow(key, options) {
        const position = entries
          ? entries.findIndex((entry) => !entry.detail && entry.row.key === key)
          : rows.findIndex((row) => row.key === key);
        if (position < 0) return false;
        virtual.scrollToIndex(position, options);
        return true;
      },
    };
    watch(
      () => viewport,
      (element) => {
        if (element) handle?.(api);
      },
      { flush: 'post' },
    );

    // 每列的值类型（没写 type 时看第一个非空值）拼成字符串：类型没变时 shown 保持同一个引用，行组件不必重渲
    const types = _derived(
      visibleColumns
        .map((column) =>
          columnType(
            column,
            (function* () {
              for (const row of rows) yield row.data;
            })(),
          ),
        )
        .join('|'),
    );
    /** 一个值的显示：空值显示 empty（默认 —），状态显示成 StatusBadge（外观跟随 defaults.Badge），其余按类型与 format 格式化 */
    const display = (
      column: DataTableColumn<T>,
      type: keyof ColumnTypes,
      value: ReturnType<typeof columnValue>,
    ): VNodeChild => {
      if (value == null || value === '') return column.empty ?? lang.emptyValue;
      if (column.statuses) return <StatusBadge statuses={column.statuses} value={String(value)} />;
      return formatCell(value, type, format, column.format);
    };

    /** 补上默认对齐与格式化的列：没写 align、cell 的列按值类型来 */
    const shown = _derived.by(() => {
      const list = types.split('|') as (keyof ColumnTypes)[];
      return visibleColumns.map((column, position): DataTableColumn<T> => {
        const type = list[position]!;
        return {
          ...column,
          align: column.align ?? (column.statuses ? 'start' : columnAlign(type)),
          cell: column.cell ?? ((row) => display(column, type, columnValue(column, row))),
        };
      });
    });
    const hasSummary = _derived(visibleColumns.some((column) => column.summary != null));
    // 有可见的分组时表头两行：第一行是分组标题与没分组的列（跨两行），第二行是组里的列
    const layout = _derived.by(() =>
      columnGroups?.length ? headerLayout(shown, columnGroups) : null,
    );
    const headerRows = _derived(layout?.some((cell) => cell.kind === 'group') ? 2 : 1);

    // 合计只随数据与列变：放在派生值里，滚动时（虚拟列表每换一次可见范围都重新渲染）不再逐行重算
    const rowData = _derived.by(() => rows.map((row) => row.data));
    const sums = _derived.by(() =>
      hasSummary
        ? shown.map((column) => (column.summary === 'sum' ? sumColumn(column, rowData) : null))
        : [],
    );

    /** 合计行里一列的内容 */
    function summaryOf(column: DataTableColumn<T>, position: number): VNodeChild {
      if (column.summary === 'sum') {
        const type = (types.split('|')[position] ?? 'number') as keyof ColumnTypes;
        const total = sums[position];
        return total == null ? (column.empty ?? lang.emptyValue) : display(column, type, total);
      }
      if (column.summary) return column.summary(rowData);
      return position === 0 ? (summaryLabel ?? lang.tableSummary) : null;
    }

    /** 列的宽度：调整过的、列定义里的，或者没有（与其他没写宽度的列平分） */
    const widthOf = (column: DataTableColumn<T>) => widths[column.key] ?? column.width;

    const leadingWidth = () =>
      (selectionMode ? SELECT_WIDTH : 0) + (renderDetail ? DETAIL_WIDTH : 0);
    const bodyRowCount = () => entries?.length ?? rows.length;
    // 偏移没变时沿用上一次的对象：它交给每一行，调整非固定列的宽度（每次指针移动）时各行不必重渲染
    let lastOffsets: StickyOffsets | undefined;
    const offsets = _derived.by(() => {
      const next = stickyOffsets(shown, widthOf, leadingWidth());
      if (lastOffsets && sameStickyOffsets(lastOffsets, next)) return lastOffsets;
      return (lastOffsets = next);
    });
    const minWidth = () => tableMinWidth(shown, widthOf, leadingWidth());

    /** 一个列标题；rowspan 是没分组的列在两行表头里跨两行，divider 是与分组相邻的竖线 */
    function renderHeaderCell(column: DataTableColumn<T>, rowspan = 1, divider = false) {
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
                divider && dataTableStyles.groupDivider,
              ],
            },
            own,
            {
              scope: 'col',
              rowspan: rowspan > 1 ? rowspan : undefined,
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

    /** 一个分组标题：跨组里的几列 */
    function renderGroupCell(
      group: DataTableColumnGroup,
      members: DataTableColumn<T>[],
      key: string,
      divider: boolean,
    ) {
      return (
        <th
          key={key}
          {...mergeAttrs<'th'>(
            {
              sx: [
                dataTableStyles.headerCell,
                dataTableDensityStyles[density],
                dataTableStyles.groupHeaderCell,
                groupStickySx(members, offsets),
                divider && dataTableStyles.groupDivider,
              ],
            },
            typeof propsGroupHeaderCell === 'function'
              ? propsGroupHeaderCell(group)
              : propsGroupHeaderCell,
            { scope: 'colgroup', colspan: members.length },
          )}
        >
          {group.header}
        </th>
      );
    }

    /** 表头的列标题：一行；有分组时两行 */
    function renderHeaderRows(selectHeader: VNodeChild, detailHeader: VNodeChild) {
      const cells = layout;
      if (!cells || headerRows === 1)
        return (
          <tr {...mergeAttrs<'tr'>({}, propsHeadRow, { 'aria-rowindex': 1 })}>
            {selectHeader}
            {detailHeader}
            {shown.map((column) => renderHeaderCell(column))}
          </tr>
        );
      const nextToGroup = (position: number) =>
        position > 0 &&
        (cells[position]!.kind === 'group' || cells[position - 1]!.kind === 'group');
      return [
        <tr key="groups" {...mergeAttrs<'tr'>({}, propsHeadRow, { 'aria-rowindex': 1 })}>
          {selectHeader}
          {detailHeader}
          {cells.map((cell, position) =>
            cell.kind === 'group'
              ? renderGroupCell(
                  cell.group,
                  cell.columns,
                  `${cell.group.key}-${position}`,
                  nextToGroup(position),
                )
              : renderHeaderCell(cell.column, 2, nextToGroup(position)),
          )}
        </tr>,
        <tr key="columns" {...mergeAttrs<'tr'>({}, propsHeadRow, { 'aria-rowindex': 2 })}>
          {cells.flatMap((cell, position) =>
            cell.kind === 'group'
              ? cell.columns.map((column, index) =>
                  renderHeaderCell(column, 1, index === 0 && position > 0),
                )
              : [],
          )}
        </tr>,
      ];
    }

    return () => {
      const span = shown.length + (selectionMode ? 1 : 0) + (renderDetail ? 1 : 0);
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
                // 合计行只在有数据时渲染（见 tfoot），没渲染时不算进总行数
                'aria-rowcount':
                  bodyRowCount() + headerRows + (hasSummary && rows.length > 0 ? 1 : 0),
                'aria-busy': loading || undefined,
              },
            )}
          >
            <colgroup>
              {selectionMode && (
                <col {...stylex.attrs(dataTableDynamicStyles.width(SELECT_WIDTH))} />
              )}
              {renderDetail && (
                <col {...stylex.attrs(dataTableDynamicStyles.width(DETAIL_WIDTH))} />
              )}
              {shown.map((column) => {
                const width = widthOf(column);
                return (
                  <col
                    key={column.key}
                    {...(width != null ? stylex.attrs(dataTableDynamicStyles.width(width)) : {})}
                  />
                );
              })}
            </colgroup>
            <thead
              {...mergeAttrs<'thead'>({ sx: dataTableStyles.head }, propsHead, {
                ref: _toRef(head),
              })}
            >
              {renderHeaderRows(
                selectionMode && (
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
                      { scope: 'col', rowspan: headerRows > 1 ? headerRows : undefined },
                    )}
                  >
                    {selectionMode === 'single' && (
                      // 单选没有全选：这一列的标题只给读屏
                      <VisuallyHidden>{lang.tableSelectColumn}</VisuallyHidden>
                    )}
                    {selectionMode === 'multiple' && (
                      <Checkbox
                        {...mergePartProps<CheckboxProps>(
                          { 'aria-label': lang.tableSelectAll, sx: dataTableStyles.cellControl },
                          propsSelectAll,
                          {
                            checked: allSelected,
                            indeterminate: someSelected,
                            disabled: selectableRows.length === 0,
                            onChange: () => onToggleAll?.(),
                          },
                        )}
                      />
                    )}
                  </th>
                ),
                renderDetail && (
                  <th
                    {...mergeAttrs<'th'>(
                      {
                        sx: [
                          dataTableStyles.headerCell,
                          dataTableDensityStyles[density],
                          dataTableStyles.selectCell,
                          leadingStickySx(offsets.start.size > 0, selectionMode ? SELECT_WIDTH : 0),
                        ],
                      },
                      propsDetailHeaderCell,
                      { scope: 'col', rowspan: headerRows > 1 ? headerRows : undefined },
                    )}
                  >
                    <span {...stylex.attrs(visuallyHiddenStyles.hidden)}>{lang.tableDetails}</span>
                  </th>
                ),
              )}
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
                Array.from({ length: skeletonRows }, (_, index) => (
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
                    {renderDetail && (
                      <td
                        {...stylex.attrs(dataTableStyles.cell, dataTableDensityStyles[density])}
                      />
                    )}
                    {shown.map((column, position) => (
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
                              // 同一行的单元格一起扫，行与行依次错开：一道波从上往下推过表格
                              delay: index * SHIMMER_STAGGER,
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
                const { row, index, detail } = entryAt(item.index);
                if (detail && renderDetail)
                  return (
                    <DataTableDetailRow
                      key={item.key as string}
                      row={row}
                      position={item.index}
                      headerRows={headerRows}
                      span={span}
                      indent={leadingWidth()}
                      id={detailId(index)}
                      renderDetail={renderDetail}
                      propsDetailRow={propsDetailRow}
                      propsDetailCell={propsDetailCell}
                      measure={virtual.measure}
                    />
                  );
                return (
                  <DataTableRow
                    key={row.key}
                    row={row}
                    index={index}
                    position={item.index}
                    detailColumn={renderDetail != null}
                    expandable={hasDetail ? hasDetail(row.data) : true}
                    expanded={expandedSet.has(row.key)}
                    detailId={detailId(index)}
                    propsDetailToggleCell={propsDetailToggleCell}
                    propsDetailToggle={propsDetailToggle}
                    onToggleDetail={onToggleDetail}
                    selected={selectionMode != null && selectedSet.has(row.key)}
                    partial={partialSet.has(row.key)}
                    selectable={isRowSelectable ? isRowSelectable(row.data) : true}
                    tone={rowTone?.(row.data)}
                    active={activeKey != null && activeKey === row.key}
                    onRowClick={onRowClick}
                    selectionMode={selectionMode}
                    columns={shown}
                    density={density}
                    variant={variant}
                    striped={striped}
                    offsets={offsets}
                    headerRows={headerRows}
                    leading={leading}
                    propsRow={propsRow}
                    propsCell={propsCell}
                    propsSelectCell={propsSelectCell}
                    propsSelectCheckbox={propsSelectCheckbox}
                    propsSelectRadio={propsSelectRadio}
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
            {hasSummary && rows.length > 0 && (
              <tfoot
                {...mergeAttrs<'tfoot'>({ sx: dataTableStyles.foot }, propsFoot, {
                  ref: _toRef(foot),
                })}
              >
                <tr aria-rowindex={bodyRowCount() + headerRows + 1}>
                  {selectionMode && (
                    <td
                      {...stylex.attrs(
                        dataTableStyles.cell,
                        dataTableDensityStyles[density],
                        dataTableStyles.summaryCell,
                        offsets.start.size > 0 && dataTableStyles.stickySelect,
                      )}
                    />
                  )}
                  {renderDetail && (
                    <td
                      {...stylex.attrs(
                        dataTableStyles.cell,
                        dataTableDensityStyles[density],
                        dataTableStyles.summaryCell,
                        leadingStickySx(offsets.start.size > 0, selectionMode ? SELECT_WIDTH : 0),
                      )}
                    />
                  )}
                  {shown.map((column, position) => (
                    <td
                      key={column.key}
                      {...mergeAttrs<'td'>(
                        {
                          sx: [
                            dataTableStyles.cell,
                            dataTableDensityStyles[density],
                            dataTableStyles.summaryCell,
                            dataTableStyles[column.align ?? 'start'],
                            stickyCellSx(column, offsets),
                          ],
                        },
                        typeof propsSummaryCell === 'function'
                          ? propsSummaryCell(column)
                          : propsSummaryCell,
                      )}
                    >
                      {summaryOf(column, position)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </ScrollArea>
      );
    };
  },
  { name: 'DataTableView' },
);
