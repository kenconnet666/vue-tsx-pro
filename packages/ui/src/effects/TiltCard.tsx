/**
 * 倾斜卡片（div）：指针在上面移动时整块向指针方向倾斜，带一层跟随指针的高光；离开后弹回平放。
 * 包住任意内容（常见是 Card、图片），纯 CSS 变换 + 弹簧（useSpring），不依赖 WebGL。
 *
 *   <TiltCard>
 *     <Card>…</Card>
 *   </TiltCard>
 *
 * - maxTilt 是最大倾斜角度；scale 是悬停时的放大倍数；高光颜色取主题（品牌浅色混在浮起表面色里）；
 * - 时长与回弹取主题 tokens；系统要求减少动态效果时不倾斜、不放大，只保留高光；
 * - 纯装饰：不改变内容的语义与焦点顺序，高光层对读屏隐藏、不接收指针。
 *
 * 部件：Root（div，做变换的那一层）、Glare（span，高光）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { colors } from '../config/theme/tokens.stylex';
import { useReducedMotion } from '../utils/dom/media-query';
import { usePointer } from '../utils/motion/pointer';
import { mergeAttrs, type PartProps } from '../utils/props';
import { radiusStyles, type Radius } from '../utils/style/styles';

/** 未声明的属性落到外层 div 上 */
export interface TiltCardProps extends PartProps<'div'> {
  /**
   * 最大倾斜角度（度）
   * @default 10
   */
  maxTilt?: number;
  /**
   * 悬停时的放大倍数
   * @default 1.02
   */
  scale?: number;
  /**
   * 跟随指针的高光
   * @default true
   */
  glare?: boolean;
  /** 不倾斜（例如列表在拖动排序时） */
  disabled?: boolean;
  /**
   * 圆角：与里面的卡片一致，高光层跟着它裁切
   * @default 'lg'
   */
  radius?: Radius;
  /** 高光层的部件属性 */
  propsGlare?: PartProps<'span', 'aria-hidden'>;
  /** 内容 */
  children?: VNodeChild;
}

/** TiltCard 的样式：root、glare */
export const tiltCardStyles = stylex.create({
  root: {
    position: 'relative',
    display: 'block',
    transformStyle: 'preserve-3d',
    willChange: 'transform',
  },
  glare: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
    mixBlendMode: 'soft-light',
  },
});

// 变换与高光位置每帧变化，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** TiltCard 的样式：transform（倾斜与缩放）、glarePosition（高光的位置与强度） */
export const tiltCardDynamicStyles = stylex.create({
  transform: (rotateX: number, rotateY: number, scale: number) => ({
    transform: `perspective(60em) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
  }),
  glarePosition: (x: number, y: number, opacity: number) => ({
    opacity,
    backgroundImage: `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${colors.accentSoft} 40%, ${colors.surfaceRaised}), transparent 60%)`,
  }),
});

/** 倾斜卡片：指针方向倾斜、高光跟随，离开后弹回 */
export const TiltCard = _component(
  ({
    maxTilt = 10,
    scale = 1.02,
    glare = true,
    disabled = false,
    radius = 'lg',
    propsGlare,
    children,
    ...rest
  }: TiltCardProps) => {
    const reducedMotion = useReducedMotion();
    let root = _state.raw<HTMLElement | null>(null);
    // 阻尼后的指针位置（-1 到 1，向上为正）；离开时位置不动、strength 淡出，卡片随之慢慢放平
    const pointer = usePointer(() => root, { bounce: 0.3, duration: 'lg' });

    return () => {
      const tilt = disabled || reducedMotion.value ? 0 : pointer.strength;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                tiltCardStyles.root,
                radiusStyles[radius],
                tiltCardDynamicStyles.transform(
                  pointer.y * maxTilt * tilt,
                  pointer.x * maxTilt * tilt,
                  1 + (scale - 1) * tilt,
                ),
              ],
            },
            rest,
            { ref: _toRef(root) },
          )}
          data-disabled={disabled || undefined}
        >
          {children}
          {glare && (
            <span
              {...mergeAttrs<'span'>(
                {
                  sx: [
                    tiltCardStyles.glare,
                    tiltCardDynamicStyles.glarePosition(
                      (pointer.x + 1) * 50,
                      (1 - pointer.y) * 50,
                      disabled ? 0 : pointer.strength,
                    ),
                  ],
                },
                propsGlare,
                { 'aria-hidden': true },
              )}
            />
          )}
        </div>
      );
    };
  },
);
