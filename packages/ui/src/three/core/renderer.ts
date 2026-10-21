/**
 * three.js 渲染器的生命周期（ThreeCanvas 用它；要自己安排外层结构时也可以直接用）：
 *
 *   const three = useThree({ canvas: () => canvas, setup: (context) => { …; return { frame } } });
 *   <canvas key={three.generation} ref={…} />
 *
 * - 第一次进入视口时才创建渲染器，占用 WebGL 上下文的名额（quality.ts）；被回收、上下文丢失后换一块新 canvas
 *   （generation 加一，渲染方用它作 key）再建，所以场景要在 setup 里搭，不要在外面持有渲染器；
 * - 所有效果共用一个 requestAnimationFrame 循环；滚出视口、标签页隐藏、paused 时停下；
 * - 减少动态效果（系统设置，或主题的时长为 0）时只画一帧静止画面，尺寸、主题色变化时（invalidate）重画；
 * - 尺寸跟随 canvas 的布局尺寸（ResizeObserver），像素比取设备与画质档位上限的较小值；
 * - 卸载、被回收时释放场景里的几何体、材质、纹理和渲染器，并立即交还上下文（forceContextLoss），
 *   不等浏览器回收；上下文连续丢失三次后改显示降级内容。
 */
import { PerspectiveCamera, Scene, WebGLRenderer, type Camera, type Color } from 'three';
import { onScopeDispose, shallowRef, watch } from 'vue';
import { useConfig } from '../../config/context';
import { readToken } from '../../config/theme/theme';
import { durations } from '../../config/theme/tokens.stylex';
import { useReducedMotion } from '../../utils/dom/media-query';
import { usePageVisible } from '../../utils/dom/page-visibility';
import { disposeObject } from './dispose';
import { clamp } from '../../utils/data/number';
import { parseDuration } from '../../utils/motion/animation';
import { usePointer, type PointerState } from '../../utils/motion/pointer';
import {
  acquireContext,
  releaseContext,
  resolveThreeQuality,
  retryWaiting,
  type ContextHolder,
  type ResolvedThreeQuality,
  type ThreeQuality,
} from './quality';
import {
  createThemeColorSet,
  type ThemeColors,
  type ThemeColorSet,
  type ThemeColorSources,
} from './theme-colors';

/** 画布的尺寸（CSS 像素）与实际使用的像素比 */
export interface ThreeSize {
  /** 宽度（CSS 像素） */
  width: number;
  /** 高度（CSS 像素） */
  height: number;
  /** 实际使用的像素比：设备像素比按画质档位封顶 */
  pixelRatio: number;
}

/** 交给 setup 的场景上下文 */
export interface ThreeContext {
  /** 渲染器：透明背景，像素比与尺寸由这里管理 */
  readonly renderer: WebGLRenderer;
  /** 场景：卸载时连同里面的几何体、材质、纹理一起释放 */
  readonly scene: Scene;
  /** 相机：默认是透视相机（视角 45°，位于 z = 5），宽高比自动跟随；可以换成别的相机 */
  camera: Camera;
  /** 渲染器画到的 canvas 元素 */
  readonly canvas: HTMLCanvasElement;
  /** 当前尺寸，随布局变化 */
  readonly size: Readonly<ThreeSize>;
  /** 画质档位的参数：粒子数、细分等按 density 缩放 */
  readonly quality: ResolvedThreeQuality;
  /** 只画静止画面（减少动态效果）：指针跟随之类的交互也应停下 */
  readonly still: boolean;
  /** 指针相对画布的位置（-1 到 1）与 strength（指针在画布上为 1，离开后淡出），弹簧阻尼，见 pointer.ts */
  readonly pointer: PointerState;
  /** 请求重画一帧：循环停着（静止、暂停）时，数据变了用它刷新 */
  invalidate: () => void;
  /**
   * 跟随画布所在位置主题的颜色（THREE.Color）：换主题时原地过渡到新色并重画。
   * 材质的 color 直接赋这个对象（`material.color = palette.accent`），见 theme-colors.ts
   */
  themeColors: <Sources extends ThemeColorSources>(sources: Sources) => ThemeColors<Sources>;
  /**
   * 一列跟随主题的颜色（着色器的色板 uColors、粒子的色调）：给了 size 时取前 size 个，不足的用最后一个补齐
   * （uniform 数组的长度是固定的）；sources 不能为空
   */
  themeColorList: (sources: readonly string[], size?: number) => Color[];
}

/** 每帧交给 frame 的时间 */
export interface ThreeFrame {
  /** 动画时间（秒）：只在循环运行时增长，暂停后接着走 */
  time: number;
  /** 距上一帧（秒），最多 0.1：切回标签页时不跳一大步 */
  delta: number;
}

/** setup 返回的场景回调，都可省 */
export interface ThreeSceneHandle {
  /** 每帧渲染前调用：更新 uniform、位置 */
  frame?(frame: ThreeFrame, context: ThreeContext): void;
  /** 尺寸变化后调用（相机的宽高比已更新） */
  resize?(size: Readonly<ThreeSize>, context: ThreeContext): void;
  /** 释放前调用：清理 setup 里自己加的监听、加载器；场景里的对象由这里统一释放 */
  dispose?(): void;
}

/** 渲染状态，写在根元素的 data-state 上 */
export type ThreeStatus =
  /** 还没创建（没进过视口、在排队、被回收） */
  | 'idle'
  /** 循环运行中 */
  | 'running'
  /** 停着：滚出视口、标签页隐藏或 paused */
  | 'paused'
  /** 只画了一帧静止画面（减少动态效果） */
  | 'still'
  /** 没有 WebGL，或画质是 off：显示降级内容 */
  | 'fallback';

/** useThree 的选项 */
export interface ThreeOptions {
  /** 画在哪块 canvas 上（渲染方按 generation 换新的） */
  canvas: () => HTMLCanvasElement | null | undefined;
  /** 搭场景：每次创建渲染器时调用一次 */
  setup: (context: ThreeContext) => ThreeSceneHandle | void;
  /** 画质档位，默认 auto；变了会重建，off 时释放渲染器、显示降级内容 */
  quality?: () => ThreeQuality | undefined;
  /** 暂停循环（停在当前画面） */
  paused?: () => boolean | undefined;
  /** 渲染分辨率相对像素比的倍数（0–1），平滑的渐变类效果用 0.5 能省下大半的填充开销；默认 1 */
  resolution?: () => number | undefined;
}

/** useThree 的返回值 */
export interface ThreeController {
  /** 渲染状态，响应式 */
  readonly status: ThreeStatus;
  /** canvas 的代数：重建时加一，渲染方用作 canvas 的 key */
  readonly generation: number;
  /** 请求重画一帧 */
  invalidate: () => void;
}

// 所有效果共用一个动画帧循环
const tickers = new Set<(now: number) => void>();
let tickerFrame = 0;

function runTickers(now: number) {
  tickerFrame = 0;
  for (const tick of [...tickers]) tick(now);
  if (tickers.size) tickerFrame = requestAnimationFrame(runTickers);
}

function subscribe(tick: (now: number) => void) {
  tickers.add(tick);
  tickerFrame ||= requestAnimationFrame(runTickers);
}

/** 上下文连续丢失这么多次后不再重建，改显示降级内容 */
const MAX_CONTEXT_LOSSES = 3;

/** 主题的时长为 0（主题编辑器关掉了动效，或系统要求减少动态效果）：读不到主题时当作有动效 */
function themeMotionOff(element: Element) {
  try {
    return parseDuration(readToken(element, durations.md)) === 0;
  } catch {
    return false;
  }
}

interface Instance {
  renderer: WebGLRenderer;
  context: ThreeContext;
  handle: ThreeSceneHandle;
  canvas: HTMLCanvasElement;
  onLost: () => void;
  time: number;
  last: number;
  pending: number;
  ticking: boolean;
  colorSets: { set: ThemeColorSet<ThemeColorSources>; sources: ThemeColorSources }[];
}

/** three.js 渲染器的生命周期（在 setup 里调用），见文件开头 */
export function useThree(options: ThreeOptions): ThreeController {
  const config = useConfig();
  const reducedMotion = useReducedMotion();
  const off = () => options.quality?.() === 'off';
  const status = shallowRef<ThreeStatus>(off() ? 'fallback' : 'idle');
  const pointer = usePointer(options.canvas);
  const generation = shallowRef(0);
  const themeStill = shallowRef(false);
  const pageVisible = usePageVisible();
  const visible = shallowRef(false);

  let instance: Instance | undefined;
  let lastSeen = 0;
  let losses = 0;
  let unmounted = false;
  // 创建失败或上下文反复丢失：换画质也不再重试（区别于 off 的降级）
  let unsupported = false;

  const still = () => reducedMotion.value || themeStill.value;

  const holder: ContextHolder = {
    get visible() {
      return visible.value;
    },
    get lastSeen() {
      return lastSeen;
    },
    evict() {
      teardown();
      status.value = 'idle';
      generation.value++;
    },
    retry: () => start(),
  };

  function draw(target: Instance, delta: number) {
    target.handle.frame?.({ time: target.time, delta }, target.context);
    target.renderer.render(target.context.scene, target.context.camera);
  }

  function tick(now: number) {
    const target = instance;
    if (!target) return;
    const delta = target.last ? Math.min((now - target.last) / 1000, 0.1) : 0;
    target.last = now;
    target.time += delta;
    draw(target, delta);
  }

  function invalidate() {
    const target = instance;
    if (!target || target.ticking || target.pending) return;
    target.pending = requestAnimationFrame(() => {
      target.pending = 0;
      if (instance === target) draw(target, 0);
    });
  }

  function resize(target: Instance) {
    const { canvas, context, renderer, handle } = target;
    const size = context.size as ThreeSize;
    size.width = canvas.clientWidth;
    size.height = canvas.clientHeight;
    size.pixelRatio =
      Math.min(globalThis.devicePixelRatio || 1, context.quality.pixelRatio) *
      clamp(options.resolution?.() ?? 1, 0.1, 1);
    renderer.setPixelRatio(size.pixelRatio);
    renderer.setSize(size.width, size.height, false);
    const camera = context.camera as Camera & Partial<PerspectiveCamera>;
    if (camera.isPerspectiveCamera && size.height > 0) {
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix!();
    }
    handle.resize?.(size, context);
    invalidate();
  }

  function create(
    canvas: HTMLCanvasElement,
    level: Exclude<ThreeQuality, 'off'> | undefined,
  ): Instance {
    const quality = resolveThreeQuality(level);
    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: quality.antialias });
    renderer.setClearColor(0x000000, 0);
    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;
    const colorSets: Instance['colorSets'] = [];
    const context: ThreeContext = {
      renderer,
      scene: new Scene(),
      camera,
      canvas,
      size: { width: 0, height: 0, pixelRatio: 1 },
      quality,
      pointer,
      get still() {
        return still();
      },
      invalidate,
      themeColors(sources) {
        const set = createThemeColorSet<typeof sources>(invalidate);
        set.refresh(canvas, sources, false);
        colorSets.push({ set, sources });
        return set.colors;
      },
      themeColorList(sources, size) {
        const used = size == null ? sources : sources.slice(0, size);
        const themed = context.themeColors(Object.fromEntries(used.map((color, i) => [i, color])));
        const list = used.map((_, index) => themed[index]!);
        while (size != null && list.length < size) list.push(list.at(-1)!);
        return list;
      },
    };
    const target: Instance = {
      renderer,
      context,
      handle: {},
      canvas,
      onLost: () => lose(target),
      time: 0,
      last: 0,
      pending: 0,
      ticking: false,
      colorSets,
    };
    canvas.addEventListener('webglcontextlost', target.onLost);
    return target;
  }

  function start() {
    const canvas = options.canvas();
    if (unmounted || instance || !canvas || !visible.value || status.value === 'fallback') return;
    const level = options.quality?.();
    if (level === 'off') return;
    if (!acquireContext(holder)) return;
    try {
      instance = create(canvas, level);
    } catch {
      // 没有 WebGL（浏览器禁用、驱动黑名单、测试环境）
      releaseContext(holder);
      unsupported = true;
      status.value = 'fallback';
      return;
    }
    try {
      instance.handle = options.setup(instance.context) ?? {};
    } catch (error) {
      teardown();
      unsupported = true;
      status.value = 'fallback';
      throw error;
    }
    resize(instance);
    update();
  }

  function teardown() {
    const target = instance;
    if (!target) return;
    instance = undefined;
    tickers.delete(tick);
    cancelAnimationFrame(target.pending);
    target.canvas.removeEventListener('webglcontextlost', target.onLost);
    for (const { set } of target.colorSets) set.stop();
    target.handle.dispose?.();
    disposeObject(target.context.scene);
    target.renderer.dispose();
    if (!target.renderer.getContext().isContextLost()) target.renderer.forceContextLoss();
    releaseContext(holder);
  }

  function lose(target: Instance) {
    if (instance !== target) return;
    teardown();
    losses++;
    unsupported = losses >= MAX_CONTEXT_LOSSES;
    status.value = unsupported ? 'fallback' : 'idle';
    // 丢失过上下文的 canvas 拿不回新的上下文：换一块
    if (status.value === 'idle') generation.value++;
  }

  /** 按可见性、暂停、静止决定循环开还是停 */
  function update() {
    const target = instance;
    if (!target) return;
    const mode: ThreeStatus = still()
      ? 'still'
      : options.paused?.() || !visible.value || !pageVisible.value
        ? 'paused'
        : 'running';
    target.ticking = mode === 'running';
    if (target.ticking) {
      target.last = 0;
      subscribe(tick);
    } else {
      tickers.delete(tick);
      if (mode === 'still') invalidate();
    }
    status.value = mode;
  }

  watch(
    options.canvas,
    (canvas, _, onCleanup) => {
      if (!canvas) return;
      const observers: { disconnect(): void }[] = [];
      if (typeof IntersectionObserver === 'undefined') {
        visible.value = true;
      } else {
        const intersection = new IntersectionObserver(([entry]) => {
          visible.value = entry!.isIntersecting;
          lastSeen = performance.now();
        });
        intersection.observe(canvas);
        observers.push(intersection);
      }
      if (typeof ResizeObserver !== 'undefined') {
        const sizes = new ResizeObserver(() => instance && resize(instance));
        sizes.observe(canvas);
        observers.push(sizes);
      }
      start();
      onCleanup(() => observers.forEach((observer) => observer.disconnect()));
    },
    { immediate: true, flush: 'post' },
  );

  watch(visible, (shown) => {
    if (instance) update();
    else start();
    // 滚出视口的效果可以被回收：排队的效果再试
    if (!shown && instance) retryWaiting();
  });
  watch([() => options.paused?.(), reducedMotion, themeStill, pageVisible], update);

  // 主题变了（含主题编辑器关掉动效）：重新判断要不要静止，并重画
  watch(
    [() => config.theme, options.canvas],
    ([, canvas]) => {
      if (!canvas) return;
      themeStill.value = themeMotionOff(canvas);
      for (const { set, sources } of instance?.colorSets ?? []) set.refresh(canvas, sources, true);
      invalidate();
    },
    { immediate: true, flush: 'post' },
  );

  watch(
    () => options.resolution?.(),
    () => instance && resize(instance),
  );

  watch(
    () => options.quality?.(),
    () => {
      if (unsupported) return;
      if (off()) {
        teardown();
        status.value = 'fallback';
      } else if (instance || status.value === 'fallback') {
        // 换档重建；从 off 回来时渲染方重新挂上 canvas，再按可见性创建
        teardown();
        status.value = 'idle';
        generation.value++;
      }
    },
  );

  onScopeDispose(() => {
    unmounted = true;
    teardown();
    releaseContext(holder);
  });

  return {
    get status() {
      return status.value;
    },
    get generation() {
      return generation.value;
    },
    invalidate,
  };
}
