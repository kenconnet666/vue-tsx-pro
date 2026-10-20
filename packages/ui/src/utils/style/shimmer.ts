/**
 * 骨架的扫光（同 Ant Design Skeleton 的 active、MUI Skeleton 的 wave）：一道光带从起始边扫到结束边，表示内容正在来。
 * 光带是背景渐变，叠在元素自己的底色上：不需要额外元素，也不受 overflow 影响。光带颜色见 shimmerVars.highlight。
 *
 *   sx: [shimmerStyles.wave, { backgroundColor: … }]
 *   sx: [shimmerStyles.wave, shimmerStyles.delay(`${index * SHIMMER_STAGGER}ms`)]   多行依次扫过，像一道波
 *   sx: loaded && shimmerStyles.reveal                                                 骨架换成内容时淡入
 *
 * 扫光只是装饰：减少动态效果时不扫（静止的占位已经说明在加载）；从右到左的语言里反向扫。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { shimmerVars } from './vars.stylex';

/** 多行骨架相邻两行的扫光间隔（毫秒）：一屏七八行时整道波约一秒扫完 */
export const SHIMMER_STAGGER = 120;

// 渐变是元素宽度的 3 倍，光带在中间：位置从 100% 到 0 时光带从元素外的起始侧扫到结束侧；后 30% 的时间停在外面，两次之间有个间隔
const sweep = stylex.keyframes({
  '0%': { backgroundPosition: '100% 0' },
  '70%': { backgroundPosition: '0 0' },
  '100%': { backgroundPosition: '0 0' },
});

const fadeIn = stylex.keyframes({ from: { opacity: 0 } });

/** 骨架扫光：wave、delay、reveal */
export const shimmerStyles = stylex.create({
  wave: {
    backgroundImage: `linear-gradient(90deg, transparent 35%, ${shimmerVars.highlight} 50%, transparent 65%)`,
    backgroundSize: '300% 100%',
    backgroundRepeat: 'no-repeat',
    animationName: { default: sweep, '@media (prefers-reduced-motion: reduce)': 'none' },
    // 循环的装饰动画不取 durations（那是一次性过渡的时长，减少动态效果时为 0）：
    // 2 秒一轮，其中 1.4 秒扫过、0.6 秒停顿，接近 Ant Design、MUI 的节奏，不催促也不显得卡住
    animationDuration: '2s',
    // 先慢后快再慢：光带像被推过去，而不是匀速平移
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: { default: null, ':dir(rtl)': 'reverse' },
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
