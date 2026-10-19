// 由 pnpm exports（scripts/exports/generate.mjs）生成，不要手改：模块里加了导出后重新生成

// 基础：文字、图标、链接、按钮家族、标记、代码、加载
export { Badge, type BadgeProps } from './base/Badge';
export { Button, type ButtonManaged, type ButtonProps } from './base/Button';
export {
  ClearButton,
  CloseButton,
  createPresetIconButton,
  type PresetIconButtonProps,
} from './base/CloseButton';
export { Code, codeStyles, type CodeProps } from './base/Code';
export { CodeBlock, codeBlockStyles, type CodeBlockProps } from './base/CodeBlock';
export {
  createHeading,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  headingStyles,
  type HeadingProps,
  type HeadingTag,
} from './base/Heading';
export {
  Icon,
  iconStyles,
  renderIconNode,
  type IconData,
  type IconManaged,
  type IconNode,
  type IconProps,
} from './base/Icon';
export { IconButton, type IconButtonManaged, type IconButtonProps } from './base/IconButton';
export { Kbd, kbdStyles, type KbdProps } from './base/Kbd';
export { Link, linkStyles, type LinkProps, type LinkUnderlines } from './base/Link';
export { LinkButton, type LinkButtonManaged, type LinkButtonProps } from './base/LinkButton';
export { Spinner, spinnerStyles, type SpinnerProps } from './base/Spinner';
export { Tag, tagStyles, type TagProps } from './base/Tag';
export {
  createText,
  Em,
  Paragraph,
  Small,
  Strong,
  Text,
  textComponentStyles,
  type TextOptions,
  type TextProps,
  type TextTag,
} from './base/Text';
export {
  VisuallyHidden,
  visuallyHiddenStyles,
  type VisuallyHiddenProps,
} from './base/VisuallyHidden';
export { badgeStyles, badgeSx, type BadgeOptions, type BadgeRadii } from './base/badge-styles';
export {
  buttonContent,
  buttonLinkStyles,
  buttonRadiusStyles,
  buttonStyles,
  buttonSx,
  buttonVariantStyles,
  useButtonAppearance,
  useButtonBehavior,
  type ButtonAppearance,
  type ButtonBehaviorProps,
  type ButtonBehaviorState,
  type ButtonContentOptions,
  type ButtonOptions,
  type ButtonRadii,
  type ButtonTones,
  type ButtonVariants,
} from './base/button-core';

// 布局
export {
  Container,
  containerPaddingStyles,
  containerSizeStyles,
  containerStyles,
  createContainer,
  type ContainerOptions,
  type ContainerProps,
  type ContainerSizes,
} from './layout/Container';
export {
  createFlex,
  Flex,
  flexAlignStyles,
  flexJustifyStyles,
  FlexList,
  flexStyles,
  type FlexAligns,
  type FlexDirections,
  type FlexJustifies,
  type FlexOptions,
  type FlexProps,
} from './layout/Flex';
export {
  createGrid,
  Grid,
  gridAlignStyles,
  gridDynamicStyles,
  gridFlowStyles,
  gridJustifyStyles,
  GridList,
  gridStyles,
  type GridAligns,
  type GridFlows,
  type GridOptions,
  type GridProps,
} from './layout/Grid';
export {
  ScrollArea,
  scrollAreaBarStyles,
  scrollAreaStyles,
  type ScrollAreaAxes,
  type ScrollAreaProps,
  type ScrollbarTypes,
} from './layout/ScrollArea';
export {
  Separator,
  separatorStyles,
  type SeparatorManaged,
  type SeparatorOrientations,
  type SeparatorProps,
} from './layout/Separator';

// 展示
export {
  Avatar,
  avatarStyles,
  initials,
  type AvatarManaged,
  type AvatarOptions,
  type AvatarProps,
  type AvatarRadii,
} from './display/Avatar';
export {
  Card,
  cardPaddingStyles,
  cardStyles,
  cardVariantStyles,
  type CardOptions,
  type CardProps,
  type CardVariants,
} from './display/Card';
export { Collapse, collapseStyles, type CollapseProps } from './display/Collapse';
export { Collapsible, type CollapsibleProps } from './display/Collapsible';
export {
  VirtualList,
  virtualListSizeStyles,
  virtualListStyles,
  type VirtualListHandle,
  type VirtualListManaged,
  type VirtualListProps,
  type VirtualListScrolls,
} from './display/VirtualList';

// 反馈
export {
  Alert,
  alertStyles,
  type AlertLives,
  type AlertManaged,
  type AlertOptions,
  type AlertProps,
  type AlertVariants,
} from './feedback/Alert';
export {
  AlertDialog,
  useConfirm,
  type AlertDialogProps,
  type ConfirmOptions,
} from './feedback/AlertDialog';
export {
  Dialog,
  dialogPanelSx,
  dialogSizeStyles,
  dialogStyles,
  type DialogOptions,
  type DialogProps,
  type DialogSizes,
} from './feedback/Dialog';
export {
  Drawer,
  drawerSizeStyles,
  drawerStyles,
  type DrawerOptions,
  type DrawerProps,
  type DrawerSides,
} from './feedback/Drawer';
export { Empty, emptyStyles, type EmptyProps } from './feedback/Empty';
export {
  ModalCore,
  modalStyles,
  type ModalCoreProps,
  type ModalManaged,
  type ModalProps,
} from './feedback/Modal';
export {
  Progress,
  progressStyles,
  progressToneStyles,
  progressWidthStyles,
  type ProgressManaged,
  type ProgressProps,
  type ProgressTones,
} from './feedback/Progress';
export { Skeleton, skeletonStyles, type SkeletonProps } from './feedback/Skeleton';
export {
  createToaster,
  Toaster,
  ToastItem,
  toastPlacementStyles,
  toastStyles,
  type ToasterController,
  type ToasterOptions,
  type ToasterProps,
  type ToastItemProps,
  type ToastMessage,
  type ToastOptions,
  type ToastPlacements,
  type ToastPromiseMessages,
  type ToastRecord,
} from './feedback/Toast';

// 浮层
export {
  Menu,
  MenuCheckboxItem,
  MenuContext,
  MenuGroup,
  MenuItem,
  menuItemContent,
  menuItemSx,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioGroupContext,
  MenuRadioItem,
  menuStyles,
  useMenuItem,
  type MenuButtonItemProps,
  type MenuCheckboxItemProps,
  type MenuGroupProps,
  type MenuItemContentProps,
  type MenuItemMark,
  type MenuItemProps,
  type MenuLinkItemProps,
  type MenuProps,
  type MenuRadioGroupProps,
  type MenuRadioGroupState,
  type MenuRadioItemProps,
  type MenuState,
  type MenuTriggerProps,
} from './overlay/Menu';
export {
  Popover,
  popoverStyles,
  type PopoverProps,
  type PopoverTriggerProps,
} from './overlay/Popover';
export {
  Tooltip,
  tooltipStyles,
  type TooltipProps,
  type TooltipTriggerProps,
} from './overlay/Tooltip';

// 导航
export {
  Breadcrumbs,
  breadcrumbsStyles,
  type BreadcrumbItem,
  type BreadcrumbsProps,
} from './navigation/Breadcrumbs';
export {
  NavGroup,
  NavGroupContext,
  NavItem,
  NavList,
  navListStyles,
  type NavGroupProps,
  type NavGroupState,
  type NavItemManaged,
  type NavItemProps,
  type NavListProps,
} from './navigation/NavList';
export { Pagination, paginationStyles, type PaginationProps } from './navigation/Pagination';
export {
  Steps,
  stepsStateStyles,
  stepsStyles,
  type StepItem,
  type StepsOrientations,
  type StepsProps,
  type StepState,
} from './navigation/Steps';
export {
  Tab,
  TabList,
  tabListStyles,
  TabPanel,
  tabPanelStyles,
  Tabs,
  TabsContext,
  tabsStyles,
  tabStyles,
  type TabListManaged,
  type TabListProps,
  type TabManaged,
  type TabPanelManaged,
  type TabPanelProps,
  type TabProps,
  type TabsActivations,
  type TabsOptions,
  type TabsOrientations,
  type TabsProps,
  type TabsState,
  type TabsVariants,
} from './navigation/Tabs';
export {
  Toolbar,
  toolbarStyles,
  type ToolbarManaged,
  type ToolbarOrientations,
  type ToolbarProps,
} from './navigation/Toolbar';

// 输入与表单
export {
  Checkbox,
  CheckboxGroup,
  CheckboxGroupContext,
  checkboxStyles,
  type CheckboxGroupProps,
  type CheckboxGroupState,
  type CheckboxManaged,
  type CheckboxProps,
} from './input/Checkbox';
export {
  Combobox,
  comboboxStyles,
  type ComboboxBaseProps,
  type ComboboxManaged,
  type ComboboxProps,
} from './input/Combobox';
export {
  Field,
  FieldContext,
  fieldStyles,
  Label,
  labelStyles,
  useFieldControl,
  type FieldControl,
  type FieldControlOptions,
  type FieldProps,
  type FieldState,
  type LabelProps,
} from './input/Field';
export { Form, FormContext, type FormProps } from './input/Form';
export { FormValue, type FormValueProps } from './input/FormValue';
export {
  activeOptionId,
  Listbox,
  listboxPositionStyles,
  listboxStyles,
  ListboxView,
  type ListboxProps,
  type ListboxViewProps,
  type OptionRenderState,
} from './input/Listbox';
export {
  NumberField,
  parseNumber,
  type NumberFieldManaged,
  type NumberFieldProps,
} from './input/NumberField';
export {
  Radio,
  RadioGroup,
  RadioGroupContext,
  radioStyles,
  type RadioGroupProps,
  type RadioGroupState,
  type RadioManaged,
  type RadioProps,
} from './input/Radio';
export { Select, selectStyles, type SelectManaged, type SelectProps } from './input/Select';
export {
  SlideVerify,
  slideVerifyStyles,
  type SlideVerifyPoint,
  type SlideVerifyProps,
  type SlideVerifyResult,
  type SlideVerifyStatuses,
  type SlideVerifyTargets,
} from './input/SlideVerify';
export {
  Slider,
  sliderPositionStyles,
  sliderStyles,
  type SliderManaged,
  type SliderOrientations,
  type SliderProps,
} from './input/Slider';
export { Switch, switchStyles, type SwitchManaged, type SwitchProps } from './input/Switch';
export { TextField, type TextFieldManaged, type TextFieldProps } from './input/TextField';
export {
  Textarea,
  textareaRowStyles,
  textareaStyles,
  type TextareaManaged,
  type TextareaProps,
} from './input/Textarea';
export {
  ToggleGroup,
  ToggleGroupContext,
  toggleGroupStyles,
  ToggleItem,
  type ToggleGroupItemManaged,
  type ToggleGroupManaged,
  type ToggleGroupOrientations,
  type ToggleGroupProps,
  type ToggleGroupState,
  type ToggleItemProps,
} from './input/ToggleGroup';
export {
  choiceGroupStyles,
  choiceStyles,
  useChoiceSize,
  type ChoiceOptions,
  type ChoiceOrientations,
} from './input/choice-styles';
export {
  controlRadiusStyles,
  controlShellStyles,
  controlStyles,
  controlSx,
  focusOnShell,
  useControlAppearance,
  type ControlAppearance,
  type ControlOptions,
  type ControlState,
  type ControlVariants,
} from './input/control';
export { createConstraints, type FieldConstraints } from './input/form-constraints';
export {
  handleListKeydown,
  useListState,
  type ListboxOption,
  type ListItem,
  type ListKeydownOptions,
  type ListState,
  type ListStateOptions,
  type OptionMapping,
} from './input/list-state';
export {
  useForm,
  type FieldPath,
  type FormController,
  type FormControllerBase,
  type FormErrors,
  type FormOptions,
} from './input/useForm';

// 表格
export {
  ColumnResizer,
  columnResizerStyles,
  type ColumnResizerManaged,
  type ColumnResizerProps,
} from './table/ColumnResizer';
export { Table, type TableProps } from './table/Table';
export {
  tableDynamicStyles,
  tableSizeStyles,
  tableStyles,
  TableView,
  type TableOptions,
  type TableRowModel,
  type TableSizes,
  type TableVariants,
  type TableViewProps,
} from './table/TableView';
export {
  TreeTable,
  treeTableIndentStyles,
  treeTableStyles,
  type TreeTableProps,
} from './table/TreeTable';
export {
  COLUMN_FLEX_MIN_WIDTH,
  COLUMN_MIN_WIDTH,
  columnValue,
  nextSort,
  sortRows,
  stickyOffsets,
  tableMinWidth,
  type ColumnAligns,
  type ColumnStickies,
  type ColumnWidthOf,
  type SortDirections,
  type SortState,
  type TableColumn,
} from './table/columns';

// 配置：Provider、createUi、组件默认值
export {
  ConfigScope,
  Provider,
  providerStyles,
  type ConfigScopeProps,
  type ProviderProps,
} from './config/Provider';
export {
  ConfigContext,
  defaultConfig,
  useConfig,
  useLang,
  type Highlighter,
  type UiConfig,
  type UiRouter,
} from './config/context';
export { createUi, type UiOptions } from './config/createUi';
export {
  mergeDefaults,
  useDefaults,
  type ComponentDefaults,
  type ResolvedDefaults,
} from './config/defaults';

// 主题；tokens 从 @vue-tsx-pro/ui/tokens.stylex 导入（StyleX 只认 .stylex 结尾的导入路径）
export { darkColors, darkShadows, darkTheme } from './config/theme/dark';
export { lightTheme } from './config/theme/light';
export { usePrefersDark } from './config/theme/prefers-dark';
export {
  defineTheme,
  readToken,
  resolveTheme,
  themeAttrs,
  themeVariables,
  type ColorSchemes,
  type GroupTheme,
  type Theme,
  type ThemeInput,
  type ThemeOverrides,
} from './config/theme/theme';
import './config/theme/token-names';

// 语言与格式化
export { enUS } from './config/lang/en-US';
export { useFormat } from './config/lang/format';
export { defineLang, type Directions, type HourCycles, type Lang } from './config/lang/lang';
export { zhCN } from './config/lang/zh-CN';

// 工具：部件属性的合并
export {
  elementProps,
  mergePartProps,
  mergeProps,
  type PartProps,
  type TriggerProps,
} from './utils/props';

// 工具：档位、字号、色调、过渡等共用样式
export { itemStyles } from './utils/style/item-styles';
export {
  columnGapStyles,
  focusRingStyles,
  gapStyles,
  listRole,
  listStyles,
  rowGapStyles,
  type LayoutTag,
  type Size,
  type SizeScale,
  type Space,
  type SpaceScale,
  type StyleTable,
} from './utils/style/styles';
export {
  statusIcons,
  statusToneBorderStyles,
  statusToneStyles,
  statusToneSx,
  type StatusTone,
  type StatusTones,
  type StatusVariant,
  type StatusVariants,
} from './utils/style/tone-styles';
export { afterTransitions, transitions } from './utils/style/transitions';
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
  type FontWeight,
  type FontWeights,
  type TextAlign,
  type TextAligns,
  type TextSize,
  type TextSizes,
  type TextWrap,
  type TextWraps,
  type Tone,
  type Tones,
} from './utils/style/typography';

// 工具：焦点、漫游焦点、弹层、定位、拖动、波纹、路由链接、快捷键、剪贴板
export { useClipboard, type ClipboardOptions, type ClipboardState } from './utils/dom/clipboard';
export {
  anchorFloating,
  createAnchoredLayer,
  floatingStyles,
  useAnchoredPopover,
  type Anchored,
  type AnchoredLayer,
  type AnchoredPopoverEvents,
  type AnchoredPopoverState,
  type FloatingOptions,
  type FloatingPlacement,
  type FloatingPlacements,
} from './utils/dom/floating';
export {
  focusAfterRemoval,
  focusFirst,
  focusOrigin,
  returnFocus,
  trapFocus,
} from './utils/dom/focus';
export {
  formatHotkey,
  isApplePlatform,
  matchesHotkey,
  parseHotkey,
  useHotkeys,
  type HotkeyMap,
  type HotkeyOptions,
} from './utils/dom/hotkeys';
export { shouldRouteClick, useRouterLink, type RouterLink } from './utils/dom/link';
export { startMove, type MoveOptions, type MovePoint } from './utils/dom/move';
export {
  dismissOnBackdrop,
  lockScroll,
  toElement,
  topModal,
  trackModal,
} from './utils/dom/overlay';
export {
  rippleHostStyles,
  ripplePlacementStyles,
  rippleStyles,
  startRipple,
  useRipple,
  type RippleHandlers,
} from './utils/dom/ripple';
export {
  rovingFocus,
  type RovingFocusOptions,
  type RovingOrientations,
} from './utils/dom/roving-focus';
export { createTypeahead, type Typeahead } from './utils/dom/typeahead';

// 工具：比较与匹配、选择、分页、文字、数值
export { createComparer, createMatcher, type SortValue } from './utils/data/collation';
export { clamp, isRtl, snapToStep } from './utils/data/layout';
export {
  paginationItems,
  type PaginationEllipsis,
  type PaginationOptions,
} from './utils/data/pagination';
export {
  selectedValues,
  toggleSelection,
  type MultipleSelectionProps,
  type SelectionModes,
  type SelectionOptions,
  type SelectionProps,
  type SingleSelectionProps,
} from './utils/data/selection';
export { plainText } from './utils/data/text';

// 工具：虚拟滚动
export {
  useVirtualizer,
  type UseVirtualizerOptions,
  type VirtualView,
} from './utils/virtual/use-virtualizer';
export {
  computeMeasurements,
  defaultRangeExtractor,
  findVisibleRange,
  isWindow,
  Virtualizer,
  type ExtractorRange,
  type ScrollAligns,
  type VirtualItem,
  type VirtualizerOptions,
  type VirtualScrollOptions,
  type VisibleRange,
} from './utils/virtual/virtualizer';

// 工具：JS 动画与动效
export {
  useActiveIndicator,
  type ActiveIndicatorOptions,
  type IndicatorAxes,
} from './utils/motion/active-indicator';
export {
  themeTransition,
  themeTransitionOrInstant,
  useAnimate,
  type ThemeAnimate,
  type ThemeTiming,
  type ThemeTransitionOptions,
} from './utils/motion/animation';
export { useDelayedLoading, type DelayedLoadingOptions } from './utils/motion/delayed-loading';
export {
  useLayoutAnimation,
  type LayoutAnimation,
  type LayoutAnimationOptions,
} from './utils/motion/layout';
export { usePresence, type Presence, type PresenceOptions } from './utils/motion/presence';
export { useReducedMotion } from './utils/motion/reduced-motion';
export {
  useSpring,
  useTween,
  type SpringOptions,
  type Tweened,
  type TweenOptions,
} from './utils/motion/tween';
