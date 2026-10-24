/**
 * 下拉选择（WAI-ARIA 的 select-only combobox）：点触发框弹出选项列表，单选或多选。
 *
 *   <Field label="城市"><Select items={['北京', '上海', '广州']} value={_bind(city)} placeholder="选择城市" /></Field>
 *   <Select items={tags} selectionMode="multiple" value={_bind(picked)} clearable aria-label="标签" />
 *   <Select items={users} toOption={(user) => ({ value: user.id, label: user.name })} value={_bind(id)} />
 *   <Select items={suppliers} searchable value={_bind(supplier)} />   选项多时：弹出层顶部带搜索框
 *
 *   <Select items={tags} selectionMode="multiple" maxTagCount="responsive" creatable onCreate={(text) => tags.push(text)} … />
 *
 * 组合已有的部件：外壳是输入框外壳（controlSx），弹出层用 useAnchoredPopover（与外壳同宽、最高到视口剩余空间），
 * 列表是 ListboxView（状态与键盘见 list-state.ts）。焦点一直在触发按钮上，高亮项经 aria-activedescendant 告诉读屏。
 *
 * 多选时已选的项是触发按钮前面的一排 Tag（不能放进 button 里：按钮里不能有按钮），各带移除按钮。
 * 这排标签只给指针用（aria-hidden、移除按钮不进 Tab 顺序）：读屏从触发按钮里念出全部已选内容，
 * 键盘在列表里取消勾选，或在触发按钮（及空的搜索框）里按 Backspace 移除最后一项（同 TagsInput）。
 * maxTagCount 是数字时只显示前几个，'responsive' 时排成一行按宽度放，其余收进“+N”（SelectedTags，TreeSelect 共用）。
 *
 * 键盘：关闭时 ↓ / Enter / 空格打开（↑ 打开并高亮最后一项），单选时直接按字母选中以它开头的项（同原生 select）；
 * 打开时 ↑↓、Home / End、Page Up / Down 移动，Enter / 空格选中（单选随后关闭），Esc、Tab 关闭。
 * 写了 name 时用隐藏的 input 随表单提交（多选时每个值一个）。
 *
 * searchable 时弹出层顶部有搜索框：打开后焦点在搜索框里，输入就过滤选项（按显示文字，忽略大小写与重音，或用 filter），
 * ↑↓ 移动、Enter 选中、Esc 关闭并把焦点还给触发按钮。已选的项被过滤掉、或 items 换了（远程搜索）时，
 * 触发框里仍显示它的文字（useSelectedOptions）。
 *
 * 远程选项：给 load 时打开就按搜索词请求，输入停下 300 ms 再请求，只采用最后一次（remote-items.ts）；
 * 自己管请求时写 search={_bind(keyword)} 拿到搜索词、filter={false} 关掉本地过滤，items 与 loading 自己给。
 *
 *   <Select searchable load={(q, signal) => http.get<User[]>('/users', { query: { q }, signal })} toOption={…} value={_bind(owner)} />
 *
 * creatable 时自带搜索框，输入的文字没有对应的选项时列表末尾多一项“新建“…””：选中后值就是这段文字，onCreate 报告它。
 *
 * 部件：Root（外壳）、Tags（多选时的那排标签）、Tag、Trigger（button，主元素）、Value、Clear、Chevron、Popover、
 * Search（TextField）、Listbox。
 */
import { ChevronDown, Plus, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { useId, watch, type VNodeChild } from 'vue';
import type { PresetIconButtonProps } from '../base/CloseButton';
import { buttonBaseStyles } from '../base/button-core';
import { Icon, type IconProps } from '../base/Icon';
import type { TagProps } from '../base/Tag';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useLang, useTextMatcher } from '../config/context';
import { useAnchoredPopover, type FloatingPlacement } from '../utils/dom/floating';
import { openSetter, type OpenChangeProps } from '../utils/dom/open-change';
import { ListPopover } from './ListPopover';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { selectedValues, type SelectionProps } from '../utils/data/selection';
import {
  controlClear,
  controlStyles,
  controlSx,
  clickOnShell,
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
import { SelectedTags, type SelectedTagsProps } from './SelectedTags';
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
  extends PartProps<'button', SelectManaged>, ControlOptions, ControlIconOptions, OpenChangeProps {
  /** 数据：ListboxOption、字符串，或任意数据加 toOption；有 load 时是第一次加载之前的选项（编辑页放上已选的那一项） */
  items?: readonly T[];
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
  /** 搜索时怎样算匹配；默认显示文字包含输入（忽略大小写与重音）。false 时不在本地过滤（服务端按 search 过滤） */
  filter?: false | ((item: T, query: string) => boolean);
  /** 搜索框里的文字：打开时清空；父级写 search={_bind(x)} 拿到它（自己发请求时） */
  search?: string;
  /** 远程选项：打开时与搜索词停下 300 ms 后调用，结果代替 items；只采用最后一次，被顶掉的请求 signal 中止 */
  load?: OptionsLoader<T>;
  /**
   * 可以新建选项（自带搜索框）：输入的文字没有对应的选项时，列表末尾多一项“新建“…””，选中后值就是这段文字。
   * 在 onCreate 里把它加进 items（或存到服务端）；不加时触发框里照样显示这段文字
   */
  creatable?: boolean;
  /** 新建了一项（creatable 时）：参数是输入的文字，也就是选中的值 */
  onCreate?: (text: string) => void;
  /** 多选时触发框里最多显示几个标签，其余收进“+N”；'responsive' 时排成一行、按宽度放，放不下的收起 */
  maxTagCount?: number | 'responsive';
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
  /** 多选时那排标签的部件属性 */
  propsTags?: Partial<SelectedTagsProps>;
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
export const selectStyles = css.create({
  // 在 ControlGroup 里也按内容宽（输入框才分剩余宽度）
  root: { cursor: 'pointer', flexGrow: 0 },
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
  // 多选时标签排在触发按钮前面（SelectedTags）占剩余宽度，触发按钮里只剩读屏用的文字
  triggerBehindTags: { flexGrow: 0 },
  chevronOpen: { rotate: '180deg' },
  // 弹出层顶部的搜索框占满宽度
  search: { width: '_full' },
});

/** creatable 时列表末尾那一项“新建“…””：不是 items 里的数据 */
class Creation {
  readonly text: string;
  constructor(text: string) {
    this.text = text;
  }
}

/** 下拉选择：触发框 + 弹出的选项列表 */
export const Select = _component(
  <T,>({
    items = [],
    toOption,
    selectionMode = 'single',
    value = _bindable<string | string[] | null>(null),
    open = _bindable(false),
    onOpenChange,
    placeholder,
    placement = 'bottom-start',
    clearable = false,
    searchable = false,
    filter,
    search = _bindable(''),
    load,
    creatable = false,
    onCreate,
    maxTagCount,
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
    propsTags,
    propsClear,
    propsChevron,
    propsPopover,
    propsListbox,
    propsSearch,
    ...rest
  }: SelectProps<T>) => {
    const lang = useLang();
    const textMatcher = useTextMatcher();
    const listId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    const multiple = () => selectionMode === 'multiple';
    const optionOf = (item: T) => toListboxOption(item, toOption);
    const remote = useRemoteItems({
      load: () => load,
      query: () => search,
      open: () => open,
      items: () => items,
    });
    // 本地过滤：有 load 或 filter={false} 时交给服务端
    const localFilter = () => !load && filter !== false;
    const matches = (item: T, text: string) =>
      filter ? filter(item, text) : textMatcher()(optionOf(item).label, text);
    // creatable 自带搜索框
    const withSearch = () => searchable || creatable;
    // creatable：输入的文字没有同名（或同值）的选项时，列表末尾多一项“新建”
    const creation = () => {
      const text = search.trim();
      if (!creatable || !text) return undefined;
      const exists = remote.items().some((item) => {
        const option = optionOf(item);
        return option.value === text || option.label.toLowerCase() === text.toLowerCase();
      });
      return exists ? undefined : new Creation(text);
    };
    const list = useListState<T | Creation>({
      items: () => {
        const all = remote.items();
        const shown =
          withSearch() && search && localFilter()
            ? all.filter((item) => matches(item, search))
            : all;
        const created = creation();
        return created ? [...shown, created] : shown;
      },
      toOption: (item) =>
        item instanceof Creation
          ? { value: item.text, label: lang.selectCreate(item.text), icon: Plus }
          : optionOf(item),
      selected: () => selectedValues(value),
      mode: () => selectionMode,
      onChange: (next) => {
        const created = creation();
        if (created && next.includes(created.text)) {
          onCreate?.(created.text);
          search = '';
        }
        value = multiple() ? [...next] : (next[0] ?? null);
      },
      // 单选时再点已选的一项不取消（同原生 select）；要清空用清除按钮
      required: () => !multiple(),
    });
    // 已选项的文字取自全部 items（过滤掉的、远程搜索换掉的也在）
    const selectedOptions = useSelectedOptions({ items: remote.items, toOption: optionOf });
    let shell = _state.raw<HTMLElement | null>(null);
    let trigger = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    /** 多选时移除一项（标签的移除按钮、Backspace） */
    function remove(target: string) {
      value = selectedValues(value).filter((item) => item !== target);
    }

    function removeLast() {
      const last = selectedValues(value).at(-1);
      if (last !== undefined) remove(last);
    }

    function show(highlight: 'default' | 'last' = 'default', event?: Event) {
      search = '';
      list.activateDefault();
      if (highlight === 'last' && selectedValues(value).length === 0) list.move('last');
      setOpen(true, 'trigger', event);
    }

    useResultAnnouncement(() => ({ query: search, count: list.options.length }));

    // 输入搜索词：高亮第一个匹配的。打开时清空搜索词不算：那时高亮的是已选项
    watch(
      () => search,
      (text) => text && list.move('first'),
    );

    // 选中一项：单选时关闭
    function picked(event?: Event) {
      if (!multiple()) setOpen(false, 'select', event);
    }

    /** Ctrl / Cmd / Alt 组合键是浏览器的（刷新、复制、查找），不做按字母跳转 */
    const hasModifier = (event: KeyboardEvent) => event.altKey || event.ctrlKey || event.metaKey;

    function onKeydown(event: KeyboardEvent) {
      if (control().disabled || control().readonly) return;
      if (event.key === 'Backspace' && multiple()) {
        event.preventDefault();
        removeLast();
        return;
      }
      if (!open) {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          show('default', event);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          show('last', event);
        } else if (!multiple() && !hasModifier(event) && list.typeahead(event.key)) {
          // 同原生 select：关闭时按字母直接选中
          event.preventDefault();
          if (list.active !== undefined && !list.isSelected(list.active)) list.select(list.active);
        }
        return;
      }
      if (event.key === 'Tab') {
        setOpen(false, 'focus', event);
        return;
      }
      if (handleListKeydown(list, event, { space: true, typeahead: true }, () => picked(event))) {
        event.preventDefault();
      }
    }

    // 搜索框里：↑↓ 移动、Enter 选中（Home / End、空格留给输入），Tab 关闭后照常移到下一个；
    // 多选时空的搜索框里按 Backspace 移除最后一项
    function onSearchKeydown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        setOpen(false, 'focus', event);
        return;
      }
      if (event.key === 'Backspace' && !search && multiple()) {
        event.preventDefault();
        removeLast();
        return;
      }
      if (handleListKeydown(list, event, { homeEnd: false }, () => picked(event)))
        event.preventDefault();
    }

    function clear() {
      value = multiple() ? [] : null;
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
      { close: (reason, event) => setOpen(false, reason, event) },
    );

    // searchable：打开后焦点进搜索框；关闭时焦点还在弹层里（Esc、选中、点外面）就还给触发按钮
    function onPanelToggle(event: ToggleEvent) {
      onToggle(event);
      if (!withSearch()) return;
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
      // 多选的默认显示：触发按钮前面一排标签，按钮里只留给读屏的文字
      const tagged = multiple() && !renderValue && selected.length > 0;
      const shown = tagged ? (
        <span {...css.attrs(visuallyHiddenStyles.hidden)}>
          {lang.selectSummary(selected.map((option) => option.label))}
        </span>
      ) : (
        (renderValue?.(
          selected.flatMap((option) => (option.item === undefined ? [] : [option.item])),
        ) ??
        (selected.length === 0 ? (
          <span {...css.attrs(selectStyles.placeholder)}>
            {placeholder ?? lang.selectPlaceholder}
          </span>
        ) : (
          selected[0]!.label
        )))
      );
      const tags = tagged && (
        <SelectedTags
          {...mergePartProps<SelectedTagsProps>(
            {
              tags: selected,
              maxTagCount,
              onRemove: locked ? undefined : remove,
              propsTag,
            },
            propsTags,
          )}
        />
      );
      return (
        <>
          <div
            {...mergeAttrs<'div'>(
              { sx: [controlSx(appearance(), state), selectStyles.root] },
              propsRoot,
              {
                ref: _toRef(shell),
                // 点在外壳空白处（含多选的标签）：焦点交给触发按钮，并与点触发按钮一样切换打开（只读时只聚焦）
                onPointerdown: off ? undefined : focusOnShell(() => trigger),
                onClick: locked
                  ? undefined
                  : clickOnShell(
                      () => trigger,
                      (event) => (open ? setOpen(false, 'trigger', event) : show('default', event)),
                    ),
              },
            )}
            data-state={open ? 'open' : 'closed'}
            data-invalid={state.invalid || undefined}
            data-disabled={off || undefined}
          >
            {controlIcon(icon, propsIcon)}
            {tags}
            <button
              {...mergeAttrs<'button'>(
                {
                  sx: [
                    buttonBaseStyles.root,
                    selectStyles.trigger,
                    tagged && selectStyles.triggerBehindTags,
                  ],
                },
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
                  onClick: (event: MouseEvent) => {
                    // Safari 点击按钮不会聚焦它：焦点要在触发按钮上，键盘与 aria-activedescendant 才有效
                    trigger?.focus();
                    if (locked) return;
                    if (open) setOpen(false, 'trigger', event);
                    else show('default', event);
                  },
                  onKeydown,
                },
              )}
            >
              <span {...mergeAttrs<'span'>({ sx: selectStyles.value }, propsValue)}>{shown}</span>
            </button>
            {clearable && values.length > 0 && !locked && controlClear(propsClear, clear)}
            <Icon
              {...mergePartProps<IconProps>(
                {
                  icon: ChevronDown,
                  sx: [controlStyles.icon, disclosureStyles.icon, open && selectStyles.chevronOpen],
                },
                propsChevron,
              )}
            />
            <FormValue name={name} value={values} disabled={state.disabled} />
          </div>
          <ListPopover
            panelRef={_toRef(panel)}
            onToggle={onPanelToggle}
            size={appearance().size}
            labelledBy={state.labelledBy}
            label={rest['aria-label']}
            loading={loading || remote.loading()}
            onPick={() => picked()}
            header={
              withSearch() && (
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
                  value={_bind(search)}
                  aria-controls={listId}
                  aria-activedescendant={open ? activeOptionId(list, listId) : undefined}
                  onKeydown={onSearchKeydown}
                />
              )
            }
            listbox={{
              list,
              id: listId,
              empty: remote.error() ? lang.listLoadFailed : search ? lang.selectNoMatch : empty,
              renderOption:
                children &&
                ((item: T | Creation, state: OptionRenderState) =>
                  item instanceof Creation ? lang.selectCreate(item.text) : children(item, state)),
              multiple: multiple(),
            }}
            // 使用方按 T 写列表的部件属性；creatable 时多出的“新建”那一项由上面的 renderOption 处理
            propsListbox={propsListbox as Partial<ListboxViewProps<T | Creation>> | undefined}
            propsPopover={propsPopover}
          />
        </>
      );
    };
  },
);
