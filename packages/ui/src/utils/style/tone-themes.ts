/**
 * 六种状态色调的主题类：挂在元素上，把 toneVars 换成这个色调的颜色；里面的样式只写一遍、引用 toneVars。
 *
 *   <span {...stylex.attrs(toneThemes[tone], styles.soft)} />     // styles.soft 里写 color: toneVars.text
 *
 * 运行时生成（styles: 'runtime'）：按色调名循环创建，编译期的 StyleX 做不到（参数要能静态求值）。
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

/**
 * 一个色调的主题类。运行时它和 create 的样式引用同形（{ 变量组哈希: 主题类, $$css: true }），
 * 这里按样式引用标类型，才能和别的样式一起放进 sx（StyleX 的 Theme 是 symbol 的交叉类型，StyleXStyles 不收）
 */
const theme = (overrides: Parameters<typeof stylex.createTheme<typeof toneVars>>[1]) =>
  stylex.createTheme(toneVars, overrides) as unknown as stylex.CompiledStyles;

/** 色调 → 主题类 */
export const toneThemes: Readonly<Record<StatusTone, stylex.CompiledStyles>> = {
  neutral: theme(neutral),
  accent: theme(colored('accent')),
  info: theme(colored('info')),
  success: theme(colored('success')),
  warning: theme(colored('warning')),
  danger: theme(colored('danger')),
};
