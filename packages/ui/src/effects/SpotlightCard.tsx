/**
 * 聚光卡片（div）：指针在上面移动时，一团柔和的光跟着指针，靠近边框的地方把边框也点亮；离开后淡出。
 * 包住任意内容（常见是 Card），一组卡片并排时光会在它们之间“传递”。纯 CSS + 弹簧，不依赖 WebGL。
 *
 *   <SpotlightCard>
 *     <Card>…</Card>
 *   </SpotlightCard>
 *
 * - 颜色默认取品牌色，size 是光斑的半径；border 关掉时只照亮表面；
 * - 位置与淡入淡出用主题的时长（useSpring），减少动态效果时直接到位；
 * - 纯装饰：光层对读屏隐藏、不接收指针，叠在内容上方但很淡，不影响文字的对比度。
 *
 * 部件：Root（div）、Spotlight（span，表面的光）、Border（span，边框的光）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { colors } from '../config/theme/tokens.stylex';
import { usePointer } from '../utils/motion/pointer';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到外层 div 上 */
export interface SpotlightCardProps extends PartProps<'div'> {
  /** 光的颜色（token 或 CSS 颜色），默认品牌色 */
  color?: string;
  /**
   * 光斑的半径（CSS 长度）
   * @default '20em'
   */
  size?: string;
  /**
   * 靠近边框时点亮边框
   * @default true
   */
  border?: boolean;
  /** 表面光层的部件属性 */
  propsSpotlight?: PartProps<'span', 'aria-hidden'>;
  /** 边框光层的部件属性 */
  propsBorder?: PartProps<'span', 'aria-hidden'>;
  /** 内容 */
  children?: VNodeChild;
}

/** SpotlightCard 的样式：root、layer、border */
export const spotlightCardStyles = stylex.create({
  root: { position: 'relative', display: 'block', borderRadius: '_lg' },
  layer: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
  // 只留边框那一圈：内容盒与整个盒子的遮罩相减
  border: {
    padding: '_borderWidths.md',
    maskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
    maskClip: 'content-box, border-box',
    maskComposite: 'exclude',
  },
});

// 光的位置每帧变化，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** SpotlightCard 的样式：light（光斑的位置（百分比）、大小、颜色、强度） */
export const spotlightCardDynamicStyles = stylex.create({
  light: (x: number, y: number, size: string, color: string, strength: number) => ({
    opacity: strength,
    backgroundImage: `radial-gradient(${size} circle at ${x}% ${y}%, ${color}, transparent 70%)`,
  }),
});

/** 聚光卡片：光斑跟随指针，靠近边框时点亮边框 */
export const SpotlightCard = _component(
  ({
    color = colors.accent,
    size = '20em',
    border = true,
    propsSpotlight,
    propsBorder,
    children,
    ...rest
  }: SpotlightCardProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    // 阻尼后的指针位置（-1 到 1，向上为正）；离开时光停在原处淡出
    const pointer = usePointer(() => root, { duration: 'sm' });

    return () => {
      const soft = `color-mix(in oklab, ${color} 16%, transparent)`;
      const strong = `color-mix(in oklab, ${color} 85%, transparent)`;
      const x = (pointer.x + 1) * 50;
      const y = (1 - pointer.y) * 50;
      return (
        <div {...mergeAttrs<'div'>({ sx: spotlightCardStyles.root }, rest, { ref: _toRef(root) })}>
          {children}
          <span
            {...mergeAttrs<'span'>(
              {
                sx: [
                  spotlightCardStyles.layer,
                  spotlightCardDynamicStyles.light(x, y, size, soft, pointer.strength),
                ],
              },
              propsSpotlight,
              { 'aria-hidden': true },
            )}
          />
          {border && (
            <span
              {...mergeAttrs<'span'>(
                {
                  sx: [
                    spotlightCardStyles.layer,
                    spotlightCardStyles.border,
                    spotlightCardDynamicStyles.light(
                      x,
                      y,
                      `calc(${size} * 0.6)`,
                      strong,
                      pointer.strength,
                    ),
                  ],
                },
                propsBorder,
                { 'aria-hidden': true },
              )}
            />
          )}
        </div>
      );
    };
  },
);
