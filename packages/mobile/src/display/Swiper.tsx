/**
 * 轮播：一组横排的卡片（首页的广告图、商品的多张图），左右滑或自动切换，下面一排圆点指示当前是第几张。
 *
 *   <Swiper autoplay={3000} height="10em">
 *     <SwiperItem><Image src={banner1} width="100%" height="100%" fit="cover" /></SwiperItem>
 *     <SwiperItem>…</SwiperItem>
 *   </Swiper>
 *
 * 横滑才接管手势（竖滑照常滚动页面）；loop 时最后一张再往后回到第一张（倒着滑回去，不复制首尾）。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount, onMounted, shallowReactive, watch, type VNodeChild } from 'vue';
import { useHost } from '../utils/host';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';

/** 轮播提供给各项的 */
interface SwiperState {
  register(item: object): () => void;
}

const SwiperContext = createContext<SwiperState>('Swiper');

/** 未声明的属性落到根元素（div）上 */
export interface SwiperProps extends Omit<PartProps<'div'>, 'onChange'> {
  /** 当前是第几张（从 0 开始）；双向绑定写 `_value={x}` */
  _value?: number;
  /** 自动切换的间隔（ms）；0 不自动切换 */
  autoplay?: number;
  /**
   * 首尾相连：最后一张往后是第一张
   * @default true
   */
  loop?: boolean;
  /**
   * 显示指示的圆点
   * @default true
   */
  indicators?: boolean;
  /** 高度（CSS 长度）；不给时随内容 */
  height?: string;
  /** 换了一张 */
  onChange?: (index: number) => void;
  /** 各个 SwiperItem */
  children?: VNodeChild;
  /** 指示圆点那一排的部件属性 */
  propsIndicators?: PartProps<'div'>;
}

/** Swiper 的样式 */
export const swiperStyles = css.create({
  root: { position: 'relative', overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none' },
  track: {
    display: 'flex',
    height: '100%',
    transitionProperty: 'transform',
    transitionDuration: '_lg',
    transitionTimingFunction: '_standard',
  },
  dragging: { transitionDuration: '0s' },
  item: { flex: 'none', width: '100%', height: '100%' },
  indicators: {
    position: 'absolute',
    insetInline: 0,
    insetBlockEnd: '0.6em',
    display: 'flex',
    justifyContent: 'center',
    gap: '0.35em',
    pointerEvents: 'none',
  },
  dot: {
    width: '0.4em',
    height: '0.4em',
    borderRadius: '_full',
    // 圆点画在图片上：两套主题里都是白的
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    transitionProperty: 'width, background-color',
    transitionDuration: '_md',
  },
  active: { width: '1em', backgroundColor: '#fff' },
});

// 判定横竖的移动距离（px）；松手时滑过宽度的这个比例就换一张
const LOCK_DISTANCE = 6;
const SWITCH_RATIO = 0.2;

/** 轮播（div > 滑动层：各项 + 指示圆点） */
export const Swiper = _component(
  ({
    _value: value = _bindable(0),
    autoplay = 0,
    loop = true,
    indicators = true,
    height,
    onChange,
    children,
    propsIndicators,
    ...rest
  }: SwiperProps) => {
    const host = useHost();
    const items = shallowReactive<object[]>([]);
    SwiperContext.provide({
      register(item) {
        items.push(item);
        return () => items.splice(items.indexOf(item), 1);
      },
    });

    const go = (index: number) => {
      const count = items.length;
      if (!count) return;
      const next = loop ? (index + count) % count : Math.min(count - 1, Math.max(0, index));
      if (next === value) return;
      value = next;
      onChange?.(next);
    };

    // 自动切换：拖动时停下，松手后重新计时
    let timer: ReturnType<typeof setInterval> | undefined;
    const startAutoplay = () => {
      clearInterval(timer);
      if (autoplay > 0) timer = setInterval(() => go(value + 1), autoplay);
    };
    onMounted(() => {
      startAutoplay();
      void measure();
    });
    watch(() => autoplay, startAutoplay);
    onBeforeUnmount(() => clearInterval(timer));

    // 拖动：挂上时量一次宽度，每次按下时再量（转屏、布局变了）
    let root: unknown = null;
    let width = 0;
    const measure = async () => {
      width = (await host.measure(root))?.width ?? width;
    };
    let drag = _state<number | null>(null);
    let horizontal = _state(false);
    let start = { x: 0, y: 0 };
    let direction: 'h' | 'v' | null = null;
    const onTouchstart = (event: TouchEvent) => {
      const touch = event.touches[0]!;
      start = { x: touch.clientX, y: touch.clientY };
      direction = null;
      clearInterval(timer);
      void measure();
    };
    const onTouchmove = (event: TouchEvent) => {
      const touch = event.touches[0]!;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!direction) {
        if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;
        direction = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        horizontal = direction === 'h';
      }
      if (direction === 'h') drag = dx;
    };
    const onTouchend = () => {
      const dx = drag ?? 0;
      drag = null;
      horizontal = false;
      if (width && Math.abs(dx) > width * SWITCH_RATIO) go(value + (dx < 0 ? 1 : -1));
      startAutoplay();
    };

    return () => {
      const offset = drag === null ? '' : ` + ${drag}px`;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: swiperStyles.root, style: height ? { height } : undefined },
            rest,
            {
              onTouchstart,
              onTouchmove,
              onTouchend,
              onTouchcancel: onTouchend,
              ...dataAttrs({ 'data-touch-move': horizontal ? 'catch' : true }),
            },
          )}
          ref={(node: unknown) => (root = node)}
        >
          <div
            {...mergeAttrs<'div'>({
              sx: [swiperStyles.track, drag !== null && swiperStyles.dragging],
              style: { transform: `translateX(calc(${-value * 100}%${offset}))` },
            })}
          >
            {children}
          </div>
          {indicators && items.length > 1 && (
            <div
              {...mergeAttrs<'div'>({ sx: swiperStyles.indicators }, propsIndicators)}
              aria-hidden="true"
            >
              {items.map((_, index) => (
                <span
                  {...mergeAttrs<'span'>({
                    sx: [swiperStyles.dot, index === value && swiperStyles.active],
                  })}
                />
              ))}
            </div>
          )}
        </div>
      );
    };
  },
);

/** 未声明的属性落到这一项（div）上 */
export interface SwiperItemProps extends PartProps<'div'> {
  /** 内容 */
  children?: VNodeChild;
}

/** 轮播的一项（div） */
export const SwiperItem = _component(({ children, ...rest }: SwiperItemProps) => {
  const swiper = SwiperContext.inject();
  onBeforeUnmount(swiper.register({}));
  return () => <div {...mergeAttrs<'div'>({ sx: swiperStyles.item }, rest)}>{children}</div>;
});
