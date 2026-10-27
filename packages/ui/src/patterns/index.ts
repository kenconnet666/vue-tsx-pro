/**
 * 页面组合（子路径 `@zerodep-dev/vue-tsx-pro-ui/patterns`）：用核心组件拼好的页面级部件，后台应用直接拿来搭页面：
 * 应用外壳 AppShell、页签区 PageTabs、查询表格 QueryTable、分步表单 StepsForm、数据导入 DataImport、吸底操作栏 ActionBar、筛选条 FilterBar、通知中心 NotificationCenter、
 * 留言 CommentThread、看板 KanbanBoard、时限标记 DeadlineBadge、主题切换 ThemeSwitcher、布局切换 LayoutSwitcher、命令式的表单对话框 useFormDialog。
 *
 *   import { AppShell, FilterBar } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
 *
 * 它们只依赖主入口的组件与工具，不放在主入口：外观与交互更有主见（同 Ant Design 的 ProComponents），
 * 文案自带中英文（messages.ts），别的语言在 Lang.messages.patterns 里补。
 */
export { ActionBar, actionBarStyles, type ActionBarProps } from './ActionBar';
export {
  AppShell,
  AppShellBrand,
  appShellBrandStyles,
  AppShellContext,
  appShellDynamicStyles,
  appShellOffset,
  appShellStyles,
  type AppShellBrandProps,
  type AppShellProps,
  type AppShellSidebarModes,
  type AppShellSidebarSides,
  type AppShellState,
} from './AppShell';
export {
  CommentComposer,
  commentStyles,
  CommentThread,
  type CommentAttachment,
  type CommentAuthor,
  type CommentComposerProps,
  type CommentDraft,
  type CommentItem,
  type CommentThreadProps,
} from './CommentThread';
export { DataImport, dataImportStyles, type DataImportProps, type ImportField } from './DataImport';
export { DeadlineBadge, type DeadlineBadgeProps } from './DeadlineBadge';
export {
  FilterBar,
  filterBarColumnStyles,
  filterBarStyles,
  type FilterBarManaged,
  type FilterBarProps,
} from './FilterBar';
export {
  KanbanBoard,
  kanbanBoardDynamicStyles,
  kanbanBoardStyles,
  type KanbanBoardProps,
  type KanbanCardState,
  type KanbanColumn,
} from './KanbanBoard';
export { LayoutSwitcher, type LayoutSwitcherProps } from './LayoutSwitcher';
export {
  NotificationCenter,
  notificationCenterStyles,
  NotificationList,
  notificationListStyles,
  type NotificationCenterProps,
  type NotificationItem,
  type NotificationListOptions,
  type NotificationListProps,
  type NotificationType,
} from './NotificationCenter';
export { PageTabs, type PageTab, type PageTabsProps } from './PageTabs';
export { QueryTable, queryTableStyles, type QueryTableProps } from './QueryTable';
export { StepsForm, stepsFormStyles, type FormStep, type StepsFormProps } from './StepsForm';
export { ThemeSwitcher, type ThemeSwitcherProps } from './ThemeSwitcher';
export { useFormDialog, type FormDialogField, type FormDialogOptions } from './form-dialog';
export { patternsMessages, type PatternsMessages } from './messages';
