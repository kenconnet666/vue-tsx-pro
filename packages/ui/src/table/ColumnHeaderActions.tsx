/**
 * 列标题上的两个小按钮：表头筛选（ColumnFilterButton，弹出勾选的值或关键字）与列菜单（ColumnMenuButton：排序、固定、移动、隐藏）。
 * DataTableView 在列定义写了 filter、或表格开了 columnMenu 时放进列标题；状态都在外层（DataTable），这里只管画与报告。
 */
import { EllipsisVertical, Funnel } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang, useTextMatcher } from '../config/context';
import { Checkbox } from '../input/Checkbox';
import { TextField } from '../input/TextField';
import { Separator } from '../layout/Separator';
import { Menu, MenuItem } from '../overlay/Menu';
import { Popover } from '../overlay/Popover';
import { plainText } from '../utils/data/text';
import { mergePartProps } from '../utils/props';
import type { ColumnFilterOption, ColumnStickies, SortState } from './columns';

/** 选项多于这么多时，筛选里多一个搜索框 */
const SEARCH_THRESHOLD = 8;

/** ColumnHeaderActions 的样式：trigger、active、panel、options、footer */
export const columnHeaderActionStyles = stylex.create({
  // 比正文小一档，不撑高表头
  trigger: { flexShrink: 0, marginBlock: '-0.25em' },
  active: { color: '_accentText' },
  panel: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: '12rem' },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_xs',
    maxHeight: '16rem',
    overflowY: 'auto',
    fontWeight: '_normal',
    color: '_text',
  },
  footer: { display: 'flex', justifyContent: 'flex-end' },
});

/** 表头筛选按钮的属性 */
export interface ColumnFilterButtonProps {
  /** 列标题的文字：按钮的名称 */
  label: string;
  /** 可以勾选的值；关键字筛选时为 'text' */
  options: readonly ColumnFilterOption[] | 'text';
  /** 选中的值（关键字筛选时是 [关键字]） */
  values: readonly string[];
  /** 改了筛选 */
  onChange: (values: string[]) => void;
  /** 按钮的部件属性 */
  propsTrigger?: Partial<IconButtonProps>;
}

/** 表头筛选：漏斗按钮，弹出勾选的值（多时可以搜索）或关键字输入框；改了立即生效 */
export const ColumnFilterButton = _component(
  ({ label, options, values, onChange, propsTrigger }: ColumnFilterButtonProps) => {
    const lang = useLang();
    const matcher = useTextMatcher();
    let search = _state('');

    const shown = () => {
      if (options === 'text' || !search) return options === 'text' ? [] : options;
      const match = matcher();
      return options.filter((option) => match(plainText(option.label) ?? option.value, search));
    };

    function toggle(value: string, checked: boolean) {
      onChange(checked ? [...values, value] : values.filter((item) => item !== value));
    }

    function renderOptions(): VNodeChild {
      if (options === 'text')
        return (
          <TextField
            value={values[0] ?? ''}
            {...{ 'onUpdate:value': (text: string) => onChange(text ? [text] : []) }}
            aria-label={lang.tableFilterSearch}
            placeholder={lang.tableFilterSearch}
            clearable
            autofocus
            size="sm"
          />
        );
      return (
        <>
          {options.length > SEARCH_THRESHOLD && (
            <TextField
              value={search}
              {...{ 'onUpdate:value': (text: string) => (search = text) }}
              aria-label={lang.tableFilterSearch}
              placeholder={lang.tableFilterSearch}
              clearable
              size="sm"
            />
          )}
          <div {...stylex.attrs(columnHeaderActionStyles.options)} role="group" aria-label={label}>
            {shown().map((option) => (
              <Checkbox
                key={option.value}
                checked={values.includes(option.value)}
                {...{ 'onUpdate:checked': (checked: boolean) => toggle(option.value, checked) }}
              >
                {option.label ?? option.value}
              </Checkbox>
            ))}
          </div>
        </>
      );
    }

    return () => {
      const active = values.length > 0;
      return (
        <Popover
          placement="bottom-end"
          aria-label={lang.tableFilterColumn(label, false)}
          trigger={(props) => (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  icon: Funnel,
                  size: 'xs',
                  variant: 'ghost',
                  tone: 'neutral',
                  sx: [columnHeaderActionStyles.trigger, active && columnHeaderActionStyles.active],
                  'aria-label': lang.tableFilterColumn(label, active),
                },
                propsTrigger,
                props,
              )}
            />
          )}
        >
          <div {...stylex.attrs(columnHeaderActionStyles.panel)}>
            {renderOptions()}
            <div {...stylex.attrs(columnHeaderActionStyles.footer)}>
              <Button size="sm" variant="ghost" disabled={!active} onClick={() => onChange([])}>
                {lang.tableFilterClear}
              </Button>
            </div>
          </div>
        </Popover>
      );
    };
  },
);

/** 列菜单里的一项操作 */
export interface ColumnMenuActions {
  /** 按这一列升序 */
  sortAscending: unknown;
  /** 按这一列降序 */
  sortDescending: unknown;
  /** 取消这一列的排序 */
  unsort: unknown;
  /** 固定在开头 */
  pinStart: unknown;
  /** 固定在结尾 */
  pinEnd: unknown;
  /** 取消固定 */
  unpin: unknown;
  /** 往前移一列 */
  moveBackward: unknown;
  /** 往后移一列 */
  moveForward: unknown;
  /** 隐藏这一列 */
  hide: unknown;
}

/** 列菜单按钮的属性 */
export interface ColumnMenuButtonProps {
  /** 列标题的文字：按钮的名称 */
  label: string;
  /** 可以排序：菜单里有升序、降序 */
  sortable: boolean;
  /** 这一列当前的排序 */
  sorted?: SortState['direction'];
  /** 这一列当前固定在哪一侧 */
  pinned?: keyof ColumnStickies;
  /** 能不能往前、往后移（已经在头上、尾上时不能） */
  canMove: { backward: boolean; forward: boolean };
  /** 能不能隐藏（只剩一列时不能） */
  canHide: boolean;
  /** 选了一项 */
  onAction: (action: keyof ColumnMenuActions) => void;
  /** 按钮的部件属性 */
  propsTrigger?: Partial<IconButtonProps>;
}

/** 列菜单：⋮ 按钮，弹出排序、固定、移动、隐藏 */
export const ColumnMenuButton = _component(
  ({
    label,
    sortable,
    sorted,
    pinned,
    canMove,
    canHide,
    onAction,
    propsTrigger,
  }: ColumnMenuButtonProps) => {
    const lang = useLang();
    return () => (
      <Menu
        placement="bottom-end"
        trigger={(props) => (
          <IconButton
            {...mergePartProps<IconButtonProps>(
              {
                icon: EllipsisVertical,
                size: 'xs',
                variant: 'ghost',
                tone: 'neutral',
                sx: columnHeaderActionStyles.trigger,
                'aria-label': lang.tableColumnMenu(label),
              },
              propsTrigger,
              props,
            )}
          />
        )}
      >
        {sortable && (
          <>
            <MenuItem disabled={sorted === 'ascending'} onAction={() => onAction('sortAscending')}>
              {lang.tableSortAscending}
            </MenuItem>
            <MenuItem
              disabled={sorted === 'descending'}
              onAction={() => onAction('sortDescending')}
            >
              {lang.tableSortDescending}
            </MenuItem>
            {sorted && (
              <MenuItem onAction={() => onAction('unsort')}>{lang.tableSortClear}</MenuItem>
            )}
            <Separator decorative={false} />
          </>
        )}
        {pinned !== 'start' && (
          <MenuItem onAction={() => onAction('pinStart')}>{lang.tablePinStart}</MenuItem>
        )}
        {pinned !== 'end' && (
          <MenuItem onAction={() => onAction('pinEnd')}>{lang.tablePinEnd}</MenuItem>
        )}
        {pinned && <MenuItem onAction={() => onAction('unpin')}>{lang.tableUnpin}</MenuItem>}
        <Separator decorative={false} />
        <MenuItem disabled={!canMove.backward} onAction={() => onAction('moveBackward')}>
          {lang.tableMoveBackward}
        </MenuItem>
        <MenuItem disabled={!canMove.forward} onAction={() => onAction('moveForward')}>
          {lang.tableMoveForward}
        </MenuItem>
        <MenuItem disabled={!canHide} onAction={() => onAction('hide')}>
          {lang.tableHideColumn}
        </MenuItem>
      </Menu>
    );
  },
);
