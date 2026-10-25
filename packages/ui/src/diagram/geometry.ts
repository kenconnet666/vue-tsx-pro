/**
 * 画布的几何（纯函数）：点与矩形、边界、相交与包含、折线的路径与中点、箭头。坐标都是画布坐标（缩放前的 px）。
 */

/** 画布上的一点 */
export interface DiagramPoint {
  /** 横坐标 */
  x: number;
  /** 纵坐标 */
  y: number;
}

/** 画布上的矩形：左上角与大小 */
export interface DiagramRect {
  /** 左边的横坐标 */
  x: number;
  /** 上边的纵坐标 */
  y: number;
  /** 宽 */
  width: number;
  /** 高 */
  height: number;
}

/** 包住全部矩形与点的最小矩形；什么都没有时 undefined */
export function boundsOf(
  rects: Iterable<DiagramRect>,
  points: Iterable<DiagramPoint> = [],
): DiagramRect | undefined {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const rect of rects) {
    left = Math.min(left, rect.x);
    top = Math.min(top, rect.y);
    right = Math.max(right, rect.x + rect.width);
    bottom = Math.max(bottom, rect.y + rect.height);
  }
  for (const point of points) {
    left = Math.min(left, point.x);
    top = Math.min(top, point.y);
    right = Math.max(right, point.x);
    bottom = Math.max(bottom, point.y);
  }
  return left === Infinity
    ? undefined
    : { x: left, y: top, width: right - left, height: bottom - top };
}

/** 两个角点围成的矩形（框选时按下点与当前点的先后不定） */
export function rectFromCorners(a: DiagramPoint, b: DiagramPoint): DiagramRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/** 两个矩形有重叠（只碰到边不算） */
export function rectsIntersect(a: DiagramRect, b: DiagramRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** outer 整个包住 inner（边重合也算） */
export function rectContains(outer: DiagramRect, inner: DiagramRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/** 矩形的中心 */
export function rectCenter(rect: DiagramRect): DiagramPoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** 从矩形中心朝 toward 方向的射线与矩形边框的交点：两个节点之间没有路由时，直线的两端落在边框上 */
export function borderPoint(rect: DiagramRect, toward: DiagramPoint): DiagramPoint {
  const center = rectCenter(rect);
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return center;
  // 射线先碰到竖边还是横边：比较两个方向上到边的比例
  const scale = Math.min(
    dx === 0 ? Infinity : rect.width / 2 / Math.abs(dx),
    dy === 0 ? Infinity : rect.height / 2 / Math.abs(dy),
  );
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

/** 两点之间的距离 */
const distance = (a: DiagramPoint, b: DiagramPoint) => Math.hypot(b.x - a.x, b.y - a.y);

/**
 * 折线的 SVG 路径（`M … L …`）；radius 大于 0 时拐角改成圆角（正交路由的线更柔和），
 * 圆角不超过相邻两段各自长度的一半，短段不会画反
 */
export function polylinePath(points: readonly DiagramPoint[], radius = 0): string {
  if (points.length === 0) return '';
  const [first] = points as [DiagramPoint];
  let path = `M${first.x} ${first.y}`;
  for (let index = 1; index < points.length; index++) {
    const point = points[index]!;
    const next = points[index + 1];
    if (!next || radius <= 0) {
      path += ` L${point.x} ${point.y}`;
      continue;
    }
    const previous = points[index - 1]!;
    const r = Math.min(radius, distance(previous, point) / 2, distance(point, next) / 2);
    const before = towards(point, previous, r);
    const after = towards(point, next, r);
    path += ` L${before.x} ${before.y} Q${point.x} ${point.y} ${after.x} ${after.y}`;
  }
  return path;
}

/** 从 from 朝 to 走 length 的点 */
function towards(from: DiagramPoint, to: DiagramPoint, length: number): DiagramPoint {
  const total = distance(from, to);
  if (total === 0) return from;
  return {
    x: from.x + ((to.x - from.x) * length) / total,
    y: from.y + ((to.y - from.y) * length) / total,
  };
}

/** 折线上走到一半长度的点：连线文字默认放在这里 */
export function polylineMidpoint(points: readonly DiagramPoint[]): DiagramPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  let remaining =
    points.slice(1).reduce((sum, point, index) => sum + distance(points[index]!, point), 0) / 2;
  for (let index = 1; index < points.length; index++) {
    const segment = distance(points[index - 1]!, points[index]!);
    if (remaining <= segment) return towards(points[index - 1]!, points[index]!, remaining);
    remaining -= segment;
  }
  return points[points.length - 1]!;
}

/**
 * 折线终点的箭头：三角形的三个顶点（SVG polygon 的 points），尖端在终点，沿最后一段的方向；
 * 没有方向（少于两个不同的点）时返回空串
 */
export function arrowHead(points: readonly DiagramPoint[], size = 8): string {
  const tip = points[points.length - 1];
  // 最后一段可能长度为零（端点重复）：往前找一个不同的点定方向
  const from = [...points]
    .reverse()
    .find((point) => tip && (point.x !== tip.x || point.y !== tip.y));
  if (!tip || !from) return '';
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const back = { x: tip.x - Math.cos(angle) * size, y: tip.y - Math.sin(angle) * size };
  const half = size * 0.5;
  const left = { x: back.x + Math.sin(angle) * half, y: back.y - Math.cos(angle) * half };
  const right = { x: back.x - Math.sin(angle) * half, y: back.y + Math.cos(angle) * half };
  const round = (value: number) => Math.round(value * 100) / 100;
  return [tip, left, right].map((point) => `${round(point.x)},${round(point.y)}`).join(' ');
}

/** 去掉终点处箭头占的那一段：线画到箭头的底边，不从箭尖下面露出来 */
export function trimEnd(points: readonly DiagramPoint[], length: number): DiagramPoint[] {
  if (points.length < 2 || length <= 0) return [...points];
  const tip = points[points.length - 1]!;
  const before = points[points.length - 2]!;
  const segment = distance(before, tip);
  if (segment <= length) return [...points];
  return [...points.slice(0, -1), towards(tip, before, length)];
}
