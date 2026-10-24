/**
 * 色调变量（defineVars）：带颜色的组件（按钮、标记、提示……）的各样式只引用这组变量，色调由外层挂的一个主题类决定
 * （tone-themes.ts 的 toneThemes）。样式写一遍，不再按六种色调各写一份。默认值是品牌色。
 */
import * as css from '@vue-tsx-pro/tsx/styles';
import { colors } from '../../config/theme/tokens';

/** 一个色调的几级颜色 */
export const toneVars = css.defineVars('vtp-tone', {
  /** 实底 */
  solid: colors.accent,
  /** 实底悬停 */
  solidHover: colors.accentHover,
  /** 实底上的文字 */
  contrast: colors.accentContrast,
  /** 浅色底 */
  soft: colors.accentSoft,
  /** 浅色底悬停 */
  softHover: colors.accentSoftHover,
  /** 文字（浅色底、描边、无底上） */
  text: colors.accentText,
  /** 描边 */
  border: colors.accentBorder,
  /** 无底的样式悬停时铺的底色 */
  wash: colors.accentSoft,
  /** 表面样式（surface）的底色：中性色调是表面色，其余是浅色底 */
  surface: colors.accentSoft,
});
