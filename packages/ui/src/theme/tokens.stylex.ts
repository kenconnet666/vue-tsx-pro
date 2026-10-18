/**
 * 主题 tokens：组件里的颜色、字号、圆角、阴影、动效都只从这里取。
 * StyleX 要求 defineVars 写在 *.stylex.ts 文件里并导出。暗色取值见 themes.ts。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

/** 颜色：取自 Radix Colors（slate 中性色、indigo 品牌色），每级的用途遵循 Radix 的 12 级约定 */
export const colors = stylex.defineVars({
  /** 页面背景。slate 1：亮色 `#fcfcfd`，暗色 `#111113` */
  background: '#fcfcfd',
  /** 卡片、输入框等表面。亮色 slate 1 `#fcfcfd`，暗色 slate 2 `#18191b` */
  surface: '#fcfcfd',
  /** 浮层（弹出框、菜单）表面。亮色 slate 1 `#fcfcfd`（靠阴影区分），暗色 slate 3 `#212225` */
  surfaceRaised: '#fcfcfd',
  /** 悬停、选中等轻微强调的背景。slate 4：亮色 `#e8e8ec`，暗色 `#272a2d` */
  surfaceHover: '#e8e8ec',
  /** 主要文字。slate 12：亮色 `#1c2024`，暗色 `#edeef0` */
  text: '#1c2024',
  /** 次要文字、说明、占位符。slate 11：亮色 `#60646c`，暗色 `#b0b4ba` */
  textMuted: '#60646c',
  /** 普通边框：输入框、卡片、浮层。slate 7：亮色 `#cdced6`，暗色 `#43484e` */
  border: '#cdced6',
  /** 强调边框（悬停）。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169` */
  borderStrong: '#b9bbc6',
  /** 品牌色：主按钮、选中态。indigo 9：两套主题都是 `#3e63dd` */
  accent: '#3e63dd',
  /** 品牌色悬停。indigo 10：亮色 `#3358d4`，暗色 `#5472e4` */
  accentHover: '#3358d4',
  /** 品牌色背景上的文字。Radix 规定 indigo 9 上用白字：`#ffffff` */
  accentText: '#ffffff',
  /** 危险、错误的文字与图标。red 11：亮色 `#ce2c31`，暗色 `#ff9592` */
  danger: '#ce2c31',
  /** 成功的文字与图标。green 11：亮色 `#218358`，暗色 `#3dd68c` */
  success: '#218358',
  /** 警告的文字与图标。amber 11：亮色 `#ab6400`，暗色 `#ffca16` */
  warning: '#ab6400',
  /**
   * 焦点环（:focus-visible）。indigo 9：两套主题都是 `#3e63dd`。
   * Radix 建议 7–8 级，但亮色下对比度不到 3:1（WCAG 2.2 焦点外观要求），所以用 9 级
   */
  focusRing: '#3e63dd',
  /** 模态遮罩。亮色 blackA 6 `rgba(0, 0, 0, 0.4)`，暗色 blackA 8 `rgba(0, 0, 0, 0.6)` */
  overlay: 'rgba(0, 0, 0, 0.4)',
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
