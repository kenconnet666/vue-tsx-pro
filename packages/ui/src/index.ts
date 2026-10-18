// 组件平铺在 src/<分类>/<Name>.tsx，测试在同级的 .test 目录；在这里统一导出

// 基础
export { Icon, type IconData, type IconProps } from './base/Icon';
export { VisuallyHidden, type VisuallyHiddenProps } from './base/VisuallyHidden';
export { Text, type TextProps } from './base/Text';
export { Heading, type HeadingProps } from './base/Heading';
export { Link, type LinkProps } from './base/Link';
export { Code, type CodeProps } from './base/Code';
export { Kbd, type KbdProps } from './base/Kbd';

// 布局
export { Flex, type FlexProps, type LayoutTag } from './layout/Flex';
export { Grid, type GridProps } from './layout/Grid';
export { Container, type ContainerProps } from './layout/Container';
export { Separator, type SeparatorProps } from './layout/Separator';

// 展示
export { Collapse, type CollapseProps } from './display/Collapse';
export { Collapsible, type CollapsibleProps } from './display/Collapsible';

// 配置：主题与语言；tokens 从 @vue-tsx-pro/ui/tokens.stylex 导入（StyleX 只认 .stylex 结尾的导入路径）
export { Provider, type ProviderProps } from './config/Provider';
export { createUi, type UiOptions } from './config/createUi';
export { useConfig, useLang, type UiConfig } from './config/context';
export {
  defineTheme,
  readToken,
  type Theme,
  type ThemeInput,
  type ThemeOverrides,
} from './config/theme/theme';
export { lightTheme } from './config/theme/light';
export { darkTheme } from './config/theme/dark';
// 主题 tokens 字符串写法的类型（declare module），让产物的类型声明也带上它
import './config/theme/token-names';
export { defineLang, type Lang } from './config/lang/lang';
export { zhCN } from './config/lang/zh-CN';
export { enUS } from './config/lang/en-US';
export { useFormat } from './config/lang/format';

// 部件 props、弹层与动画工具
export {
  elementProps,
  mergeProps,
  type AsProps,
  type PartProps,
  type TriggerProps,
} from './utils/props';
export {
  columnGapStyles,
  focusRingStyles,
  gapStyles,
  rowGapStyles,
  type Size,
  type Space,
} from './utils/styles';
export {
  fontSizeStyles,
  fontWeightStyles,
  lineClampStyles,
  textAlignStyles,
  textStyles,
  textWrapStyles,
  toneStyles,
  type FontSize,
  type FontWeight,
  type Tone,
} from './utils/typography';
export {
  dismissOnBackdrop,
  focusFirst,
  focusOrigin,
  lockScroll,
  returnFocus,
  toElement,
  trapFocus,
} from './utils/overlay';
export { themeTransition, type ThemeTransitionOptions } from './utils/animation';
export { afterTransitions, transitions } from './utils/transitions';
