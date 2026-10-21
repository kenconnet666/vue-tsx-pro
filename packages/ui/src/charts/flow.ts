/**
 * 流向图（桑基图、弦图）共用的数据：节点与节点之间的流向。节点的颜色按顺序取图表色板，
 * 交给 Unovis 前复制一份（它会往节点上写布局用的字段），值不是正数的流向去掉（d3-sankey 要求为正）。
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
  label: string;
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

/** 交给 Unovis 的数据：节点与流向都复制一份；值不是正数、指向不存在的节点的流向去掉 */
export function flowData(nodes: ReadonlyMap<string, ResolvedFlowNode>, links: readonly FlowLink[]) {
  return {
    nodes: [...nodes.values()].map((node) => ({ ...node })),
    links: links
      .filter(
        (link) => nodes.has(link.source) && nodes.has(link.target) && toNumber(link.value) > 0,
      )
      .map((link) => ({ ...link, amount: toNumber(link.value) })),
  };
}
