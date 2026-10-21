/**
 * 主题定制（子路径 `@vue-tsx-pro/ui/theme-customize`）：把设置（品牌色、中性色、圆角、缩放、字体、动效）套到主题上、
 * 生成可以粘贴进项目的代码、Radix 色阶、对比度检查、token 目录。
 *
 * 它们要用颜色库（culori）与 Radix 色板，不放在主入口：应用启动时用不到，只在真的要套用设置时才导入，
 * 例如只有访客改过主题设置时：
 *
 *   const { customizeTheme } = await import('@vue-tsx-pro/ui/theme-customize');
 *
 * 编辑设置的界面 ThemeCustomizer 在主入口（它所在的页面本来就是按需加载的）。
 */
export {
  checkContrast,
  CONTRAST_PAIRS,
  type ContrastIssue,
  type ContrastPair,
} from './theme/contrast';
export {
  customizeTheme,
  themeSettingsCode,
  themeSettingsOverrides,
  type CustomizeOptions,
  type FontPresets,
  type MotionPresets,
  type RadiusPresets,
  type ThemeSettings,
} from './theme/customize';
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
} from './theme/palette';
export { tokenCatalog, type TokenEntry, type TokenGroupEntry } from './theme/token-catalog';
