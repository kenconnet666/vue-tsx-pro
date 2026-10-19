/**
 * 列表框（role="listbox"）：在一列选项里单选或多选。数据驱动：
 *
 *   <Listbox items={cities} value={_bind(city)} aria-label="城市" />
 *   <Listbox items={tags} type="multiple" value={_bind(picked)}>{(option) => <Badge>{option.label}</Badge>}</Listbox>
 *
 * 选项是 { value, label, disabled?, description?, icon?, group? }（ListboxOption）；需要自定义内容时传渲染函数。
 * 焦点在列表上，高亮项经 aria-activedescendant 告诉读屏：↑↓、Home / End、Page Up / Down 移动，
 * Enter / 空格选中，按字母跳到以它开头的项。状态与键盘见 list-state.ts；Select、Combobox 用同一个 ListboxView 渲染。
 *
 * 部件：Root（div，role="listbox"）、Group（分组）、GroupLabel、Option（div，role="option"）、Check（已选标记）。
 * 暂不做虚拟化：长列表的虚拟化要让高亮项始终渲染在 DOM 里（aria-activedescendant 要指得到），以后在 Virtualizer 上加。
 */
import { Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { Text, type TextProps } from '../base/Text';
import { useLang } from '../config/context';
import { Empty, type EmptyProps } from '../feedback/Empty';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import type { SelectionModes } from '../utils/selection';
import { focusRingStyles } from '../utils/styles';
import { useFieldControl } from './Field';
import {
  createListState,
  handleListKeydown,
  type ListboxOption,
  type ListState,
} from './list-state';

/** 选项的渲染状态：渲染函数据此画高亮、已选的样子 */
export interface OptionRenderState {
  /** 已选 */
  selected: boolean;
  /** 高亮（键盘或指针所在） */
  active: boolean;
}

/** 选项的部件属性：可以按选项计算 */
type OptionProps<T> =
  | PartProps<'div', 'role' | 'id' | 'aria-selected' | 'aria-disabled'>
  | ((option: T, state: OptionRenderState) => PartProps<'div'>);

/** ListboxView 的属性：Listbox、Select、Combobox 共用的渲染层 */
export interface ListboxViewProps<T extends ListboxOption> extends PartProps<'div', 'role'> {
  /** 列表状态（createListState） */
  list: ListState<T>;
  /** 列表的 id；选项的 id 是 `${id}-${序号}`（aria-activedescendant 指向它） */
  id: string;
  /** 多选：aria-multiselectable */
  multiple?: boolean;
  /** 自定义选项内容 */
  renderOption?: (option: T, state: OptionRenderState) => VNodeChild;
  /** 没有选项时显示的内容；默认是 Empty（文案取语言包） */
  empty?: VNodeChild;
  /** 点选了一项（Select 据此关闭） */
  onPick?: (value: string) => void;
  /** 选项的部件属性 */
  propsOption?: OptionProps<T>;
  /** 分组标题的部件属性 */
  propsGroupLabel?: Partial<TextProps>;
  /** 已选标记的部件属性 */
  propsCheck?: Partial<IconProps>;
  /** 空状态的部件属性 */
  propsEmpty?: Partial<EmptyProps>;
}

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    padding: '_xs',
    lineHeight: '_normal',
    outlineStyle: 'none',
  },
  group: { display: 'flex', flexDirection: 'column', gap: '1px' },
  groupLabel: {
    display: 'block',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    fontWeight: '_semibold',
  },
  option: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    minHeight: 'max(_sizes.control, _sizes.minTarget)',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    borderRadius: '_sm',
    color: '_text',
    cursor: 'pointer',
    userSelect: 'none',
  },
  active: { backgroundColor: '_fillHover' },
  selected: { color: '_accentText' },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
  content: { display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 },
  description: { color: '_textMuted' },
  check: { flexShrink: 0 },
  hidden: { visibility: 'hidden' },
});

/** 列表的渲染层：分组、选项、已选标记、空状态；不管焦点，指针悬停高亮、点击选中 */
export const ListboxView = _component(
  <T extends ListboxOption>({
    list,
    id,
    multiple = false,
    renderOption,
    empty,
    onPick,
    propsOption,
    propsGroupLabel,
    propsCheck,
    propsEmpty,
    ...rest
  }: ListboxViewProps<T>) => {
    const lang = useLang();

    // 高亮项变了（键盘移动）时滚进可见范围；指针悬停触发的不会滚，因为它本来就在视野里
    _effect(() => {
      const active = activeOptionId(list, id);
      if (active) document.getElementById(active)?.scrollIntoView({ block: 'nearest' });
    });

    function renderItem(option: T, index: number) {
      const state = {
        selected: list.isSelected(option.value),
        active: list.active === option.value,
      };
      const own = typeof propsOption === 'function' ? propsOption(option, state) : propsOption;
      return (
        <div
          key={option.value}
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [
                  styles.option,
                  state.active && styles.active,
                  state.selected && styles.selected,
                  option.disabled && styles.disabled,
                ],
              },
              own,
              {
                id: `${id}-${index}`,
                role: 'option',
                'aria-selected': state.selected,
                'aria-disabled': option.disabled || undefined,
                // 焦点留在列表、触发按钮或输入框上
                onPointerdown: (event: PointerEvent) => event.preventDefault(),
                onPointermove: () => {
                  if (!option.disabled && list.active !== option.value)
                    list.setActive(option.value);
                },
                onClick: () => {
                  if (option.disabled) return;
                  list.select(option.value);
                  onPick?.(option.value);
                },
              },
            ),
          )}
          data-state={state.selected ? 'checked' : 'unchecked'}
          data-active={state.active || undefined}
          data-disabled={option.disabled || undefined}
        >
          {renderOption ? (
            renderOption(option, state)
          ) : (
            <>
              {option.icon && <Icon icon={option.icon} />}
              <span {...stylex.attrs(styles.content)}>
                {option.label}
                {option.description && (
                  <Text size="sm" sx={styles.description}>
                    {option.description}
                  </Text>
                )}
              </span>
            </>
          )}
          <Icon
            {...mergePartProps<IconProps>(
              { icon: Check, sx: [styles.check, !state.selected && styles.hidden] },
              propsCheck,
            )}
          />
        </div>
      );
    }

    return () => {
      const options = list.options;
      // 选项已按分组排好：连续同组的放进一个 role="group"
      const blocks: { group: string | undefined; items: [T, number][] }[] = [];
      options.forEach((option, index) => {
        const last = blocks.at(-1);
        if (last && last.group === option.group) last.items.push([option, index]);
        else blocks.push({ group: option.group, items: [[option, index]] });
      });
      return (
        <div
          {...elementProps(
            mergeProps<'div'>({ sx: [styles.root, focusRingStyles.visible] }, rest, {
              id,
              role: 'listbox',
              'aria-multiselectable': multiple || undefined,
            }),
          )}
        >
          {options.length === 0
            ? (empty ?? (
                <Empty
                  {...mergePartProps<EmptyProps>(
                    { size: 'sm', icon: false, description: lang.selectEmpty },
                    propsEmpty,
                  )}
                />
              ))
            : blocks.map((block, position) =>
                block.group == null ? (
                  block.items.map(([option, index]) => renderItem(option, index))
                ) : (
                  <div
                    key={`group-${position}`}
                    role="group"
                    aria-labelledby={`${id}-group-${position}`}
                    {...stylex.attrs(styles.group)}
                  >
                    <Text
                      {...mergePartProps<TextProps>(
                        { tone: 'muted', size: 'sm', sx: styles.groupLabel },
                        propsGroupLabel,
                        { id: `${id}-group-${position}` },
                      )}
                    >
                      {block.group}
                    </Text>
                    {block.items.map(([option, index]) => renderItem(option, index))}
                  </div>
                ),
              )}
        </div>
      );
    };
  },
  { name: 'ListboxView' },
);

/** 高亮项的 id（给 aria-activedescendant）；没有高亮时 undefined */
export function activeOptionId<T extends ListboxOption>(
  list: ListState<T>,
  id: string,
): string | undefined {
  const index = list.options.findIndex((option) => option.value === list.active);
  return index < 0 ? undefined : `${id}-${index}`;
}

/** 单选：value 是选中项的值 */
interface SingleProps {
  /** 选择方式，默认 single */
  type?: Extract<keyof SelectionModes, 'single'>;
  /** 选中项：父级写 value={_bind(x)} */
  value?: string;
}

/** 多选：value 是选中项的值的数组 */
interface MultipleProps {
  /** 选择方式 */
  type: Extract<keyof SelectionModes, 'multiple'>;
  /** 选中项：父级写 value={_bind(list)} */
  value?: string[];
}

/** 列表框共有的属性；未声明的属性落到 role="listbox" 的 div 上 */
type ListboxBaseProps<T extends ListboxOption> = Omit<
  ListboxViewProps<T>,
  'list' | 'id' | 'multiple' | 'renderOption' | 'onPick'
> & {
  /** 列表的 id；在 Field 里时默认用 Field 给的 */
  id?: string;
  /** 选项 */
  items: readonly T[];
  /** 单选时至少保留一项：再点已选项不取消 */
  required?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 自定义选项内容：`{(option, { selected, active }) => …}` */
  children?: (option: T, state: OptionRenderState) => VNodeChild;
};

/** 单选或多选 */
export type ListboxProps<T extends ListboxOption = ListboxOption> = ListboxBaseProps<T> &
  (SingleProps | MultipleProps);

const toArray = (value: string | string[] | undefined): readonly string[] =>
  Array.isArray(value) ? value : value != null ? [value] : [];

/** 列表框：焦点在列表上，方向键移动高亮、Enter / 空格选中 */
export const Listbox = _component(
  <T extends ListboxOption>({
    items,
    type = 'single',
    value = _bindable<string | string[] | undefined>(undefined),
    required = false,
    disabled,
    id,
    children,
    ...rest
  }: ListboxProps<T>) => {
    const generatedId = useId();
    const control = useFieldControl(() => ({ id, disabled }));
    const list = createListState({
      options: () => items,
      selected: () => toArray(value),
      mode: () => type,
      required: () => required,
      onChange: (next) => (value = type === 'multiple' ? [...next] : next[0]),
    });

    function onKeydown(event: KeyboardEvent) {
      if (control().disabled) return;
      if (handleListKeydown(list, event, { space: true, typeahead: true })) event.preventDefault();
    }

    return () => {
      const state = control();
      const prefix = state.id ?? generatedId;
      return (
        <ListboxView
          {...mergePartProps<ListboxViewProps<T>>(
            { list, id: prefix, multiple: type === 'multiple', renderOption: children },
            rest as Partial<ListboxViewProps<T>>,
            {
              id: prefix,
              tabindex: state.disabled ? -1 : 0,
              'aria-labelledby': rest['aria-labelledby'] ?? state.labelledBy,
              'aria-describedby': state.describedBy,
              'aria-disabled': state.disabled || undefined,
              'aria-activedescendant': activeOptionId(list, prefix),
              onFocus: () => {
                if (list.active === undefined) list.activateDefault();
              },
              onKeydown,
            },
          )}
        />
      );
    };
  },
);
