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
} from './base/button-core';

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
export {
  ModalCore,
  modalStyles,
  type ModalCoreProps,
  type ModalManaged,
  type ModalProps,
} from './feedback/Modal';
export {
  Dialog,
  dialogPanelSx,
  type DialogOptions,
  type DialogProps,
  type DialogSizes,
} from './feedback/Dialog';
export { Drawer, type DrawerOptions, type DrawerProps, type DrawerSides } from './feedback/Drawer';
export {
  AlertDialog,
  useConfirm,
  type AlertDialogProps,
  type ConfirmOptions,
} from './feedback/AlertDialog';
export { Empty, type EmptyProps } from './feedback/Empty';
export {
  createToaster,
  Toaster,
  type ToasterController,
  type ToasterOptions,
  type ToasterProps,
  type ToastMessage,
  type ToastOptions,
  type ToastPlacements,
  type ToastPromiseMessages,
  type ToastRecord,
} from './feedback/Toast';

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

// 浮层
export { Popover, type PopoverProps, type PopoverTriggerProps } from './overlay/Popover';
export { Tooltip, type TooltipProps, type TooltipTriggerProps } from './overlay/Tooltip';
export {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  type MenuCheckboxItemProps,
  type MenuGroupProps,
  type MenuItemProps,
  type MenuLinkItemProps,
  type MenuProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuTriggerProps,
} from './overlay/Menu';

// 输入
export {
  controlStyles,
  controlSx,
  focusOnShell,
  useControlAppearance,
  type ControlAppearance,
  type ControlOptions,
  type ControlState,
  type ControlVariants,
} from './input/control';
export { TextField, type TextFieldProps } from './input/TextField';
export { FormValue, type FormValueProps } from './input/FormValue';
export { Textarea, type TextareaProps } from './input/Textarea';
export { NumberField, parseNumber, type NumberFieldProps } from './input/NumberField';
export {
  choiceGroupStyles,
  choiceStyles,
  useChoiceSize,
  type ChoiceOptions,
  type ChoiceOrientations,
} from './input/choice-styles';
export {
  Checkbox,
  CheckboxGroup,
  type CheckboxGroupProps,
  type CheckboxProps,
} from './input/Checkbox';
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from './input/Radio';
export { Switch, type SwitchProps } from './input/Switch';
export {
  createListState,
  handleListKeydown,
  type ListboxOption,
  type ListKeydownOptions,
  type ListState,
  type ListStateOptions,
} from './input/list-state';
export {
  activeOptionId,
  Listbox,
  ListboxView,
  type ListboxProps,
  type ListboxViewProps,
  type OptionRenderState,
} from './input/Listbox';
export { Select, type SelectProps } from './input/Select';
export { Combobox, type ComboboxProps } from './input/Combobox';
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

// 输入：表单结构与校验（Field、Form、useForm）
export { Form, type FormProps } from './input/Form';
export { useForm, type FormController, type FormErrors, type FormOptions } from './input/useForm';
export {
  Field,
  Label,
  useFieldControl,
  type FieldControl,
  type FieldControlOptions,
  type FieldProps,
  type FieldState,
  type LabelProps,
} from './input/Field';

// 表格
export {
  columnValue,
  nextSort,
  sortRows,
  type ColumnAligns,
  type ColumnStickies,
  type SortDirections,
  type SortState,
  type TableColumn,
} from './table/columns';
export {
  TableView,
  type TableOptions,
  type TableRowModel,
  type TableSelections,
  type TableSizes,
  type TableVariants,
  type TableViewProps,
} from './table/TableView';
export { Table, type TableProps } from './table/Table';
export { TreeTable, type TreeTableProps } from './table/TreeTable';

// 配置：主题与语言；tokens 从 @vue-tsx-pro/ui/tokens.stylex 导入（StyleX 只认 .stylex 结尾的导入路径）
export {
  ConfigScope,
  Provider,
  type ConfigScopeProps,
  type ProviderProps,
} from './config/Provider';
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
} from './utils/style/styles';
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
} from './utils/style/typography';
export {
  dismissOnBackdrop,
  lockScroll,
  toElement,
  topModal,
  trackModal,
} from './utils/dom/overlay';
export {
  focusAfterRemoval,
  focusFirst,
  focusOrigin,
  returnFocus,
  trapFocus,
} from './utils/dom/focus';
export {
  anchorFloating,
  createAnchoredPopover,
  floatingStyles,
  useAnchoredPopover,
  type Anchored,
  type AnchoredPopover,
  type AnchoredPopoverEvents,
  type AnchoredPopoverState,
  type FloatingOptions,
  type FloatingPlacement,
  type FloatingPlacements,
} from './utils/dom/floating';
export { themeTransition, type ThemeTransitionOptions } from './utils/animation';
export { startMove, type MoveOptions, type MovePoint } from './utils/dom/move';
export {
  rovingFocus,
  type RovingFocusOptions,
  type RovingOrientations,
} from './utils/dom/roving-focus';
export { plainText } from './utils/data/text';
export { itemStyles } from './utils/style/item-styles';
export { createComparer, createMatcher, type SortValue } from './utils/data/collation';
export { createTypeahead, type Typeahead } from './utils/dom/typeahead';
export {
  toggleSelection,
  type SelectionModes,
  type SelectionOptions,
} from './utils/data/selection';
export {
  statusIcons,
  statusToneSx,
  type StatusTone,
  type StatusTones,
  type StatusVariant,
  type StatusVariants,
} from './utils/style/tone-styles';
export { rippleHostStyles, startRipple, useRipple, type RippleHandlers } from './utils/dom/ripple';
export { shouldRouteClick, useRouterLink, type RouterLink } from './utils/dom/link';
export {
  paginationItems,
  type PaginationEllipsis,
  type PaginationOptions,
} from './utils/data/pagination';
export { afterTransitions, transitions } from './utils/style/transitions';
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
} from './utils/virtual/virtualizer';
export {
  useVirtualizer,
  type UseVirtualizerOptions,
  type VirtualView,
} from './utils/virtual/use-virtualizer';
