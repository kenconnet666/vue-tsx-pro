/**
 * JS 动画用 Anime.js（MIT）：animate、createTimeline、spring、stagger、createDraggable、createLayout 等直接从 'animejs' 导入，
 * 这里只补一件 Anime.js 不知道的事 —— 时长、缓动、弹簧取主题 tokens 的当前值：
 * 主题覆盖的时长照样生效；开启“减少动态效果”时 durations 为 0，JS 动画也就立即完成
 * （Anime.js 不会自动处理 prefers-reduced-motion）。
 *
 *   animate(panel, { x: 0, ...themeTransition(panel, { duration: 'lg', ease: 'enter' }) })
 *   animate(card, { scale: 1, ...themeTransition(card, { bounce: 0.3 }) })   // 弹簧
 *
 * 组件里用 useAnimate：同样取主题，另外在组件卸载时取消还在跑的动画。
 *
 * 进出场、展开收起能用 CSS 过渡的仍用 CSS：原生 popover / dialog 被 Esc、点击外部关闭时，JS 来不及介入。
 */
import {
  animate,
  cubicBezier,
  spring,
  type AnimationParams,
  type EasingParam,
  type JSAnimation,
} from 'animejs';
import { onScopeDispose } from 'vue';
import { readToken } from '../../config/theme/theme';
import { durations, easings } from '../../config/theme/tokens.stylex';

/** themeTransition 的选项：取哪一档时长与缓动，或用弹簧 */
export interface ThemeTransitionOptions {
  /** 时长档位，默认 md */
  duration?: keyof (typeof durations)['__tokens'];
  /** 缓动曲线，默认 standard；给了 bounce 时不用 */
  ease?: keyof (typeof easings)['__tokens'];
  /** 弹簧的回弹程度（0 不回弹，越大越弹，建议不超过 0.5）：给了就用弹簧，时长档位作为弹簧的感知时长 */
  bounce?: number;
}

/** themeTransition 的结果：展开到 Anime.js 的 animate、createLayout 等的参数里 */
export interface ThemeTiming {
  /** 时长（毫秒）；用弹簧时不给，由弹簧决定 */
  duration?: number;
  /** 缓动曲线或弹簧 */
  ease?: EasingParam;
}

/** 按主题 tokens 生成 Anime.js 的时长与缓动参数，展开到 animate 的参数里；element 决定读哪个主题范围里的取值 */
export function themeTransition(
  element: Element,
  { duration = 'md', ease = 'standard', bounce }: ThemeTransitionOptions = {},
): ThemeTiming {
  const milliseconds = parseDuration(readToken(element, durations[duration]));
  if (milliseconds === 0) return { duration: 0 };
  if (bounce != null) return { ease: spring({ bounce, duration: milliseconds }) };
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

/** useAnimate 返回的函数：给元素（或任何 JS 对象）做一次取主题时长的动画，返回 Anime.js 的动画（可以 await） */
export type ThemeAnimate = <Target extends object>(
  target: Target,
  params: AnimationParams,
  transition?: ThemeAnimateOptions,
) => JSAnimation;

/** useAnimate 的时长选项：主题档位，加上按哪个元素读主题 */
export interface ThemeAnimateOptions extends ThemeTransitionOptions {
  /** 读这个元素上的主题取值；目标是元素时默认是它，否则（JS 对象、描线的代理）默认是根元素 */
  scope?: Element;
}

/**
 * 同 themeTransition，但读不到主题 token（页面没加载组件库的样式，如单元测试）时返回时长 0（直接到位），
 * 不让动画报错打断交互。组件里的动画都用它。
 */
export function themeTransitionOrInstant(
  element: Element,
  transition?: ThemeTransitionOptions,
): ThemeTiming {
  try {
    return themeTransition(element, transition);
  } catch {
    return { duration: 0 };
  }
}

/**
 * 组件里的 JS 动画（在 setup 里调用）：时长、缓动、弹簧取主题 tokens（themeTransition），组件卸载时取消还在跑的动画。
 * 同一目标同一属性上的新动画会替换旧的（Anime.js 默认的 composition: 'replace'），快速连续触发不会互相打架；
 * params 里写的 duration、ease 优先于主题。目标不是元素（JS 对象、描线的代理）时按 scope（默认根元素）读主题。
 *
 *   const animate = useAnimate();
 *   animate(item, { x: 0, opacity: 1 }, { bounce: 0.35 });                       // 弹回
 *   await animate(item, { x: width, opacity: 0 }, { duration: 'sm', ease: 'exit' }); // 滑出后再移除
 */
export function useAnimate(): ThemeAnimate {
  const running = new Set<JSAnimation>();
  onScopeDispose(() => {
    for (const animation of running) void animation.cancel();
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
    // 时长为 0（减少动态效果、读不到主题）时当场到位：不等下一帧，读取结果的代码不会先看到旧值
    if (animation.duration < 1) return animation.complete();
    running.add(animation);
    return animation;
  };
}
