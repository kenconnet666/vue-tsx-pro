/**
 * 命令面板：Mod+K（macOS 上 ⌘K，其他系统 Ctrl+K）或点触发按钮打开的搜索对话框，边输入边过滤，回车打开。
 * 文档站的站内搜索、后台的“跳转到…”都用它；数据由使用方给，选中后做什么也由使用方决定。
 *
 *   <CommandPalette
 *     items={pages}
 *     toOption={(page) => ({ value: page.path, label: page.title, description: page.summary, group: page.section })}
 *     onAction={(page) => router.push(page.path)}
 *   />
 *
 * 结构是 Dialog（模态、焦点循环、Esc 关闭）里放一个 combobox 输入框与 ListboxView：
 * 焦点一直在输入框上，↑↓ / Page Up / Page Down 移动高亮（aria-activedescendant），Enter 选中；
 * 数据层与 Select、Combobox 相同（useListState），选项多时虚拟滚动。
 * 远程搜索与 Combobox 一样：inputValue={_bind(keyword)} 拿到输入，filter={false} 不再本地过滤，取数据时给 loading。
 */
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { useId, watch, type VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon } from '../base/Icon';
import { Kbd } from '../base/Kbd';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useLang, useTextMatcher } from '../config/context';
import { controlStyles, controlSx, useControlAppearance } from '../input/control';
import {
  ListboxView,
  activeOptionId,
  type ListboxViewProps,
  type OptionRenderState,
} from '../input/Listbox';
import {
  handleListKeydown,
  useListState,
  type ListboxOption,
  type OptionMapping,
  toListboxOption,
} from '../input/list-state';
import { ariaKeyShortcut, formatHotkey, useHotkeys } from '../utils/dom/hotkeys';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { breakpoints } from '../config/theme/tokens';
import { openSetter } from '../utils/dom/open-change';
import { Dialog, type DialogProps } from './Dialog';

/** 交给触发器的属性：展开到按钮上 */
export interface CommandPaletteTriggerProps {
  /** 打开面板 */
  onClick: (event: MouseEvent) => void;
  /** 告诉读屏这个按钮会打开对话框 */
  'aria-haspopup': 'dialog';
  /** 面板是否打开 */
  'aria-expanded': boolean;
}

/** 与数据类型无关的属性；未声明的属性落到对话框（dialog）上 */
export interface CommandPaletteBaseProps<T> extends Omit<
  DialogProps,
  'open' | 'title' | 'description' | 'footer' | 'children' | 'onSelect'
> {
  /** 是否打开：父级可以写 open={_bind(x)}；快捷键、触发按钮、选中、Esc 都会改它 */
  open?: boolean;
  /** 数据：ListboxOption、字符串，或任意数据加 toOption */
  items: readonly T[];
  /** 执行了一项（回车或点击）：面板随即关闭 */
  onAction: (item: T) => void;
  /** 输入框里的文字：父级可以写 inputValue={_bind(x)}（远程搜索时据此取数据）；每次打开清空 */
  inputValue?: string;
  /** 过滤：默认按选项文字与说明匹配（忽略大小写与重音）；函数自定义；false 不过滤（远程搜索，items 就是结果） */
  filter?: false | ((item: T, query: string) => boolean);
  /** 正在取结果（远程搜索）：没有结果时列表里是骨架行，已有结果时顶部显示进度条 */
  loading?: boolean;
  /** 打开面板的快捷键，默认 'Mod+K'；false 不注册 */
  hotkey?: string | false;
  /** 输入框的占位文字，默认取语言包（搜索文档） */
  placeholder?: string;
  /** 面板的名称（读屏念的），默认取语言包（搜索） */
  label?: string;
  /** 触发器：`(props) => <IconButton {...props} icon={Search} aria-label="搜索" />`；默认是一个像搜索框的按钮，false 不渲染 */
  trigger?: ((props: CommandPaletteTriggerProps) => VNodeChild) | false;
  /** 自定义选项内容 */
  renderOption?: (item: T, state: OptionRenderState) => VNodeChild;
  /** 没有匹配时显示的内容；默认是 Empty（文案取语言包） */
  empty?: VNodeChild;
  /** 默认触发器的部件属性 */
  propsTrigger?: Partial<ButtonBaseProps>;
  /** 输入框的部件属性 */
  propsInput?: PartProps<'input'>;
  /** 列表的部件属性 */
  propsListbox?: Partial<ListboxViewProps<T>>;
}

/** 命令面板的属性；items 不是 ListboxOption 或字符串时要给 toOption */
export type CommandPaletteProps<T = ListboxOption> = CommandPaletteBaseProps<T> & OptionMapping<T>;

/** CommandPalette 的样式：dialog、search、input、listbox、trigger、triggerText、triggerLabel */
export const commandPaletteStyles = css.create({
  // 停在视口上部而不是正中：结果变多变少时输入框不跳
  dialog: { marginBlockStart: '12dvh' },
  search: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
    fontSize: '_lg',
  },
  input: { paddingBlock: '_sm' },
  listbox: { maxHeight: 'min(24rem, 50dvh)' },
  body: { padding: 0 },
  // 窄屏（40rem 以下，sizes.sm）只留放大镜图标，不挤占顶栏
  trigger: {
    gap: '_sm',
    minWidth: { default: null, [breakpoints.sm]: '12rem' },
    color: '_textMuted',
    cursor: 'pointer',
  },
  triggerText: { display: { default: 'none', [breakpoints.sm]: 'initial' } },
  // 按钮的名称来自这段文字（与看得见的一致，WCAG 2.5.3）：窄屏只留图标时视觉上隐藏，读屏仍念得到
  triggerLabel: {
    flexGrow: 1,
    textAlign: 'start',
    whiteSpace: 'nowrap',
    position: { default: 'absolute', [breakpoints.sm]: 'static' },
    width: { default: 1, [breakpoints.sm]: 'auto' },
    height: { default: 1, [breakpoints.sm]: 'auto' },
    overflow: { default: 'hidden', [breakpoints.sm]: 'visible' },
    clipPath: { default: 'inset(50%)', [breakpoints.sm]: 'none' },
  },
});

/** 命令面板：快捷键打开的搜索对话框 */
export const CommandPalette = _component(
  <T,>({
    open = _bindable(false),
    onOpenChange,
    inputValue = _bindable(''),
    items,
    toOption,
    onAction,
    filter,
    loading = false,
    hotkey = 'Mod+K',
    placeholder,
    label,
    trigger,
    renderOption,
    empty,
    propsTrigger,
    propsInput,
    propsListbox,
    ...rest
  }: CommandPaletteProps<T>) => {
    const lang = useLang();
    const textMatcher = useTextMatcher();
    const listId = useId();
    const appearance = useControlAppearance(() => ({}));
    const optionOf = (item: T) => toListboxOption(item, toOption);
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    function matches(item: T, text: string) {
      if (filter === false) return true;
      if (filter) return filter(item, text);
      const match = textMatcher();
      const option = optionOf(item);
      return match(option.label, text) || match(option.description ?? '', text);
    }

    const list = useListState({
      items: () => (inputValue ? items.filter((item) => matches(item, inputValue)) : items),
      toOption: optionOf,
      // 面板不记选择：选中就是执行
      selected: () => [],
      mode: () => 'single',
      onChange: () => {},
    });

    // 每次打开从空白开始；输入变了高亮第一个结果
    watch(
      () => open,
      (isOpen) => {
        if (isOpen) inputValue = '';
      },
    );
    // 远程搜索时结果晚到：结果变了也高亮第一个
    watch([() => inputValue, () => open, () => list.options.length], () => list.move('first'), {
      flush: 'post',
    });

    useHotkeys(() => (hotkey ? { [hotkey]: (event) => setOpen(!open, 'imperative', event) } : {}), {
      inInputs: true,
    });

    function pick(value: string, event?: Event) {
      const entry = list.options[list.indexOf(value)];
      if (!entry || entry.disabled) return;
      setOpen(false, 'select', event);
      onAction(entry.item);
    }

    function onKeydown(event: KeyboardEvent) {
      if (handleListKeydown(list, event, { homeEnd: false }, (value) => pick(value, event)))
        event.preventDefault();
    }

    const triggerProps = (): CommandPaletteTriggerProps => ({
      onClick: (event: MouseEvent) => setOpen(true, 'trigger', event),
      'aria-haspopup': 'dialog',
      'aria-expanded': open,
    });

    function renderTrigger() {
      if (trigger === false) return null;
      if (trigger) return trigger(triggerProps());
      const text = placeholder ?? lang.searchPlaceholder;
      return (
        <ButtonBase
          {...mergePartProps<ButtonBaseProps>(
            {
              sx: [
                controlSx(appearance(), { invalid: false, disabled: false, readonly: false }),
                commandPaletteStyles.trigger,
              ],
              // 快捷键由 aria-keyshortcuts 告诉读屏，显示它的 Kbd 不算进名称
              'aria-keyshortcuts': hotkey ? ariaKeyShortcut(hotkey) : undefined,
            },
            propsTrigger,
            triggerProps(),
          )}
        >
          <Icon icon={Search} sx={controlStyles.icon} />
          <span {...mergeAttrs<'span'>({ sx: commandPaletteStyles.triggerLabel })}>{text}</span>
          {hotkey && (
            <Kbd
              sx={commandPaletteStyles.triggerText}
              aria-hidden={ariaKeyShortcut(hotkey) ? 'true' : undefined}
            >
              {formatHotkey(hotkey)}
            </Kbd>
          )}
        </ButtonBase>
      );
    }

    return () => (
      <>
        {renderTrigger()}
        <Dialog
          {...mergePartProps<DialogProps>(
            {
              title: label ?? lang.searchLabel,
              sx: commandPaletteStyles.dialog,
              size: 'sm',
              closable: false,
              // 标题只给读屏：面板的名称
              propsHeader: { sx: visuallyHiddenStyles.hidden },
              propsBody: { propsContent: { sx: commandPaletteStyles.body } },
            },
            rest as Partial<DialogProps>,
          )}
          open={_bind(open)}
          onOpenChange={onOpenChange}
        >
          <div {...mergeAttrs<'div'>({ sx: commandPaletteStyles.search })}>
            <Icon icon={Search} sx={controlStyles.icon} />
            {/* _bind 编译为 v-model：输入法组合期间不过滤 */}
            <input
              {...mergeAttrs<'input'>(
                { sx: [controlStyles.input, commandPaletteStyles.input] },
                propsInput,
                {
                  role: 'combobox',
                  type: 'search',
                  autofocus: true,
                  autocomplete: 'off',
                  enterkeyhint: 'go',
                  placeholder: placeholder ?? lang.searchPlaceholder,
                  'aria-label': label ?? lang.searchLabel,
                  'aria-autocomplete': 'list',
                  'aria-expanded': true,
                  'aria-controls': listId,
                  'aria-activedescendant': activeOptionId(list, listId),
                  onKeydown,
                },
              )}
              value={_bind(inputValue)}
            />
          </div>
          <ListboxView
            {...mergePartProps<ListboxViewProps<T>>(
              {
                sx: commandPaletteStyles.listbox,
                list,
                id: listId,
                renderOption,
                empty,
                loading,
                propsEmpty: { description: lang.searchEmpty },
              },
              propsListbox,
              { id: listId, 'aria-label': label ?? lang.searchLabel, onPick: pick },
            )}
          />
        </Dialog>
      </>
    );
  },
);
