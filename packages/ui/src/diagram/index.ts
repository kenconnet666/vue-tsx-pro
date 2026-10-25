/**
 * 画布（子路径 `@vue-tsx-pro/ui/diagram`）：能平移、缩放的视口里摆放 HTML 节点与 SVG 连线，选择、框选、键盘与读屏，
 * 以及控制器 useDiagram、缩放按钮 DiagramControls 与几何工具。流程图、组织架构图、关系图都建在它上面。
 *
 *   import { Diagram, DiagramControls, useDiagram } from '@vue-tsx-pro/ui/diagram';
 *
 * 不放在主入口：只有画图的页面用得到；文案自带中英文（messages.ts），别的语言在 Lang.messages.diagram 里补。
 */
export {
  Diagram,
  DiagramContext,
  diagramDynamicStyles,
  diagramStyles,
  type DiagramDragModes,
  type DiagramEdgeItem,
  type DiagramGrids,
  type DiagramItemState,
  type DiagramNodeItem,
  type DiagramProps,
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
  diagramInternals,
  useDiagram,
  type DiagramController,
  type DiagramInternals,
  type DiagramOptions,
} from './controller';
export {
  arrowHead,
  borderPoint,
  boundsOf,
  polylineMidpoint,
  polylinePath,
  rectCenter,
  rectContains,
  rectFromCorners,
  rectsIntersect,
  trimEnd,
  type DiagramPoint,
  type DiagramRect,
} from './geometry';
export { diagramMessages, type DiagramMessages } from './messages';
