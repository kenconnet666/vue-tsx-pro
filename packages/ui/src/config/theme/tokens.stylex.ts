/**
 * 主题 tokens：组件里的颜色、字体、间距、圆角、阴影、动效都只从这里取，不写裸值。
 * 每组一个 defineVars，变量名是 `--vtp-组名-token`。这里的取值即亮色主题，暗色主题见 dark.ts。
 *
 * 取舍参考：
 *   - 颜色与阴影取自 Radix Colors / Radix Themes，按 Radix 12 级的用途约定映射成语义 token
 *     （1–2 背景，3–5 交互填充，6–8 边框，9–10 实色，11–12 文字）
 *   - 尺寸、间距、圆角用 em，随组件字号等比缩放（字号即尺寸档位，见 COMPONENTS.md §3）；
 *     边框宽度用 px，容器宽度用 rem
 *   - 分组参考 Stitches / Chakra / Panda 的 token 分类，组名即样式里短写的对照组（@vue-tsx-pro/tsx 的 token-map.ts）
 *   - 动效时长与缓动参考 Material 3
 *   - 分档：一般 xs–xl 五档，需要时加 none（去掉）与 full（全圆）；颜色、行高、字间距、不透明度按语义命名
 *   - 不设 z-index：弹出层、对话框用原生 popover / dialog，渲染在顶层（top layer），不参与层叠顺序
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

/** 颜色：slate 中性色、indigo 品牌色、red 危险、green 成功、amber 警告、blue 信息 */
export const colors = stylex.defineVars('vtp-colors', {
  // ───────── 背景与表面 ─────────

  /** 页面背景。slate 1：亮色 `#fcfcfd`，暗色 `#111113` */
  background: '#fcfcfd',
  /** 卡片、输入框等表面。亮色 slate 1 `#fcfcfd`，暗色 slate 2 `#18191b` */
  surface: '#fcfcfd',
  /** 弱化的区域背景：表头、侧栏、代码块。slate 2：亮色 `#f9f9fb`，暗色 `#18191b` */
  surfaceMuted: '#f9f9fb',
  /**
   * 浮层（弹出框、菜单、对话框）表面，靠描边与阴影区分层级。亮色 slate 1 `#fcfcfd`，暗色 slate 2 `#18191b`
   * （不取第 3 级：那是 fill，浮层里的填充会看不见）
   */
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
  /** 品牌色实色悬停。亮色 indigo 10 `#3358d4`；暗色比实色更深一点 `#3758d4`（indigo 10 `#5472e4` 配白字只有 4.28:1） */
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

  /**
   * 危险实色：危险按钮的底色，上面放 dangerContrast（白色）文字，要满足 4.5:1。
   * red 9 配白字只有 3.91:1，所以亮色用 red 11 `#ce2c31`（5.21:1），暗色用 red 8 `#b54548`（5.37:1）
   */
  danger: '#ce2c31',
  /** 危险实色悬停：比实色更深一点，白字才满足 4.5:1（red 10 只有 4.37:1）。亮色 `#b8272c`，暗色 `#a33b3e` */
  dangerHover: '#b8272c',
  /** 危险实色上的文字与图标：`#ffffff` */
  dangerContrast: '#ffffff',
  /** 危险文字：错误提示。亮色比 red 11 深一点 `#b8272c`（red 11 在 dangerSoftHover 上只有 4.07:1），暗色 red 11 `#ff9592` */
  dangerText: '#b8272c',
  /** 危险浅底：错误提示条。red 3：亮色 `#feebec`，暗色 `#3b1219` */
  dangerSoft: '#feebec',
  /** 危险浅底悬停。red 4：亮色 `#ffdbdc`，暗色 `#500f1c` */
  dangerSoftHover: '#ffdbdc',
  /** 危险边框：校验失败的输入框。red 7：亮色 `#f4a9aa`，暗色 `#8c333a` */
  dangerBorder: '#f4a9aa',

  // ───────── 状态色：成功、警告、信息（提示条、徽标、图标、按钮） ─────────

  /**
   * 成功文字与图标。亮色 green 12 `#193b2d`，暗色 green 11 `#3dd68c`。
   * 亮色不用 11 级：green 11 在 successSoft（green 3）上只有 4.21:1，标记、提示条里的文字不到 4.5
   */
  successText: '#193b2d',
  /** 成功浅底。green 3：亮色 `#e6f6eb`，暗色 `#132d21` */
  successSoft: '#e6f6eb',
  /** 成功边框。green 7：亮色 `#8eceaa`，暗色 `#28684a` */
  successBorder: '#8eceaa',
  /**
   * 成功实色：成功按钮、实底徽标的底色，上面放 successContrast。亮色 `#008751`，暗色 green 9 `#30a46c`。
   * 黄、绿、蓝的 9 级很亮：配白字不到 4.5:1 时亮色加深到够，暗色改配深色字。图形（勾选框、进度条）的填充仍用 successText：实色不一定在表面上到 3:1
   */
  success: '#008751',
  /** 成功实色悬停：与 successContrast 的对比度只升不降（白字时加深，深色字时调亮）。亮色 `#007143`，暗色 `#52af7d` */
  successHover: '#007143',
  /** 成功实色上的文字与图标。亮色 `#ffffff`，暗色 `#111113` */
  successContrast: '#ffffff',
  /** 成功浅底悬停。green 4：亮色 `#d6f1df`，暗色 `#113b29` */
  successSoftHover: '#d6f1df',
  /**
   * 警告文字与图标。亮色 amber 12 `#4f3422`，暗色 amber 11 `#ffca16`。
   * 亮色不用 11 级：amber 11（`#ab6400`）在页面背景上对比度 4.49，不到 WCAG AA 的 4.5
   */
  warningText: '#4f3422',
  /** 警告浅底。amber 3：亮色 `#fff7c2`，暗色 `#302008` */
  warningSoft: '#fff7c2',
  /** 警告边框。amber 7：亮色 `#e9c162`，暗色 `#714f19` */
  warningBorder: '#e9c162',
  /**
   * 警告实色：警告按钮、实底徽标的底色，上面放 warningContrast。亮色 `#ffc53d`，暗色 amber 9 `#ffc53d`。
   * 黄、绿、蓝的 9 级很亮：配白字不到 4.5:1 时亮色加深到够，暗色改配深色字。图形（勾选框、进度条）的填充仍用 warningText：实色不一定在表面上到 3:1
   */
  warning: '#ffc53d',
  /** 警告实色悬停：与 warningContrast 的对比度只升不降（白字时加深，深色字时调亮）。亮色 `#ffcd5f`，暗色 `#ffcd5f` */
  warningHover: '#ffcd5f',
  /** 警告实色上的文字与图标。亮色 `#4f3422`，暗色 `#111113` */
  warningContrast: '#4f3422',
  /** 警告浅底悬停。amber 4：亮色 `#ffee9c`，暗色 `#3f2700` */
  warningSoftHover: '#ffee9c',
  /**
   * 信息文字与图标。亮色 blue 12 `#113264`，暗色 blue 11 `#70b8ff`。
   * 亮色不用 11 级：blue 11 在 infoSoft（blue 3）上只有 4.25:1
   */
  infoText: '#113264',
  /** 信息浅底。blue 3：亮色 `#e6f4fe`，暗色 `#0d2847` */
  infoSoft: '#e6f4fe',
  /** 信息边框。blue 7：亮色 `#8ec8f6`，暗色 `#205d9e` */
  infoBorder: '#8ec8f6',
  /**
   * 信息实色：信息按钮、实底徽标的底色，上面放 infoContrast。亮色 `#0073e0`，暗色 blue 9 `#0090ff`。
   * 黄、绿、蓝的 9 级很亮：配白字不到 4.5:1 时亮色加深到够，暗色改配深色字。图形（勾选框、进度条）的填充仍用 infoText：实色不一定在表面上到 3:1
   */
  info: '#0073e0',
  /** 信息实色悬停：与 infoContrast 的对比度只升不降（白字时加深，深色字时调亮）。亮色 `#0060bd`，暗色 `#3d9fff` */
  infoHover: '#0060bd',
  /** 信息实色上的文字与图标。亮色 `#ffffff`，暗色 `#111113` */
  infoContrast: '#ffffff',
  /** 信息浅底悬停。blue 4：亮色 `#d5efff`，暗色 `#003362` */
  infoSoftHover: '#d5efff',

  // ───────── 反色：深色提示框、Toast 这类与页面明暗相反的表面 ─────────

  /** 反色表面。slate 12：亮色 `#1c2024`，暗色 `#edeef0` */
  inverseSurface: '#1c2024',
  /** 反色表面上的文字。slate 1：亮色 `#fcfcfd`，暗色 `#111113` */
  inverseText: '#fcfcfd',

  // ───────── 其他 ─────────

  /**
   * 焦点环（:focus-visible）。indigo 9：两套主题都是 `#3e63dd`。
   * Radix 建议 7–8 级，但亮色下对比度不到 3:1（WCAG 2.2 焦点外观要求），所以用 9 级
   */
  focusRing: '#3e63dd',
  /** 模态遮罩。亮色 blackA 6 `rgba(0, 0, 0, 0.4)`，暗色 blackA 8 `rgba(0, 0, 0, 0.6)` */
  overlay: 'rgba(0, 0, 0, 0.4)',
  /** 选中文字的底色（::selection）。indigo 5：亮色 `#d2deff`，暗色 `#253974` */
  selection: '#d2deff',
  /** 高亮标记：搜索命中、`<mark>`。amber 4：亮色 `#ffee9c`，暗色 `#3f2700` */
  highlight: '#ffee9c',
  /** 半透明表面：吸顶的顶栏（配合背景模糊）。页面背景加 80% 不透明 */
  surfaceTranslucent: 'rgba(252, 252, 253, 0.8)',
  // ───────── 代码高亮：代码块（surfaceMuted）、行内代码与高亮行（fill）、diff 的增删行上都要满足 4.5:1 ─────────
  /** 关键字。indigo 11：亮色 `#3a5bc7`，暗色 `#9eb1ff` */
  codeKeyword: '#3a5bc7',
  /** 字符串。亮色比 green 11 深一点 `#1c7a51`（在代码块背景上 green 11 只有 4.49:1），暗色 green 11 `#3dd68c` */
  codeString: '#1c7a51',
  /** 数字、常量。亮色比 orange 11 深一点 `#bb4500`（orange 11 在代码块背景上只有 4.29:1），暗色 orange 11 `#ffa057` */
  codeNumber: '#bb4500',
  /** 函数名。violet 11：亮色 `#6550b9`，暗色 `#baa7ff` */
  codeFunction: '#6550b9',
  /** 类型、类名。亮色比 cyan 11 深一点 `#007590`（cyan 11 在行内代码的底色上只有 4.19:1），暗色 cyan 11 `#4ccce6` */
  codeType: '#007590',
  /** 注释、标点。slate 11：亮色 `#60646c`，暗色 `#b0b4ba` */
  codeComment: '#60646c',
  /** 标签名（HTML、JSX）。crimson 11：亮色 `#cb1d63`，暗色 `#ff92ad` */
  codeTag: '#cb1d63',
  /** 属性名。brown 11：亮色 `#815e46`，暗色 `#dbb594` */
  codeAttribute: '#815e46',
  /** diff 新增行的底色。green 3：亮色 `#e6f6eb`，暗色 `#132d21` */
  codeInserted: '#e6f6eb',
  /** diff 删除行的底色。red 3：亮色 `#feebec`，暗色 `#3b1219` */
  codeDeleted: '#feebec',
  // ───────── 图表系列：分类色板，按顺序分给各个系列；在页面与卡片背景上都要满足 3:1（WCAG 图形对比度） ─────────
  // 每个色阶取能到 3:1 的最浅一级：亮色多为 9–10 级，暗色 9 级
  /** 第 1 个系列：跟随品牌色。indigo 9：两套主题都是 `#3e63dd` */
  chart1: '#3e63dd',
  /** 第 2 个系列。teal：亮色 10 级 `#0d9b8a`，暗色 9 级 `#12a594` */
  chart2: '#0d9b8a',
  /** 第 3 个系列。orange：亮色 10 级 `#ef5f00`，暗色 9 级 `#f76b15` */
  chart3: '#ef5f00',
  /** 第 4 个系列。crimson 9：两套主题都是 `#e93d82` */
  chart4: '#e93d82',
  /** 第 5 个系列。violet 9：两套主题都是 `#6e56cf` */
  chart5: '#6e56cf',
  /** 第 6 个系列。cyan：亮色 10 级 `#0797b9`，暗色 9 级 `#00a2c7` */
  chart6: '#0797b9',
  /** 第 7 个系列。grass：亮色 10 级 `#3e9b4f`，暗色 9 级 `#46a758` */
  chart7: '#3e9b4f',
  /** 第 8 个系列。amber：亮色 11 级 `#ab6400`（9、10 级在浅色背景上不到 2:1），暗色 9 级 `#ffc53d` */
  chart8: '#ab6400',
});

/** 字体族 */
export const fonts = stylex.defineVars('vtp-fonts', {
  /**
   * 正文字体：西文用系统界面字体；中文在 Windows 上优先“微软雅黑 UI”（界面字号下字距更紧凑），
   * Linux 上是思源黑体（Noto / Source Han Sans）
   */
  sans: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
  /**
   * 等宽字体：代码、需要数字对齐的地方。装了 Cascadia Code（Windows 11 自带）、JetBrains Mono 时优先用它们，
   * 字形比 Consolas 清楚
   */
  mono: 'ui-monospace, "Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  /** 衬线字体：书卷感的标题、引文（纸张主题的标题用它） */
  serif: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", STSong, "SimSun", Georgia, serif',
  /** 标题（H1–H6）的字体：默认同正文，主题可以换成衬线 */
  heading:
    'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
});

/** 字号：xs–xl 用于界面文字（也是组件 size 档位对应的字号），xxl、xxxl 用于标题 */
export const fontSizes = stylex.defineVars('vtp-font-sizes', {
  /** `12px`：辅助说明、标签 */
  xs: '12px',
  /** `13px`：紧凑控件 */
  sm: '13px',
  /** `14px`：正文与默认控件；Provider 用它设置区域的基准字号 */
  md: '14px',
  /** `16px`：宽松控件、小标题 */
  lg: '16px',
  /** `18px`：强调文字、卡片标题 */
  xl: '18px',
  /** `24px`：页面标题 */
  xxl: '24px',
  /** `30px`：大标题 */
  xxxl: '30px',
});

/** 字重 */
export const fontWeights = stylex.defineVars('vtp-font-weights', {
  /** `300` */
  light: '300',
  /** `400`：正文 */
  normal: '400',
  /** `500`：标签、表头 */
  medium: '500',
  /** `600`：按钮、标题 */
  semibold: '600',
  /** `700` */
  bold: '700',
});

/** 行高（不带单位，随字号缩放） */
export const lineHeights = stylex.defineVars('vtp-line-heights', {
  /** `1`：图标、单行徽标 */
  none: '1',
  /** `1.25`：按钮等单行控件、标题 */
  tight: '1.25',
  /** `1.375`：紧凑的多行文字 */
  snug: '1.375',
  /** `1.5`：正文 */
  normal: '1.5',
  /** `1.75`：长文阅读 */
  relaxed: '1.75',
});

/** 字间距（em，随字号缩放）：中文正文保持 normal，大字号标题可以略收紧 */
export const letterSpacings = stylex.defineVars('vtp-letter-spacings', {
  /** `-0.02em`：大标题 */
  tighter: '-0.02em',
  /** `-0.01em`：小标题 */
  tight: '-0.01em',
  /** `0`：正文 */
  normal: '0',
  /** `0.02em`：小字号的标签 */
  wide: '0.02em',
  /** `0.05em`：全大写的英文标签 */
  wider: '0.05em',
});

/** 间距：em，随组件字号缩放；页面级布局间距由宿主决定 */
export const space = stylex.defineVars('vtp-space', {
  /** `0` */
  none: '0',
  /** `0.25em`：图标与文字之间、控件的上下内边距 */
  xs: '0.25em',
  /** `0.5em`：控件内部元素之间 */
  sm: '0.5em',
  /** `0.75em`：输入框水平内边距、浮层内边距 */
  md: '0.75em',
  /** `1em`：按钮水平内边距、表单项之间 */
  lg: '1em',
  /** `1.5em`：卡片、对话框内边距 */
  xl: '1.5em',
});

/**
 * 尺寸：宽、高、最小最大尺寸。控件规格用 em 随字号缩放；
 * 容器宽度（Container 与页面内容的最大宽度）是页面级的，用 rem，跟随浏览器的字号设置
 */
export const sizes = stylex.defineVars('vtp-sizes', {
  /** `2.25em`：单行控件（按钮、输入框、下拉框）的高度 */
  control: '2.25em',
  /** `24px`：可点击区域的最小尺寸（WCAG 2.2 目标尺寸 24×24），与 control 取较大值 */
  minTarget: '24px',
  /** `30rem`（480px）：窄内容，如登录表单 */
  xs: '30rem',
  /** `40rem`（640px）：表单页、设置页 */
  sm: '40rem',
  /** `48rem`（768px）：文章、详情页 */
  md: '48rem',
  /** `64rem`（1024px）：常规页面 */
  lg: '64rem',
  /** `80rem`（1280px）：宽表格、仪表盘 */
  xl: '80rem',
  /** `100%`：占满容器 */
  full: '100%',
});

/**
 * 响应式断点：视口不窄于对应的容器宽度（与 sizes 的 sm / md / lg / xl 一致）。
 * 媒体查询里不能用 CSS 变量，所以是普通常量：
 *
 *   gridTemplateColumns: { default: 'minmax(0, 1fr)', [breakpoints.lg]: 'minmax(0, 1fr) 20rem' }
 *
 * 同一个属性上写了几个断点时，除最后一档外都用 xxOnly（只在这一档）：样式引擎不按宽度给媒体查询排序，
 * 重叠的区间谁生效取决于规则的先后，可能是窄的那档盖住宽的：
 *
 *   gridTemplateColumns: { default: null, [breakpoints.lgOnly]: '16rem 1fr', [breakpoints.xl]: '16rem 1fr 14rem' }
 */
export const breakpoints = {
  /** 40rem（640px）以上：大屏手机横屏、小平板 */
  sm: '@media (min-width: 40rem)',
  /** 48rem（768px）以上：平板 */
  md: '@media (min-width: 48rem)',
  /** 64rem（1024px）以上：桌面，侧栏常驻 */
  lg: '@media (min-width: 64rem)',
  /** 80rem（1280px）以上：宽屏，右侧栏也显示 */
  xl: '@media (min-width: 80rem)',
  /** 40rem 到 48rem 之间：同一属性写了几个断点时用，避免区间重叠 */
  smOnly: '@media (min-width: 40rem) and (max-width: 47.99rem)',
  /** 48rem 到 64rem 之间 */
  mdOnly: '@media (min-width: 48rem) and (max-width: 63.99rem)',
  /** 64rem 到 80rem 之间 */
  lgOnly: '@media (min-width: 64rem) and (max-width: 79.99rem)',
  // 字面量类型：条件键的类型要求是 `@${string}`
} as const;

/** 圆角：em，随组件字号缩放；整体改成直角或更圆时覆盖这一组 */
export const radii = stylex.defineVars('vtp-radii', {
  /** `0` */
  none: '0',
  /** `0.15em`：控件内的小元素 */
  xs: '0.15em',
  /** `0.25em`：标签、复选框 */
  sm: '0.25em',
  /** `0.4em`：按钮、输入框 */
  md: '0.4em',
  /** `0.7em`：卡片、浮层 */
  lg: '0.7em',
  /** `1em`：对话框 */
  xl: '1em',
  /** 全圆：胶囊按钮、头像、开关 */
  full: '9999px',
});

/** 边框与描边宽度（px，不随字号缩放）：边框、分隔线、焦点环的宽度与间隔 */
export const borderWidths = stylex.defineVars('vtp-border-widths', {
  /** `0` */
  none: '0',
  /** `1px`：边框、分隔线 */
  xs: '1px',
  /** `2px`：焦点环宽度与间隔、选中态的强调边框 */
  sm: '2px',
  /** `3px`：提示条侧边的色条 */
  md: '3px',
  /** `4px` */
  lg: '4px',
  /** `6px` */
  xl: '6px',
});

/** 阴影：取自 Radix Themes 的第 2–6 级，去掉了模拟边框的 1px 描边（组件自己画边框）；暗色主题另有一套 */
export const shadows = stylex.defineVars('vtp-shadows', {
  /** 无阴影 */
  none: 'none',
  /** 贴近表面：卡片 */
  xs: '0 1px 1px 0 #00005506, 0 2px 1px -1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  /** 轻微浮起：悬停的卡片 */
  sm: '0 2px 3px -2px #0000330f, 0 3px 12px -4px rgba(0, 0, 0, 0.1), 0 4px 16px -8px rgba(0, 0, 0, 0.1)',
  /** 浮起：下拉面板 */
  md: '0 8px 40px rgba(0, 0, 0, 0.05), 0 12px 32px -16px #0000330f',
  /** 浮层：弹出框、菜单、提示 */
  lg: '0 12px 60px rgba(0, 0, 0, 0.15), 0 12px 32px -16px #0009321f',
  /** 对话框 */
  xl: '0 12px 60px rgba(0, 0, 0, 0.15), 0 16px 64px #00005506, 0 16px 36px -20px #00062e32',
});

/** 用户开启“减少动态效果”时，所有时长都变成 0：组件直接用这些 token，不必各自写媒体查询 */
const reduce = '@media (prefers-reduced-motion: reduce)';

/** 动效时长（参考 Material 3）；开启“减少动态效果”时自动为 0 */
export const durations = stylex.defineVars('vtp-durations', {
  /** `0ms` */
  none: '0ms',
  /** `75ms`：按下反馈 */
  xs: { default: '75ms', [reduce]: '0ms' },
  /** `120ms`：悬停的颜色变化 */
  sm: { default: '120ms', [reduce]: '0ms' },
  /** `200ms`：展开、淡入、浮层出现 */
  md: { default: '200ms', [reduce]: '0ms' },
  /** `300ms`：对话框、抽屉 */
  lg: { default: '300ms', [reduce]: '0ms' },
  /** `500ms`：大面积的页面切换 */
  xl: { default: '500ms', [reduce]: '0ms' },
});

/** 缓动曲线（参考 Material 3） */
export const easings = stylex.defineVars('vtp-easings', {
  /** 标准：位置与尺寸变化 */
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  /** 进入：元素出现（先快后慢） */
  enter: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  /** 退出：元素消失（先慢后快） */
  exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
});

/** 不透明度 */
export const opacities = stylex.defineVars('vtp-opacities', {
  /** `0.5`：不可用的元素 */
  disabled: '0.5',
});

/** SVG 线宽（图标 24 格画布上的单位，不带单位）；Icon 默认 md，strokeWidth 可以逐个覆盖 */
export const strokeWidths = stylex.defineVars('vtp-stroke-widths', {
  /** `1`：细线图标 */
  xs: '1',
  /** `1.5` */
  sm: '1.5',
  /** `2`：Lucide 的默认线宽 */
  md: '2',
  /** `2.5` */
  lg: '2.5',
  /** `3`：粗线图标 */
  xl: '3',
});
