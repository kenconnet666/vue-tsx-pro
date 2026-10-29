/**
 * 绘图区的公共部分：量出绘图区的大小（ResizeObserver），SVG 图形的共用样式（网格、刻度文字、十字线、描边的标签、进场），
 * 坐标轴的刻度与网格线，跟着指针的提示框。各种图表在 ChartFrame 的绘图区里用它们画自己的 SVG。
 *
 *   const area = usePlotArea();
 *   <ChartFrame plotRef={area.ref} plot={area.ready && <svg width={area.width} height={area.height}>…</svg>} />
 *   chartAxis({ side: 'bottom', ticks, plot, grid: true })
 *   <ChartTooltipBox tip={tip} width={area.width} />
 *
 * 颜色、字号都是主题 tokens（切换主题不用重画）；动画的时长是 durations（“减少动态效果”时为 0）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { shallowRef, watch, type VNodeChild } from 'vue';
import { t } from '../config/theme/tokens';
import { useEventListener } from '../utils/dom/event-listener';
import { useIntersectionObserver } from '../utils/dom/intersection';
import { useResizeObserver } from '../utils/dom/resize';
import { svgNumber } from '../utils/data/number';

/** 绘图区离视口多近就算看见了（px）：滚到之前先画好，进来时已经是画好的 */
const SEEN_MARGIN = 200;

/**
 * 绘图区进入过视口：之前不画，进来之后一直算看见（滚出去不拆掉）。一页很多图表时先画看得见的，
 * 其余的滚到附近再画（地图要投影几万个点、网络图要迭代布局）。在 setup 里调用，渲染时读返回的函数。
 * 挂上时就在视口附近的立即算看见（不等观察器的第一次回调；没有布局的测试环境里框都在原点，也算看见）；
 * 打印前全部画上；没有 IntersectionObserver 的环境当作看见了。
 */
export function usePlotSeen(plot: () => HTMLElement | null | undefined): () => boolean {
  const seen = shallowRef(typeof IntersectionObserver === 'undefined');
  const near = (element: Element) => {
    const box = element.getBoundingClientRect();
    return (
      box.top < window.innerHeight + SEEN_MARGIN &&
      box.bottom > -SEEN_MARGIN &&
      box.left < window.innerWidth + SEEN_MARGIN &&
      box.right > -SEEN_MARGIN
    );
  };
  watch(
    plot,
    (element) => {
      if (element && !seen.value && near(element)) seen.value = true;
    },
    { immediate: true, flush: 'post' },
  );
  useIntersectionObserver(
    () => (seen.value ? null : plot()),
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) seen.value = true;
    },
    () => ({ rootMargin: `${SEEN_MARGIN}px` }),
  );
  useEventListener(
    () => window,
    'beforeprint',
    () => (seen.value = true),
  );
  return () => seen.value;
}

/** 绘图区里画图形的矩形（SVG 坐标，px） */
export interface PlotRect {
  /** 左 */
  left: number;
  /** 上 */
  top: number;
  /** 宽 */
  width: number;
  /** 高 */
  height: number;
}

/** usePlotArea 的返回值 */
export interface PlotArea {
  /** 交给 ChartFrame 的 plotRef */
  ref: (element: HTMLElement | null) => void;
  /** 绘图区元素 */
  readonly element: HTMLElement | null;
  /** 宽（px） */
  readonly width: number;
  /** 高（px） */
  readonly height: number;
  /** 可以画了：量到了大小，也进入过视口 */
  readonly ready: boolean;
}

/** 绘图区的元素、大小与可见性（在 setup 里调用）；没有布局的环境（服务端、测试）里大小是 0，不画 */
export function usePlotArea(): PlotArea {
  const element = shallowRef<HTMLElement | null>(null);
  const size = shallowRef({ width: 0, height: 0 });
  const seen = usePlotSeen(() => element.value);
  useResizeObserver(
    () => element.value,
    (entries) => {
      const box = entries.at(-1)!.contentRect;
      if (box.width !== size.value.width || box.height !== size.value.height)
        size.value = { width: box.width, height: box.height };
    },
  );
  return {
    ref: (value) => (element.value = value),
    get element() {
      return element.value;
    },
    get width() {
      return size.value.width;
    },
    get height() {
      return size.value.height;
    },
    get ready() {
      return seen() && size.value.width > 0 && size.value.height > 0;
    },
  };
}

/** 事件在元素里的坐标（px） */
export function pointerIn(event: { clientX: number; clientY: number }, element: Element) {
  const box = element.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

/** 进场：淡入；还有从 0 长出来的（柱、点），时长取主题的 lg */
const enter = `${t.durations.lg} ${t.easings.standard}`;

/** 图表 SVG 的共用样式 */
export const chartSvgStyles = css.create({
  svg: { display: 'block', overflow: 'visible', userSelect: 'none', WebkitUserSelect: 'none' },
  grid: { stroke: '_borderMuted', strokeWidth: 1, shapeRendering: 'crispEdges' },
  // 零线（数值轴有负数时）
  baseline: { stroke: '_border', strokeWidth: 1, shapeRendering: 'crispEdges' },
  tick: { fill: '_textMuted', fontSize: '_xs' },
  axisTitle: { fill: '_textMuted', fontSize: '_xs' },
  // 十字线：指针所在类目的竖线
  crosshair: {
    stroke: '_borderStrong',
    strokeWidth: 1,
    strokeDasharray: '4 3',
    pointerEvents: 'none',
    shapeRendering: 'crispEdges',
  },
  // 柱状图悬停的类目：整格一层浅底
  hoverBand: { fill: '_fill', pointerEvents: 'none' },
  // 文字描一圈表面色的边：压在图形上也看得清
  halo: {
    paintOrder: 'stroke',
    stroke: '_surface',
    strokeWidth: 3,
    strokeLinejoin: 'round',
  },
  label: { fill: '_text', fontSize: '_xs' },
  labelMuted: { fill: '_textMuted', fontSize: '_xs' },
  labelStrong: { fill: '_text', fontSize: '_xs', fontWeight: '_medium' },
  noPointer: { pointerEvents: 'none' },
  fadeIn: {
    opacity: { default: 1, '@starting-style': 0 },
    transition: `opacity ${enter}`,
  },
  // 悬停别的图形时，其余的变淡
  dimmable: { transition: `opacity ${t.durations.sm} ${t.easings.standard}` },
  dimmed: { opacity: 0.25 },
  fill: (color: string) => ({ fill: color }),
  stroke: (color: string) => ({ stroke: color }),
});

/** 坐标轴上的一个刻度 */
export interface AxisTick {
  /** 位置：竖轴是纵坐标，横轴是横坐标（px） */
  position: number;
  /** 文字；空串时只画网格线 */
  label: string;
}

/** chartAxis 的参数 */
export interface ChartAxisOptions {
  /** 刻度文字在绘图区的哪一边 */
  side: 'left' | 'right' | 'bottom';
  /** 刻度 */
  ticks: readonly AxisTick[];
  /** 绘图区 */
  plot: PlotRect;
  /** 画网格线（穿过绘图区） */
  grid?: boolean;
  /** 刻度文字与绘图区的距离，默认 8 */
  gap?: number;
}

/** 坐标轴：刻度文字，可带网格线（键是位置，更新时文字原地换） */
export function chartAxis({
  side,
  ticks,
  plot,
  grid = false,
  gap = 8,
}: ChartAxisOptions): VNodeChild {
  const right = plot.left + plot.width;
  const bottom = plot.top + plot.height;
  return (
    <g>
      {grid &&
        ticks.map((tick) => {
          const p = Math.round(tick.position) + 0.5;
          return side === 'bottom' ? (
            <line
              key={`g${tick.position}`}
              x1={p}
              x2={p}
              y1={plot.top}
              y2={bottom}
              {...css.attrs(chartSvgStyles.grid)}
            />
          ) : (
            <line
              key={`g${tick.position}`}
              x1={plot.left}
              x2={right}
              y1={p}
              y2={p}
              {...css.attrs(chartSvgStyles.grid)}
            />
          );
        })}
      {ticks.map((tick) =>
        tick.label === '' ? null : side === 'bottom' ? (
          <text
            key={`t${tick.position}`}
            x={svgNumber(tick.position)}
            y={bottom + gap}
            text-anchor="middle"
            dominant-baseline="hanging"
            {...css.attrs(chartSvgStyles.tick)}
          >
            {tick.label}
          </text>
        ) : (
          <text
            key={`t${tick.position}`}
            x={side === 'left' ? plot.left - gap : right + gap}
            y={svgNumber(tick.position)}
            text-anchor={side === 'left' ? 'end' : 'start'}
            dominant-baseline="central"
            {...css.attrs(chartSvgStyles.tick)}
          >
            {tick.label}
          </text>
        ),
      )}
    </g>
  );
}

/** 一个提示框：指针在绘图区里的位置与内容 */
export interface ChartTip {
  /** 横坐标（px，相对绘图区） */
  x: number;
  /** 纵坐标 */
  y: number;
  /** 内容（chartTooltip 生成） */
  content: VNodeChild;
}

/** 提示框的样式 */
export const chartTooltipStyles = css.create({
  box: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    boxSizing: 'border-box',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
    backgroundColor: '_surfaceRaised',
    color: '_text',
    boxShadow: '_md',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: 1,
    transition: `opacity ${t.durations.sm} ${t.easings.standard}, transform ${t.durations.sm} ${t.easings.standard}`,
  },
  hidden: { opacity: 0 },
});

/**
 * 跟着指针的提示框：放在指针右侧，过了绘图区的一半放到左侧；纵向以指针为中线。
 * 消失时保留上一次的内容淡出。给读屏的是数据表，提示框和绘图区一样对读屏隐藏
 */
export const ChartTooltipBox = _component(
  ({ tip, width }: { tip: ChartTip | null; width: number }) => {
    let last: ChartTip | null = null;
    return () => {
      if (tip) last = tip;
      const shown = tip ?? last;
      if (!shown) return null;
      const flip = shown.x > width / 2;
      const left = flip ? shown.x - 14 : shown.x + 14;
      return (
        <div
          data-part="tooltip"
          {...css.attrs(chartTooltipStyles.box, !tip && chartTooltipStyles.hidden)}
          style={{
            transform: `translate(${Math.round(left)}px, ${Math.round(shown.y)}px) translate(${flip ? '-100%' : '0'}, -50%)`,
          }}
        >
          {shown.content}
        </div>
      );
    };
  },
);
