// 组件平铺在 src/<分类>/<Name>.tsx，测试在同级的 .test 目录；在这里统一导出

// 基础
export { Icon, type IconData, type IconProps } from './base/Icon';
export { VisuallyHidden, type VisuallyHiddenProps } from './base/VisuallyHidden';
export { Em, Paragraph, Small, Strong, Text, type TextProps } from './base/Text';
export { H1, H2, H3, H4, H5, H6, type HeadingProps } from './base/Heading';
export { Link, type LinkProps } from './base/Link';
export { Code, type CodeProps } from './base/Code';
export { CodeBlock, type CodeBlockProps } from './base/CodeBlock';
export { Kbd, type KbdProps } from './base/Kbd';
export { Spinner, type SpinnerProps } from './base/Spinner';
export { Button, type ButtonProps } from './base/Button';
export { LinkButton, type LinkButtonProps } from './base/LinkButton';
export { IconButton, type IconButtonProps } from './base/IconButton';
export { ClearButton, CloseButton, type PresetIconButtonProps } from './base/CloseButton';
export { Badge, type BadgeProps } from './base/Badge';
export { Tag, type TagProps } from './base/Tag';
export type { BadgeOptions, BadgeRadii } from './base/badge-styles';
export type {
  ButtonContentOptions,
  ButtonOptions,
  ButtonRadii,
  ButtonTones,
  ButtonVariants,
} from './base/button-styles';

// 布局
export {
  createFlex,
  Flex,
  FlexList,
  type FlexAligns,
  type FlexDirections,
  type FlexJustifies,
  type FlexOptions,
  type FlexProps,
} from './layout/Flex';
export {
  createGrid,
  Grid,
  GridList,
  type GridAligns,
  type GridFlows,
  type GridOptions,
  type GridProps,
} from './layout/Grid';
export {
  Container,
  createContainer,
  type ContainerOptions,
  type ContainerProps,
  type ContainerSizes,
} from './layout/Container';
export { Separator, type SeparatorProps } from './layout/Separator';
export {
  ScrollArea,
  type ScrollAreaAxes,
  type ScrollAreaProps,
  type ScrollbarTypes,
} from './layout/ScrollArea';

// 展示
export { Collapse, type CollapseProps } from './display/Collapse';
export { Collapsible, type CollapsibleProps } from './display/Collapsible';
export { Card, type CardOptions, type CardProps, type CardVariants } from './display/Card';
export {
  Avatar,
  initials,
  type AvatarOptions,
  type AvatarProps,
  type AvatarRadii,
} from './display/Avatar';
export {
  VirtualList,
  type VirtualListHandle,
  type VirtualListProps,
  type VirtualListScrolls,
} from './display/VirtualList';

// 反馈
export { Progress, type ProgressProps, type ProgressTones } from './feedback/Progress';
export { Skeleton, type SkeletonProps } from './feedback/Skeleton';
export {
  Alert,
  type AlertLives,
  type AlertOptions,
  type AlertProps,
  type AlertVariants,
} from './feedback/Alert';

// 导航
export { Toolbar, type ToolbarOrientations, type ToolbarProps } from './navigation/Toolbar';
export {
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type TabListProps,
  type TabPanelProps,
  type TabProps,
  type TabsActivations,
  type TabsOptions,
  type TabsOrientations,
  type TabsProps,
  type TabsVariants,
} from './navigation/Tabs';
export { Steps, type StepItem, type StepsOrientations, type StepsProps } from './navigation/Steps';
export { Breadcrumbs, type BreadcrumbItem, type BreadcrumbsProps } from './navigation/Breadcrumbs';
export { Pagination, type PaginationProps } from './navigation/Pagination';
export {
  NavGroup,
  NavItem,
  NavList,
  type NavGroupProps,
  type NavItemProps,
  type NavListProps,
} from './navigation/NavList';

// 输入
export { Slider, type SliderOrientations, type SliderProps } from './input/Slider';
export {
  ToggleGroup,
  ToggleItem,
  type ToggleGroupOrientations,
  type ToggleGroupProps,
  type ToggleItemProps,
} from './input/ToggleGroup';
export {
  SlideVerify,
  type SlideVerifyPoint,
  type SlideVerifyProps,
  type SlideVerifyResult,
  type SlideVerifyStatuses,
  type SlideVerifyTargets,
} from './input/SlideVerify';

// 配置：主题与语言；tokens 从 @vue-tsx-pro/ui/tokens.stylex 导入（StyleX 只认 .stylex 结尾的导入路径）
export { Provider, type ProviderProps } from './config/Provider';
export { createUi, type UiOptions } from './config/createUi';
export {
  useConfig,
  useLang,
  type Highlighter,
  type UiConfig,
  type UiRouter,
} from './config/context';
export { useDefaults, type ComponentDefaults } from './config/defaults';
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

// 部件 props、弹层、动画与虚拟滚动工具
export {
  elementProps,
  mergePartProps,
  mergeProps,
  type PartProps,
  type TriggerProps,
} from './utils/props';
export {
  columnGapStyles,
  focusRingStyles,
  gapStyles,
  rowGapStyles,
  type LayoutTag,
  type Size,
  type SizeScale,
  type Space,
  type SpaceScale,
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
  type FontSizes,
  type FontWeights,
  type TextAlign,
  type TextAligns,
  type TextSize,
  type TextSizes,
  type TextWrap,
  type TextWraps,
  type Tones,
  type FontWeight,
  type Tone,
} from './utils/typography';
export {
  dismissOnBackdrop,
  focusAfterRemoval,
  focusFirst,
  focusOrigin,
  lockScroll,
  returnFocus,
  toElement,
  trapFocus,
} from './utils/overlay';
export {
  anchorFloating,
  floatingStyles,
  type Anchored,
  type FloatingOptions,
  type FloatingPlacement,
  type FloatingPlacements,
} from './utils/floating';
export { themeTransition, type ThemeTransitionOptions } from './utils/animation';
export { startMove, type MoveOptions, type MovePoint } from './utils/move';
export {
  rovingFocus,
  type RovingFocusOptions,
  type RovingOrientations,
} from './utils/roving-focus';
export { plainText } from './utils/text';
export { toggleSelection, type SelectionModes, type SelectionOptions } from './utils/selection';
export {
  statusIcons,
  statusToneSx,
  type StatusTone,
  type StatusTones,
  type StatusVariant,
  type StatusVariants,
} from './utils/tone-styles';
export { rippleHostStyles, startRipple, useRipple, type RippleHandlers } from './utils/ripple';
export { shouldRouteClick, useRouterLink, type RouterLink } from './utils/link';
export {
  paginationItems,
  type PaginationEllipsis,
  type PaginationOptions,
} from './utils/pagination';
export { afterTransitions, transitions } from './utils/transitions';
export {
  computeMeasurements,
  defaultRangeExtractor,
  findVisibleRange,
  Virtualizer,
  type ExtractorRange,
  type ScrollAligns,
  type VirtualItem,
  type VirtualizerOptions,
  type VirtualScrollOptions,
  type VisibleRange,
} from './utils/virtualizer';
