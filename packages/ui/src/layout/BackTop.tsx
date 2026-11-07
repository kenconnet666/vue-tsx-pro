/**
 * 回到顶部：长页面滚下去之后，右下角出现一个按钮，点了平滑滚回顶部（减少动态效果时直接跳回）。
 *
 *   <BackTop />                                   整页
 *   <BackTop target={() => scroller} threshold={200} />   某个滚动容器
 *
 * 是一个 FloatButton：固定在视口的结束边与底部（从右到左排版时在左下），滚过 threshold 才淡入；
 * 滚回去之后焦点移到页面（或容器）开头，键盘用户不用再从按钮的位置往回 Tab。名称与提示取语言包（回到顶部）。
 * 放进 FloatButtonGroup 时跟着组排，不自己固定；没出现时不占位。部件：Root（IconButton）。
 */
import { ArrowUp } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted } from 'vue';
import { useLang } from '../config/context';
import { t } from '../config/theme/tokens';
import { useEventListener } from '../utils/dom/event-listener';
import { useReducedMotion } from '../utils/dom/media-query';
import { mergePartProps } from '../utils/props';
import { FloatButton, FloatButtonGroupContext, type FloatButtonProps } from './FloatButton';

/** 未声明的属性落到 FloatButton 上 */
export interface BackTopProps extends Partial<
  Omit<FloatButtonProps, 'icon' | 'onClick' | 'aria-label'>
> {
  /** 滚动的容器；不写时是整页 */
  target?: () => HTMLElement | null | undefined;
  /** 滚过多少 px 后出现，默认 400 */
  threshold?: number;
  /** 名称，默认取语言包（回到顶部） */
  'aria-label'?: string;
}

/** BackTop 的样式：fade（单独用时淡入淡出）、hidden、collapsed（在 FloatButtonGroup 里没出现时） */
export const backTopStyles = css.create({
  fade: {
    transition: `opacity ${t.durations.md} ${t.easings.standard}, translate ${t.durations.md} ${t.easings.standard}`,
  },
  hidden: { opacity: 0, translate: '0 0.5em', pointerEvents: 'none', visibility: 'hidden' },
  collapsed: { display: 'none' },
});

/** 回到顶部：滚下去才出现的浮动按钮 */
export const BackTop = _component(({ target, threshold = 400, ...rest }: BackTopProps) => {
  const lang = useLang();
  const reduced = useReducedMotion();
  const grouped = FloatButtonGroupContext.inject(false);
  let shown = _state(false);

  /** 滚动的元素：容器，或整页（document.scrollingElement） */
  const scroller = () =>
    target?.() ??
    (typeof document === 'undefined' ? null : (document.scrollingElement as HTMLElement));
  const update = () => (shown = (scroller()?.scrollTop ?? 0) > threshold);

  // 整页的滚动事件在 window 上，容器的在容器自己上
  useEventListener(() => (target ? target() : window), 'scroll', update, { passive: true });
  onMounted(update);

  function backToTop() {
    const element = scroller();
    if (!element) return;
    element.scrollTo({ top: 0, behavior: reduced.value ? 'instant' : 'smooth' });
    // 焦点回到开头：整页时是 body 的第一个可聚焦位置，容器时是容器本身
    const focusTarget = target ? element : document.body;
    if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  }

  return () => (
    <FloatButton
      {...mergePartProps<FloatButtonProps>(
        {
          icon: ArrowUp,
          'aria-label': lang.backToTop,
          // 在组里没出现时不占位，单独用时淡入淡出
          sx: grouped
            ? !shown && backTopStyles.collapsed
            : [backTopStyles.fade, !shown && backTopStyles.hidden],
        },
        rest as Partial<FloatButtonProps>,
        { onClick: backToTop, 'aria-hidden': shown ? undefined : true },
      )}
    />
  );
});
