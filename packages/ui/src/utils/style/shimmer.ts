/**
 * 骨架的扫光（同 Ant Design Skeleton 的 active、MUI Skeleton 的 wave）：一道光带从起始边扫到结束边，表示内容正在来。
 * 光带画在元素的 ::after 上，用 transform 平移（同 MUI）：合成器就能跑，不必每帧重绘元素；
 * 原来移动背景位置时，满屏骨架每帧都要重绘。元素因此 contain: paint。光带颜色见 shimmerVars.highlight。
 *
 *   sx: [shimmerStyles.wave, { backgroundColor: … }]
 *   sx: [shimmerStyles.wave, shimmerStyles.delay(`${index * SHIMMER_STAGGER}ms`)]   多行依次扫过，像一道波
 *   sx: loaded && shimmerStyles.reveal                                                 骨架换成内容时淡入
 *
 * 扫光只是装饰：减少动态效果时不扫（静止的占位已经说明在加载）；从右到左的语言里反向扫。
 */
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { shimmerVars } from './vars';

/** 多行骨架相邻两行的扫光间隔（毫秒）：一屏七八行时整道波约一秒扫完 */
export const SHIMMER_STAGGER = 120;

// 光带与元素一样宽：从元素外的起始侧（-100%）扫到结束侧（100%）；后 30% 的时间停在外面，两次之间有个间隔
const sweep = css.keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '70%': { transform: 'translateX(100%)' },
  '100%': { transform: 'translateX(100%)' },
});

const fadeIn = css.keyframes({ from: { opacity: 0 } });

/** 骨架扫光：wave、delay、reveal */
export const shimmerStyles = css.create({
  wave: {
    position: 'relative',
    // 用绘制包含裁掉移出去的光带（按圆角裁）：不用 overflow，行内的骨架仍按文字基线对齐
    // （overflow 不是 visible 时 inline-block 的基线落到底边，WebKit 里 clip 也是）
    contain: 'paint',
    // 从右到左的语言里整个元素镜像，光带就反向扫；骨架包着的内容本来就看不见，镜像没有影响
    transform: { default: null, ':dir(rtl)': 'scaleX(-1)' },
    '::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage: `linear-gradient(90deg, transparent 15%, ${shimmerVars.highlight} 50%, transparent 85%)`,
      transform: 'translateX(-100%)',
      animationName: { default: sweep, _reducedMotion: 'none' },
      // 循环的装饰动画不取 durations（那是一次性过渡的时长，减少动态效果时为 0）：
      // 2 秒一轮，其中 1.4 秒扫过、0.6 秒停顿，接近 Ant Design、MUI 的节奏，不催促也不显得卡住
      animationDuration: '2s',
      // 先慢后快再慢：光带像被推过去，而不是匀速平移
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite',
      // 延迟写在元素上（delay），这里继承
      animationDelay: 'inherit',
    },
  },
  // 每一轮都保持同样的间隔：几行骨架的光带始终一前一后
  delay: (delay: string) => ({ animationDelay: delay }),
  // 骨架换成内容（或内容换成骨架）时淡入，不硬切；减少动态效果时 durations 为 0
  reveal: {
    animationName: fadeIn,
    animationDuration: '_durations.lg',
    animationTimingFunction: '_easings.enter',
  },
});
