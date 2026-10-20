/**
 * 骨架屏（span）：内容加载时的占位，一道光带从起始边扫过（shimmer.ts）。包着真实内容时，内容照常排版但不可见、
 * 不可交互，占位正好是内容的大小，加载完换成内容时布局不跳（同 Radix Themes 的 Skeleton）；
 * 不包内容时用 variant 选常用形状，或者由 sx 给大小。多行文字用 SkeletonText。
 *
 *   <Skeleton loading={loading}><Text>{user.name}</Text></Skeleton>
 *   <Skeleton variant="circle" />
 *   <Skeleton variant="heading" delay={SHIMMER_STAGGER} />      几块骨架依次扫过
 *   <Skeleton sx={styles.cover} />
 *
 * 占位对读屏隐藏；整块区域在加载时在外层加 aria-busy。减少动态效果时不扫光。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import { shimmerStyles } from '../utils/style/shimmer';
import { shimmerVars } from '../utils/style/vars.stylex';

/** 骨架的常用形状 */
export interface SkeletonVariants {
  /** 一行文字：高 1em，占满宽度 */
  text: unknown;
  /** 标题：高 1.5em，四成宽度 */
  heading: unknown;
  /** 圆：头像，边长 2.5em（与同字号的 Avatar 一样大） */
  circle: unknown;
  /** 按钮：控件高度，宽 6em */
  button: unknown;
  /** 图片：占满宽度，16:9 */
  image: unknown;
}

/** 未声明的属性落到占位的 span 上（加载完成后不渲染它，只渲染内容） */
export interface SkeletonProps extends PartProps<'span', 'aria-hidden' | 'inert'> {
  /**
   * 是否在加载；false 时直接渲染内容
   * @default true
   */
  loading?: boolean;
  /** 形状；不写时大小由包着的内容或 sx 决定 */
  variant?: keyof SkeletonVariants;
  /** 扫光的延迟（毫秒）：几块骨架依次扫过、连成一道波时用（SkeletonText 的各行就是这样错开的） */
  delay?: number;
  /** 包着内容的那一层（不可见、只用来撑出大小）的部件属性 */
  propsContent?: PartProps<'span'>;
  children?: VNodeChild;
}

/** 不包内容的骨架（SkeletonText 的各行、列表与表格的骨架行）的部件属性：加载与内容由组件管 */
export type SkeletonShapeProps = Omit<
  Partial<SkeletonProps>,
  'loading' | 'children' | 'propsContent'
>;

/** Skeleton 的样式：root、wrapping、hidden */
export const skeletonStyles = stylex.create({
  root: {
    display: 'inline-block',
    borderRadius: '_sm',
    // 底色与光带都是半透明的正文色：叠在任何表面（页面、卡片、浮层）上都比表面深一档（暗色主题里浅一档），
    // 十二套主题不必各调一遍；光带叠在底色上，再深一档
    backgroundColor: 'color-mix(in oklab, _colors.text 9%, transparent)',
    [shimmerVars.highlight]: 'color-mix(in oklab, _colors.text 9%, transparent)',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  // 包着内容时：内容决定大小但看不见
  wrapping: { color: 'transparent' },
  hidden: { visibility: 'hidden' },
});

/** Skeleton 的样式：text、heading、circle、button、image */
export const skeletonVariantStyles = stylex.create({
  text: { display: 'block', width: '_full', height: '1em' },
  heading: { display: 'block', width: '40%', height: '1.5em' },
  circle: { width: '2.5em', height: '2.5em', flexShrink: 0, borderRadius: '_full' },
  button: {
    width: '6em',
    height: 'max(_sizes.control, _sizes.minTarget)',
    flexShrink: 0,
    borderRadius: '_md',
  },
  image: { display: 'block', width: '_full', aspectRatio: '16 / 9', borderRadius: '_md' },
});

/** 骨架屏：加载时占位并扫光，包着内容时与内容一样大 */
export const Skeleton = _component(
  ({ loading = true, variant, delay, propsContent, children, ...rest }: SkeletonProps) =>
    () => {
      if (!loading) return children;
      const wrapping = children != null;
      return (
        <span
          {...mergeAttrs<'span'>(
            {
              sx: [
                skeletonStyles.root,
                shimmerStyles.wave,
                variant && skeletonVariantStyles[variant],
                !!delay && shimmerStyles.delay(`${delay}ms`),
                wrapping && skeletonStyles.wrapping,
              ],
            },
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
