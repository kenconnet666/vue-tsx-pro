/**
 * 骨架的扫光（同 Ant Design Skeleton 的 active、MUI Skeleton 的 wave）：一道光带从起始边扫到结束边，表示内容正在来。
 * 光带是背景渐变，叠在元素自己的底色上：不需要额外元素，也不受 overflow 影响。光带颜色见 shimmerVars.highlight。
 *
 *   sx: [shimmerStyles.wave, { backgroundColor: … }]
 *
 * 扫光只是装饰：减少动态效果时不扫（静止的占位已经说明在加载）；从右到左的语言里反向扫。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { shimmerVars } from './vars.stylex';

// 渐变是元素宽度的 3 倍，光带在中间：位置从 100% 到 0 时光带从元素外的起始侧扫到结束侧；后 30% 的时间停在外面，两次之间有个间隔
const sweep = stylex.keyframes({
  '0%': { backgroundPosition: '100% 0' },
  '70%': { backgroundPosition: '0 0' },
  '100%': { backgroundPosition: '0 0' },
});

/** 骨架扫光：wave */
export const shimmerStyles = stylex.create({
  wave: {
    backgroundImage: `linear-gradient(90deg, transparent 35%, ${shimmerVars.highlight} 50%, transparent 65%)`,
    backgroundSize: '300% 100%',
    backgroundRepeat: 'no-repeat',
    animationName: { default: sweep, '@media (prefers-reduced-motion: reduce)': 'none' },
    animationDuration: '2s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: { default: null, ':dir(rtl)': 'reverse' },
  },
});
