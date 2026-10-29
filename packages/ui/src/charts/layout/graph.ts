/**
 * 网络图的布局：给每个节点算出坐标（单位是 px，原点任意，画的时候再整体居中、按绘图区缩放）。
 *
 * - force：力导向（d3-force 的做法：连线像弹簧、节点互相排斥、往中心拉、不重叠），从固定的初始位置迭代 300 步，结果是确定的；
 * - layered：分层（Sugiyama 的简化版：去环、按最长路径分层、重心法几轮减少交叉、向邻居的平均位置靠拢），direction 定方向；
 * - circular：排成一圈；concentric：连得多的在中间，一圈圈往外；parallel：按组分列，列里按连接排。
 * 有组时 layered、circular、parallel 让同组的节点挨在一起（组的先后按 groups）。
 *
 *   const positions = graphLayout(nodes, links, { layout: 'layered', direction: 'LR', groups: ['a', 'b'] });
 *   positions.get('n1')   // { x, y }
 */

/** 布局 */
export type GraphLayoutName = 'force' | 'layered' | 'circular' | 'concentric' | 'parallel';

/** 布局的输入：一个节点与它占的地方（节点加名字的外框） */
export interface GraphLayoutInput {
  /** id */
  id: string;
  /** 所在的组 */
  group?: string;
  /** 占的宽 */
  width: number;
  /** 占的高 */
  height: number;
}

/** graphLayout 的选项 */
export interface GraphLayoutOptions {
  /** 布局 */
  layout: GraphLayoutName;
  /** 分层、分列的方向：LR 从左到右，TB 从上到下 */
  direction?: 'LR' | 'TB';
  /** 组的先后 */
  groups?: readonly string[];
  /** 力导向的连线长度，默认 90 */
  linkDistance?: number;
  /** 力导向的排斥强度（负数），默认 -600 */
  charge?: number;
}

/** 一个点 */
interface Position {
  x: number;
  y: number;
}

type Links = readonly { source: string; target: string }[];

/** 节点的邻居：按 id 查 */
function neighbors(nodes: readonly GraphLayoutInput[], links: Links): Map<string, string[]> {
  const map = new Map(nodes.map((node) => [node.id, [] as string[]]));
  for (const link of links) {
    if (link.source === link.target) continue;
    map.get(link.source)?.push(link.target);
    map.get(link.target)?.push(link.source);
  }
  return map;
}

/** 按组排先后：组在 groups 里的位置，没有组的排最后；同组按原来的顺序 */
function groupRank(groups: readonly string[] | undefined) {
  return (node: GraphLayoutInput) => {
    const index = node.group === undefined ? -1 : (groups ?? []).indexOf(node.group);
    return index < 0 ? (groups?.length ?? 0) : index;
  };
}

/** 力导向（见文件开头） */
function force(
  nodes: readonly GraphLayoutInput[],
  links: Links,
  distance: number,
  charge: number,
): Map<string, Position> {
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  // 初始位置：向日葵式的螺旋（同 d3-force），节点均匀铺开，结果每次相同
  const points = nodes.map((_, i) => {
    const radius = 10 * Math.sqrt(0.5 + i);
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), vx: 0, vy: 0 };
  });
  const edges = links.flatMap((link) => {
    const s = index.get(link.source);
    const t = index.get(link.target);
    return s === undefined || t === undefined || s === t ? [] : [[s, t] as const];
  });
  const count = points.map(() => 0);
  for (const [s, t] of edges) {
    count[s]! += 1;
    count[t]! += 1;
  }
  const radii = nodes.map((node) => Math.hypot(node.width, node.height) / 2);
  // 两点重合时给一点确定的偏移，免得除以 0
  const jiggle = (i: number) => (i + 1) * 1e-6;
  const decay = 1 - 0.001 ** (1 / 300);
  let alpha = 1;
  for (let tick = 0; tick < 300; tick += 1) {
    alpha += (0 - alpha) * decay;
    for (const [s, t] of edges) {
      const a = points[s]!;
      const b = points[t]!;
      let dx = b.x + b.vx - a.x - a.vx || jiggle(s);
      let dy = b.y + b.vy - a.y - a.vy || jiggle(t);
      const length = Math.hypot(dx, dy);
      const strength = 1 / Math.min(count[s]!, count[t]!);
      const k = ((length - distance) / length) * alpha * strength;
      const bias = count[s]! / (count[s]! + count[t]!);
      dx *= k;
      dy *= k;
      b.vx -= dx * bias;
      b.vy -= dy * bias;
      a.vx += dx * (1 - bias);
      a.vy += dy * (1 - bias);
    }
    for (let i = 0; i < points.length; i += 1)
      for (let j = 0; j < points.length; j += 1) {
        if (i === j) continue;
        const dx = points[j]!.x - points[i]!.x || jiggle(i);
        const dy = points[j]!.y - points[i]!.y || jiggle(j);
        const squared = Math.max(dx * dx + dy * dy, 1);
        const w = (charge * alpha) / squared;
        points[i]!.vx += dx * w;
        points[i]!.vy += dy * w;
      }
    for (const point of points) {
      point.vx *= 0.6;
      point.vy *= 0.6;
      point.x += point.vx;
      point.y += point.vy;
    }
    // 不重叠：两两推开到外框的半径之和
    for (let i = 0; i < points.length; i += 1)
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i]!;
        const b = points[j]!;
        const dx = b.x - a.x || jiggle(i);
        const dy = b.y - a.y || jiggle(j);
        const length = Math.hypot(dx, dy);
        const room = (radii[i]! + radii[j]!) * 0.6;
        if (length >= room) continue;
        const push = ((room - length) / length) * 0.5;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
  }
  return new Map(nodes.map((node, i) => [node.id, { x: points[i]!.x, y: points[i]!.y }]));
}

/**
 * 分层：每层里节点按 order 的顺序排，层与层之间 rankGap、层内按各自的外框留空；
 * 几轮向邻居的平均位置靠拢（保持顺序、不重叠），连线更直
 */
function placeLayers(
  layers: readonly GraphLayoutInput[][],
  around: Map<string, string[]>,
  vertical: boolean,
  rankGap: number,
): Map<string, Position> {
  const breadth = (node: GraphLayoutInput) => (vertical ? node.width : node.height) + 16;
  const along = new Map<string, number>();
  // 每层先居中排开
  for (const layer of layers) {
    const total = layer.reduce((sum, node) => sum + breadth(node), 0);
    let position = -total / 2;
    for (const node of layer) {
      along.set(node.id, position + breadth(node) / 2);
      position += breadth(node);
    }
  }
  /** 一层节点挪到邻居的平均位置，再从中间往两头推开、不重叠 */
  const relax = (layer: readonly GraphLayoutInput[]) => {
    const wanted = layer.map((node) => {
      const others = (around.get(node.id) ?? []).filter((id) => along.has(id));
      return others.length
        ? others.reduce((sum, id) => sum + along.get(id)!, 0) / others.length
        : along.get(node.id)!;
    });
    layer.forEach((node, i) => along.set(node.id, wanted[i]!));
    const middle = layer.length >> 1;
    for (let i = middle + 1; i < layer.length; i += 1) {
      const min = along.get(layer[i - 1]!.id)! + (breadth(layer[i - 1]!) + breadth(layer[i]!)) / 2;
      along.set(layer[i]!.id, Math.max(along.get(layer[i]!.id)!, min));
    }
    for (let i = middle - 1; i >= 0; i -= 1) {
      const max = along.get(layer[i + 1]!.id)! - (breadth(layer[i + 1]!) + breadth(layer[i]!)) / 2;
      along.set(layer[i]!.id, Math.min(along.get(layer[i]!.id)!, max));
    }
  };
  for (let round = 0; round < 4; round += 1) {
    for (const layer of layers.slice(1)) relax(layer);
    for (const layer of layers.slice(0, -1).reverse()) relax(layer);
  }
  const positions = new Map<string, Position>();
  layers.forEach((layer, rank) => {
    for (const node of layer) {
      const across = rank * rankGap;
      const value = along.get(node.id)!;
      positions.set(node.id, vertical ? { x: value, y: across } : { x: across, y: value });
    }
  });
  return positions;
}

/** 重心法排每层的顺序：几轮上下来回，按相邻层里邻居的平均位置排；有组时组优先 */
function orderLayers(
  layers: GraphLayoutInput[][],
  around: Map<string, string[]>,
  rankOf: (node: GraphLayoutInput) => number,
) {
  const position = new Map<string, number>();
  const record = () =>
    layers.forEach((layer) => layer.forEach((node, i) => position.set(node.id, i)));
  record();
  const sweep = (layer: GraphLayoutInput[], neighborLayer: GraphLayoutInput[]) => {
    const inNeighbor = new Set(neighborLayer.map((node) => node.id));
    const center = (node: GraphLayoutInput) => {
      const others = (around.get(node.id) ?? []).filter((id) => inNeighbor.has(id));
      return others.length
        ? others.reduce((sum, id) => sum + position.get(id)!, 0) / others.length
        : position.get(node.id)!;
    };
    const keys = new Map(layer.map((node) => [node.id, center(node)]));
    layer.sort((a, b) => rankOf(a) - rankOf(b) || keys.get(a.id)! - keys.get(b.id)!);
    layer.forEach((node, i) => position.set(node.id, i));
  };
  for (let round = 0; round < 6; round += 1) {
    for (let i = 1; i < layers.length; i += 1) sweep(layers[i]!, layers[i - 1]!);
    for (let i = layers.length - 2; i >= 0; i -= 1) sweep(layers[i]!, layers[i + 1]!);
  }
}

/** 分层：去环后按最长路径分层（见文件开头） */
function layered(
  nodes: readonly GraphLayoutInput[],
  links: Links,
  vertical: boolean,
  groups: readonly string[] | undefined,
): Map<string, Position> {
  const ids = new Set(nodes.map((node) => node.id));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));
  // 去环：深度优先，指回栈里节点的边不算（等于把它反过来）
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string) => {
    state.set(id, 'open');
    for (const link of links) {
      if (link.source !== id || !ids.has(link.target) || link.target === id) continue;
      const seen = state.get(link.target);
      if (seen === 'open') continue;
      outgoing.get(id)!.push(link.target);
      if (!seen) visit(link.target);
    }
    state.set(id, 'done');
  };
  for (const node of nodes) if (!state.has(node.id)) visit(node.id);
  // 最长路径：按拓扑序，节点的层 = 前驱的层 + 1 的最大值
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  for (const targets of outgoing.values())
    for (const target of new Set(targets)) indegree.set(target, indegree.get(target)! + 1);
  const rank = new Map(nodes.map((node) => [node.id, 0]));
  const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  while (queue.length) {
    const id = queue.shift()!;
    for (const target of new Set(outgoing.get(id))) {
      rank.set(target, Math.max(rank.get(target)!, rank.get(id)! + 1));
      indegree.set(target, indegree.get(target)! - 1);
      if (indegree.get(target) === 0) queue.push(target);
    }
  }
  const byRank = groupRank(groups);
  const layers: GraphLayoutInput[][] = [];
  for (const node of [...nodes].sort((a, b) => byRank(a) - byRank(b)))
    (layers[rank.get(node.id)!] ??= []).push(node);
  const filled = layers.filter(Boolean);
  const around = neighbors(nodes, links);
  orderLayers(filled, around, byRank);
  // 层间距：横向时要放得下名字（外框的宽），纵向时放得下节点加名字的高
  const extent = Math.max(...nodes.map((node) => (vertical ? node.height : node.width)));
  return placeLayers(filled, around, vertical, extent + (groups?.length ? 72 : 48));
}

/** 环形：按组、按原来的顺序排成一圈，圈的大小放得下所有外框 */
function circular(nodes: readonly GraphLayoutInput[], groups: readonly string[] | undefined) {
  const byRank = groupRank(groups);
  const sorted = [...nodes].sort((a, b) => byRank(a) - byRank(b));
  const perimeter = sorted.reduce((sum, node) => sum + Math.max(node.width, node.height) + 12, 0);
  const radius = Math.max(perimeter / (Math.PI * 2), 60);
  return new Map(
    sorted.map((node, i) => {
      const angle = (i / sorted.length) * Math.PI * 2 - Math.PI / 2;
      return [node.id, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }];
    }),
  );
}

/** 同心圆：连接数最多的在圆心，往外每圈放得下多少放多少 */
function concentric(nodes: readonly GraphLayoutInput[], links: Links) {
  const around = neighbors(nodes, links);
  const sorted = [...nodes].sort(
    (a, b) => (around.get(b.id)?.length ?? 0) - (around.get(a.id)?.length ?? 0),
  );
  const footprint = Math.max(...nodes.map((node) => Math.max(node.width, node.height))) + 12;
  const positions = new Map<string, Position>();
  let ring = 0;
  let placed = 0;
  while (placed < sorted.length) {
    const radius = ring * footprint;
    const capacity = ring === 0 ? 1 : Math.max(1, Math.floor((Math.PI * 2 * radius) / footprint));
    const members = sorted.slice(placed, placed + capacity);
    members.forEach((node, i) => {
      const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2;
      positions.set(node.id, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
    });
    placed += members.length;
    ring += 1;
  }
  return positions;
}

/** 分列：每组一列（没有组的单独一列），列里按重心法排 */
function parallel(
  nodes: readonly GraphLayoutInput[],
  links: Links,
  vertical: boolean,
  groups: readonly string[] | undefined,
) {
  const byRank = groupRank(groups);
  const columns: GraphLayoutInput[][] = [];
  for (const node of nodes) (columns[byRank(node)] ??= []).push(node);
  const filled = columns.filter(Boolean);
  const around = neighbors(nodes, links);
  orderLayers(filled, around, () => 0);
  const extent = Math.max(...nodes.map((node) => (vertical ? node.height : node.width)));
  return placeLayers(filled, around, vertical, extent + 96);
}

/** 网络图的布局（见文件开头） */
export function graphLayout(
  nodes: readonly GraphLayoutInput[],
  links: Links,
  { layout, direction = 'LR', groups, linkDistance = 90, charge = -600 }: GraphLayoutOptions,
): Map<string, Position> {
  if (nodes.length === 0) return new Map();
  const vertical = direction === 'TB';
  if (layout === 'layered') return layered(nodes, links, vertical, groups);
  if (layout === 'circular') return circular(nodes, groups);
  if (layout === 'concentric') return concentric(nodes, links);
  if (layout === 'parallel') return parallel(nodes, links, vertical, groups);
  return force(nodes, links, linkDistance, charge);
}
