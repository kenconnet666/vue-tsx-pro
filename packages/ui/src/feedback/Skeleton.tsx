/**
 * 骨架屏（span）：内容加载时的占位。包着真实内容时，内容照常排版但不可见、不可交互，占位正好是内容的大小，
 * 加载完换成内容时布局不跳（同 Radix Themes 的 Skeleton）；不包内容时大小由 sx 给。
 *
 *   <Skeleton loading={loading}><Text>{user.name}</Text></Skeleton>
 *   <Skeleton sx={styles.avatar} />
 *
 * 占位对读屏隐藏；整块区域在加载时可以在外层加 aria-busy。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到占位的 span 上（加载完成后不渲染它，只渲染内容） */
export interface SkeletonProps extends PartProps<'span', 'aria-hidden' | 'inert'> {
  /** 是否在加载，默认 true；false 时直接渲染内容 */
  loading?: boolean;
  /** 包着内容的那一层（不可见、只用来撑出大小）的部件属性 */
  propsContent?: PartProps<'span'>;
  children?: VNodeChild;
}

const pulse = stylex.keyframes({
  '0%': { opacity: 1 },
  '50%': { opacity: 0.5 },
  '100%': { opacity: 1 },
});

/** Skeleton 的样式：root、wrapping、hidden */
export const skeletonStyles = stylex.create({
  root: {
    display: 'inline-block',
    borderRadius: '_sm',
    backgroundColor: '_fillHover',
    // 闪烁只是装饰：减少动态效果时不闪
    animationName: { default: pulse, '@media (prefers-reduced-motion: reduce)': 'none' },
    animationDuration: '1.6s',
    animationTimingFunction: '_easings.standard',
    animationIterationCount: 'infinite',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  // 包着内容时：内容决定大小但看不见
  wrapping: { color: 'transparent' },
  hidden: { visibility: 'hidden' },
});

/** 骨架屏：加载时占位，包着内容时与内容一样大 */
export const Skeleton = _component(
  ({ loading = true, propsContent, children, ...rest }: SkeletonProps) =>
    () => {
      if (!loading) return children;
      const wrapping = children != null;
      return (
        <span
          {...mergeAttrs<'span'>(
            { sx: [skeletonStyles.root, wrapping && skeletonStyles.wrapping] },
            rest,
            {
              'aria-hidden': true,
              // 包着的内容（链接、按钮）不能被 Tab 聚焦
              inert: wrapping || undefined,
            },
          )}
        >
          {wrapping && (
            <span {...mergeAttrs<'span'>({ sx: skeletonStyles.hidden }, propsContent)}>
              {children}
            </span>
          )}
        </span>
      );
    },
);
