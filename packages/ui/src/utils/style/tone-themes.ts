/**
 * 六种状态色调的主题类：挂在元素上，把 toneVars 换成这个色调的颜色；里面的样式只写一遍、引用 toneVars。
 *
 *   <span {...stylex.attrs(toneThemes[tone], styles.soft)} />     // styles.soft 里写 color: toneVars.text
 *
 * 按色调名循环创建。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { t } from '../../config/theme/tokens';
import { colors } from '../../config/theme/tokens.stylex';
import type { StatusTone } from './tone-styles';
import { toneVars } from './tone.stylex';

/** 中性：实底是反色表面，浅底是填充色，表面样式用表面色 */
const neutral = {
  solid: colors.inverseSurface,
  solidHover: `color-mix(in oklab, ${t.colors.inverseSurface} 85%, ${t.colors.background})`,
  contrast: colors.inverseText,
  soft: colors.fill,
  softHover: colors.fillHover,
  text: colors.text,
  border: colors.border,
  wash: colors.fillHover,
  surface: colors.surface,
};

/** 带颜色的色调：各级颜色按 token 的命名规律取（accent、accentHover、accentContrast…） */
const colored = (tone: Exclude<StatusTone, 'neutral'>) => ({
  solid: colors[tone],
  solidHover: colors[`${tone}Hover`],
  contrast: colors[`${tone}Contrast`],
  soft: colors[`${tone}Soft`],
  softHover: colors[`${tone}SoftHover`],
  text: colors[`${tone}Text`],
  border: colors[`${tone}Border`],
  wash: colors[`${tone}Soft`],
  surface: colors[`${tone}Soft`],
});

/** 色调 → 主题类 */
export const toneThemes: Readonly<Record<StatusTone, stylex.Theme<typeof toneVars>>> = {
  neutral: stylex.createTheme(toneVars, neutral),
  accent: stylex.createTheme(toneVars, colored('accent')),
  info: stylex.createTheme(toneVars, colored('info')),
  success: stylex.createTheme(toneVars, colored('success')),
  warning: stylex.createTheme(toneVars, colored('warning')),
  danger: stylex.createTheme(toneVars, colored('danger')),
};
