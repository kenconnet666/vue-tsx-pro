/**
 * 表格的渲染层：Table、TreeTable 共用（同 Listbox 与 ListboxView 的分工）。只管画，状态（排序、选择、展开、列宽）由外层决定。
 *
 * - 结构：原生 table（读屏按表格念：第几行第几列、列标题）+ table-layout: fixed + colgroup 定列宽，
 *   外层是 ScrollArea（两个方向滚动，视口可聚焦，键盘也能滚）。
 * - 虚拟滚动（useVirtualizer）：只渲染看得见的行，上下各一行占位撑出滚动高度（各列仍在同一张表里对齐）；
 *   行带 aria-rowindex，表格带 aria-rowcount，读屏知道总行数与当前位置。
 * - 吸顶表头、固定列：position: sticky，固定列的偏移按列宽累加（逻辑方向，从右到左排版自动换边）；
 *   固定列的单元格继承行的底色，盖住滚过去的内容。
 * - 排序：可排序的列标题是按钮，th 带 aria-sort；勾选列用 Checkbox（表头的全选有部分选中状态）。
 * - 列宽：表头右侧的手柄拖动（startMove）或聚焦后用 ← / →（WCAG 2.5.7 的替代操作）调整，role="separator"。
 * - 加载：没有数据时显示骨架行；已有数据（刷新中）时表头下方显示一条进度条；表格带 aria-busy。没有数据时显示 Empty。
 */
import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useLang } from '../config/context';
import { Empty, type EmptyProps } from '../feedback/Empty';
import { Progress } from '../feedback/Progress';
import { Skeleton, type SkeletonProps } from '../feedback/Skeleton';
import { Checkbox } from '../input/Checkbox';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { isRtl } from '../utils/data/layout';
import { startMove } from '../utils/dom/move';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { plainText } from '../utils/data/text';
import { useVirtualizer } from '../utils/virtual/use-virtualizer';
import type { VisibleRange } from '../utils/virtual/virtualizer';
import { columnValue, type SortState, type TableColumn } from './columns';

/** 表格的密度 */
export interface TableSizes {
  /** 紧凑：数据很多、要一屏看更多行 */
  sm: unknown;
  /** 默认 */
  md: unknown;
  /** 宽松：行里有头像、两行文字 */
  lg: unknown;
}

/** 表格的样式 */
export interface TableVariants {
  /** 表面色、外框与圆角（默认） */
  surface: unknown;
  /** 没有外框，底色同页面：放在卡片、对话框里 */
  ghost: unknown;
}

/** 表格的外观选项；可以用 createUi / Provider 的 defaults.Table 统一改默认值（TreeTable 也用它） */
export interface TableOptions {
  /** 密度，默认 md */
  size?: keyof TableSizes;
  /** 样式，默认 surface */
  variant?: keyof TableVariants;
  /** 斑马纹：隔行浅色底 */
  striped?: boolean;
}

/** 选择方式 */
export interface TableSelections {
  /** 单选：勾选一行会取消其他行 */
  single: unknown;
  /** 多选：表头有全选 */
  multiple: unknown;
}

/** 要渲染的一行：Table 是平铺的行，TreeTable 是展开后的树（带层级） */
export interface TableRowModel<T> {
  /** 行的 key（选择、展开、测量都按它） */
  key: string;
  /** 这一行的数据 */
  data: T;
  /** 层级（TreeTable），从 0 开始 */
  depth: number;
}

/** 行、单元格的部件属性：可以按行（与列）计算 */
type RowPartProps<T> = PartProps<'tr'> | ((row: T, index: number) => PartProps<'tr'>);
type CellPartProps<T> = PartProps<'td'> | ((row: T, column: TableColumn<T>) => PartProps<'td'>);

/** TableView 的属性；未声明的属性落到 table 上（aria-label 或 aria-labelledby 是表格的名称） */
export interface TableViewProps<T> extends PartProps<'table', 'role'>, TableOptions {
  /** 要渲染的行（已排序、已按展开状态展开） */
  rows: readonly TableRowModel<T>[];
  /** 列 */
  columns: readonly TableColumn<T>[];
  /** 当前排序 */
  sort?: SortState | null;
  /** 点了可排序的列标题 */
  onSortClick?: (key: string) => void;
  /** 选择方式；不写时没有勾选列 */
  selection?: keyof TableSelections;
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
  /** 第一个数据列的单元格内容前面加的东西（TreeTable 的缩进与展开按钮） */
  leading?: (row: TableRowModel<T>, index: number) => VNodeChild;
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
  propsHeaderCell?: PartProps<'th'> | ((column: TableColumn<T>) => PartProps<'th'>);
  /** 空状态的部件属性 */
  propsEmpty?: Partial<EmptyProps>;
  /** 加载中占位的部件属性 */
  propsSkeleton?: Partial<SkeletonProps>;
}

/** 勾选列的宽度（px） */
const SELECT_WIDTH = 44;
/** 没写宽度的列，表格最小宽度按这么宽算（px） */
const FLEX_MIN = 120;
/** 加载中显示几行骨架 */
const SKELETON_ROWS = 6;
/** 键盘调整列宽的步长（px） */
const RESIZE_STEP = 16;
/** 各密度下行高的估计（px） */
const ROW_HEIGHT: Record<keyof TableSizes, number> = { sm: 36, md: 44, lg: 52 };

const styles = stylex.create({
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
  sm: { fontSize: '_sm' },
  md: {},
  lg: {},
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
  sortButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    maxWidth: '_full',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: 'inherit', ':hover': '_text' },
    font: 'inherit',
    textAlign: 'inherit',
    cursor: 'pointer',
  },
  sortLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
  sortIcon: { flexShrink: 0 },
  sortActive: { color: '_accentText' },
  resize: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    insetInlineEnd: 0,
    width: '_space.sm',
    cursor: 'col-resize',
    touchAction: 'none',
    // 手柄是表头右边的一条细线：悬停、聚焦、拖动时显示
    backgroundColor: {
      default: 'transparent',
      ':hover': '_borderStrong',
      ':focus-visible': '_accent',
    },
    outlineStyle: 'none',
  },
  leading: { display: 'flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
  content: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
  spacer: { padding: 0, borderWidth: 0 },
  progressCell: { position: 'relative', height: 0, padding: 0, borderWidth: 0 },
  progress: { position: 'absolute', top: 0, insetInline: 0 },
  skeleton: { display: 'block', height: '1em' },
  emptyCell: { padding: 0, whiteSpace: 'normal' },
});

const sizeStyles = stylex.create({
  sm: { paddingBlock: '_xs' },
  md: { paddingBlock: '_sm' },
  lg: { paddingBlock: '_md' },
});

// 列宽、偏移、占位高度是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
const dynamicStyles = stylex.create({
  width: (px: number) => ({ width: px }),
  minWidth: (px: number) => ({ minWidth: px }),
  height: (px: number) => ({ height: px }),
  start: (px: number) => ({ insetInlineStart: px }),
  end: (px: number) => ({ insetInlineEnd: px }),
  percent: (value: string) => ({ width: value }),
});

/** 表格的渲染层：虚拟滚动的行、吸顶表头、固定列、排序、勾选、列宽调整、加载与空状态 */
export const TableView = _component(
  <T,>({
    rows,
    columns,
    sort,
    onSortClick,
    selection,
    selectedKeys = [],
    onToggleRow,
    onToggleAll,
    widths,
    onResize,
    resizable = false,
    loading = false,
    empty,
    leading,
    size = 'md',
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
    ...rest
  }: TableViewProps<T>) => {
    const lang = useLang();
    const selectedSet = _derived.by(() => new Set(selectedKeys));
    let viewport = _state.raw<HTMLElement | null>(null);
    let body = _state.raw<HTMLElement | null>(null);

    const virtual = useVirtualizer(() => {
      const current = rows;
      return {
        count: current.length,
        scrollElement: viewport,
        list: body,
        estimateSize: () => estimateRowHeight ?? ROW_HEIGHT[size],
        getItemKey: (index: number) => current[index]!.key,
        overscan: 8,
        onRangeChange,
      };
    });

    /** 列的宽度：调整过的、列定义里的，或者没有（与其他没写宽度的列平分） */
    const widthOf = (column: TableColumn<T>) => widths[column.key] ?? column.width;

    /** 固定列的偏移：起始边的从勾选列之后累加，结束边的从末尾往回累加 */
    const offsets = _derived.by(() => {
      const start = new Map<string, number>();
      const end = new Map<string, number>();
      let offset = selection ? SELECT_WIDTH : 0;
      for (const column of columns) {
        if (column.sticky !== 'start') continue;
        start.set(column.key, offset);
        offset += widthOf(column) ?? FLEX_MIN;
      }
      offset = 0;
      for (const column of [...columns].reverse()) {
        if (column.sticky !== 'end') continue;
        end.set(column.key, offset);
        offset += widthOf(column) ?? FLEX_MIN;
      }
      return { start, end, selectionSticky: start.size > 0 };
    });

    /** 表格的最小宽度：写了宽度的列按宽度，没写的按 FLEX_MIN；放不下时横向滚动 */
    const minWidth = () =>
      (selection ? SELECT_WIDTH : 0) +
      columns.reduce((total, column) => total + (widthOf(column) ?? FLEX_MIN), 0);

    function stickySx(column: TableColumn<T>) {
      if (column.sticky === 'start')
        return [styles.sticky, dynamicStyles.start(offsets.start.get(column.key)!)];
      if (column.sticky === 'end')
        return [styles.sticky, dynamicStyles.end(offsets.end.get(column.key)!)];
      return null;
    }

    function startResize(event: PointerEvent, column: TableColumn<T>) {
      const cell = (event.currentTarget as HTMLElement).parentElement!;
      const from = cell.getBoundingClientRect().width;
      const rtl = isRtl(cell);
      const min = column.minWidth ?? 64;
      event.preventDefault();
      startMove(event, {
        onMove: ({ deltaX }) =>
          onResize?.(column.key, Math.max(min, from + (rtl ? -deltaX : deltaX))),
      });
    }

    function onResizeKeydown(event: KeyboardEvent, column: TableColumn<T>) {
      const cell = (event.currentTarget as HTMLElement).parentElement!;
      const rtl = isRtl(cell);
      const steps: Record<string, number> = {
        ArrowRight: rtl ? -RESIZE_STEP : RESIZE_STEP,
        ArrowLeft: rtl ? RESIZE_STEP : -RESIZE_STEP,
      };
      const step = steps[event.key];
      if (step === undefined) return;
      event.preventDefault();
      const from = widthOf(column) ?? cell.getBoundingClientRect().width;
      onResize?.(column.key, Math.max(column.minWidth ?? 64, from + step));
    }

    function renderHeaderCell(column: TableColumn<T>) {
      const own = typeof propsHeaderCell === 'function' ? propsHeaderCell(column) : propsHeaderCell;
      const sorted = sort?.key === column.key ? sort.direction : undefined;
      const label = plainText(column.header);
      const canResize = column.resizable ?? resizable;
      return (
        <th
          key={column.key}
          {...elementProps(
            mergeProps<'th'>(
              {
                sx: [
                  styles.headerCell,
                  sizeStyles[size],
                  styles[column.align ?? 'start'],
                  stickySx(column),
                ],
              },
              own,
              {
                scope: 'col',
                'aria-sort': column.sortable ? (sorted ?? 'none') : undefined,
              },
            ),
          )}
          data-sticky={column.sticky}
        >
          {column.sortable ? (
            <button
              {...elementProps(
                mergeProps<'button'>(
                  { sx: [styles.sortButton, focusRingStyles.visible] },
                  {},
                  { type: 'button', onClick: () => onSortClick?.(column.key) },
                ),
              )}
            >
              <span {...stylex.attrs(styles.sortLabel)}>{column.header}</span>
              <Icon
                icon={
                  sorted === 'ascending'
                    ? ArrowUp
                    : sorted === 'descending'
                      ? ArrowDown
                      : ArrowUpDown
                }
                sx={[styles.sortIcon, sorted && styles.sortActive]}
              />
            </button>
          ) : (
            column.header
          )}
          {canResize && (
            <span
              role="separator"
              tabindex={0}
              aria-orientation="vertical"
              aria-label={lang.tableResizeColumn(label ?? column.key)}
              aria-valuenow={widthOf(column)}
              aria-valuemin={column.minWidth ?? 64}
              {...stylex.attrs(styles.resize)}
              onPointerdown={(event: PointerEvent) => startResize(event, column)}
              onKeydown={(event: KeyboardEvent) => onResizeKeydown(event, column)}
            />
          )}
        </th>
      );
    }

    function renderRow(row: TableRowModel<T>, index: number, measured: boolean) {
      const own = typeof propsRow === 'function' ? propsRow(row.data, index) : propsRow;
      const selected = selection != null && selectedSet.has(row.key);
      return (
        <tr
          key={row.key}
          {...elementProps(
            mergeProps<'tr'>(
              {
                sx: [
                  variant === 'ghost' ? styles.rowGhost : styles.row,
                  striped && index % 2 === 1 && styles.striped,
                  selected && styles.selected,
                ],
              },
              own,
              {
                ref: measured ? virtual.measure : undefined,
                'aria-rowindex': index + 2,
                'aria-selected': selection != null ? selected : undefined,
              },
            ),
          )}
          data-index={index}
          data-state={selected ? 'selected' : undefined}
        >
          {selection && (
            <td
              {...stylex.attrs(
                styles.cell,
                sizeStyles[size],
                styles.selectCell,
                offsets.selectionSticky && styles.stickySelect,
              )}
            >
              <Checkbox
                checked={selected}
                aria-label={lang.tableSelectRow(index + 1)}
                onChange={() => onToggleRow?.(row.key)}
              />
            </td>
          )}
          {columns.map((column, position) => {
            const cellProps =
              typeof propsCell === 'function' ? propsCell(row.data, column) : propsCell;
            const value = column.cell
              ? column.cell(row.data, index)
              : String(columnValue(column, row.data) ?? '');
            return (
              <td
                key={column.key}
                {...elementProps(
                  mergeProps<'td'>(
                    {
                      sx: [
                        styles.cell,
                        sizeStyles[size],
                        styles[column.align ?? 'start'],
                        column.wrap && styles.wrap,
                        stickySx(column),
                      ],
                    },
                    cellProps,
                  ),
                )}
              >
                {position === 0 && leading ? (
                  <div {...stylex.attrs(styles.leading)}>
                    {leading(row, index)}
                    <div {...stylex.attrs(styles.content)}>{value}</div>
                  </div>
                ) : (
                  value
                )}
              </td>
            );
          })}
        </tr>
      );
    }

    return () => {
      const span = columns.length + (selection ? 1 : 0);
      const items = virtual.items;
      const top = items[0]?.start ?? 0;
      const bottom = items.length ? virtual.total - items.at(-1)!.end : 0;
      const allSelected = rows.length > 0 && rows.every((row) => selectedSet.has(row.key));
      const someSelected = !allSelected && rows.some((row) => selectedSet.has(row.key));
      return (
        <ScrollArea
          {...mergePartProps<ScrollAreaProps>(
            {
              axis: 'both',
              sx: [styles.root, variant === 'ghost' ? styles.ghost : styles.surface],
            },
            propsRoot,
            { propsViewport: { ref: _toRef(viewport) } },
          )}
        >
          <table
            {...elementProps(
              mergeProps<'table'>(
                { sx: [styles.table, styles[size], dynamicStyles.minWidth(minWidth())] },
                rest,
                {
                  'aria-rowcount': rows.length + 1,
                  'aria-busy': loading || undefined,
                },
              ),
            )}
          >
            <colgroup>
              {selection && <col {...stylex.attrs(dynamicStyles.width(SELECT_WIDTH))} />}
              {columns.map((column) => {
                const width = widthOf(column);
                return (
                  <col
                    key={column.key}
                    {...(width != null ? stylex.attrs(dynamicStyles.width(width)) : {})}
                  />
                );
              })}
            </colgroup>
            <thead {...stylex.attrs(styles.head)}>
              <tr aria-rowindex={1}>
                {selection && (
                  <th
                    scope="col"
                    {...stylex.attrs(
                      styles.headerCell,
                      sizeStyles[size],
                      styles.selectCell,
                      offsets.selectionSticky && styles.stickySelect,
                    )}
                  >
                    {selection === 'multiple' && (
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        disabled={rows.length === 0}
                        aria-label={lang.tableSelectAll}
                        onChange={() => onToggleAll?.()}
                      />
                    )}
                  </th>
                )}
                {columns.map(renderHeaderCell)}
              </tr>
              {loading && rows.length > 0 && (
                <tr aria-hidden="true">
                  <td colspan={span} {...stylex.attrs(styles.progressCell)}>
                    <div {...stylex.attrs(styles.progress)}>
                      <Progress size="xs" aria-label={lang.loading} />
                    </div>
                  </td>
                </tr>
              )}
            </thead>
            <tbody ref={_toRef(body)}>
              {rows.length === 0 &&
                loading &&
                Array.from({ length: SKELETON_ROWS }, (_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    aria-hidden="true"
                    {...stylex.attrs(variant === 'ghost' ? styles.rowGhost : styles.row)}
                  >
                    {selection && <td {...stylex.attrs(styles.cell, sizeStyles[size])} />}
                    {columns.map((column, position) => (
                      <td key={column.key} {...stylex.attrs(styles.cell, sizeStyles[size])}>
                        <Skeleton
                          {...mergePartProps<SkeletonProps>(
                            {
                              sx: [
                                styles.skeleton,
                                dynamicStyles.percent(`${90 - ((index + position) % 4) * 15}%`),
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
                  <td colspan={span} {...stylex.attrs(styles.cell, styles.emptyCell)}>
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
                  <td colspan={span} {...stylex.attrs(styles.spacer, dynamicStyles.height(top))} />
                </tr>
              )}
              {items.map((item) => renderRow(rows[item.index]!, item.index, true))}
              {bottom > 0 && (
                <tr aria-hidden="true">
                  <td
                    colspan={span}
                    {...stylex.attrs(styles.spacer, dynamicStyles.height(bottom))}
                  />
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      );
    };
  },
  { name: 'TableView' },
);
