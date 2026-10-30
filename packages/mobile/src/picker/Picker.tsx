/**
 * 选择器：一列或几列滚轮，上面一条标题栏（取消、标题、确认）。常放在底部弹出层里。
 *
 *   <Popup _open={show} position="bottom" round>
 *     <Picker title="城市" columns={cities} _value={city} onConfirm={({ values }) => …} onCancel={() => (show = false)} />
 *   </Popup>
 *
 * columns 三种写法：一列（选项数组）、几列各自独立（选项数组的数组）、联动（选项带 children：省 → 市 → 区）。
 * _value 是各列选中的值；没给或对不上时选每列第一个可选的。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useConfig } from '../config/context';
import { t } from '../theme/tokens';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';
import { PICKER_ITEM_HEIGHT, PickerColumn, type PickerOption } from './PickerColumn';

export type { PickerOption } from './PickerColumn';

/** 选项的值 */
export type PickerValue = string | number;

/** 确认、变化时给出的 */
export interface PickerResult {
  /** 各列选中的值 */
  values: PickerValue[];
  /** 各列选中的选项 */
  options: PickerOption[];
}

/** 未声明的属性落到根元素（div）上 */
export interface PickerProps extends Omit<PartProps<'div', 'title'>, 'onChange'> {
  /** 选项：一列、几列（数组的数组）、联动（选项带 children） */
  columns: PickerOption[] | PickerOption[][];
  /** 各列选中的值；双向绑定写 `_value={x}`（滚动时就写回，确认时 onConfirm） */
  _value?: PickerValue[];
  /** 标题 */
  title?: VNodeChild;
  /**
   * 显示标题栏
   * @default true
   */
  showToolbar?: boolean;
  /** 确认的文字；不给时用语言包 */
  confirmText?: VNodeChild;
  /** 取消的文字；不给时用语言包 */
  cancelText?: VNodeChild;
  /**
   * 可见的行数（奇数）
   * @default 5
   */
  visibleItemCount?: number;
  /** 点了确认 */
  onConfirm?: (result: PickerResult) => void;
  /** 点了取消 */
  onCancel?: () => void;
  /** 滚到另一项 */
  onChange?: (result: PickerResult & { columnIndex: number }) => void;
  /** 各列的读屏名称 */
  columnLabels?: string[];
}

/** Picker 的样式：root、toolbar、title、action、confirm、columns、mask、indicator */
export const pickerStyles = css.create({
  root: { position: 'relative', backgroundColor: '_surface', userSelect: 'none' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3em',
  },
  title: {
    flex: '1 1 auto',
    textAlign: 'center',
    fontSize: '_lg',
    fontWeight: '_semibold',
    color: '_text',
  },
  action: {
    flex: 'none',
    // 小程序里按钮是 view：文字要自己居中
    display: 'inline-flex',
    alignItems: 'center',
    height: '100%',
    margin: 0,
    paddingBlock: 0,
    paddingInline: '_lg',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: '_textMuted', ':active': '_text' },
    fontFamily: 'inherit',
    fontSize: '_md',
    cursor: 'pointer',
  },
  confirm: { color: { default: '_accentText', ':active': '_accentActive' } },
  columns: { position: 'relative', display: 'flex', fontSize: '_md' },
  // 上下渐隐到底色，中间一行留白；选中的那一行上下各一条细线
  mask: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    pointerEvents: 'none',
    backgroundImage: `linear-gradient(180deg, ${t.colors.surface}, transparent), linear-gradient(0deg, ${t.colors.surface}, transparent)`,
    backgroundPosition: 'top, bottom',
    backgroundRepeat: 'no-repeat',
  },
  indicator: {
    position: 'absolute',
    insetInline: '_lg',
    zIndex: 2,
    height: `${PICKER_ITEM_HEIGHT}em`,
    pointerEvents: 'none',
    borderBlockWidth: '_hairline',
    borderBlockStyle: 'solid',
    borderBlockColor: '_border',
  },
});

const isMulti = (columns: PickerOption[] | PickerOption[][]): columns is PickerOption[][] =>
  Array.isArray(columns[0]);

/** 按选中的值算出各列（联动时跟着上一列的选择往下展开）与各列选中的序号 */
export function resolveColumns(columns: PickerOption[] | PickerOption[][], values: PickerValue[]) {
  const lists: PickerOption[][] = [];
  if (isMulti(columns)) lists.push(...columns);
  else {
    let list: PickerOption[] | undefined = columns;
    for (let depth = 0; list?.length; depth++) {
      lists.push(list);
      const chosen: PickerOption | undefined =
        list.find((option) => option.value === values[depth] && !option.disabled) ??
        list.find((option) => !option.disabled);
      list = chosen?.children;
    }
  }
  const indexes = lists.map((list, depth) => {
    const found = list.findIndex((option) => option.value === values[depth] && !option.disabled);
    return found >= 0
      ? found
      : Math.max(
          0,
          list.findIndex((option) => !option.disabled),
        );
  });
  const options = lists.map((list, depth) => list[indexes[depth]!]!).filter(Boolean);
  return { lists, indexes, options, values: options.map((option) => option.value) };
}

/** 选择器（div > 标题栏 + 各列滚轮） */
export const Picker = _component(
  ({
    columns,
    _value: value = _bindable<PickerValue[]>([]),
    title,
    showToolbar = true,
    confirmText,
    cancelText,
    visibleItemCount = 5,
    onConfirm,
    onCancel,
    onChange,
    columnLabels,
    ...rest
  }: PickerProps) => {
    const config = useConfig();
    const resolved = _derived(resolveColumns(columns, value));
    const select = (columnIndex: number, index: number) => {
      const next = [...resolved.values];
      next[columnIndex] = resolved.lists[columnIndex]![index]!.value;
      // 联动：后面的列重新按第一个可选的算
      const settled = resolveColumns(
        columns,
        isMulti(columns) ? next : next.slice(0, columnIndex + 1),
      );
      value = settled.values;
      onChange?.({ values: settled.values, options: settled.options, columnIndex });
    };
    return () => {
      const visible = visibleItemCount % 2 ? visibleItemCount : visibleItemCount + 1;
      const fade = `100% ${((visible - 1) / 2) * PICKER_ITEM_HEIGHT}em`;
      return (
        <div {...mergeAttrs<'div'>({ sx: pickerStyles.root }, rest)}>
          {showToolbar && (
            <div {...mergeAttrs<'div'>({ sx: pickerStyles.toolbar })}>
              <button
                {...mergeAttrs<'button'>({ sx: pickerStyles.action })}
                type="button"
                onClick={() => onCancel?.()}
              >
                {cancelText ?? config.lang.cancel}
              </button>
              {hasContent(title) && (
                <div {...mergeAttrs<'div'>({ sx: pickerStyles.title })}>{title}</div>
              )}
              <button
                {...mergeAttrs<'button'>({ sx: [pickerStyles.action, pickerStyles.confirm] })}
                type="button"
                onClick={() => onConfirm?.({ values: resolved.values, options: resolved.options })}
              >
                {confirmText ?? config.lang.confirm}
              </button>
            </div>
          )}
          <div {...mergeAttrs<'div'>({ sx: pickerStyles.columns })}>
            {resolved.lists.map((list, columnIndex) => (
              <PickerColumn
                options={list}
                index={resolved.indexes[columnIndex]!}
                visible={visible}
                label={columnLabels?.[columnIndex]}
                onSelect={(index) => select(columnIndex, index)}
              />
            ))}
            <div
              {...mergeAttrs<'div'>({
                sx: pickerStyles.mask,
                style: { backgroundSize: `${fade}, ${fade}` },
              })}
            />
            <div
              {...mergeAttrs<'div'>({
                sx: pickerStyles.indicator,
                style: { insetBlockStart: `${((visible - 1) / 2) * PICKER_ITEM_HEIGHT}em` },
              })}
            />
          </div>
        </div>
      );
    };
  },
);
