/**
 * 图表的系列与颜色：每个系列是数据行里的一个数值字段，颜色默认按顺序取主题的图表色板（colors.chart1–chart8）。
 * 颜色是 CSS 变量，切换主题、主题编辑器改品牌色都不用重画。
 */
import { colors } from '../config/theme/tokens.stylex';

/** 图表色板里的一个颜色：第几个系列色 */
export type ChartPaletteColor =
  'chart1' | 'chart2' | 'chart3' | 'chart4' | 'chart5' | 'chart6' | 'chart7' | 'chart8';

/** 系列颜色：色板里的一个（`'chart3'`），或任意 CSS 颜色（`'#e5484d'`、`colors.danger`） */
export type ChartColor = ChartPaletteColor | (string & {});

/** 数据行里取值是数字的字段 */
export type NumericKey<T> = {
  [K in keyof T]-?: T[K] extends number | null | undefined ? K : never;
}[keyof T] &
  string;

/** 一个系列：数据行里的一个数值字段画成一组柱子或一条线 */
export interface ChartSeries<T> {
  /** 取值的字段 */
  key: NumericKey<T>;
  /** 名称：图例、提示框、读屏的数据表里显示 */
  label: string;
  /** 颜色；不写时按系列的顺序取色板（第 1 个系列是 chart1，跟随品牌色） */
  color?: ChartColor;
}

/** 系列加上实际使用的颜色 */
export interface ResolvedSeries<T> extends ChartSeries<T> {
  /** CSS 颜色（色板颜色是 CSS 变量） */
  color: string;
}

const PALETTE: readonly string[] = [
  colors.chart1,
  colors.chart2,
  colors.chart3,
  colors.chart4,
  colors.chart5,
  colors.chart6,
  colors.chart7,
  colors.chart8,
];

const PALETTE_NAME = /^chart([1-8])$/;

/** 系列颜色：色板名换成 CSS 变量；没写时按位置取，多于 8 个系列时循环使用 */
export function resolveSeries<T>(series: readonly ChartSeries<T>[]): ResolvedSeries<T>[] {
  return series.map((item, index) => {
    const palette = item.color && PALETTE_NAME.exec(item.color);
    const color = palette
      ? PALETTE[Number(palette[1]) - 1]!
      : (item.color ?? PALETTE[index % PALETTE.length]!);
    return { ...item, color };
  });
}

/** 数据行里一个系列的值；空值（null、undefined、非数字）返回 undefined */
export function seriesValue<T>(row: T, key: NumericKey<T>): number | undefined {
  const value = row[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
