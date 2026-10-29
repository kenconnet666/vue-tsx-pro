/**
 * 角标（span）：叠在头像、图标按钮右上角的计数或小圆点（未读消息、在线状态）。
 * 包住要标记的元素，角标绝对定位在它的角上；计数超过 max 显示“99+”。
 *
 *   <Indicator count={unread}><IconButton icon={Bell} aria-label="通知" /></Indicator>
 *   <Indicator dot tone="success" placement="bottom-end" overlap="circular" label="在线"><Avatar name="张三" /></Indicator>
 *
 * 读屏：角标里的数字对读屏隐藏，另有一句完整的说明（label，默认取语言包的“N 条新消息”“有新消息”），念在被标记的元素之后。
 * count 为 0（且没有 showZero）、也没有 dot 时不显示角标。部件：Root（外层 span）、Badge（角标）、Count（计数文字）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { mergeAttrs, type PartProps } from '../utils/props';
import { statusToneSx, type StatusTone } from '../utils/style/tone-styles';
import { VisuallyHidden } from './VisuallyHidden';
import { t } from '../config/theme/tokens';

/** 角标在被标记元素的哪个角（按书写方向） */
export interface IndicatorPlacements {
  /** 右上（默认；从右到左排版时左上） */
  'top-end': unknown;
  /** 右下：头像的在线状态 */
  'bottom-end': unknown;
  /** 左上 */
  'top-start': unknown;
  /** 左下 */
  'bottom-start': unknown;
}

/** 被标记元素的形状：决定角标往里收多少 */
export interface IndicatorOverlaps {
  /** 方形（默认）：角标中心在角上 */
  rectangular: unknown;
  /** 圆形（圆形头像）：角标收到圆的边上 */
  circular: unknown;
}

/** Indicator 的外观选项：可以在 ComponentDefaults 里统一设置 */
export interface IndicatorOptions {
  /** 色调，默认 danger */
  tone?: StatusTone;
}

/** 未声明的属性落到外层 span 上 */
export interface IndicatorProps extends PartProps<'span'>, IndicatorOptions {
  /** 计数；超过 max 显示“max+” */
  count?: number;
  /** 计数的上限，默认 99 */
  max?: number;
  /** 只显示小圆点（不显示数字） */
  dot?: boolean;
  /** count 为 0 时也显示 */
  showZero?: boolean;
  /** 位置，默认 top-end */
  placement?: keyof IndicatorPlacements;
  /** 被标记元素的形状，默认 rectangular */
  overlap?: keyof IndicatorOverlaps;
  /** 给读屏的说明；默认取语言包（“N 条新消息”“有新消息”） */
  label?: string;
  /** 角标的部件属性 */
  propsBadge?: PartProps<'span'>;
  /** 角标里计数文字的部件属性（读屏念的是 label，计数文字对读屏隐藏） */
  propsCount?: PartProps<'span', 'aria-hidden'>;
  /** 被标记的元素 */
  children?: VNodeChild;
}

/**
 * 角标的配方：部件 root（外层）、badge（角标）、count（计数文字）；位置、形状、圆点是档位。
 * 角标的实底色调来自共用的 statusToneSx，排在配方之前，createUi / Provider 的 styles.Indicator 能盖过它
 */
export const indicatorRecipe = css.recipe({
  name: 'Indicator',
  parts: ['root', 'badge', 'count'],
  base: {
    root: { position: 'relative', display: 'inline-flex', verticalAlign: 'middle', flexShrink: 0 },
    badge: {
      position: 'absolute',
      zIndex: 1,
      boxSizing: 'border-box',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '_full',
      // 一圈页面底色，和被标记的元素分开
      boxShadow: `0 0 0 ${t.borderWidths.sm} ${t.colors.background}`,
      fontWeight: '_semibold',
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      // 圆点只靠颜色表示“有新消息”：Windows 高对比下保留色调，不被系统改成背景色
      forcedColorAdjust: 'none',
    },
  },
  variants: {
    // 圆点或计数：角标的尺寸
    dot: {
      true: { badge: { width: '0.625em', height: '0.625em' } },
      false: {
        badge: { minWidth: '1.6em', height: '1.6em', paddingInline: '0.4em', fontSize: '0.75em' },
      },
    },
    // 角标的中心对准角：按书写方向的位移
    placement: {
      'top-end': {
        badge: {
          top: 0,
          insetInlineEnd: 0,
          translate: { default: '50% -50%', ':dir(rtl)': '-50% -50%' },
        },
      },
      'bottom-end': {
        badge: {
          bottom: 0,
          insetInlineEnd: 0,
          translate: { default: '50% 50%', ':dir(rtl)': '-50% 50%' },
        },
      },
      'top-start': {
        badge: {
          top: 0,
          insetInlineStart: 0,
          translate: { default: '-50% -50%', ':dir(rtl)': '50% -50%' },
        },
      },
      'bottom-start': {
        badge: {
          bottom: 0,
          insetInlineStart: 0,
          translate: { default: '-50% 50%', ':dir(rtl)': '50% 50%' },
        },
      },
    },
    overlap: {
      rectangular: {},
      // 圆形：角落到圆边的距离约是边长的 14.6%（1 - 1/√2 的一半），角标收进去这么多
      circular: { badge: { margin: '14.6%' } },
    },
  },
});

/** 角标的部件（createUi / Provider 的 styles.Indicator 按它定制） */
export type IndicatorPart = (typeof indicatorRecipe.parts)[number];

/** 角标：叠在被标记元素角上的计数或小圆点 */
export const Indicator = _component(
  ({
    count,
    max = 99,
    dot = false,
    showZero = false,
    tone,
    placement = 'top-end',
    overlap = 'rectangular',
    label,
    propsBadge,
    propsCount,
    children,
    ...rest
  }: IndicatorProps) => {
    const lang = useLang();
    const appearance = useDefaults('Indicator', () => ({ tone }), { tone: 'danger' });
    const recipe = useRecipe(indicatorRecipe);
    return () => {
      const visible = dot || (count != null && (count > 0 || showZero));
      const text = count == null ? '' : count > max ? `${max}+` : String(count);
      const shownTone = appearance().tone;
      const s = recipe({ dot, placement, overlap, tone: shownTone });
      return (
        <span {...mergeAttrs<'span'>(s.root, rest)}>
          {children}
          {visible && (
            <span
              {...mergeAttrs<'span'>(
                { ...s.badge, sx: [statusToneSx('solid', shownTone), s.badge.sx] },
                propsBadge,
              )}
              data-placement={placement}
            >
              {!dot && (
                <span {...mergeAttrs<'span'>(s.count, propsCount, { 'aria-hidden': true })}>
                  {text}
                </span>
              )}
              <VisuallyHidden>
                {label ?? (dot ? lang.indicatorDot : lang.indicatorCount(count ?? 0))}
              </VisuallyHidden>
            </span>
          )}
        </span>
      );
    };
  },
);
