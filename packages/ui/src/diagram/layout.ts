/**
 * 分层自动排版：从根节点沿连线走，按最长步数从左往右分列，同一列从上往下排，每列在最高的那列里垂直居中。
 * 绕回去的线（环）不算步数，否则会越排越远；不该影响排版的线（流程图的退回、提级）由调用方先去掉。
 * 已经有位置的节点用它自己的 x、y（只给了一个时另一个照排），照样占一个格子。流程图、审批链、简单的依赖图都够用。
 *
 *   const placed = layoutLayers(
 *     nodes.map((n) => ({ id: n.id, width: 140, height: 52 })),
 *     edges.filter((e) => e.kind !== 'return'),
 *     { roots: ['start'] },
 *   );
 */

/** 要排的一个节点：大小，已有的位置 */
export interface LayerNode {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly x?: number | null;
  readonly y?: number | null;
}

/** 一条连线：从哪到哪 */
export interface LayerEdge {
  readonly from: string;
  readonly to: string;
}

/** 排好的一个节点（画布坐标） */
export interface PlacedLayerNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** layoutLayers 的选项 */
export interface LayerOptions {
  /** 从这些节点开始走（流程的开始节点）；没走到的节点之后各自起头 */
  roots?: readonly string[];
  /** 列距（相邻两列左边的距离），默认 190 */
  columnGap?: number;
  /** 行距（相邻两行上边的距离），默认 96 */
  rowGap?: number;
  /** 画布边距，默认 32 */
  margin?: number;
}

/** 排好每个节点的位置，按传入的先后返回 */
export function layoutLayers(
  nodes: readonly LayerNode[],
  edges: readonly LayerEdge[],
  { roots = [], columnGap = 190, rowGap = 96, margin = 32 }: LayerOptions = {},
): PlacedLayerNode[] {
  const ids = nodes.map((n) => n.id);
  const forward = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const edge of edges) forward.get(edge.from)?.push(edge.to);

  // 深度优先找出绕回去的线（指向还在路上的节点），去掉它们之后是无环的
  const back = new Set<string>();
  const state = new Map<string, 'visiting' | 'done'>();
  const order: string[] = [];
  const visit = (id: string) => {
    state.set(id, 'visiting');
    for (const next of forward.get(id) ?? []) {
      if (state.get(next) === 'visiting') back.add(`${id}>${next}`);
      else if (!state.has(next)) visit(next);
    }
    state.set(id, 'done');
    order.unshift(id);
  };
  for (const id of [...roots, ...ids]) if (forward.has(id) && !state.has(id)) visit(id);

  // 按拓扑序算最长步数：列号
  const column = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const id of order) {
    for (const next of forward.get(id) ?? []) {
      if (back.has(`${id}>${next}`)) continue;
      column.set(next, Math.max(column.get(next) ?? 0, (column.get(id) ?? 0) + 1));
    }
  }

  // 每个格子按最大的节点算，节点在格子里居中
  const cellWidth = Math.max(0, ...nodes.map((n) => n.width));
  const cellHeight = Math.max(0, ...nodes.map((n) => n.height));
  const rows = new Map<number, string[]>();
  for (const id of order) {
    const c = column.get(id) ?? 0;
    rows.set(c, [...(rows.get(c) ?? []), id]);
  }
  const tallest = Math.max(1, ...[...rows.values()].map((r) => r.length));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const placed = new Map<string, PlacedLayerNode>();
  for (const [c, members] of rows) {
    members.forEach((id, i) => {
      const node = byId.get(id)!;
      const x = node.x ?? margin + c * columnGap + (cellWidth - node.width) / 2;
      const y = node.y ?? margin + (i + (tallest - members.length) / 2) * rowGap + (cellHeight - node.height) / 2;
      placed.set(id, { id, x, y, width: node.width, height: node.height });
    });
  }
  return nodes.map((n) => placed.get(n.id)!);
}
