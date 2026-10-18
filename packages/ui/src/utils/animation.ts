/**
 * JS 动画用 Anime.js（MIT）：animate、createTimeline、spring、stagger、createDraggable、createLayout 等直接从 'animejs' 导入，
 * 这里只补一件 Anime.js 不知道的事 —— 时长、缓动、弹簧取主题 tokens 的当前值：
 * 主题覆盖的时长照样生效；开启“减少动态效果”时 durations 为 0，JS 动画也就立即完成
 * （Anime.js 不会自动处理 prefers-reduced-motion）。
 *
 *   animate(panel, { x: 0, ...themeTransition(panel, { duration: 'lg', ease: 'enter' }) })
 *   animate(card, { scale: 1, ...themeTransition(card, { bounce: 0.3 }) })   // 弹簧
 *
 * 进出场、展开收起能用 CSS 过渡的仍用 CSS：原生 popover / dialog 被 Esc、点击外部关闭时，JS 来不及介入。
 */
import { cubicBezier, spring, type AnimationParams } from 'animejs';
import { readToken } from '../config/theme/theme';
import { durations, easings } from '../config/theme/tokens.stylex';

export interface ThemeTransitionOptions {
  /** 时长档位，默认 md */
  duration?: keyof (typeof durations)['__tokens'];
  /** 缓动曲线，默认 standard；给了 bounce 时不用 */
  ease?: keyof (typeof easings)['__tokens'];
  /** 弹簧的回弹程度（0 不回弹，越大越弹，建议不超过 0.5）：给了就用弹簧，时长档位作为弹簧的感知时长 */
  bounce?: number;
}

/** 按主题 tokens 生成 Anime.js 的时长与缓动参数，展开到 animate 的参数里；element 决定读哪个主题范围里的取值 */
export function themeTransition(
  element: Element,
  { duration = 'md', ease = 'standard', bounce }: ThemeTransitionOptions = {},
): Pick<AnimationParams, 'duration' | 'ease'> {
  const milliseconds = parseDuration(readToken(element, durations[duration]));
  if (milliseconds === 0) return { duration: 0 };
  if (bounce != null) return { ease: spring({ bounce, duration: milliseconds }) };
  return {
    duration: milliseconds,
    ease: cubicBezier(...parseEasing(readToken(element, easings[ease]))),
  };
}

/** '200ms' / '0.2s' → 200 */
function parseDuration(value: string) {
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
