/**
 * 跑马灯（div）：内容循环滚动（合作伙伴 logo、公告、标签墙）。纯 CSS 动画：内容复制一份接在后面，
 * 平移到正好一份的长度时与开头重合，无缝循环。
 *
 *   <Marquee speed={40} pauseOnHover aria-label="合作伙伴">
 *     {partners.map((partner) => <img src={partner.logo} alt={partner.name} />)}
 *   </Marquee>
 *
 * - 方向 left / right / up / down；speed 是每秒多少 px（按一份内容的长度换算成动画时长，内容变化时重新量）；
 * - 指针悬停、焦点在里面时暂停（pauseOnHover）；paused 由外部控制（WCAG 2.2.2：给用户一个暂停按钮）；
 * - 减少动态效果时不滚动，内容可以手动滚动查看（容器可以聚焦，键盘也能滚）；
 * - role="marquee"（ARIA 的跑马灯角色，用 aria-label 命名）；复制的那份对读屏隐藏且不可聚焦（inert），读屏只念一遍。
 *
 * 部件：Root（div）、Track（div，做动画的那一层）、Group（div，一份内容）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useReducedMotion } from '../utils/dom/media-query';
import { useResizeObserver } from '../utils/dom/resize';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles, gapStyles, type Space, type StyleTable } from '../utils/style/styles';

/** 滚动方向 */
export interface MarqueeDirections {
  /** 向左（默认） */
  left: unknown;
  /** 向右 */
  right: unknown;
  /** 向上 */
  up: unknown;
  /** 向下 */
  down: unknown;
}

/** 未声明的属性落到外层 div 上 */
export interface MarqueeProps extends PartProps<'div'> {
  /** 滚动方向，默认 left */
  direction?: keyof MarqueeDirections;
  /** 速度：每秒多少 px，默认 40 */
  speed?: number;
  /** 指针悬停、焦点在里面时暂停，默认 true */
  pauseOnHover?: boolean;
  /** 暂停 */
  paused?: boolean;
  /** 两端渐隐 */
  fade?: boolean;
  /** 项之间（以及两份之间）的间距，默认 lg */
  gap?: Space;
  /** 动画层的部件属性 */
  propsTrack?: PartProps<'div'>;
  /** 每一份内容的部件属性 */
  propsGroup?: PartProps<'div'>;
  /** 内容 */
  children?: VNodeChild;
}

const scrollX = css.keyframes({
  from: { transform: 'none' },
  to: { transform: 'translateX(-50%)' },
});
const scrollY = css.keyframes({
  from: { transform: 'none' },
  to: { transform: 'translateY(-50%)' },
});

/** Marquee 的样式：root、vertical、fade、track、trackVertical、reverse、pausable、paused、group */
export const marqueeStyles = css.create({
  root: {
    display: 'flex',
    overflow: { default: 'hidden', _reducedMotion: 'auto' },
  },
  vertical: { flexDirection: 'column' },
  fade: {
    maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
  },
  fadeVertical: {
    maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
  },
  // 两份内容并排；平移 -50% 正好是一份（含它后面的间距）
  track: {
    display: 'flex',
    flexShrink: 0,
    width: 'max-content',
    animationName: { default: scrollX, _reducedMotion: 'none' },
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  trackVertical: {
    flexDirection: 'column',
    width: 'auto',
    height: 'max-content',
    animationName: { default: scrollY, _reducedMotion: 'none' },
  },
  reverse: { animationDirection: 'reverse' },
  pausable: {
    animationPlayState: { default: 'running', ':hover': 'paused', ':focus-within': 'paused' },
  },
  paused: { animationPlayState: 'paused' },
  group: { display: 'flex', flexShrink: 0, alignItems: 'center' },
  groupVertical: { flexDirection: 'column' },
  // 不滚动时用不着复制的那份
  copy: { display: { default: null, _reducedMotion: 'none' } },
});

/** Marquee 的样式：每份内容后面的间距（横排时在行尾、竖排时在下方），与项之间的 gap 一样宽 */
export const marqueeTrailStyles: Readonly<Record<'inline' | 'block', StyleTable<Space>>> = {
  inline: css.create({
    none: { paddingInlineEnd: '_none' },
    xs: { paddingInlineEnd: '_xs' },
    sm: { paddingInlineEnd: '_sm' },
    md: { paddingInlineEnd: '_md' },
    lg: { paddingInlineEnd: '_lg' },
    xl: { paddingInlineEnd: '_xl' },
  }),
  block: css.create({
    none: { paddingBlockEnd: '_none' },
    xs: { paddingBlockEnd: '_xs' },
    sm: { paddingBlockEnd: '_sm' },
    md: { paddingBlockEnd: '_md' },
    lg: { paddingBlockEnd: '_lg' },
    xl: { paddingBlockEnd: '_xl' },
  }),
};

// 时长是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Marquee 的样式：duration（一圈的时长） */
export const marqueeDynamicStyles = css.create({
  duration: (seconds: number) => ({ animationDuration: `${seconds}s` }),
});

/** 跑马灯：内容复制一份，纯 CSS 无缝循环滚动 */
export const Marquee = _component(
  ({
    direction = 'left',
    speed = 40,
    pauseOnHover = true,
    paused = false,
    fade = false,
    gap = 'lg',
    propsTrack,
    propsGroup,
    children,
    ...rest
  }: MarqueeProps) => {
    let group = _state.raw<HTMLElement | null>(null);
    // 一份内容（含间距）的长度：换算动画时长
    let length = _state(0);
    // 减少动态效果时变成手动滚动的区域：键盘要能聚焦它才能滚动
    const reducedMotion = useReducedMotion();
    const vertical = () => direction === 'up' || direction === 'down';

    useResizeObserver(
      () => group,
      () => {
        if (group) length = vertical() ? group.offsetHeight : group.offsetWidth;
      },
    );

    const renderGroup = (copy: boolean) => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              marqueeStyles.group,
              vertical() && marqueeStyles.groupVertical,
              gapStyles[gap],
              // 每份后面留一个间距：两份之间与项之间一样宽
              marqueeTrailStyles[vertical() ? 'block' : 'inline'][gap],
              copy && marqueeStyles.copy,
            ],
          },
          propsGroup,
          copy ? { 'aria-hidden': true, inert: true } : { ref: _toRef(group) },
        )}
      >
        {children}
      </div>
    );

    return () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              marqueeStyles.root,
              vertical() && marqueeStyles.vertical,
              fade && (vertical() ? marqueeStyles.fadeVertical : marqueeStyles.fade),
              reducedMotion.value && focusRingStyles.visible,
            ],
            role: 'marquee',
            tabindex: reducedMotion.value ? 0 : undefined,
          },
          rest,
        )}
        data-direction={direction}
        data-paused={paused || undefined}
      >
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                marqueeStyles.track,
                vertical() && marqueeStyles.trackVertical,
                (direction === 'right' || direction === 'down') && marqueeStyles.reverse,
                pauseOnHover && marqueeStyles.pausable,
                paused && marqueeStyles.paused,
                marqueeDynamicStyles.duration(Math.max(length, 1) / Math.max(speed, 1)),
              ],
            },
            propsTrack,
          )}
        >
          {renderGroup(false)}
          {renderGroup(true)}
        </div>
      </div>
    );
  },
);
