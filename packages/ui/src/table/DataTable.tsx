/**
 * 数据表格：按列定义渲染一组行，始终虚拟滚动（十万行也只渲染看得见的几十行）。渲染层见 DataTableView。
 *
 *   <DataTable
 *     rows={orders}
 *     columns={columns}
 *     rowKey={(order) => order.id}
 *     sort={_bind(sort)}
 *     selectionMode="multiple"
 *     selected={_bind(picked)}
 *     loading={loading}
 *     aria-label="订单"
 *     propsRoot={{ sx: styles.tableHeight }}
 *   />
 *
 * - 高度：外层滚动区域默认最高 32em，用 propsRoot 的 sx 改；表头吸顶、固定列不随横向滚动。
 * - 排序：点可排序的列标题在 升序 → 降序 → 不排 之间切换；默认在本地排（createComparer：数字、日期、按语言的文字），
 *   manualSort 时只写回 sort，由调用方向服务端要排好序的数据。
 * - 选择：selectionMode 为 single / multiple 时多一列勾选框，selected 是已选行的 key。
 * - 列宽：resizable 时可以拖动或用键盘调整，columnWidths 记录调整后的宽度（可以双向绑定，保存到本地设置里）。
 * - 加载：loading 时没有数据显示骨架行，已有数据显示进度条；接近末尾加载更多用 onRangeChange。
 * - 工具栏（搜索、筛选、列显示开关、批量操作、分页）用 TextField、Select、Menu、Toolbar、Pagination 组合，不内置。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { mergePartProps } from '../utils/props';
import { toggleSelection } from '../utils/data/selection';
import { nextSort, sortRows, type SortState } from './columns';
import { DataTableView, type DataTableRowModel, type DataTableViewProps } from './DataTableView';

/** 未声明的属性落到 table 上；aria-label 或 aria-labelledby 是表格的名称 */
export interface DataTableProps<T> extends Omit<
  DataTableViewProps<T>,
  | 'rows'
  | 'sort'
  | 'onSortClick'
  | 'selectedKeys'
  | 'onToggleRow'
  | 'onToggleAll'
  | 'widths'
  | 'onResize'
> {
  /** 数据 */
  rows: readonly T[];
  /** 行的 key：稳定且唯一（选择、测量都按它） */
  rowKey: (row: T, index: number) => string;
  /** 当前排序：父级可以写 sort={_bind(x)}；null 为不排序 */
  sort?: SortState | null;
  /** 不在本地排序：只写回 sort，数据由调用方按 sort 取 */
  manualSort?: boolean;
  /** 已选行的 key：父级写 selected={_bind(keys)} */
  selected?: string[];
  /** 各列调整后的宽度（px）：父级可以写 columnWidths={_bind(x)} 保存起来 */
  columnWidths?: Record<string, number>;
}

/** 数据表格：虚拟滚动、排序、勾选、列宽调整、加载与空状态 */
export const DataTable = _component(
  <T,>({
    rows,
    rowKey,
    columns,
    sort = _bindable<SortState | null>(null),
    manualSort = false,
    selectionMode,
    selected = _bindable<string[]>([]),
    columnWidths = _bindable<Record<string, number>>({}),
    density,
    variant,
    striped,
    ...rest
  }: DataTableProps<T>) => {
    const lang = useLang();
    const appearance = useDefaults('DataTable', () => ({ density, variant, striped }), {
      density: 'standard',
      variant: 'surface',
      striped: false,
    });

    const models = _derived.by<DataTableRowModel<T>[]>(() => {
      const ordered = manualSort ? rows : sortRows(rows, columns, sort, lang.code);
      return ordered.map((row, index) => ({ key: rowKey(row, index), data: row, depth: 0 }));
    });

    function toggleRow(key: string) {
      selected = [...toggleSelection(selected, key, { mode: selectionMode ?? 'multiple' })];
    }

    // 用集合查找：逐个 includes 是 O(n²)，十万行全选会卡住页面
    function toggleAll() {
      const keys = models.map((row) => row.key);
      const current = new Set(selected);
      const all = keys.length > 0 && keys.every((key) => current.has(key));
      if (!all) {
        selected = [...new Set([...selected, ...keys])];
        return;
      }
      const visible = new Set(keys);
      selected = selected.filter((key) => !visible.has(key));
    }

    return () => (
      <DataTableView
        {...mergePartProps<DataTableViewProps<T>>(
          {
            rows: models,
            columns,
            widths: columnWidths,
            ...appearance(),
          },
          rest as Partial<DataTableViewProps<T>>,
          {
            rows: models,
            sort,
            onSortClick: (key: string) => (sort = nextSort(sort, key)),
            selectionMode,
            selectedKeys: selected,
            onToggleRow: toggleRow,
            onToggleAll: toggleAll,
            widths: columnWidths,
            onResize: (key: string, width: number) =>
              (columnWidths = { ...columnWidths, [key]: width }),
          },
        )}
      />
    );
  },
);
