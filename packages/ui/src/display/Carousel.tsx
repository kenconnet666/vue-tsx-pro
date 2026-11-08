/**
 * 轮播：横幅、商品图、图片组。原生横向滚动加 scroll-snap（触摸板、手指滑动、拖滚动条都是浏览器自己的），
 * 上一张 / 下一张、页点、可关的自动播放；参考 WAI-ARIA APG 的 Carousel 模式。
 *
 *   <Carousel items={banners} aria-label="活动">{(banner) => <Image src={banner.src} alt={banner.title} />}</Carousel>
 *   <Carousel items={products} slidesPerView={3} gap="1em" loop={false} />      一次看三张
 *   <Carousel items={banners} autoplay={6000} _index={current} />               六秒换一张
 *
 * - 读屏：根元素是带名称的区域（aria-roledescription="carousel"），每张是 role="group"、名称“第 2 张，共 5 张”。
 *   不自动播放时滚动区域是 aria-live="polite"，换张会念；自动播放时关掉播报。
 * - 自动播放：指针停在上面、焦点进到里面时暂停，前面有暂停 / 播放按钮；偏好减少动态效果时一开始就是暂停的。
 * - _index 是最前面那张的序号（一次看几张时最大是 items.length - slidesPerView）；滚动、点按钮、页点都会写回。
 * - 从右到左排版时方向跟着换。部件：Root（section）、Viewport（滚动区域）、Slide、Previous、Next、Controls、Dot、Pause。
 */
import { ChevronLeft, ChevronRight, Pause, Play } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted, onScopeDispose, watch, type VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { t } from '../config/theme/tokens';
import { isRtl } from '../utils/dom/direction';
import { useReducedMotion } from '../utils/dom/media-query';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { partAttrs } from '../config/styles';

/** 未声明的属性落到根元素（section）上；aria-label 是轮播的名称 */
export interface CarouselProps<T> extends PartProps<'section', 'role'> {
  /** 每一张的数据 */
  items: readonly T[];
  /** 渲染一张：`{(item, index) => …}` */
  children: (item: T, index: number) => VNodeChild;
  /** 每张的 key，默认用序号 */
  getKey?: (item: T, index: number) => PropertyKey;
  /** 最前面那张的序号：父级写 _index={x} */
  _index?: number;
  /** 一次看几张，默认 1 */
  slidesPerView?: number;
  /** 张与张之间的间距（CSS 长度），默认 0；一次看几张时常用 1em */
  gap?: string;
  /** 到头后接着从另一头开始，默认 true */
  loop?: boolean;
  /** 自动播放：true 是每 5 秒，数字是毫秒；默认不自动播放 */
  autoplay?: boolean | number;
  /** 两侧的上一张 / 下一张按钮，默认显示 */
  arrows?: boolean;
  /** 底部的页点，默认显示 */
  dots?: boolean;
  /** 滚动区域的部件属性 */
  propsViewport?: PartProps<'div'>;
  /** 每一张外层的部件属性 */
  propsSlide?: PartProps<'div', 'role' | 'aria-roledescription'>;
  /** 上一张按钮的部件属性 */
  propsPrevious?: Partial<IconButtonProps>;
  /** 下一张按钮的部件属性 */
  propsNext?: Partial<IconButtonProps>;
  /** 底部控制条（暂停按钮与页点）的部件属性 */
  propsControls?: PartProps<'div'>;
  /** 自动播放时“暂停 / 播放”按钮的部件属性 */
  propsPause?: Partial<IconButtonProps>;
  /** 每个页点的部件属性 */
  propsDot?: Partial<ButtonBaseProps>;
}

/** 部件的标记（data-scope="carousel"） */
const carouselPart = (part: string) => partAttrs({ name: 'Carousel' }, part);

/** Carousel 的样式：root、viewport、slide、arrow、previous、next、controls、dot、dotActive */
export const carouselStyles = css.create({
  root: { position: 'relative', minWidth: 0 },
  viewport: {
    position: 'relative',
    display: 'flex',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
    overscrollBehaviorX: 'contain',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': { display: 'none' },
  },
  slide: { flexShrink: 0, minWidth: 0, scrollSnapAlign: 'start' },
  arrow: {
    position: 'absolute',
    insetBlockStart: '50%',
    translate: '0 -50%',
    boxShadow: '_md',
  },
  previous: { insetInlineStart: '_sm' },
  next: { insetInlineEnd: '_sm' },
  controls: {
    position: 'absolute',
    insetBlockEnd: '_sm',
    insetInlineStart: '50%',
    translate: '-50% 0',
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    paddingInline: '_xs',
    borderRadius: '_full',
    backgroundColor: `color-mix(in srgb, ${t.colors.surface} 75%, transparent)`,
    backdropFilter: 'blur(4px)',
  },
  // 点击区域够大（24px），看得见的点是 ::after
  dot: {
    display: 'grid',
    placeItems: 'center',
    width: '1.25em',
    height: `max(1.5em, ${t.sizes.minTarget})`,
    transition: `width ${t.durations.md} ${t.easings.standard}`,
    '::after': {
      content: '""',
      width: '0.5em',
      height: '0.5em',
      borderRadius: '_full',
      // 悬停时圆点加深：页点也是按钮
      backgroundColor: { default: '_borderStrong', _hover: '_textMuted' },
      transition: `width ${t.durations.md} ${t.easings.standard}, background-color ${t.durations.md} ${t.easings.standard}`,
    },
  },
  dotActive: { width: '2em', '::after': { width: '1.25em', backgroundColor: '_accent' } },
});

/** 动态样式（任意值，单独一个 create，见 COMPONENTS.md §4） */
const carouselSizeStyles = css.create({
  gap: (gap: string) => ({ gap }),
  slide: (perView: number, gap: string) => ({
    flexBasis: `calc((100% - ${perView - 1} * ${gap}) / ${perView})`,
  }),
});

/** 轮播：横向滚动加吸附，上一张 / 下一张、页点、自动播放 */
export const Carousel = _component(
  <T,>({
    items,
    children,
    getKey,
    _index: index = _bindable(0),
    slidesPerView = 1,
    gap = '0px',
    loop = true,
    autoplay = false,
    arrows = true,
    dots = true,
    propsViewport,
    propsSlide,
    propsPrevious,
    propsNext,
    propsControls,
    propsPause,
    propsDot,
    'aria-label': label,
    ...rest
  }: CarouselProps<T>) => {
    const lang = useLang();
    const reduced = useReducedMotion();
    let viewport = _state.raw<HTMLElement | null>(null);
    // 偏好减少动态效果时一开始就暂停（挂载后）；用户点了播放照样播
    let paused = _state(false);
    // 偏好在服务端拿不到：挂载后再按它暂停，水合时两边一致
    onMounted(() => {
      if (reduced.value) paused = true;
    });
    let hovering = _state(false);
    let focused = _state(false);

    // 一次看 1.5 张这种：最后一个序号向上取整，滚到底就算到了最后
    const last = () => Math.max(0, Math.ceil(items.length - slidesPerView));
    const interval = () => (autoplay === true ? 5000 : autoplay || 0);
    const playing = () => interval() > 0 && last() > 0 && !paused && !hovering && !focused;

    /** 第 i 张对齐到起始边时的 scrollLeft（从右到左排版时是负数） */
    function offsetOf(element: HTMLElement, i: number): number {
      const slide = element.children[i] as HTMLElement | undefined;
      if (!slide) return 0;
      return isRtl(element)
        ? slide.offsetLeft + slide.offsetWidth - element.clientWidth
        : slide.offsetLeft;
    }

    /** 滚动停在哪一张：离哪张对齐的位置最近 */
    function nearest(element: HTMLElement): number {
      if (Math.abs(element.scrollLeft) >= element.scrollWidth - element.clientWidth - 1)
        return last();
      let best = 0;
      for (let i = 1; i <= last(); i++) {
        const distance = Math.abs(element.scrollLeft - offsetOf(element, i));
        if (distance < Math.abs(element.scrollLeft - offsetOf(element, best))) best = i;
      }
      return best;
    }

    function scrollTo(i: number) {
      viewport?.scrollTo({
        left: offsetOf(viewport, i),
        behavior: reduced.value ? 'instant' : 'smooth',
      });
    }

    /** 换到第 target 张：loop 时绕回另一头 */
    function go(target: number) {
      const count = last() + 1;
      const next = loop ? (target + count) % count : Math.min(Math.max(target, 0), last());
      index = next;
      scrollTo(next);
    }

    // 父级改了 _index（或首次挂载）：滚过去；滚动本身写回的不再滚
    let settled = index;
    watch(
      () => [index, viewport] as const,
      ([next, element]) => {
        if (!element || next === settled) return;
        settled = next;
        scrollTo(next);
      },
      { flush: 'post' },
    );

    // 滚动停下（最后一次 scroll 之后 100 ms）时按位置写回序号
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    function onScroll() {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!viewport) return;
        settled = nearest(viewport);
        index = settled;
      }, 100);
    }

    // 自动播放：每次换张、暂停条件变化时重新计时
    let timer: ReturnType<typeof setTimeout> | undefined;
    watch(
      () => [playing(), index, interval()] as const,
      ([play, current, delay]) => {
        clearTimeout(timer);
        if (play && typeof window !== 'undefined') timer = setTimeout(() => go(current + 1), delay);
      },
      { immediate: true },
    );
    onScopeDispose(() => {
      clearTimeout(timer);
      clearTimeout(scrollTimer);
    });

    const arrow = (direction: -1 | 1) => {
      const disabled = !loop && (direction < 0 ? index <= 0 : index >= last());
      return (
        <IconButton
          {...mergePartProps<IconButtonProps>(
            {
              icon: direction < 0 ? ChevronLeft : ChevronRight,
              propsIcon: { flipInRtl: true },
              'aria-label': direction < 0 ? lang.carouselPrevious : lang.carouselNext,
              variant: 'surface',
              tone: 'neutral',
              radius: 'full',
              sx: [
                carouselStyles.arrow,
                direction < 0 ? carouselStyles.previous : carouselStyles.next,
              ],
            },
            direction < 0 ? propsPrevious : propsNext,
            { disabled, onClick: () => go(index + direction) },
          )}
        />
      );
    };

    return () => {
      const total = items.length;
      const pages = last() + 1;
      const showControls = (dots && pages > 1) || interval() > 0;
      return (
        <section
          {...mergeAttrs<'section'>({ sx: carouselStyles.root, ...carouselPart('root') }, rest, {
            'aria-roledescription': 'carousel',
            'aria-label': label ?? lang.carousel,
            onPointerenter: (event: PointerEvent) =>
              event.pointerType === 'mouse' && (hovering = true),
            onPointerleave: () => (hovering = false),
            onFocusin: () => (focused = true),
            onFocusout: (event: FocusEvent) => {
              const root = event.currentTarget as HTMLElement;
              if (!root.contains(event.relatedTarget as Node | null)) focused = false;
            },
          })}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [carouselStyles.viewport, focusRingStyles.visible, carouselSizeStyles.gap(gap)],
                ...carouselPart('viewport'),
              },
              propsViewport,
              {
                ref: _toRef(viewport),
                // 能聚焦：键盘用户按方向键横向滚动（停下时吸附到整张）
                tabindex: 0,
                'aria-live': playing() ? 'off' : 'polite',
                onScroll,
              },
            )}
          >
            {items.map((item, i) => (
              <div
                key={getKey ? getKey(item, i) : i}
                {...mergeAttrs<'div'>(
                  {
                    sx: [carouselStyles.slide, carouselSizeStyles.slide(slidesPerView, gap)],
                    ...carouselPart('slide'),
                  },
                  propsSlide,
                  {
                    role: 'group',
                    'aria-roledescription': 'slide',
                    'aria-label': lang.slideCounter(i + 1, total),
                  },
                )}
              >
                {children(item, i)}
              </div>
            ))}
          </div>
          {arrows && pages > 1 && [arrow(-1), arrow(1)]}
          {showControls && (
            <div
              {...mergeAttrs<'div'>(
                { sx: carouselStyles.controls, ...carouselPart('controls') },
                propsControls,
              )}
            >
              {interval() > 0 && (
                <IconButton
                  {...mergePartProps<IconButtonProps>(
                    {
                      icon: paused ? Play : Pause,
                      'aria-label': paused ? lang.carouselPlay : lang.carouselPause,
                      size: 'sm',
                      variant: 'ghost',
                      tone: 'neutral',
                      radius: 'full',
                    },
                    propsPause,
                    { onClick: () => (paused = !paused) },
                  )}
                />
              )}
              {dots &&
                pages > 1 &&
                Array.from({ length: pages }, (_, i) => (
                  <ButtonBase
                    key={i}
                    {...mergePartProps<ButtonBaseProps>(
                      {
                        sx: [carouselStyles.dot, i === index && carouselStyles.dotActive],
                        'aria-label': lang.slideCounter(i + 1, total),
                      },
                      propsDot,
                      { 'aria-current': i === index ? 'true' : undefined, onClick: () => go(i) },
                    )}
                  />
                ))}
            </div>
          )}
        </section>
      );
    };
  },
);
