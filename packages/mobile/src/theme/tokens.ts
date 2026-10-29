/**
 * 移动端主题 tokens：组件里的颜色、字体、间距、圆角、阴影、动效都只从这里取，不写裸值。
 * 每组一个 defineVars，变量名是 `--vtm-组名-token`；这里的取值即亮色主题，暗色主题见 dark.ts。
 *
 * 用法同桌面组件库：值整个就是一个 token 时写字符串 '_md'、'_space.md'，文件末尾的 defineTokens 登记各组；
 * 值里夹着 token（计算、多值）时在模板字符串里用 `t`：`` transition: `opacity ${t.durations.md} ${t.easings.standard}` ``。
 *
 * 取舍：
 *   - 配色取自 Radix Colors（与桌面组件库同一套色板，风格一致）：slate 中性色、indigo 品牌色、red 危险、green 成功、amber 警告、blue 信息；
 *     移动端的页面底色比表面深一档（分组列表、卡片浮在灰底上，同 iOS 的分组背景）
 *   - 尺寸、间距、圆角用 em，随组件字号等比缩放；边框宽度用 px（含 0.5px 的细线）
 *   - 字号按 375 宽的设计稿：正文 14、标题 16–18；控件高度由组件按档位给（按钮 24 / 32 / 44 / 50）
 *   - 组名与桌面组件库相同，样式里的短写写法一致；token 短写是全局登记的，同一页面里不要混用两套组件库（MOBILE.md）
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';

/** 颜色：slate 中性色、indigo 品牌色、red 危险、green 成功、amber 警告、blue 信息 */
export const colors = css.defineVars('vtm-colors', {
  // ───────── 背景与表面 ─────────

  /** 页面底色：分组列表、卡片下面的灰底。slate 3：亮色 `#f0f0f3`，暗色 slate 1 `#111113` */
  background: '#f0f0f3',
  /** 单元格、卡片、弹出层的表面。亮色白色，暗色 slate 2 `#18191b` */
  surface: '#ffffff',
  /** 表面里再分一层：搜索框、步进器、标签的底。slate 2：亮色 `#f9f9fb`，暗色 slate 3 `#212225` */
  surfaceMuted: '#f9f9fb',

  // ───────── 中性填充 ─────────

  /** 填充：弱按钮、开关关闭态、骨架。slate 3：亮色 `#f0f0f3`，暗色 slate 4 `#272a2d` */
  fill: '#f0f0f3',
  /** 按下时的底色：单元格、菜单项按住。slate 4：亮色 `#e8e8ec`，暗色 slate 5 `#2e3135` */
  fillActive: '#e8e8ec',

  // ───────── 文字 ─────────

  /** 主要文字。slate 12：亮色 `#1c2024`，暗色 `#edeef0` */
  text: '#1c2024',
  /** 次要文字、说明、图标。slate 11：亮色 `#60646c`，暗色 `#b0b4ba` */
  textMuted: '#60646c',
  /** 占位文字。slate 10：亮色 `#80838d`，暗色 `#777b84` */
  textPlaceholder: '#80838d',
  /** 不可用的文字。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169` */
  textDisabled: '#b9bbc6',

  // ───────── 边框 ─────────

  /** 分隔线、单元格之间的细线。slate 6：亮色 `#d9d9e0`，暗色 `#363a3f` */
  border: '#d9d9e0',
  /** 输入框、描边按钮的边框。slate 7：亮色 `#cdced6`，暗色 `#43484e` */
  borderStrong: '#cdced6',

  // ───────── 品牌色 ─────────

  /** 品牌色：主要按钮、选中、开关打开。indigo 9 `#3e63dd` */
  accent: '#3e63dd',
  /** 品牌色按下。indigo 10：亮色 `#3358d4`，暗色 `#3758d4` */
  accentActive: '#3358d4',
  /** 品牌色上的文字。白色 */
  accentContrast: '#ffffff',
  /** 品牌色的文字（链接、浅色按钮的字）。indigo 11：亮色 `#3a5bc7`，暗色 `#9eb1ff` */
  accentText: '#3a5bc7',
  /** 品牌色的浅底。indigo 3：亮色 `#edf2fe`，暗色 `#182449` */
  accentSoft: '#edf2fe',
  /** 品牌色的浅底按下。indigo 4：亮色 `#e1e9ff`，暗色 `#1d2e62` */
  accentSoftActive: '#e1e9ff',
  /** 品牌色的边框。indigo 7：亮色 `#abbdf9`，暗色 `#3a4f97` */
  accentBorder: '#abbdf9',

  // ───────── 状态色：危险 ─────────

  /** 危险：删除、错误。red 9：亮色 `#ce2c31`，暗色 `#b54548` */
  danger: '#ce2c31',
  /** 危险按下。red 10：亮色 `#b8272c`，暗色 `#a33b3e` */
  dangerActive: '#b8272c',
  /** 危险色上的文字。白色 */
  dangerContrast: '#ffffff',
  /** 危险的文字。red 11：亮色 `#b8272c`，暗色 `#ff9592` */
  dangerText: '#b8272c',
  /** 危险的浅底。red 3：亮色 `#feebec`，暗色 `#3b1219` */
  dangerSoft: '#feebec',
  /** 危险的浅底按下。red 4：亮色 `#ffdbdc`，暗色 `#500f1c` */
  dangerSoftActive: '#ffdbdc',
  /** 危险的边框。red 7：亮色 `#f4a9aa`，暗色 `#8c333a` */
  dangerBorder: '#f4a9aa',

  // ───────── 状态色：成功 ─────────

  /** 成功。green 9：亮色 `#008751`，暗色 `#30a46c` */
  success: '#008751',
  /** 成功按下。亮色 `#007143`，暗色 `#52af7d` */
  successActive: '#007143',
  /** 成功色上的文字。亮色白色，暗色 slate 1 */
  successContrast: '#ffffff',
  /** 成功的文字。green 11：亮色 `#193b2d`，暗色 `#3dd68c` */
  successText: '#193b2d',
  /** 成功的浅底。green 3：亮色 `#e6f6eb`，暗色 `#132d21` */
  successSoft: '#e6f6eb',
  /** 成功的浅底按下。green 4：亮色 `#d6f1df`，暗色 `#113b29` */
  successSoftActive: '#d6f1df',
  /** 成功的边框。green 7：亮色 `#8eceaa`，暗色 `#28684a` */
  successBorder: '#8eceaa',

  // ───────── 状态色：警告 ─────────

  /** 警告。amber 9 `#ffc53d` */
  warning: '#ffc53d',
  /** 警告按下。amber 10 `#ffcd5f` */
  warningActive: '#ffcd5f',
  /** 警告色上的文字（深色）。亮色 `#4f3422`，暗色 slate 1 */
  warningContrast: '#4f3422',
  /** 警告的文字。amber 11：亮色 `#4f3422`，暗色 `#ffca16` */
  warningText: '#4f3422',
  /** 警告的浅底。amber 3：亮色 `#fff7c2`，暗色 `#302008` */
  warningSoft: '#fff7c2',
  /** 警告的浅底按下。amber 4：亮色 `#ffee9c`，暗色 `#3f2700` */
  warningSoftActive: '#ffee9c',
  /** 警告的边框。amber 7：亮色 `#e9c162`，暗色 `#714f19` */
  warningBorder: '#e9c162',

  // ───────── 状态色：信息 ─────────

  /** 信息。blue 9：亮色 `#0073e0`，暗色 `#0090ff` */
  info: '#0073e0',
  /** 信息按下。亮色 `#0060bd`，暗色 `#3d9fff` */
  infoActive: '#0060bd',
  /** 信息色上的文字。亮色白色，暗色 slate 1 */
  infoContrast: '#ffffff',
  /** 信息的文字。blue 11：亮色 `#113264`，暗色 `#70b8ff` */
  infoText: '#113264',
  /** 信息的浅底。blue 3：亮色 `#e6f4fe`，暗色 `#0d2847` */
  infoSoft: '#e6f4fe',
  /** 信息的浅底按下。blue 4：亮色 `#d5efff`，暗色 `#003362` */
  infoSoftActive: '#d5efff',
  /** 信息的边框。blue 7：亮色 `#8ec8f6`，暗色 `#205d9e` */
  infoBorder: '#8ec8f6',

  // ───────── 其他 ─────────

  /** 反色表面：轻提示（Toast）、气泡。亮色 slate 12 `#1c2024`，暗色 slate 12 `#edeef0` */
  inverseSurface: '#1c2024',
  /** 反色表面上的文字 */
  inverseText: '#fcfcfd',
  /** 遮罩：弹出层、对话框下面的半透明黑。亮色 0.5，暗色 0.7 */
  overlay: 'rgba(0, 0, 0, 0.5)',
  /** 焦点环（H5 的键盘焦点） */
  focusRing: '#3e63dd',
});

/** 字体族：系统字体优先，数字用等宽数字（组件里 fontVariantNumeric: 'tabular-nums'） */
export const fonts = css.defineVars('vtm-fonts', {
  /** 正文与标题 */
  sans: 'system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  /** 代码、验证码这类等宽内容 */
  mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
});

/** 字号（375 宽的设计稿）：组件根元素的字号决定内部尺寸（em） */
export const fontSizes = css.defineVars('vtm-font-sizes', {
  /** 辅助说明、标签、角标 `12px` */
  xs: '12px',
  /** 次要正文、小按钮 `13px` */
  sm: '13px',
  /** 正文、单元格 `14px` */
  md: '14px',
  /** 按钮、导航栏标题、强调正文 `16px` */
  lg: '16px',
  /** 弹窗标题 `18px` */
  xl: '18px',
  /** 页面标题 `20px` */
  xxl: '20px',
  /** 数值、结果页标题 `24px` */
  xxxl: '24px',
});

/** 字重 */
export const fontWeights = css.defineVars('vtm-font-weights', {
  /** 常规 `400` */
  normal: '400',
  /** 中等：按钮、标签页 `500` */
  medium: '500',
  /** 半粗：标题 `600` */
  semibold: '600',
  /** 粗：数值 `700` */
  bold: '700',
});

/** 行高（不带单位） */
export const lineHeights = css.defineVars('vtm-line-heights', {
  /** 单行控件 `1` */
  none: '1',
  /** 标题 `1.25` */
  tight: '1.25',
  /** 正文 `1.5` */
  normal: '1.5',
  /** 长段落 `1.75` */
  relaxed: '1.75',
});

/** 字距 */
export const letterSpacings = css.defineVars('vtm-letter-spacings', {
  /** 默认 `0` */
  normal: '0',
  /** 大号数字、标题略收 `-0.01em` */
  tight: '-0.01em',
  /** 全大写的小字略放 `0.02em` */
  wide: '0.02em',
});

/** 间距（em，随字号缩放） */
export const space = css.defineVars('vtm-space', {
  /** 没有间距 `0` */
  none: '0',
  /** 极小：图标与文字之间 `0.25em` */
  xs: '0.25em',
  /** 小：紧凑的内边距 `0.5em` */
  sm: '0.5em',
  /** 中：常用的间隔 `0.75em` */
  md: '0.75em',
  /** 大：单元格的左右内边距 `1em` */
  lg: '1em',
  /** 很大：分组之间 `1.5em` */
  xl: '1.5em',
  /** 特大：页面区块之间 `2em` */
  xxl: '2em',
});

/** 尺寸 */
export const sizes = css.defineVars('vtm-sizes', {
  /** 单行控件（输入框、单元格）的最小高度 `2.75em`（14px 字号时 38.5px，16px 时 44px） */
  control: '2.75em',
  /** 触控目标的最小尺寸 `44px`（iOS 人机界面指南） */
  touchTarget: '44px',
  /** 占满容器 `100%` */
  full: '100%',
});

/** 圆角（em） */
export const radii = css.defineVars('vtm-radii', {
  /** 直角 `0` */
  none: '0',
  /** 极小：角标、复选框 `0.125em` */
  xs: '0.125em',
  /** 小：标签、小按钮 `0.25em` */
  sm: '0.25em',
  /** 中：按钮、输入框 `0.5em` */
  md: '0.5em',
  /** 大：卡片、分组 `0.75em` */
  lg: '0.75em',
  /** 很大：弹出层、对话框 `1em` */
  xl: '1em',
  /** 全圆：胶囊按钮、头像 `9999px` */
  full: '9999px',
});

/** 边框宽度（px） */
export const borderWidths = css.defineVars('vtm-border-widths', {
  /** 没有边框 `0` */
  none: '0',
  /** 细线：单元格分隔线（高分屏上的半像素） `0.5px` */
  hairline: '0.5px',
  /** 常规边框 `1px` */
  xs: '1px',
  /** 焦点环、选中描边 `2px` */
  sm: '2px',
});

/** 阴影：亮色主题用，暗色主题靠表面的层级区分 */
export const shadows = css.defineVars('vtm-shadows', {
  /** 没有阴影 */
  none: 'none',
  /** 卡片 */
  sm: '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.08)',
  /** 悬浮按钮、吸顶的栏 */
  md: '0 4px 16px -4px rgba(0, 0, 0, 0.12), 0 2px 6px -2px rgba(0, 0, 0, 0.08)',
  /** 弹出层、对话框 */
  lg: '0 12px 40px -8px rgba(0, 0, 0, 0.2), 0 4px 12px -4px rgba(0, 0, 0, 0.1)',
});

const reduce = '@media (prefers-reduced-motion: reduce)';

/** 动效时长；系统开了"减少动态效果"时为 0 */
export const durations = css.defineVars('vtm-durations', {
  /** 没有过渡 `0ms` */
  none: '0ms',
  /** 按压反馈 `100ms` */
  xs: { default: '100ms', [reduce]: '0ms' },
  /** 颜色、开关 `160ms` */
  sm: { default: '160ms', [reduce]: '0ms' },
  /** 展开收起、提示进出 `240ms` */
  md: { default: '240ms', [reduce]: '0ms' },
  /** 弹出层滑入滑出 `300ms` */
  lg: { default: '300ms', [reduce]: '0ms' },
});

/** 缓动 */
export const easings = css.defineVars('vtm-easings', {
  /** 一般的过渡 */
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  /** 进场：快出慢停 */
  enter: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  /** 离场：慢起快走 */
  exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
});

/** 不透明度 */
export const opacities = css.defineVars('vtm-opacities', {
  /** 不可用 `0.5` */
  disabled: '0.5',
  /** 按下时叠在内容上的暗层（实底按钮） `0.1` */
  pressed: '0.1',
});

/** SVG 描边宽度（图标） */
export const strokeWidths = css.defineVars('vtm-stroke-widths', {
  /** 细 `1.5` */
  sm: '1.5',
  /** 常规 `2` */
  md: '2',
  /** 粗 `2.5` */
  lg: '2.5',
});

/** 各组 token 的变量引用，用在模板字符串里：`` `max(${t.sizes.control}, ${t.sizes.touchTarget})` `` */
export const t = css.defineTokens({
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  space,
  sizes,
  radii,
  borderWidths,
  shadows,
  durations,
  easings,
  opacities,
  strokeWidths,
});
