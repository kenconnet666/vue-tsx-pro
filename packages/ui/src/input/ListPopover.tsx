/**
 * 选项弹出层（div popover="auto"）：Select、Combobox、TagsInput 共用。锚定的浮层面板、浮层滚动条，
 * 里面是虚拟滚动的选项列表（ListboxView，滚动容器就是这里的 ScrollArea 视口）。
 *
 *   const { onToggle } = useAnchoredPopover(…, panel, …);
 *   <ListPopover panelRef={_toRef(panel)} onToggle={onToggle} size={size} label={…}
 *     listbox={{ list, id, empty, renderOption }} propsListbox={propsListbox} onPick={pick} />
 *
 * 开关与定位由父组件的 useAnchoredPopover 管（它要拿到面板元素）；这里只负责渲染。
 * 弹层渲染在顶层、不是输入框外壳的后代，不继承外壳的字号：按同一个 size 设置。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { Ref } from 'vue';
import { ScrollArea } from '../layout/ScrollArea';
import { floatingStyles } from '../utils/dom/floating';
import { toElement } from '../utils/dom/overlay';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { transitions } from '../utils/style/transitions';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { ListboxView, type ListboxViewProps } from './Listbox';

/** 弹层的属性由组件管理 */
export type ListPopoverManaged = 'popover';

/** ListPopover 的属性 */
export interface ListPopoverProps<T> {
  /** 面板元素（父组件里 _toRef(panel)）：交给 useAnchoredPopover 定位 */
  panelRef: Ref<HTMLElement | null>;
  /** 面板的 toggle 事件：交给 useAnchoredPopover，同步开关状态 */
  onToggle: (event: ToggleEvent) => void;
  /** 字号档位：同输入框外壳 */
  size?: TextSize;
  /** 列表的名称来源：外部标签的 id（优先）或 aria-label */
  labelledBy?: string;
  label?: string;
  /** 加载中：列表显示骨架或顶部进度条 */
  loading?: boolean;
  /** 点选了一项 */
  onPick?: (value: string) => void;
  /** 列表的组件自己给的属性（list、id、渲染方式…），使用方的 propsListbox 可以覆盖 */
  listbox: ListboxViewProps<T>;
  /** 使用方给列表的部件属性 */
  propsListbox?: Partial<ListboxViewProps<T>>;
  /** 使用方给弹层面板的部件属性 */
  propsPopover?: PartProps<'div', ListPopoverManaged>;
}

/** ListPopover 的样式：panel */
export const listPopoverStyles = stylex.create({
  panel: { maxWidth: 'calc(100vw - 2em)' },
});

/** 选项弹出层：锚定的面板、浮层滚动条与选项列表 */
export const ListPopover = _component(
  <T,>({
    panelRef,
    onToggle,
    size,
    labelledBy,
    label,
    loading,
    onPick,
    listbox,
    propsListbox,
    propsPopover,
  }: ListPopoverProps<T>) => {
    let scroller = _state.raw<HTMLElement | null>(null);
    return () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              floatingStyles.anchored,
              floatingStyles.surface,
              floatingStyles.scrollPanel,
              listPopoverStyles.panel,
              size && fontSizeStyles[size],
              transitions.scale,
            ],
          },
          propsPopover,
          { ref: panelRef, popover: 'auto', onToggle },
        )}
      >
        <ScrollArea
          focusable={false}
          sx={floatingStyles.scrollArea}
          propsViewport={{ ref: (element: unknown) => (scroller = toElement(element)) }}
        >
          <ListboxView
            {...mergePartProps<ListboxViewProps<T>>(listbox, propsListbox, {
              id: listbox.id,
              // 这里的 ScrollArea 视口是滚动容器：选项虚拟滚动
              scroller,
              loading,
              'aria-labelledby': labelledBy,
              'aria-label': labelledBy ? undefined : label,
              onPick,
            })}
          />
        </ScrollArea>
      </div>
    );
  },
);
