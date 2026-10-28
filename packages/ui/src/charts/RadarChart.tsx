/**
 * 雷达图：几个维度上同时比较几个对象（供应商的质量、交期、价格、服务评分，方案的各项指标）。
 * 每个维度一根轴，从中心往外是 0 到 max；每个系列连成一个多边形，填一层浅色。
 *
 *   <RadarChart
 *     aria-label="供应商评分"
 *     data={[{ dimension: '质量', huachen: 86, hengyuan: 78 }, …]}
 *     index="dimension"
 *     series={[{ key: 'huachen', label: '华辰精密' }, { key: 'hengyuan', label: '恒远五金' }]}
 *     max={100}
 *   />
 *
 * Unovis 没有雷达图：这里用 SVG 直接画，外层结构（图例、单位、加载与空状态、给读屏的数据表）同其他图表。
 * 悬停一个维度时那根轴加粗，各系列在这一维的数值标在顶点旁边；点图例隐藏系列。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import type { PartProps } from '../utils/props';
import { niceStep } from './axis-ticks';
import { ChartFrame, type ChartFrameParts } from './frame';
import { resolveSeries, seriesNumber, seriesValue, type ChartSeries } from './series';
import { svgNumber } from '../utils/data/number';

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface RadarChartProps<T extends object>
  extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 数据：每一行是一个维度（质量、交期…） */
  data: readonly T[];
  /** 维度名的字段 */
  index: keyof T & string;
  /** 系列：每个系列连成一个多边形 */
  series: readonly ChartSeries<T>[];
  /** 轴的最大值；不写时按数据取一个整齐的值 */
  max?: number;
  /**
   * 网格的圈数
   * @default 4
   */
  levels?: number;
  /** 网格画成多边形（默认）或圆 */
  grid?: 'polygon' | 'circle';
  /** 数值的格式：刻度、顶点旁的数值、数据表共用 */
  valueFormat?: NumericFormat;
  /** 单位：显示在左上方 */
  unit?: string;
  /**
   * 绘图区的高度；数字按 px
   * @default 300
   */
  height?: number | string;
  /** 图例：默认多于一个系列时显示 */
  legend?: boolean;
  /** 隐藏的系列：点图例时写回，父级可以写 _hiddenSeries={keys} */
  _hiddenSeries?: string[];
  /** 加载中：绘图区显示骨架 */
  loading?: boolean;
  /** 没有数据时显示的内容 */
  empty?: VNodeChild;
}

/** RadarChart 的样式 */
export const radarChartStyles = css.create({
  svg: { display: 'block', width: '100%', height: '100%', overflow: 'visible' },
  grid: { fill: 'none', stroke: '_borderMuted', strokeWidth: 1 },
  spoke: { stroke: '_borderMuted', strokeWidth: 1 },
  spokeActive: { stroke: '_textMuted', strokeWidth: 1.5 },
  tick: { fill: '_textMuted', fontSize: '9px' },
  label: { fill: '_text', fontSize: '11px' },
  labelActive: { fontWeight: '_semibold' },
  // 几个系列叠在一起：填充很浅，混在一起也不发灰
  area: { fillOpacity: 0.08, strokeWidth: 2, strokeLinejoin: 'round' },
  vertex: { strokeWidth: 0 },
  value: { fontSize: '10px', fontWeight: '_semibold', paintOrder: 'stroke', strokeWidth: 3 },
  // 悬停用的扇区：透明，只接指针
  sector: { fill: 'transparent' },
  skeleton: {
    display: 'block',
    height: '100%',
    aspectRatio: '1',
    marginInline: 'auto',
    borderRadius: '50%',
  },
  stroke: (color: string) => ({ stroke: color, fill: color }),
  surfaceStroke: { stroke: '_surface' },
});

// 画布：360 × 300，中心 (180, 150)，半径 108；文字在半径 124 的圈上
const WIDTH = 360;
const HEIGHT = 300;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const RADIUS = 108;
const LABEL_RADIUS = 124;

/** 第 index 个维度（共 count 个）、比例 ratio 处的点：第一个维度在正上方，顺时针 */
function polar(index: number, count: number, ratio: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: svgNumber(CX + Math.cos(angle) * RADIUS * ratio),
    y: svgNumber(CY + Math.sin(angle) * RADIUS * ratio),
    angle,
  };
}

/** 雷达图 */
export const RadarChart = _component(
  <T extends object>({
    data,
    index,
    series,
    max,
    levels = 4,
    grid = 'polygon',
    valueFormat,
    unit,
    height = 300,
    legend,
    _hiddenSeries: hiddenSeries = _bindable<string[]>([]),
    loading = false,
    empty,
    ...rest
  }: RadarChartProps<T>) => {
    const lang = useLang();
    const format = useFormat();
    const resolved = _derived(resolveSeries(series));
    const visible = _derived(resolved.filter((item) => !hiddenSeries.includes(item.key)));
    // 悬停的维度
    let active = _state<number | null>(null);

    function toggle(key: string) {
      hiddenSeries = hiddenSeries.includes(key)
        ? hiddenSeries.filter((item) => item !== key)
        : [...hiddenSeries, key];
    }

    return () => {
      const count = data.length;
      const values = data.flatMap((row) => visible.map((item) => seriesNumber(row, item.key) ?? 0));
      // 轴的最大值：给了用它，否则取 levels 格整齐步长的整数倍
      const top = max ?? niceStep(Math.max(...values, 1) / levels) * levels;
      const ratioOf = (value: number) => Math.max(0, Math.min(value / top, 1));
      const ring = (ratio: number) =>
        grid === 'circle'
          ? null
          : data
              .map((_row, position) => polar(position, count, ratio))
              .map((p) => `${p.x},${p.y}`)
              .join(' ');

      const plot =
        count < 3 ? null : (
          <svg
            {...css.attrs(radarChartStyles.svg)}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            aria-hidden="true"
            onPointerleave={() => (active = null)}
          >
            {Array.from({ length: levels }, (_, level) => {
              const ratio = (level + 1) / levels;
              return grid === 'circle' ? (
                <circle
                  key={level}
                  cx={CX}
                  cy={CY}
                  r={RADIUS * ratio}
                  {...css.attrs(radarChartStyles.grid)}
                />
              ) : (
                <polygon key={level} points={ring(ratio)!} {...css.attrs(radarChartStyles.grid)} />
              );
            })}
            {data.map((row, position) => {
              const end = polar(position, count, 1);
              const label = polar(position, count, LABEL_RADIUS / RADIUS);
              const cos = Math.cos(label.angle);
              return (
                <g key={position}>
                  <line
                    x1={CX}
                    y1={CY}
                    x2={end.x}
                    y2={end.y}
                    {...css.attrs(
                      radarChartStyles.spoke,
                      active === position && radarChartStyles.spokeActive,
                    )}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    text-anchor={Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end'}
                    dominant-baseline="middle"
                    {...css.attrs(
                      radarChartStyles.label,
                      active === position && radarChartStyles.labelActive,
                    )}
                  >
                    {String(row[index] ?? '')}
                  </text>
                </g>
              );
            })}
            {Array.from({ length: levels }, (_, level) => (
              <text
                key={`tick-${level}`}
                x={CX + 3}
                y={CY - (RADIUS * (level + 1)) / levels}
                dominant-baseline="middle"
                {...css.attrs(radarChartStyles.tick)}
              >
                {format.number((top * (level + 1)) / levels, valueFormat)}
              </text>
            ))}
            {visible.map((item) => {
              const points = data.map((row, position) =>
                polar(position, count, ratioOf(seriesNumber(row, item.key) ?? 0)),
              );
              return (
                <g key={item.key}>
                  <polygon
                    points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                    {...css.attrs(radarChartStyles.area, radarChartStyles.stroke(item.color))}
                  />
                  {points.map((p, position) => (
                    <circle
                      key={position}
                      cx={p.x}
                      cy={p.y}
                      r={active === position ? 4 : 2.5}
                      {...css.attrs(radarChartStyles.vertex, radarChartStyles.stroke(item.color))}
                    />
                  ))}
                  {active !== null && (
                    <text
                      x={points[active]!.x}
                      y={points[active]!.y - 8}
                      text-anchor="middle"
                      {...css.attrs(
                        radarChartStyles.value,
                        radarChartStyles.stroke(item.color),
                        radarChartStyles.surfaceStroke,
                      )}
                    >
                      {format.number(seriesValue(data[active]!, item.key) ?? 0, valueFormat)}
                    </text>
                  )}
                </g>
              );
            })}
            {/* 悬停：每个维度一块扇区 */}
            {data.map((_row, position) => {
              const a = polar(position - 0.5, count, 1.2);
              const b = polar(position + 0.5, count, 1.2);
              return (
                <path
                  key={`sector-${position}`}
                  d={`M${CX} ${CY} L${a.x} ${a.y} L${b.x} ${b.y} Z`}
                  {...css.attrs(radarChartStyles.sector)}
                  onPointerenter={() => (active = position)}
                />
              );
            })}
          </svg>
        );

      return (
        <ChartFrame
          {...rest}
          unit={unit}
          height={height}
          legend={(legend ?? resolved.length > 1) ? resolved : []}
          hiddenKeys={hiddenSeries}
          onLegendToggle={toggle}
          loading={loading}
          skeleton={<Skeleton sx={radarChartStyles.skeleton} />}
          isEmpty={data.length === 0}
          empty={empty}
          table={{
            columns: [
              lang.chartCategory,
              ...resolved.map((item) => (unit ? `${item.label}（${unit}）` : item.label)),
            ],
            rows: data.map((row) => ({
              header: String(row[index] ?? ''),
              cells: resolved.map((item) => {
                const value = seriesValue(row, item.key);
                return value === undefined ? lang.emptyValue : format.number(value, valueFormat);
              }),
            })),
          }}
          plot={plot}
        />
      );
    };
  },
);
