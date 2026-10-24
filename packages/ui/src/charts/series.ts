/**
 * 图表的系列与颜色：每个系列是数据行里的一个数值字段，颜色默认按顺序取主题的图表色板（colors.chart1–chart8）。
 * 颜色是 CSS 变量，切换主题、主题编辑器改品牌色都不用重画。
 * 值可以是 number、bigint 或 Decimal：画图时转成 number，提示框与数据表按原值格式化，不丢精度。
 */
import { colors } from '../config/theme/tokens';
import { isDecimal, isNumeric, toNumber, type NumericValue } from '../utils/data/numeric';

/** 图表色板里的一个颜色：第几个系列色 */
export type ChartPaletteColor =
  'chart1' | 'chart2' | 'chart3' | 'chart4' | 'chart5' | 'chart6' | 'chart7' | 'chart8';

/** 语义色：好坏、提醒（瀑布图的增减、目标线），跟随主题 */
export type ChartToneColor = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** 系列颜色：色板里的一个（`'chart3'`）、语义色（`'danger'`），或任意 CSS 颜色（`'#e5484d'`） */
export type ChartColor = ChartPaletteColor | ChartToneColor | (string & {});

/** 数据行里取值是数字（number、bigint、Decimal）的字段 */
export type NumericKey<T> = {
  [K in keyof T]-?: T[K] extends NumericValue | null | undefined ? K : never;
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

const TONES: Record<ChartToneColor, string> = {
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  neutral: colors.textMuted,
};

/**
 * 一个颜色：色板名、语义色换成 CSS 变量；没写时按位置取色板，多于 8 个时循环使用
 * （系列、环形图的扇区、网络图的组共用）
 */
export function resolveColor(color: ChartColor | undefined, index: number): string {
  const palette = color && PALETTE_NAME.exec(color);
  if (palette) return PALETTE[Number(palette[1]) - 1]!;
  if (color && color in TONES) return TONES[color as ChartToneColor];
  return color ?? PALETTE[index % PALETTE.length]!;
}

/** 系列颜色：见 resolveColor */
export function resolveSeries<T>(series: readonly ChartSeries<T>[]): ResolvedSeries<T>[] {
  return series.map((item, index) => ({ ...item, color: resolveColor(item.color, index) }));
}

/** 数据行里一个系列的原值：提示框、数据表按它格式化；空值、非数字、NaN 与无穷返回 undefined */
export function seriesValue<T>(row: T, key: NumericKey<T>): NumericValue | undefined {
  const value: unknown = row[key];
  if (!isNumeric(value)) return undefined;
  if (typeof value === 'number' && !Number.isFinite(value)) return undefined;
  return isDecimal(value) && !value.isFinite() ? undefined : value;
}

/** 画图用的坐标：原值转成 number（Decimal、bigint 的精度对坐标足够） */
export function seriesNumber<T>(row: T, key: NumericKey<T>): number | undefined {
  const value = seriesValue(row, key);
  return value === undefined ? undefined : toNumber(value);
}
