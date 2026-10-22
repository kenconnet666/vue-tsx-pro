/**
 * 流程图的排布（不含界面）：泳道是行（按定义里的先后），节点按最长路径分列（从左往右），同一泳道同一列的几个节点上下排开；
 * 连线是直角折线：往右的从右边出、左边进，折在两列之间的空隙里；往回的（退回、再一轮）从起点上边出，
 * 走泳道上沿的空白通道，再从终点上边进，不穿过节点。节点写了 position 时用它（设计器里拖动过的）。
 *
 *   const layout = layoutProcess(definition);
 *   layout.nodes[0]  // { id, node, x, y, width, height, lane, column }
 *   layout.edges[0]  // { id, edge, points: [{ x, y }, …], label: { x, y }, back }
 */
import {
  processGraph,
  type ProcessDefinition,
  type ProcessEdge,
  type ProcessNode,
  type ProcessPoint,
} from './definition';

/** 排布的尺寸（px） */
export interface FlowLayoutOptions {
  /** 人工节点的宽，默认 132 */
  nodeWidth?: number;
  /** 人工节点的高，默认 48 */
  nodeHeight?: number;
  /** 两列之间的空隙，默认 56 */
  columnGap?: number;
  /** 同一格里上下两个节点的空隙，默认 16 */
  rowGap?: number;
  /** 泳道上下的内边距（往回的连线走上沿的这一条），默认 24 */
  lanePadding?: number;
  /** 左边泳道名称那一栏的宽，默认 96；没有泳道时为 0 */
  laneHeaderWidth?: number;
}

/** 排好的一个节点 */
export interface FlowLayoutNode {
  /** 节点标识 */
  id: string;
  /** 节点 */
  node: ProcessNode;
  /** 左上角的横坐标 */
  x: number;
  /** 左上角的纵坐标 */
  y: number;
  /** 宽 */
  width: number;
  /** 高 */
  height: number;
  /** 所在的泳道；没有泳道时为 null */
  lane: string | null;
  /** 第几列（从 0 起） */
  column: number;
}

/** 排好的一条泳道 */
export interface FlowLayoutLane {
  /** 泳道标识；不在任何泳道里的节点归到 null */
  id: string | null;
  /** 名称 */
  name: string;
  /** 上沿的纵坐标 */
  y: number;
  /** 高 */
  height: number;
}

/** 排好的一条连线 */
export interface FlowLayoutEdge {
  /** 连线标识 */
  id: string;
  /** 连线 */
  edge: ProcessEdge;
  /** 折线的各点：起点到终点 */
  points: ProcessPoint[];
  /** 文字放的位置（最长的一段的中点） */
  label: ProcessPoint;
  /** 往回走的（终点不在起点右边） */
  back: boolean;
}

/** 排布的结果 */
export interface FlowLayout {
  /** 整张图的宽 */
  width: number;
  /** 整张图的高 */
  height: number;
  /** 泳道，自上而下 */
  lanes: FlowLayoutLane[];
  /** 节点 */
  nodes: FlowLayoutNode[];
  /** 连线 */
  edges: FlowLayoutEdge[];
}

/** 节点的尺寸：人工节点是矩形，开始、结束是胶囊，网关是菱形 */
function sizeOf(node: ProcessNode, width: number, height: number) {
  switch (node.type) {
    case 'task':
      return { width, height };
    case 'start':
    case 'end':
      return { width: Math.round(width * 0.75), height: Math.round(height * 0.8) };
    case 'exclusive':
    case 'parallel':
      return { width: Math.round(height * 1.4), height };
  }
}

/** 往回走的边：深度优先时指向正在访问的节点（成环）的边 */
function backEdges(definition: ProcessDefinition): Set<string> {
  const graph = processGraph(definition);
  const back = new Set<string>();
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string) => {
    state.set(id, 'visiting');
    for (const edge of graph.outgoing(id)) {
      const next = state.get(edge.to);
      if (next === 'visiting') back.add(edge.id);
      else if (next === undefined) visit(edge.to);
    }
    state.set(id, 'done');
  };
  if (graph.start) visit(graph.start.id);
  for (const node of definition.nodes) if (!state.has(node.id)) visit(node.id);
  return back;
}

/** 列：去掉往回的边以后的最长路径 */
function columnsOf(definition: ProcessDefinition, back: Set<string>): Map<string, number> {
  const forward = definition.edges.filter((edge) => !back.has(edge.id));
  const indegree = new Map(definition.nodes.map((node) => [node.id, 0]));
  for (const edge of forward) indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  const column = new Map(definition.nodes.map((node) => [node.id, 0]));
  const queue = definition.nodes
    .filter((node) => indegree.get(node.id) === 0)
    .map((node) => node.id);
  while (queue.length) {
    const id = queue.shift()!;
    for (const edge of forward.filter((item) => item.from === id)) {
      column.set(edge.to, Math.max(column.get(edge.to) ?? 0, column.get(id)! + 1));
      indegree.set(edge.to, indegree.get(edge.to)! - 1);
      if (indegree.get(edge.to) === 0) queue.push(edge.to);
    }
  }
  return column;
}

/** 排布一个流程 */
export function layoutProcess(
  definition: ProcessDefinition,
  options: FlowLayoutOptions = {},
): FlowLayout {
  const {
    nodeWidth = 132,
    nodeHeight = 48,
    columnGap = 56,
    rowGap = 16,
    lanePadding = 24,
  } = options;
  const declared = definition.lanes ?? [];
  const laneHeaderWidth = declared.length ? (options.laneHeaderWidth ?? 96) : 0;
  const back = backEdges(definition);
  const columns = columnsOf(definition, back);

  // 泳道：定义里的先后。没写泳道的节点（多半是网关）跟着上游节点的泳道；
  // 一路往上都没有时归到末尾补的一条（没有泳道的流程整张图就是这一条）
  const graph = processGraph(definition);
  const known = new Set(declared.map((lane) => lane.id));
  const resolved = new Map<string, string | null>();
  const laneOf = (node: ProcessNode, seen = new Set<string>()): string | null => {
    if (resolved.has(node.id)) return resolved.get(node.id)!;
    let lane: string | null = node.lane && known.has(node.lane) ? node.lane : null;
    if (lane === null && !seen.has(node.id)) {
      seen.add(node.id);
      for (const edge of graph.incoming(node.id)) {
        const source = graph.node(edge.from);
        lane = source ? laneOf(source, seen) : null;
        if (lane !== null) break;
      }
    }
    resolved.set(node.id, lane);
    return lane;
  };
  const laneIds: (string | null)[] = declared.map((lane) => lane.id);
  if (definition.nodes.some((node) => laneOf(node) === null)) laneIds.push(null);

  // 每个泳道每一列里有哪几个节点（上下排开的先后）
  const cells = new Map<string, string[]>();
  const cellKey = (lane: string | null, column: number) => `${lane ?? ''}|${column}`;
  for (const node of definition.nodes) {
    const key = cellKey(laneOf(node), columns.get(node.id)!);
    cells.set(key, [...(cells.get(key) ?? []), node.id]);
  }
  const maxColumn = Math.max(0, ...columns.values());

  const lanes: FlowLayoutLane[] = [];
  let top = 0;
  for (const id of laneIds) {
    let stack = 1;
    for (let column = 0; column <= maxColumn; column++)
      stack = Math.max(stack, cells.get(cellKey(id, column))?.length ?? 0);
    const height = lanePadding * 2 + stack * nodeHeight + (stack - 1) * rowGap;
    lanes.push({ id, name: declared.find((lane) => lane.id === id)?.name ?? '', y: top, height });
    top += height;
  }

  const nodes: FlowLayoutNode[] = definition.nodes.map((node) => {
    const lane = laneOf(node);
    const column = columns.get(node.id)!;
    const index = cells.get(cellKey(lane, column))!.indexOf(node.id);
    const size = sizeOf(node, nodeWidth, nodeHeight);
    const band = lanes.find((item) => item.id === lane)!;
    const x =
      node.position?.x ??
      laneHeaderWidth +
        columnGap / 2 +
        column * (nodeWidth + columnGap) +
        (nodeWidth - size.width) / 2;
    const y =
      node.position?.y ??
      band.y + lanePadding + index * (nodeHeight + rowGap) + (nodeHeight - size.height) / 2;
    return { id: node.id, node, x, y, ...size, lane, column };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));

  let backCount = 0;
  const edges: FlowLayoutEdge[] = definition.edges.flatMap((edge) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) return [];
    const isBack = back.has(edge.id) || to.x <= from.x;
    let points: ProcessPoint[];
    if (!isBack) {
      const start = { x: from.x + from.width, y: from.y + from.height / 2 };
      const end = { x: to.x, y: to.y + to.height / 2 };
      const bend = Math.min(start.x + columnGap / 2, end.x - 8);
      points =
        start.y === end.y
          ? [start, end]
          : [start, { x: bend, y: start.y }, { x: bend, y: end.y }, end];
    } else {
      // 走两条泳道里靠上那条的上沿；几条往回的线错开一点，不重叠
      const upper = lanes.find((lane) => lane.id === (from.y <= to.y ? from.lane : to.lane))!;
      const channel = upper.y + 6 + (backCount++ % 3) * 5;
      const start = { x: from.x + from.width / 2, y: from.y };
      const end = { x: to.x + to.width / 2, y: to.y };
      points = [start, { x: start.x, y: channel }, { x: end.x, y: channel }, end];
    }
    return [{ id: edge.id, edge, points, label: labelPoint(points), back: isBack }];
  });

  const width = Math.max(
    laneHeaderWidth + (maxColumn + 1) * (nodeWidth + columnGap),
    ...nodes.map((node) => node.x + node.width + columnGap / 2),
  );
  return { width, height: top, lanes, nodes, edges };
}

/** 折线最长的一段的中点 */
function labelPoint(points: readonly ProcessPoint[]): ProcessPoint {
  let best = { x: points[0]!.x, y: points[0]!.y };
  let longest = -1;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1]!;
    const b = points[index]!;
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (length > longest) {
      longest = length;
      best = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  }
  return best;
}
