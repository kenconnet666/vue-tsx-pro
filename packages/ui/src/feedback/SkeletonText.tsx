/**
 * 多行文字的骨架（div）：一段正文加载时的占位，几行 Skeleton，最后一行短一些（同 Ant Design 的 paragraph、
 * Chakra 的 SkeletonText）。行距与正文相近，换成内容时高度大致不变。各行的扫光依次错开，像一道波从上往下扫过。
 *
 *   <SkeletonText />
 *   <SkeletonText lines={5} />
 *   <SkeletonText delay={240} />      接在前面的骨架（标题、头像）后面扫
 *
 * 整块对读屏隐藏；在外层加 aria-busy。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { SHIMMER_STAGGER } from '../utils/style/shimmer';
import { Skeleton, type SkeletonProps, type SkeletonShapeProps } from './Skeleton';

/** 未声明的属性落到外层 div 上 */
export interface SkeletonTextProps extends PartProps<'div', 'aria-hidden'> {
  /**
   * 行数
   * @default 3
   */
  lines?: number;
  /**
   * 第一行扫光的延迟（毫秒），之后每行再晚一点
   * @default 0
   */
  delay?: number;
  /** 每一行（Skeleton）的部件属性 */
  propsLine?: SkeletonShapeProps;
}

/** SkeletonText 的样式：root、last */
export const skeletonTextStyles = css.create({
  // 1em 高的行加 0.5em 间隔，接近正文 1.5 的行高
  root: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  last: { width: '60%' },
});

/** 多行文字的骨架：最后一行短一些 */
export const SkeletonText = _component(
  ({ lines = 3, delay = 0, propsLine, ...rest }: SkeletonTextProps) =>
    () => (
      <div {...mergeAttrs<'div'>({ sx: skeletonTextStyles.root }, rest, { 'aria-hidden': true })}>
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            {...mergePartProps<SkeletonProps>(
              {
                variant: 'text',
                delay: delay + index * SHIMMER_STAGGER,
                sx: lines > 1 && index === lines - 1 && skeletonTextStyles.last,
              },
              propsLine,
            )}
          />
        ))}
      </div>
    ),
);
