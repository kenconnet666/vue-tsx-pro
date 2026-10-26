/**
 * 回到顶部：长页面滚下去之后，右下角出现一个按钮，点了平滑滚回顶部（减少动态效果时直接跳回）。
 *
 *   <BackTop />                                   整页
 *   <BackTop target={() => scroller} threshold={200} />   某个滚动容器
 *
 * 按钮固定在视口的结束边与底部（insetInlineEnd，从右到左排版时在左下），滚过 threshold 才淡入；
 * 滚回去之后焦点移到页面（或容器）开头，键盘用户不用再从按钮的位置往回 Tab。名称取语言包（回到顶部）。
 * 部件：Root（IconButton）。
 */
import { ArrowUp } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { useEventListener } from '../utils/dom/event-listener';
import { useReducedMotion } from '../utils/dom/media-query';
import { mergePartProps } from '../utils/props';
import { t } from '../config/theme/tokens';

/** 未声明的属性落到按钮（IconButton）上 */
export interface BackTopProps extends Partial<Omit<IconButtonProps, 'icon' | 'onClick'>> {
  /** 滚动的容器；不写时是整页 */
  target?: () => HTMLElement | null | undefined;
  /** 滚过多少 px 后出现，默认 400 */
  threshold?: number;
}

/** BackTop 的样式：root、hidden */
export const backTopStyles = css.create({
  root: {
    position: 'fixed',
    insetInlineEnd: '_lg',
    insetBlockEnd: '_lg',
    zIndex: 20,
    boxShadow: '_md',
    transition: `opacity ${t.durations.md} ${t.easings.standard}, translate ${t.durations.md} ${t.easings.standard}`,
  },
  hidden: { opacity: 0, translate: '0 0.5em', pointerEvents: 'none', visibility: 'hidden' },
});

/** 回到顶部：滚下去才出现的浮动按钮 */
export const BackTop = _component(({ target, threshold = 400, ...rest }: BackTopProps) => {
  const lang = useLang();
  const reduced = useReducedMotion();
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
    <IconButton
      {...mergePartProps<IconButtonProps>(
        {
          icon: ArrowUp,
          variant: 'surface',
          tone: 'neutral',
          radius: 'full',
          size: 'lg',
          'aria-label': lang.backToTop,
          sx: [backTopStyles.root, !shown && backTopStyles.hidden],
        },
        rest,
        { onClick: backToTop, 'aria-hidden': shown ? undefined : true },
      )}
    />
  );
});
