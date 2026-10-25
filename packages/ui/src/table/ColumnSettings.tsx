/**
 * 列设置：表格工具栏上的按钮，弹出全部的列——勾选显示哪些、拖动（或聚焦把手后用键盘）调整顺序，“重置”回到列定义。
 * 写回的 hidden、order 与 DataTable 的 hiddenColumns、columnOrder 是同一份，两边双向绑定同一个状态即可。
 *
 *   <ColumnSettings columns={columns} _hidden={_bind(hidden)} _order={_bind(order)} />
 *   <DataTable columns={columns} _hiddenColumns={_bind(hidden)} _columnOrder={_bind(order)} … />
 *
 * 只剩一列可见时不能再隐藏。部件：Trigger（IconButton）、Panel（Popover 的弹出层）、List（Sortable）、Reset（Button）。
 */
import { Columns3 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Button, type ButtonProps } from '../base/Button';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { Sortable, type SortableProps } from '../display/Sortable';
import { Checkbox } from '../input/Checkbox';
import { Popover, type PopoverProps } from '../overlay/Popover';
import { plainText } from '../utils/data/text';
import { mergePartProps } from '../utils/props';
import { arrangeColumns, type DataTableColumn } from './columns';

/** ColumnSettings 的属性 */
export interface ColumnSettingsProps<T> {
  /** 全部的列（列定义的顺序） */
  columns: readonly DataTableColumn<T>[];
  /** 隐藏的列的 key：父级写 _hidden={_bind(x)}，与 DataTable 的 hiddenColumns 绑同一个状态 */
  _hidden?: string[];
  /** 列的顺序：父级写 _order={_bind(x)}，与 DataTable 的 columnOrder 绑同一个状态 */
  _order?: string[];
  /** 点了“重置”：显示与顺序回到列定义；要连列宽、固定一起还原时在这里清掉 */
  onReset?: () => void;
  /** 触发按钮的部件属性 */
  propsTrigger?: Partial<IconButtonProps>;
  /** 弹出层（Popover）的部件属性 */
  propsPanel?: Partial<PopoverProps>;
  /** 列表（Sortable）的部件属性 */
  propsList?: Partial<SortableProps<DataTableColumn<T>>>;
  /** “重置”按钮的部件属性 */
  propsReset?: Partial<ButtonProps>;
}

/** ColumnSettings 的样式：panel、list、header */
export const columnSettingsStyles = css.create({
  panel: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: '14rem' },
  list: { maxHeight: '20rem', overflowY: 'auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '_md' },
  title: { fontWeight: '_semibold', fontSize: '_sm' },
});

/** 列设置：勾选显示、拖动排序、重置 */
export const ColumnSettings = _component(
  <T,>({
    columns,
    _hidden: hidden = _bindable<string[]>([]),
    _order: order = _bindable<string[]>([]),
    onReset,
    propsTrigger,
    propsPanel,
    propsList,
    propsReset,
  }: ColumnSettingsProps<T>) => {
    const lang = useLang();
    const labelOf = (column: DataTableColumn<T>) => plainText(column.header) ?? column.key;
    // 按当前顺序列出（固定列照常在两头）
    const arranged = () => arrangeColumns(columns, order, undefined);
    const visibleCount = () => columns.length - hidden.length;

    function toggle(key: string, visible: boolean) {
      hidden = visible ? hidden.filter((item) => item !== key) : [...hidden, key];
    }

    function reset() {
      hidden = [];
      order = [];
      onReset?.();
    }

    return () => (
      <Popover
        {...mergePartProps<Partial<PopoverProps>>(
          { placement: 'bottom-end', 'aria-label': lang.tableColumnSettings },
          propsPanel,
        )}
        trigger={(props) => (
          <IconButton
            {...mergePartProps<IconButtonProps>(
              {
                icon: Columns3,
                variant: 'ghost',
                tone: 'neutral',
                'aria-label': lang.tableColumnSettings,
              },
              propsTrigger,
              props,
            )}
          />
        )}
      >
        <div {...css.attrs(columnSettingsStyles.panel)}>
          <div {...css.attrs(columnSettingsStyles.header)}>
            <span {...css.attrs(columnSettingsStyles.title)}>{lang.tableColumnSettings}</span>
            <Button
              {...mergePartProps<ButtonProps>({ size: 'sm', variant: 'ghost' }, propsReset, {
                disabled: hidden.length === 0 && order.length === 0,
                onClick: reset,
              })}
            >
              {lang.tableColumnSettingsReset}
            </Button>
          </div>
          <Sortable
            {...mergePartProps<Partial<SortableProps<DataTableColumn<T>>>>(
              { sx: columnSettingsStyles.list, 'aria-label': lang.tableColumnSettings },
              propsList,
            )}
            _items={_bind(
              () => arranged(),
              (next: DataTableColumn<T>[]) => (order = next.map((column) => column.key)),
            )}
            getKey={(column) => column.key}
            getLabel={labelOf}
          >
            {(column) => {
              const visible = !hidden.includes(column.key);
              return (
                <Checkbox
                  _checked={visible}
                  // 只剩这一列可见时不能再隐藏
                  disabled={visible && visibleCount() <= 1}
                  {...{ 'onUpdate:_checked': (checked: boolean) => toggle(column.key, checked) }}
                >
                  {labelOf(column)}
                </Checkbox>
              );
            }}
          </Sortable>
        </div>
      </Popover>
    );
  },
);
