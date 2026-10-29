/**
 * 流向图（桑基图、弦图）共用的数据：节点与节点之间的流向。节点的颜色按顺序取图表色板；
 * 布局只接受正的流量，值不是正数、指向不存在节点的流向在布局前去掉。
 */
import { toNumber, type NumericValue } from '../utils/data/numeric';
import { resolveColor, type ChartColor } from './series';

/** 一个节点 */
export interface FlowNode {
  /** 节点的 id：流向里用它指节点 */
  id: string;
  /** 显示的名字；不写时用 id */
  label?: string;
  /** 颜色；不写时按顺序取图表色板 */
  color?: ChartColor;
}

/** 一条流向：从 source 到 target 的量 */
export interface FlowLink {
  /** 起点节点的 id */
  source: string;
  /** 终点节点的 id */
  target: string;
  /** 流量：number、bigint 或 Decimal，要大于 0 */
  value: NumericValue;
}

/** 节点加上实际的颜色与名字 */
export interface ResolvedFlowNode extends FlowNode {
  /** 显示的名字：没写 label 时是 id */
  label: string;
  /** 实际的颜色：没写 color 时按顺序取的图表色板 */
  color: string;
}

/** 节点的颜色与名字定下来；按 id 查 */
export function resolveFlowNodes(nodes: readonly FlowNode[]): Map<string, ResolvedFlowNode> {
  return new Map(
    nodes.map((node, index) => [
      node.id,
      { ...node, label: node.label ?? node.id, color: resolveColor(node.color, index) },
    ]),
  );
}

/** 布局用的数据：节点按原来的顺序；值不是正数、指向不存在的节点的流向去掉，流量转成 number（amount） */
export function flowData(nodes: ReadonlyMap<string, ResolvedFlowNode>, links: readonly FlowLink[]) {
  return {
    nodes: [...nodes.values()],
    links: links
      .filter(
        (link) => nodes.has(link.source) && nodes.has(link.target) && toNumber(link.value) > 0,
      )
      .map((link) => ({ ...link, amount: toNumber(link.value) })),
  };
}
