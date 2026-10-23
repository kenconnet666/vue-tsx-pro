/**
 * 主题 tokens 的 CSS 变量，按组取值：`t.space.md`、`t.colors.accent`，悬停能看到每个 token 的说明与取值。
 * 值里夹着 token（计算、多值、混色）时在模板字符串里用它：
 *
 *   transition: `opacity ${t.durations.md} ${t.easings.standard}`,
 *   marginInlineStart: `calc(-1 * ${t.borderWidths.xs})`,
 *
 * 值整个就是一个 token 时照旧写字符串 '_md'、'_space.md'（COMPONENTS.md §4）。
 * StyleX 只认从 .stylex 文件直接导入的变量，编译器把 t.组.名 改写成那样的导入（@vue-tsx-pro/tsx 的 compiler/tokens.ts）；
 * 不经编译时 t 也能用，取到的就是 `var(--…)`。
 */
import {
  borderWidths,
  colors,
  durations,
  easings,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  opacities,
  radii,
  shadows,
  sizes,
  space,
  strokeWidths,
} from './tokens.stylex';

/** 主题 tokens 的各组：组名 → 编译后的变量（`var(--x1abc)`），用法见文件说明 */
export const t = {
  /** 颜色：背景与表面、填充、文字、边框、品牌色与状态色、图表色 */
  colors,
  /** 字体族 */
  fonts,
  /** 字号：xs–xl 是界面文字（组件 size 档位），xxl、xxxl 是标题 */
  fontSizes,
  /** 字重 */
  fontWeights,
  /** 行高（不带单位，随字号缩放） */
  lineHeights,
  /** 字间距（em，随字号缩放） */
  letterSpacings,
  /** 间距（em，随组件字号缩放） */
  space,
  /** 尺寸：控件高度、最小点击区域、容器宽度 */
  sizes,
  /** 圆角（em，随组件字号缩放） */
  radii,
  /** 边框与描边宽度（px，不随字号缩放） */
  borderWidths,
  /** 阴影：浮起的层级 */
  shadows,
  /** 不透明度 */
  opacities,
  /** SVG 线宽（图标 24 格画布上的单位） */
  strokeWidths,
  /** 动效时长；开启“减少动态效果”时为 0 */
  durations,
  /** 缓动曲线 */
  easings,
} as const;
