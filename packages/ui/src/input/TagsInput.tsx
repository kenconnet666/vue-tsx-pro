/**
 * 标签输入（多选的组合框）：输入框里排着已选的 Tag，输入文字后回车（或输入逗号）加一个，可以从建议列表里选。
 * 关键词、收件人、标签、多个城市。参考 Mantine TagsInput、React Aria TagGroup + ComboBox。
 *
 *   <TagsInput value={_bind(keywords)} aria-label="关键词" />                          自由输入
 *   <TagsInput value={_bind(cities)} items={cityOptions} allowCustomValue={false} />   只能从建议里选
 *
 * - 回车、输入分隔符（默认 , ， ; ；）把文字加成标签；粘贴时按分隔符与换行拆成多个；重复的不加；
 * - 输入框为空时按退格删掉最后一个标签；每个标签有移除按钮（离场后其余的平移补位）；
 * - 有 items 时边输入边过滤建议（同 Combobox），↑↓ 移动、回车加入或移除高亮项（已选的打勾）；
 *   异步取建议时绑定 inputValue 去请求、写 filter={false} 与 loading，结果没回来时列表显示加载中；
 * - 写了 name 时每个值一个隐藏的 input 随表单提交。
 *
 * 未声明的属性落到 input（主元素）上。部件：Root（外壳）、Tag、Input、Clear、Popover、Listbox。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { ClearButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Tag, type TagProps } from '../base/Tag';
import { useLang } from '../config/context';
import { isComposingKey } from '../utils/dom/hotkeys';
import { createMatcher } from '../utils/data/collation';
import { useAnchoredPopover, type FloatingPlacement } from '../utils/dom/floating';
import { ListPopover } from './ListPopover';
import { useLayoutAnimation } from '../utils/motion/layout';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
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
import { activeOptionId, type ListboxViewProps, type OptionRenderState } from './Listbox';
import {
  handleListKeydown,
  useListState,
  useSelectedOptions,
  type ListboxOption,
  type OptionMapping,
  toListboxOption,
} from './list-state';

/** 角色、展开状态与可用性由组件管理 */
export type TagsInputManaged =
  | 'value'
  | 'role'
  | 'size'
  | 'disabled'
  | 'readonly'
  | 'autocomplete'
  | 'aria-autocomplete'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-activedescendant'
  | 'aria-invalid'
  | 'aria-required'
  | 'aria-describedby';

/** TagsInput 除 toOption 外的属性；未声明的属性落到 input（主元素）上，外壳用 propsRoot */
export interface TagsInputBaseProps<T>
  extends PartProps<'input', TagsInputManaged>, ControlOptions, ControlIconOptions {
  /** 已选的值：父级写 value={_bind(list)} */
  value?: string[];
  /** 建议：ListboxOption、字符串，或任意数据加 toOption；不给时是纯自由输入 */
  items?: readonly T[];
  /** 允许加入不在建议里的文字，默认 true */
  allowCustomValue?: boolean;
  /** 把输入拆成标签的分隔符，默认 [',', '，', ';', '；']；回车与粘贴里的换行总是分隔 */
  delimiters?: readonly string[];
  /** 最多几个标签；到了上限不再加入 */
  max?: number;
  /** 输入框里的文字：父级可以写 inputValue={_bind(x)}（异步取建议时据此搜索） */
  inputValue?: string;
  /** 建议列表是否打开 */
  open?: boolean;
  /** 过滤建议：默认按显示文字包含输入；false 不过滤（异步搜索） */
  filter?: false | ((item: T, query: string) => boolean);
  /** 正在取建议 */
  loading?: boolean;
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 有标签时显示清空按钮 */
  clearable?: boolean;
  /** 表单提交时的 name（每个值一个隐藏的 input） */
  name?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：标签不能移除，不能输入 */
  readonly?: boolean;
  /** 必填：至少要有一个标签（读屏念“必填”；校验交给表单） */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 自定义建议的内容 */
  children?: (item: T, state: OptionRenderState) => VNodeChild;
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 每个标签的部件属性，可以按值计算 */
  propsTag?: Partial<TagProps> | ((value: string) => Partial<TagProps>);
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
  /** 弹出层的部件属性 */
  propsPopover?: PartProps<'div', 'id' | 'popover'>;
  /** 建议列表的部件属性 */
  propsListbox?: Partial<ListboxViewProps<T>>;
}

/** 标签输入的属性；items 不是 ListboxOption 或字符串时要给 toOption */
export type TagsInputProps<T = ListboxOption> = TagsInputBaseProps<T> & OptionMapping<T>;

/** TagsInput 的样式：root、input、popover */
export const tagsInputStyles = stylex.create({
  // 标签多了换行；行与行之间留出间距
  root: { flexWrap: 'wrap', rowGap: '_xs', paddingBlock: '_xs' },
  // 输入框至少留出几个字的位置，放不下时换到下一行
  input: { flexBasis: '6em' },
});

/** 默认的分隔符：英文、中文的逗号与分号 */
const DELIMITERS = [',', '，', ';', '；'];

/** 标签输入：输入框里排着 Tag，回车或分隔符加入，退格删最后一个 */
export const TagsInput = _component(
  <T = ListboxOption,>({
    value = _bindable<string[]>([]),
    items = [],
    toOption,
    allowCustomValue = true,
    delimiters = DELIMITERS,
    max,
    inputValue = _bindable(''),
    open = _bindable(false),
    filter,
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
    propsRoot,
    icon,
    propsIcon,
    propsTag,
    propsClear,
    propsPopover,
    propsListbox,
    ...rest
  }: TagsInputProps<T>) => {
    const lang = useLang();
    const listId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let shell = _state.raw<HTMLElement | null>(null);
    let input = _state.raw<HTMLInputElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    // 标签增删时其余的平移补位
    const layout = useLayoutAnimation(() => shell, { children: '[data-tag]' });

    const optionOf = (item: T) => toListboxOption(item, toOption);
    // 异步搜索（filter={false}）时结果可能还没回来：建议列表与 combobox 角色一直在，等待时显示加载中
    const suggestions = () => items.length > 0 || filter === false;
    // 标签的文字：异步建议换了 items 之后，已选的仍按之前见过的文字显示；自定义的值就是文字
    const selectedOf = useSelectedOptions({ items: () => items, toOption: optionOf });
    const labelOf = (tag: string) => selectedOf([tag])[0]!.label;

    const list = useListState({
      items: () => {
        const query = inputValue.trim();
        if (filter === false || !query) return items;
        const matcher = createMatcher(lang.code);
        return items.filter((item) =>
          filter ? filter(item, query) : matcher(optionOf(item).label, query),
        );
      },
      toOption: optionOf,
      selected: () => value,
      mode: () => 'multiple',
      onChange: (next) => void layout.change(() => (value = [...next])),
    });

    /** 把一段文字变成值：是建议的文字或值时取建议的值，否则（允许时）原样 */
    function resolve(text: string): string | undefined {
      const trimmed = text.trim();
      if (!trimmed) return undefined;
      const item = items.find((candidate) => {
        const option = optionOf(candidate);
        return option.value === trimmed || option.label === trimmed;
      });
      if (item !== undefined) return optionOf(item).value;
      return allowCustomValue ? trimmed : undefined;
    }

    /** 加入几段文字；重复的、超出上限的不加；返回是否加入了 */
    function add(texts: readonly string[]) {
      const next = [...value];
      for (const text of texts) {
        const tag = resolve(text);
        if (tag === undefined || next.includes(tag) || (max != null && next.length >= max))
          continue;
        next.push(tag);
      }
      if (next.length === value.length) return false;
      void layout.change(() => (value = next));
      return true;
    }

    const remove = (tag: string) =>
      void layout.change(() => (value = value.filter((item) => item !== tag)));

    const splitter = () =>
      new RegExp(
        `[${[...delimiters, '\n', '\r', '\t'].map((d) => d.replace(/[\\\]^-]/g, '\\$&')).join('')}]`,
      );

    // 输入了分隔符：分隔符前的部分加成标签，剩下的留在输入框里
    watch(
      () => inputValue,
      (text) => {
        const parts = text.split(splitter());
        if (parts.length > 1) {
          add(parts.slice(0, -1));
          inputValue = parts.at(-1)!;
          return;
        }
        if (suggestions() && text && !control().readonly) {
          open = true;
          list.move('first');
        }
      },
    );

    function onKeydown(event: KeyboardEvent) {
      const state = control();
      if (state.disabled || state.readonly || isComposingKey(event)) return;
      if (event.key === 'Backspace' && !inputValue && value.length) {
        event.preventDefault();
        remove(value.at(-1)!);
        return;
      }
      if (open && suggestions()) {
        if (handleListKeydown(list, event, { homeEnd: false })) {
          event.preventDefault();
          if (event.key === 'Enter') inputValue = '';
          return;
        }
      } else if (event.key === 'ArrowDown' && suggestions()) {
        event.preventDefault();
        list.activateDefault();
        open = true;
        return;
      }
      if (event.key === 'Enter' && inputValue.trim()) {
        event.preventDefault();
        if (add([inputValue])) inputValue = '';
      }
    }

    // 粘贴多段（有分隔符、换行）时拆开加入；只有一段时照常粘贴
    function onPaste(event: ClipboardEvent) {
      const text = event.clipboardData?.getData('text') ?? '';
      const parts = text.split(splitter());
      if (parts.length < 2) return;
      event.preventDefault();
      add(parts);
    }

    const { onToggle } = useAnchoredPopover(
      () => ({
        open: open && suggestions(),
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
            {...mergeAttrs<'div'>(
              { sx: [controlSx(appearance(), state), tagsInputStyles.root] },
              propsRoot,
              {
                ref: _toRef(shell),
                // 外壳里的标签不是原生控件的一部分：不可用要写在外壳上，辅助技术才把它们一起当作不可用
                'aria-disabled': state.disabled || undefined,
                onPointerdown: focusOnShell(() => input),
              },
            )}
            data-state={open ? 'open' : 'closed'}
            data-invalid={state.invalid || undefined}
            data-disabled={state.disabled || undefined}
          >
            {controlIcon(icon, propsIcon)}
            {value.map((tag) => {
              const own = typeof propsTag === 'function' ? propsTag(tag) : propsTag;
              return (
                <Tag
                  key={tag}
                  {...mergePartProps<TagProps>({ variant: 'surface' }, own, {
                    onRemove: editable ? () => remove(tag) : undefined,
                  })}
                  data-tag=""
                >
                  {labelOf(tag)}
                </Tag>
              );
            })}
            <input
              {...mergeAttrs<'input'>({ sx: [controlStyles.input, tagsInputStyles.input] }, rest, {
                ref: _toRef(input),
                id: state.id,
                role: suggestions() ? 'combobox' : undefined,
                autocomplete: 'off',
                disabled: state.disabled,
                readonly: state.readonly,
                'aria-autocomplete': suggestions() ? 'list' : undefined,
                'aria-expanded': suggestions() ? open : undefined,
                'aria-controls': suggestions() ? listId : undefined,
                'aria-activedescendant':
                  open && suggestions() ? activeOptionId(list, listId) : undefined,
                'aria-invalid': state.invalid || undefined,
                'aria-required': state.required || undefined,
                'aria-describedby': state.describedBy,
                onKeydown,
                onPaste,
                onBlur: () => (open = false),
              })}
              value={_bind(inputValue)}
            />
            {clearable && value.length > 0 && editable && (
              <ClearButton
                {...mergePartProps<PresetIconButtonProps>(
                  { sx: controlStyles.button, radius: 'full' },
                  propsClear,
                  {
                    onClick: () => {
                      void layout.change(() => (value = []));
                      input?.focus();
                    },
                  },
                )}
              />
            )}
            <FormValue name={name} value={value} disabled={state.disabled} />
          </div>
          {suggestions() && (
            <ListPopover
              panelRef={_toRef(panel)}
              onToggle={onToggle}
              size={appearance().size}
              labelledBy={state.labelledBy}
              label={rest['aria-label']}
              loading={loading}
              onPick={() => {
                inputValue = '';
                input?.focus();
              }}
              listbox={{ list, id: listId, multiple: true, renderOption: children }}
              propsListbox={propsListbox}
              propsPopover={propsPopover}
            />
          )}
        </>
      );
    };
  },
);
