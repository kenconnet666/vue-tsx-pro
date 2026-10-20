/** 站点的主题偏好：亮色、暗色、纸张，记在 localStorage；index.html 里的防闪烁脚本用同一个存储键 */
import { createThemePreference, darkTheme, lightTheme, paperTheme } from '@vue-tsx-pro/ui';

export const preference = createThemePreference({
  themes: { light: lightTheme, dark: darkTheme, paper: paperTheme },
});
