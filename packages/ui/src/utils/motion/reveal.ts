/**
 * 整页切换的过渡（View Transitions API）：从一个点圆形展开新画面，用于切换主题这类整页变化。
 *
 *   revealTransition(() => (theme = next), { x: event.clientX, y: event.clientY });
 *
 * 浏览器不支持 View Transitions、或开启了“减少动态效果”时直接更新；没给起点时是浏览器默认的淡入淡出。
 * 时长与缓动取主题 tokens（durations.lg、easings.standard）。
 */
import { nextTick } from 'vue';
import { durations, easings } from '../../config/theme/tokens.stylex';
import { readToken } from '../../config/theme/theme';
import { parseDuration } from './animation';

/** 圆形展开的起点（视口坐标，px） */
export interface RevealOrigin {
  /** 横坐标 */
  x: number;
  /** 纵坐标 */
  y: number;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/**
 * 圆形展开时去掉浏览器默认的淡入淡出：只插入一次，只对带 data-vtp-reveal 的根元素生效（转场期间才带），
 * 不影响宿主自己的 View Transitions
 */
let styleInserted = false;
function insertRevealStyle() {
  if (styleInserted) return;
  styleInserted = true;
  const style = document.createElement('style');
  style.dataset.vtpReveal = '';
  style.textContent =
    ':root[data-vtp-reveal]::view-transition-old(root),:root[data-vtp-reveal]::view-transition-new(root){animation:none;mix-blend-mode:normal}';
  document.head.append(style);
}

/** 执行 update（改主题、换页面），能过渡时从 origin 圆形展开新画面；返回过渡开始后兑现的 Promise */
export async function revealTransition(update: () => void, origin?: RevealOrigin): Promise<void> {
  const doc = typeof document === 'undefined' ? undefined : (document as ViewTransitionDocument);
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc?.startViewTransition || reduced) {
    update();
    return;
  }
  const root = doc.documentElement;
  if (origin) {
    insertRevealStyle();
    root.dataset.vtpReveal = '';
  }
  let failed = false;
  const transition = doc.startViewTransition(async () => {
    try {
      update();
    } catch (error) {
      failed = true;
      throw error;
    }
    // 等 Vue 把新主题写进 DOM，浏览器才截到新画面
    await nextTick();
  });
  void transition.finished.finally(() => delete root.dataset.vtpReveal).catch(() => {});
  try {
    await transition.ready;
  } catch (error) {
    // update 出错照常抛给调用方；转场被跳过（又开始了一个）时没有动画可做，不算错误
    if (failed) throw error;
    return;
  }
  if (!origin) return;
  const radius = Math.hypot(
    Math.max(origin.x, innerWidth - origin.x),
    Math.max(origin.y, innerHeight - origin.y),
  );
  root.animate(
    {
      clipPath: [
        `circle(0px at ${origin.x}px ${origin.y}px)`,
        `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
      ],
    },
    {
      duration: parseDuration(readToken(root, durations.lg)),
      easing: readToken(root, easings.standard),
      pseudoElement: '::view-transition-new(root)',
    },
  );
}
