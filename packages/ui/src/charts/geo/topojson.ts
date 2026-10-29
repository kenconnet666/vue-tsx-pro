/**
 * TopoJSON：解出要素的多边形（经纬度）、按像素简化、算经纬度范围。地图（MapChart）用它，组件库的
 * `@zerodep-dev/vue-tsx-pro-ui/maps` 带着中国省份与世界各国两份数据，也可以用自己的 TopoJSON。
 *
 *   const features = topologyFeatures(chinaProvinces, 'provinces');
 *   features[0].id                       // 'CN-GS'
 *   features[0].polygons[0][0]           // 第一个多边形的外环：[[经度, 纬度], …]
 *
 * TopoJSON 把相邻区域共用的边界存成一段段弧（arcs），多边形的环是弧的序号（负数 ~i 表示倒着走第 i 段）；
 * 有 transform 时弧的坐标是量化后逐点的差值。解码的写法同 topojson-client（Mike Bostock，ISC）。
 */
import { presimplify, simplify } from 'topojson-simplify';

/** TopoJSON 里的一个几何对象：多边形、多个多边形，或一组几何对象 */
export interface MapTopologyObject {
  /** 类型：Polygon、MultiPolygon、GeometryCollection（其余类型不画） */
  type: string;
  /** 要素的 id：地图按它对应区域的数据 */
  id?: string | number;
  /** 要素的属性（名称等） */
  properties?: Readonly<Record<string, unknown>> | null;
  /** 多边形的环：弧的序号（Polygon 是两层数组，MultiPolygon 是三层） */
  arcs?: unknown;
  /** GeometryCollection 里的几何对象 */
  geometries?: readonly MapTopologyObject[];
}

/** TopoJSON 拓扑：地理数据 */
export interface MapTopology {
  /** 'Topology' */
  type: string;
  /** 各段弧：点的序列；有 transform 时是量化后逐点的差值 */
  arcs: readonly (readonly (readonly number[])[])[];
  /** 量化：坐标 = 整数 × scale + translate */
  transform?: { scale: readonly number[]; translate: readonly number[] };
  /** 经纬度范围 [西, 南, 东, 北] */
  bbox?: readonly number[];
  /** 要素组：名字 → 几何对象（通常是 GeometryCollection） */
  objects: Readonly<Record<string, MapTopologyObject>>;
}

/** 经纬度（度）：[经度, 纬度] */
export type GeoPosition = readonly [number, number];

/** 解出来的一个要素 */
export interface MapFeature {
  /** 要素的 id（转成字符串） */
  id: string;
  /** 属性 */
  properties: Readonly<Record<string, unknown>>;
  /** 多边形：每个多边形是几个环，第一个是外环，其余是洞 */
  polygons: GeoPosition[][][];
}

/** 解码过的弧：按拓扑缓存 */
const decodedArcs = new WeakMap<MapTopology, GeoPosition[][]>();

/** 各段弧的绝对经纬度 */
function decodeArcs(topology: MapTopology): GeoPosition[][] {
  let arcs = decodedArcs.get(topology);
  if (arcs) return arcs;
  const { scale = [1, 1], translate = [0, 0] } = topology.transform ?? {};
  const [sx = 1, sy = 1] = scale;
  const [tx = 0, ty = 0] = translate;
  arcs = topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([px = 0, py = 0]): GeoPosition => {
      if (!topology.transform) return [px, py];
      x += px;
      y += py;
      return [x * sx + tx, y * sy + ty];
    });
  });
  decodedArcs.set(topology, arcs);
  return arcs;
}

/** 一个环：依次接上各段弧（后一段的第一个点就是前一段的最后一个点，去掉重复的） */
function ring(arcs: readonly GeoPosition[][], indices: readonly number[]): GeoPosition[] {
  const points: GeoPosition[] = [];
  for (const index of indices) {
    const arc = index < 0 ? [...arcs[~index]!].reverse() : arcs[index]!;
    if (points.length) points.pop();
    points.push(...arc);
  }
  return points;
}

/** 一个几何对象里的多边形 */
function polygonsOf(arcs: readonly GeoPosition[][], object: MapTopologyObject): GeoPosition[][][] {
  if (object.type === 'Polygon')
    return [(object.arcs as number[][]).map((indices) => ring(arcs, indices))];
  if (object.type === 'MultiPolygon')
    return (object.arcs as number[][][]).map((rings) =>
      rings.map((indices) => ring(arcs, indices)),
    );
  return [];
}

/** 要素组 name 里的要素（GeometryCollection 展开；单个几何对象当作一个要素） */
export function topologyFeatures(topology: MapTopology, name: string): MapFeature[] {
  const object = topology.objects[name];
  if (!object) return [];
  const arcs = decodeArcs(topology);
  const members = object.type === 'GeometryCollection' ? (object.geometries ?? []) : [object];
  return members.map((member) => ({
    id: String(member.id ?? ''),
    properties: member.properties ?? {},
    polygons: polygonsOf(arcs, member),
  }));
}

/** 算好了各点权重的地理数据：同一份 TopoJSON 只算一次 */
const presimplified = new WeakMap<MapTopology, MapTopology>();

/** 简化过的地理数据：TopoJSON → 档位 → 结果 */
const simplified = new WeakMap<MapTopology, Map<number, MapTopology>>();

/**
 * 简化地理数据：去掉与前后两点围成的三角形面积不到 minArea（坐标单位的平方，经纬度是平方度）的点
 * （Visvalingam，topojson-simplify）。相邻区域共用的边界一起简化，不会出现缝隙；各段弧的两端总保留。
 * minArea 按 2 的整数次幂分档缓存：绘图区大小变一点不重算。
 */
export function simplifyTopology(topology: MapTopology, minArea: number): MapTopology {
  if (!(minArea > 0) || !Number.isFinite(minArea)) return topology;
  const level = 2 ** Math.floor(Math.log2(minArea));
  let byLevel = simplified.get(topology);
  if (!byLevel) simplified.set(topology, (byLevel = new Map()));
  let result = byLevel.get(level);
  if (!result) {
    // topojson-simplify 的类型（topojson-specification）比这里的宽松类型严：边界上转一下
    type Input = Parameters<typeof presimplify>[0];
    let weighted = presimplified.get(topology);
    if (!weighted)
      presimplified.set(
        topology,
        (weighted = presimplify(topology as unknown as Input) as unknown as MapTopology),
      );
    result = simplify(weighted as unknown as Input, level) as unknown as MapTopology;
    byLevel.set(level, result);
  }
  return result;
}

/** TopoJSON 的经纬度范围 [西, 南, 东, 北]：有 bbox 用它，否则解出各段弧的坐标 */
export function topologyBounds(topology: MapTopology): [number, number, number, number] {
  if (topology.bbox && topology.bbox.length >= 4) {
    const [west = 0, south = 0, east = 0, north = 0] = topology.bbox;
    return [west, south, east, north];
  }
  let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const arc of decodeArcs(topology))
    for (const [longitude, latitude] of arc) {
      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
    }
  return [west, south, east, north];
}
