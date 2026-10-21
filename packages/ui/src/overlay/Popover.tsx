/**
 * 弹出框（非模态）：点击触发器在旁边弹出一块内容（筛选条件、简短表单、详情），点击外部或 Esc 关闭。
 * 原生 popover="auto" 负责顶层渲染、Esc、点击外部与嵌套顺序，floating-ui 负责定位（utils/dom/floating）。
 * 打开时焦点移到第一个可聚焦元素（有 autofocus 的优先），关闭后回到触发器。参考 Radix Popover。
 *
 *   <Popover open={_bind(open)} trigger={(props) => <Button {...props}>筛选</Button>}>…</Popover>
 *
 * 弹出层是 role="dialog"，默认以触发器的文字作为名称（aria-labelledby）；内容有自己的标题时用 aria-labelledby 指向它。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import {
  floatingStyles,
  useAnchoredPopover,
  type FloatingOptions,
  type FloatingPlacement,
} from '../utils/dom/floating';
import { toElement } from '../utils/dom/element';
import { focusFirst } from '../utils/dom/focus';
import { useLazyContent, type LazyContentOptions } from '../utils/motion/presence';
import { defaultLabelledBy, mergeAttrs, type PartProps, type TriggerProps } from '../utils/props';
import { transitions } from '../utils/style/transitions';

/** 交给触发器的属性：展开收起的通用属性，加上弹层需要的 id、ref 与 aria-haspopup */
export interface PopoverTriggerProps extends TriggerProps {
  /** 弹出层默认以触发器的文字作为无障碍名称（aria-labelledby） */
  id: string;
  /** 取得触发器元素：定位的参照、关闭后焦点回到这里 */
  ref: (element: unknown) => void;
  /** 告诉读屏这个按钮会打开对话框类的弹层 */
  'aria-haspopup': 'dialog';
}

/** 未声明的属性落到弹出层的 div 上 */
export interface PopoverProps
  extends
    PartProps<'div', 'id' | 'popover' | 'role'>,
    Pick<FloatingOptions, 'offset'>,
    LazyContentOptions {
  /** 是否打开：父级写 open={_bind(x)}；Esc 与点击外部会关闭并写回 */
  open?: boolean;
  /** 弹出位置，默认 bottom-start；空间不够时自动翻转 */
  placement?: FloatingPlacement;
  /** 显示指向触发器的箭头 */
  arrow?: boolean;
  /** 触发器：`(props) => <Button {...props}>更多</Button>` */
  trigger: (props: PopoverTriggerProps) => VNodeChild;
  /** 箭头的部件属性 */
  propsArrow?: PartProps<'span'>;
  children?: VNodeChild;
}

/** Popover 的样式：panel */
export const popoverStyles = stylex.create({
  panel: { padding: '_md', maxWidth: 'calc(100vw - 2em)' },
});

/** 弹出框：原生 popover + floating-ui 定位，打开时焦点进入、关闭后回到触发器 */
export const Popover = _component(
  ({
    open = _bindable(false),
    placement = 'bottom-start',
    offset,
    arrow = false,
    trigger,
    propsArrow,
    lazy = true,
    children,
    ...rest
  }: PopoverProps) => {
    const id = useId();
    const showContent = useLazyContent(
      () => open,
      () => lazy,
    );
    const triggerId = `${id}-trigger`;
    let anchor = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    let arrowElement = _state.raw<HTMLElement | null>(null);
    // 打开时焦点移入（等第一次定位、可见之后），Esc 与点击外部关闭后写回 open、焦点回到触发器
    const { onToggle } = useAnchoredPopover(
      () => ({ open, anchor, panel, floating: { placement, offset, arrow: arrowElement } }),
      { close: () => (open = false), shown: focusFirst },
    );

    return () => (
      <>
        {trigger({
          ref: (value) => (anchor = toElement(value)),
          onClick: () => (open = !open),
          'aria-expanded': open,
          id: triggerId,
          'aria-controls': id,
          'aria-haspopup': 'dialog',
        })}
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                floatingStyles.anchored,
                floatingStyles.surface,
                popoverStyles.panel,
                transitions.scale,
                arrow && floatingStyles.withArrow,
              ],
              'aria-labelledby': defaultLabelledBy(rest, triggerId),
            },
            rest,
            { ref: _toRef(panel), id, popover: 'auto', role: 'dialog', onToggle },
          )}
          data-state={open ? 'open' : 'closed'}
        >
          {showContent() && children}
          {arrow && (
            <span
              {...mergeAttrs<'span'>({ sx: floatingStyles.arrow }, propsArrow, {
                ref: _toRef(arrowElement),
                'aria-hidden': true,
              })}
            />
          )}
        </div>
      </>
    );
  },
);
