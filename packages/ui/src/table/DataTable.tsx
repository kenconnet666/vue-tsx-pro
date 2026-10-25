/**
 * 数据表格：按列定义渲染一组行，始终虚拟滚动（十万行也只渲染看得见的几十行）。渲染层见 DataTableView。
 *
 *   <DataTable
 *     rows={orders}
 *     columns={columns}
 *     getKey={(order) => order.id}
 *     _sort={sort}
 *     selectionMode="multiple"
 *     _selected={picked}
 *     loading={loading}
 *     aria-label="订单"
 *     propsRoot={{ sx: styles.tableHeight }}
 *   />
 *
 * - 高度：外层滚动区域默认最高 32em，用 propsRoot 的 sx 改；表头吸顶、固定列不随横向滚动。
 * - 排序：点可排序的列标题在 升序 → 降序 → 不排 之间切换；默认在本地排（createComparer：数字、日期、按语言的文字），
 *   manualSort 时只写回 sort，由调用方向服务端要排好序的数据。multiSort 时排序写在 sorts（几列），按住 Shift 点是追加一列。
 * - 表头筛选：列写 filter 时列标题上有筛选按钮，filters 是各列选中的值（可以双向绑定）；默认在本地筛，manualFilter 时只写回。
 * - 编辑：列写 editable 时可以就地编辑（Enter / F2、双击或直接打字开始，Enter 提交、Tab 提交并到下一格、Esc 放弃），
 *   列的 validate 与 validateRow 校验，onCellChange 写回；表格随之变成网格，方向键在格之间走（cellNavigation）。
 * - 行拖动：给了 onReorder 时第一个数据列前面有把手，拖动（或聚焦后空格拿起、↑↓ 移动）改变行的顺序；
 *   排序、筛选时显示的顺序不是数据的顺序，这时不能拖。
 * - 列菜单：columnMenu 时列标题结尾有 ⋮（排序、固定在开头 / 结尾、前后移动、隐藏），
 *   写回 columnPins、columnOrder、hiddenColumns（都可以双向绑定，存起来记住各人的列设置）。
 * - 选择：selectionMode 为 single / multiple 时多一列勾选框，selected 是已选行的 key。
 * - 列宽：resizable 时可以拖动或用键盘调整，columnWidths 记录调整后的宽度（可以双向绑定，保存到本地设置里）。
 * - 定位：handle 拿到 scrollToRow(key)，滚到那一行（停在吸顶表头之下）。
 * - 加载：loading 时没有数据显示骨架行，已有数据显示进度条；接近末尾加载更多用 onRangeChange。
 * - 详情行：renderDetail 给出一行的详情，多一列展开按钮；expandedRows 是展开了的行（可以双向绑定），hasDetail 决定哪些行有。
 * - 分组表头：columnGroups 写组标题与组里各列的 key，相邻的列上方共用一个标题。
 * - 合计：列写 summary（'sum' 精确相加，或函数）时底部多一行吸底的合计；空值显示列的 empty（默认 —）。
 * - 状态列：列写 statuses（createStatusMap）时显示成 StatusBadge；rowTone 给整行着色（导入校验的错误行）。
 * - 工具栏（查询条件用 FilterBar、批量操作用 SelectionBar、分页用 PaginationBar）组合在外面，不内置。
 */
import { GripVertical } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { nextTick, useId, type VNodeChild } from 'vue';
import { ButtonBase } from '../base/ButtonBase';
import { Icon } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { NumberField } from '../input/NumberField';
import { Select } from '../input/Select';
import { TextField } from '../input/TextField';
import { plainText } from '../utils/data/text';
import { useLang } from '../config/context';
import { focusFirst } from '../utils/dom/focus';
import { useSortable } from '../utils/dom/sortable';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { mergeAttrs, mergePartProps } from '../utils/props';
import { toggleSelection } from '../utils/data/selection';
import {
  sortList,
  arrangeColumns,
  columnFilter,
  columnType,
  columnValue,
  isCellEditable,
  filterOptions,
  filterRows,
  nextSort,
  nextSorts,
  sortRows,
  type CellEditorContext,
  type ColumnFilterOption,
  type ColumnStickies,
  type DataTableColumn,
  type SortState,
} from './columns';
import type { ColumnMenuActions } from './ColumnHeaderActions';
import {
  DataTableView,
  rowLabel,
  type CellPosition,
  type DataTableRowModel,
  type DataTableViewProps,
} from './DataTableView';
import { dataTableRecipe, dataTableStateStyles } from './table-styles';

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
  | 'expandedRows'
  | 'onToggleDetail'
  | 'filters'
  | 'onFilterChange'
  | 'filterOptionsOf'
  | 'onColumnAction'
  | 'hiddenColumns'
> {
  /** 数据 */
  rows: readonly T[];
  /** 行的 key：稳定且唯一（选择、测量都按它） */
  getKey: (row: T, index: number) => string;
  /** 当前排序：父级可以写 _sort={x}；null 为不排序 */
  _sort?: SortState | null;
  /** 不在本地排序：只写回 sort（sorts），数据由调用方按它取 */
  manualSort?: boolean;
  /** 多列排序：排序写在 sorts，按住 Shift 点列标题是追加一列（再点切换方向、降序时去掉） */
  multiSort?: boolean;
  /** 多列排序时的排序，前面的优先：父级可以写 _sorts={x} */
  _sorts?: SortState[];
  /** 表头筛选：各列选中的值（关键字筛选时是 [关键字]），父级可以写 _filters={x} */
  _filters?: Record<string, string[]>;
  /** 不在本地筛选：只写回 filters，数据由调用方按它取 */
  manualFilter?: boolean;
  /** 隐藏的列的 key：列菜单的“隐藏”写回这里，父级可以写 _hiddenColumns={x} */
  _hiddenColumns?: string[];
  /** 列的顺序（列的 key）：列菜单、列设置里移动后写回，没列到的按定义的顺序排在后面 */
  _columnOrder?: string[];
  /** 固定的列：key → start / end（null 取消列定义里的固定），列菜单写回 */
  _columnPins?: Record<string, keyof ColumnStickies | null>;
  /** 行拖动：给了它时每行前面有把手，拖完得到新的顺序（排序、筛选时不能拖） */
  onReorder?: (rows: T[]) => void;
  /**
   * 编辑了一格（列写了 editable）：写回数据。返回文字（或 resolve 成文字）是不接受的原因，编辑器留着并显示它；
   * 返回 Promise 时等它完成
   */
  onCellChange?: (row: T, key: string, value: unknown) => unknown;
  /** 行校验：返回各列的错误（列的 key → 原因），标在格上；如“结束日期早于开始日期” */
  validateRow?: (row: T) => Readonly<Record<string, string>> | null | undefined;
  /** 已选行的 key：父级写 _selected={keys} */
  _selected?: string[];
  /** 各列调整后的宽度（px）：父级可以写 _columnWidths={x} 保存起来 */
  _columnWidths?: Record<string, number>;
  /** 展开了详情的行的 key（有 renderDetail 时）：父级可以写 _expandedRows={x} */
  _expandedRows?: string[];
}

/** 数据表格：虚拟滚动、排序、勾选、列宽调整、加载与空状态 */
export const DataTable = _component(
  <T,>({
    rows,
    getKey,
    columns,
    _sort: sort = _bindable<SortState | null>(null),
    manualSort = false,
    multiSort = false,
    _sorts: sorts = _bindable<SortState[]>([]),
    _filters: filters = _bindable<Record<string, string[]>>({}),
    manualFilter = false,
    _hiddenColumns: hiddenColumns = _bindable<string[]>([]),
    _columnOrder: columnOrder = _bindable<string[]>([]),
    _columnPins: columnPins = _bindable<Record<string, keyof ColumnStickies | null>>({}),
    onReorder,
    onCellChange,
    validateRow,
    cellNavigation,
    leading,
    propsRow,
    selectionMode,
    _selected: selected = _bindable<string[]>([]),
    _columnWidths: columnWidths = _bindable<Record<string, number>>({}),
    _expandedRows: expandedRows = _bindable<string[]>([]),
    isRowSelectable,
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
    const recipe = useRecipe(dataTableRecipe);
    // 编辑器、拖动把手的部件层：与 DataTableView 的表头、表尾取同一组档位
    const s = _derived.by(() => {
      const { density: shownDensity, variant: shownVariant } = appearance();
      return recipe({ density: shownDensity, variant: shownVariant });
    });

    const activeSort = () => (multiSort ? sorts : sort);
    const models = _derived.by<DataTableRowModel<T>[]>(() => {
      const kept = manualFilter ? rows : filterRows(rows, columns, filters, lang.code);
      const ordered = manualSort ? kept : sortRows(kept, columns, activeSort(), lang.code);
      return ordered.map((row, index) => ({ key: getKey(row, index), data: row, depth: 0 }));
    });
    // 筛选的选项要看全部行（不是筛过的）：行与列不变时不重算
    const options = _derived.by(
      () =>
        new Map(
          columns
            .filter((column) => columnFilter(column))
            .map((column) => [column.key, filterOptions(column, rows, lang.code)]),
        ),
    );
    const arranged = _derived(arrangeColumns(columns, columnOrder, columnPins));

    // 行拖动：排序、筛选时显示的顺序不是数据的顺序，不能拖
    const tableMarker = useId();
    const tableElement = () =>
      document.querySelector<HTMLElement>(`table[data-table="${tableMarker}"]`);
    const reorderable = () =>
      !!onReorder &&
      sortList(activeSort()).length === 0 &&
      !Object.values(filters).some((values) => values.length > 0);
    const sortable = useSortable<DataTableRowModel<T>>({
      items: () => models,
      getKey: (row) => row.key,
      getLabel: (row) => rowLabel(columns, row),
      onChange: (next) => onReorder?.(next.map((row) => row.data)),
      container: () => tableElement(),
      disabled: () => !reorderable(),
    });

    // 编辑中的格：草稿、校验没过的原因、正在保存
    let editing = _state<
      (CellPosition & { draft: unknown; error?: string; saving?: boolean }) | null
    >(null);
    const columnOf = (key: string) => columns.find((column) => column.key === key);
    const rowOf = (key: string) => models.find((row) => row.key === key);

    const cellElement = (cell: CellPosition) =>
      tableElement()?.querySelector<HTMLElement>(
        `tr[data-key="${CSS.escape(cell.row)}"] td[data-column="${CSS.escape(cell.column)}"]`,
      );

    /** 编辑完、放弃后焦点回到格上（网格里键盘接着走） */
    function focusCell(cell: CellPosition) {
      void nextTick(() => cellElement(cell)?.focus());
    }

    function startEdit(cell: CellPosition, text?: string) {
      const row = rowOf(cell.row);
      const column = columnOf(cell.column);
      if (!row || !column || !isCellEditable(column, row.data)) return;
      const numeric = ['number', 'currency', 'percent'].includes(columnType(column, rows));
      // 直接打字：用打的字替换原值（数字列只认数字）
      const typed = text === undefined ? undefined : numeric ? Number(text) : text;
      const draft =
        typed === undefined || Number.isNaN(typed) ? columnValue(column, row.data) : typed;
      editing = { ...cell, draft };
      // 编辑器渲染出来后焦点移进去（autofocus 对后插入的元素不可靠，日期这类分段输入也没有 autofocus）
      void nextTick(() => {
        const element = cellElement(cell);
        if (element) focusFirst(element);
      });
    }

    function cancelEdit() {
      if (!editing) return;
      const cell = { row: editing.row, column: editing.column };
      editing = null;
      focusCell(cell);
    }

    /** 提交：列的 validate、onCellChange 都接受了才收起；step 是提交后去哪一格（Tab 往后、Shift + Tab 往前） */
    async function commitEdit(step: 0 | 1 | -1 = 0) {
      const current = editing;
      const row = current && rowOf(current.row);
      const column = current && columnOf(current.column);
      if (!current || !row || !column || current.saving) return;
      const invalid = column.validate?.(current.draft, row.data);
      if (invalid) {
        editing = { ...current, error: invalid };
        return;
      }
      editing = { ...current, saving: true };
      const result = await onCellChange?.(row.data, column.key, current.draft);
      if (typeof result === 'string' && result) {
        editing = { ...current, error: result, saving: false };
        return;
      }
      editing = null;
      const next = step === 0 ? undefined : neighbourEditable(current, step);
      if (next) startEdit(next);
      else focusCell(current);
    }

    /** 这一行里往后（往前）的下一个可编辑的格 */
    function neighbourEditable(cell: CellPosition, step: 1 | -1): CellPosition | undefined {
      const row = rowOf(cell.row);
      if (!row) return undefined;
      const hidden = new Set(hiddenColumns);
      const visible = arranged.filter((column) => !hidden.has(column.key));
      const from = visible.findIndex((column) => column.key === cell.column);
      for (let index = from + step; index >= 0 && index < visible.length; index += step) {
        const column = visible[index]!;
        if (isCellEditable(column, row.data)) return { row: cell.row, column: column.key };
      }
      return undefined;
    }

    function onEditKeydown(event: KeyboardEvent) {
      // 编辑器自己处理了的键（下拉框的 Enter 打开列表）不再当作提交
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancelEdit();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        void commitEdit();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        void commitEdit(event.shiftKey ? -1 : 1);
      }
    }

    /** 正在编辑的格里的编辑器：列的 editor，或按列选的默认编辑器 */
    function renderEditor(row: T, column: DataTableColumn<T>): VNodeChild {
      const current = editing!;
      const context: CellEditorContext<T> = {
        row,
        value: current.draft,
        onChange: (value) => (editing = { ...current, draft: value, error: undefined }),
        commit: () => void commitEdit(),
        cancel: cancelEdit,
        error: current.error,
      };
      const label = plainText(column.header) ?? column.key;
      const common = {
        size: 'sm',
        invalid: !!current.error,
        'aria-label': label,
        // 编辑器占满格子
        propsRoot: s.editorControl,
      } as const;
      const editor = column.editor ? (
        column.editor(context)
      ) : column.statuses ? (
        // 状态：选了就提交
        <Select
          {...common}
          items={column.statuses.options()}
          _value={typeof current.draft === 'string' ? current.draft : null}
          onUpdate:_value={(value: string | null) => {
            editing = { ...current, draft: value };
            void commitEdit();
          }}
        />
      ) : ['number', 'currency', 'percent'].includes(columnType(column, rows)) ? (
        <NumberField
          {...common}
          stepper={false}
          _value={typeof current.draft === 'number' ? current.draft : null}
          onUpdate:_value={context.onChange}
        />
      ) : (
        <TextField
          {...common}
          _value={
            typeof current.draft === 'string' || typeof current.draft === 'number'
              ? String(current.draft)
              : ''
          }
          onUpdate:_value={context.onChange}
        />
      );
      return (
        <div
          {...mergeAttrs<'div'>(s.editor)}
          // 焦点离开这一格（点了别处）：提交
          onFocusout={(event: FocusEvent) => {
            const cell = (event.currentTarget as HTMLElement).closest('td');
            if (!cell?.contains(event.relatedTarget as Node | null)) void commitEdit();
          }}
        >
          {editor}
          {current.error && (
            <div role="alert" {...mergeAttrs<'div'>(s.editorError)}>
              {current.error}
            </div>
          )}
        </div>
      );
    }

    /**
     * 能拖动时行的属性：使用方的 propsRow 加上拖动要的属性。在 setup 里建一次（函数不变，行的 memo 才有效）；
     * 里面读的拖动状态由各行的渲染跟踪，被拖的行照样更新
     */
    const rowPropsWithHandle = (row: T, index: number) =>
      mergeAttrs<'tr'>({}, typeof propsRow === 'function' ? propsRow(row, index) : propsRow, {
        ...sortable.itemProps(models[index]!.key),
        sx: sortable.active === models[index]!.key ? dataTableStateStyles.rowDragging : undefined,
      });

    /** 第一个数据列前面：拖动的把手，再是使用方的 leading */
    function renderLeading(row: DataTableRowModel<T>, index: number) {
      return (
        <>
          <ButtonBase
            {...s.rowHandle}
            ripple={false}
            aria-label={lang.sortableHandle(rowLabel(columns, row))}
            {...sortable.handleProps(row.key)}
          >
            <Icon icon={GripVertical} />
          </ButtonBase>
          {leading?.(row, index)}
        </>
      );
    }

    function onSortClick(key: string, event: MouseEvent) {
      if (multiSort) sorts = nextSorts(sorts, key, event.shiftKey);
      else sort = nextSort(sort, key);
    }

    function setSort(key: string, direction: SortState['direction'] | null) {
      if (multiSort) {
        const rest = sorts.filter((item) => item.key !== key);
        sorts = direction ? [{ key, direction }, ...rest] : rest;
      } else sort = direction ? { key, direction } : null;
    }

    /** 往前、往后移一列：与相邻的可见列交换位置 */
    function move(key: string, step: 1 | -1) {
      const hidden = new Set(hiddenColumns);
      const keys = arranged.map((column) => column.key);
      const visible = keys.filter((item) => !hidden.has(item));
      const neighbour = visible[visible.indexOf(key) + step];
      if (!neighbour) return;
      const [from, to] = [keys.indexOf(key), keys.indexOf(neighbour)];
      [keys[from], keys[to]] = [neighbour, key];
      columnOrder = keys;
    }

    function onColumnAction(key: string, action: keyof ColumnMenuActions, width: number) {
      if (action === 'sortAscending') setSort(key, 'ascending');
      else if (action === 'sortDescending') setSort(key, 'descending');
      else if (action === 'unsort') setSort(key, null);
      else if (action === 'moveBackward') move(key, -1);
      else if (action === 'moveForward') move(key, 1);
      else if (action === 'hide') hiddenColumns = [...hiddenColumns, key];
      else {
        const side = action === 'pinStart' ? 'start' : action === 'pinEnd' ? 'end' : null;
        columnPins = { ...columnPins, [key]: side };
        // 固定列的偏移按列宽累加：没写宽度的列记下它现在的宽度
        const column = columns.find((item) => item.key === key);
        if (side && column?.width == null && columnWidths[key] == null && width > 0)
          columnWidths = { ...columnWidths, [key]: width };
      }
    }

    function toggleRow(key: string) {
      selected = [...toggleSelection(selected, key, { mode: selectionMode ?? 'multiple' })];
    }

    // 用集合查找：逐个 includes 是 O(n²)，十万行全选会卡住页面；不能勾选的行跳过
    function toggleAll() {
      const keys = (
        isRowSelectable ? models.filter((row) => isRowSelectable(row.data)) : models
      ).map((row) => row.key);
      const current = new Set(selected);
      const all = keys.length > 0 && keys.every((key) => current.has(key));
      if (!all) {
        selected = [...new Set([...selected, ...keys])];
        return;
      }
      const visible = new Set(keys);
      selected = selected.filter((key) => !visible.has(key));
    }

    function toggleDetail(key: string) {
      expandedRows = [...toggleSelection(expandedRows, key, { mode: 'multiple' })];
    }

    return () => (
      <>
        <DataTableView
          {...mergePartProps<DataTableViewProps<T>>(
            {
              rows: models,
              columns: arranged,
              widths: columnWidths,
              ...appearance(),
            },
            rest as Partial<DataTableViewProps<T>>,
            {
              rows: models,
              columns: arranged,
              sort: activeSort(),
              onSortClick,
              filters,
              onFilterChange: (key: string, values: string[]) =>
                (filters = { ...filters, [key]: values }),
              filterOptionsOf: (column) => options.get(column.key) ?? ([] as ColumnFilterOption[]),
              hiddenColumns,
              onColumnAction,
              leading: reorderable() ? renderLeading : leading,
              // 不拖动时原样交给行：每次新建的函数会让各行的 memo 失效，勾选一行全部重渲染
              propsRow: reorderable() ? rowPropsWithHandle : propsRow,
              ...({ 'data-table': tableMarker } as Partial<DataTableViewProps<T>>),
              cellNavigation: cellNavigation ?? columns.some((column) => column.editable),
              editing: editing && { row: editing.row, column: editing.column },
              renderEditor,
              rowErrors: validateRow,
              onEditStart: startEdit,
              onEditKeydown,
              selectionMode,
              isRowSelectable,
              selectedKeys: selected,
              onToggleRow: toggleRow,
              onToggleAll: toggleAll,
              widths: columnWidths,
              onResize: (key: string, width: number) =>
                (columnWidths = { ...columnWidths, [key]: width }),
              expandedRows,
              onToggleDetail: toggleDetail,
            },
          )}
        />
        {onReorder && (
          <>
            <VisuallyHidden id={sortable.instructionsId}>
              {lang.sortableInstructions}
            </VisuallyHidden>
            <VisuallyHidden aria-live="assertive">{sortable.announcement}</VisuallyHidden>
          </>
        )}
      </>
    );
  },
);
