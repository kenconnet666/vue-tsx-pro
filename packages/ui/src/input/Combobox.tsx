/**
 * 组合框（WAI-ARIA Combobox，aria-autocomplete="list"）：边输入边从列表里选，或者只当带建议的输入框用。
 *
 *   <Field label="城市"><Combobox items={cities} _value={city} /></Field>
 *   <Combobox items={results} filter={false} loading={searching} _inputValue={keyword} aria-label="搜索用户" />
 *
 * 组合已有的部件：外壳同 TextField（controlParts），弹出层用 useAnchoredPopover（与外壳同宽），列表是 ListboxView。
 * 焦点一直在输入框里，高亮项经 aria-activedescendant 告诉读屏。
 *
 * - 过滤：默认本地按显示文字包含输入（Intl.Collator，忽略大小写与重音）；filter={false} 时不过滤，
 *   由调用方按 inputValue 换 items（异步搜索，配合 loading）。给 load 时组件自己请求：打开时与输入停下 300 ms 后
 *   按输入请求，只采用最后一次（remote-items.ts，同 Select）。
 * - 中文输入法：输入经 v-model 写回，组合输入期间 inputValue 不变，所以不会拿拼音去过滤。
 * - 选中后输入框显示选项文字；失焦时如果文字不是某个选项（且没开 allowCustomValue），恢复成已选项的文字，清空则取消选择。
 * - 键盘：↓ 打开、↑↓ / Page Up / Down 移动，Enter 选中，Esc 关闭（关闭时再按 Esc 清空）；Home / End 照常移动光标。
 *
 * 部件：Root（外壳）、Input（主元素）、Clear、Chevron（切换按钮）、Popover、Listbox。
 */
import { ChevronDown } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, watch, type VNodeChild } from 'vue';
import type { PresetIconButtonProps } from '../base/CloseButton';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang, useTextMatcher } from '../config/context';
import { isComposingKey } from '../utils/dom/hotkeys';
import { useAnchoredPopover, type FloatingPlacement } from '../utils/dom/floating';
import { openSetter, type OpenChangeProps } from '../utils/dom/open-change';
import { ListPopover } from './ListPopover';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  controlClear,
  controlParts,
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
  useResultAnnouncement,
  useSelectedOptions,
  type ListboxOption,
  type OptionMapping,
  toListboxOption,
} from './list-state';
import { useRemoteItems, type OptionsLoader } from './remote-items';

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
export interface ComboboxBaseProps<T>
  extends PartProps<'input', ComboboxManaged>, ControlOptions, ControlIconOptions, OpenChangeProps {
  /** 数据：ListboxOption、字符串，或任意数据加 toOption；有 load 时是第一次加载之前的选项（编辑页放上已选的那一项） */
  items?: readonly T[];
  /** 选中项的值：父级写 _value={x}；没有选中时是 null */
  _value?: string | null;
  /** 输入框里的文字：父级可以写 _inputValue={x}（异步搜索时据此取数据） */
  _inputValue?: string;
  /** 是否打开：父级可以写 _open={x} */
  _open?: boolean;
  /** 过滤：默认按显示文字包含输入（忽略大小写与重音）；函数自定义；false 不过滤（异步搜索） */
  filter?: false | ((item: T, query: string) => boolean);
  /** 远程选项：打开时与输入停下 300 ms 后按输入调用，结果代替 items；只采用最后一次，被顶掉的请求 signal 中止 */
  load?: OptionsLoader<T>;
  /** 允许输入不在选项里的文字：失焦时保留，value 为 null */
  allowCustomValue?: boolean;
  /**
   * 显示右侧的展开按钮；只当带建议的输入框用时（Autocomplete）关掉，列表随输入出现
   * @default true
   */
  showToggle?: boolean;
  /** 没有可选的项时不弹出列表（不显示“没有匹配的选项”）：只当带建议的输入框用时（Autocomplete） */
  hideEmpty?: boolean;
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

/** Combobox 的样式：chevronOpen */
export const comboboxStyles = css.create({
  chevronOpen: { rotate: '180deg' },
});

/** 组合框：输入框 + 过滤后的选项列表 */
export const Combobox = _component(
  <T,>({
    items = [],
    toOption,
    _value: value = _bindable<string | null>(null),
    _inputValue: inputValue = _bindable(''),
    _open: open = _bindable(false),
    onOpenChange,
    filter,
    load,
    allowCustomValue = false,
    showToggle = true,
    hideEmpty = false,
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
    icon,
    propsIcon,
    propsClear,
    propsChevron,
    propsPopover,
    propsListbox,
    ...rest
  }: ComboboxProps<T>) => {
    const lang = useLang();
    const textMatcher = useTextMatcher();
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
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    const optionOf = (item: T) => toListboxOption(item, toOption);

    function matches(item: T, text: string) {
      if (!text) return true;
      return filter ? filter(item, text) : textMatcher()(optionOf(item).label, text);
    }

    const remote = useRemoteItems({
      load: () => load,
      query: () => query,
      open: () => open,
      items: () => items,
    });
    const list = useListState({
      // 有 load 或 filter={false} 时由服务端按输入过滤
      items: () =>
        load || filter === false
          ? remote.items()
          : remote.items().filter((item) => matches(item, query)),
      toOption: optionOf,
      selected: () => (value != null ? [value] : []),
      mode: () => 'single',
      // 再选已选的项不取消
      required: () => true,
      onChange: (next) => (value = next[0] ?? null),
    });

    // 已选项的文字：远程搜索换了 items 之后，仍按之前见过的文字显示
    const selectedOf = useSelectedOptions({ items: remote.items, toOption: optionOf });
    const selectedLabel = () => (value == null ? '' : selectedOf([value])[0]!.label);

    function setText(text: string) {
      if (inputValue === text) return;
      writing = true;
      inputValue = text;
    }

    useResultAnnouncement(() => ({ query, count: list.options.length }));

    // 用户输入（含输入法组合结束）：打开并按输入过滤，高亮第一项
    watch(
      () => inputValue,
      (text) => {
        if (writing) {
          writing = false;
          return;
        }
        query = text;
        // 只在输入框聚焦时打开：父级把 inputValue 改掉（重置成空）不该弹出列表
        if (!control().readonly && document.activeElement === input) setOpen(true, 'trigger');
        list.move('first');
      },
    );

    // 父级改了 value，或选项后到（编辑页先拿到值、再拿到选项）：输入框跟着显示它的文字；用户正在输入时不打断
    watch(
      () => [value, selectedLabel()],
      () => {
        if (query) return;
        if (!allowCustomValue || value != null) setText(selectedLabel());
      },
      { immediate: true },
    );

    function pick(choice: string, event?: Event) {
      value = choice;
      setText(selectedLabel());
      query = '';
      setOpen(false, 'select', event);
    }

    function show(event?: Event) {
      query = '';
      list.activateDefault();
      setOpen(true, 'trigger', event);
    }

    // 失焦：文字不是选项时恢复（或清空选择）
    function commit(event: FocusEvent) {
      setOpen(false, 'focus', event);
      if (allowCustomValue) {
        if (inputValue !== selectedLabel()) value = null;
        return;
      }
      if (!inputValue) value = null;
      else setText(selectedLabel());
      query = '';
    }

    function onKeydown(event: KeyboardEvent) {
      const state = control();
      if (state.disabled || state.readonly || isComposingKey(event)) return;
      if (event.key === 'Escape') {
        // 打开时交给原生 popover 关闭；关闭时清空
        if (!open && inputValue) {
          event.preventDefault();
          setText('');
          value = null;
        }
        return;
      }
      if (!open) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          show(event);
        }
        return;
      }
      if (handleListKeydown(list, event, { homeEnd: false }, (choice) => pick(choice, event)))
        event.preventDefault();
    }

    // 列表是否真的弹出：hideEmpty 时没有可选的项（也不在加载）就不弹
    const shown = () =>
      open && (!hideEmpty || list.options.length > 0 || loading || remote.loading());

    // 弹层贴着外壳、与它同宽；焦点一直在输入框上，关闭时不用归还
    const { onToggle } = useAnchoredPopover(
      () => ({
        open: shown(),
        anchor: shell,
        panel,
        floating: { placement, matchWidth: true, fitHeight: true },
        restoreFocus: false,
      }),
      { close: (reason, event) => setOpen(false, reason, event) },
    );

    return () => {
      const state = control();
      const s = controlParts(appearance(), state);
      const editable = !state.disabled && !state.readonly;
      return (
        <>
          <div
            {...mergeAttrs<'div'>(s.root, propsRoot, {
              ref: _toRef(shell),
              onPointerdown: focusOnShell(() => input),
            })}
            data-state={open ? 'open' : 'closed'}
            data-invalid={state.invalid || undefined}
            data-disabled={state.disabled || undefined}
          >
            {controlIcon(s, icon, propsIcon)}
            {/* _bind 编译为 v-model：输入法组合期间不写回 */}
            <input
              {...mergeAttrs<'input'>(s.input, rest, {
                ref: _toRef(input),
                id: state.id,
                role: 'combobox',
                autocomplete: 'off',
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                'aria-autocomplete': 'list',
                'aria-expanded': shown(),
                'aria-controls': listId,
                'aria-activedescendant': open ? activeOptionId(list, listId) : undefined,
                'aria-invalid': state.invalid || undefined,
                'aria-describedby': state.describedBy,
                onKeydown,
                onBlur: commit,
              })}
              _value={inputValue}
            />
            {clearable &&
              inputValue &&
              editable &&
              controlClear(s, propsClear, () => {
                setText('');
                value = null;
                input?.focus();
              })}
            {showToggle && (
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  {
                    ...s.button,
                    sx: [s.button.sx, disclosureStyles.icon, open && comboboxStyles.chevronOpen],
                    radius: 'full',
                    icon: ChevronDown,
                    'aria-label': lang.comboboxToggle,
                  },
                  propsChevron,
                  {
                    tabindex: -1,
                    disabled: !editable,
                    'aria-expanded': shown(),
                    'aria-controls': listId,
                    // 不让输入框失焦（失焦会提交并关闭）
                    onPointerdown: (event: PointerEvent) => event.preventDefault(),
                    onClick: (event: MouseEvent) => {
                      if (open) setOpen(false, 'trigger', event);
                      else show(event);
                      input?.focus();
                    },
                  },
                )}
              />
            )}
            <FormValue name={name} value={value} disabled={state.disabled} />
          </div>
          <ListPopover
            panelRef={_toRef(panel)}
            onToggle={onToggle}
            size={appearance().size}
            labelledBy={state.labelledBy}
            label={rest['aria-label']}
            loading={loading || remote.loading()}
            onPick={(choice) => pick(choice)}
            listbox={{
              list,
              id: listId,
              renderOption: children,
              empty: remote.failure() ?? empty,
            }}
            propsListbox={propsListbox}
            propsPopover={propsPopover}
          />
        </>
      );
    };
  },
);
