/**
 * 顶层元素（原生 popover、模态 dialog）的进出场过渡，纯 CSS：
 *   - 进场：打开状态（:popover-open / :modal）里用 @starting-style 给出起始值
 *   - 离场：display 与 overlay 加 allow-discrete，关闭后先播完过渡、再离开顶层
 * 原生弹层被 Esc、点击外部关闭时 JS 来不及介入，所以不用 JS 动画。
 * 用法：`sx: [styles.panel, transitions.scale]`；遮罩再加 `transitions.backdrop`。
 * 进场用 enter 缓动与 md 时长，离场用 exit 缓动与更短的 sm 时长；“减少动态效果”时时长为 0。
 * 离场过渡依赖 CSS 的 overlay，目前只有 Chromium 支持；Firefox、Safari 关闭后立即隐藏（三大浏览器实测），
 * 进场过渡各浏览器都有。属于渐进增强：不支持时少了离场动画，状态不受影响。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { t } from '../../config/theme/tokens';

/** 顶层元素的进出场过渡：fade 淡入淡出、scale 缩放加淡入、backdrop 模态遮罩的淡入 */
export const transitions = css.create({
  /** 淡入淡出 */
  fade: {
    opacity: {
      default: 0,
      ':popover-open': { default: 1, '@starting-style': 0 },
      ':modal': { default: 1, '@starting-style': 0 },
    },
    transition: {
      default: `opacity ${t.durations.sm} ${t.easings.exit}, display ${t.durations.sm} allow-discrete, overlay ${t.durations.sm} allow-discrete`,
      ':popover-open': `opacity ${t.durations.md} ${t.easings.enter}, display ${t.durations.md} allow-discrete, overlay ${t.durations.md} allow-discrete`,
      ':modal': `opacity ${t.durations.md} ${t.easings.enter}, display ${t.durations.md} allow-discrete, overlay ${t.durations.md} allow-discrete`,
    },
  },
  /** 淡入并从略小放大到原尺寸：弹出框、菜单、对话框；缩放原点按弹出方向设置 transformOrigin */
  scale: {
    opacity: {
      default: 0,
      ':popover-open': { default: 1, '@starting-style': 0 },
      ':modal': { default: 1, '@starting-style': 0 },
    },
    transform: {
      default: 'scale(0.96)',
      ':popover-open': { default: 'none', '@starting-style': 'scale(0.96)' },
      ':modal': { default: 'none', '@starting-style': 'scale(0.96)' },
    },
    transition: {
      default: `opacity ${t.durations.sm} ${t.easings.exit}, transform ${t.durations.sm} ${t.easings.exit}, display ${t.durations.sm} allow-discrete, overlay ${t.durations.sm} allow-discrete`,
      ':popover-open': `opacity ${t.durations.md} ${t.easings.enter}, transform ${t.durations.md} ${t.easings.enter}, display ${t.durations.md} allow-discrete, overlay ${t.durations.md} allow-discrete`,
      ':modal': `opacity ${t.durations.md} ${t.easings.enter}, transform ${t.durations.md} ${t.easings.enter}, display ${t.durations.md} allow-discrete, overlay ${t.durations.md} allow-discrete`,
    },
  },
  /** 模态遮罩淡入淡出，颜色取 colors.overlay */
  backdrop: {
    '::backdrop': {
      backgroundColor: {
        default: 'transparent',
        ':modal': { default: '_overlay', '@starting-style': 'transparent' },
      },
      transition: {
        default: `background-color ${t.durations.sm} ${t.easings.exit}, display ${t.durations.sm} allow-discrete, overlay ${t.durations.sm} allow-discrete`,
        ':modal': `background-color ${t.durations.md} ${t.easings.enter}, display ${t.durations.md} allow-discrete, overlay ${t.durations.md} allow-discrete`,
      },
    },
  },
});

/** 交互状态的过渡：悬停、按下、选中、聚焦时颜色与阴影的变化（按钮、列表项、标签、输入框外壳共用） */
export const interactionTransitions = css.create({
  /** 背景色、边框色、文字色、阴影在 durations.sm 内过渡 */
  colors: {
    transition: `background-color ${t.durations.sm} ${t.easings.standard}, border-color ${t.durations.sm} ${t.easings.standard}, color ${t.durations.sm} ${t.easings.standard}, box-shadow ${t.durations.sm} ${t.easings.standard}`,
  },
});

/** 展开指示（chevron）的旋转过渡；旋转角度由各组件给（右指向下 90°，下指向上 180°） */
export const disclosureStyles = css.create({
  /** 旋转在 durations.sm 内过渡 */
  icon: { transition: `rotate ${t.durations.sm} ${t.easings.standard}` },
});

/**
 * 配合 usePresence 的淡入淡出：进场用 enter 缓动，离场（presence.state 为 closed）淡出到 0 用 exit 缓动。
 *   sx: [styles.root, presenceStyles.fade, presence.state === 'closed' && presenceStyles.leaving]
 */
export const presenceStyles = css.create({
  /** 进场 */
  fade: { transition: `opacity ${t.durations.sm} ${t.easings.enter}` },
  /** 离场：淡出 */
  leaving: { opacity: 0, transition: `opacity ${t.durations.sm} ${t.easings.exit}` },
});

/**
 * 等元素（含子元素）上正在进行的过渡与动画结束；没有时立即完成，“减少动态效果”时也就立即完成。
 * 被打断（取消、反向）的动画也算结束，调用方按当前状态决定下一步。
 * 无限循环的动画（加载指示的旋转）永远不会结束，不等它。
 * 最多等 timeout 毫秒（默认 1500，比主题最长的时长宽裕得多）：Linux 上的 WebKit 偶尔把过渡停在起点不动，
 * 不能让离场、收起的流程一直挂着。
 */
export async function afterTransitions(
  element: Element,
  { timeout = 1500 }: { timeout?: number } = {},
): Promise<void> {
  const animations = element
    .getAnimations({ subtree: true })
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
  if (!animations.length) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.allSettled(animations.map((animation) => animation.finished)),
    new Promise((resolve) => (timer = setTimeout(resolve, timeout))),
  ]);
  clearTimeout(timer);
}
