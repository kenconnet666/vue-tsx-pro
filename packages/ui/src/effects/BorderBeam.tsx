/**
 * 流光边框（div）：一段渐变的光沿着容器的边框循环流动。放进任何定位的容器里（Card、按钮组、输入框外层），
 * 铺满它、只在边框那一圈可见，不占布局、不接收指针。纯 CSS 动画（offset-path），不依赖 WebGL。
 *
 *   <Card sx={styles.relative}>
 *     …
 *     <BorderBeam />
 *   </Card>
 *
 * - 光从 colorFrom 渐变到 colorTo，默认品牌色到紫色（图表色板），跟随主题；
 * - radius 要与容器的圆角一致（默认主题的 lg，与 Card 相同）；多条光带用 delay 错开；
 * - 系统要求减少动态效果时停在起点不动。
 *
 * 部件：Root（div，边框那一圈）、Beam（span，流动的光）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { borderWidths, colors, radii } from '../config/theme/tokens.stylex';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到外层 div 上 */
export interface BorderBeamProps extends PartProps<'div', 'aria-hidden'> {
  /**
   * 转一圈的时长（秒）
   * @default 6
   */
  duration?: number;
  /**
   * 延迟（秒）：几条光带错开时用
   * @default 0
   */
  delay?: number;
  /**
   * 光带的长度（CSS 像素）
   * @default 80
   */
  size?: number;
  /** 光带尾部的颜色（token 或 CSS 颜色），默认品牌色 */
  colorFrom?: string;
  /** 光带头部的颜色，默认图表色板的紫色 */
  colorTo?: string;
  /** 边框宽度（CSS 长度），默认主题的 md 边框宽度 */
  borderWidth?: string;
  /** 容器的圆角（CSS 长度），默认主题的 lg 圆角 */
  radius?: string;
  /** 逆时针流动 */
  reverse?: boolean;
  /** 光带的部件属性 */
  propsBeam?: PartProps<'span'>;
}

const travel = stylex.keyframes({
  from: { offsetDistance: '0%' },
  to: { offsetDistance: '100%' },
});

/** BorderBeam 的样式：root、beam、reverse */
export const borderBeamStyles = stylex.create({
  root: {
    position: 'absolute',
    inset: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 'inherit',
    pointerEvents: 'none',
    // 只留边框那一圈：padding-box 与 border-box 的遮罩相减
    maskImage: 'linear-gradient(transparent, transparent), linear-gradient(#000, #000)',
    maskClip: 'padding-box, border-box',
    maskComposite: 'intersect',
  },
  beam: {
    position: 'absolute',
    aspectRatio: '1',
    offsetAnchor: '90% 50%',
    animationName: { default: travel, '@media (prefers-reduced-motion: reduce)': 'none' },
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  reverse: { animationDirection: 'reverse' },
});

// 尺寸、颜色、时长是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** BorderBeam 的样式：frame（边框宽度）、beam（光带的路径、长度、颜色与时长） */
export const borderBeamDynamicStyles = stylex.create({
  frame: (width: string) => ({ borderWidth: width }),
  beam: (
    size: number,
    radius: string,
    from: string,
    to: string,
    duration: number,
    delay: number,
  ) => ({
    width: `${size}px`,
    offsetPath: `rect(0 auto auto 0 round ${radius})`,
    backgroundImage: `linear-gradient(to left, ${to}, ${from}, transparent)`,
    animationDuration: `${duration}s`,
    animationDelay: `${-delay}s`,
  }),
});

/** 流光边框：一段光沿容器的边框循环流动 */
export const BorderBeam = _component(
  ({
    duration = 6,
    delay = 0,
    size = 80,
    colorFrom = colors.accent,
    colorTo = colors.chart5,
    borderWidth = borderWidths.md,
    radius = radii.lg,
    reverse = false,
    propsBeam,
    ...rest
  }: BorderBeamProps) => {
    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [borderBeamStyles.root, borderBeamDynamicStyles.frame(borderWidth)] },
          rest,
          { 'aria-hidden': true },
        )}
      >
        <span
          {...mergeAttrs<'span'>(
            {
              sx: [
                borderBeamStyles.beam,
                reverse && borderBeamStyles.reverse,
                borderBeamDynamicStyles.beam(size, radius, colorFrom, colorTo, duration, delay),
              ],
            },
            propsBeam,
          )}
        />
      </div>
    );
  },
);
