// 组件按 src/<分类>/<Name>/<Name>.tsx 组织，在这里统一导出

// 基础
export { Icon, type IconData, type IconProps } from './base/Icon/Icon';

// 配置：主题与语言；tokens 从 @vue-tsx-pro/ui/tokens.stylex 导入（StyleX 只认 .stylex 结尾的导入路径）
export { Provider, type ProviderProps } from './config/Provider';
export { createUi, type UiOptions } from './config/createUi';
export { useConfig, useLang, type UiConfig } from './config/context';
export {
  defineTheme,
  type Theme,
  type ThemeInput,
  type ThemeOverrides,
} from './config/theme/theme';
export { lightTheme } from './config/theme/light';
export { darkTheme } from './config/theme/dark';
export { defineLang, type Lang } from './config/lang/lang';
export { zhCN } from './config/lang/zh-CN';
export { enUS } from './config/lang/en-US';
export { useFormat } from './config/lang/format';

// 部件 props 与弹层工具
export { elementProps, mergeProps, type PartProps } from './utils/props';
export {
  focusFirst,
  focusOrigin,
  lockScroll,
  returnFocus,
  toElement,
  trapFocus,
} from './utils/overlay';
