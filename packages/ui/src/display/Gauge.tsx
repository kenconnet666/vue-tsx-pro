/**
 * 仪表盘（role="meter"）：半圆的刻度上显示一个量落在哪个区间——完成率、利用率、风险分。外圈是分段的区间
 * （危险、提醒、良好），里面的弧是当前值（颜色取它所在区间的色调），中间是数值，下面是名称。
 *
 *   <Gauge value={0.82} max={1} valueFormat={{ style: 'percent' }} label="降本完成率"
 *     bands={[{ to: 0.6, tone: 'danger' }, { to: 0.9, tone: 'warning' }, { to: 1, tone: 'success' }]} target={0.9} />
 *
 * 和 Progress 的分工：Progress 是做到哪了（上传、步骤）；Gauge 是一个量处在好坏的哪一段（有区间、有目标）。
 * 纯 SVG，大小随字号缩放（宽 10em）。读屏按 meter 念：数值（按 valueFormat 与单位格式化）与目标。
 *
 * 部件：Root（div，role="meter"）、Value（中间的数值）、Label（名称）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { clamp } from '../utils/data/number';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

/** 外圈的一段区间：从上一段的终点（第一段从 min）到 to */
export interface GaugeBand {
  /** 终点 */
  to: number;
  /** 色调：落在这一段时数值弧也用它 */
  tone: StatusTone;
}

/** 角色与取值由组件管理 */
export type GaugeManaged =
  'role' | 'aria-valuemin' | 'aria-valuemax' | 'aria-valuenow' | 'aria-valuetext';

/** 未声明的属性落到外层 div（role="meter"）上 */
export interface GaugeProps extends PartProps<'div', GaugeManaged> {
  /** 当前值 */
  value: NumericValue;
  /** 最小值，默认 0 */
  min?: number;
  /** 最大值，默认 100 */
  max?: number;
  /** 数值的格式（百分比写 `{ style: 'percent' }`，配 max={1}） */
  valueFormat?: NumericFormat;
  /** 单位：数值后面带上 */
  unit?: string;
  /** 外圈的区间，按 to 从小到大；不写时外圈是一整段轨道色 */
  bands?: readonly GaugeBand[];
  /** 目标：外圈上画一道刻度，读屏念在数值后面 */
  target?: number;
  /** 数值弧的色调；不写时取它所在区间的色调，没有区间时 accent */
  tone?: StatusTone;
  /** 名称：显示在下方，也是 meter 的名称（没写 aria-label 时） */
  label?: VNodeChild;
  /** 中间显示的文字；不写时是格式化的数值 */
  valueLabel?: VNodeChild;
  /** 字号档位：仪表盘的大小随之缩放；不写时继承 */
  size?: TextSize;
  /** 中间数值的部件属性 */
  propsValue?: PartProps<'span'>;
  /** 名称的部件属性 */
  propsLabel?: PartProps<'span'>;
}

/** Gauge 的样式 */
export const gaugeStyles = css.create({
  root: {
    display: 'inline-grid',
    justifyItems: 'center',
    gap: '_xs',
    width: '10em',
    maxWidth: '100%',
  },
  dial: { position: 'relative', width: '100%' },
  svg: { display: 'block', width: '100%', height: 'auto', overflow: 'visible' },
  track: { fill: 'none', stroke: '_fill', strokeWidth: 14 },
  value: {
    fill: 'none',
    stroke: 'var(--gauge-color)',
    strokeWidth: 14,
    forcedColorAdjust: { default: null, _forcedColors: 'none' },
  },
  band: { fill: 'none', strokeWidth: 4 },
  target: { stroke: '_text', strokeWidth: 2.5, strokeLinecap: 'round' },
  // 中间的数值：压在半圆的底边上
  center: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    textAlign: 'center',
    fontSize: '1.5em',
    fontWeight: '_semibold',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    color: '_text',
  },
  ends: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: '0.75em',
    color: '_textMuted',
    fontVariantNumeric: 'tabular-nums',
  },
  label: { fontSize: '_sm', color: '_textMuted', textAlign: 'center' },
});

/**
 * 色调的实色：数值弧（--gauge-color）与外圈的区间。弧与区间只是辅助，数值以文字给出（中间与读屏），
 * 所以用明亮的实色而不是够文字对比度的深色
 */
const gaugeToneStyles = css.create({
  neutral: { '--gauge-color': '_colors.borderStrong' },
  accent: { '--gauge-color': '_colors.accent' },
  info: { '--gauge-color': '_colors.info' },
  success: { '--gauge-color': '_colors.success' },
  warning: { '--gauge-color': '_colors.warning' },
  danger: { '--gauge-color': '_colors.danger' },
});

/** 外圈区间的颜色 */
const bandColors = css.create({
  neutral: { stroke: '_borderStrong' },
  accent: { stroke: '_accent' },
  info: { stroke: '_info' },
  success: { stroke: '_success' },
  warning: { stroke: '_warning' },
  danger: { stroke: '_danger' },
});

// 半圆：圆心 (100, 100)，从左（180°）经上方到右（0°）
const CENTER = 100;
const RADIUS = 80;
const BAND_RADIUS = 94;

/** 比例 fraction（0–1）在半径 r 上的点 */
function point(fraction: number, r: number) {
  const angle = Math.PI * (1 - fraction);
  return { x: CENTER + r * Math.cos(angle), y: CENTER - r * Math.sin(angle) };
}

/** 从 from 到 to（比例）的弧 */
function arc(from: number, to: number, r: number) {
  const a = point(from, r);
  const b = point(to, r);
  return `M${a.x} ${a.y} A${r} ${r} 0 0 1 ${b.x} ${b.y}`;
}

/** 目标刻度：从数值弧的内沿穿过外圈 */
function tick(fraction: number) {
  const inner = point(fraction, RADIUS - 10);
  const outer = point(fraction, BAND_RADIUS + 4);
  return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
}

/** 仪表盘：半圆刻度、分段区间、当前值与目标 */
export const Gauge = _component(
  ({
    value,
    min = 0,
    max = 100,
    valueFormat,
    unit,
    bands,
    target,
    tone,
    label,
    valueLabel,
    size,
    propsValue,
    propsLabel,
    ...rest
  }: GaugeProps) => {
    const lang = useLang();
    const format = useFormat();
    const text = (number: NumericValue) =>
      format.number(number, unit ? { ...valueFormat, suffix: unit } : valueFormat);
    return () => {
      const current = toNumber(value);
      const fractionOf = (number: number) => clamp((number - min) / (max - min || 1), 0, 1);
      const fraction = fractionOf(current);
      const band = bands?.find((item) => current <= item.to) ?? bands?.at(-1);
      const color = tone ?? band?.tone ?? 'accent';
      const spoken = text(value);
      const name = typeof label === 'string' ? label : undefined;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [gaugeStyles.root, size && fontSizeStyles[size], gaugeToneStyles[color]],
              'aria-label': name,
            },
            rest,
            {
              role: 'meter',
              'aria-valuemin': min,
              'aria-valuemax': max,
              'aria-valuenow': clamp(current, min, max),
              'aria-valuetext':
                target === undefined ? spoken : `${spoken}，${lang.progressTarget(text(target))}`,
            },
          )}
        >
          <div {...css.attrs(gaugeStyles.dial)}>
            <svg {...css.attrs(gaugeStyles.svg)} viewBox="0 -4 200 108" aria-hidden="true">
              <path d={arc(0, 1, RADIUS)} {...css.attrs(gaugeStyles.track)} />
              {fraction > 0 && (
                <path d={arc(0, fraction, RADIUS)} {...css.attrs(gaugeStyles.value)} />
              )}
              {(bands ?? []).map((item, position) => {
                const from = fractionOf(position === 0 ? min : bands![position - 1]!.to);
                const to = fractionOf(item.to);
                return to > from ? (
                  <path
                    key={position}
                    d={arc(from, to, BAND_RADIUS)}
                    {...css.attrs(gaugeStyles.band, bandColors[item.tone])}
                  />
                ) : null;
              })}
              {target !== undefined && (
                <line {...tick(fractionOf(target))} {...css.attrs(gaugeStyles.target)} />
              )}
            </svg>
            <span
              {...mergeAttrs<'span'>({ sx: gaugeStyles.center }, propsValue, {
                'aria-hidden': true,
              })}
            >
              {valueLabel ?? spoken}
            </span>
          </div>
          <div {...css.attrs(gaugeStyles.ends)} aria-hidden="true">
            <span>{format.number(min, valueFormat)}</span>
            <span>{format.number(max, valueFormat)}</span>
          </div>
          {hasContent(label) && (
            <span {...mergeAttrs<'span'>({ sx: gaugeStyles.label }, propsLabel)}>{label}</span>
          )}
        </div>
      );
    };
  },
);
