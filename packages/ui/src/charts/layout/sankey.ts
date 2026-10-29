/**
 * 桑基图的布局：节点按离起点的远近分列，列里的节点按流量定高，再几轮松弛让带子尽量平直、互不重叠
 * （d3-sankey 的算法，Mike Bostock，ISC；只留本库用到的部分）。
 *
 *   const { nodes, links } = sankeyLayout(['a', 'b', 'c'], [{ source: 'a', target: 'b', value: 3 }, …],
 *     { width: 600, height: 320, nodeWidth: 12, nodePadding: 16, align: 'justify' });
 *   nodes[0].x0、y0、x1、y1；links[0].y0（起点处带子中线）、y1（终点处）、width（粗细）
 *
 * 流向不能成环：有环时环上的节点停在发现环的那一列。
 */

/** 节点的排法：两端对齐、靠左、靠右、居中（同 d3-sankey 的 sankeyJustify 等） */
export type SankeyAlign = 'justify' | 'left' | 'right' | 'center';

/** 布局的输入：一条流向 */
export interface SankeyInputLink {
  /** 起点节点的 id */
  source: string;
  /** 终点节点的 id */
  target: string;
  /** 流量，大于 0 */
  value: number;
}

/** 布局后的节点 */
export interface SankeyLayoutNode {
  /** 节点的 id */
  id: string;
  /** 流量：流入、流出里较大的那个 */
  value: number;
  /** 所在的列，从 0 起 */
  layer: number;
  /** 左 */
  x0: number;
  /** 右 */
  x1: number;
  /** 上 */
  y0: number;
  /** 下 */
  y1: number;
  /** 从这个节点流出的 */
  sourceLinks: SankeyLayoutLink[];
  /** 流入这个节点的 */
  targetLinks: SankeyLayoutLink[];
}

/** 布局后的流向 */
export interface SankeyLayoutLink {
  /** 在输入里的位置 */
  index: number;
  /** 起点 */
  source: SankeyLayoutNode;
  /** 终点 */
  target: SankeyLayoutNode;
  /** 流量 */
  value: number;
  /** 带子的粗细 */
  width: number;
  /** 起点处带子中线的纵坐标 */
  y0: number;
  /** 终点处带子中线的纵坐标 */
  y1: number;
}

/** sankeyLayout 的选项 */
export interface SankeyLayoutOptions {
  /** 布局区域的宽 */
  width: number;
  /** 布局区域的高 */
  height: number;
  /** 节点的宽度 */
  nodeWidth: number;
  /** 同一列里节点的间距 */
  nodePadding: number;
  /** 节点的排法，默认 justify */
  align?: SankeyAlign;
  /** 松弛的轮数，默认 6 */
  iterations?: number;
}

type Node = SankeyLayoutNode & { depth: number; height: number };

/** 节点该排在第几列（共 columns 列） */
function columnOf(node: Node, columns: number, align: SankeyAlign): number {
  if (align === 'left') return node.depth;
  if (align === 'right') return columns - 1 - node.height;
  if (align === 'center') {
    if (node.targetLinks.length) return node.depth;
    return node.sourceLinks.length
      ? Math.min(...node.sourceLinks.map((link) => (link.target as Node).depth)) - 1
      : 0;
  }
  return node.sourceLinks.length ? node.depth : columns - 1;
}

/** 从起点（或终点）一层层往外数：depth 是离起点的步数，height 是离终点的步数 */
function assignDepths(nodes: readonly Node[], forward: boolean) {
  let current = new Set(nodes);
  for (let step = 0; current.size && step <= nodes.length; step += 1) {
    const next = new Set<Node>();
    for (const node of current) {
      if (forward) node.depth = step;
      else node.height = step;
      for (const link of forward ? node.sourceLinks : node.targetLinks)
        next.add((forward ? link.target : link.source) as Node);
    }
    current = next;
  }
}

const byBreadth = (a: SankeyLayoutNode, b: SankeyLayoutNode) => a.y0 - b.y0;
const bySourceBreadth = (a: SankeyLayoutLink, b: SankeyLayoutLink) =>
  byBreadth(a.source, b.source) || a.index - b.index;
const byTargetBreadth = (a: SankeyLayoutLink, b: SankeyLayoutLink) =>
  byBreadth(a.target, b.target) || a.index - b.index;

/** 桑基图的布局（见文件开头） */
export function sankeyLayout(
  ids: readonly string[],
  input: readonly SankeyInputLink[],
  { width, height, nodeWidth, nodePadding, align = 'justify', iterations = 6 }: SankeyLayoutOptions,
): { nodes: SankeyLayoutNode[]; links: SankeyLayoutLink[] } {
  const nodes: Node[] = ids.map((id) => ({
    id,
    value: 0,
    layer: 0,
    depth: 0,
    height: 0,
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
    sourceLinks: [],
    targetLinks: [],
  }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links: SankeyLayoutLink[] = input.flatMap((link, index) => {
    const source = byId.get(link.source);
    const target = byId.get(link.target);
    if (!source || !target || !(link.value > 0)) return [];
    const laid = { index, source, target, value: link.value, width: 0, y0: 0, y1: 0 };
    source.sourceLinks.push(laid);
    target.targetLinks.push(laid);
    return [laid];
  });
  const total = (list: readonly SankeyLayoutLink[]) =>
    list.reduce((sum, link) => sum + link.value, 0);
  for (const node of nodes) node.value = Math.max(total(node.sourceLinks), total(node.targetLinks));
  assignDepths(nodes, true);
  assignDepths(nodes, false);

  // 分列：横坐标按列均分
  const columnCount = Math.max(0, ...nodes.map((node) => node.depth)) + 1;
  const kx = columnCount > 1 ? (width - nodeWidth) / (columnCount - 1) : 0;
  const columns: Node[][] = Array.from({ length: columnCount }, () => []);
  for (const node of nodes) {
    const layer = Math.max(
      0,
      Math.min(columnCount - 1, Math.floor(columnOf(node, columnCount, align))),
    );
    node.layer = layer;
    node.x0 = layer * kx;
    node.x1 = node.x0 + nodeWidth;
    columns[layer]!.push(node);
  }

  const longest = Math.max(1, ...columns.map((column) => column.length));
  const py = longest > 1 ? Math.min(nodePadding, height / (longest - 1)) : nodePadding;

  const reorderLinks = (node: SankeyLayoutNode) => {
    node.sourceLinks.sort(byTargetBreadth);
    node.targetLinks.sort(bySourceBreadth);
  };
  // 节点挪动之后，与它相连的节点上的带子顺序跟着变
  const reorderNodeLinks = (node: SankeyLayoutNode) => {
    for (const link of node.targetLinks) link.source.sourceLinks.sort(byTargetBreadth);
    for (const link of node.sourceLinks) link.target.targetLinks.sort(bySourceBreadth);
  };

  // 初始：按流量定高（各列取能放下的最小比例），列里从上往下排，余下的空均分到间隔里
  const ky = Math.min(
    ...columns
      .filter((column) => column.length)
      .map(
        (column) =>
          (height - (column.length - 1) * py) /
          (column.reduce((sum, node) => sum + node.value, 0) || 1),
      ),
  );
  for (const column of columns) {
    let y = 0;
    for (const node of column) {
      node.y0 = y;
      node.y1 = y + node.value * ky;
      y = node.y1 + py;
      for (const link of node.sourceLinks) link.width = link.value * ky;
    }
    const spread = (height - y + py) / (column.length + 1);
    column.forEach((node, i) => {
      node.y0 += spread * (i + 1);
      node.y1 += spread * (i + 1);
    });
    column.forEach(reorderLinks);
  }

  /** 让 source → target 的带子平直时 target 的 y0（同 d3-sankey 的 targetTop） */
  const targetTop = (source: SankeyLayoutNode, target: SankeyLayoutNode) => {
    let y = source.y0 - ((source.sourceLinks.length - 1) * py) / 2;
    for (const link of source.sourceLinks) {
      if (link.target === target) break;
      y += link.width + py;
    }
    for (const link of target.targetLinks) {
      if (link.source === source) break;
      y -= link.width;
    }
    return y;
  };
  /** 让 source → target 的带子平直时 source 的 y0 */
  const sourceTop = (source: SankeyLayoutNode, target: SankeyLayoutNode) => {
    let y = target.y0 - ((target.targetLinks.length - 1) * py) / 2;
    for (const link of target.targetLinks) {
      if (link.source === source) break;
      y += link.width + py;
    }
    for (const link of source.sourceLinks) {
      if (link.target === target) break;
      y -= link.width;
    }
    return y;
  };

  const shift = (node: SankeyLayoutNode, dy: number) => {
    node.y0 += dy;
    node.y1 += dy;
  };
  /** 列里的节点互不重叠、不出上下边：从中间的节点往两头推，再从两头往回推 */
  const resolveCollisions = (column: SankeyLayoutNode[], alpha: number) => {
    const pushDown = (from: number, start: number) => {
      let y = start;
      for (let i = from; i < column.length; i += 1) {
        const dy = (y - column[i]!.y0) * alpha;
        if (dy > 1e-6) shift(column[i]!, dy);
        y = column[i]!.y1 + py;
      }
    };
    const pushUp = (from: number, start: number) => {
      let y = start;
      for (let i = from; i >= 0; i -= 1) {
        const dy = (column[i]!.y1 - y) * alpha;
        if (dy > 1e-6) shift(column[i]!, -dy);
        y = column[i]!.y0 - py;
      }
    };
    const middle = column.length >> 1;
    const subject = column[middle];
    if (!subject) return;
    pushUp(middle - 1, subject.y0 - py);
    pushDown(middle + 1, subject.y1 + py);
    pushUp(column.length - 1, height);
    pushDown(0, 0);
  };

  /** 一列节点朝着与它相连的另一侧节点挪（按流量加权），再消除重叠 */
  const relax = (column: Node[], alpha: number, beta: number, fromLeft: boolean) => {
    for (const node of column) {
      let y = 0;
      let weight = 0;
      for (const link of fromLeft ? node.targetLinks : node.sourceLinks) {
        const v = link.value * (link.target.layer - link.source.layer);
        y += (fromLeft ? targetTop(link.source, node) : sourceTop(node, link.target)) * v;
        weight += v;
      }
      if (!(weight > 0)) continue;
      shift(node, (y / weight - node.y0) * alpha);
      reorderNodeLinks(node);
    }
    column.sort(byBreadth);
    resolveCollisions(column, beta);
  };
  for (let i = 0; i < iterations; i += 1) {
    const alpha = 0.99 ** i;
    const beta = Math.max(1 - alpha, (i + 1) / iterations);
    for (let c = columns.length - 2; c >= 0; c -= 1) relax(columns[c]!, alpha, beta, false);
    for (let c = 1; c < columns.length; c += 1) relax(columns[c]!, alpha, beta, true);
  }

  // 带子在两端节点上的位置：按另一端的上下顺序依次排开
  for (const node of nodes) {
    let y0 = node.y0;
    let y1 = node.y0;
    for (const link of node.sourceLinks) {
      link.y0 = y0 + link.width / 2;
      y0 += link.width;
    }
    for (const link of node.targetLinks) {
      link.y1 = y1 + link.width / 2;
      y1 += link.width;
    }
  }
  return { nodes, links };
}
