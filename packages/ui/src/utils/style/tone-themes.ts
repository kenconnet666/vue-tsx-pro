/**
 * 六种状态色调的主题类：挂在元素上，把 toneVars 换成这个色调的颜色；里面的样式只写一遍、引用 toneVars。
 *
 *   <span {...css.attrs(toneThemes[tone], styles.soft)} />     // styles.soft 里写 color: toneVars.text
 *
 * 按色调名循环创建。
 */
import * as css from '@vue-tsx-pro/tsx/styles';
import { colors, t } from '../../config/theme/tokens';
import type { StatusTone } from './tone-styles';
import { toneVars } from './tone-vars';

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
export const toneThemes: Readonly<Record<StatusTone, css.Theme<typeof toneVars>>> = {
  neutral: css.createTheme(toneVars, neutral),
  accent: css.createTheme(toneVars, colored('accent')),
  info: css.createTheme(toneVars, colored('info')),
  success: css.createTheme(toneVars, colored('success')),
  warning: css.createTheme(toneVars, colored('warning')),
  danger: css.createTheme(toneVars, colored('danger')),
};
