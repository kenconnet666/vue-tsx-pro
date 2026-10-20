/**
 * 悬停卡片：指针停在触发器（通常是链接、用户名）上、或用键盘聚焦它时，弹出一张富内容卡片（用户资料、链接预览）。
 * 开关时机同 Tooltip（useHoverIntent：停留后打开、可以移到卡片上、同组只开一个、刚关掉一个时下一个直接打开），
 * 定位同 Popover（floating-ui，可选箭头）。参考 Radix HoverCard。
 *
 *   <HoverCard trigger={(props) => <Link {...props} href="/u/ada">@ada</Link>}>
 *     <Avatar name="Ada Lovelace" /> …
 *   </HoverCard>
 *
 * 卡片只是预览：里面的信息要在别处也能拿到（触屏没有悬停）。卡片里可以有链接、按钮：
 * 键盘聚焦触发器打开后按 Tab 进入卡片，焦点离开触发器与卡片时关闭；Esc 关闭。
 * 用 popover="manual" 渲染在顶层，不会关掉正打开的菜单或弹出框。开关、定位、Esc 见 useHoverLayer（与 Tooltip 共用）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import {
  floatingStyles,
  type FloatingOptions,
  type FloatingPlacement,
} from '../utils/dom/floating';
import { createHoverGroup } from '../utils/dom/hover-intent';
import { useHoverLayer } from '../utils/dom/hover-layer';
import { useLazyContent, type LazyContentOptions } from '../utils/motion/presence';
import { mergeAttrs, type PartProps } from '../utils/props';
import { transitions } from '../utils/style/transitions';

/** 交给触发器的属性：展开到触发元素上（`{...props}`） */
export interface HoverCardTriggerProps {
  /** 取得触发器元素：定位的参照 */
  ref: (element: unknown) => void;
  /** 指针进入：等 delay 后打开 */
  onPointerenter: (event: PointerEvent) => void;
  /** 指针离开：稍后关闭（可以移到卡片上） */
  onPointerleave: () => void;
  /** 按下（点击）触发器时关闭 */
  onPointerdown: () => void;
  /** 键盘聚焦时立即打开 */
  onFocus: (event: FocusEvent) => void;
  /** 焦点离开（不是移进卡片）时关闭 */
  onBlur: (event: FocusEvent) => void;
}

/** 未声明的属性落到卡片的 div 上 */
export interface HoverCardProps
  extends PartProps<'div', 'id' | 'popover'>, Pick<FloatingOptions, 'offset'>, LazyContentOptions {
  /** 是否打开：父级可以写 open={_bind(x)} 控制或得知 */
  open?: boolean;
  /** 弹出位置，默认 bottom；空间不够时自动翻转 */
  placement?: FloatingPlacement;
  /** 指针停留多久后打开（毫秒），默认 700 */
  delay?: number;
  /** 指针离开多久后关闭（毫秒），默认 300 */
  closeDelay?: number;
  /** 不打开（触发器照常渲染） */
  disabled?: boolean;
  /** 显示指向触发器的箭头 */
  arrow?: boolean;
  /** 触发器：`(props) => <Link {...props} … />` */
  trigger: (props: HoverCardTriggerProps) => VNodeChild;
  /** 箭头的部件属性 */
  propsArrow?: PartProps<'span'>;
  /** 卡片内容 */
  children?: VNodeChild;
}

/** HoverCard 的样式：panel */
export const hoverCardStyles = stylex.create({
  panel: { padding: '_md', maxWidth: 'min(22em, calc(100vw - 2em))' },
});

/** 所有悬停卡片一组：同一时间只开一个 */
const hoverCards = createHoverGroup();

/** 悬停卡片：悬停或键盘聚焦时在触发器旁边显示富内容 */
export const HoverCard = _component(
  ({
    open = _bindable(false),
    placement = 'bottom',
    offset,
    delay = 700,
    closeDelay = 300,
    disabled = false,
    arrow = false,
    trigger,
    propsArrow,
    lazy = true,
    children,
    ...rest
  }: HoverCardProps) => {
    const showContent = useLazyContent(
      () => open,
      () => lazy,
    );
    const layer = useHoverLayer(
      hoverCards,
      () => ({ open, disabled, placement, offset, delay, closeDelay }),
      (next) => (open = next),
    );

    return () => (
      <>
        {trigger({
          ref: layer.anchorRef,
          ...layer.hover.trigger,
          // Tab 进卡片（下一个可聚焦元素）时不关
          onBlur: (event: FocusEvent) => {
            if (!layer.contains(event.relatedTarget)) layer.hover.closeNow();
          },
        })}
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                floatingStyles.anchored,
                floatingStyles.surface,
                hoverCardStyles.panel,
                transitions.scale,
                arrow && floatingStyles.withArrow,
              ],
            },
            rest,
            {
              ref: layer.panelRef,
              id: layer.id,
              popover: 'manual',
              ...layer.hover.panel,
              onFocusout: (event: FocusEvent) => {
                if (!layer.contains(event.relatedTarget)) layer.hover.closeNow();
              },
            },
          )}
          data-state={open && !disabled ? 'open' : 'closed'}
        >
          {showContent() && children}
          {arrow && <span {...layer.arrowProps(propsArrow)} />}
        </div>
      </>
    );
  },
);
