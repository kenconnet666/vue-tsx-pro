/**
 * 角标（span）：叠在头像、图标按钮右上角的计数或小圆点（未读消息、在线状态）。
 * 包住要标记的元素，角标绝对定位在它的角上；计数超过 max 显示“99+”。
 *
 *   <Indicator count={unread}><IconButton icon={Bell} aria-label="通知" /></Indicator>
 *   <Indicator dot tone="success" placement="bottom-end" overlap="circular" label="在线"><Avatar name="张三" /></Indicator>
 *
 * 读屏：角标里的数字对读屏隐藏，另有一句完整的说明（label，默认取语言包的“N 条新消息”“有新消息”），念在被标记的元素之后。
 * count 为 0（且没有 showZero）、也没有 dot 时不显示角标。部件：Root（外层 span）、Badge（角标）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { statusToneSx, type StatusTone } from '../utils/style/tone-styles';
import type { StyleTable } from '../utils/style/styles';
import { VisuallyHidden } from './VisuallyHidden';

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

/** 未声明的属性落到外层 span 上 */
export interface IndicatorProps extends PartProps<'span'> {
  /** 计数；超过 max 显示“max+” */
  count?: number;
  /** 计数的上限，默认 99 */
  max?: number;
  /** 只显示小圆点（不显示数字） */
  dot?: boolean;
  /** count 为 0 时也显示 */
  showZero?: boolean;
  /** 色调，默认 danger */
  tone?: StatusTone;
  /** 位置，默认 top-end */
  placement?: keyof IndicatorPlacements;
  /** 被标记元素的形状，默认 rectangular */
  overlap?: keyof IndicatorOverlaps;
  /** 给读屏的说明；默认取语言包（“N 条新消息”“有新消息”） */
  label?: string;
  /** 角标的部件属性 */
  propsBadge?: PartProps<'span'>;
  /** 被标记的元素 */
  children?: VNodeChild;
}

/** Indicator 的样式：root、badge、count、dot、各位置与 circular */
export const indicatorStyles: StyleTable<
  | 'root'
  | 'badge'
  | 'count'
  | 'dot'
  | 'top-end'
  | 'bottom-end'
  | 'top-start'
  | 'bottom-start'
  | 'circular'
> = stylex.create({
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
    boxShadow: '0 0 0 _borderWidths.sm _colors.background',
    fontWeight: '_semibold',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  count: { minWidth: '1.6em', height: '1.6em', paddingInline: '0.4em', fontSize: '0.75em' },
  dot: { width: '0.625em', height: '0.625em' },
  // 角标的中心对准角：按书写方向的位移
  'top-end': {
    top: 0,
    insetInlineEnd: 0,
    translate: { default: '50% -50%', ':dir(rtl)': '-50% -50%' },
  },
  'bottom-end': {
    bottom: 0,
    insetInlineEnd: 0,
    translate: { default: '50% 50%', ':dir(rtl)': '-50% 50%' },
  },
  'top-start': {
    top: 0,
    insetInlineStart: 0,
    translate: { default: '-50% -50%', ':dir(rtl)': '50% -50%' },
  },
  'bottom-start': {
    bottom: 0,
    insetInlineStart: 0,
    translate: { default: '-50% 50%', ':dir(rtl)': '50% 50%' },
  },
  // 圆形：角落到圆边的距离约是边长的 14.6%（1 - 1/√2 的一半），角标收进去这么多
  circular: { margin: '14.6%' },
});

/** 角标：叠在被标记元素角上的计数或小圆点 */
export const Indicator = _component(
  ({
    count,
    max = 99,
    dot = false,
    showZero = false,
    tone = 'danger',
    placement = 'top-end',
    overlap = 'rectangular',
    label,
    propsBadge,
    children,
    ...rest
  }: IndicatorProps) => {
    const lang = useLang();
    return () => {
      const visible = dot || (count != null && (count > 0 || showZero));
      const text = count == null ? '' : count > max ? `${max}+` : String(count);
      return (
        <span {...elementProps(mergeProps<'span'>({ sx: indicatorStyles.root }, rest))}>
          {children}
          {visible && (
            <span
              {...elementProps(
                mergeProps<'span'>(
                  {
                    sx: [
                      indicatorStyles.badge,
                      statusToneSx('solid', tone),
                      dot ? indicatorStyles.dot : indicatorStyles.count,
                      indicatorStyles[placement],
                      overlap === 'circular' && indicatorStyles.circular,
                    ],
                  },
                  propsBadge,
                ),
              )}
              data-placement={placement}
            >
              {!dot && <span aria-hidden="true">{text}</span>}
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
