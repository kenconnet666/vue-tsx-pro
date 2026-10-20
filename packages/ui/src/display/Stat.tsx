/**
 * 统计数值（dl）：指标名、数值与单位、可选的图标与环比变化。仪表盘顶部的一排卡片、详情页的关键指标。
 * 外观只是内容，放进 Card、Grid 里组合：
 *
 *   <Card><Stat label="实际降本金额" value={910.36} unit="万元" icon={Wallet} change={0.123} changeLabel="较上月" /></Card>
 *
 * 数值变化时滚动过渡（AnimatedNumber），读屏只读终值；变化量按正负着色并带箭头，
 * 成本、耗时这类“越低越好”的指标写 invertChange。
 */
import { TrendingDown, TrendingUp } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { mergeAttrs, type PartProps } from '../utils/props';
import { toneStyles } from '../utils/style/typography';
import { AnimatedNumber } from './AnimatedNumber';

/** 未声明的属性落到外层 dl 上 */
export interface StatProps extends PartProps<'dl'> {
  /** 指标名 */
  label: VNodeChild;
  /** 数值：数字按当前语言格式化并在变化时滚动；字符串原样显示（如“—”、“98.5%”） */
  value: number | string;
  /** 数值的格式（Intl.NumberFormatOptions），如两位小数 `{ minimumFractionDigits: 2 }`、百分比 `{ style: 'percent' }` */
  format?: Intl.NumberFormatOptions;
  /** 单位，跟在数值后面、字号小一档 */
  unit?: VNodeChild;
  /** 右上角的图标（装饰，对读屏隐藏） */
  icon?: IconData;
  /** 变化量（环比、同比）：正数向上、负数向下；默认按百分比显示（0.12 → +12%） */
  change?: number;
  /** 变化量的格式，默认 `{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }` */
  changeFormat?: Intl.NumberFormatOptions;
  /** 变化量后面的说明，如“较上月” */
  changeLabel?: VNodeChild;
  /** 下降是好事（成本、耗时、故障数）：下降显示成功色、上升显示危险色 */
  invertChange?: boolean;
  /** 底部的补充说明 */
  description?: VNodeChild;
  /** 指标名（dt）的部件属性 */
  propsLabel?: PartProps<'dt'>;
  /** 数值（dd）的部件属性 */
  propsValue?: PartProps<'dd'>;
}

const CHANGE_FORMAT: Intl.NumberFormatOptions = {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
};

/** Stat 的样式：root、label、icon、value、number、unit、change、description */
export const statStyles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_xs', margin: 0, minWidth: 0 },
  // dt 里放指标名与图标：dl 的子元素只能是 dt、dd
  label: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '_sm',
    margin: 0,
    color: '_textMuted',
    fontSize: '_sm',
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '2em',
    height: '2em',
    borderRadius: '_md',
    backgroundColor: '_accentSoft',
    color: '_accentText',
    fontSize: '_sm',
  },
  value: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '_xs',
    margin: 0,
  },
  number: {
    fontSize: '_xxl',
    fontWeight: '_bold',
    lineHeight: '_tight',
    color: '_text',
    fontVariantNumeric: 'tabular-nums',
  },
  unit: { color: '_textMuted', fontSize: '_xs' },
  change: { display: 'flex', alignItems: 'center', gap: '_xs', fontSize: '_xs', margin: 0 },
  changeLabel: { color: '_textMuted' },
  description: { color: '_textMuted', fontSize: '_xs', margin: 0 },
});

/** 统计数值：指标名、数值与单位、图标、变化量 */
export const Stat = _component(
  ({
    label,
    value,
    format,
    unit,
    icon,
    change,
    changeFormat = CHANGE_FORMAT,
    changeLabel,
    invertChange = false,
    description,
    propsLabel,
    propsValue,
    ...rest
  }: StatProps) =>
    () => {
      const direction = change === undefined || change === 0 ? 'flat' : change > 0 ? 'up' : 'down';
      const improved = invertChange ? direction === 'down' : direction === 'up';
      const changeTone = direction === 'flat' ? 'muted' : improved ? 'success' : 'danger';
      return (
        <dl {...mergeAttrs<'dl'>({ sx: statStyles.root }, rest)}>
          <dt {...mergeAttrs<'dt'>({ sx: statStyles.label }, propsLabel)}>
            <span>{label}</span>
            {icon && (
              <span {...stylex.attrs(statStyles.icon)} aria-hidden="true">
                <Icon icon={icon} />
              </span>
            )}
          </dt>
          <dd {...mergeAttrs<'dd'>({ sx: statStyles.value }, propsValue)}>
            {typeof value === 'number' ? (
              <AnimatedNumber value={value} format={format} sx={statStyles.number} />
            ) : (
              <span {...stylex.attrs(statStyles.number)}>{value}</span>
            )}
            {unit != null && <span {...stylex.attrs(statStyles.unit)}>{unit}</span>}
          </dd>
          {change !== undefined && (
            <dd {...stylex.attrs(statStyles.change)} data-trend={direction}>
              <span {...stylex.attrs(toneStyles[changeTone])}>
                {direction !== 'flat' && (
                  <Icon icon={direction === 'up' ? TrendingUp : TrendingDown} aria-hidden="true" />
                )}{' '}
                <AnimatedNumber value={change} format={changeFormat} />
              </span>
              {changeLabel != null && (
                <span {...stylex.attrs(statStyles.changeLabel)}>{changeLabel}</span>
              )}
            </dd>
          )}
          {description != null && <dd {...stylex.attrs(statStyles.description)}>{description}</dd>}
        </dl>
      );
    },
);
