/**
 * 悬停浮层的壳：Tooltip 与 HoverCard 共用。触发器、面板、箭头三个元素，停留后打开（useHoverIntent），
 * 打开时锚定到触发器（createAnchoredLayer），Esc 关闭，卸载时收起。在 setup 里调用。
 *
 *   const layer = useHoverLayer(tooltips, () => ({ open, disabled, placement, offset, delay, closeDelay }), (next) => (open = next));
 *   trigger({ ref: layer.anchorRef, ...layer.hover.trigger })
 *   <div {...mergeAttrs({ sx }, rest, { ref: layer.panelRef, id: layer.id, popover: 'manual', ...layer.hover.panel })}>
 *     {children}
 *     {arrow && <span {...layer.arrowProps(propsArrow)} />}
 *   </div>
 *
 * 面板用 popover="manual"：不是 auto，不会关掉正打开的菜单或弹出框；manual 没有原生的 Esc，所以这里处理。
 */
import { onScopeDispose, shallowRef, useId, watchEffect } from 'vue';
import { mergeAttrs, type PartProps } from '../props';
import { createAnchoredLayer, floatingStyles, type FloatingPlacement } from './floating';
import { useHoverIntent, type HoverGroup, type HoverIntent } from './hover-intent';
import { toElement } from './overlay';

/** useHoverLayer 每次读取的选项 */
export interface HoverLayerOptions {
  /** 是否打开 */
  open: boolean;
  /** 不打开（触发器照常渲染） */
  disabled: boolean;
  /** 弹出位置 */
  placement: FloatingPlacement;
  /** 与触发器的距离 */
  offset?: number;
  /** 指针停留多久后打开（毫秒） */
  delay: number;
  /** 指针离开多久后关闭（毫秒）：留出移到浮层上的时间 */
  closeDelay: number;
}

/** useHoverLayer 的返回值 */
export interface HoverLayer {
  /** 面板的 id：Tooltip 给触发器的 aria-describedby */
  readonly id: string;
  /** 开关时机：trigger 展开到触发器上，panel 展开到面板上 */
  readonly hover: HoverIntent;
  /** 触发器元素的 ref（定位的参照） */
  anchorRef: (element: unknown) => void;
  /** 面板元素的 ref */
  panelRef: (element: unknown) => void;
  /** 箭头节点的属性：样式、ref、对读屏隐藏，使用方的 propsArrow 合进去 */
  arrowProps: (propsArrow?: PartProps<'span'>) => Record<string, unknown>;
  /** 元素在触发器或面板里：焦点在两者之间移动时不关 */
  contains: (target: EventTarget | null) => boolean;
}

/** 悬停浮层：停留后打开、锚定到触发器、Esc 关闭 */
export function useHoverLayer(
  group: HoverGroup,
  read: () => HoverLayerOptions,
  setOpen: (open: boolean) => void,
): HoverLayer {
  const id = useId();
  const anchor = shallowRef<HTMLElement | null>(null);
  const panel = shallowRef<HTMLElement | null>(null);
  const arrow = shallowRef<HTMLElement | null>(null);
  const layer = createAnchoredLayer();
  const hover = useHoverIntent(
    group,
    () => {
      const { delay, closeDelay, disabled } = read();
      return { delay, closeDelay, disabled };
    },
    setOpen,
  );

  // 浮层在对话框里时只关浮层，不让同一次 Esc 关掉对话框
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !read().open) return;
    event.preventDefault();
    event.stopPropagation();
    hover.closeNow();
  }

  watchEffect(
    (onCleanup) => {
      const { open, disabled, placement, offset } = read();
      if (!open || disabled) {
        layer.hide({ restoreFocus: false });
        hover.closed();
        return;
      }
      if (!anchor.value || !panel.value) return;
      hover.opened();
      void layer.show(anchor.value, panel.value, { placement, offset, arrow: arrow.value });
      document.addEventListener('keydown', onKeydown, true);
      onCleanup(() => document.removeEventListener('keydown', onKeydown, true));
    },
    { flush: 'post' },
  );
  onScopeDispose(() => layer.hide({ restoreFocus: false }));

  return {
    id,
    hover,
    anchorRef: (element) => (anchor.value = toElement(element)),
    panelRef: (element) => (panel.value = toElement(element)),
    arrowProps: (propsArrow) =>
      mergeAttrs<'span'>({ sx: floatingStyles.arrow }, propsArrow, {
        ref: (element: unknown) => (arrow.value = toElement(element)),
        'aria-hidden': true,
      }),
    contains: (target) =>
      target instanceof Node && !!(anchor.value?.contains(target) || panel.value?.contains(target)),
  };
}
