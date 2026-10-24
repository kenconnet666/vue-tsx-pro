/**
 * 主题 tokens 的 CSS 变量，按组取值：`t.space.md`、`t.colors.accent`，悬停能看到每个 token 的说明与取值。
 * 值里夹着 token（计算、多值、混色）时在模板字符串里用它：
 *
 *   transition: `opacity ${t.durations.md} ${t.easings.standard}`,
 *   marginInlineStart: `calc(-1 * ${t.borderWidths.xs})`,
 *
 * 值整个就是一个 token 时照旧写字符串 '_md'、'_space.md'（COMPONENTS.md §4）：这里用 defineTokens 登记各组，
 * 样式引擎展开样式时按组名查到 token 变量。utils/props.ts 导入这个模块，组件渲染之前一定登记过。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
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

/** 主题 tokens 的各组：组名 → 变量（`var(--vtp-space-md)`），用法见文件说明 */
export const t = stylex.defineTokens({
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
});
