/**
 * 图上的区域：一张图片上画着若干矩形框，能选中、拖动、拖八个把手改大小、拖锚点（原点），视口能平移缩放。精灵表切图、
 * 图片标注（目标框）、热区、贴图图集都用它。框按图片的像素记，改动按 snap 取整（默认整像素）。
 *
 *   const view = createImageRegionsController();
 *   <ImageRegions src={sheet.url} regions={sprites} _selected={current} anchors pixelated controller={view}
 *     onRegionChange={(region, { phase }) => update(region, phase === 'end')} aria-label="精灵" />
 *   <IconButton icon={Maximize} onClick={() => view.fit()} aria-label="整张放进视口" />
 *
 * - 指针：点框选中；拖框挪位置，拖选中框的边、角改大小，拖锚点挪原点；拖空白处平移，滚轮以指针为中心缩放（usePanZoom）。
 * - 键盘（视口能聚焦）：方向键挪选中的框（Shift 一次 10 格），Alt + 方向键改它的宽高；没有选中的框时方向键平移；
 *   + / − 缩放，0 回到初始。
 * - 图片加载好后整张放进视口；小图（像素画）再放大到正好装下，最多 maxFitScale 倍。
 * - 改动经 onRegionChange 交出去（phase：拖动中是 'move'，松开、键盘一次是 'end'），值由使用方存。
 *
 * 部件（data-scope="image-regions"）：Root（div，视口）、Content（随平移缩放的一层）、Image（img）、Overlay（svg）、
 * Region（一个框）、Handle（把手）、Anchor（锚点）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount } from 'vue';
import { partAttrs } from '../config/styles';
import { t } from '../config/theme/tokens';
import { mergeAttrs, type PartProps } from '../utils/props';
import { startMove } from '../utils/dom/move';
import { usePanZoom } from '../utils/dom/pan-zoom';
import { focusRingStyles } from '../utils/style/styles';
import { swatchStyles } from '../utils/style/swatch-styles';

/** 图上的一个区域（图片像素） */
export interface ImageRegion {
  /** 标识（_selected 写它） */
  id: string;
  /** 左上角的横坐标 */
  x: number;
  /** 左上角的纵坐标 */
  y: number;
  /** 宽 */
  width: number;
  /** 高 */
  height: number;
  /** 锚点（原点、枢轴）：图片坐标；anchors 时画出来、能拖 */
  anchor?: { readonly x: number; readonly y: number };
  /** 名称：悬停提示、读屏 */
  label?: string;
}

/** onRegionChange 的细节 */
export interface ImageRegionChange {
  /** 拖动中是 move，松开指针、键盘改一次是 end（撤销记一步、存盘在 end 时做） */
  phase: 'move' | 'end';
}

/** 视口的命令：父级用 createImageRegionsController 建一个传进来，在别处（工具条的按钮）调用 */
export interface ImageRegionsController {
  /** 整张图放进视口（小图放大到正好装下） */
  fit(): void;
  /** 放大一档 */
  zoomIn(): void;
  /** 缩小一档 */
  zoomOut(): void;
  /** @internal 组件挂上自己的实现 */
  attach(actions: Omit<ImageRegionsController, 'attach'> | undefined): void;
}

/** 建一个视口的控制器（在哪都能调用） */
export function createImageRegionsController(): ImageRegionsController {
  let actions: Omit<ImageRegionsController, 'attach'> | undefined;
  return {
    fit: () => actions?.fit(),
    zoomIn: () => actions?.zoomIn(),
    zoomOut: () => actions?.zoomOut(),
    attach: (next) => (actions = next),
  };
}

/** 角色、焦点由组件管理 */
export type ImageRegionsManaged = 'role' | 'tabindex';

/** 框的位置、大小由区域决定，组件管理 */
export type ImageRegionManaged = 'x' | 'y' | 'width' | 'height' | 'vector-effect';

/** 图片的地址、替代文字（装饰性的，空）、不能拖由组件管理 */
export type ImageRegionsImageManaged = 'src' | 'alt' | 'draggable';

/** 未声明的属性落到视口的 div 上；aria-label 是这组区域的名称 */
export interface ImageRegionsProps extends PartProps<'div', ImageRegionsManaged> {
  /** 图片地址 */
  src: string;
  /** 图上的区域 */
  regions: readonly ImageRegion[];
  /** 选中的区域：父级写 _selected={x}；没有选中时是 null */
  _selected?: string | null;
  /** 区域改了（挪、改大小、挪锚点）：新的区域 */
  onRegionChange?: (region: ImageRegion, change: ImageRegionChange) => void;
  /** 图片加载好了：原始尺寸 */
  onImageLoad?: (size: { readonly width: number; readonly height: number }) => void;
  /** 改动取整到几个像素，默认 1 */
  snap?: number;
  /** 区域最小的宽高（像素），默认 1 */
  minSize?: number;
  /** 画出各区域的锚点并能拖，默认 false */
  anchors?: boolean;
  /** 放大时按像素块显示（像素画、精灵），默认 false（平滑） */
  pixelated?: boolean;
  /** 只读：能选中、平移缩放，不能改 */
  readonly?: boolean;
  /** 缩放的下限，默认 0.05 */
  minZoom?: number;
  /** 缩放的上限，默认 32 */
  maxZoom?: number;
  /** 加载后放大到正好装下时最多几倍，默认 8 */
  maxFitScale?: number;
  /** 视口的命令（fit、zoomIn、zoomOut） */
  controller?: ImageRegionsController;
  /** 图片的部件属性 */
  propsImage?: PartProps<'img', ImageRegionsImageManaged>;
  /** 区域框的部件属性（svg 的 rect）；可以按区域计算 */
  propsRegion?:
    | PartProps<'rect', ImageRegionManaged>
    | ((
        region: ImageRegion,
        state: { selected: boolean },
      ) => PartProps<'rect', ImageRegionManaged>);
}

/** 部件的标记（data-scope="image-regions"） */
const regionsPart = (part: string) => partAttrs({ name: 'ImageRegions' }, part);

/** 拖的是什么：整个框、哪条边或角（n、s、e、w 的组合）、锚点 */
type Grip = 'move' | 'anchor' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
/** 八个把手：在框上的位置（比例） */
const HANDLES: readonly (readonly [Grip, number, number])[] = [
  ['nw', 0, 0],
  ['n', 0.5, 0],
  ['ne', 1, 0],
  ['e', 1, 0.5],
  ['se', 1, 1],
  ['s', 0.5, 1],
  ['sw', 0, 1],
  ['w', 0, 0.5],
];
const CURSORS: Readonly<Record<Grip, string>> = {
  move: 'move',
  anchor: 'crosshair',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};
/** 把手在屏幕上的边长（px，不跟着缩放变） */
const HANDLE = 8;

/** ImageRegions 的样式：root、content、image、pixelated、overlay、region、selected、handle、anchor */
const imageRegionsStyles = css.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '12em',
    cursor: 'grab',
    backgroundColor: '_fill',
  },
  content: { position: 'absolute', left: 0, top: 0, transformOrigin: '0 0' },
  image: { display: 'block', maxWidth: 'none' },
  pixelated: { imageRendering: 'pixelated' },
  overlay: { position: 'absolute', left: 0, top: 0, overflow: 'visible' },
  region: {
    fill: 'transparent',
    stroke: '_info',
    strokeWidth: 1,
    cursor: 'pointer',
  },
  selected: {
    fill: `color-mix(in srgb, ${t.colors.accent} 14%, transparent)`,
    stroke: '_accent',
    strokeWidth: 2,
  },
  handle: { fill: '_accent' },
  anchor: { fill: 'none', stroke: '_danger', strokeWidth: 2 },
});

/** 图上的区域：选中、拖动、改大小、挪锚点，视口平移缩放 */
export const ImageRegions = _component(
  ({
    src,
    regions,
    _selected: selected = _bindable<string | null>(null),
    onRegionChange,
    onImageLoad,
    snap = 1,
    minSize = 1,
    anchors = false,
    pixelated = false,
    readonly = false,
    minZoom = 0.05,
    maxZoom = 32,
    maxFitScale = 8,
    controller,
    propsImage,
    propsRegion,
    ...rest
  }: ImageRegionsProps) => {
    let viewport = _state.raw<HTMLElement | null>(null);
    let size = _state<{ width: number; height: number } | null>(null);
    // 按在框、把手上是拖它们，不平移；滚轮在哪都缩放
    const view = usePanZoom({
      viewport: () => viewport,
      min: () => minZoom,
      max: () => maxZoom,
      filter: (event) =>
        event.type === 'wheel' || !(event.target as Element | null)?.closest?.('[data-grip]'),
    });

    /** 整张放进视口：先不放大地装下，小图再放大到正好装下（最多 maxFitScale 倍） */
    /** 这张图已经放进过视口：之后视口变大变小不再自动适配（用户可能缩放、平移过） */
    let fitted = false;
    const fit = () => {
      const box = viewport?.getBoundingClientRect();
      // 视口还没排版（刚挂上、在收起的面板里）：等它有了尺寸再适配（见下面的 ResizeObserver）
      if (!size || !box || box.width === 0 || box.height === 0) return;
      fitted = true;
      view.fit(size, 16);
      const scale = Math.min(
        maxFitScale,
        (box.width - 32) / size.width,
        (box.height - 32) / size.height,
      );
      if (scale > view.scale) view.zoomTo(scale, { x: box.width / 2, y: box.height / 2 });
    };
    // 图片先加载好、视口后有尺寸时，第一次有尺寸就适配
    _effect(() => {
      const element = viewport;
      if (!element) return undefined;
      const observer = new ResizeObserver(() => {
        if (!fitted) fit();
      });
      observer.observe(element);
      return () => observer.disconnect();
    });
    controller?.attach({ fit, zoomIn: () => view.zoomIn(), zoomOut: () => view.zoomOut() });
    onBeforeUnmount(() => controller?.attach(undefined));

    const round = (value: number) => Math.round(value / snap) * snap;

    /** 按 grip 把区域挪 dx、dy（图片像素，已取整） */
    const moved = (region: ImageRegion, grip: Grip, dx: number, dy: number): ImageRegion => {
      if (grip === 'anchor') {
        const anchor = region.anchor ?? { x: region.x, y: region.y };
        return { ...region, anchor: { x: anchor.x + dx, y: anchor.y + dy } };
      }
      let [left, top, right, bottom] = [
        region.x,
        region.y,
        region.x + region.width,
        region.y + region.height,
      ];
      if (grip === 'move') {
        [left, right, top, bottom] = [left + dx, right + dx, top + dy, bottom + dy];
      } else {
        // 边、角：按方向字母挪对应的边（'move' 里也有 e，所以分开判断）
        if (grip.includes('w')) left = Math.min(left + dx, right - minSize);
        if (grip.includes('e')) right = Math.max(right + dx, left + minSize);
        if (grip.includes('n')) top = Math.min(top + dy, bottom - minSize);
        if (grip.includes('s')) bottom = Math.max(bottom + dy, top + minSize);
      }
      // 整个挪的时候锚点跟着走
      const anchor =
        grip === 'move' && region.anchor
          ? { anchor: { x: region.anchor.x + dx, y: region.anchor.y + dy } }
          : {};
      return { ...region, ...anchor, x: left, y: top, width: right - left, height: bottom - top };
    };

    /** 按下一个框、把手或锚点：选中它，可改时之后的移动按图片像素算出新的区域 */
    const grab = (event: PointerEvent, region: ImageRegion, grip: Grip) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      viewport?.focus({ preventScroll: true });
      selected = region.id;
      if (readonly) return;
      let last = region;
      startMove(event, {
        onMove: ({ deltaX, deltaY }) => {
          const next = moved(region, grip, round(deltaX / view.scale), round(deltaY / view.scale));
          if (
            next.x === last.x &&
            next.y === last.y &&
            next.width === last.width &&
            next.height === last.height &&
            next.anchor?.x === last.anchor?.x &&
            next.anchor?.y === last.anchor?.y
          )
            return;
          last = next;
          onRegionChange?.(next, { phase: 'move' });
        },
        onEnd: ({ moved: dragged }) => {
          if (dragged) onRegionChange?.(last, { phase: 'end' });
        },
      });
    };

    /** 方向键挪选中的框（Shift 十格），Alt 加方向键改宽高；处理了返回 true */
    const onRegionKey = (event: KeyboardEvent): boolean => {
      const region = regions.find((item) => item.id === selected);
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[
        event.key
      ];
      if (!region || !step || readonly || event.ctrlKey || event.metaKey) return false;
      const amount = snap * (event.shiftKey ? 10 : 1);
      const [dx, dy] = [step[0]! * amount, step[1]! * amount];
      onRegionChange?.(event.altKey ? moved(region, 'se', dx, dy) : moved(region, 'move', dx, dy), {
        phase: 'end',
      });
      return true;
    };

    /** 一个区域：框，选中的再画把手和锚点 */
    const frame = (region: ImageRegion) => {
      const active = region.id === selected;
      const handle = HANDLE / view.scale;
      const own =
        typeof propsRegion === 'function' ? propsRegion(region, { selected: active }) : propsRegion;
      const anchor = region.anchor ?? { x: region.x, y: region.y };
      return (
        <g key={region.id}>
          <rect
            {...mergeAttrs<'rect'>(
              {
                sx: [imageRegionsStyles.region, active && imageRegionsStyles.selected],
                ...regionsPart('region'),
              },
              own,
              {
                x: region.x,
                y: region.y,
                width: region.width,
                height: region.height,
                'vector-effect': 'non-scaling-stroke',
                style: { cursor: active && !readonly ? CURSORS.move : 'pointer' },
                onPointerdown: (event: PointerEvent) => grab(event, region, 'move'),
              },
            )}
            data-grip=""
            data-state={active ? 'selected' : undefined}
          >
            {region.label && <title>{region.label}</title>}
          </rect>
          {active &&
            !readonly &&
            HANDLES.map(([grip, fx, fy]) => (
              <rect
                key={grip}
                {...css.attrs(imageRegionsStyles.handle)}
                {...regionsPart('handle')}
                data-grip={grip}
                x={region.x + region.width * fx - handle / 2}
                y={region.y + region.height * fy - handle / 2}
                width={handle}
                height={handle}
                style={{ cursor: CURSORS[grip] }}
                onPointerdown={(event: PointerEvent) => grab(event, region, grip)}
              />
            ))}
          {active && anchors && (
            <circle
              {...css.attrs(imageRegionsStyles.anchor)}
              {...regionsPart('anchor')}
              data-grip="anchor"
              cx={anchor.x}
              cy={anchor.y}
              r={handle / 1.6}
              vector-effect="non-scaling-stroke"
              style={{ cursor: readonly ? 'default' : CURSORS.anchor }}
              onPointerdown={(event: PointerEvent) => grab(event, region, 'anchor')}
            />
          )}
        </g>
      );
    };

    return () => {
      const pan = view.viewportProps as { onKeydown?: (event: KeyboardEvent) => void };
      const current = regions.find((item) => item.id === selected);
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [imageRegionsStyles.root, focusRingStyles.inset],
              ...regionsPart('root'),
            },
            rest,
            {
              ...view.viewportProps,
              ref: _toRef(viewport),
              role: 'group',
              tabindex: 0,
              onKeydown: (event: KeyboardEvent) => {
                if (onRegionKey(event)) {
                  event.preventDefault();
                  return;
                }
                pan.onKeydown?.(event);
              },
            },
          )}
        >
          <div
            {...css.attrs(imageRegionsStyles.content)}
            {...regionsPart('content')}
            style={{
              transform: view.transform,
              ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
            }}
          >
            <img
              {...mergeAttrs<'img'>(
                {
                  sx: [
                    imageRegionsStyles.image,
                    swatchStyles.checkerboard,
                    pixelated && imageRegionsStyles.pixelated,
                  ],
                  ...regionsPart('image'),
                },
                propsImage,
                {
                  src,
                  alt: '',
                  draggable: false,
                  onLoad: (event: Event) => {
                    const image = event.target as HTMLImageElement;
                    size = { width: image.naturalWidth, height: image.naturalHeight };
                    onImageLoad?.(size);
                    fitted = false;
                    requestAnimationFrame(fit);
                  },
                },
              )}
            />
            {size && (
              <svg
                {...css.attrs(imageRegionsStyles.overlay)}
                {...regionsPart('overlay')}
                width={size.width}
                height={size.height}
                viewBox={`0 0 ${size.width} ${size.height}`}
              >
                {/* 选中的画在最后：在上面，把手不被别的框挡住 */}
                {regions.map((region) => (region.id === selected ? null : frame(region)))}
                {current && frame(current)}
              </svg>
            )}
          </div>
        </div>
      );
    };
  },
);
