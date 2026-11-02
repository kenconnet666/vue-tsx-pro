/**
 * 组件库自己的 JS 动画：逐帧改元素的样式或 JS 对象的数值（canvas、3D 场景），时长、缓动、弹簧取主题 tokens 的当前值：
 * 主题覆盖的时长照样生效；开启“减少动态效果”时 durations 为 0，JS 动画也就立即完成。
 *
 *   animate(panel, { x: 0, ...themeTransition(panel, { duration: 'lg', ease: 'enter' }) })
 *   animate(card, { scale: 1, ...themeTransition(card, { bounce: 0.3 }) })   // 弹簧
 *
 * 组件里用 useAnimate：同样取主题，另外在组件卸载时取消还在跑的动画。
 * 时间线、自由拖动这类编排，组件库用不到也不提供，需要时使用方自己装动画库。
 *
 * 进出场、展开收起能用 CSS 过渡的仍用 CSS：原生 popover / dialog 被 Esc、点击外部关闭时，JS 来不及介入。
 */
import { onScopeDispose } from 'vue';
import { readToken, tokenValue } from '../../config/theme/theme';
import { durations, easings } from '../../config/theme/tokens';
import { clamp } from '../data/number';

/** 缓动：动画进度（0–1）→ 数值进度（弹簧可以超过 1） */
export type Easing = (progress: number) => number;

/** 元素能动画的属性：x、y、scale 写进 transform，其余写内联样式 */
export interface ElementValues {
  /** 水平位移（像素） */
  x?: number;
  /** 垂直位移（像素） */
  y?: number;
  /** 缩放比例 */
  scale?: number;
  /** 不透明度（0–1） */
  opacity?: number;
  /** 宽度（像素） */
  width?: number;
  /** 高度（像素） */
  height?: number;
}

/** 动画的时长、缓动与每帧回调；不写时 300ms 线性 */
export interface AnimationTiming {
  /** 时长（毫秒） */
  duration?: number;
  /** 缓动：cubicBezier、spring 的结果，或任意函数 */
  ease?: Easing;
  /** 每帧写完数值后调用 */
  onUpdate?: () => void;
}

type NumericKeys<Target> = {
  [Key in keyof Target]: Target[Key] extends number ? Key : never;
}[keyof Target];

/** 目标的终值：元素是 ElementValues，JS 对象是它的数值属性 */
export type AnimationValues<Target> = Target extends Element
  ? ElementValues
  : { [Key in NumericKeys<Target>]?: number };

/** animate 的参数：终值加上时长与缓动 */
export type AnimationParams<Target extends object> = AnimationValues<Target> & AnimationTiming;

/** 一次动画：可以 await，播完时完成；被取消、被同一属性上的新动画整个替换时不会完成 */
export interface JSAnimation extends PromiseLike<void> {
  /** 时长（毫秒） */
  readonly duration: number;
  /** 已经播完 */
  readonly completed: boolean;
  /** 已被取消或整个被替换 */
  readonly cancelled: boolean;
  /** 停在当前值 */
  cancel(): void;
}

const DEFAULT_DURATION = 300;
const linear: Easing = (progress) => progress;
const TRANSFORMS: Record<string, { name: string; unit: string; initial: number }> = {
  x: { name: 'translateX', unit: 'px', initial: 0 },
  y: { name: 'translateY', unit: 'px', initial: 0 },
  scale: { name: 'scale', unit: '', initial: 1 },
};
const UNITLESS = new Set(['opacity']);

function readValue(target: object, key: string): number {
  if (!(target instanceof Element)) return (target as Record<string, number>)[key]!;
  const style = (target as HTMLElement).style;
  const transform = TRANSFORMS[key];
  if (transform) {
    const match = new RegExp(`${transform.name}\\(([^)a-z]+)`).exec(style.transform);
    return match ? Number(match[1]) : transform.initial;
  }
  return Number.parseFloat(getComputedStyle(target).getPropertyValue(key));
}

function writeValue(target: object, key: string, value: number): void {
  if (!(target instanceof Element)) {
    (target as Record<string, number>)[key] = value;
    return;
  }
  const style = (target as HTMLElement).style;
  // 取三位小数：样式串不用科学计数法，也不会每帧写一长串
  const rounded = Math.round(value * 1000) / 1000;
  const transform = TRANSFORMS[key];
  if (!transform) {
    style.setProperty(key, UNITLESS.has(key) ? String(rounded) : `${rounded}px`);
    return;
  }
  const part = `${transform.name}(${rounded}${transform.unit})`;
  const existing = new RegExp(`${transform.name}\\([^)]*\\)`);
  style.transform = existing.test(style.transform)
    ? style.transform.replace(existing, part)
    : `${style.transform} ${part}`.trim();
}

/** 一个目标上还在跑的动画：属性 → 正在写它的动画 */
interface RunningAnimation {
  tracks: Map<string, { from: number; to: number }>;
  cancel(): void;
}
const runningByTarget = new WeakMap<object, Map<string, RunningAnimation>>();

/** 同一目标同一属性只留最新的动画，快速连续触发不会互相打架；旧动画的属性都被接管时算取消 */
function takeOver(target: object, keys: Iterable<string>): void {
  const owners = runningByTarget.get(target);
  if (!owners) return;
  for (const key of keys) {
    const owner = owners.get(key);
    if (!owner) continue;
    owner.tracks.delete(key);
    owners.delete(key);
    if (owner.tracks.size === 0) owner.cancel();
  }
}

/** 从当前值动画到终值，返回可以 await 的动画；时长为 0 时当场到位，读取结果的代码不会先看到旧值 */
export function animate<Target extends object>(
  target: Target,
  params: AnimationParams<Target>,
): JSAnimation {
  const {
    duration = DEFAULT_DURATION,
    ease = linear,
    onUpdate,
    ...values
  } = params as AnimationTiming & Record<string, number | undefined>;
  const entries = Object.entries(values).filter(
    (entry): entry is [string, number] => entry[1] != null,
  );
  takeOver(target, Object.keys(values));

  const tracks = new Map(
    entries.map(([key, to]) => {
      const from = readValue(target, key);
      // 读不出当前值（display: none 的宽度是 auto）时没有起点，直接到终值
      return [key, { from: Number.isNaN(from) ? to : from, to }];
    }),
  );
  let completed = false;
  let cancelled = false;
  let frame = 0;
  let resolve!: () => void;
  const finished = new Promise<void>((done) => (resolve = done));

  const release = () => {
    const owners = runningByTarget.get(target);
    for (const key of tracks.keys()) owners?.delete(key);
  };
  const cancel = () => {
    if (completed || cancelled) return;
    cancelled = true;
    cancelAnimationFrame(frame);
    release();
  };
  const write = (progress: number) => {
    for (const [key, { from, to }] of tracks)
      writeValue(target, key, from + (to - from) * progress);
    onUpdate?.();
  };
  const finish = () => {
    write(1);
    completed = true;
    release();
    resolve();
  };

  const animation: JSAnimation = {
    duration,
    get completed() {
      return completed;
    },
    get cancelled() {
      return cancelled;
    },
    cancel,
    then: (onFulfilled, onRejected) => finished.then(onFulfilled, onRejected),
  };
  if (duration <= 0) {
    finish();
    return animation;
  }

  let owners = runningByTarget.get(target);
  if (!owners) runningByTarget.set(target, (owners = new Map()));
  for (const key of tracks.keys()) owners.set(key, { tracks, cancel });
  const start = Date.now();
  const tick = () => {
    const progress = (Date.now() - start) / duration;
    if (progress >= 1) return finish();
    write(ease(progress));
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return animation;
}

/** 直接写值，不播动画；同一属性上还在跑的动画停掉，它不会再改回去 */
export function setValues<Target extends object>(
  target: Target,
  values: AnimationValues<Target>,
): void {
  takeOver(target, Object.keys(values));
  for (const [key, value] of Object.entries(values)) writeValue(target, key, value as number);
}

/** 同 CSS 的 cubic-bezier()：缓动 token 的曲线在 JS 里复现 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  const curve = (a: number, b: number, t: number) =>
    3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  return (progress) => {
    if (progress <= 0 || progress >= 1) return progress <= 0 ? 0 : 1;
    // x 随 t 单调递增：二分找到这个进度对应的 t，20 次的误差在百万分之一
    let low = 0;
    let high = 1;
    for (let step = 0; step < 20; step++) {
      const middle = (low + high) / 2;
      if (curve(x1, x2, middle) < progress) low = middle;
      else high = middle;
    }
    return curve(y1, y2, (low + high) / 2);
  };
}

/** 弹簧停稳（偏差小于千分之一）所需的时间 × 衰减速率 */
const SPRING_SETTLE = 9.23;

/**
 * 弹簧的缓动与时长，展开到 animate 的参数里。duration 是感知时长（看起来到位的时间），
 * 返回的 duration 是停稳的时间，回弹越大越长。bounce：0 不回弹，越大越弹，建议不超过 0.5
 */
export function spring({ bounce = 0, duration }: { bounce?: number; duration: number }): {
  duration: number;
  ease: Easing;
} {
  const damping = 1 - clamp(bounce, 0, 0.99);
  const stiffness = (2 * Math.PI) / duration;
  const decay = damping * stiffness;
  const frequency = stiffness * Math.sqrt(1 - damping * damping);
  const settle = SPRING_SETTLE / decay;
  const position = (time: number) =>
    frequency === 0
      ? 1 - (1 + decay * time) * Math.exp(-decay * time)
      : 1 -
        Math.exp(-decay * time) *
          (Math.cos(frequency * time) + (decay / frequency) * Math.sin(frequency * time));
  return { duration: settle, ease: (progress) => position(progress * settle) };
}

/** themeTransition 的选项：取哪一档时长与缓动，或用弹簧 */
export interface ThemeTransitionOptions {
  /** 时长档位，默认 md */
  duration?: keyof typeof durations & string;
  /** 缓动曲线，默认 standard；给了 bounce 时不用 */
  ease?: keyof typeof easings & string;
  /** 弹簧的回弹程度（0 不回弹，越大越弹，建议不超过 0.5）：给了就用弹簧，时长档位作为弹簧的感知时长 */
  bounce?: number;
}

/** themeTransition 的结果：展开到 animate 的参数里 */
export interface ThemeTiming {
  /** 时长（毫秒）；用弹簧时是弹簧停稳的时间 */
  duration: number;
  /** 缓动曲线或弹簧 */
  ease?: Easing;
}

/** 按主题 tokens 生成时长与缓动参数，展开到 animate 的参数里；element 决定读哪个主题范围里的取值 */
export function themeTransition(
  element: Element,
  { duration = 'md', ease = 'standard', bounce }: ThemeTransitionOptions = {},
): ThemeTiming {
  const milliseconds = parseDuration(readToken(element, durations[duration]));
  if (milliseconds === 0) return { duration: 0 };
  if (bounce != null) return spring({ bounce, duration: milliseconds });
  return {
    duration: milliseconds,
    ease: cubicBezier(...parseEasing(readToken(element, easings[ease]))),
  };
}

/** CSS 时长 → 毫秒：'200ms' / '0.2s' → 200；时长 token 读出来的值用它换算 */
export function parseDuration(value: string): number {
  const match = /^([\d.]+)(ms|s)$/.exec(value);
  if (!match) throw new Error(`无法识别的时长 token：${value}`);
  return Number(match[1]) * (match[2] === 's' ? 1000 : 1);
}

/** 'cubic-bezier(0.2, 0, 0, 1)' → [0.2, 0, 0, 1]；缓动 token 要写成 cubic-bezier，JS 才能复现同一条曲线 */
function parseEasing(value: string): [number, number, number, number] {
  const points = /^cubic-bezier\(([^)]+)\)$/.exec(value)?.[1]!.split(',').map(Number);
  if (points?.length !== 4 || points.some(Number.isNaN)) {
    throw new Error(`缓动 token 要写成 cubic-bezier(…)：${value}`);
  }
  return points as [number, number, number, number];
}

/** useAnimate 返回的函数：给元素（或任何 JS 对象）做一次取主题时长的动画，返回的动画可以 await */
export type ThemeAnimate = <Target extends object>(
  target: Target,
  params: AnimationParams<Target>,
  transition?: ThemeAnimateOptions,
) => JSAnimation;

/** useAnimate 的时长选项：主题档位，加上按哪个元素读主题 */
export interface ThemeAnimateOptions extends ThemeTransitionOptions {
  /** 读这个元素上的主题取值；目标是元素时默认是它，否则（JS 对象）默认是根元素 */
  scope?: Element;
}

/**
 * 同 themeTransition，但读不到主题 token（页面没加载组件库的样式，如单元测试）时返回时长 0（直接到位），
 * 不让动画报错打断交互。组件里的动画都用它。token 写错了格式（时长没带单位、缓动不是 cubic-bezier）照常报错：
 * 那是主题的错，悄悄变成没有动画就发现不了
 */
export function themeTransitionOrInstant(
  element: Element,
  transition?: ThemeTransitionOptions,
): ThemeTiming {
  if (!tokenValue(element, durations[transition?.duration ?? 'md'])) return { duration: 0 };
  return themeTransition(element, transition);
}

/**
 * 组件里的 JS 动画（在 setup 里调用）：时长、缓动、弹簧取主题 tokens（themeTransition），组件卸载时取消还在跑的动画。
 * 同一目标同一属性上的新动画会替换旧的，快速连续触发不会互相打架；
 * params 里写的 duration、ease 优先于主题。目标不是元素（JS 对象）时按 scope（默认根元素）读主题。
 *
 *   const animate = useAnimate();
 *   animate(item, { x: 0, opacity: 1 }, { bounce: 0.35 });                       // 弹回
 *   await animate(item, { x: width, opacity: 0 }, { duration: 'sm', ease: 'exit' }); // 滑出后再移除
 */
export function useAnimate(): ThemeAnimate {
  const running = new Set<JSAnimation>();
  onScopeDispose(() => {
    for (const animation of running) animation.cancel();
    running.clear();
  });
  return (target, params, transition) => {
    const scope =
      transition?.scope ?? (target instanceof Element ? target : document.documentElement);
    // 播完的、被新动画整个替换掉的不再需要取消
    for (const animation of running) {
      if (animation.completed || animation.cancelled) running.delete(animation);
    }
    const animation = animate(target, {
      ...themeTransitionOrInstant(scope, transition),
      ...params,
    });
    if (!animation.completed) running.add(animation);
    return animation;
  };
}
