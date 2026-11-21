/**
 * 节点上有名字的端口（节点图：材质、着色器、数据流、低代码的逻辑编排）：端口在节点的哪条边、哪个位置，连线接在端口上，
 * 贝塞尔曲线从端口沿边的朝向伸出去。Diagram 的 ports、fromPort / toPort、routing="bezier" 用这里的几何。
 */
import type { DiagramPoint, DiagramRect } from './geometry';
import type { DiagramSide } from './route';

/** 节点上的一个端口 */
export interface DiagramPortItem {
  /** 端口的标识（同一个节点里不重复）：连线的 fromPort、toPort 写它 */
  id: string;
  /** 输入还是输出：只能从输出连到输入 */
  direction: 'in' | 'out';
  /** 在节点的哪条边；默认输入在 left、输出在 right */
  side?: DiagramSide;
  /** 沿那条边的位置（0 到 1，从上往下、从左往右）；不写时同一条边上的端口均匀排开 */
  at?: number;
  /** 名称：读屏、悬停提示 */
  label?: string;
  /** 颜色（CSS 颜色）：端口的点；按数据类型区分端口时用 */
  color?: string;
}

/** 有端口的节点（Diagram 的节点数据可以带 ports） */
export interface DiagramPortedNode extends DiagramRect {
  /** 节点上的端口；没有时连线接到节点的边上 */
  ports?: readonly DiagramPortItem[];
}

/** 端口在哪条边 */
export const portSide = (port: DiagramPortItem): DiagramSide =>
  port.side ?? (port.direction === 'in' ? 'left' : 'right');

/** 端口沿它那条边的位置（0 到 1）：给了 at 用它，没给时同一条边上没给 at 的端口均匀排开 */
export function portFraction(node: DiagramPortedNode, port: DiagramPortItem): number {
  if (port.at !== undefined) return port.at;
  const side = portSide(port);
  const same = (node.ports ?? []).filter((p) => p.at === undefined && portSide(p) === side);
  return (same.indexOf(port) + 1) / (same.length + 1);
}

/** 端口的位置（画布坐标） */
export function portPoint(node: DiagramPortedNode, port: DiagramPortItem): DiagramPoint {
  const f = portFraction(node, port);
  switch (portSide(port)) {
    case 'left':
      return { x: node.x, y: node.y + node.height * f };
    case 'right':
      return { x: node.x + node.width, y: node.y + node.height * f };
    case 'top':
      return { x: node.x + node.width * f, y: node.y };
    case 'bottom':
      return { x: node.x + node.width * f, y: node.y + node.height };
  }
}

const NORMALS: Readonly<Record<DiagramSide, DiagramPoint>> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};

/**
 * 两个端口之间的三次贝塞尔曲线：[起点, 控制点 1, 控制点 2, 终点]。控制点沿各自的边朝外伸出两端距离的一半（至少 40）：
 * 输出在右、输入在左时是常见的 S 形；终点在起点左边时绕出去的弯也是圆的。
 */
export function bezierRoute(
  from: DiagramPoint,
  fromSide: DiagramSide,
  to: DiagramPoint,
  toSide: DiagramSide,
): DiagramPoint[] {
  const reach = Math.max(40, Math.hypot(to.x - from.x, to.y - from.y) / 2);
  const a = NORMALS[fromSide],
    b = NORMALS[toSide];
  return [
    from,
    { x: from.x + a.x * reach, y: from.y + a.y * reach },
    { x: to.x + b.x * reach, y: to.y + b.y * reach },
    to,
  ];
}

/** 贝塞尔曲线的 SVG 路径（四个点：起点、两个控制点、终点） */
export function bezierPath(points: readonly DiagramPoint[]): string {
  const [p0, p1, p2, p3] = points as [DiagramPoint, DiagramPoint, DiagramPoint, DiagramPoint];
  return `M${p0.x},${p0.y}C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
}

/** 贝塞尔曲线走到一半的点（连线文字放这） */
export function bezierMidpoint(points: readonly DiagramPoint[]): DiagramPoint {
  const [p0, p1, p2, p3] = points as [DiagramPoint, DiagramPoint, DiagramPoint, DiagramPoint];
  return { x: (p0.x + 3 * p1.x + 3 * p2.x + p3.x) / 8, y: (p0.y + 3 * p1.y + 3 * p2.y + p3.y) / 8 };
}
