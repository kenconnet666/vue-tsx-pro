/**
 * 画布（子路径 `@vue-tsx-pro/ui/diagram`）：能平移、缩放的视口里摆放 HTML 节点与 SVG 连线，选择、框选、拖动、连线、键盘与读屏；
 * 标准节点 DiagramNode、泳道 DiagramLanes、控制器 useDiagram、缩放按钮 DiagramControls、小地图 DiagramMinimap、
 * 导出 diagramToSvg / diagramToPng 与几何、路由工具。流程图、组织架构图、关系图都建在它上面。
 *
 *   import { Diagram, DiagramControls, DiagramNode, useDiagram } from '@vue-tsx-pro/ui/diagram';
 *
 * 不放在主入口：只有画图的页面用得到；文案自带中英文（messages.ts），别的语言在 Lang.messages.diagram 里补。
 */
export {
  Diagram,
  DiagramContext,
  diagramDynamicStyles,
  diagramStyles,
  type DiagramConnection,
  type DiagramDragModes,
  type DiagramEdgeItem,
  type DiagramGrids,
  type DiagramItemState,
  type DiagramNodeItem,
  type DiagramNodeMove,
  type DiagramProps,
  type DiagramReconnection,
  type DiagramRoutings,
  type DiagramSelection,
  type DiagramSelectionModes,
} from './Diagram';
export {
  DiagramControls,
  diagramControlsStyles,
  type DiagramControlsPlacements,
  type DiagramControlsProps,
} from './DiagramControls';
export {
  DiagramLanes,
  diagramLanesDynamicStyles,
  diagramLanesStyles,
  lanesExtent,
  type DiagramLane,
  type DiagramLanesLayout,
  type DiagramLanesProps,
} from './DiagramLanes';
export {
  DiagramMinimap,
  diagramMinimapStyles,
  type DiagramMinimapPlacements,
  type DiagramMinimapProps,
} from './DiagramMinimap';
export {
  DiagramNode,
  diagramNodeStyles,
  diagramNodeToneStyles,
  type DiagramNodeProps,
  type DiagramNodeShapes,
} from './DiagramNode';
export {
  diagramInternals,
  useDiagram,
  type DiagramController,
  type DiagramInternals,
  type DiagramOptions,
} from './controller';
export { diagramToPng, diagramToSvg, type DiagramExportOptions } from './export';
export {
  alignToGuides,
  arrowHead,
  borderPoint,
  boundsOf,
  polylineMidpoint,
  polylinePath,
  rectAt,
  rectCenter,
  rectContains,
  rectFromCorners,
  rectsIntersect,
  trimEnd,
  type DiagramGuide,
  type DiagramPoint,
  type DiagramRect,
} from './geometry';
export { diagramMessages, type DiagramMessages } from './messages';
export {
  chooseSides,
  nearestSide,
  routeEdges,
  routeOrthogonal,
  sidePoint,
  simplify,
  straightRoute,
  type DiagramSide,
  type DiagramSides,
  type RouteEdge,
  type RouteEnd,
  type RouteOptions,
} from './route';
