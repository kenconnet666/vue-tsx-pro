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
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleTable } from './styles';

// 写明类型：导出的 stylex.create 结果若靠推导，类型声明里会引用 StyleX 内部无法命名的类型
/** 顶层元素的进出场过渡：fade 淡入淡出、scale 缩放加淡入、backdrop 模态遮罩的淡入 */
export const transitions: StyleTable<'fade' | 'scale' | 'backdrop'> = stylex.create({
  /** 淡入淡出 */
  fade: {
    opacity: {
      default: 0,
      ':popover-open': { default: 1, '@starting-style': 0 },
      ':modal': { default: 1, '@starting-style': 0 },
    },
    transition: {
      default:
        'opacity _durations.sm _easings.exit, display _durations.sm allow-discrete, overlay _durations.sm allow-discrete',
      ':popover-open':
        'opacity _durations.md _easings.enter, display _durations.md allow-discrete, overlay _durations.md allow-discrete',
      ':modal':
        'opacity _durations.md _easings.enter, display _durations.md allow-discrete, overlay _durations.md allow-discrete',
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
      default:
        'opacity _durations.sm _easings.exit, transform _durations.sm _easings.exit, display _durations.sm allow-discrete, overlay _durations.sm allow-discrete',
      ':popover-open':
        'opacity _durations.md _easings.enter, transform _durations.md _easings.enter, display _durations.md allow-discrete, overlay _durations.md allow-discrete',
      ':modal':
        'opacity _durations.md _easings.enter, transform _durations.md _easings.enter, display _durations.md allow-discrete, overlay _durations.md allow-discrete',
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
        default:
          'background-color _durations.sm _easings.exit, display _durations.sm allow-discrete, overlay _durations.sm allow-discrete',
        ':modal':
          'background-color _durations.md _easings.enter, display _durations.md allow-discrete, overlay _durations.md allow-discrete',
      },
    },
  },
});

/**
 * 等元素（含子元素）上正在进行的过渡与动画结束；没有时立即完成，“减少动态效果”时也就立即完成。
 * 被打断（取消、反向）的动画也算结束，调用方按当前状态决定下一步。
 */
export async function afterTransitions(element: Element): Promise<void> {
  const animations = element.getAnimations({ subtree: true });
  await Promise.allSettled(animations.map((animation) => animation.finished));
}
