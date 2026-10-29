/**
 * 图表（子路径 `@zerodep-dev/vue-tsx-pro-ui/charts`）：自己用 SVG 画，不依赖第三方图表库；比例尺、曲线、
 * 堆叠与各种布局（桑基、弦、矩形树、网络、地图投影）都是本目录里的精简实现。
 *
 *   import { BarChart, LineChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';
 *
 * 主入口不导入图表：没用到图表的应用不打包这些代码。地图的地理数据在另一个子路径（`@zerodep-dev/vue-tsx-pro-ui/maps`）。
 */
export { AreaChart, type AreaChartProps } from './AreaChart';
export { BarChart, type BarChartOrientations, type BarChartProps } from './BarChart';
export { ChordChart, chordChartStyles, type ChordChartProps } from './ChordChart';
export { ComboChart, type ComboChartProps, type ComboSeries } from './ComboChart';
export { DonutChart, donutChartStyles, type DonutChartProps } from './DonutChart';
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
export { LineChart, type LineChartProps, type LineDots } from './LineChart';
export {
  MapChart,
  mapChartStyles,
  type MapArea,
  type MapChartProps,
  type MapLink,
  type MapPoint,
  type MapProjections,
} from './MapChart';
export { RadarChart, radarChartStyles, type RadarChartProps } from './RadarChart';
export {
  SankeyChart,
  sankeyChartStyles,
  type SankeyAligns,
  type SankeyChartProps,
} from './SankeyChart';
export { ScatterChart, scatterChartStyles, type ScatterChartProps } from './ScatterChart';
export {
  TimelineChart,
  timelineChartStyles,
  type TimelineChartItem,
  type TimelineChartMarker,
  type TimelineChartProps,
  type TimelineChartSeries,
  type TimelineTime,
} from './TimelineChart';
export { TreemapChart, treemapChartStyles, type TreemapChartProps } from './TreemapChart';
export {
  WaterfallChart,
  waterfallChartStyles,
  waterfallRows,
  type WaterfallChartProps,
  type WaterfallRow,
  type WaterfallStep,
} from './WaterfallChart';
export {
  XYChart,
  xyChartStyles,
  type ChartAnnotation,
  type ChartBand,
  type ChartSecondaryAxis,
  type ChartSkeletons,
  type ChartTarget,
  type XYChartContext,
  type XYChartKind,
  type XYChartProps,
} from './XYChart';
export { alignedTicks, niceStep, type AlignedAxes, type AxisTicks } from './axis-ticks';
export { exportChartData, exportChartImage, serializeChartSvg } from './export';
export {
  flowData,
  resolveFlowNodes,
  type FlowLink,
  type FlowNode,
  type ResolvedFlowNode,
} from './flow';
export {
  ChartFrame,
  chartStyles,
  chartTooltip,
  useChartValueText,
  type ChartFrameParts,
  type ChartFrameProps,
  type ChartLegendItem,
  type ChartTable,
  type ChartTooltipItem,
} from './frame';
export {
  createProjection,
  type MapGeoProjection,
  type MapProjectionName,
  type ProjectionOptions,
  type Projector,
} from './geo/projection';
export {
  simplifyTopology,
  topologyBounds,
  topologyFeatures,
  type GeoPosition,
  type MapFeature,
  type MapTopology,
  type MapTopologyObject,
} from './geo/topojson';
export {
  placeLabels,
  rectsOverlap,
  type LabelAnchor,
  type LabelLayoutOptions,
  type LabelPlacement,
  type LabelRect,
} from './label-layout';
export { chordLayout, type ChordGroup, type ChordInputLink, type ChordLink } from './layout/chord';
export {
  graphLayout,
  type GraphLayoutInput,
  type GraphLayoutName,
  type GraphLayoutOptions,
} from './layout/graph';
export {
  sankeyLayout,
  type SankeyAlign,
  type SankeyInputLink,
  type SankeyLayoutLink,
  type SankeyLayoutNode,
  type SankeyLayoutOptions,
} from './layout/sankey';
export {
  groupTree,
  treemapLayout,
  type TreemapLayoutOptions,
  type TreemapNode,
} from './layout/treemap';
export {
  chartAreas,
  chartBar,
  chartBars,
  chartDots,
  chartLines,
  chartMarkStyles,
  type ChartAreaOptions,
  type ChartBarOptions,
  type ChartLineOptions,
} from './marks';
export {
  chartAxis,
  chartSvgStyles,
  ChartTooltipBox,
  chartTooltipStyles,
  pointerIn,
  usePlotArea,
  usePlotSeen,
  type AxisTick,
  type ChartAxisOptions,
  type ChartTip,
  type PlotArea,
  type PlotRect,
} from './plot';
export {
  linearScale,
  linearTicks,
  niceDomain,
  tickIncrement,
  timeTicks,
  type LinearScale,
} from './scale';
export {
  resolveColor,
  resolveSeries,
  seriesNumber,
  seriesValue,
  type ChartColor,
  type ChartPaletteColor,
  type ChartSeries,
  type ChartToneColor,
  type NumericKey,
  type ResolvedSeries,
} from './series';
export {
  arcPath,
  areaPath,
  barPath,
  horizontalLinkPath,
  linePath,
  polarPoint,
  ribbonPath,
  type ArcShape,
  type BarEnd,
  type ChartPoint,
  type LineCurves,
} from './shape';
export { stackValues, type StackSegment } from './stack';
export { estimateTextWidth, truncateText } from './text-size';
