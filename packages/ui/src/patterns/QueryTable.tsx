/**
 * 查询表格（列表页的整块）：查询栏（FilterBar）+ 工具栏（标题、自己的按钮、刷新、行高、列设置、全屏）+ 批量操作栏 + 数据表格 + 分页栏，
 * 状态都在 useTableQuery 里（服务端分页、排序、条件）。同 Ant Design ProComponents 的 ProTable。
 *
 *   const tasks = useTableQuery(fetchTasks, { filters: { keyword: '', status: '' }, pageSize: 20 });
 *   <QueryTable
 *     query={tasks} columns={columns} getKey={(task) => task.id} title="任务台账" persistKey="tasks"
 *     filters={(draft) => <Field label="关键字"><TextField _value={_bind(draft.keyword)} /></Field>}
 *     toolbar={<Button icon={Plus}>新建</Button>}
 *   />
 *
 * - 查询栏的条件改的是草稿（draft），点“查询”（或回车）才交给 query.search；“重置”回到 blankFilters（不写时是一开始的条件）并查询。
 * - 表头排序交给服务端（manualSort，写回 query.sort；multiSort 时按住 Shift 追加一列，写回 query.sorts），
 *   表头筛选也交给服务端（manualFilter，写回 query.columnFilters；列的 filter 要写 options，否则只列出当前这页出现过的值），
 *   分页栏绑定 query.page / pageSize / total。fetcher 用 tableParams(query, columns) 把这些写成接口的参数。
 * - persistKey：列设置（显示、顺序、固定、列宽）与行高记在浏览器里，下次打开还是这样。
 * - selectionMode 时勾选行，表格上方出现批量操作栏，batchActions 拿到已选的 key 给出按钮。
 *
 * 部件：Root（div）、FilterBar、Panel（工具栏与表格所在的区域，全屏的就是它）、Toolbar（div）、Title（div）、
 * Table（DataTable）、SelectionBar、Pagination（PaginationBar）。
 */
import { Maximize, Minimize, RefreshCw, Rows3 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { reactive, shallowRef, toRaw, type Ref, type VNodeChild } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useMessages } from '../config/lang/messages';
import { PaginationBar, type PaginationBarProps } from '../navigation/PaginationBar';
import { Menu, MenuRadioGroup, MenuRadioItem } from '../overlay/Menu';
import { ColumnSettings } from '../table/ColumnSettings';
import type { ColumnStickies, DataTableColumn } from '../table/columns';
import { DataTable, type DataTableProps } from '../table/DataTable';
import { SelectionBar, type SelectionBarProps } from '../table/SelectionBar';
import type { DataTableDensities } from '../table/table-styles';
import type { TablePage, TableQueryState } from '../table/use-table-query';
import { useFullscreen } from '../utils/dom/fullscreen';
import { usePersistentState } from '../utils/dom/storage';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { FilterBar, type FilterBarProps } from './FilterBar';
import { patternsMessages } from './messages';

/** 未声明的属性落到外层 div 上 */
export interface QueryTableProps<T, Filters extends object> extends PartProps<'div'> {
  /** 列表状态：useTableQuery 的返回值 */
  query: TableQueryState<TablePage<T>, Filters>;
  /** 列定义 */
  columns: readonly DataTableColumn<T>[];
  /** 行的 key */
  getKey: (row: T, index: number) => string;
  /** 表格的名称（工具栏起始边的标题，也是表格的 aria-label） */
  title: string;
  /** 查询栏的条件：拿到草稿，控件绑定它的字段（`_bind(draft.keyword)`）；不写时没有查询栏 */
  filters?: (draft: Filters) => VNodeChild;
  /** 收起的条件（不常用的），点“展开”才显示 */
  moreFilters?: (draft: Filters) => VNodeChild;
  /** “重置”回到的条件；不写时是 query 一开始的条件 */
  blankFilters?: Filters;
  /** 工具栏上自己的按钮（新建、导出），在标题之后、内置按钮之前 */
  toolbar?: VNodeChild;
  /** 列设置与行高记在浏览器里的键（localStorage，自动加前缀）；不写时只在这次打开里有效 */
  persistKey?: string;
  /** 多列排序：按住 Shift 点列标题追加一列（同 DataTable 的 multiSort），排序写在 query.sorts */
  multiSort?: boolean;
  /** 勾选行：多选时表格上方出现批量操作栏 */
  selectionMode?: DataTableProps<T>['selectionMode'];
  /** 已选行的 key：父级写 _selected={_bind(keys)} */
  _selected?: string[];
  /** 批量操作栏里的按钮：拿到已选的 key */
  batchActions?: (keys: readonly string[]) => VNodeChild;
  /** 查询栏（FilterBar）的部件属性 */
  propsFilterBar?: Partial<FilterBarProps>;
  /** 工具栏与表格所在区域的部件属性（全屏的就是它） */
  propsPanel?: PartProps<'div'>;
  /** 工具栏的部件属性 */
  propsToolbar?: PartProps<'div'>;
  /** 表格（DataTable）的部件属性：列宽、详情行、行的色调等直接写在这里 */
  propsTable?: Partial<DataTableProps<T>>;
  /** 批量操作栏的部件属性 */
  propsSelectionBar?: Partial<SelectionBarProps>;
  /** 分页栏的部件属性 */
  propsPagination?: Partial<PaginationBarProps>;
  /** 工具栏内置按钮（刷新、行高、全屏）的部件属性 */
  propsToolbarButton?: Partial<IconButtonProps>;
}

/** QueryTable 的样式：root、panel、panelFullscreen、toolbar、title、tools */
export const queryTableStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_md', minWidth: 0 },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    minWidth: 0,
    backgroundColor: '_surface',
  },
  // 全屏时铺满屏幕、四周留白，表格占满剩下的高度
  panelFullscreen: { padding: '_lg', overflow: 'auto' },
  toolbar: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '_sm' },
  title: { flexGrow: 1, minWidth: 0, fontWeight: '_semibold', fontSize: '_lg' },
  tools: { display: 'flex', alignItems: 'center', gap: '_xs' },
});

/** 存在浏览器里（给了 persistKey）或只在这次打开里有效的状态 */
function settingRef<V>(key: string | undefined, name: string, initial: V): Ref<V> {
  return key ? usePersistentState(`${key}:${name}`, initial) : shallowRef(initial);
}

/** 查询表格：查询栏 + 工具栏 + 表格 + 分页，状态来自 useTableQuery */
export const QueryTable = _component(
  <T, Filters extends object>({
    query,
    columns,
    getKey,
    title,
    filters,
    moreFilters,
    blankFilters,
    toolbar,
    persistKey,
    multiSort = false,
    selectionMode,
    _selected: selected = _bindable<string[]>([]),
    batchActions,
    propsFilterBar,
    propsPanel,
    propsToolbar,
    propsTable,
    propsSelectionBar,
    propsPagination,
    propsToolbarButton,
    ...rest
  }: QueryTableProps<T, Filters>) => {
    const messages = useMessages('patterns', patternsMessages);
    // 查询栏改的是草稿：点“查询”才交给 query
    const initial = structuredClone(toRaw(_untrack(query.filters)));
    const draft = reactive({ ...initial }) as Filters;
    const key = _untrack(persistKey);
    let hidden = _fromRef(settingRef<string[]>(key, 'hidden', []));
    let order = _fromRef(settingRef<string[]>(key, 'order', []));
    let pins = _fromRef(settingRef<Record<string, keyof ColumnStickies | null>>(key, 'pins', {}));
    let widths = _fromRef(settingRef<Record<string, number>>(key, 'widths', {}));
    let density = _fromRef(settingRef<keyof DataTableDensities>(key, 'density', 'standard'));
    let panel = _state.raw<HTMLElement | null>(null);
    const fullscreen = useFullscreen(() => panel);

    function search() {
      query.search(structuredClone(toRaw(draft)) as Filters);
    }

    function reset() {
      Object.assign(draft, structuredClone(toRaw(blankFilters ?? initial)));
      search();
    }

    const toolButton = (props: Partial<IconButtonProps>) =>
      mergePartProps<IconButtonProps>(
        { icon: RefreshCw, variant: 'ghost', tone: 'neutral', 'aria-label': '' },
        propsToolbarButton,
        props,
      );

    function renderTools() {
      return (
        <div {...css.attrs(queryTableStyles.tools)}>
          <IconButton
            {...toolButton({
              icon: RefreshCw,
              'aria-label': messages.queryTableRefresh,
              loading: query.loading,
              onClick: () => void query.refresh(),
            })}
          />
          <Menu
            placement="bottom-end"
            trigger={(props) => (
              <IconButton
                {...toolButton({ icon: Rows3, 'aria-label': messages.queryTableDensity })}
                {...props}
              />
            )}
          >
            <MenuRadioGroup
              _value={density}
              {...{
                'onUpdate:_value': (value: string) => (density = value as keyof DataTableDensities),
              }}
            >
              <MenuRadioItem value="compact">{messages.queryTableDensityCompact}</MenuRadioItem>
              <MenuRadioItem value="standard">{messages.queryTableDensityStandard}</MenuRadioItem>
              <MenuRadioItem value="comfortable">
                {messages.queryTableDensityComfortable}
              </MenuRadioItem>
            </MenuRadioGroup>
          </Menu>
          <ColumnSettings
            columns={columns}
            _hidden={_bind(hidden)}
            _order={_bind(order)}
            onReset={() => {
              pins = {};
              widths = {};
            }}
            propsTrigger={propsToolbarButton}
          />
          {fullscreen.supported && (
            <IconButton
              {...toolButton({
                icon: fullscreen.active ? Minimize : Maximize,
                'aria-label': fullscreen.active
                  ? messages.queryTableExitFullscreen
                  : messages.queryTableFullscreen,
                'aria-pressed': fullscreen.active,
                onClick: () => void fullscreen.toggle(),
              })}
            />
          )}
        </div>
      );
    }

    return () => (
      <div {...mergeAttrs<'div'>({ sx: queryTableStyles.root }, rest)}>
        {filters && (
          <FilterBar
            {...mergePartProps<Partial<FilterBarProps>>(
              // 一页上可能有几个查询栏：各有名称，search 地标才分得清
              { 'aria-label': messages.queryTableSearch(title) },
              propsFilterBar,
              {
                onSearch: search,
                onReset: reset,
                loading: query.loading,
                more: moreFilters?.(draft),
              },
            )}
          >
            {filters(draft)}
          </FilterBar>
        )}
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [queryTableStyles.panel, fullscreen.active && queryTableStyles.panelFullscreen],
            },
            propsPanel,
            { ref: _toRef(panel) },
          )}
        >
          <div {...mergeAttrs<'div'>({ sx: queryTableStyles.toolbar }, propsToolbar)}>
            <div {...css.attrs(queryTableStyles.title)}>{title}</div>
            {toolbar}
            {renderTools()}
          </div>
          {selectionMode === 'multiple' && (
            <SelectionBar
              {...mergePartProps<SelectionBarProps>({ count: selected.length }, propsSelectionBar, {
                count: selected.length,
                onClear: () => (selected = []),
              })}
            >
              {batchActions?.(selected)}
            </SelectionBar>
          )}
          <DataTable
            {...mergePartProps<Partial<DataTableProps<T>>>(
              { 'aria-label': title, flexible: fullscreen.active },
              propsTable,
            )}
            rows={query.rows as T[]}
            columns={columns}
            getKey={getKey}
            manualSort
            multiSort={multiSort}
            _sort={_bind(query.sort)}
            _sorts={_bind(query.sorts)}
            manualFilter
            _filters={_bind(query.columnFilters)}
            loading={query.loading}
            density={density}
            selectionMode={selectionMode}
            _selected={_bind(selected)}
            _hiddenColumns={_bind(hidden)}
            _columnOrder={_bind(order)}
            _columnPins={_bind(pins)}
            _columnWidths={_bind(widths)}
            resizable
            columnMenu
          />
          <PaginationBar
            {...mergePartProps<Partial<PaginationBarProps>>(
              { propsPagination: { 'aria-label': messages.queryTablePagination(title) } },
              propsPagination,
            )}
            _page={_bind(query.page)}
            _pageSize={_bind(query.pageSize)}
            total={query.total}
          />
        </div>
      </div>
    );
  },
);
