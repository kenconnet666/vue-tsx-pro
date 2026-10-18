/**
 * 主题 tokens：组件里的颜色、字体、间距、圆角、阴影、动效都只从这里取，不写裸值。
 * StyleX 要求 defineVars 写在 *.stylex.ts 文件里并导出。这里的取值即亮色主题，暗色主题见 dark.ts。
 *
 * 取舍参考：
 *   - 颜色与阴影取自 Radix Colors / Radix Themes，按 Radix 12 级的用途约定映射成语义 token
 *     （1–2 背景，3–5 交互填充，6–8 边框，9–10 实色，11–12 文字）
 *   - 尺寸、间距、圆角用 em，随组件字号等比缩放（字号即尺寸档位，见 COMPONENTS.md §3）
 *   - 动效时长与缓动参考 Material 3
 *   - 不设 z-index：弹出层、对话框用原生 popover / dialog，渲染在顶层（top layer），不参与层叠顺序
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

/** 颜色：slate 中性色、indigo 品牌色、red 危险、green 成功、amber 警告、blue 信息 */
export const colors = stylex.defineVars({
  // ───────── 背景与表面 ─────────

  /** 页面背景。slate 1：亮色 `#fcfcfd`，暗色 `#111113` */
  background: '#fcfcfd',
  /** 卡片、输入框等表面。亮色 slate 1 `#fcfcfd`，暗色 slate 2 `#18191b` */
  surface: '#fcfcfd',
  /** 弱化的区域背景：表头、侧栏、代码块。slate 2：亮色 `#f9f9fb`，暗色 `#18191b` */
  surfaceMuted: '#f9f9fb',
  /** 浮层（弹出框、菜单、对话框）表面。亮色 slate 1 `#fcfcfd`（靠阴影区分），暗色 slate 3 `#212225` */
  surfaceRaised: '#fcfcfd',

  // ───────── 中性填充：没有背景的元素在交互时铺的底色 ─────────

  /** 填充：标签、开关关闭态、弱按钮。slate 3：亮色 `#f0f0f3`，暗色 `#212225` */
  fill: '#f0f0f3',
  /** 填充悬停；也用于幽灵按钮、菜单项的悬停背景。slate 4：亮色 `#e8e8ec`，暗色 `#272a2d` */
  fillHover: '#e8e8ec',
  /** 填充按下、选中。slate 5：亮色 `#e0e1e6`，暗色 `#2e3135` */
  fillActive: '#e0e1e6',

  // ───────── 文字 ─────────

  /** 主要文字。slate 12：亮色 `#1c2024`，暗色 `#edeef0` */
  text: '#1c2024',
  /** 次要文字、说明、图标。slate 11：亮色 `#60646c`，暗色 `#b0b4ba` */
  textMuted: '#60646c',
  /** 输入框占位文字。slate 10：亮色 `#80838d`，暗色 `#777b84` */
  textPlaceholder: '#80838d',
  /** 不可用的文字。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169` */
  textDisabled: '#b9bbc6',

  // ───────── 边框 ─────────

  /** 弱边框：分割线、表格线。slate 6：亮色 `#d9d9e0`，暗色 `#363a3f` */
  borderMuted: '#d9d9e0',
  /** 普通边框：输入框、卡片、浮层。slate 7：亮色 `#cdced6`，暗色 `#43484e` */
  border: '#cdced6',
  /** 强调边框：悬停。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169` */
  borderStrong: '#b9bbc6',

  // ───────── 品牌色 ─────────

  /** 品牌色实色：主按钮、选中的复选框。indigo 9：两套主题都是 `#3e63dd` */
  accent: '#3e63dd',
  /** 品牌色实色悬停。indigo 10：亮色 `#3358d4`，暗色 `#5472e4` */
  accentHover: '#3358d4',
  /** 品牌色实色上的文字与图标。Radix 规定 indigo 9 上用白字：`#ffffff` */
  accentContrast: '#ffffff',
  /** 品牌色文字：链接、选中项的文字。indigo 11：亮色 `#3a5bc7`，暗色 `#9eb1ff` */
  accentText: '#3a5bc7',
  /** 品牌色浅底：选中行、弱主按钮。indigo 3：亮色 `#edf2fe`，暗色 `#182449` */
  accentSoft: '#edf2fe',
  /** 品牌色浅底悬停。indigo 4：亮色 `#e1e9ff`，暗色 `#1d2e62` */
  accentSoftHover: '#e1e9ff',
  /** 品牌色边框：选中的卡片、弱主按钮描边。indigo 7：亮色 `#abbdf9`，暗色 `#3a4f97` */
  accentBorder: '#abbdf9',

  // ───────── 危险：删除等破坏性操作、校验错误 ─────────

  /** 危险实色：危险按钮。red 9：两套主题都是 `#e5484d` */
  danger: '#e5484d',
  /** 危险实色悬停。red 10：亮色 `#dc3e42`，暗色 `#ec5d5e` */
  dangerHover: '#dc3e42',
  /** 危险实色上的文字与图标：`#ffffff` */
  dangerContrast: '#ffffff',
  /** 危险文字：错误提示。red 11：亮色 `#ce2c31`，暗色 `#ff9592` */
  dangerText: '#ce2c31',
  /** 危险浅底：错误提示条。red 3：亮色 `#feebec`，暗色 `#3b1219` */
  dangerSoft: '#feebec',
  /** 危险浅底悬停。red 4：亮色 `#ffdbdc`，暗色 `#500f1c` */
  dangerSoftHover: '#ffdbdc',
  /** 危险边框：校验失败的输入框。red 7：亮色 `#f4a9aa`，暗色 `#8c333a` */
  dangerBorder: '#f4a9aa',

  // ───────── 提示色：只用于提示条、徽标、图标，不做按钮 ─────────

  /** 成功文字与图标。green 11：亮色 `#218358`，暗色 `#3dd68c` */
  successText: '#218358',
  /** 成功浅底。green 3：亮色 `#e6f6eb`，暗色 `#132d21` */
  successSoft: '#e6f6eb',
  /** 成功边框。green 7：亮色 `#8eceaa`，暗色 `#28684a` */
  successBorder: '#8eceaa',
  /** 警告文字与图标。amber 11：亮色 `#ab6400`，暗色 `#ffca16` */
  warningText: '#ab6400',
  /** 警告浅底。amber 3：亮色 `#fff7c2`，暗色 `#302008` */
  warningSoft: '#fff7c2',
  /** 警告边框。amber 7：亮色 `#e9c162`，暗色 `#714f19` */
  warningBorder: '#e9c162',
  /** 信息文字与图标。blue 11：亮色 `#0d74ce`，暗色 `#70b8ff` */
  infoText: '#0d74ce',
  /** 信息浅底。blue 3：亮色 `#e6f4fe`，暗色 `#0d2847` */
  infoSoft: '#e6f4fe',
  /** 信息边框。blue 7：亮色 `#8ec8f6`，暗色 `#205d9e` */
  infoBorder: '#8ec8f6',

  // ───────── 其他 ─────────

  /**
   * 焦点环（:focus-visible）。indigo 9：两套主题都是 `#3e63dd`。
   * Radix 建议 7–8 级，但亮色下对比度不到 3:1（WCAG 2.2 焦点外观要求），所以用 9 级
   */
  focusRing: '#3e63dd',
  /** 模态遮罩。亮色 blackA 6 `rgba(0, 0, 0, 0.4)`，暗色 blackA 8 `rgba(0, 0, 0, 0.6)` */
  overlay: 'rgba(0, 0, 0, 0.4)',
});

/** 字体与字号：组件默认继承上下文字号，size 档位只用来覆盖 */
export const fonts = stylex.defineVars({
  /** 正文字体族 */
  family:
    'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  /** 等宽字体族：代码、数字对齐 */
  familyMono: 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  /** 基准字号：Provider 用它设置区域内的文字大小 */
  size: '14px',
  /** `size="sm"` 的字号 */
  sizeSm: '12px',
  /** `size="md"` 的字号 */
  sizeMd: '14px',
  /** `size="lg"` 的字号 */
  sizeLg: '16px',
  /** 小标题 */
  sizeXl: '20px',
  /** 标题 */
  size2xl: '24px',
  /** 大标题 */
  size3xl: '30px',
  /** 正文行高 */
  lineHeight: '1.5',
  /** 紧凑行高：标题、按钮等单行控件 */
  lineHeightTight: '1.25',
  /** 正文字重 */
  weightNormal: '400',
  /** 中等字重：标签、表头 */
  weightMedium: '500',
  /** 强调字重：按钮、标题 */
  weightStrong: '600',
});

/** 间距：em，随组件字号缩放；页面级布局间距由宿主决定 */
export const space = stylex.defineVars({
  /** `0.25em`：图标与文字的最小间隔 */
  xxs: '0.25em',
  /** `0.5em`：控件内部元素间隔 */
  xs: '0.5em',
  /** `0.75em`：控件水平内边距 */
  sm: '0.75em',
  /** `1em`：浮层内边距、表单项间隔 */
  md: '1em',
  /** `1.5em`：卡片、对话框内边距 */
  lg: '1.5em',
  /** `2em`：区块间隔 */
  xl: '2em',
  /** `3em`：大区块间隔 */
  xxl: '3em',
});

/** 圆角：em，随组件字号缩放；整体改成直角或更圆时覆盖这一组 */
export const radii = stylex.defineVars({
  /** 小圆角：标签、复选框、控件内的小按钮 */
  sm: '0.25em',
  /** 中圆角：按钮、输入框 */
  md: '0.4em',
  /** 大圆角：卡片、浮层 */
  lg: '0.7em',
  /** 特大圆角：对话框 */
  xl: '1em',
  /** 全圆：胶囊按钮、头像、开关 */
  full: '9999px',
});

/** 交互控件的通用规格 */
export const controls = stylex.defineVars({
  /** 单行控件（按钮、输入框、下拉框）的高度 */
  height: '2.25em',
  /** 可点击区域的最小尺寸（WCAG 2.2 目标尺寸 24×24），与 height 取较大值 */
  minTarget: '24px',
  /** 边框宽度 */
  borderWidth: '1px',
  /** 焦点环宽度 */
  focusRingWidth: '2px',
  /** 焦点环与元素的间隔；输入框等有边框的控件用负值让焦点环压住边框 */
  focusRingOffset: '2px',
  /** 不可用元素的不透明度 */
  disabledOpacity: '0.5',
});

/** 阴影：取自 Radix Themes 的阴影档位，去掉了模拟边框的 1px 描边（组件自己画边框） */
export const shadows = stylex.defineVars({
  /** 卡片：贴近表面的轻阴影（Radix shadow-2） */
  card: '0 1px 1px 0 #00005506, 0 2px 1px -1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  /** 浮层：弹出框、菜单、提示（Radix shadow-5） */
  popover: '0 12px 60px rgba(0, 0, 0, 0.15), 0 12px 32px -16px #0009321f',
  /** 对话框（Radix shadow-6） */
  dialog: '0 12px 60px rgba(0, 0, 0, 0.15), 0 16px 64px #00005506, 0 16px 36px -20px #00062e32',
});

/** 动效：时长与缓动参考 Material 3；用户开启“减少动态效果”时，组件应跳过动画 */
export const motion = stylex.defineVars({
  /** 快速：悬停、按压的颜色变化 */
  durationFast: '120ms',
  /** 常规：展开、淡入、浮层出现 */
  durationNormal: '200ms',
  /** 慢速：对话框、抽屉等大面积的进出 */
  durationSlow: '300ms',
  /** 标准缓动：位置与尺寸变化 */
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  /** 进入缓动：元素出现（先快后慢） */
  easingEnter: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  /** 退出缓动：元素消失（先慢后快） */
  easingExit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
});
