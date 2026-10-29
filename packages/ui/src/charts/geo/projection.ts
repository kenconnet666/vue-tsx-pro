/**
 * 地图投影：经纬度 → 平面坐标（y 向下，同屏幕），以及把多边形裁到能画的范围里。
 * 公式同 d3-geo、d3-geo-projection（Mike Bostock，ISC）；这里只做地图用到的几种，球面裁剪写成精简版：
 *
 * - 先旋转到以 center 为中心（经度方向；正射投影连纬度一起转）；
 * - 世界地图换了中央经线后，跨过反子午线（中心对面那条经线）的多边形要切开：经度展开成连续的，
 *   在 [-180°, 180°] 的条带里裁剪（平移 ±360° 的副本也裁一遍），绕着极点的环（南极洲）先沿极点闭合；
 * - 正射投影只画朝向观察者的半球：在三维里按平面裁剪，切口沿地平圈补上弧。
 *
 *   const project = createProjection('conic', { center: [105, 35], bounds });
 *   project.polygon(rings)   // 裁剪、投影后的环（坐标单位任意，画的时候再按绘图区缩放）
 *   project.point([121.47, 31.23])   // [x, y]；在地球背面时为 null
 */

/** 内置的投影 */
export type MapProjectionName =
  'conic' | 'mercator' | 'naturalEarth' | 'equalEarth' | 'equirectangular' | 'orthographic';

/**
 * 自己的投影：[经度, 纬度]（度）→ [x, y]（y 向下）；看不见时返回 null。d3-geo 的投影可以直接传进来
 * （它本身就是这样的函数）；自己的投影不做裁剪
 */
export type MapGeoProjection = (coordinates: [number, number]) => [number, number] | null;

/** 平面上的一个点 */
type Planar = [number, number];

const RADIANS = Math.PI / 180;
const HALF_PI = Math.PI / 2;
const TAU = Math.PI * 2;
/** 墨卡托到这个纬度为止（再往上无穷大）：同网页地图的 ±85.05° */
const MERCATOR_LIMIT = Math.atan(Math.sinh(Math.PI));

/** 原始投影：弧度的经纬度 → 平面坐标（y 向上） */
type Raw = (lambda: number, phi: number) => Planar;

const mercator: Raw = (lambda, phi) => {
  const limited = Math.max(-MERCATOR_LIMIT, Math.min(MERCATOR_LIMIT, phi));
  return [lambda, Math.log(Math.tan(Math.PI / 4 + limited / 2))];
};

const naturalEarth: Raw = (lambda, phi) => {
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  return [
    lambda *
      (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
    phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))),
  ];
};

const equalEarth: Raw = (lambda, phi) => {
  const [a1, a2, a3, a4] = [1.340264, -0.081106, 0.000893, 0.003796];
  const m = Math.sqrt(3) / 2;
  const l = Math.asin(m * Math.sin(phi));
  const l2 = l * l;
  const l6 = l2 * l2 * l2;
  return [
    (lambda * Math.cos(l)) / (m * (a1 + 3 * a2 * l2 + l6 * (7 * a3 + 9 * a4 * l2))),
    l * (a1 + a2 * l2 + l6 * (a3 + a4 * l2)),
  ];
};

/** 等积圆锥（Albers）：两条标准纬线（弧度）；两条纬线关于赤道对称时退化成等积圆柱 */
function conicEqualArea(phi0: number, phi1: number): Raw {
  const sy0 = Math.sin(phi0);
  const n = (sy0 + Math.sin(phi1)) / 2;
  if (Math.abs(n) < 1e-6) {
    const cosPhi0 = Math.cos(phi0);
    return (lambda, phi) => [lambda * cosPhi0, Math.sin(phi) / cosPhi0];
  }
  const c = 1 + sy0 * (2 * n - sy0);
  const r0 = Math.sqrt(c) / n;
  return (lambda, phi) => {
    const r = Math.sqrt(Math.max(0, c - 2 * n * Math.sin(phi))) / n;
    return [r * Math.sin(lambda * n), r0 - r * Math.cos(lambda * n)];
  };
}

/** 经度归到 [-π, π] */
const wrap = (lambda: number) => lambda - TAU * Math.round(lambda / TAU);

/** 单位球上的点：x 朝向经纬度 (0, 0)，z 朝北极 */
type Vector = [number, number, number];

const toVector = (lambda: number, phi: number): Vector => [
  Math.cos(phi) * Math.cos(lambda),
  Math.cos(phi) * Math.sin(lambda),
  Math.sin(phi),
];

/** 绕东西轴转过 -pitch：把纬度 pitch 处转到赤道上（同 d3 的 rotation 的 φ 分量） */
function tilt([x, y, z]: Vector, pitch: number): Vector {
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  return [x * cos + z * sin, y, z * cos - x * sin];
}

/** Sutherland–Hodgman：一个环裁到 keep(点) 为真的一侧，cross 求边与边界的交点 */
function clipRing<P>(
  ring: readonly P[],
  keep: (point: P) => boolean,
  cross: (a: P, b: P) => P,
): P[] {
  const output: P[] = [];
  ring.forEach((current, i) => {
    const previous = ring[(i + ring.length - 1) % ring.length]!;
    if (keep(current)) {
      if (!keep(previous)) output.push(cross(previous, current));
      output.push(current);
    } else if (keep(previous)) output.push(cross(previous, current));
  });
  return output;
}

/** 去掉环末尾与开头重复的点（TopoJSON 的环是闭合的） */
const open = <P extends readonly number[]>(ring: readonly P[]) => {
  const first = ring[0];
  const last = ring.at(-1);
  return first && last && ring.length > 1 && first[0] === last[0] && first[1] === last[1]
    ? ring.slice(0, -1)
    : [...ring];
};

/**
 * 跨反子午线的环切开（经纬度都是弧度，经度已旋转到 [-π, π]）：展开成连续的经度，绕极点的环沿极点闭合，
 * 再在 [-π, π] 的条带里裁剪自己和平移 ±2π 的副本；裁出的边沿着反子午线每隔 2° 补点（投影后是曲线）
 */
function cutAntimeridian(ring: readonly Planar[]): Planar[][] {
  const unwrapped: Planar[] = [];
  let offset = 0;
  ring.forEach(([lambda, phi], i) => {
    if (i > 0) {
      const delta = lambda - ring[i - 1]![0];
      if (delta > Math.PI) offset -= TAU;
      else if (delta < -Math.PI) offset += TAU;
    }
    unwrapped.push([lambda + offset, phi]);
  });
  if (Math.abs(offset) > Math.PI) {
    // 绕了极点一圈：从最后一点沿纬线走到极点，再回到第一点的经度
    const pole = unwrapped.reduce((sum, [, phi]) => sum + phi, 0) < 0 ? -HALF_PI : HALF_PI;
    unwrapped.push([unwrapped.at(-1)![0], pole], [unwrapped[0]![0], pole]);
  }
  const lambdas = unwrapped.map(([lambda]) => lambda);
  const [min, max] = [Math.min(...lambdas), Math.max(...lambdas)];
  if (min >= -Math.PI - 1e-9 && max <= Math.PI + 1e-9) return [unwrapped];
  const atEdge =
    (edge: number) =>
    (a: Planar, b: Planar): Planar => [
      edge,
      a[1] + ((edge - a[0]) / (b[0] - a[0])) * (b[1] - a[1]),
    ];
  const pieces: Planar[][] = [];
  for (const shift of [-TAU, 0, TAU]) {
    if (max + shift <= -Math.PI || min + shift >= Math.PI) continue;
    const shifted = unwrapped.map(([lambda, phi]): Planar => [lambda + shift, phi]);
    const clipped = clipRing(
      clipRing(shifted, ([lambda]) => lambda <= Math.PI, atEdge(Math.PI)),
      ([lambda]) => lambda >= -Math.PI,
      atEdge(-Math.PI),
    );
    if (clipped.length >= 3) pieces.push(densifyEdge(clipped));
  }
  return pieces;
}

/** 沿反子午线的边每隔 2° 补一个点 */
function densifyEdge(ring: readonly Planar[]): Planar[] {
  const step = 2 * RADIANS;
  const output: Planar[] = [];
  ring.forEach((point, i) => {
    const next = ring[(i + 1) % ring.length]!;
    output.push(point);
    const onEdge = Math.abs(Math.abs(point[0]) - Math.PI) < 1e-9 && point[0] === next[0];
    if (!onEdge) return;
    const count = Math.floor(Math.abs(next[1] - point[1]) / step);
    for (let k = 1; k < count; k += 1)
      output.push([point[0], point[1] + ((next[1] - point[1]) * k) / count]);
  });
  return output;
}

/** 正射投影：环裁到朝向观察者的半球（x ≥ 0），切口沿地平圈补弧；返回投影后的平面坐标（y 向上） */
function clipHemisphere(ring: readonly Vector[]): Planar[] {
  const clipped = clipRing(
    ring,
    ([x]) => x >= 0,
    (a, b): Vector => {
      const t = a[0] / (a[0] - b[0]);
      const point: Vector = [0, a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
      const length = Math.hypot(point[1], point[2]) || 1;
      return [0, point[1] / length, point[2] / length];
    },
  );
  const output: Planar[] = [];
  clipped.forEach((point, i) => {
    output.push([point[1], point[2]]);
    const next = clipped[(i + 1) % clipped.length]!;
    if (point[0] !== 0 || next[0] !== 0) return;
    // 两个交点之间沿地平圈走较短的那段弧
    const from = Math.atan2(point[2], point[1]);
    let delta = Math.atan2(next[2], next[1]) - from;
    if (delta > Math.PI) delta -= TAU;
    if (delta < -Math.PI) delta += TAU;
    const count = Math.ceil(Math.abs(delta) / (4 * RADIANS));
    for (let k = 1; k < count; k += 1) {
      const angle = from + (delta * k) / count;
      output.push([Math.cos(angle), Math.sin(angle)]);
    }
  });
  return output;
}

/** createProjection 的选项 */
export interface ProjectionOptions {
  /** 投影的中心 [经度, 纬度]（度）：中央经线；正射投影还用纬度 */
  center: readonly [number, number];
  /** 地理数据的范围 [西, 南, 东, 北]：圆锥投影的两条标准纬线取范围的 1/6 与 5/6 处 */
  bounds: readonly [number, number, number, number];
}

/** 投影好的一组工具：多边形、点 */
export interface Projector {
  /** 一个多边形（几个环，经纬度）裁剪、投影后的环（y 向下）；整个看不见时是空数组 */
  polygon(rings: readonly (readonly (readonly [number, number])[])[]): Planar[][];
  /** 一个点；看不见时为 null */
  point(coordinates: readonly [number, number]): Planar | null;
  /** 正射投影：地球的轮廓（圆心与半径，投影坐标）；其余投影没有 */
  sphere?: { x: number; y: number; r: number };
}

/** 按名字（或自己的投影）建投影（见文件开头） */
export function createProjection(
  projection: MapProjectionName | MapGeoProjection,
  { center, bounds }: ProjectionOptions,
): Projector {
  if (typeof projection === 'function')
    return {
      polygon: (rings) =>
        rings.map((ring) =>
          ring.flatMap((point) => {
            const result = projection([point[0], point[1]]);
            return result ? [result] : [];
          }),
        ),
      point: (point) => projection([point[0], point[1]]),
    };
  const lambda0 = center[0] * RADIANS;
  const flip = ([x, y]: Planar): Planar => [x, -y];
  if (projection === 'orthographic') {
    const pitch = center[1] * RADIANS;
    const toView = (point: readonly [number, number]) =>
      tilt(toVector(point[0] * RADIANS - lambda0, point[1] * RADIANS), pitch);
    return {
      polygon: (rings) =>
        rings.flatMap((ring) => {
          const clipped = clipHemisphere(open(ring).map(toView));
          return clipped.length >= 3 ? [clipped.map(flip)] : [];
        }),
      point: (point) => {
        const [x, y, z] = toView(point);
        return x < 0 ? null : [y, -z];
      },
      sphere: { x: 0, y: 0, r: 1 },
    };
  }
  const [, south, , north] = bounds;
  const raw: Raw =
    projection === 'conic'
      ? conicEqualArea(
          (south + (north - south) / 6) * RADIANS,
          (north - (north - south) / 6) * RADIANS,
        )
      : projection === 'mercator'
        ? mercator
        : projection === 'equalEarth'
          ? equalEarth
          : projection === 'naturalEarth'
            ? naturalEarth
            : (lambda, phi) => [lambda, phi];
  const rotate = (point: readonly [number, number]): Planar => [
    wrap(point[0] * RADIANS - lambda0),
    point[1] * RADIANS,
  ];
  return {
    polygon: (rings) =>
      rings.flatMap((ring) =>
        cutAntimeridian(open(ring).map(rotate)).map((piece) =>
          piece.map(([lambda, phi]) => flip(raw(lambda, phi))),
        ),
      ),
    point: (point) => flip(raw(...rotate(point))),
  };
}
