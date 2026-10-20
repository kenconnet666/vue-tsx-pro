/**
 * 组合框（WAI-ARIA Combobox，aria-autocomplete="list"）：边输入边从列表里选，或者只当带建议的输入框用。
 *
 *   <Field label="城市"><Combobox items={cities} value={_bind(city)} /></Field>
 *   <Combobox items={results} filter={false} loading={searching} inputValue={_bind(keyword)} aria-label="搜索用户" />
 *
 * 组合已有的部件：外壳同 TextField（controlSx），弹出层用 useAnchoredPopover（与外壳同宽），列表是 ListboxView。
 * 焦点一直在输入框里，高亮项经 aria-activedescendant 告诉读屏。
 *
 * - 过滤：默认本地按显示文字包含输入（Intl.Collator，忽略大小写与重音）；filter={false} 时不过滤，
 *   由调用方按 inputValue 换 items（异步搜索，配合 loading）。
 * - 中文输入法：输入经 v-model 写回，组合输入期间 inputValue 不变，所以不会拿拼音去过滤。
 * - 选中后输入框显示选项文字；失焦时如果文字不是某个选项（且没开 allowCustomValue），恢复成已选项的文字，清空则取消选择。
 * - 键盘：↓ 打开、↑↓ / Page Up / Down 移动，Enter 选中，Esc 关闭（关闭时再按 Esc 清空）；Home / End 照常移动光标。
 *
 * 部件：Root（外壳）、Input（主元素）、Clear、Chevron（切换按钮）、Popover、Listbox。
 */
import { ChevronDown } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { ClearButton, type PresetIconButtonProps } from '../base/CloseButton';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { useAnchoredPopover, type FloatingPlacement } from '../utils/dom/floating';
import { ListPopover } from './ListPopover';
import { createMatcher } from '../utils/data/collation';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  controlStyles,
  controlSx,
  focusOnShell,
  useControlAppearance,
  type ControlOptions,
} from './control';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import { disclosureStyles } from '../utils/style/transitions';
import { activeOptionId, type ListboxViewProps, type OptionRenderState } from './Listbox';
import {
  handleListKeydown,
  useListState,
  type ListboxOption,
  type OptionMapping,
  toListboxOption,
} from './list-state';

/** 角色、展开状态、值与可用性由组件管理 */
export type ComboboxManaged =
  | 'value'
  | 'role'
  | 'size'
  | 'disabled'
  | 'readonly'
  | 'required'
  | 'autocomplete'
  | 'aria-autocomplete'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-activedescendant'
  | 'aria-invalid'
  | 'aria-describedby';

/** Combobox 除 toOption 外的属性；未声明的属性落到 input（主元素）上，外壳用 propsRoot */
export interface ComboboxBaseProps<T> extends PartProps<'input', ComboboxManaged>, ControlOptions {
  /** 数据：ListboxOption、字符串，或任意数据加 toOption */
  items: readonly T[];
  /** 选中项的值：父级写 value={_bind(x)} */
  value?: string;
  /** 输入框里的文字：父级可以写 inputValue={_bind(x)}（异步搜索时据此取数据） */
  inputValue?: string;
  /** 是否打开：父级可以写 open={_bind(x)} */
  open?: boolean;
  /** 过滤：默认按显示文字包含输入（忽略大小写与重音）；函数自定义；false 不过滤（异步搜索） */
  filter?: false | ((item: T, query: string) => boolean);
  /** 允许输入不在选项里的文字：失焦时保留，value 为 undefined */
  allowCustomValue?: boolean;
  /** 正在取选项（异步搜索）：没有选项时列表里是骨架行，已有选项时顶部显示进度条 */
  loading?: boolean;
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 有内容时显示清空按钮 */
  clearable?: boolean;
  /** 表单提交时的 name（用隐藏的 input 提交 value） */
  name?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 自定义选项内容：`{(item, { selected, active }) => …}`，拿到 items 里的原始数据 */
  children?: (item: T, state: OptionRenderState) => VNodeChild;
  /** 没有匹配的选项时列表里显示的内容 */
  empty?: VNodeChild;
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
  /** 切换按钮（下拉箭头）的部件属性 */
  propsChevron?: Partial<IconButtonProps>;
  /** 弹出层的部件属性 */
  propsPopover?: PartProps<'div', 'id' | 'popover'>;
  /** 列表的部件属性 */
  propsListbox?: Partial<ListboxViewProps<T>>;
}

/** 组合框的属性；items 不是 ListboxOption 或字符串时要给 toOption */
export type ComboboxProps<T = ListboxOption> = ComboboxBaseProps<T> & OptionMapping<T>;

/** Combobox 的样式：popover、chevronOpen、loading */
export const comboboxStyles = stylex.create({
  chevronOpen: { rotate: '180deg' },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    padding: '_sm',
    color: '_textMuted',
  },
});

/** 组合框：输入框 + 过滤后的选项列表 */
export const Combobox = _component(
  <T,>({
    items,
    toOption,
    value = _bindable<string | undefined>(undefined),
    inputValue = _bindable(''),
    open = _bindable(false),
    filter,
    allowCustomValue = false,
    loading = false,
    placement = 'bottom-start',
    clearable = false,
    name,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    id,
    children,
    empty,
    propsRoot,
    propsClear,
    propsChevron,
    propsPopover,
    propsListbox,
    ...rest
  }: ComboboxProps<T>) => {
    const lang = useLang();
    const listId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    // 用户输入的过滤词：选中、用箭头打开时清空（显示全部选项）
    let query = _state('');
    // 组件自己改 inputValue（选中后写入选项文字）时，不当作用户输入
    let writing = false;
    let shell = _state.raw<HTMLElement | null>(null);
    let input = _state.raw<HTMLInputElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);

    const optionOf = (item: T) => toListboxOption(item, toOption);

    function matches(item: T, text: string) {
      if (!text) return true;
      return filter ? filter(item, text) : createMatcher(lang.code)(optionOf(item).label, text);
    }

    const list = useListState({
      items: () => (filter === false ? items : items.filter((item) => matches(item, query))),
      toOption: optionOf,
      selected: () => (value != null ? [value] : []),
      mode: () => 'single',
      // 再选已选的项不取消
      required: () => true,
      onChange: (next) => (value = next[0]),
    });

    const selectedLabel = () => {
      const selected = items.find((item) => optionOf(item).value === value);
      return selected === undefined ? '' : optionOf(selected).label;
    };

    function setText(text: string) {
      if (inputValue === text) return;
      writing = true;
      inputValue = text;
    }

    // 用户输入（含输入法组合结束）：打开并按输入过滤，高亮第一项
    watch(
      () => inputValue,
      (text) => {
        if (writing) {
          writing = false;
          return;
        }
        query = text;
        if (!control().readonly) open = true;
        list.move('first');
      },
    );

    // 父级改了 value：输入框跟着显示它的文字
    watch(
      () => value,
      () => {
        if (!allowCustomValue || value != null) setText(selectedLabel());
      },
      { immediate: true },
    );

    function pick(choice: string) {
      value = choice;
      setText(selectedLabel());
      query = '';
      open = false;
    }

    function show() {
      query = '';
      list.activateDefault();
      open = true;
    }

    // 失焦：文字不是选项时恢复（或清空选择）
    function commit() {
      open = false;
      if (allowCustomValue) {
        if (inputValue !== selectedLabel()) value = undefined;
        return;
      }
      if (!inputValue) value = undefined;
      else setText(selectedLabel());
      query = '';
    }

    function onKeydown(event: KeyboardEvent) {
      const state = control();
      if (state.disabled || state.readonly) return;
      if (event.key === 'Escape') {
        // 打开时交给原生 popover 关闭；关闭时清空
        if (!open && inputValue) {
          event.preventDefault();
          setText('');
          value = undefined;
        }
        return;
      }
      if (!open) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          show();
        }
        return;
      }
      if (handleListKeydown(list, event, { homeEnd: false }, pick)) event.preventDefault();
    }

    // 弹层贴着外壳、与它同宽；焦点一直在输入框上，关闭时不用归还
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
      const editable = !state.disabled && !state.readonly;
      return (
        <>
          <div
            {...mergeAttrs<'div'>({ sx: controlSx(appearance(), state) }, propsRoot, {
              ref: _toRef(shell),
              onPointerdown: focusOnShell(() => input),
            })}
            data-state={open ? 'open' : 'closed'}
            data-invalid={state.invalid || undefined}
            data-disabled={state.disabled || undefined}
          >
            {/* _bind 编译为 v-model：输入法组合期间不写回 */}
            <input
              {...mergeAttrs<'input'>({ sx: controlStyles.input }, rest, {
                ref: _toRef(input),
                id: state.id,
                role: 'combobox',
                autocomplete: 'off',
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                'aria-autocomplete': 'list',
                'aria-expanded': open,
                'aria-controls': listId,
                'aria-activedescendant': open ? activeOptionId(list, listId) : undefined,
                'aria-invalid': state.invalid || undefined,
                'aria-describedby': state.describedBy,
                onKeydown,
                onBlur: commit,
              })}
              value={_bind(inputValue)}
            />
            {clearable && inputValue && editable && (
              <ClearButton
                {...mergePartProps<PresetIconButtonProps>(
                  { sx: controlStyles.button, radius: 'full' },
                  propsClear,
                  {
                    onClick: () => {
                      setText('');
                      value = undefined;
                      input?.focus();
                    },
                  },
                )}
              />
            )}
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  sx: [
                    controlStyles.button,
                    disclosureStyles.icon,
                    open && comboboxStyles.chevronOpen,
                  ],
                  radius: 'full',
                  icon: ChevronDown,
                  'aria-label': lang.comboboxToggle,
                },
                propsChevron,
                {
                  tabindex: -1,
                  disabled: !editable,
                  'aria-expanded': open,
                  'aria-controls': listId,
                  // 不让输入框失焦（失焦会提交并关闭）
                  onPointerdown: (event: PointerEvent) => event.preventDefault(),
                  onClick: () => {
                    if (open) open = false;
                    else show();
                    input?.focus();
                  },
                },
              )}
            />
            <FormValue name={name} value={value} />
          </div>
          <ListPopover
            panelRef={_toRef(panel)}
            onToggle={onToggle}
            size={appearance().size}
            labelledBy={state.labelledBy}
            label={rest['aria-label']}
            loading={loading}
            onPick={pick}
            listbox={{ list, id: listId, renderOption: children, empty }}
            propsListbox={propsListbox}
            propsPopover={propsPopover}
          />
        </>
      );
    };
  },
);
