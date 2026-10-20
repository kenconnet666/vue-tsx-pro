/**
 * 下拉选择（WAI-ARIA 的 select-only combobox）：点触发框弹出选项列表，单选或多选。
 *
 *   <Field label="城市"><Select items={cities} value={_bind(city)} placeholder="选择城市" /></Field>
 *   <Select items={tags} selectionMode="multiple" value={_bind(picked)} clearable aria-label="标签" />
 *   <Select items={users} toOption={(user) => ({ value: user.id, label: user.name })} value={_bind(id)} />
 *
 * 组合已有的部件：外壳是输入框外壳（controlSx），弹出层用 useAnchoredPopover（与外壳同宽、最高到视口剩余空间），
 * 列表是 ListboxView（状态与键盘见 list-state.ts），多选时触发框里是 Tag。
 * 焦点一直在触发按钮上，高亮项经 aria-activedescendant 告诉读屏。
 *
 * 键盘：关闭时 ↓ / Enter / 空格打开（↑ 打开并高亮最后一项），单选时直接按字母选中以它开头的项（同原生 select）；
 * 打开时 ↑↓、Home / End、Page Up / Down 移动，Enter / 空格选中（单选随后关闭），Esc、Tab 关闭。
 * 写了 name 时用隐藏的 input 随表单提交（多选时每个值一个）。
 *
 * 部件：Root（外壳）、Trigger（button，主元素）、Value、Tag（多选时）、Clear、Chevron、Popover、Listbox。
 */
import { ChevronDown } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { ClearButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Icon, type IconProps } from '../base/Icon';
import { Tag, type TagProps } from '../base/Tag';
import { useLang } from '../config/context';
import { floatingStyles, useAnchoredPopover, type FloatingPlacement } from '../utils/dom/floating';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { selectedValues, type SelectionProps } from '../utils/data/selection';
import { transitions } from '../utils/style/transitions';
import { fontSizeStyles } from '../utils/style/typography';
import {
  controlStyles,
  controlSx,
  focusOnShell,
  useControlAppearance,
  type ControlOptions,
} from './control';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import {
  activeOptionId,
  ListboxView,
  type ListboxViewProps,
  type OptionRenderState,
} from './Listbox';
import {
  handleListKeydown,
  useListState,
  type ListboxOption,
  type OptionMapping,
} from './list-state';

/** 角色、展开状态与可用性由组件管理 */
export type SelectManaged =
  | 'type'
  | 'role'
  | 'value'
  | 'disabled'
  | 'aria-haspopup'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-activedescendant'
  | 'aria-invalid'
  | 'aria-required'
  | 'aria-describedby';

/** 下拉选择共有的属性；未声明的属性落到触发按钮（主元素）上，外壳用 propsRoot */
interface SelectBaseProps<T> extends PartProps<'button', SelectManaged>, ControlOptions {
  /** 数据：ListboxOption，或任意数据加 toOption */
  items: readonly T[];
  /** 没有选择时显示的文字，默认取语言包（请选择） */
  placeholder?: string;
  /** 是否打开：父级可以写 open={_bind(x)} */
  open?: boolean;
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 有选择时显示清空按钮 */
  clearable?: boolean;
  /** 表单提交时的 name（用隐藏的 input） */
  name?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 自定义选项内容：`{(option, { selected, active }) => …}` */
  children?: (item: T, state: OptionRenderState) => VNodeChild;
  /** 自定义触发框里显示的内容（已选的选项）；默认单选显示文字、多选显示标签 */
  renderValue?: (selected: readonly T[]) => VNodeChild;
  /** 正在取选项（异步加载）：没有选项时列表里是骨架行，已有选项时顶部显示进度条 */
  loading?: boolean;
  /** 没有选项时列表里显示的内容 */
  empty?: VNodeChild;
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 已选内容那一层的部件属性 */
  propsValue?: PartProps<'span'>;
  /** 多选时每个标签的部件属性 */
  propsTag?: Partial<TagProps>;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
  /** 下拉箭头的部件属性 */
  propsChevron?: Partial<IconProps>;
  /** 弹出层的部件属性 */
  propsPopover?: PartProps<'div', 'id' | 'popover'>;
  /** 列表的部件属性 */
  propsListbox?: Partial<ListboxViewProps<T>>;
}

/** 单选或多选；items 不是 ListboxOption 时要给 toOption */
export type SelectProps<T = ListboxOption> = SelectBaseProps<T> & SelectionProps & OptionMapping<T>;

/** Select 的样式：root、trigger、value、placeholder、chevron、chevronOpen 等 */
export const selectStyles = stylex.create({
  root: { cursor: 'pointer' },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'start',
    cursor: 'inherit',
    outlineStyle: 'none',
  },
  value: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '_xs',
    minWidth: 0,
    paddingBlock: '_xs',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // 是真正的文字（不是原生 placeholder），要满足 4.5:1：用 textMuted 而不是 textPlaceholder
  placeholder: { color: '_textMuted' },
  chevron: { transition: 'rotate _durations.sm _easings.standard' },
  chevronOpen: { rotate: '180deg' },
  popover: { maxWidth: 'calc(100vw - 2em)', overflowY: 'auto' },
});

/** 下拉选择：触发框 + 弹出的选项列表 */
export const Select = _component(
  <T,>({
    items,
    toOption,
    selectionMode = 'single',
    value = _bindable<string | string[] | undefined>(undefined),
    open = _bindable(false),
    placeholder,
    placement = 'bottom-start',
    clearable = false,
    name,
    variant,
    size,
    radius,
    disabled,
    required,
    invalid,
    id,
    children,
    renderValue,
    empty,
    loading = false,
    propsRoot,
    propsValue,
    propsTag,
    propsClear,
    propsChevron,
    propsPopover,
    propsListbox,
    ...rest
  }: SelectProps<T>) => {
    const lang = useLang();
    const listId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled }));
    const multiple = () => selectionMode === 'multiple';
    const list = useListState({
      items: () => items,
      toOption: (item) => (toOption ? toOption(item) : (item as ListboxOption)),
      selected: () => selectedValues(value),
      mode: () => selectionMode,
      onChange: (next) => (value = multiple() ? [...next] : next[0]),
    });
    let shell = _state.raw<HTMLElement | null>(null);
    let trigger = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);

    function show(highlight: 'default' | 'last' = 'default') {
      list.activateDefault();
      if (highlight === 'last' && selectedValues(value).length === 0) list.move('last');
      open = true;
    }

    // 选中一项：单选时关闭
    function picked() {
      if (!multiple()) open = false;
    }

    function onKeydown(event: KeyboardEvent) {
      if (control().disabled) return;
      if (!open) {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          show();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          show('last');
        } else if (!multiple() && list.typeahead(event.key)) {
          // 同原生 select：关闭时按字母直接选中
          event.preventDefault();
          if (list.active !== undefined && !list.isSelected(list.active)) list.select(list.active);
        }
        return;
      }
      if (event.key === 'Tab') {
        open = false;
        return;
      }
      if (handleListKeydown(list, event, { space: true, typeahead: true }, picked)) {
        event.preventDefault();
      }
    }

    function clear() {
      value = multiple() ? [] : undefined;
      trigger?.focus();
    }

    // 弹层贴着外壳、与它同宽；焦点一直在触发按钮上，关闭时不用归还
    const { onToggle } = useAnchoredPopover(
      () => ({
        open,
        anchor: shell,
        panel,
        floating: { placement, matchWidth: true, fitHeight: true },
        restoreFocus: false,
      }),
      { close: () => (open = false) },
    );

    return () => {
      const state = control();
      const values = selectedValues(value);
      const selected = list.options.filter((option) => list.isSelected(option.value));
      const off = state.disabled;
      const shown =
        renderValue?.(selected.map((option) => option.item)) ??
        (selected.length === 0 ? (
          <span {...stylex.attrs(selectStyles.placeholder)}>
            {placeholder ?? lang.selectPlaceholder}
          </span>
        ) : multiple() ? (
          selected.map((option) => (
            <Tag
              key={option.value}
              {...mergePartProps<TagProps>({ size: 'sm', variant: 'soft' }, propsTag)}
            >
              {option.label}
            </Tag>
          ))
        ) : (
          selected[0]!.label
        ));
      return (
        <>
          <div
            {...mergeAttrs<'div'>(
              { sx: [controlSx(appearance(), state), selectStyles.root] },
              propsRoot,
              {
                ref: _toRef(shell),
                // 点在外壳的空白处也打开：焦点交给触发按钮
                // 点在外壳空白处：焦点交给触发按钮并切换打开
                onPointerdown: off
                  ? undefined
                  : focusOnShell(
                      () => trigger,
                      () => (open = !open),
                    ),
              },
            )}
            data-state={open ? 'open' : 'closed'}
            data-invalid={state.invalid || undefined}
            data-disabled={off || undefined}
          >
            <button
              {...mergeAttrs<'button'>({ sx: selectStyles.trigger }, rest, {
                ref: _toRef(trigger),
                id: state.id,
                type: 'button',
                role: 'combobox',
                disabled: off,
                'aria-haspopup': 'listbox',
                'aria-expanded': open,
                'aria-controls': listId,
                'aria-activedescendant': open ? activeOptionId(list, listId) : undefined,
                'aria-invalid': state.invalid || undefined,
                'aria-required': state.required || undefined,
                'aria-describedby': state.describedBy,
                onClick: () => {
                  // Safari 点击按钮不会聚焦它：焦点要在触发按钮上，键盘与 aria-activedescendant 才有效
                  trigger?.focus();
                  if (open) open = false;
                  else show();
                },
                onKeydown,
              })}
            >
              <span {...mergeAttrs<'span'>({ sx: selectStyles.value }, propsValue)}>{shown}</span>
            </button>
            {clearable && values.length > 0 && !off && (
              <ClearButton
                {...mergePartProps<PresetIconButtonProps>(
                  { sx: controlStyles.button, radius: 'full' },
                  propsClear,
                  { onClick: clear },
                )}
              />
            )}
            <Icon
              {...mergePartProps<IconProps>(
                {
                  icon: ChevronDown,
                  sx: [controlStyles.icon, selectStyles.chevron, open && selectStyles.chevronOpen],
                },
                propsChevron,
              )}
            />
            <FormValue name={name} value={values} />
          </div>
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  floatingStyles.anchored,
                  floatingStyles.surface,
                  selectStyles.popover,
                  // 弹层不是外壳的后代，不继承它的字号：按同一个 size 设置
                  appearance().size && fontSizeStyles[appearance().size!],
                  transitions.scale,
                ],
              },
              propsPopover,
              { ref: _toRef(panel), popover: 'auto', onToggle },
            )}
          >
            <ListboxView
              {...mergePartProps<ListboxViewProps<T>>(
                { list, id: listId, empty, renderOption: children },
                propsListbox,
                {
                  id: listId,
                  // 弹出层是滚动容器：选项虚拟滚动
                  scroller: panel,
                  loading,
                  multiple: multiple(),
                  'aria-labelledby': state.labelledBy,
                  'aria-label': state.labelledBy ? undefined : rest['aria-label'],
                  onPick: picked,
                },
              )}
            />
          </div>
        </>
      );
    };
  },
);
