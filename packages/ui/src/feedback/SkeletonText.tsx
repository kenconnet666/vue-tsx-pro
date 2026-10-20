/**
 * 多行文字的骨架（div）：一段正文加载时的占位，几行 Skeleton，最后一行短一些（同 Ant Design 的 paragraph、
 * Chakra 的 SkeletonText）。行距与正文相近，换成内容时高度大致不变。
 *
 *   <SkeletonText />
 *   <SkeletonText lines={5} />
 *
 * 整块对读屏隐藏；在外层加 aria-busy。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Skeleton, type SkeletonProps } from './Skeleton';

/** 未声明的属性落到外层 div 上 */
export interface SkeletonTextProps extends PartProps<'div', 'aria-hidden'> {
  /**
   * 行数
   * @default 3
   */
  lines?: number;
  /** 每一行（Skeleton）的部件属性 */
  propsLine?: Partial<SkeletonProps>;
}

/** SkeletonText 的样式：root、last */
export const skeletonTextStyles = stylex.create({
  // 1em 高的行加 0.5em 间隔，接近正文 1.5 的行高
  root: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  last: { width: '60%' },
});

/** 多行文字的骨架：最后一行短一些 */
export const SkeletonText = _component(
  ({ lines = 3, propsLine, ...rest }: SkeletonTextProps) =>
    () => (
      <div {...mergeAttrs<'div'>({ sx: skeletonTextStyles.root }, rest, { 'aria-hidden': true })}>
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            {...mergePartProps<SkeletonProps>(
              {
                variant: 'text',
                sx: lines > 1 && index === lines - 1 && skeletonTextStyles.last,
              },
              propsLine,
            )}
          />
        ))}
      </div>
    ),
);
