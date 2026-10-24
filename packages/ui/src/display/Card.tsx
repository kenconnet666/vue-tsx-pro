/**
 * 卡片（div）：把一组相关内容放在一块表面上。可选的页头、页脚与正文之间有分隔线。
 *
 *   <Card header={<H3 size="md">订单 #1024</H3>} footer={<Button>查看</Button>}>…</Card>
 *   <Card header="超时最久的项目" extra={<Link href="/overdue">全部</Link>}>…</Card>   页头右边的操作
 *   <Card loading={loading} header={…}>…</Card>      正文加载中：换成几行扫光的骨架，卡片带 aria-busy
 *   <Card effect="spotlight">…</Card>                  装饰效果：tilt 倾斜、spotlight 聚光、beam 流光边框
 *
 * 需要语义容器（article、section）时在外面包，或把语义标签放进 header 里的标题。
 * effect 是纯 CSS 的装饰（官网、活动页的卡片）：光层对读屏隐藏、不接收指针；减少动态效果时不倾斜、流光不动。
 * 光要画在卡片的边框上，而卡片裁掉了边框以内之外的内容，所以有 effect 时外面多一层定位用的 div，
 * 未声明的属性落在这一层上。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useDefaults } from '../config/defaults';
import { borderWidths, colors, radii } from '../config/theme/tokens.stylex';
import { SkeletonText, type SkeletonTextProps } from '../feedback/SkeletonText';
import { useReducedMotion } from '../utils/dom/media-query';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { usePointer } from '../utils/motion/pointer';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { shimmerStyles } from '../utils/style/shimmer';
import { radiusStyles, type Radius, type Space } from '../utils/style/styles';

/** 卡片样式 */
export interface CardVariants {
  /** 表面色加细边框（默认） */
  surface: unknown;
  /** 只有边框，底色透明 */
  outline: unknown;
  /** 表面色加阴影，浮在页面上 */
  elevated: unknown;
  /** 没有底色与边框，只保留内边距与分区 */
  ghost: unknown;
}

/** 卡片的装饰效果 */
export interface CardEffects {
  /** 指针在上面移动时整块向指针方向倾斜，带一层跟随指针的高光；离开后弹回平放 */
  tilt: unknown;
  /** 一团柔和的光跟着指针，靠近边框的地方把边框也点亮；并排的几张卡片光会在它们之间传递 */
  spotlight: unknown;
  /** 一段渐变的光（品牌色到紫色）沿着边框循环流动 */
  beam: unknown;
}

/** 卡片的外观选项；可以用 createUi / Provider 的 defaults.Card 统一改默认值 */
export interface CardOptions {
  /** 样式，默认 surface */
  variant?: keyof CardVariants;
  /** 内边距档位，对应主题的 space，默认 lg */
  padding?: Space;
  /** 圆角，默认 lg */
  radius?: Radius;
}

/** 忙碌由组件按 loading 管理 */
export type CardManaged = 'aria-busy';

/** 未声明的属性落到外层 div 上 */
export interface CardProps extends PartProps<'div', CardManaged>, CardOptions {
  /** 页头：标题、操作；与正文之间有分隔线 */
  header?: VNodeChild;
  /** 页头结束边的内容（“全部 ↗”、按钮、筛选）：和 header 排在一行，放不下时换行 */
  extra?: VNodeChild;
  /** 页脚：按钮等操作；与正文之间有分隔线 */
  footer?: VNodeChild;
  /**
   * 正文加载中：正文换成几行扫光的骨架（页头、页脚照常显示），卡片带 aria-busy；很快完成时不闪
   * @default false
   */
  loading?: boolean;
  /** 装饰效果（见 CardEffects）；有效果时外面多一层定位用的 div，未声明的属性落在它上面 */
  effect?: keyof CardEffects;
  /** 效果的光层（倾斜的高光、聚光的表面光、流光）的部件属性 */
  propsEffect?: PartProps<'span', 'aria-hidden'>;
  /** 页头的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 正文的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 页脚的部件属性 */
  propsFooter?: PartProps<'div'>;
  /** 加载中的骨架（SkeletonText）的部件属性，如行数 `{ lines: 5 }` */
  propsSkeleton?: Partial<SkeletonTextProps>;
  children?: VNodeChild;
}

/** Card 的样式：root、header、footer */
export const cardStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: 'transparent',
    color: '_text',
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_borderMuted',
  },
  // 有 extra 时：标题在起始边、extra 在结束边
  headerWithExtra: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_sm',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '_sm',
    borderTopWidth: '_xs',
    borderTopStyle: 'solid',
    borderTopColor: '_borderMuted',
  },
});

const travel = stylex.keyframes({
  from: { offsetDistance: '0%' },
  to: { offsetDistance: '100%' },
});

/** Card 效果的样式：frame（外层）、surface（卡片撑满外层）、layer、glare、ring、beamRing、beam */
export const cardEffectStyles = stylex.create({
  frame: { position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 },
  tilt: { transformStyle: 'preserve-3d', willChange: 'transform' },
  surface: { flexGrow: 1 },
  layer: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
  glare: { mixBlendMode: 'soft-light' },
  // 只留边框那一圈：内容盒与整个盒子的遮罩相减
  ring: {
    padding: '_borderWidths.md',
    maskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
    maskClip: 'content-box, border-box',
    maskComposite: 'exclude',
  },
  // 流光：光带沿外层的圆角矩形走（offset-path），只在边框那一圈露出来
  beamRing: {
    borderWidth: borderWidths.md,
    borderStyle: 'solid',
    borderColor: 'transparent',
    maskImage: 'linear-gradient(transparent, transparent), linear-gradient(#000, #000)',
    maskClip: 'padding-box, border-box',
    maskComposite: 'intersect',
  },
  beam: {
    position: 'absolute',
    width: '80px',
    aspectRatio: '1',
    offsetAnchor: '90% 50%',
    backgroundImage: `linear-gradient(to left, ${colors.chart5}, ${colors.accent}, transparent)`,
    animationName: { default: travel, '@media (prefers-reduced-motion: reduce)': 'none' },
    animationDuration: '6s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
});

// 倾斜角度、光的位置每帧变化，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Card 效果的样式：tiltTransform、glare（高光的位置与强度）、light（光斑）、beamPath（流光的路径） */
export const cardEffectDynamicStyles = stylex.create({
  tiltTransform: (rotateX: number, rotateY: number, scale: number) => ({
    transform: `perspective(60em) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
  }),
  glare: (x: number, y: number, opacity: number) => ({
    opacity,
    backgroundImage: `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${colors.accentSoft} 40%, ${colors.surfaceRaised}), transparent 60%)`,
  }),
  light: (x: number, y: number, size: string, color: string, strength: number) => ({
    opacity: strength,
    backgroundImage: `radial-gradient(${size} circle at ${x}% ${y}%, ${color}, transparent 70%)`,
  }),
  beamPath: (radius: string) => ({ offsetPath: `rect(0 auto auto 0 round ${radius})` }),
});

/** 倾斜的最大角度（度）与悬停时的放大倍数 */
const TILT = 10;
const TILT_SCALE = 1.02;

/** Card 的样式：surface、outline、elevated、ghost */
export const cardVariantStyles = stylex.create({
  surface: { backgroundColor: '_surface', borderColor: '_border' },
  outline: { borderColor: '_border' },
  elevated: { backgroundColor: '_surfaceRaised', boxShadow: '_md' },
  ghost: {},
});

/** Card 的样式：none、xs、sm、md、lg、xl */
export const cardPaddingStyles = stylex.create({
  none: { padding: '_none' },
  xs: { padding: '_xs' },
  sm: { padding: '_sm' },
  md: { padding: '_md' },
  lg: { padding: '_lg' },
  xl: { padding: '_xl' },
});

/** 卡片：表面 + 可选的页头与页脚，正文可以显示加载骨架 */
export const Card = _component(
  ({
    variant,
    padding,
    radius,
    header,
    extra,
    footer,
    loading = false,
    effect,
    propsEffect,
    propsHeader,
    propsBody,
    propsFooter,
    propsSkeleton,
    children,
    ...rest
  }: CardProps) => {
    const appearance = useDefaults('Card', () => ({ variant, padding, radius }), {
      variant: 'surface',
      padding: 'lg',
      radius: 'lg',
    });
    // 骨架防闪烁；aria-busy 按真实的 loading
    const skeleton = useDelayedLoading(() => loading);
    // 出现过骨架之后，骨架与正文互换时都淡入（样式在切换的那一刻加上，动画才会播）；一开始就有内容的卡片不播
    let revealing = false;
    const reducedMotion = useReducedMotion();
    let frame = _state.raw<HTMLElement | null>(null);
    // 阻尼后的指针位置（-1 到 1，向上为正）；离开时位置不动、strength 淡出。倾斜要慢一点、带回弹；
    // 阻尼参数按挂上时的效果定（效果一般不中途切换），跟踪的目标随 effect 变
    const pointer = usePointer(
      () => (effect === 'tilt' || effect === 'spotlight' ? frame : null),
      _untrack(effect) === 'tilt' ? { bounce: 0.3, duration: 'lg' } : { duration: 'sm' },
    );

    /** 效果的光层：倾斜是一层高光，聚光是表面与边框两层，流光是边框一圈里走的光带 */
    function effectLayers() {
      const x = (pointer.x + 1) * 50;
      const y = (1 - pointer.y) * 50;
      const layer = (sx: stylex.StyleXStyles[], child?: VNodeChild) => (
        <span
          {...mergeAttrs<'span'>({ sx: [cardEffectStyles.layer, ...sx] }, propsEffect, {
            'aria-hidden': true,
          })}
        >
          {child}
        </span>
      );
      if (effect === 'tilt')
        return layer([
          cardEffectStyles.glare,
          cardEffectDynamicStyles.glare(x, y, pointer.strength),
        ]);
      if (effect === 'spotlight')
        return [
          layer([
            cardEffectDynamicStyles.light(
              x,
              y,
              '20em',
              `color-mix(in oklab, ${colors.accent} 16%, transparent)`,
              pointer.strength,
            ),
          ]),
          layer([
            cardEffectStyles.ring,
            cardEffectDynamicStyles.light(
              x,
              y,
              '12em',
              `color-mix(in oklab, ${colors.accent} 85%, transparent)`,
              pointer.strength,
            ),
          ]),
        ];
      return layer(
        [cardEffectStyles.beamRing],
        <span
          {...stylex.attrs(
            cardEffectStyles.beam,
            cardEffectDynamicStyles.beamPath(radii[appearance().radius]),
          )}
        />,
      );
    }

    return () => {
      const space = cardPaddingStyles[appearance().padding];
      if (skeleton.value) revealing = true;
      const surfaceStyles = [
        cardStyles.root,
        cardVariantStyles[appearance().variant],
        radiusStyles[appearance().radius],
      ];
      const content = renderContent(space);
      if (!effect)
        return (
          <div
            {...mergeAttrs<'div'>({ sx: surfaceStyles }, rest, {
              'aria-busy': loading || undefined,
            })}
          >
            {content}
          </div>
        );
      const tilt = effect === 'tilt' && !reducedMotion.value ? pointer.strength : 0;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                cardEffectStyles.frame,
                radiusStyles[appearance().radius],
                effect === 'tilt' && [
                  cardEffectStyles.tilt,
                  cardEffectDynamicStyles.tiltTransform(
                    pointer.y * TILT * tilt,
                    pointer.x * TILT * tilt,
                    1 + (TILT_SCALE - 1) * tilt,
                  ),
                ],
              ],
            },
            rest,
            { 'aria-busy': loading || undefined, ref: _toRef(frame) },
          )}
        >
          <div {...stylex.attrs(surfaceStyles, cardEffectStyles.surface)}>{content}</div>
          {effectLayers()}
        </div>
      );
    };

    /** 页头、正文（或骨架）、页脚 */
    function renderContent(space: (typeof cardPaddingStyles)[keyof typeof cardPaddingStyles]) {
      return [
        (header != null || extra != null) && (
          <div
            {...mergeAttrs<'div'>(
              { sx: [cardStyles.header, space, extra != null && cardStyles.headerWithExtra] },
              propsHeader,
            )}
          >
            {header}
            {extra}
          </div>
        ),
        <div
          {...mergeAttrs<'div'>(
            { sx: [space, revealing && !skeleton.value && shimmerStyles.reveal] },
            propsBody,
          )}
        >
          {skeleton.value ? (
            <SkeletonText
              {...mergePartProps<SkeletonTextProps>({ sx: shimmerStyles.reveal }, propsSkeleton)}
            />
          ) : (
            children
          )}
        </div>,
        hasContent(footer) && (
          <div {...mergeAttrs<'div'>({ sx: [cardStyles.footer, space] }, propsFooter)}>
            {footer}
          </div>
        ),
      ];
    }
  },
);
