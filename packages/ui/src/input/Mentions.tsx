/**
 * 提及：多行文本框里输入 @ 弹出人员（或岗位、群组）列表，选中后写成“@名字 ”。留言、审批意见、协商回复里通知相关的人。
 *
 *   <Field label="留言"><Mentions _value={text} items={people} _mentions={notified} /></Field>
 *   <Mentions _value={text} load={(query, signal) => api.searchUsers(query, { signal })} toOption={…} />
 *
 * 值仍是文字；mentions 是文字里提到的选项的值（工号、岗位编号），随文字增删——删掉“@名字”就不再算提及。
 * 显示提及过的文字用 MentionText（提及高亮），拆分用 mentionSegments。
 *
 * - 弹出：@ 在开头或前面不是字母数字（邮箱里的 @ 不算），@ 与光标之间没有空白；列表贴在 @ 的位置（caretAnchor）。
 * - 过滤：本地按显示文字包含 @ 后面的文字；给 load 时按它远程搜索（同 Combobox）。
 * - 键盘：↑↓ 移动、Enter 或 Tab 选中、Esc 关闭（这个 @ 不再弹出，直到重新输入）；焦点一直在文本框里，
 *   高亮项经 aria-activedescendant 告诉读屏，结果数量播报。中文输入法组合期间不弹出、不过滤。
 *
 * 外壳与自动增高同 Textarea。部件：Root（外壳）、Textarea、Popover、Listbox。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { nextTick, useId, watch, type VNodeChild } from 'vue';
import { useLang, useTextMatcher } from '../config/context';
import { caretAnchor } from '../utils/dom/caret';
import { useAnchoredPopover } from '../utils/dom/floating';
import { isComposingKey } from '../utils/dom/hotkeys';
import { openSetter, type OpenChangeProps } from '../utils/dom/open-change';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { activeOptionId, type ListboxViewProps, type OptionRenderState } from './Listbox';
import { ListPopover } from './ListPopover';
import {
  handleListKeydown,
  toListboxOption,
  useListState,
  useResultAnnouncement,
  type ListboxOption,
  type OptionMapping,
} from './list-state';
import { useRemoteItems, type OptionsLoader } from './remote-items';
import { Textarea, type TextareaProps } from './Textarea';

/** 提及的弹出列表由组件管理 */
export type MentionsManaged = 'aria-autocomplete' | 'aria-controls' | 'aria-activedescendant';

/** Mentions 除 toOption 外的属性；未声明的属性落到 textarea 上（同 Textarea） */
export interface MentionsBaseProps<T>
  extends Omit<TextareaProps, MentionsManaged>, OpenChangeProps {
  /** 可以提及的人（ListboxOption、字符串，或任意数据加 toOption）；有 load 时是第一次结果之前的选项 */
  items?: readonly T[];
  /** 远程搜索：按 @ 后面的文字调用，停下 300 ms 后请求，只采用最后一次 */
  load?: OptionsLoader<T>;
  /** 文字里提到的选项的值：父级写 _mentions={x}，随文字更新 */
  _mentions?: string[];
  /** 触发的字符，默认 '@' */
  prefix?: string;
  /** 过滤：默认按显示文字包含 @ 后面的文字；false 不过滤（由调用方换 items） */
  filter?: false | ((item: T, query: string) => boolean);
  /** 列表是否打开：父级可以写 _open={x} */
  _open?: boolean;
  /** 正在取选项 */
  loading?: boolean;
  /** 自定义选项内容：`{(item, { active }) => …}`（头像、部门） */
  children?: (item: T, state: OptionRenderState) => VNodeChild;
  /** 没有匹配的人时列表里显示的内容 */
  empty?: VNodeChild;
  /** 弹出层的部件属性 */
  propsPopover?: PartProps<'div', 'id' | 'popover'>;
  /** 列表的部件属性 */
  propsListbox?: Partial<ListboxViewProps<T>>;
}

/** 提及输入框的属性；items 不是 ListboxOption 或字符串时要给 toOption */
export type MentionsProps<T = ListboxOption> = MentionsBaseProps<T> & OptionMapping<T>;

/** 拆开的一段文字：普通文字，或提及（带它的选项） */
export interface MentionSegment {
  /** 这一段的文字（提及时含 @） */
  text: string;
  /** 提及的选项；普通文字没有 */
  mention?: ListboxOption;
}

/** @ 前面是这些字符时不算提及（邮箱 name@example.com） */
const WORD_BEFORE = /[A-Za-z0-9_.]/;

/**
 * 把文字拆成普通文字与提及：“@名字”里的名字是 options 里某一项的显示文字（有多个能匹配时取最长的）。
 * 提及的显示（MentionText）与找出提到了谁（mentionedValues）都用它
 */
export function mentionSegments(
  text: string,
  options: readonly ListboxOption[],
  prefix = '@',
): MentionSegment[] {
  const byLength = options
    .filter((option) => option.label)
    .toSorted((a, b) => b.label.length - a.label.length);
  const segments: MentionSegment[] = [];
  let plain = '';
  let index = 0;
  while (index < text.length) {
    const mention =
      text.startsWith(prefix, index) && !WORD_BEFORE.test(text[index - 1] ?? '')
        ? byLength.find((option) => text.startsWith(option.label, index + prefix.length))
        : undefined;
    if (!mention) {
      plain += text[index];
      index += 1;
      continue;
    }
    if (plain) segments.push({ text: plain });
    plain = '';
    const length = prefix.length + mention.label.length;
    segments.push({ text: text.slice(index, index + length), mention });
    index += length;
  }
  if (plain) segments.push({ text: plain });
  return segments;
}

/** 文字里提到了哪些选项（值，按第一次出现的顺序，不重复） */
export function mentionedValues(
  text: string,
  options: readonly ListboxOption[],
  prefix = '@',
): string[] {
  const values = mentionSegments(text, options, prefix).flatMap((segment) =>
    segment.mention ? [segment.mention.value] : [],
  );
  return [...new Set(values)];
}

/** MentionText 与 Mentions 的样式：mention、text、panel */
export const mentionStyles = css.create({
  // 提及：强调色的文字，浅底
  mention: {
    color: '_accentText',
    backgroundColor: '_accentSoft',
    borderRadius: '_sm',
    paddingInline: '0.125em',
    fontWeight: '_medium',
  },
  text: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  // 弹层贴着光标、不跟文本框同宽：给个合适的宽度
  panel: { width: '16em' },
});

/** 未声明的属性落到 span 上 */
export interface MentionTextProps extends PartProps<'span'> {
  /** 文字 */
  text: string;
  /** 能被提及的选项：“@显示文字”高亮 */
  options: readonly ListboxOption[];
  /** 触发的字符，默认 '@' */
  prefix?: string;
  /** 提及的部件属性，可以按选项计算（做成链接、悬停卡片时用 renderMention） */
  propsMention?: PartProps<'span'> | ((mention: ListboxOption) => PartProps<'span'>);
  /** 自己渲染一个提及（链接到个人页、HoverCard）；不写时是高亮的文字 */
  renderMention?: (mention: ListboxOption, text: string) => VNodeChild;
}

/** 带提及的文字：“@名字”高亮，换行照常（pre-wrap） */
export const MentionText = _component(
  ({ text, options, prefix = '@', propsMention, renderMention, ...rest }: MentionTextProps) =>
    () => (
      <span {...mergeAttrs<'span'>({ sx: mentionStyles.text }, rest)}>
        {mentionSegments(text, options, prefix).map((segment) => {
          if (!segment.mention) return segment.text;
          if (renderMention) return renderMention(segment.mention, segment.text);
          const own =
            typeof propsMention === 'function' ? propsMention(segment.mention) : propsMention;
          return (
            <span {...mergeAttrs<'span'>({ sx: mentionStyles.mention }, own)}>{segment.text}</span>
          );
        })}
      </span>
    ),
);

/** 提及输入框：多行文本框 + 跟着 @ 弹出的人员列表 */
export const Mentions = _component(
  <T,>({
    _value: value = _bindable(''),
    _mentions: mentions = _bindable<string[]>([]),
    items = [],
    toOption,
    load,
    prefix = '@',
    filter,
    _open: open = _bindable(false),
    onOpenChange,
    loading = false,
    children,
    empty,
    propsRoot,
    propsPopover,
    propsListbox,
    ...rest
  }: MentionsProps<T>) => {
    const lang = useLang();
    const textMatcher = useTextMatcher();
    const listId = useId();
    let shell = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    // 正在提及：@ 在文字里的位置，与 @ 到光标之间的文字（过滤词）
    let trigger = _state<number | null>(null);
    let query = _state('');
    // 按 Esc 关掉的那个 @：光标还在它后面时不再弹出
    let dismissed: number | null = null;
    // 见过的选项（远程搜索换掉 items 之后，已提及的人仍能认出来）
    const known = new Map<string, ListboxOption>();
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    const optionOf = (item: T) => toListboxOption(item, toOption);
    const textarea = () => shell?.querySelector('textarea') ?? null;

    const remote = useRemoteItems({
      load: () => load,
      query: () => query,
      open: () => open,
      items: () => items,
    });
    const list = useListState({
      items: () =>
        load || filter === false
          ? remote.items()
          : remote
              .items()
              .filter((item) =>
                !query
                  ? true
                  : filter
                    ? filter(item, query)
                    : textMatcher()(optionOf(item).label, query),
              ),
      toOption: optionOf,
      selected: () => [],
      mode: () => 'single',
      onChange: () => {},
    });
    useResultAnnouncement(() => ({
      query: open ? query || prefix : '',
      count: list.options.length,
    }));

    // 文字里提到的人：随文字与见过的选项更新
    watch(
      () => [value, remote.items()] as const,
      ([text, current]) => {
        for (const item of current) {
          const option = optionOf(item);
          known.set(option.value, option);
        }
        const next = mentionedValues(text, [...known.values()], prefix);
        if (next.join('\n') !== mentions.join('\n')) mentions = next;
      },
      { immediate: true },
    );

    // 远程结果后到：打开着又没有高亮项时高亮第一项（Enter 才能直接选中）
    watch(
      () => list.options.length,
      () => {
        if (open && list.active === undefined) list.move('first');
      },
    );

    /** 看光标前面是不是正在写的提及：是就按 @ 后面的文字过滤并打开，不是就关闭 */
    function detect(event?: Event) {
      const element = textarea();
      if (!element || rest.readonly || rest.disabled) return;
      const caret = element.selectionStart;
      const before = element.value.slice(0, caret);
      const at = before.lastIndexOf(prefix);
      const typed = at < 0 ? '' : before.slice(at + prefix.length);
      const mentioning =
        at >= 0 &&
        element.selectionEnd === caret &&
        !WORD_BEFORE.test(before[at - 1] ?? '') &&
        !/\s/.test(typed) &&
        typed.length <= 30;
      if (!mentioning || at === dismissed) {
        if (!mentioning) dismissed = null;
        trigger = null;
        if (open) setOpen(false, 'focus', event);
        return;
      }
      const opening = trigger !== at || !open;
      trigger = at;
      query = typed;
      if (opening) setOpen(true, 'trigger', event);
      list.move('first');
    }

    /** 选中一项：把“@过滤词”换成“@名字 ”，光标放在后面 */
    function pick(choice: string, event?: Event) {
      const element = textarea();
      const option = list.options.find((entry) => entry.value === choice);
      if (!element || trigger === null || !option) return;
      known.set(option.value, option);
      const inserted = `${prefix}${option.label} `;
      const caret = element.selectionStart;
      const start = trigger;
      value = element.value.slice(0, start) + inserted + element.value.slice(caret);
      trigger = null;
      setOpen(false, 'select', event);
      void nextTick(() => {
        element.focus();
        element.setSelectionRange(start + inserted.length, start + inserted.length);
      });
    }

    function onKeydown(event: KeyboardEvent) {
      if (!open || isComposingKey(event)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissed = trigger;
        setOpen(false, 'escape', event);
        return;
      }
      if (event.key === 'Tab' && list.active !== undefined) {
        event.preventDefault();
        pick(list.active, event);
        return;
      }
      if (handleListKeydown(list, event, { homeEnd: false }, (choice) => pick(choice, event)))
        event.preventDefault();
    }

    // 移动光标（方向键、Home / End）后重新判断；↑↓ 在列表打开时是移动高亮，不算
    function onKeyup(event: KeyboardEvent) {
      if (event.isComposing) return;
      if (open && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) return;
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !open) detect(event);
    }

    const { onToggle } = useAnchoredPopover(
      () => {
        const element = textarea();
        return {
          open,
          anchor: element && caretAnchor(element, () => trigger ?? element.selectionStart),
          panel,
          floating: { placement: 'bottom-start', fitHeight: true },
          restoreFocus: false,
        };
      },
      {
        close: (reason, event) => {
          if (reason === 'escape') dismissed = trigger;
          setOpen(false, reason, event);
        },
      },
    );

    return () => (
      <>
        <Textarea
          {...mergePartProps<TextareaProps>(
            { propsRoot: mergePartProps<PartProps<'div'>>({}, propsRoot, { ref: _toRef(shell) }) },
            rest,
            {
              'aria-autocomplete': 'list',
              'aria-controls': open ? listId : undefined,
              'aria-activedescendant': open ? activeOptionId(list, listId) : undefined,
              onInput: (event: Event) => !(event as InputEvent).isComposing && detect(event),
              onCompositionend: (event: CompositionEvent) => detect(event),
              onClick: (event: MouseEvent) => detect(event),
              onKeydown,
              onKeyup,
              onBlur: (event: FocusEvent) => open && setOpen(false, 'focus', event),
            },
          )}
          _value={value}
        />
        <ListPopover
          panelRef={_toRef(panel)}
          onToggle={onToggle}
          size={rest.size}
          label={lang.mentionsList}
          loading={loading || remote.loading()}
          onPick={(choice) => pick(choice)}
          listbox={{
            list,
            id: listId,
            renderOption: children,
            empty: remote.failure() ?? empty ?? lang.mentionsEmpty,
          }}
          propsListbox={propsListbox}
          propsPopover={mergePartProps<PartProps<'div', 'id' | 'popover'>>(
            { sx: mentionStyles.panel },
            propsPopover,
          )}
        />
      </>
    );
  },
);
