/**
 * 地图：按区域着色（分省的销售额、各国的采购额），标出地点（工厂、供应商）与它们之间的流向。
 * 地理数据是 TopoJSON：`@zerodep-dev/vue-tsx-pro-ui/maps` 带着中国省份与世界各国，也可以用自己的。
 *
 *   import { chinaProvinces } from '@zerodep-dev/vue-tsx-pro-ui/maps';
 *   <MapChart
 *     aria-label="各省销售额"
 *     topology={chinaProvinces}
 *     feature="provinces"
 *     areas={[{ id: 'CN-JS', label: '江苏', value: 623 }, …]}   // id 是地图要素的 id
 *     points={[{ id: 'sh', label: '上海组装', longitude: 121.47, latitude: 31.23, value: 860 }]}
 *     links={[{ from: 'xa', to: 'sh', value: 120 }]}
 *     bins={5}
 *     areaLabels
 *   />
 *
 * 投影（见 createProjection）：默认按地理数据的范围选——一个国家、一个地区用以它为中心的等积圆锥投影
 * （中国地图常用的 Albers，正着、不歪），跨了大半个地球时用 Natural Earth；也可以指定 mercator、equalEarth、
 * equirectangular、orthographic（地球仪）或自己的投影函数（d3-geo 的投影可以直接传）。
 * 地理数据先按绘图区的像素简化（看不出的点去掉），再投影、按绘图区缩放居中。
 *
 * 着色：sequential（默认）按数值深浅；diverging 以 midpoint 为界两头两种颜色（同比的涨跌）；
 * bins 分成几档（分级着色，图例是几个色块），不写时连续着色（图例是色带）；区域写了 color 时按它（分类着色）。
 * 没有数据的区域是底色。地点：value 决定大小（面积按比例），color、shape 决定颜色与形状；名字自动避让
 * （换方位、挤时往外退并画引线，数值大的先放，放不下的悬停看；压住名字、地点的区域名藏起来）；
 * links 是地点之间的流向，粗细按 value，flow 时有流动的粒子（“减少动态效果”时不播）。
 * zoomable 时可以拖动、按住 Ctrl 滚轮缩放，右上角有放大、缩小、复位的按钮；缩放时区域放大，地点与文字保持原来的大小。
 * 悬停看名称与数值；读屏的数据表列出各区域、地点与流向。
 */
import { Maximize, Minus, Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { shallowRef, type VNodeChild } from 'vue';
import { IconButton } from '../base/IconButton';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { colors, t } from '../config/theme/tokens';
import { Skeleton } from '../feedback/Skeleton';
import { svgNumber } from '../utils/data/number';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import { useReducedMotion } from '../utils/dom/media-query';
import { usePanZoom } from '../utils/dom/pan-zoom';
import type { PartProps } from '../utils/props';
import { chartTooltip, ChartFrame, type ChartFrameParts } from './frame';
import { createProjection, type MapGeoProjection, type MapProjectionName } from './geo/projection';
import {
  simplifyTopology,
  topologyBounds,
  topologyFeatures,
  type MapTopology,
} from './geo/topojson';
import { placeLabels, rectsOverlap, type LabelRect } from './label-layout';
import { ChartTooltipBox, chartSvgStyles, pointerIn, usePlotArea, type ChartTip } from './plot';
import { resolveColor, type ChartColor } from './series';
import { estimateTextWidth } from './text-size';

/** 一个区域的数据 */
export interface MapArea {
  /** 地图要素的 id（中国省份是 'CN-JS' 这样的写法，世界各国是 ISO 两位代码） */
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
  /** 名称：写在点旁边 */
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
  /** 等距圆柱：经纬度直接当横纵坐标，经纬网是方格 */
  equirectangular: unknown;
  /** 正射（地球仪）：以数据为中心看半个地球 */
  orthographic: unknown;
}

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface MapChartProps extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 地理数据（TopoJSON），如 `@zerodep-dev/vue-tsx-pro-ui/maps` 的 chinaProvinces、worldCountries */
  topology: MapTopology;
  /** 画哪一组要素（TopoJSON 的 objects 里的名字），如中国省份是 'provinces'、世界是 'countries' */
  feature: string;
  /** 投影：预设的名字，或自己的投影函数（[经度, 纬度] → [x, y]）；不写时按数据的范围选 conic 或 naturalEarth */
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
  /** 可以拖动、按住 Ctrl 滚轮缩放，右上角有放大、缩小、复位的按钮；默认关（不抢页面的滚动） */
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
  skeleton: { display: 'block', width: '100%', height: '100%' },
  viewport: { position: 'absolute', inset: 0 },
  // 地图跟随主题：底色、边界是表面色；缩放时边界不跟着变粗
  feature: {
    stroke: '_surface',
    strokeWidth: 0.8,
    fillRule: 'evenodd',
    transition: `fill ${t.durations.md} ${t.easings.standard}`,
  },
  featureHover: {
    fill: 'none',
    stroke: '_text',
    strokeWidth: 1.5,
    pointerEvents: 'none',
  },
  sphere: { fill: '_surfaceMuted', stroke: '_border', strokeWidth: 1 },
  link: { fill: 'none', strokeOpacity: 0.7, strokeLinecap: 'round', pointerEvents: 'none' },
  particle: { pointerEvents: 'none' },
  point: { stroke: '_surface', strokeWidth: 1.5 },
  clickable: { cursor: 'pointer' },
  // 地点的名字：描一圈表面色的边，压在区域、连线上也看得清
  pointLabel: { fill: '_text', fontSize: '11px', fontWeight: '_semibold' },
  areaLabel: { fill: '_text', fontSize: '10px' },
  leader: { stroke: '_textMuted', strokeWidth: 1 },
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

/** 地点名字的字号、区域名的字号（px） */
const POINT_FONT = 11;
const AREA_FONT = 10;
/** 地点的名字四周留的空（px） */
const LABEL_PADDING = 3;
/** 地图与绘图区边缘的距离（px） */
const FIT_PADDING = 8;

/** 混色：基色占 percent，其余透明（落在底色上） */
const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${Math.round(percent)}%, transparent)`;

/** 一组环写成路径；坐标保留一位小数（像素） */
function ringsPath(rings: readonly (readonly (readonly [number, number])[])[]): string {
  const round = (value: number) => Math.round(value * 10) / 10;
  return rings
    .map((ring) => `M${ring.map(([x, y]) => `${round(x)},${round(y)}`).join('L')}Z`)
    .join('');
}

/** 地点的标记：中心在 (x, y)、半径 r 的路径 */
function markerPath(shape: MapPoint['shape'], x: number, y: number, r: number): string {
  const [cx, cy] = [svgNumber(x), svgNumber(y)];
  if (shape === 'square') {
    const half = svgNumber(r * 0.9);
    return `M${cx - half},${cy - half}h${half * 2}v${half * 2}h${-half * 2}Z`;
  }
  if (shape === 'triangle') {
    const h = svgNumber(r * 1.15);
    return `M${cx},${svgNumber(cy - h)}L${svgNumber(cx + h)},${svgNumber(cy + h * 0.75)}L${svgNumber(cx - h)},${svgNumber(cy + h * 0.75)}Z`;
  }
  return `M${svgNumber(cx - r)},${cy}A${r},${r},0,1,1,${svgNumber(cx + r)},${cy}A${r},${r},0,1,1,${svgNumber(cx - r)},${cy}Z`;
}

/** 悬停的区域或地点 */
interface MapHover {
  kind: 'feature' | 'point';
  index: number;
  x: number;
  y: number;
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
    ...rest
  }: MapChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const area = usePlotArea();
    const reducedMotion = useReducedMotion();
    const viewport = shallowRef<HTMLElement | null>(null);
    let hovered = _state.raw<MapHover | null>(null);
    const bounds = _derived(topologyBounds(topology));
    const numbers = _derived(
      areas.flatMap((item) => (item.value === undefined ? [] : [toNumber(item.value)])),
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
    const areaById = _derived(new Map(areas.map((item) => [item.id, item])));
    const pointById = _derived(new Map(points.map((point) => [point.id, point])));

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
    const areaColor = (item: MapArea | undefined) =>
      !item
        ? undefined
        : item.color
          ? resolveColor(item.color, 0)
          : item.value === undefined
            ? undefined
            : colorOf(toNumber(item.value));

    const pointMax = _derived(largest(points));
    // 面积按数值比例：半径 3–8 px
    const radiusOf = (point: MapPoint) =>
      point.value === undefined || pointMax === 0
        ? 4
        : 3 + Math.sqrt(toNumber(point.value) / pointMax) * 5;

    // 滚轮默认滚动页面，按住 Ctrl（或 ⌘、触控板捏合）才缩放地图（同 Google 地图的 cooperative 手势）：
    // 否则滚动页面经过地图时会把地图缩小。拦下的滚轮在顶栏提示一下
    let wheelHint = _state(false);
    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    _effect(() => () => clearTimeout(hintTimer));
    const view = usePanZoom({
      viewport: () => viewport.value,
      min: 1,
      max: 12,
      step: 1.5,
      disabled: () => !zoomable,
      filter: (event) => {
        if (event instanceof WheelEvent && !event.ctrlKey && !event.metaKey) {
          wheelHint = true;
          clearTimeout(hintTimer);
          hintTimer = setTimeout(() => (wheelHint = false), 1500);
          return false;
        }
        return true;
      },
    });

    /** 投影：预设按中心旋转；不写时按范围选 */
    const projector = _derived.by(() => {
      const [west, south, east, north] = bounds;
      const middle = center ?? [(west + east) / 2, (south + north) / 2];
      const name: MapProjectionName | MapGeoProjection =
        projection ?? (east - west > 180 ? 'naturalEarth' : 'conic');
      return createProjection(name, { center: middle, bounds });
    });

    /**
     * 区域的路径：按绘图区里一像素对应的经纬度简化（三角形不到一平方像素的点去掉；能缩放时留到放大一倍也看不出折角），
     * 投影后按绘图区缩放、居中。地点、连线用同一个换算（toScreen）
     */
    const geometry = _derived.by(() => {
      const { width, height: plotHeight } = area;
      const [west, south, east, north] = bounds;
      const degreesPerPixel =
        width && plotHeight
          ? Math.max((east - west) / width, (north - south) / plotHeight) / (zoomable ? 2 : 1)
          : 0;
      const features = topologyFeatures(simplifyTopology(topology, degreesPerPixel ** 2), feature);
      const projected = features.map((item) => ({
        feature: item,
        // 简化后只剩一两个点的环（很小的岛）画不出来，也不能算进适配的范围，否则地图四周留空
        rings: item.polygons
          .flatMap((polygon) => projector.polygon(polygon))
          .filter((ring) => ring.length > 2),
      }));
      let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const item of projected)
        for (const ring of item.rings)
          for (const [x, y] of ring) {
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
          }
      const fits = Number.isFinite(x0) && x1 > x0 && y1 > y0;
      const k = fits
        ? Math.min(
            (width - FIT_PADDING * 2) / (x1 - x0),
            (plotHeight - FIT_PADDING * 2) / (y1 - y0),
          )
        : 1;
      const tx = fits ? (width - (x1 - x0) * k) / 2 - x0 * k : 0;
      const ty = fits ? (plotHeight - (y1 - y0) * k) / 2 - y0 * k : 0;
      const toScreen = ([x, y]: readonly [number, number]): [number, number] => [
        x * k + tx,
        y * k + ty,
      ];
      return {
        toScreen,
        sphere: projector.sphere && {
          ...projector.sphere,
          cx: tx,
          cy: ty,
          r: projector.sphere.r * k,
        },
        shapes: projected.map((item) => {
          const screen = item.rings.map((ring) => ring.map(toScreen));
          // 区域名写在最大的那一块的外接矩形中心
          let best: { box: LabelRect; size: number } | undefined;
          for (const ring of screen) {
            const xs = ring.map(([x]) => x);
            const ys = ring.map(([, y]) => y);
            const box = {
              x: Math.min(...xs),
              y: Math.min(...ys),
              width: Math.max(...xs) - Math.min(...xs),
              height: Math.max(...ys) - Math.min(...ys),
            };
            if (!best || box.width * box.height > best.size)
              best = { box, size: box.width * box.height };
          }
          return { id: item.feature.id, d: ringsPath(screen), box: best?.box };
        }),
      };
    });

    /** 缩放后屏幕上的位置：地点、连线、文字不随缩放变大，只跟着移动 */
    const zoomed = ([x, y]: readonly [number, number]): [number, number] => [
      x * view.scale + view.x,
      y * view.scale + view.y,
    ];

    /** 地点在屏幕上的位置；看不见（地球背面）的不画 */
    const placedPoints = _derived.by(() =>
      points.flatMap((point, index) => {
        const projected = projector.point([point.longitude, point.latitude]);
        if (!projected) return [];
        const [x, y] = zoomed(geometry.toScreen(projected));
        return [{ point, index, x, y, r: radiusOf(point) }];
      }),
    );

    /** 地点的名字：placeLabels 挪到放得下的方位（挤时画引线）；压住名字、地点的区域名藏起来 */
    const labels = _derived.by(() => {
      const anchors = placedPoints.map((item) => ({
        x: item.x,
        y: item.y,
        radius: item.r,
        width: estimateTextWidth(item.point.label, POINT_FONT) + LABEL_PADDING * 2,
        height: POINT_FONT * 1.25 + LABEL_PADDING * 2,
        priority: item.point.value === undefined ? 0 : toNumber(item.point.value),
      }));
      const areaBoxes = areaLabels
        ? geometry.shapes.flatMap((shape) => {
            const info = areaById.get(shape.id);
            if (!info || !shape.box) return [];
            const width = estimateTextWidth(info.label, AREA_FONT);
            const box = {
              x: shape.box.x * view.scale + view.x,
              y: shape.box.y * view.scale + view.y,
              width: shape.box.width * view.scale,
              height: shape.box.height * view.scale,
            };
            // 区域放不下名字时不写
            if (box.width < width + 4 || box.height < AREA_FONT + 4) return [];
            const rect = {
              x: box.x + box.width / 2 - width / 2,
              y: box.y + box.height / 2 - AREA_FONT / 2,
              width,
              height: AREA_FONT,
            };
            return [{ label: info.label, rect }];
          })
        : [];
      // 没放大时整张图在绘图区里：名字也不出界；放大后本来就只看得到一部分
      const placements = placeLabels(anchors, {
        bounds:
          view.scale === 1 ? { x: 0, y: 0, width: area.width, height: area.height } : undefined,
        soft: areaBoxes.map((item) => item.rect),
      });
      const taken: LabelRect[] = anchors.map((anchor) => ({
        x: anchor.x - anchor.radius,
        y: anchor.y - anchor.radius,
        width: anchor.radius * 2,
        height: anchor.radius * 2,
      }));
      for (const placement of placements) if (placement) taken.push(placement.box);
      return {
        points: placements.map((placement, index) => ({
          placement,
          anchor: anchors[index]!,
          item: placedPoints[index]!,
        })),
        areas: areaBoxes.filter((item) => !taken.some((rect) => rectsOverlap(rect, item.rect))),
      };
    });

    /** 连线：两个地点之间往上拱起的弧，粗细按数值 */
    const linkShapes = _derived.by(() => {
      const linkMax = largest(links);
      const byId = new Map(placedPoints.map((item) => [item.point.id, item]));
      return links.flatMap((link, index) => {
        const from = byId.get(link.from);
        const to = byId.get(link.to);
        if (!from || !to) return [];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy) || 1;
        // 法线朝上的那一侧：弧往上拱
        const [nx, ny] = dx >= 0 ? [dy / length, -dx / length] : [-dy / length, dx / length];
        const bend = length * 0.2;
        const cx = (from.x + to.x) / 2 + nx * bend;
        const cy = (from.y + to.y) / 2 + ny * bend;
        return [
          {
            link,
            index,
            length,
            d: `M${svgNumber(from.x)},${svgNumber(from.y)}Q${svgNumber(cx)},${svgNumber(cy)},${svgNumber(to.x)},${svgNumber(to.y)}`,
            width:
              link.value === undefined || linkMax === 0
                ? 1.5
                : 1 + (toNumber(link.value) / linkMax) * 4,
          },
        ];
      });
    });

    function onPointermove(event: PointerEvent) {
      const target = (event.target as Element).closest?.('[data-feature],[data-point]');
      if (!target) {
        hovered = null;
        return;
      }
      const { x, y } = pointerIn(event, viewport.value ?? (event.currentTarget as Element));
      const point = target.getAttribute('data-point');
      hovered =
        point === null
          ? { kind: 'feature', index: Number(target.getAttribute('data-feature')), x, y }
          : { kind: 'point', index: Number(point), x, y };
    }

    function onClick(event: MouseEvent) {
      const target = (event.target as Element).closest?.('[data-feature],[data-point]');
      if (!target) return;
      const point = target.getAttribute('data-point');
      if (point !== null) {
        onPointClick?.(points[Number(point)]!);
        return;
      }
      const shape = geometry.shapes[Number(target.getAttribute('data-feature'))];
      const info = shape && areaById.get(shape.id);
      if (info) onAreaClick?.(info);
    }

    function renderPlot() {
      const { width, height: plotHeight } = area;
      const { shapes, sphere } = geometry;
      const current = hovered;
      const hoveredShape = current?.kind === 'feature' ? shapes[current.index] : undefined;
      return (
        <svg width={width} height={plotHeight} {...css.attrs(chartSvgStyles.svg)} onClick={onClick}>
          <g
            data-part="features"
            transform={`translate(${svgNumber(view.x)} ${svgNumber(view.y)}) scale(${svgNumber(view.scale)})`}
            {...css.attrs(chartSvgStyles.fadeIn)}
          >
            {sphere && (
              <circle
                cx={sphere.cx}
                cy={sphere.cy}
                r={sphere.r}
                {...css.attrs(mapChartStyles.sphere)}
              />
            )}
            {shapes.map((shape, index) => {
              const info = areaById.get(shape.id);
              return (
                <path
                  key={`${shape.id}:${index}`}
                  data-part="feature"
                  data-feature={index}
                  d={shape.d}
                  vector-effect="non-scaling-stroke"
                  {...css.attrs(
                    mapChartStyles.feature,
                    chartSvgStyles.fill(areaColor(info) ?? colors.fill),
                    info && onAreaClick && mapChartStyles.clickable,
                  )}
                />
              );
            })}
            {hoveredShape && (
              <path
                d={hoveredShape.d}
                vector-effect="non-scaling-stroke"
                {...css.attrs(mapChartStyles.featureHover)}
              />
            )}
          </g>
          <g data-part="links">
            {linkShapes.map((shape) => {
              const tone = resolveColor(shape.link.color ?? 'neutral', 0);
              return (
                <path
                  key={shape.index}
                  data-part="link"
                  d={shape.d}
                  stroke-width={svgNumber(shape.width)}
                  {...css.attrs(mapChartStyles.link, chartSvgStyles.stroke(tone))}
                />
              );
            })}
            {flow &&
              !reducedMotion.value &&
              linkShapes.flatMap((shape) => {
                // 每 120px 一个粒子，速度约每秒 60px；错开起点，看起来连续流动
                const count = Math.max(1, Math.round(shape.length / 120));
                const duration = Math.max(1.5, shape.length / 60);
                const tone = resolveColor(shape.link.color ?? 'accent', 0);
                return Array.from({ length: count }, (_, k) => (
                  <circle
                    key={`${shape.index}:${k}`}
                    r={2}
                    {...css.attrs(mapChartStyles.particle, chartSvgStyles.fill(tone))}
                  >
                    <animateMotion
                      dur={`${svgNumber(duration)}s`}
                      begin={`${svgNumber(-(duration * k) / count)}s`}
                      repeatCount="indefinite"
                      // JSX 的类型里没有 animateMotion 的 path 属性
                      {...{ path: shape.d }}
                    />
                  </circle>
                ));
              })}
          </g>
          <g data-part="points">
            {placedPoints.map((item) => (
              <path
                key={item.point.id}
                data-part="point"
                data-point={item.index}
                d={markerPath(item.point.shape, item.x, item.y, item.r)}
                {...css.attrs(
                  mapChartStyles.point,
                  chartSvgStyles.fill(resolveColor(item.point.color ?? 'danger', 0)),
                  onPointClick && mapChartStyles.clickable,
                )}
              />
            ))}
          </g>
          <g data-part="area-labels" {...css.attrs(chartSvgStyles.noPointer)}>
            {labels.areas.map((item) => (
              <text
                key={item.label}
                x={svgNumber(item.rect.x + item.rect.width / 2)}
                y={svgNumber(item.rect.y + item.rect.height / 2)}
                text-anchor="middle"
                dominant-baseline="central"
                {...css.attrs(mapChartStyles.areaLabel, chartSvgStyles.halo)}
              >
                {item.label}
              </text>
            ))}
          </g>
          <g data-part="point-labels" {...css.attrs(chartSvgStyles.noPointer)}>
            {labels.points.map(({ placement, anchor, item }) => {
              if (!placement) return null;
              const { box, leader } = placement;
              // 引线：从标记的边到名字矩形上离标记最近的点
              const toX = Math.min(Math.max(anchor.x, box.x), box.x + box.width);
              const toY = Math.min(Math.max(anchor.y, box.y), box.y + box.height);
              const length = Math.hypot(toX - anchor.x, toY - anchor.y) || 1;
              return (
                <g key={item.point.id}>
                  {leader && (
                    <line
                      x1={svgNumber(anchor.x + ((toX - anchor.x) / length) * anchor.radius)}
                      y1={svgNumber(anchor.y + ((toY - anchor.y) / length) * anchor.radius)}
                      x2={svgNumber(toX)}
                      y2={svgNumber(toY)}
                      {...css.attrs(mapChartStyles.leader)}
                    />
                  )}
                  <text
                    x={svgNumber(box.x + box.width / 2)}
                    y={svgNumber(box.y + box.height / 2)}
                    text-anchor="middle"
                    dominant-baseline="central"
                    {...css.attrs(mapChartStyles.pointLabel, chartSvgStyles.halo)}
                  >
                    {item.point.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      );
    }

    const tip = (): ChartTip | null => {
      const current = hovered;
      if (!tooltip || !current) return null;
      if (current.kind === 'point') {
        const point = points[current.index];
        if (!point) return null;
        return {
          x: current.x,
          y: current.y,
          content: chartTooltip(point.label, [
            {
              label: lang.chartValue,
              color: resolveColor(point.color ?? 'danger', 0),
              value: valueText(point.value),
            },
          ]),
        };
      }
      const shape = geometry.shapes[current.index];
      const info = shape && areaById.get(shape.id);
      if (!info) return null;
      return {
        x: current.x,
        y: current.y,
        content: chartTooltip(info.label, [
          {
            label: lang.chartValue,
            color: areaColor(info) ?? 'transparent',
            value: valueText(info.value),
          },
        ]),
      };
    };

    /** 图例：分档时每档一个色块与范围，连续时一条色带两端写最小最大 */
    function legend() {
      if (!extent || areas.every((item) => item.color)) return null;
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
            [Plus, lang.chartZoomIn, () => view.zoomIn()],
            [Minus, lang.chartZoomOut, () => view.zoomOut()],
            [Maximize, lang.chartZoomFit, () => view.reset()],
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
            ...areas.map((item) => ({ header: item.label, value: item.value })),
            ...points.map((point) => ({ header: point.label, value: point.value })),
            ...links.map((link) => ({
              header: lang.chartFlowLabel(
                pointById.get(link.from)?.label ?? link.from,
                pointById.get(link.to)?.label ?? link.to,
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
        plotRef={area.ref}
        plot={
          area.ready ? (
            <div
              {...css.attrs(mapChartStyles.viewport)}
              {...(zoomable ? view.viewportProps : {})}
              ref={(element) => (viewport.value = element as HTMLElement | null)}
              onPointermove={(event: PointerEvent) => {
                // 平移缩放也要指针移动（两指捏合）：两个都调
                if (zoomable)
                  (view.viewportProps.onPointermove as (event: PointerEvent) => void)(event);
                onPointermove(event);
              }}
              onPointerleave={() => (hovered = null)}
            >
              {renderPlot()}
              <ChartTooltipBox tip={tip()} width={area.width} />
            </div>
          ) : null
        }
      />
    );
  },
);
