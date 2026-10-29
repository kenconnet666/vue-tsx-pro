/**
 * 矩形树图的布局：扁平的明细按几个字段逐级分组成树，再按“squarified”算法切块，块的面积与数值成比例、尽量接近正方形
 * （Bruls、Huizing、van Wijk 的 squarify，写法同 d3-hierarchy 的 treemapSquarify，ISC）。
 *
 *   const root = groupTree(rows, [(row) => row.region, (row) => row.supplier], (row) => row.amount);
 *   treemapLayout(root, { width: 600, height: 300, padding: 3 });
 *   root.children[0].x0、y0、x1、y1；叶子的 data 是那一行明细
 */

/** 树上的一个节点：分组或一条明细（叶子）；布局后带上矩形 */
export interface TreemapNode<D> {
  /** 分组的值（区域名），叶子是最内层分组的值 */
  key: string;
  /** 数值：叶子是明细的值，分组是子节点之和 */
  value: number;
  /** 层级：根是 0 */
  depth: number;
  /** 叶子对应的明细 */
  data?: D;
  /** 父节点（根没有） */
  parent?: TreemapNode<D>;
  /** 子节点，按数值从大到小（叶子没有） */
  children?: TreemapNode<D>[];
  /** 左 */
  x0: number;
  /** 上 */
  y0: number;
  /** 右 */
  x1: number;
  /** 下 */
  y1: number;
}

/** treemapLayout 的选项 */
export interface TreemapLayoutOptions {
  /** 宽 */
  width: number;
  /** 高 */
  height: number;
  /** 块与块之间、分组四周留的空，默认 0 */
  padding?: number;
  /** 分组顶边多留的空（写分组名），默认同 padding */
  paddingTop?: number;
}

const blank = { x0: 0, y0: 0, x1: 0, y1: 0 };

/** 明细按 keys 逐级分组成树：同一组的明细挂在同一个分组下，数值不是正数的明细不要 */
export function groupTree<D>(
  rows: readonly D[],
  keys: readonly ((row: D) => string)[],
  value: (row: D) => number,
): TreemapNode<D> {
  const root: TreemapNode<D> = { key: '', value: 0, depth: 0, children: [], ...blank };
  for (const row of rows) {
    const amount = value(row);
    if (!(amount > 0)) continue;
    let node = root;
    keys.forEach((key, level) => {
      const name = key(row);
      const leaf = level === keys.length - 1;
      let child = leaf ? undefined : node.children!.find((item) => item.key === name);
      if (!child) {
        child = { key: name, value: 0, depth: level + 1, parent: node, ...blank };
        if (leaf) child.data = row;
        else child.children = [];
        node.children!.push(child);
      }
      child.value += leaf ? amount : 0;
      node = child;
    });
  }
  const sum = (node: TreemapNode<D>): number => {
    if (!node.children) return node.value;
    node.value = node.children.reduce((total, child) => total + sum(child), 0);
    node.children.sort((a, b) => b.value - a.value);
    return node.value;
  };
  sum(root);
  return root;
}

/** 黄金比：squarify 追求的长宽比 */
const PHI = (1 + Math.sqrt(5)) / 2;

/** 一行（或一列）子节点沿横向依次排开 */
function dice<D>(
  nodes: readonly TreemapNode<D>[],
  total: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const k = total ? (x1 - x0) / total : 0;
  let x = x0;
  for (const node of nodes) Object.assign(node, { x0: x, y0, x1: (x += node.value * k), y1 });
}

/** 沿纵向依次排开 */
function slice<D>(
  nodes: readonly TreemapNode<D>[],
  total: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const k = total ? (y1 - y0) / total : 0;
  let y = y0;
  for (const node of nodes) Object.assign(node, { x0, y0: y, x1, y1: (y += node.value * k) });
}

/** squarify：一行行地放，一行里不断加节点，直到再加会让最长的长宽比变差 */
function squarify<D>(parent: TreemapNode<D>, x0: number, y0: number, x1: number, y1: number) {
  const nodes = parent.children ?? [];
  let value = parent.value;
  let i0 = 0;
  while (i0 < nodes.length) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    let i1 = i0;
    let sumValue = 0;
    // 跳过数值为 0 的节点
    do sumValue = nodes[i1++]!.value;
    while (!sumValue && i1 < nodes.length);
    let minValue = sumValue;
    let maxValue = sumValue;
    const alpha = Math.max(dy / dx, dx / dy) / (value * PHI);
    let beta = sumValue * sumValue * alpha;
    let minRatio = Math.max(maxValue / beta, beta / minValue);
    for (; i1 < nodes.length; i1 += 1) {
      const nodeValue = nodes[i1]!.value;
      sumValue += nodeValue;
      minValue = Math.min(minValue, nodeValue);
      maxValue = Math.max(maxValue, nodeValue);
      beta = sumValue * sumValue * alpha;
      const ratio = Math.max(maxValue / beta, beta / minValue);
      if (ratio > minRatio) {
        sumValue -= nodeValue;
        break;
      }
      minRatio = ratio;
    }
    const row = nodes.slice(i0, i1);
    // 宽比高小：这一行横着排在顶上；否则竖着排在左边
    if (dx < dy) {
      const y = dy && value ? y0 + (dy * sumValue) / value : y1;
      dice(row, sumValue, x0, y0, x1, y);
      y0 = y;
    } else {
      const x = dx && value ? x0 + (dx * sumValue) / value : x1;
      slice(row, sumValue, x0, y0, x, y1);
      x0 = x;
    }
    value -= sumValue;
    i0 = i1;
  }
}

/** 给树上每个节点算出矩形（就地写入）：分组四周与块之间留 padding，分组顶边留 paddingTop */
export function treemapLayout<D>(
  root: TreemapNode<D>,
  { width, height, padding = 0, paddingTop = padding }: TreemapLayoutOptions,
): void {
  Object.assign(root, { x0: 0, y0: 0, x1: width, y1: height });
  const half = padding / 2;
  const position = (node: TreemapNode<D>) => {
    if (!node.children?.length) return;
    // 子节点先在外扩半个间距的区域里切块，各自再缩回半个间距：相邻两块之间正好一个 padding（同 d3 的 paddingInner）
    const top = node === root ? 0 : paddingTop;
    const inset = node === root ? 0 : padding;
    let x0 = node.x0 + inset - half;
    let y0 = node.y0 + top - half;
    let x1 = node.x1 - inset + half;
    let y1 = node.y1 - inset + half;
    if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
    if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
    squarify(node, x0, y0, x1, y1);
    for (const child of node.children) {
      child.x0 += half;
      child.y0 += half;
      child.x1 = Math.max(child.x0, child.x1 - half);
      child.y1 = Math.max(child.y0, child.y1 - half);
      position(child);
    }
  };
  position(root);
}
