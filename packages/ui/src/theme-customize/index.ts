/**
 * 主题定制（子路径 `@vue-tsx-pro/ui/theme-customize`）：把设置（品牌色、中性色、圆角、缩放、字体、动效）套到主题上、
 * 生成可以粘贴进项目的代码、导出设计令牌（Figma 变量能导入的 JSON）、Radix 色阶、对比度检查、token 目录，
 * 以及编辑这些设置的界面 ThemeCustomizer 与主题缩略图 ThemeThumbnail。
 *
 * 它们要用颜色库（culori）与 Radix 色板，不放在主入口：应用启动时用不到，只在真的要套用设置时才导入，
 * 例如只有访客改过主题设置时：
 *
 *   const { customizeTheme } = await import('@vue-tsx-pro/ui/theme-customize');
 *
 * 切换主题的 ThemeSwitcher 在 `@vue-tsx-pro/ui/patterns`，主题偏好 createThemePreference 在主入口。
 */
export {
  ThemeCustomizer,
  themeCustomizerCornerStyles,
  themeCustomizerDynamicStyles,
  themeCustomizerStyles,
  type ThemeCustomizerProps,
} from './ThemeCustomizer';
export { ThemeThumbnail, themeThumbnailStyles, type ThemeThumbnailProps } from './ThemeThumbnail';
export { checkContrast, CONTRAST_PAIRS, type ContrastIssue, type ContrastPair } from './contrast';
export {
  customizeTheme,
  themeSettingsCode,
  themeSettingsOverrides,
  type CustomizeOptions,
  type FontPresets,
  type MotionPresets,
  type RadiusPresets,
  type ThemeSettings,
} from './customize';
export {
  designTokens,
  elementDesignTokens,
  elementThemeValues,
  themeDesignTokens,
  themeValues,
  type DesignToken,
  type DesignTokenBases,
  type DesignTokens,
  type ThemeValues,
} from './design-tokens';
export { themeCustomizerMessages, type ThemeCustomizerMessages } from './messages';
export {
  ACCENT_SCALES,
  ACCENT_STEPS,
  NEUTRAL_SCALES,
  NEUTRAL_STEPS,
  paletteColors,
  scaleSwatch,
  type AccentScale,
  type NeutralScale,
  type PaletteOptions,
} from './palette';
export { tokenCatalog, type TokenEntry, type TokenGroupEntry } from './token-catalog';
