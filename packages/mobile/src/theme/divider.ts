/**
 * 列表项之间的内缩细线（Cell、Collapse、FormItem）：背景画在底边，从左内边距处画到右边（小程序把样式展开成行内样式，
 * 不能用伪元素）。背景块 1px 高、只涂下半截：直接给 0.5px 高的背景块时，元素高度带小数的那几行在高分屏上整条被吞掉。
 *
 *   item: { backgroundImage: { default: dividerImage, ':last-child': 'none' }, ...dividerLayout }
 */
import { t } from './tokens';

export const dividerImage = `linear-gradient(to top, ${t.colors.border} 50%, transparent 50%)`;

export const dividerLayout = {
  backgroundRepeat: 'no-repeat',
  backgroundSize: `calc(100% - ${t.space.lg}) 1px`,
  backgroundPosition: 'right bottom',
} as const;
