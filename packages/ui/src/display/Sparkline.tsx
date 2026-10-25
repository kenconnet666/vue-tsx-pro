/**
 * 迷你图：没有坐标轴的小折线、面积或柱，嵌在指标卡（Stat 的 children）、表格的格子、列表的一行里看走势。
 * 纯 SVG，不依赖图表库；宽度占满容器，高度默认 2em（随字号缩放）。
 *
 *   <Stat label="实际销售" value={910.36} unit="万元">
 *     <Sparkline data={monthly} variant="area" label="近 12 个月" />
 *   </Stat>
 *   <Sparkline data={[3, 5, null, 4, 8]} variant="bar" tone="success" />
 *
 * 空值（null、undefined）处断开（柱是空位）；默认标出最后一个点。读屏念成一句话：几个值、从哪到哪、最低最高
 * （按 valueFormat 与当前语言格式化），label 写在前面。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import { mergeAttrs, type PartProps } from '../utils/props';
import { toneFillStyles, type StatusTone } from '../utils/style/tone-styles';
import { t } from '../config/theme/tokens';

/** 迷你图的画法 */
export interface SparklineVariants {
  /** 折线（默认） */
  line: unknown;
  /** 折线下面填一层浅色 */
  area: unknown;
  /** 柱：每个值一根，从 0 起 */
  bar: unknown;
}

/** 角色与名称由组件给出（role="img"，名称是 label 加上数据的概括） */
export type SparklineManaged = 'role' | 'aria-label';

/** 未声明的属性落到外层 span 上 */
export interface SparklineProps extends PartProps<'span', SparklineManaged> {
  /** 各个值，按时间先后；空值处断开 */
  data: readonly (NumericValue | null | undefined)[];
  /** 画法，默认 line */
  variant?: keyof SparklineVariants;
  /** 色调，默认 accent */
  tone?: StatusTone;
  /** 高度（CSS 长度），默认 2em */
  height?: string;
  /** 标出最后一个点（折线、面积），默认 true */
  showLast?: boolean;
  /** 纵向范围 [最小, 最大]；不写的一端按数据取（柱从 0 起） */
  domain?: readonly [number | undefined, number | undefined];
  /** 读屏念的数值格式 */
  valueFormat?: NumericFormat;
  /** 名称：读屏先念它（“近 12 个月实际销售”） */
  label?: string;
}

/** Sparkline 的样式 */
export const sparklineStyles = css.create({
  root: { position: 'relative', display: 'block', width: '100%' },
  svg: { display: 'block', width: '100%', height: '100%', overflow: 'visible' },
  line: {
    fill: 'none',
    stroke: 'var(--tone-fill)',
    strokeWidth: 1.5,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  },
  area: { fill: 'var(--tone-fill)', fillOpacity: 0.15, stroke: 'none' },
  bar: { fill: 'var(--tone-fill)', fillOpacity: 0.85 },
  // 最后一个点：HTML 圆点按百分比定位（SVG 拉伸时圆不变形）
  last: {
    position: 'absolute',
    width: '6px',
    height: '6px',
    borderRadius: '_full',
    backgroundColor: 'var(--tone-fill)',
    // 一圈表面色把点与线分开
    boxShadow: `0 0 0 2px ${t.colors.surface}`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  height: (height: string) => ({ height }),
  position: (left: string, top: string) => ({ left, top }),
});

/** 迷你图：小折线、面积或柱 */
export const Sparkline = _component(
  ({
    data,
    variant = 'line',
    tone = 'accent',
    height = '2em',
    showLast = true,
    domain,
    valueFormat,
    label,
    ...rest
  }: SparklineProps) => {
    const lang = useLang();
    const format = useFormat();
    return () => {
      const values = data.map((value) => (value == null ? undefined : toNumber(value)));
      const present = values.filter((value): value is number => value !== undefined);
      const bars = variant === 'bar';
      const low = domain?.[0] ?? Math.min(...present, ...(bars ? [0] : []));
      const high = domain?.[1] ?? Math.max(...present, ...(bars ? [0] : []));
      const span = high - low || 1;
      // 纵坐标 0（上）–100（下）；横坐标按位置，柱每个占 1 格
      const yOf = (value: number) => 100 - ((value - low) / span) * 100;
      const width = bars ? values.length : Math.max(values.length - 1, 1);

      // 连续的段：空值处断开
      const segments: [number, number][][] = [];
      let current: [number, number][] = [];
      values.forEach((value, position) => {
        if (value === undefined) {
          if (current.length) segments.push(current);
          current = [];
        } else current.push([position, yOf(value)]);
      });
      if (current.length) segments.push(current);
      const path = (points: [number, number][]) =>
        points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

      const lastIndex = values.findLastIndex((value) => value !== undefined);
      const summary =
        present.length === 0
          ? lang.emptyValue
          : lang.sparklineSummary(
              present.length,
              format.number(data[values.findIndex((value) => value !== undefined)]!, valueFormat),
              format.number(data[lastIndex]!, valueFormat),
              format.number(Math.min(...present), valueFormat),
              format.number(Math.max(...present), valueFormat),
            );

      return (
        <span
          {...mergeAttrs<'span'>(
            { sx: [sparklineStyles.root, sparklineStyles.height(height), toneFillStyles[tone]] },
            rest,
            { role: 'img', 'aria-label': label ? `${label}：${summary}` : summary },
          )}
        >
          <svg
            {...css.attrs(sparklineStyles.svg)}
            viewBox={`0 0 ${width} 100`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {bars
              ? values.map((value, position) =>
                  value === undefined ? null : (
                    <rect
                      key={position}
                      x={position + 0.15}
                      width={0.7}
                      y={Math.min(yOf(value), yOf(Math.max(low, 0)))}
                      height={Math.abs(yOf(value) - yOf(Math.max(low, 0)))}
                      {...css.attrs(sparklineStyles.bar)}
                    />
                  ),
                )
              : segments.map((points, position) => (
                  <g key={position}>
                    {variant === 'area' && points.length > 1 && (
                      <path
                        d={`${path(points)} L${points.at(-1)![0]} 100 L${points[0]![0]} 100 Z`}
                        {...css.attrs(sparklineStyles.area)}
                      />
                    )}
                    <path
                      d={path(points)}
                      vector-effect="non-scaling-stroke"
                      {...css.attrs(sparklineStyles.line)}
                    />
                  </g>
                ))}
          </svg>
          {showLast && !bars && lastIndex >= 0 && (
            <span
              aria-hidden="true"
              {...css.attrs(
                sparklineStyles.last,
                sparklineStyles.position(
                  `${(lastIndex / width) * 100}%`,
                  `${yOf(values[lastIndex]!)}%`,
                ),
              )}
            />
          )}
        </span>
      );
    };
  },
);
