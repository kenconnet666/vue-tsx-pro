/**
 * 比例条：一根横条按各部分的数量分段，下面是图例（色点、名称、数量），看一个总数由哪几块构成
 * （任务池的三桶、各状态的占比、存储空间）。部分之间互斥、加起来是总数时用它；要比较趋势用图表。
 *
 *   <ProportionBar
 *     aria-label="任务池构成"
 *     segments={[
 *       { key: 'confirmed', label: '已确认收益', value: 25, tone: 'success' },
 *       { key: 'unpriced', label: '挂账待定', value: 4, tone: 'warning' },
 *       { key: 'plan', label: '方案待定', value: 35, tone: 'info' },
 *     ]}
 *     valueText={(segment) => `${segment.value} 项`}
 *   />
 *
 * 横条对读屏是一张图（role="img"），名称后面自动带上各段的数量；图例是普通文字。
 * 数量为 0 的段不画但留在图例里。颜色用 tone（状态色）或 color（任意 CSS 颜色，如图表色板）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import { StatusDot, statusDotToneStyles } from './StatusDot';

/** 比例条的一段 */
export interface ProportionSegment {
  /** 标识 */
  key: string;
  /** 名称 */
  label: string;
  /** 数量 */
  value: number;
  /** 色调；不写时按顺序取 accent、info、success、warning、danger、neutral */
  tone?: StatusTone;
  /** 任意 CSS 颜色；写了时不看 tone */
  color?: string;
}

/** 未声明的属性落到外层 div 上 */
export interface ProportionBarProps extends PartProps<'div'> {
  /** 各段：按顺序从起始边排 */
  segments: readonly ProportionSegment[];
  /** 横条的名称（读屏）：后面自动带上各段的数量 */
  'aria-label': string;
  /** 图例里数量的写法，默认是数字 */
  valueText?: (segment: ProportionSegment) => VNodeChild;
  /**
   * 下面的图例
   * @default true
   */
  legend?: boolean;
  /**
   * 横条的粗细
   * @default 'md'
   */
  size?: 'sm' | 'md';
  /** 图例每一项后面的补充（“待定价”） */
  legendExtra?: (segment: ProportionSegment) => VNodeChild;
}

const ORDER: readonly StatusTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];

/** ProportionBar 的样式：root、bar、sm、md、legend、legendItem、value */
export const proportionBarStyles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: 0 },
  bar: { display: 'flex', gap: '2px', borderRadius: '_full', overflow: 'hidden' },
  sm: { height: '0.5rem' },
  md: { height: '0.75rem' },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: '_md',
    rowGap: '_xs',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    fontSize: '_sm',
  },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '_sm' },
  value: { fontWeight: '_semibold', fontVariantNumeric: 'tabular-nums' },
});

/** ProportionBar 的动态样式：段的份额、任意颜色 */
export const proportionBarDynamicStyles = stylex.create({
  share: (value: number) => ({ flexGrow: value, flexBasis: 0 }),
  color: (color: string) => ({ backgroundColor: color }),
});

/** 比例条 */
export const ProportionBar = _component(
  ({
    segments,
    valueText = (segment) => String(segment.value),
    legend = true,
    size = 'md',
    legendExtra,
    'aria-label': label,
    ...rest
  }: ProportionBarProps) => {
    const toneOf = (segment: ProportionSegment, index: number) =>
      segment.tone ?? ORDER[index % ORDER.length]!;
    return () => (
      <div {...mergeAttrs<'div'>({ sx: proportionBarStyles.root }, rest)}>
        <div
          role="img"
          aria-label={`${label}：${segments
            .map((segment) => `${segment.label} ${segment.value}`)
            .join('，')}`}
          {...stylex.attrs(proportionBarStyles.bar, proportionBarStyles[size])}
        >
          {segments.map(
            (segment, index) =>
              segment.value > 0 && (
                <span
                  key={segment.key}
                  {...stylex.attrs(
                    proportionBarDynamicStyles.share(segment.value),
                    segment.color
                      ? proportionBarDynamicStyles.color(segment.color)
                      : statusDotToneStyles[toneOf(segment, index)],
                  )}
                />
              ),
          )}
        </div>
        {legend && (
          <ul {...stylex.attrs(proportionBarStyles.legend)}>
            {segments.map((segment, index) => (
              <li key={segment.key} {...stylex.attrs(proportionBarStyles.legendItem)}>
                <StatusDot size="md" tone={toneOf(segment, index)} color={segment.color} />
                <span>{segment.label}</span>
                <span {...stylex.attrs(proportionBarStyles.value)}>{valueText(segment)}</span>
                {legendExtra?.(segment)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
