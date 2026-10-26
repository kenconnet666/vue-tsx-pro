/**
 * 地图：按区域着色（分省的销售额、各国的采购额），标出地点（工厂、供应商）与它们之间的流向。
 * 地理数据是 TopoJSON：Unovis 自带中国省份、世界、美国等（`@unovis/ts/maps`），也可以用自己的。
 *
 *   import { ChinaTopoJSON } from '@unovis/ts/maps';
 *   <MapChart
 *     aria-label="各省销售额"
 *     topology={ChinaTopoJSON}
 *     feature="provinces"
 *     areas={[{ id: 'CN-JS', label: '江苏', value: 623 }, …]}   // id 是地图要素的 id
 *     points={[{ id: 'sh', label: '上海组装', longitude: 121.47, latitude: 31.23, value: 860 }]}
 *     links={[{ from: 'xa', to: 'sh', value: 120 }]}
 *     bins={5}
 *     areaLabels
 *   />
 *
 * 投影：默认按地理数据的范围选——一个国家、一个地区用以它为中心的等积圆锥投影（中国地图常用的 Albers，正着、不歪），
 * 跨了大半个地球时用 Natural Earth；也可以指定 mercator、equalEarth、orthographic（地球仪）或自己的 d3 投影。
 *
 * 着色：sequential（默认）按数值深浅；diverging 以 midpoint 为界两头两种颜色（同比的涨跌）；
 * bins 分成几档（分级着色，图例是几个色块），不写时连续着色（图例是色带）；区域写了 color 时按它（分类着色）。
 * 没有数据的区域是底色。地点：value 决定大小（面积按比例），color、shape 决定颜色与形状；名字自动避让
 * （换方位、挤时往外退并画引线，数值大的先放，放不下的悬停看；压住名字、地点的区域名藏起来）；
 * links 是地点之间的流向，粗细按 value，flow 时有流动的粒子。
 * zoomable 时可以拖动、按住 Ctrl 滚轮缩放，右上角有放大、缩小、复位的按钮。悬停看名称与数值；读屏的数据表列出各区域、地点与流向。
 */
import {
  MapProjection,
  TopoJSONMap,
  type MapGraphData,
  type TopoJSONMapConfigInterface,
} from '@unovis/ts';
import { Maximize, Minus, Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { presimplify, simplify } from 'topojson-simplify';
import type { VNodeChild } from 'vue';
import { IconButton } from '../base/IconButton';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { colors } from '../config/theme/tokens';
import { Skeleton } from '../feedback/Skeleton';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import { useEventListener } from '../utils/dom/event-listener';
import type { PartProps } from '../utils/props';
import { chartTooltip, ChartFrame, type ChartFrameParts } from './frame';
import { placeLabels, rectsOverlap, type LabelRect } from './label-layout';
import { resolveColor, type ChartColor } from './series';
import { useSingleChart, type SingleChart } from './single';

/** 一个区域的数据 */
export interface MapArea {
  /** 地图要素的 id（Unovis 的中国省份是 'CN-JS' 这样的写法） */
  id: string;
  /** 显示的名称：提示框、区域名、数据表 */
  label: string;
  /** 数值：决定颜色 */
  value?: NumericValue;
  /** 指定颜色：不按数值着色（分类着色，如所属大区） */
  color?: ChartColor;
}

/** 一个地点 */
export interface MapPoint {
  /** 标识：流向的 from、to 指向它 */
  id: string;
  /** 名称：写在点下方 */
  label: string;
  /** 经度 */
  longitude: number;
  /** 纬度 */
  latitude: number;
  /** 数值：决定点的大小（面积按比例），也显示在提示框 */
  value?: NumericValue;
  /** 颜色，默认 danger */
  color?: ChartColor;
  /** 形状，默认 circle */
  shape?: 'circle' | 'square' | 'triangle';
}

/** 两个地点之间的流向 */
export interface MapLink {
  /** 起点（地点的 id） */
  from: string;
  /** 终点（地点的 id） */
  to: string;
  /** 数值：决定线的粗细，也显示在数据表 */
  value?: NumericValue;
  /** 颜色，默认次要色 */
  color?: ChartColor;
}

/** 投影的预设 */
export interface MapProjections {
  /** 等积圆锥（Albers）：以数据为中心，一个国家、一个地区用它（中国地图常用），正着、面积不失真 */
  conic: unknown;
  /** 墨卡托：网页地图常见，高纬度会放大 */
  mercator: unknown;
  /** Natural Earth：世界地图，形状与面积都比较自然 */
  naturalEarth: unknown;
  /** Equal Earth：世界地图，面积准确 */
  equalEarth: unknown;
  /** 正射（地球仪）：以数据为中心看半个地球 */
  orthographic: unknown;
}

/** d3 的投影（TopoJSONMap 的 projection） */
export type MapGeoProjection = NonNullable<TopoJSONMapConfigInterface<MapArea>['projection']>;

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface MapChartProps extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 地理数据（TopoJSON），如 `@unovis/ts/maps` 的 ChinaTopoJSON、WorldMapTopoJSON */
  topology: NonNullable<TopoJSONMapConfigInterface<MapArea>['topojson']>;
  /** 画哪一组要素（TopoJSON 的 objects 里的名字），如中国省份是 'provinces'、世界是 'countries' */
  feature: string;
  /** 投影：预设的名字，或 d3 的投影；不写时按数据的范围选 conic 或 naturalEarth */
  projection?: keyof MapProjections | MapGeoProjection;
  /** 投影的中心 [经度, 纬度]：中央经线（世界地图写 [150, 0] 以太平洋为中心），orthographic 还用纬度；不写时取地理数据范围的中心 */
  center?: readonly [number, number];
  /** 各区域的数值 */
  areas?: readonly MapArea[];
  /** 地点 */
  points?: readonly MapPoint[];
  /** 地点之间的流向 */
  links?: readonly MapLink[];
  /** 着色方式：sequential 按数值深浅（默认），diverging 以 midpoint 为界两头两种颜色 */
  scheme?: 'sequential' | 'diverging';
  /** sequential 的基色，默认 accent */
  color?: ChartColor;
  /** diverging 的两头 [低, 高]，默认 ['danger', 'success'] */
  divergingColors?: readonly [ChartColor, ChartColor];
  /** diverging 的分界，默认 0 */
  midpoint?: number;
  /** 分成几档（分级着色）；不写时连续着色 */
  bins?: number;
  /** 在区域上写名字（区域够大时） */
  areaLabels?: boolean;
  /** 流向上有流动的粒子 */
  flow?: boolean;
  /** 数值的格式 */
  valueFormat?: NumericFormat;
  /** 单位：显示在左上方，提示框与数据表的数值后面带上 */
  unit?: string;
  /**
   * 绘图区的高度；数字按 px
   * @default 400
   */
  height?: number | string;
  /** 可以拖动、滚轮缩放，右上角有放大、缩小、复位的按钮；默认关（不抢页面的滚动） */
  zoomable?: boolean;
  /** 加载中：绘图区显示骨架 */
  loading?: boolean;
  /** 没有数据时显示的内容 */
  empty?: VNodeChild;
  /** 悬停时的提示框，默认 true */
  tooltip?: boolean;
  /** 点了一个有数据的区域 */
  onAreaClick?: (area: MapArea) => void;
  /** 点了一个地点 */
  onPointClick?: (point: MapPoint) => void;
}

/** MapChart 的样式 */
export const mapChartStyles = css.create({
  // 地图跟随主题：底色、边界是表面色，文字是正文色
  root: {
    '--vis-map-feature-color': colors.fill,
    '--vis-map-boundary-color': colors.surface,
    '--vis-map-point-label-text-color-dark': colors.text,
    '--vis-map-point-label-text-color-light': colors.text,
    '--vis-map-area-label-text-color': colors.text,
    '--vis-map-area-label-font-size': '10px',
    '--vis-map-area-label-font-weight': '400',
    '--vis-map-point-default-stroke-color': colors.surface,
    '--vis-map-point-default-stroke-width': '1.5px',
  },
  skeleton: { display: 'block', width: '100%', height: '100%' },
  // 地点的标签：描一圈表面色的边，压在区域、连线上也看得清；字号、描边宽度随缩放在行内设置
  pointLabels: {
    fontWeight: 600,
    fill: colors.text,
    stroke: colors.surface,
    paintOrder: 'stroke',
    strokeLinejoin: 'round',
    pointerEvents: 'none',
  },
  leader: { stroke: colors.textMuted },
  // 缩放按钮：在标题行的结束边（导出菜单前面）
  zoom: { display: 'inline-flex', alignItems: 'center', gap: '2px', marginInlineStart: 'auto' },
  wheelHint: { marginInlineEnd: '_sm', color: '_textMuted', fontSize: '_xs' },
  // 图例：连续是色带，分档是一排色块
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '_md',
    rowGap: '_xs',
    fontSize: '_xs',
    color: '_textMuted',
    paddingInline: '_sm',
  },
  ramp: { flexGrow: 1, maxWidth: '16rem', height: '0.5rem', borderRadius: '_full' },
  rampColors: (gradient: string) => ({ backgroundImage: gradient }),
  bin: { display: 'inline-flex', alignItems: 'center', gap: '0.375em', whiteSpace: 'nowrap' },
  swatch: { width: '0.875rem', height: '0.625rem', borderRadius: '2px' },
  swatchColor: (color: string) => ({ backgroundColor: color }),
});

/** 地点的标签四周留的空（屏幕像素） */
const labelPadding = 3;

/** 新建一个 SVG 元素 */
const svgElement = <K extends keyof SVGElementTagNameMap>(name: K) =>
  document.createElementNS('http://www.w3.org/2000/svg', name);

/** 混色：基色占 percent，其余透明（落在底色上） */
const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${Math.round(percent)}%, transparent)`;

type MapTopology = MapChartProps['topology'];

/** 算好了各点权重的地理数据：同一份 TopoJSON 只算一次 */
const presimplified = new WeakMap<MapTopology, MapTopology>();
/**
 * 简化过的地理数据放进这个类的实例：Unovis 的 setConfig 深拷贝配置，但跳过类的实例，
 * 每次更新就不必把整份 TopoJSON 再拷一遍
 */
class SharedTopology {}

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
    // topojson-simplify 的类型里要素属性不能是 null（GeoJSON 允许）：边界上转一下
    type Input = Parameters<typeof presimplify>[0];
    let weighted = presimplified.get(topology);
    if (!weighted)
      presimplified.set(topology, (weighted = presimplify(topology as Input) as MapTopology));
    result = Object.assign(new SharedTopology(), simplify(weighted as Input, level)) as MapTopology;
    byLevel.set(level, result);
  }
  return result;
}

/** TopoJSON 的经纬度范围 [西, 南, 东, 北]：有 bbox 用它，否则解出各段弧的坐标（量化的弧是逐点的差值） */
export function topologyBounds(
  topology: MapChartProps['topology'],
): [number, number, number, number] {
  if (topology.bbox) {
    const [west, south, east, north] = topology.bbox;
    return [west, south, east, north];
  }
  const quantized = topology.transform;
  const [scaleX, scaleY] = quantized?.scale ?? [1, 1];
  const [translateX, translateY] = quantized?.translate ?? [0, 0];
  let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const arc of topology.arcs) {
    let x = 0;
    let y = 0;
    for (const position of arc) {
      x = quantized ? x + position[0]! : position[0]!;
      y = quantized ? y + position[1]! : position[1]!;
      const longitude = x * scaleX + translateX;
      const latitude = y * scaleY + translateY;
      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
    }
  }
  return [west, south, east, north];
}

/** 地图 */
export const MapChart = _component(
  ({
    topology,
    feature,
    projection,
    center,
    areas = [],
    points = [],
    links = [],
    scheme = 'sequential',
    color = 'accent',
    divergingColors = ['danger', 'success'],
    midpoint = 0,
    bins,
    areaLabels = false,
    flow = false,
    valueFormat,
    unit,
    height = 400,
    zoomable = false,
    loading = false,
    empty,
    tooltip = true,
    onAreaClick,
    onPointClick,
    sx,
    ...rest
  }: MapChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const bounds = _derived(topologyBounds(topology));
    const numbers = _derived(
      areas.flatMap((area) => (area.value === undefined ? [] : [toNumber(area.value)])),
    );
    const extent = _derived<[number, number] | null>(
      numbers.length ? [Math.min(...numbers), Math.max(...numbers)] : null,
    );
    const largest = (values: readonly { value?: NumericValue }[]) =>
      Math.max(0, ...values.map((item) => (item.value === undefined ? 0 : toNumber(item.value))));
    const valueText = (value: NumericValue | undefined) =>
      value === undefined
        ? lang.emptyValue
        : format.number(value, unit ? { ...valueFormat, suffix: unit } : valueFormat);
    const numberText = (value: number) => format.number(value, valueFormat);

    /** 数值 → 颜色：sequential 从 12% 到 100%；diverging 两头各自从分界往外加深；bins 时按档取 */
    function colorOf(value: number): string {
      const [low, high] = extent ?? [0, 0];
      if (scheme === 'diverging') {
        const [lowColor, highColor] = divergingColors.map((item) => resolveColor(item, 0));
        const reach = Math.max(midpoint - low, high - midpoint) || 1;
        let ratio = Math.min(Math.abs(value - midpoint) / reach, 1);
        if (bins) ratio = Math.max(Math.ceil(ratio * bins), 1) / bins;
        return tint(value < midpoint ? lowColor! : highColor!, 12 + ratio * 88);
      }
      let ratio = high === low ? 1 : (value - low) / (high - low);
      if (bins) ratio = Math.min(Math.floor(ratio * bins), bins - 1) / Math.max(bins - 1, 1);
      return tint(resolveColor(color, 0), 12 + ratio * 88);
    }
    const areaColor = (area: MapArea) =>
      area.color
        ? resolveColor(area.color, 0)
        : area.value === undefined
          ? undefined
          : colorOf(toNumber(area.value));

    /** 投影：预设按中心旋转；不写时按范围选 */
    function createProjection(): MapGeoProjection {
      if (projection && typeof projection !== 'string') return projection;
      const [west, south, east, north] = bounds;
      const [longitude, latitude] = center ?? [(west + east) / 2, (south + north) / 2];
      const kind = projection ?? (east - west > 180 ? 'naturalEarth' : 'conic');
      if (kind === 'conic')
        // 标准纬线取范围的 1/6 与 5/6 处（中国约是 25°、47°），中央经线是中心
        return MapProjection.ConicEqualArea()
          .rotate([-longitude, 0])
          .parallels([south + (north - south) / 6, north - (north - south) / 6]);
      if (kind === 'orthographic')
        return MapProjection.Orthographic().rotate([-longitude, -latitude]);
      const create =
        kind === 'mercator'
          ? MapProjection.Mercator
          : kind === 'equalEarth'
            ? MapProjection.EqualEarth
            : MapProjection.NaturalEarth1;
      return create().rotate([-longitude, 0]);
    }

    // Unovis 只在第一次画时按绘图区适配投影（之后变了大小也会），换上的新投影只沿用旧的比例与平移，地图会画歪、画小；
    // 所以投影的输入（预设、中心、范围、自己的投影）变了就换一个新的 TopoJSONMap，第一次画时由它自己适配
    let mapKey: unknown[] = [];
    let generation = 0;
    let mapProjection: MapGeoProjection | undefined;
    function updateProjection() {
      const key = [projection, center?.[0], center?.[1], ...bounds];
      if (key.some((item, index) => item !== mapKey[index])) {
        if (mapKey.length) {
          map?.destroy();
          generation += 1;
        }
        mapKey = key;
        mapProjection = createProjection();
      }
    }

    // Unovis 每次绘制都把整份 TopoJSON 投影成路径：自带的中国省份有 3.5 万个点，画在几百像素里大多看不出来。
    // 按绘图区里一像素对应的经纬度简化（三角形不到一平方像素的点去掉），绘制快一个数量级；
    // 能缩放时留到放大一倍也看不出折角
    function drawnTopology(): MapTopology {
      const width = plot?.clientWidth ?? 0;
      const height = plot?.clientHeight ?? 0;
      if (!width || !height) return topology;
      const [west, south, east, north] = bounds;
      const degreesPerPixel =
        Math.max((east - west) / width, (north - south) / height) / (zoomable ? 2 : 1);
      return simplifyTopology(topology, degreesPerPixel ** 2);
    }

    const pointOf = (id: string) => points.find((point) => point.id === id);
    /** Unovis 画连线时给的是 { source, target }（克隆过的地点），不是原来的流向：按两端的 id 找回 */
    const linkOf = (drawn: MapLink) => {
      const { source, target } = drawn as unknown as { source: MapPoint; target: MapPoint };
      return links.find((link) => link.from === source.id && link.to === target.id);
    };
    let map: TopoJSONMap<MapArea, MapPoint, MapLink> | undefined;
    let plot = _state.raw<HTMLElement | null>(null);

    const pointMax = _derived(largest(points));
    // 面积按数值比例：半径 3–8 px
    const radiusOf = (point: MapPoint) =>
      point.value === undefined || pointMax === 0
        ? 4
        : 3 + Math.sqrt(toNumber(point.value) / pointMax) * 5;

    let labelFrame = 0;
    /** 画完、缩放之后，下一帧重排地点的标签 */
    function scheduleLabels() {
      cancelAnimationFrame(labelFrame);
      labelFrame = requestAnimationFrame(layoutLabels);
    }
    _effect(() => () => cancelAnimationFrame(labelFrame));

    /**
     * 地点的标签：Unovis 的标签相撞时只会藏起来，这里用 placeLabels 挪到放得下的方位（挤时画引线），
     * 画在地点那一组里（跟着缩放、拖动）；压在标签、地点上的区域名藏起来。
     * 按屏幕像素算：地点那一组的坐标乘缩放级别
     */
    function layoutLabels() {
      const root = map?.g.node();
      const group = root?.querySelector<SVGGElement>(`.${TopoJSONMap.selectors.points}`);
      const svg = group?.ownerSVGElement;
      if (!root || !group || !svg || !mapProjection) return;
      const projectionAt = mapProjection;
      const zoom = Number(svg.style.getPropertyValue('--vis-map-current-zoom-level')) || 1;
      const layer =
        group.querySelector<SVGGElement>(':scope > [data-point-labels]') ?? svgElement('g');
      layer.setAttribute('data-point-labels', '');
      layer.setAttribute('class', css.attrs(mapChartStyles.pointLabels).class ?? '');
      layer.style.fontSize = `${11 / zoom}px`;
      layer.style.strokeWidth = `${3 / zoom}px`;
      // 放在最后：之后加入的地点不会盖住标签
      group.append(layer);

      const items = points.flatMap((point) => {
        const position = projectionAt([point.longitude, point.latitude]);
        if (!position || !point.label) return [];
        const text = svgElement('text');
        text.textContent = point.label;
        text.setAttribute('text-anchor', 'middle');
        return [{ point, text, x: position[0] * zoom, y: position[1] * zoom }];
      });
      layer.replaceChildren(...items.map((item) => item.text));
      // 在原点量字形的框：中文字体的行高、基线的位置各浏览器不同，摆放时按量到的上沿对齐
      const glyphs = items.map((item) => item.text.getBBox());
      const anchors = items.map((item, index) => {
        const box = glyphs[index]!;
        return {
          x: item.x,
          y: item.y,
          radius: radiusOf(item.point),
          // 四周留出描边（1.5 px）与一点空隙；Firefox 量到的框比字形的墨迹窄一点
          width: box.width * zoom + labelPadding * 2,
          height: box.height * zoom + labelPadding * 2,
          priority: item.point.value === undefined ? 0 : toNumber(item.point.value),
        };
      });

      const areaTexts = [
        ...root.querySelectorAll<SVGTextElement>(`text.${TopoJSONMap.selectors.areaLabel}`),
      ].filter((text) => text.getAttribute('visibility') !== 'hidden');
      const areaBoxes = areaTexts.map((text): LabelRect => {
        text.style.display = '';
        const { e, f } = text.transform.baseVal.consolidate()?.matrix ?? { e: 0, f: 0 };
        const box = text.getBBox();
        return {
          x: (e + box.x) * zoom,
          y: (f + box.y) * zoom,
          width: box.width * zoom,
          height: box.height * zoom,
        };
      });
      // 没放大时整张图在绘图区里：标签也不出界；放大后本来就只看得到一部分
      const bounds =
        zoom === 1 ? { x: 0, y: 0, width: svg.clientWidth, height: svg.clientHeight } : undefined;
      const placements = placeLabels(anchors, { bounds, soft: areaBoxes });

      const taken: LabelRect[] = anchors.map((anchor) => ({
        x: anchor.x - anchor.radius,
        y: anchor.y - anchor.radius,
        width: anchor.radius * 2,
        height: anchor.radius * 2,
      }));
      placements.forEach((placement, index) => {
        const { text } = items[index]!;
        if (!placement) {
          text.remove();
          return;
        }
        const { box, leader } = placement;
        taken.push(box);
        text.setAttribute('x', String((box.x + box.width / 2) / zoom));
        text.setAttribute('y', String((box.y + labelPadding) / zoom - glyphs[index]!.y));
        if (leader) layer.insertBefore(leaderLine(anchors[index]!, box, zoom), text);
      });
      areaTexts.forEach((text, index) => {
        if (taken.some((rect) => rectsOverlap(rect, areaBoxes[index]!)))
          text.style.display = 'none';
      });
    }

    /** 引线：从标记的边到标签矩形上离标记最近的点 */
    function leaderLine(
      anchor: { x: number; y: number; radius: number },
      box: LabelRect,
      zoom: number,
    ) {
      const toX = Math.min(Math.max(anchor.x, box.x), box.x + box.width);
      const toY = Math.min(Math.max(anchor.y, box.y), box.y + box.height);
      const length = Math.hypot(toX - anchor.x, toY - anchor.y) || 1;
      const line = svgElement('line');
      line.setAttribute('class', css.attrs(mapChartStyles.leader).class ?? '');
      line.setAttribute(
        'x1',
        String((anchor.x + ((toX - anchor.x) / length) * anchor.radius) / zoom),
      );
      line.setAttribute(
        'y1',
        String((anchor.y + ((toY - anchor.y) / length) * anchor.radius) / zoom),
      );
      line.setAttribute('x2', String(toX / zoom));
      line.setAttribute('y2', String(toY / zoom));
      line.style.strokeWidth = `${1 / zoom}px`;
      return line;
    }
    const chart: SingleChart = useSingleChart<MapGraphData<MapArea, MapPoint, MapLink>>(() => ({
      element: plot,
      ready: !loading,
      tooltip,
      build: (instance) => {
        const linkMax = largest(links);
        updateProjection();
        map = instance(`map-${generation}`, () => {
          const created = new TopoJSONMap<MapArea, MapPoint, MapLink>();
          // 热力模式的滤镜是写死的 id="heatmapFilter"，一页多张地图时 id 重复；不用热力模式，去掉
          created.g.select('filter#heatmapFilter').remove();
          // 缩放时 Unovis 把缩放级别写到 svg 的 style 上：跟着重排标签（拖动只是平移，标签随地点那一组走）
          const observer = new MutationObserver(scheduleLabels);
          queueMicrotask(() => {
            const svg = created.g.node()?.parentElement;
            if (svg) observer.observe(svg, { attributes: true, attributeFilter: ['style'] });
          });
          const destroy = created.destroy.bind(created);
          created.destroy = () => {
            observer.disconnect();
            destroy();
          };
          return created;
        });
        map.setConfig({
          topojson: drawnTopology(),
          mapFeatureName: feature,
          projection: mapProjection,
          disableZoom: !zoomable,
          areaId: (area) => area.id,
          areaColor,
          areaLabel: areaLabels ? (area) => area.label : undefined,
          areaCursor: onAreaClick ? () => 'pointer' : undefined,
          pointId: (point) => point.id,
          longitude: (point) => point.longitude,
          latitude: (point) => point.latitude,
          pointColor: (point) => resolveColor(point.color ?? 'danger', 0),
          pointRadius: radiusOf,
          pointShape: (point) => point.shape ?? 'circle',
          pointCursor: onPointClick ? () => 'pointer' : undefined,
          // 名字由 layoutLabels 自己画（pointLabel 写在点里面，pointBottomLabel 相撞时只会藏起来）
          pointLabel: () => '',
          pointBottomLabel: () => '',
          // 两端给 id：Unovis 克隆了地点，按对象找不到
          linkSource: (link) => link.from,
          linkTarget: (link) => link.to,
          linkColor: (drawn) => resolveColor(linkOf(drawn)?.color ?? 'neutral', 0),
          linkWidth: (drawn) => {
            const value = linkOf(drawn)?.value;
            return value === undefined || linkMax === 0 ? 1.5 : 1 + (toNumber(value) / linkMax) * 4;
          },
          enableFlowAnimation: flow,
          // 流动的粒子按原来的流向画，两端的经纬度直接给；起点已经有地点的标记，不再加一个
          sourceLongitude: (link) => pointOf(link.from)?.longitude,
          sourceLatitude: (link) => pointOf(link.from)?.latitude,
          targetLongitude: (link) => pointOf(link.to)?.longitude,
          targetLatitude: (link) => pointOf(link.to)?.latitude,
          sourcePointRadius: 0,
          flowParticleColor: (link) => resolveColor(link.color ?? 'accent', 0),
          flowParticleRadius: 2,
          // 每经度 0.15 个粒子：默认的 0.6 太密，连成一条线盖住了连线
          flowParticleDensity: 0.15,
          events: {
            [TopoJSONMap.selectors.feature]: {
              click: (shape: { data?: MapArea }) => {
                if (shape.data) onAreaClick?.(shape.data);
              },
            },
            [TopoJSONMap.selectors.point]: {
              click: (point: MapPoint) => onPointClick?.(point),
            },
          },
        });
        return {
          component: map,
          onRender: scheduleLabels,
          data: {
            areas: [...areas],
            points: [...points],
            links: links.filter((link) => pointOf(link.from) && pointOf(link.to)),
          },
          triggers: {
            [TopoJSONMap.selectors.feature]: (shape: { data?: MapArea }) =>
              shape.data
                ? chart.tooltip(
                    chartTooltip(shape.data.label, [
                      {
                        label: lang.chartValue,
                        color: areaColor(shape.data) ?? 'transparent',
                        value: valueText(shape.data.value),
                      },
                    ]),
                  )
                : undefined,
            [TopoJSONMap.selectors.point]: (point: MapPoint) =>
              chart.tooltip(
                chartTooltip(point.label, [
                  {
                    label: lang.chartValue,
                    color: resolveColor(point.color ?? 'danger', 0),
                    value: valueText(point.value),
                  },
                ]),
              ),
          },
        };
      },
    }));

    /** 图例：分档时每档一个色块与范围，连续时一条色带两端写最小最大 */
    function legend() {
      if (!extent || areas.every((area) => area.color)) return null;
      const [low, high] = extent;
      if (bins) {
        const step = (high - low) / bins;
        return (
          <div {...css.attrs(mapChartStyles.legend)} aria-hidden="true">
            {Array.from({ length: bins }, (_, index) => {
              const from = low + step * index;
              const to = index === bins - 1 ? high : from + step;
              return (
                <span key={index} {...css.attrs(mapChartStyles.bin)}>
                  <span
                    {...css.attrs(
                      mapChartStyles.swatch,
                      mapChartStyles.swatchColor(colorOf((from + to) / 2)),
                    )}
                  />
                  {numberText(from)} – {numberText(to)}
                </span>
              );
            })}
          </div>
        );
      }
      const stops =
        scheme === 'diverging'
          ? [colorOf(low), colors.fill, colorOf(high)]
          : [colorOf(low), colorOf(high)];
      return (
        <div {...css.attrs(mapChartStyles.legend)} aria-hidden="true">
          <span>{numberText(low)}</span>
          <span
            {...css.attrs(
              mapChartStyles.ramp,
              mapChartStyles.rampColors(`linear-gradient(to right, ${stops.join(', ')})`),
            )}
          />
          <span>{numberText(high)}</span>
        </div>
      );
    }

    // 滚轮默认滚动页面，按住 Ctrl（或 ⌘、触控板捏合）才缩放地图（同 Google 地图的 cooperative 手势）：
    // 否则滚动页面经过地图时会把地图缩小。拦下的滚轮在顶栏提示一下
    let wheelHint = _state(false);
    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    useEventListener(
      () => (zoomable ? plot : null),
      'wheel',
      (event) => {
        if (event.ctrlKey || event.metaKey) return;
        event.stopPropagation();
        wheelHint = true;
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => (wheelHint = false), 1500);
      },
      { capture: true },
    );
    _effect(() => () => clearTimeout(hintTimer));

    /** 缩放按钮：放大、缩小、复位；前面是滚轮的提示 */
    const zoomButtons = () => (
      <span {...css.attrs(mapChartStyles.zoom)}>
        {wheelHint && (
          <span {...css.attrs(mapChartStyles.wheelHint)} role="status">
            {lang.chartZoomWheelHint}
          </span>
        )}
        {(
          [
            [Plus, lang.chartZoomIn, () => map?.zoomIn()],
            [Minus, lang.chartZoomOut, () => map?.zoomOut()],
            [Maximize, lang.chartZoomFit, () => map?.fitView()],
          ] as const
        ).map(([icon, label, action]) => (
          <IconButton
            key={label}
            icon={icon}
            size="sm"
            variant="ghost"
            tone="neutral"
            aria-label={label}
            onClick={action}
          />
        ))}
      </span>
    );

    return () => (
      <ChartFrame
        {...rest}
        sx={[mapChartStyles.root, sx]}
        unit={unit}
        height={height}
        legend={[]}
        hiddenKeys={[]}
        onLegendToggle={() => {}}
        loading={loading}
        skeleton={<Skeleton sx={mapChartStyles.skeleton} />}
        isEmpty={false}
        empty={empty}
        actions={zoomable ? zoomButtons() : undefined}
        footer={legend()}
        table={{
          columns: [lang.chartCategory, unit ? `${lang.chartValue}（${unit}）` : lang.chartValue],
          rows: [
            ...areas.map((area) => ({ header: area.label, value: area.value })),
            ...points.map((point) => ({ header: point.label, value: point.value })),
            ...links.map((link) => ({
              header: lang.chartFlowLabel(
                pointOf(link.from)?.label ?? link.from,
                pointOf(link.to)?.label ?? link.to,
              ),
              value: link.value,
            })),
          ].map((row) => ({
            header: row.header,
            cells: [
              row.value === undefined ? lang.emptyValue : format.number(row.value, valueFormat),
            ],
          })),
        }}
        plotRef={(element) => (plot = element)}
      />
    );
  },
);
