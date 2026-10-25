/**
 * 正交路由（纯函数）：连线只走横竖两个方向，绕开节点，拐弯尽量少；同一个节点同一条边上的几条线均匀分开。
 * 做法同 Wybrow 等人的正交连接线路由（开源实现见 orthogonal-connector，MIT）：
 *   1. 每个节点外扩 margin 作为障碍；起点、终点从所在边的端口往外伸出一小段（stub）
 *   2. 障碍的边线、端口、两端之间的中线画成横竖“标尺”，标尺的交点（不在障碍里的）就是可走的格点
 *   3. 在格点上跑 A*：代价是长度加拐弯惩罚，状态带方向，所以同样长时选拐弯少的
 * 找不到路时退回成三段的折线（不避障）。画布有几百个节点也只取两端附近的障碍，单条线的格点在几千以内。
 */
import { borderPoint, rectCenter, type DiagramPoint, type DiagramRect } from './geometry';

/** 节点的四条边 */
export interface DiagramSides {
  /** 上边 */
  top: unknown;
  /** 右边 */
  right: unknown;
  /** 下边 */
  bottom: unknown;
  /** 左边 */
  left: unknown;
}

/** 连线从哪条边出去、进来 */
export type DiagramSide = keyof DiagramSides;

/** 一端：节点的矩形、从哪条边、边上的哪一点（不写时取边的中点） */
export interface RouteEnd {
  /** 节点的矩形 */
  rect: DiagramRect;
  /** 从哪条边；不写时按两端的相对位置选 */
  side?: DiagramSide;
  /** 边上的点（端口分配给出）；不写时取边的中点 */
  point?: DiagramPoint;
}

/** routeOrthogonal 的选项 */
export interface RouteOptions {
  /** 绕开节点时离节点的距离，也是端口伸出的长度，默认 16 */
  margin?: number;
  /** 拐一个弯折合多少长度，默认 40：同样能到时选拐弯少的 */
  bendPenalty?: number;
}

const DIRECTIONS: Record<DiagramSide, DiagramPoint> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

/** 边的中点 */
export function sidePoint(rect: DiagramRect, side: DiagramSide): DiagramPoint {
  const center = rectCenter(rect);
  if (side === 'top') return { x: center.x, y: rect.y };
  if (side === 'bottom') return { x: center.x, y: rect.y + rect.height };
  if (side === 'left') return { x: rect.x, y: center.y };
  return { x: rect.x + rect.width, y: center.y };
}

/**
 * 两个节点之间按相对位置选出、进的边：横向隔得开就左右连，否则上下连；
 * 目标在右边时从右边出、从左边进，在下面时从下边出、从上边进，反过来亦然
 */
export function chooseSides(from: DiagramRect, to: DiagramRect): [DiagramSide, DiagramSide] {
  const a = rectCenter(from);
  const b = rectCenter(to);
  const gapX = Math.max(to.x - (from.x + from.width), from.x - (to.x + to.width));
  const gapY = Math.max(to.y - (from.y + from.height), from.y - (to.y + to.height));
  if (gapX >= gapY) return b.x >= a.x ? ['right', 'left'] : ['left', 'right'];
  return b.y >= a.y ? ['bottom', 'top'] : ['top', 'bottom'];
}

const inflate = (rect: DiagramRect, by: number): DiagramRect => ({
  x: rect.x - by,
  y: rect.y - by,
  width: rect.width + by * 2,
  height: rect.height + by * 2,
});

/** 点严格在矩形里面（边上不算） */
const inside = (rect: DiagramRect, x: number, y: number) =>
  x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height;

/** 横线或竖线段穿过矩形内部 */
function crosses(rect: DiagramRect, a: DiagramPoint, b: DiagramPoint): boolean {
  if (a.y === b.y) {
    const [left, right] = a.x < b.x ? [a.x, b.x] : [b.x, a.x];
    return (
      a.y > rect.y && a.y < rect.y + rect.height && right > rect.x && left < rect.x + rect.width
    );
  }
  const [top, bottom] = a.y < b.y ? [a.y, b.y] : [b.y, a.y];
  return a.x > rect.x && a.x < rect.x + rect.width && bottom > rect.y && top < rect.y + rect.height;
}

/** 去掉共线的中间点与重复点 */
export function simplify(points: readonly DiagramPoint[]): DiagramPoint[] {
  const out: DiagramPoint[] = [];
  for (const point of points) {
    const last = out[out.length - 1];
    if (last && last.x === point.x && last.y === point.y) continue;
    const before = out[out.length - 2];
    if (
      before &&
      last &&
      ((before.x === last.x && last.x === point.x) || (before.y === last.y && last.y === point.y))
    ) {
      out[out.length - 1] = point;
      continue;
    }
    out.push(point);
  }
  return out;
}

/** 找不到路时：端口伸出后走一个 Z 形（不避障） */
function fallback(start: DiagramPoint, end: DiagramPoint, startSide: DiagramSide): DiagramPoint[] {
  const horizontal = startSide === 'left' || startSide === 'right';
  return horizontal
    ? [start, { x: (start.x + end.x) / 2, y: start.y }, { x: (start.x + end.x) / 2, y: end.y }, end]
    : [
        start,
        { x: start.x, y: (start.y + end.y) / 2 },
        { x: end.x, y: (start.y + end.y) / 2 },
        end,
      ];
}

/** 一个格点在 A* 里的状态：位置加进来的方向（0 横、1 竖、2 起点） */
interface Node {
  x: number;
  y: number;
  axis: 0 | 1 | 2;
  cost: number;
  estimate: number;
  previous?: Node;
}

/**
 * 两个节点之间的正交折线：从 from 的一条边出去，进 to 的一条边，绕开 obstacles（不含两端自己，函数会把两端也算上）。
 * 返回含两端端口的折线点（画布坐标），可以直接交给 Diagram 的 edges[].points
 */
export function routeOrthogonal(
  from: RouteEnd,
  to: RouteEnd,
  obstacles: readonly DiagramRect[] = [],
  options: RouteOptions = {},
): DiagramPoint[] {
  const margin = options.margin ?? 16;
  const bendPenalty = options.bendPenalty ?? 40;
  const [autoFrom, autoTo] = chooseSides(from.rect, to.rect);
  const fromSide = from.side ?? autoFrom;
  const toSide = to.side ?? autoTo;
  const startPort = from.point ?? sidePoint(from.rect, fromSide);
  const endPort = to.point ?? sidePoint(to.rect, toSide);
  const out = (point: DiagramPoint, side: DiagramSide) => ({
    x: point.x + DIRECTIONS[side].x * margin,
    y: point.y + DIRECTIONS[side].y * margin,
  });
  const start = out(startPort, fromSide);
  const end = out(endPort, toSide);

  // 只取两端附近的障碍：两端包围盒再往外一圈
  const reach =
    Math.max(from.rect.width, from.rect.height, to.rect.width, to.rect.height) * 2 + margin * 4;
  const left = Math.min(start.x, end.x) - reach;
  const right = Math.max(start.x, end.x) + reach;
  const top = Math.min(start.y, end.y) - reach;
  const bottom = Math.max(start.y, end.y) + reach;
  const blocks = [from.rect, to.rect, ...obstacles]
    .map((rect) => inflate(rect, margin - 0.5))
    .filter(
      (rect) =>
        rect.x < right &&
        rect.x + rect.width > left &&
        rect.y < bottom &&
        rect.y + rect.height > top,
    );

  // 标尺：障碍的边线（再往外半个 margin，线不贴着障碍走）、端口、两端之间的中线
  const xs = new Set<number>([start.x, end.x, (start.x + end.x) / 2]);
  const ys = new Set<number>([start.y, end.y, (start.y + end.y) / 2]);
  for (const rect of blocks) {
    xs.add(rect.x - margin / 2).add(rect.x + rect.width + margin / 2);
    ys.add(rect.y - margin / 2).add(rect.y + rect.height + margin / 2);
  }
  const columns = [...xs].sort((a, b) => a - b);
  const rows = [...ys].sort((a, b) => a - b);
  const blocked = (x: number, y: number) => blocks.some((rect) => inside(rect, x, y));
  const key = (x: number, y: number) => `${x},${y}`;
  const columnOf = new Map(columns.map((x, index) => [x, index]));
  const rowOf = new Map(rows.map((y, index) => [y, index]));

  // A*：从 start 沿出边的方向出发，到 end 时要沿进边的反方向进
  const startAxis = fromSide === 'left' || fromSide === 'right' ? 0 : 1;
  const endAxis = toSide === 'left' || toSide === 'right' ? 0 : 1;
  const heuristic = (x: number, y: number) => Math.abs(x - end.x) + Math.abs(y - end.y);
  const open: Node[] = [
    { x: start.x, y: start.y, axis: startAxis, cost: 0, estimate: heuristic(start.x, start.y) },
  ];
  const best = new Map<string, number>([[`${key(start.x, start.y)}|${startAxis}`, 0]]);
  let found: Node | undefined;
  while (open.length) {
    // 格点不多，按估价线性取最小即可
    let index = 0;
    for (let i = 1; i < open.length; i++) if (open[i]!.estimate < open[index]!.estimate) index = i;
    const current = open.splice(index, 1)[0]!;
    if (current.x === end.x && current.y === end.y) {
      found = current;
      break;
    }
    const column = columnOf.get(current.x)!;
    const row = rowOf.get(current.y)!;
    const neighbours: [number, number, 0 | 1][] = [];
    if (column > 0) neighbours.push([columns[column - 1]!, current.y, 0]);
    if (column < columns.length - 1) neighbours.push([columns[column + 1]!, current.y, 0]);
    if (row > 0) neighbours.push([current.x, rows[row - 1]!, 1]);
    if (row < rows.length - 1) neighbours.push([current.x, rows[row + 1]!, 1]);
    for (const [x, y, axis] of neighbours) {
      if (blocked(x, y) || blocks.some((rect) => crosses(rect, current, { x, y }))) continue;
      const turn = current.axis !== 2 && current.axis !== axis ? bendPenalty : 0;
      // 到终点时还要拐向进边的方向
      const arrive = x === end.x && y === end.y && axis !== endAxis ? bendPenalty : 0;
      const cost = current.cost + Math.abs(x - current.x) + Math.abs(y - current.y) + turn + arrive;
      const state = `${key(x, y)}|${axis}`;
      if (cost >= (best.get(state) ?? Infinity)) continue;
      best.set(state, cost);
      open.push({ x, y, axis, cost, estimate: cost + heuristic(x, y), previous: current });
    }
  }
  if (!found) return simplify([startPort, ...fallback(start, end, fromSide), endPort]);
  const path: DiagramPoint[] = [];
  for (let node: Node | undefined = found; node; node = node.previous)
    path.unshift({ x: node.x, y: node.y });
  return simplify([startPort, ...path, endPort]);
}

/** routeEdges 的一条连线：两端节点的标识，可以指定出、进的边 */
export interface RouteEdge {
  /** 连线的标识 */
  id: string;
  /** 起点节点 */
  from: string;
  /** 终点节点 */
  to: string;
  /** 从起点的哪条边出去；不写时自动选 */
  fromSide?: DiagramSide;
  /** 从终点的哪条边进来；不写时自动选 */
  toSide?: DiagramSide;
}

/**
 * 一组连线一起路由：先定每条线的出、进边，同一个节点同一条边上的几条线按对端的位置排开（端口分配，线不挤在一个点），
 * 再逐条绕开全部节点。返回连线标识 → 折线点；两端节点缺了的连线不在结果里。
 * obstacles 不写时用 nodes 本身；拖动时只重算相连的几条线，可以把全部节点作为 obstacles 传进来
 */
export function routeEdges(
  nodes: readonly (DiagramRect & { id: string })[],
  edges: readonly RouteEdge[],
  options: RouteOptions & { obstacles?: readonly (DiagramRect & { id: string })[] } = {},
): Map<string, DiagramPoint[]> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const obstacles = options.obstacles ?? nodes;
  // 每条线两端的边
  const plans = edges.flatMap((edge) => {
    const from = byId.get(edge.from) ?? obstacles.find((node) => node.id === edge.from);
    const to = byId.get(edge.to) ?? obstacles.find((node) => node.id === edge.to);
    if (!from || !to || from === to) return [];
    const [autoFrom, autoTo] = chooseSides(from, to);
    return [{ edge, from, to, fromSide: edge.fromSide ?? autoFrom, toSide: edge.toSide ?? autoTo }];
  });
  // 端口分配：同一节点同一条边上的线按对端中心沿这条边的坐标排序，均匀分布在边上
  const slots = new Map<string, { plan: (typeof plans)[number]; end: 'from' | 'to' }[]>();
  for (const plan of plans) {
    for (const end of ['from', 'to'] as const) {
      const node = plan[end];
      const side = end === 'from' ? plan.fromSide : plan.toSide;
      const slot = `${node.id}|${side}`;
      slots.set(slot, [...(slots.get(slot) ?? []), { plan, end }]);
    }
  }
  const points = new Map<string, DiagramPoint>();
  for (const [slot, list] of slots) {
    const side = slot.split('|')[1] as DiagramSide;
    const horizontal = side === 'top' || side === 'bottom';
    const other = (item: (typeof list)[number]) =>
      rectCenter(item.end === 'from' ? item.plan.to : item.plan.from)[horizontal ? 'x' : 'y'];
    const sorted = [...list].sort((a, b) => other(a) - other(b));
    sorted.forEach((item, index) => {
      const node = item.plan[item.end];
      const base = sidePoint(node, side);
      const span = horizontal ? node.width : node.height;
      const offset = ((index + 1) / (sorted.length + 1) - 0.5) * span;
      points.set(
        `${item.plan.edge.id}|${item.end}`,
        horizontal ? { x: base.x + offset, y: base.y } : { x: base.x, y: base.y + offset },
      );
    });
  }
  const routes = new Map<string, DiagramPoint[]>();
  for (const plan of plans) {
    const others = obstacles.filter((node) => node.id !== plan.from.id && node.id !== plan.to.id);
    routes.set(
      plan.edge.id,
      routeOrthogonal(
        { rect: plan.from, side: plan.fromSide, point: points.get(`${plan.edge.id}|from`) },
        { rect: plan.to, side: plan.toSide, point: points.get(`${plan.edge.id}|to`) },
        others,
        options,
      ),
    );
  }
  return routes;
}

/** 两个节点之间的直线：两端落在边框上（没有路由时的默认画法） */
export function straightRoute(from: DiagramRect, to: DiagramRect): DiagramPoint[] {
  return [borderPoint(from, rectCenter(to)), borderPoint(to, rectCenter(from))];
}

/** 离点最近的边：连线拖到节点上时从这条边进去 */
export function nearestSide(rect: DiagramRect, point: DiagramPoint): DiagramSide {
  const distances: [DiagramSide, number][] = [
    ['top', Math.abs(point.y - rect.y)],
    ['right', Math.abs(point.x - (rect.x + rect.width))],
    ['bottom', Math.abs(point.y - (rect.y + rect.height))],
    ['left', Math.abs(point.x - rect.x)],
  ];
  return distances.reduce((best, item) => (item[1] < best[1] ? item : best))[0];
}
