/**
 * 图形的 SVG 路径：折线与面积（直线、单调平滑、阶梯）、一端圆角的柱子、环形的扇区、弦图的弦、桑基图的带子。
 * 曲线的算法同 d3-shape（curveMonotoneX 是 Steffen 的单调三次插值，不会越过数据点），写成只产出路径字符串的精简版。
 * 坐标保留三位小数（svgNumber）：服务端与浏览器算出的路径一致。
 *
 *   linePath([[0, 10], [40, 30], [80, 20]], 'monotone')   // 'M0,10C13.333,…'
 *   areaPath(top, bottom, 'linear')                       // 上沿从左到右、下沿从右到左，闭合
 *   arcPath({ inner: 60, outer: 88, start: 0, end: Math.PI / 2, corner: 3 })
 */
import { svgNumber } from '../utils/data/number';

/** 一个点 [x, y] */
export type ChartPoint = readonly [number, number];

/** 线的形状 */
export interface LineCurves {
  /** 折线：相邻的点直线相连（默认） */
  linear: unknown;
  /** 平滑曲线：不会越过数据点（单调插值），趋势更柔和 */
  monotone: unknown;
  /** 阶梯：值保持到下一个点才跳变，适合离散的状态、价格档位 */
  step: unknown;
}

/** 两个数字写成“x,y” */
const pair = (x: number, y: number) => `${svgNumber(x)},${svgNumber(y)}`;

const sign = (value: number) => (value < 0 ? -1 : 1);

/** 中间一点的切线斜率：两侧的斜率异号时为 0（极值点不越过），否则取不超过两侧的调和值（同 d3 的 slope3） */
function interiorSlope(a: ChartPoint, b: ChartPoint, c: ChartPoint): number {
  const h0 = b[0] - a[0];
  const h1 = c[0] - b[0];
  // 横坐标相同时除以带符号的 0：得到同向的无穷大，下面取 min 时自然被别的值替代
  const s0 = (b[1] - a[1]) / (h0 || (h1 < 0 ? -0 : 0));
  const s1 = (c[1] - b[1]) / (h1 || (h0 < 0 ? -0 : 0));
  const p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

/** 端点的切线斜率：由相邻一段的斜率与相邻点的切线推出（同 d3 的 slope2） */
function endSlope(a: ChartPoint, b: ChartPoint, tangent: number): number {
  const h = b[0] - a[0];
  return h ? ((3 * (b[1] - a[1])) / h - tangent) / 2 : tangent;
}

/** 单调三次插值：各点的切线，再按 Hermite 写成三次贝塞尔 */
function monotoneCommands(points: readonly ChartPoint[]): string {
  const n = points.length;
  const tangents = points.map((point, i) =>
    i > 0 && i < n - 1 ? interiorSlope(points[i - 1]!, point, points[i + 1]!) : 0,
  );
  tangents[0] = endSlope(points[0]!, points[1]!, tangents[1]!);
  tangents[n - 1] = endSlope(points[n - 2]!, points[n - 1]!, tangents[n - 2]!);
  let path = '';
  for (let i = 1; i < n; i += 1) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    const dx = (x1 - x0) / 3;
    path += `C${pair(x0 + dx, y0 + dx * tangents[i - 1]!)},${pair(x1 - dx, y1 - dx * tangents[i]!)},${pair(x1, y1)}`;
  }
  return path;
}

/**
 * 一串点连成的路径；start 是开头的命令（M 新起一段，L 接着上一段画：面积的下沿）。
 * 少于三个点时平滑曲线退化成直线
 */
export function linePath(
  points: readonly ChartPoint[],
  curve: keyof LineCurves = 'linear',
  start: 'M' | 'L' = 'M',
): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  let path = `${start}${pair(first![0], first![1])}`;
  if (curve === 'monotone' && points.length > 2) return path + monotoneCommands(points);
  let previous = first!;
  for (const point of rest) {
    // 阶梯：横着走到下一个点的横坐标，再竖着跳到它的值
    if (curve === 'step') path += `L${pair(point[0], previous[1])}`;
    path += `L${pair(point[0], point[1])}`;
    previous = point;
  }
  return path;
}

/** 面积：上沿 top 从左到右，下沿 bottom（与 top 一一对应）从右到左，同一种曲线，闭合 */
export function areaPath(
  top: readonly ChartPoint[],
  bottom: readonly ChartPoint[],
  curve: keyof LineCurves = 'linear',
): string {
  if (top.length === 0) return '';
  // 阶梯的下沿倒着画时要先竖后横，才与上沿的拐角对齐：倒着画的阶梯把每一步的值挪到前一个点
  const back =
    curve === 'step'
      ? bottom.flatMap((point, i) =>
          i === 0 ? [point] : [[point[0], bottom[i - 1]![1]] as const, point],
        )
      : bottom;
  return `${linePath(top, curve)}${linePath([...back].reverse(), curve === 'step' ? 'linear' : curve, 'L')}Z`;
}

/** 柱子的哪一端是圆角：柱顶朝哪个方向 */
export type BarEnd = 'top' | 'bottom' | 'left' | 'right' | 'none';

/** 柱子：矩形（左上角 x、y，宽高），end 那一端的两个角是半径 radius 的圆角（不超过宽或高的一半） */
export function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  end: BarEnd,
): string {
  const w = Math.max(width, 0);
  const h = Math.max(height, 0);
  const vertical = end === 'top' || end === 'bottom';
  const r =
    end === 'none' ? 0 : Math.max(0, Math.min(radius, vertical ? w / 2 : h / 2, vertical ? h : w));
  const [x1, y1] = [x + w, y + h];
  const corner = (cx: number, cy: number) => `A${pair(r, r)},0,0,1,${pair(cx, cy)}`;
  if (!r) return `M${pair(x, y)}H${svgNumber(x1)}V${svgNumber(y1)}H${svgNumber(x)}Z`;
  if (end === 'top')
    return `M${pair(x, y1)}V${svgNumber(y + r)}${corner(x + r, y)}H${svgNumber(x1 - r)}${corner(x1, y + r)}V${svgNumber(y1)}Z`;
  if (end === 'bottom')
    return `M${pair(x1, y)}V${svgNumber(y1 - r)}${corner(x1 - r, y1)}H${svgNumber(x + r)}${corner(x, y1 - r)}V${svgNumber(y)}Z`;
  if (end === 'right')
    return `M${pair(x, y)}H${svgNumber(x1 - r)}${corner(x1, y + r)}V${svgNumber(y1 - r)}${corner(x1 - r, y1)}H${svgNumber(x)}Z`;
  return `M${pair(x1, y1)}H${svgNumber(x + r)}${corner(x, y1 - r)}V${svgNumber(y + r)}${corner(x + r, y)}H${svgNumber(x1)}Z`;
}

/** 环形的一段：角度从 12 点钟方向顺时针（弧度），圆心在原点 */
export interface ArcShape {
  /** 内半径；0 是饼图的扇形 */
  inner: number;
  /** 外半径 */
  outer: number;
  /** 起始角 */
  start: number;
  /** 结束角 */
  end: number;
  /** 四个角的圆角半径，默认 0 */
  corner?: number;
}

/** 半径 r、角度 angle（12 点钟方向顺时针）处的点 */
export function polarPoint(r: number, angle: number): [number, number] {
  return [r * Math.sin(angle), -r * Math.cos(angle)];
}

/**
 * 环形一段的路径：两条径向的边、内外两段弧；corner 时四个角各是一段与边、弧都相切的小圆弧
 * （边是径向的，与圆正交，切点可以直接算出）。整圈时画成两段弧（没有边）
 */
export function arcPath({ inner, outer, start, end, corner = 0 }: ArcShape): string {
  const sweep = end - start;
  if (!(sweep > 0) || !(outer > 0)) return '';
  const at = (r: number, angle: number) => pair(...polarPoint(r, angle));
  const arc = (r: number, to: number, clockwise: boolean, span: number) =>
    `A${pair(r, r)},0,${span > Math.PI ? 1 : 0},${clockwise ? 1 : 0},${at(r, to)}`;
  if (sweep >= Math.PI * 2 - 1e-9) {
    const outerRing = `M${at(outer, 0)}${arc(outer, Math.PI, true, Math.PI)}${arc(outer, 0, true, Math.PI)}Z`;
    if (inner <= 0) return outerRing;
    return `${outerRing}M${at(inner, 0)}${arc(inner, Math.PI, false, Math.PI)}${arc(inner, 0, false, Math.PI)}Z`;
  }
  // 圆角不超过环宽的一半，也不超过这一段在内（饼图是外）弧上长度的一半
  const r = Math.max(
    0,
    Math.min(corner, (outer - inner) / 2, ((inner > 0 ? inner : outer) * sweep) / 2.2),
  );
  if (r < 0.5) {
    const outerPart = `M${at(outer, start)}${arc(outer, end, true, sweep)}`;
    if (inner <= 0) return `${outerPart}L0,0Z`;
    return `${outerPart}L${at(inner, end)}${arc(inner, start, false, sweep)}Z`;
  }
  // 外角：小圆心在半径 outer - r 上，切边的点离圆心 √((outer-r)² - r²)，切弧的点偏开 asin(r / (outer - r))
  const outerShift = Math.asin(r / (outer - r));
  const outerEdge = Math.sqrt((outer - r) ** 2 - r * r);
  const fillet = (to: string) => `A${pair(r, r)},0,0,1,${to}`;
  let path =
    `M${at(outerEdge, start)}${fillet(at(outer, start + outerShift))}` +
    `${arc(outer, end - outerShift, true, sweep - outerShift * 2)}${fillet(at(outerEdge, end))}`;
  if (inner <= 0) return `${path}L0,0Z`;
  // 内角：小圆心在半径 inner + r 上
  const innerShift = Math.asin(r / (inner + r));
  const innerEdge = Math.sqrt((inner + r) ** 2 - r * r);
  path +=
    `L${at(innerEdge, end)}${fillet(at(inner, end - innerShift))}` +
    `${arc(inner, start + innerShift, false, sweep - innerShift * 2)}${fillet(at(innerEdge, start))}Z`;
  return path;
}

/** 弦图的一根弦：两端是圆上的两段弧（半径 radius，角度同 arcPath），中间经圆心的二次曲线相连（同 d3 的 ribbon） */
export function ribbonPath(
  radius: number,
  source: readonly [number, number],
  target: readonly [number, number],
): string {
  const at = (angle: number) => pair(...polarPoint(radius, angle));
  const arc = ([from, to]: readonly [number, number]) =>
    `A${pair(radius, radius)},0,${to - from > Math.PI ? 1 : 0},1,${at(to)}`;
  let path = `M${at(source[0])}${arc(source)}`;
  if (source[0] !== target[0] || source[1] !== target[1])
    path += `Q0,0,${at(target[0])}${arc(target)}`;
  return `${path}Q0,0,${at(source[0])}Z`;
}

/** 横向的流向带（桑基图的连线）：从 (x0, y0) 到 (x1, y1) 的 S 形三次曲线，控制点在两端的中间 */
export function horizontalLinkPath(x0: number, y0: number, x1: number, y1: number): string {
  const middle = (x0 + x1) / 2;
  return `M${pair(x0, y0)}C${pair(middle, y0)},${pair(middle, y1)},${pair(x1, y1)}`;
}
