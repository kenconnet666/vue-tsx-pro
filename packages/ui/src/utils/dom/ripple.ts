/**
 * 波纹：按下时从指针位置扩散出一圈半透明的颜色，松开后淡出（键盘按下 Enter / 空格时从中心扩散）。
 * 纯 CSS 动画，时长取主题的 durations：开启“减少动态效果”时没有扩散过程，只是按下时变色。
 * 按钮、导航项、菜单项等可点击的组件共用；宿主元素加 rippleHostStyles.host（定位与裁切）。
 * 默认开启，createUi / Provider 的 ripple 全局开关，组件的 ripple prop 单独覆盖（见 useRipple）。
 *
 *   const ripple = useRipple(() => props.ripple)
 *   mergeProps<'button'>(默认, rest, { ...ripple })
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { useConfig } from '../../config/context';
import { afterTransitions } from '../style/transitions';

const expand = stylex.keyframes({
  from: { transform: 'scale(0)' },
  to: { transform: 'scale(1)' },
});

/** 宿主元素需要的样式：波纹相对它定位，超出圆角的部分裁掉 */
export const rippleHostStyles: Readonly<Record<'host', StyleXStyles>> = stylex.create({
  host: { position: 'relative', overflow: 'hidden' },
});

const styles = stylex.create({
  ripple: {
    position: 'absolute',
    borderRadius: '_full',
    pointerEvents: 'none',
    // 跟随文字颜色：实底按钮上是浅色，描边按钮上是深色
    backgroundColor: 'color-mix(in srgb, currentColor 22%, transparent)',
    animationName: expand,
    animationDuration: '_durations.lg',
    animationTimingFunction: '_easings.standard',
    animationFillMode: 'forwards',
    transition: 'opacity _durations.md _easings.exit',
  },
  fading: { opacity: 0 },
});

// 位置与大小是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
const placement = stylex.create({
  at: (x: number, y: number, size: number) => ({ left: x, top: y, width: size, height: size }),
});

/** useRipple 的结果：展开到宿主元素上（mergeProps 的受管层） */
export interface RippleHandlers {
  /** 指针按下：从按下的位置扩散 */
  onPointerdown: (event: PointerEvent) => void;
  /** Enter / 空格：从中心扩散 */
  onKeydown: (event: KeyboardEvent) => void;
}

/**
 * 组件里用的波纹：按开关决定是否出波纹，返回的两个处理函数展开到宿主元素上（`...ripple`）。
 * own 读组件自己的 ripple prop（没写时为 undefined，沿用配置）；在 setup 里调用
 */
export function useRipple(own: () => boolean | undefined): RippleHandlers {
  const config = useConfig();
  const handler = (event: PointerEvent | KeyboardEvent) => {
    if (own() ?? config.ripple) startRipple(event);
  };
  return { onPointerdown: handler, onKeydown: handler };
}

/** 不可用的宿主不出波纹 */
const isDisabled = (host: Element) => host.matches(':disabled, [aria-disabled="true"]');

/**
 * 在 event.currentTarget 上开始一个波纹，松开、移出、取消或失去焦点时淡出并移除。
 * 键盘事件只认 Enter 与空格（按住不放的重复事件忽略）。
 */
export function startRipple(event: PointerEvent | KeyboardEvent): void {
  const host = event.currentTarget;
  if (!(host instanceof HTMLElement) || isDisabled(host)) return;
  const keyboard = event instanceof KeyboardEvent;
  if (keyboard && (event.repeat || (event.key !== 'Enter' && event.key !== ' '))) return;
  if (!keyboard && event.button !== 0) return;

  const rect = host.getBoundingClientRect();
  const x = keyboard ? rect.width / 2 : event.clientX - rect.left;
  const y = keyboard ? rect.height / 2 : event.clientY - rect.top;
  // 圆心到最远的角的距离：扩散完正好盖满整个元素
  const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
  const ripple = document.createElement('span');
  ripple.setAttribute('aria-hidden', 'true');
  const { class: className, style } = stylex.attrs(
    styles.ripple,
    placement.at(x - radius, y - radius, radius * 2),
  );
  ripple.className = className ?? '';
  if (style) ripple.setAttribute('style', style);
  host.append(ripple);

  const release = () => {
    for (const [type, target] of releaseEvents) target.removeEventListener(type, release);
    ripple.classList.add(...(stylex.attrs(styles.fading).class ?? '').split(' '));
    void afterTransitions(ripple).then(() => ripple.remove());
  };
  const releaseEvents: [string, EventTarget][] = keyboard
    ? [
        ['keyup', host],
        ['blur', host],
      ]
    : [
        ['pointerup', window],
        ['pointercancel', window],
        ['pointerleave', host],
      ];
  for (const [type, target] of releaseEvents) target.addEventListener(type, release);
}
