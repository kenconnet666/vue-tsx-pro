/**
 * 图表（子路径 `@vue-tsx-pro/ui/charts`；@unovis/ts 是可选的 peer 依赖，用到图表才安装）：
 *
 *   import { BarChart, LineChart } from '@vue-tsx-pro/ui/charts';
 *
 * 主入口不导入图表，没用到图表的应用不会打包 Unovis。
 */
export { BarChart, type BarChartProps } from './BarChart';
export { chartStyles, type ChartFrameParts, type ChartLegendItem } from './frame';
export { LineChart, type LineChartProps, type LineCurves, type LineDots } from './LineChart';
export {
  resolveSeries,
  type ChartColor,
  type ChartPaletteColor,
  type ChartSeries,
  type NumericKey,
  type ResolvedSeries,
} from './series';
export { xyChartStyles, type XYChartProps } from './XYChart';
