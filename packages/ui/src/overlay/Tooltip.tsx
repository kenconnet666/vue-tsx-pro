/**
 * 文字提示（role="tooltip"）：指针停在触发器上、或用键盘聚焦它时，显示一句简短说明（图标按钮的用途、快捷键）。
 * 参考 WAI-ARIA Tooltip 模式、Radix Tooltip、React Aria Tooltip：
 *
 *   <Tooltip trigger={(props) => <IconButton {...props} icon={Copy} aria-label="复制" />}>复制（Ctrl+C）</Tooltip>
 *
 * - 指针停留 delay 毫秒后显示；刚有提示关掉（skipDelay 内）时直接显示，在一排按钮上移动不用每次等；
 * - 键盘聚焦（:focus-visible）立即显示，失焦、Esc、按下触发器时隐藏；触屏不显示（没有悬停）；
 * - 指针可以移到提示上而不消失（WCAG 1.4.13）；同一时间只显示一个；
 * - 提示是对触发器的补充说明（aria-describedby）：触发器自己要有名称，提示里不放可交互的内容。
 *
 * 用 popover="manual" 渲染在顶层：它不是 auto，不会关掉正打开的菜单或弹出框；Esc 由组件处理。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount, useId, type VNodeChild } from 'vue';
import {
  createAnchoredLayer,
  floatingStyles,
  type FloatingOptions,
  type FloatingPlacement,
} from '../utils/dom/floating';
import { createHoverGroup, useHoverIntent } from '../utils/dom/hover-intent';
import { toElement } from '../utils/dom/overlay';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { transitions } from '../utils/style/transitions';

/** 交给触发器的属性：展开到触发元素上（`{...props}`） */
export interface TooltipTriggerProps {
  /** 取得触发器元素：定位的参照 */
  ref: (element: unknown) => void;
  /** 提示是对触发器的补充说明 */
  'aria-describedby': string;
  /** 指针进入：等 delay 后显示 */
  onPointerenter: (event: PointerEvent) => void;
  /** 指针离开：稍后隐藏（可以移到提示上） */
  onPointerleave: (event: PointerEvent) => void;
  /** 按下（点击）触发器时隐藏 */
  onPointerdown: () => void;
  /** 键盘聚焦时立即显示 */
  onFocus: (event: FocusEvent) => void;
  /** 失焦时隐藏 */
  onBlur: () => void;
}

/** 未声明的属性落到提示的 div 上 */
export interface TooltipProps
  extends PartProps<'div', 'id' | 'popover' | 'role'>, Pick<FloatingOptions, 'offset'> {
  /** 是否显示：父级可以写 open={_bind(x)} 控制或得知；一般不需要 */
  open?: boolean;
  /** 显示位置，默认 top；空间不够时自动翻转 */
  placement?: FloatingPlacement;
  /** 指针停留多久后显示（毫秒），默认 500 */
  delay?: number;
  /** 不显示（触发器照常渲染） */
  disabled?: boolean;
  /** 显示指向触发器的箭头 */
  arrow?: boolean;
  /** 触发器：`(props) => <IconButton {...props} … />` */
  trigger: (props: TooltipTriggerProps) => VNodeChild;
  /** 箭头的部件属性 */
  propsArrow?: PartProps<'span'>;
  /** 提示文字 */
  children?: VNodeChild;
}

/** 指针离开后多久隐藏（毫秒）：留出移到提示上的时间 */
const CLOSE_DELAY = 100;

/** 所有提示一组：同一时间只显示一个，刚关掉一个时下一个不用等 delay */
const tooltips = createHoverGroup();

/** Tooltip 的样式：panel */
export const tooltipStyles = stylex.create({
  panel: {
    boxSizing: 'border-box',
    maxWidth: 'min(20em, calc(100vw - 2em))',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    borderWidth: 0,
    borderRadius: '_sm',
    backgroundColor: '_inverseSurface',
    color: '_inverseText',
    fontSize: '_sm',
    lineHeight: '_normal',
    overflowWrap: 'break-word',
  },
});

/** 文字提示：悬停或键盘聚焦时显示在触发器旁边 */
export const Tooltip = _component(
  ({
    open = _bindable(false),
    placement = 'top',
    offset,
    delay = 500,
    disabled = false,
    arrow = false,
    trigger,
    propsArrow,
    children,
    ...rest
  }: TooltipProps) => {
    const id = useId();
    let anchor = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    let arrowElement = _state.raw<HTMLElement | null>(null);
    const layer = createAnchoredLayer();
    const hover = useHoverIntent(
      tooltips,
      () => ({ delay, closeDelay: CLOSE_DELAY, disabled }),
      (next) => (open = next),
    );

    // Esc 关闭提示；提示在对话框里时只关提示，不让同一次 Esc 关掉对话框
    function onKeydown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !open) return;
      event.preventDefault();
      event.stopPropagation();
      hover.closeNow();
    }

    _effect(() => {
      if (!open || disabled) {
        layer.hide({ restoreFocus: false });
        hover.closed();
        return;
      }
      if (!anchor || !panel) return;
      hover.opened();
      void layer.show(anchor, panel, { placement, offset, arrow: arrowElement });
      document.addEventListener('keydown', onKeydown, true);
      return () => document.removeEventListener('keydown', onKeydown, true);
    });
    onBeforeUnmount(() => layer.hide({ restoreFocus: false }));

    return () => (
      <>
        {trigger({
          ref: (value) => (anchor = toElement(value)),
          'aria-describedby': id,
          ...hover.trigger,
        })}
        <div
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [
                  floatingStyles.anchored,
                  tooltipStyles.panel,
                  transitions.fade,
                  arrow && floatingStyles.withArrow,
                ],
              },
              rest,
              {
                ref: _toRef(panel),
                id,
                popover: 'manual',
                role: 'tooltip',
                // 指针移到提示上不消失，离开提示后再隐藏
                ...hover.panel,
              },
            ),
          )}
          data-state={open && !disabled ? 'open' : 'closed'}
        >
          {children}
          {arrow && (
            <span
              {...elementProps(
                mergeProps<'span'>({ sx: floatingStyles.arrow }, propsArrow, {
                  ref: _toRef(arrowElement),
                  'aria-hidden': true,
                }),
              )}
            />
          )}
        </div>
      </>
    );
  },
);
