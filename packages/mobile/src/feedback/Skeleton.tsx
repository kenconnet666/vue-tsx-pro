/**
 * 骨架屏：内容加载出来之前，用灰色的块占住标题、头像、几行文字的位置，加载完换成真实内容。
 * 只用于整块内容（卡片、列表项、详情页）的占位；按钮、开关这类小组件的加载用 Loading。
 *
 *   <Skeleton loading={pending} avatar title rows={3}>
 *     <ArticleCard … />
 *   </Skeleton>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css, type SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到占位的根元素（div）上 */
export interface SkeletonProps extends PartProps<'div', 'role' | 'aria-busy' | 'title'> {
  /**
   * 是否显示占位；false 时显示 children
   * @default true
   */
  loading?: boolean;
  /**
   * 文字的行数
   * @default 3
   */
  rows?: number;
  /**
   * 每行的宽度；给数组时按行取，最后一行默认 60%
   * @default '100%'
   */
  rowWidth?: string | string[];
  /** 显示标题的块 */
  title?: boolean;
  /** 显示头像的块 */
  avatar?: boolean;
  /**
   * 头像的形状
   * @default 'round'
   */
  avatarShape?: 'round' | 'square';
  /**
   * 呼吸动画
   * @default true
   */
  animate?: boolean;
  /** 加载完显示的内容 */
  children?: VNodeChild;
  /** 头像块的部件属性 */
  propsAvatar?: PartProps<'div'>;
  /** 标题块的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 每行文字块的部件属性 */
  propsRow?: PartProps<'div'>;
}

const pulse = css.keyframes({ '50%': { opacity: 0.5 } });

/** Skeleton 的样式：root、animate、avatar、square、body、block、title、row */
export const skeletonStyles = css.create({
  root: { display: 'flex', gap: '_lg', paddingBlock: '_sm', paddingInline: '_lg' },
  animate: {
    animationName: pulse,
    animationDuration: '1.4s',
    animationTimingFunction: '_standard',
    // 减少动态效果时不闪
    animationIterationCount: { default: 'infinite', _reducedMotion: 0 },
  },
  avatar: { flex: 'none', width: '2.5em', height: '2.5em', borderRadius: '_full' },
  square: { borderRadius: '_md' },
  body: { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.85em' },
  block: { backgroundColor: '_fill', borderRadius: '_sm' },
  title: { width: '40%', height: '1.15em' },
  row: { height: '1em' },
});

/** 某一行的宽度：数组按行取；没给时最后一行（不止一行时）短一些，看起来像一段文字的结尾 */
function widthOf(rowWidth: string | string[] | undefined, index: number, rows: number) {
  if (Array.isArray(rowWidth)) return rowWidth[index] ?? '100%';
  if (rowWidth) return rowWidth;
  return rows > 1 && index === rows - 1 ? '60%' : '100%';
}

/** 骨架屏（div[aria-busy] > 头像 + 标题 + 文字行）；loading 为 false 时只渲染 children */
export const Skeleton = _component(
  ({
    loading = true,
    rows = 3,
    rowWidth,
    title = false,
    avatar = false,
    avatarShape = 'round',
    animate = true,
    children,
    propsAvatar,
    propsTitle,
    propsRow,
    ...rest
  }: SkeletonProps) =>
    () => {
      if (!loading) return children;
      const block = (sx: SxStyles): SxStyles => [
        skeletonStyles.block,
        sx,
        animate && skeletonStyles.animate,
      ];
      return (
        <div {...mergeAttrs<'div'>({ sx: skeletonStyles.root }, rest, { 'aria-busy': 'true' })}>
          {avatar && (
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: block([
                    skeletonStyles.avatar,
                    avatarShape === 'square' && skeletonStyles.square,
                  ]),
                },
                propsAvatar,
              )}
            />
          )}
          <div {...mergeAttrs<'div'>({ sx: skeletonStyles.body })}>
            {title && (
              <div {...mergeAttrs<'div'>({ sx: block(skeletonStyles.title) }, propsTitle)} />
            )}
            {Array.from({ length: rows }, (_, index) => (
              <div
                {...mergeAttrs<'div'>(
                  {
                    sx: block(skeletonStyles.row),
                    style: { width: widthOf(rowWidth, index, rows) },
                  },
                  propsRow,
                )}
              />
            ))}
          </div>
        </div>
      );
    },
);
