/**
 * 图表（子路径 `@vue-tsx-pro/ui/charts`；@unovis/ts 是可选的 peer 依赖，用到图表才安装）：
 *
 *   import { BarChart, LineChart } from '@vue-tsx-pro/ui/charts';
 *
 * 主入口不导入图表，没用到图表的应用不会打包 Unovis。
 */
export { AreaChart, type AreaChartProps } from './AreaChart';
export { BarChart, type BarChartOrientations, type BarChartProps } from './BarChart';
export { ChordChart, chordChartStyles, type ChordChartProps } from './ChordChart';
export { DonutChart, donutChartStyles, type DonutChartProps } from './DonutChart';
export { type FlowLink, type FlowNode } from './flow';
export {
  FunnelChart,
  funnelChartDynamicStyles,
  funnelChartStyles,
  type FunnelChartProps,
  type FunnelStage,
} from './FunnelChart';
export {
  GraphChart,
  graphChartStyles,
  type GraphChartGroup,
  type GraphChartLayouts,
  type GraphChartLink,
  type GraphChartNode,
  type GraphChartProps,
  type GraphChartShapes,
} from './GraphChart';
export { chartStyles, type ChartFrameParts, type ChartLegendItem } from './frame';
export {
  CURVES,
  LineChart,
  type LineChartProps,
  type LineCurves,
  type LineDots,
} from './LineChart';
export {
  SankeyChart,
  sankeyChartStyles,
  type SankeyAligns,
  type SankeyChartProps,
} from './SankeyChart';
export { ScatterChart, type ScatterChartProps } from './ScatterChart';
export {
  resolveColor,
  resolveSeries,
  type ChartColor,
  type ChartPaletteColor,
  type ChartToneColor,
  type ChartSeries,
  type NumericKey,
  type ResolvedSeries,
} from './series';
export {
  WaterfallChart,
  waterfallRows,
  type WaterfallChartProps,
  type WaterfallRow,
  type WaterfallStep,
} from './WaterfallChart';
export { xyChartStyles, type ChartSkeletons, type ChartTarget, type XYChartProps } from './XYChart';
