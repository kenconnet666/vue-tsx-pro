/**
 * 主题 tokens：组件里的颜色、字号、圆角、阴影、动效都只从这里取。
 * StyleX 要求 defineVars 写在 *.stylex.ts 文件里并导出。暗色取值见 themes.ts。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

/** 颜色 */
export const colors = stylex.defineVars({
  /** 页面背景。亮色 `#ffffff`，暗色 `#111113` */
  background: '#ffffff',
  /** 卡片、输入框等表面。亮色 `#ffffff`，暗色 `#18181b` */
  surface: '#ffffff',
  /** 浮层（弹出框、菜单）表面。亮色 `#ffffff`，暗色 `#222226` */
  surfaceRaised: '#ffffff',
  /** 悬停、选中等轻微强调的背景。亮色 `#f2f2f5`，暗色 `#27272b` */
  surfaceHover: '#f2f2f5',
  /** 主要文字。亮色 `#1b1b1f`，暗色 `#ececef` */
  text: '#1b1b1f',
  /** 次要文字、说明、占位符。亮色 `#62626b`，暗色 `#a0a0ab` */
  textMuted: '#62626b',
  /** 普通边框。亮色 `#d9d9e0`，暗色 `#3a3a40` */
  border: '#d9d9e0',
  /** 强调边框（悬停、聚焦前）。亮色 `#b9b9c3`，暗色 `#55555d` */
  borderStrong: '#b9b9c3',
  /** 品牌色：主按钮、选中态。亮色 `#3e63dd`，暗色 `#5b7ff0` */
  accent: '#3e63dd',
  /** 品牌色悬停。亮色 `#3557c8`，暗色 `#7593f3` */
  accentHover: '#3557c8',
  /** 品牌色背景上的文字。两套主题都是 `#ffffff` */
  accentText: '#ffffff',
  /** 危险、错误。亮色 `#d93036`，暗色 `#f0605d` */
  danger: '#d93036',
  /** 成功。亮色 `#218358`，暗色 `#3dd68c` */
  success: '#218358',
  /** 警告。亮色 `#ad5700`，暗色 `#ffb224` */
  warning: '#ad5700',
  /** 焦点环（:focus-visible）。亮色 `#3e63dd`，暗色 `#7593f3` */
  focusRing: '#3e63dd',
  /** 模态遮罩。亮色 `rgb(0 0 0 / 0.4)`，暗色 `rgb(0 0 0 / 0.6)` */
  overlay: 'rgb(0 0 0 / 0.4)',
});

/** 字号与形状：尺寸都用 em，随组件根元素的字号等比缩放 */
export const sizes = stylex.defineVars({
  /** 基准字号；组件默认继承上下文字号，Provider 用它设置页面区域的基准 */
  fontSize: '14px',
  /** `size="sm"` 的字号 */
  fontSizeSm: '12px',
  /** `size="md"` 的字号 */
  fontSizeMd: '14px',
  /** `size="lg"` 的字号 */
  fontSizeLg: '16px',
  /** 小圆角：标签、复选框 */
  radiusSm: '0.25em',
  /** 中圆角：按钮、输入框 */
  radiusMd: '0.4em',
  /** 大圆角：卡片、浮层 */
  radiusLg: '0.7em',
});

/** 字体 */
export const fonts = stylex.defineVars({
  /** 正文字体族 */
  family:
    'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  /** 等宽字体族 */
  mono: 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  /** 正文字重 */
  weightNormal: '400',
  /** 强调字重：按钮、标题 */
  weightStrong: '600',
});

/** 阴影 */
export const shadows = stylex.defineVars({
  /** 浮层阴影：弹出框、菜单 */
  popover: '0 0.5em 1.5em rgb(0 0 0 / 0.12), 0 0.1em 0.3em rgb(0 0 0 / 0.08)',
  /** 模态阴影：对话框 */
  dialog: '0 1em 3em rgb(0 0 0 / 0.2)',
});

/** 动效；用户开启“减少动态效果”时，组件应跳过动画 */
export const motion = stylex.defineVars({
  /** 快速：悬停、按压 */
  durationFast: '120ms',
  /** 常规：展开、淡入 */
  durationNormal: '200ms',
  /** 缓动曲线 */
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
});
