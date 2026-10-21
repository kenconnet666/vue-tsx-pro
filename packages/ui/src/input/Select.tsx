/**
 * 下拉选择（WAI-ARIA 的 select-only combobox）：点触发框弹出选项列表，单选或多选。
 *
 *   <Field label="城市"><Select items={['北京', '上海', '广州']} value={_bind(city)} placeholder="选择城市" /></Field>
 *   <Select items={tags} selectionMode="multiple" value={_bind(picked)} clearable aria-label="标签" />
 *   <Select items={users} toOption={(user) => ({ value: user.id, label: user.name })} value={_bind(id)} />
 *   <Select items={suppliers} searchable value={_bind(supplier)} />   选项多时：弹出层顶部带搜索框
 *
 * 组合已有的部件：外壳是输入框外壳（controlSx），弹出层用 useAnchoredPopover（与外壳同宽、最高到视口剩余空间），
 * 列表是 ListboxView（状态与键盘见 list-state.ts），多选时触发框里是 Tag。
 * 焦点一直在触发按钮上，高亮项经 aria-activedescendant 告诉读屏。
 *
 * 键盘：关闭时 ↓ / Enter / 空格打开（↑ 打开并高亮最后一项），单选时直接按字母选中以它开头的项（同原生 select）；
 * 打开时 ↑↓、Home / End、Page Up / Down 移动，Enter / 空格选中（单选随后关闭），Esc、Tab 关闭。
 * 写了 name 时用隐藏的 input 随表单提交（多选时每个值一个）。
 *
 * searchable 时弹出层顶部有搜索框：打开后焦点在搜索框里，输入就过滤选项（按显示文字，忽略大小写与重音，或用 filter），
 * ↑↓ 移动、Enter 选中、Esc 关闭并把焦点还给触发按钮。已选的项被过滤掉、或 items 换了（远程搜索）时，
 * 触发框里仍显示它的文字（useSelectedOptions）。
 *
 * 部件：Root（外壳）、Trigger（button，主元素）、Value、Tag（多选时）、Clear、Chevron、Popover、Search（TextField）、Listbox。
 */
import { ChevronDown, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { ClearButton, type PresetIconButtonProps } from '../base/CloseButton';
import { buttonBaseStyles } from '../base/button-core';
import { Icon, type IconProps } from '../base/Icon';
import { Tag, type TagProps } from '../base/Tag';
import { useLang } from '../config/context';
import { useAnchoredPopover, type FloatingPlacement } from '../utils/dom/floating';
import { ListPopover } from './ListPopover';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { createMatcher } from '../utils/data/collation';
import { selectedValues, type SelectionProps } from '../utils/data/selection';
import {
  controlStyles,
  controlSx,
  focusOnShell,
  controlIcon,
  useControlAppearance,
  type ControlIconOptions,
  type ControlOptions,
} from './control';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import { disclosureStyles } from '../utils/style/transitions';
import { activeOptionId, type ListboxViewProps, type OptionRenderState } from './Listbox';
import {
  handleListKeydown,
  useListState,
  useSelectedOptions,
  type ListboxOption,
  type OptionMapping,
  toListboxOption,
} from './list-state';
import { TextField, type TextFieldProps } from './TextField';

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
export interface SelectBaseProps<T>
  extends PartProps<'button', SelectManaged>, ControlOptions, ControlIconOptions {
  /** 数据：ListboxOption、字符串，或任意数据加 toOption */
  items: readonly T[];
  /** 没有选择时显示的文字，默认取语言包（请选择） */
  placeholder?: string;
  /** 是否打开：父级可以写 open={_bind(x)} */
  open?: boolean;
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 有选择时显示清空按钮 */
  clearable?: boolean;
  /** 弹出层顶部带搜索框，输入过滤选项：选项多（供应商、人员、件号）时用 */
  searchable?: boolean;
  /** 搜索时怎样算匹配；默认显示文字包含输入（忽略大小写与重音） */
  filter?: (item: T, query: string) => boolean;
  /** 表单提交时的 name（用隐藏的 input） */
  name?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能聚焦、能看到已选的内容，不能打开、不能清空 */
  readonly?: boolean;
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
  /** 搜索框的部件属性（searchable 时） */
  propsSearch?: Partial<TextFieldProps>;
}

/** 单选或多选；items 不是 ListboxOption 或字符串时要给 toOption */
export type SelectProps<T = ListboxOption> = SelectBaseProps<T> & SelectionProps & OptionMapping<T>;

/** Select 的样式：root、trigger、value、placeholder、chevronOpen 等 */
export const selectStyles = stylex.create({
  root: { cursor: 'pointer' },
  // 去掉按钮默认外观用 buttonBaseStyles；像输入框一样没有自己的焦点环与波纹（焦点环画在外壳上）
  trigger: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    minWidth: 0,
    alignSelf: 'stretch',
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
  chevronOpen: { rotate: '180deg' },
  // 弹出层顶部的搜索框占满宽度
  search: { width: '_full' },
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
    searchable = false,
    filter,
    name,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    id,
    icon,
    children,
    renderValue,
    empty,
    loading = false,
    propsRoot,
    propsIcon,
    propsValue,
    propsTag,
    propsClear,
    propsChevron,
    propsPopover,
    propsListbox,
    propsSearch,
    ...rest
  }: SelectProps<T>) => {
    const lang = useLang();
    const listId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    const multiple = () => selectionMode === 'multiple';
    const optionOf = (item: T) => toListboxOption(item, toOption);
    // 搜索框里的文字：打开时清空
    let query = _state('');
    const matches = (item: T, text: string) =>
      filter ? filter(item, text) : createMatcher(lang.code)(optionOf(item).label, text);
    const list = useListState({
      items: () => (searchable && query ? items.filter((item) => matches(item, query)) : items),
      toOption: optionOf,
      selected: () => selectedValues(value),
      mode: () => selectionMode,
      onChange: (next) => (value = multiple() ? [...next] : next[0]),
    });
    // 已选项的文字取自全部 items（过滤掉的、远程搜索换掉的也在）
    const selectedOptions = useSelectedOptions({ items: () => items, toOption: optionOf });
    let shell = _state.raw<HTMLElement | null>(null);
    let trigger = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);

    function show(highlight: 'default' | 'last' = 'default') {
      query = '';
      list.activateDefault();
      if (highlight === 'last' && selectedValues(value).length === 0) list.move('last');
      open = true;
    }

    // 输入搜索词：高亮第一个匹配的
    watch(
      () => query,
      () => list.move('first'),
    );

    // 选中一项：单选时关闭
    function picked() {
      if (!multiple()) open = false;
    }

    function onKeydown(event: KeyboardEvent) {
      if (control().disabled || control().readonly) return;
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

    // 搜索框里：↑↓ 移动、Enter 选中（Home / End、空格留给输入），Tab 关闭后照常移到下一个
    function onSearchKeydown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        open = false;
        return;
      }
      if (handleListKeydown(list, event, { homeEnd: false }, picked)) event.preventDefault();
    }

    function clear() {
      value = multiple() ? [] : undefined;
      trigger?.focus();
    }

    // 弹层贴着外壳、与它同宽；焦点一直在触发按钮上，关闭时不用归还（searchable 时见 onPanelToggle）
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

    // searchable：打开后焦点进搜索框；关闭时焦点还在弹层里（Esc、选中、点外面）就还给触发按钮
    function onPanelToggle(event: ToggleEvent) {
      onToggle(event);
      if (!searchable) return;
      if (event.newState === 'open') {
        panel?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
        return;
      }
      const active = document.activeElement;
      if (!active || active === document.body || panel?.contains(active)) trigger?.focus();
    }

    return () => {
      const state = control();
      const values = selectedValues(value);
      const selected = selectedOptions(values);
      const off = state.disabled;
      // 只读：能聚焦，不能打开、不能改
      const locked = off || state.readonly;
      const shown =
        renderValue?.(
          selected.flatMap((option) => (option.item === undefined ? [] : [option.item])),
        ) ??
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
                // 点在外壳空白处：焦点交给触发按钮并切换打开（只读时只聚焦）
                onPointerdown: off
                  ? undefined
                  : focusOnShell(() => trigger, state.readonly ? undefined : () => (open = !open)),
              },
            )}
            data-state={open ? 'open' : 'closed'}
            data-invalid={state.invalid || undefined}
            data-disabled={off || undefined}
          >
            {controlIcon(icon, propsIcon)}
            <button
              {...mergeAttrs<'button'>(
                { sx: [buttonBaseStyles.root, selectStyles.trigger] },
                rest,
                {
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
                  'aria-readonly': state.readonly || undefined,
                  'aria-describedby': state.describedBy,
                  onClick: () => {
                    // Safari 点击按钮不会聚焦它：焦点要在触发按钮上，键盘与 aria-activedescendant 才有效
                    trigger?.focus();
                    if (locked) return;
                    if (open) open = false;
                    else show();
                  },
                  onKeydown,
                },
              )}
            >
              <span {...mergeAttrs<'span'>({ sx: selectStyles.value }, propsValue)}>{shown}</span>
            </button>
            {clearable && values.length > 0 && !locked && (
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
                  sx: [controlStyles.icon, disclosureStyles.icon, open && selectStyles.chevronOpen],
                },
                propsChevron,
              )}
            />
            <FormValue name={name} value={values} />
          </div>
          <ListPopover
            panelRef={_toRef(panel)}
            onToggle={onPanelToggle}
            size={appearance().size}
            labelledBy={state.labelledBy}
            label={rest['aria-label']}
            loading={loading}
            onPick={picked}
            header={
              searchable && (
                <TextField
                  {...mergePartProps<TextFieldProps>(
                    {
                      icon: Search,
                      variant: 'soft',
                      placeholder: lang.selectSearch,
                      'aria-label': lang.selectSearch,
                      propsRoot: { sx: selectStyles.search },
                    },
                    propsSearch,
                  )}
                  type="search"
                  value={_bind(query)}
                  aria-controls={listId}
                  aria-activedescendant={open ? activeOptionId(list, listId) : undefined}
                  onKeydown={onSearchKeydown}
                />
              )
            }
            listbox={{
              list,
              id: listId,
              empty: query ? lang.selectNoMatch : empty,
              renderOption: children,
              multiple: multiple(),
            }}
            propsListbox={propsListbox}
            propsPopover={propsPopover}
          />
        </>
      );
    };
  },
);
