/**
 * 流程图的自动布局：从左到右分列，每个节点放在“从开始走到它的最长前进路径”那一列（汇合排在所有分支之后），
 * 同一列里按定义的先后从上往下。退回、提级的连线不参与分列（画成回头的虚线）。
 * 定义里写了 layout 的节点用它的坐标。前端画流程图、设计器摆新节点都用它。
 *
 *   const { nodes, width, height } = autoLayout(definition);
 *   nodes.get('review'); // { x, y, column, row }
 */
import type { ProcessDefinition } from './definition.ts';

/** 一个节点的位置：中心点坐标，所在的列与行 */
export interface NodePosition {
  readonly x: number;
  readonly y: number;
  readonly column: number;
  readonly row: number;
}

/** 布局的结果 */
export interface Layout {
  readonly nodes: ReadonlyMap<string, NodePosition>;
  /** 全部节点占的范围（含边距） */
  readonly width: number;
  readonly height: number;
}

/** 列宽、行高与边距（像素） */
export interface LayoutOptions {
  readonly columnWidth?: number;
  readonly rowHeight?: number;
  readonly margin?: number;
}

/** 算出每个节点的位置 */
export function autoLayout(definition: ProcessDefinition, options: LayoutOptions = {}): Layout {
  const { columnWidth = 180, rowHeight = 96, margin = 72 } = options;
  const forward = definition.edges.filter(
    (edge) => edge.kind !== 'return' && edge.kind !== 'escalate',
  );
  const columns = new Map<string, number>();
  const start = definition.nodes.find((node) => node.type === 'start');
  if (start) columns.set(start.id, 0);
  // 最长路径：按前进的连线反复放宽；有环时（重新提交这类）最多放宽节点数那么多遍
  for (let pass = 0; pass < definition.nodes.length; pass++) {
    let changed = false;
    for (const edge of forward) {
      const from = columns.get(edge.from);
      if (from === undefined) continue;
      if ((columns.get(edge.to) ?? -1) < from + 1) {
        columns.set(edge.to, from + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  // 前进的连线走不到的（只被退回到的节点）：放在它前驱的后一列，再没有就放在最后
  const last = Math.max(0, ...columns.values());
  for (const node of definition.nodes) {
    if (columns.has(node.id)) continue;
    const before = definition.edges
      .filter((edge) => edge.to === node.id && columns.has(edge.from))
      .map((edge) => columns.get(edge.from)! + 1);
    columns.set(node.id, before.length > 0 ? Math.min(...before) : last + 1);
  }

  const rows = new Map<number, string[]>();
  for (const node of definition.nodes) {
    const column = columns.get(node.id)!;
    (rows.get(column) ?? rows.set(column, []).get(column)!).push(node.id);
  }
  const tallest = Math.max(1, ...[...rows.values()].map((ids) => ids.length));
  const nodes = new Map<string, NodePosition>();
  for (const [column, ids] of rows) {
    // 列里的节点竖着居中：少的列放在中间
    const offset = ((tallest - ids.length) * rowHeight) / 2;
    ids.forEach((id, row) => {
      const saved = definition.layout?.nodes?.[id];
      nodes.set(id, {
        x: saved?.x ?? margin + column * columnWidth,
        y: saved?.y ?? margin + offset + row * rowHeight,
        column,
        row,
      });
    });
  }
  const xs = [...nodes.values()].map((p) => p.x);
  const ys = [...nodes.values()].map((p) => p.y);
  return {
    nodes,
    width: (xs.length ? Math.max(...xs) : 0) + margin,
    height: (ys.length ? Math.max(...ys) : 0) + margin,
  };
}
