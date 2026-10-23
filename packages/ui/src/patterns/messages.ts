/**
 * 页面组合（AppShell、FilterBar、NotificationCenter、KanbanBoard、DeadlineBadge、ThemeSwitcher）自带的文案：
 * 中文与英文各一份，可以在 createUi 的 lang.messages.patterns 里按字段改写（见 config/lang/messages.ts）
 */
import type { MessageTable } from '../config/lang/messages';

/** 页面组合的文案 */
export interface PatternsMessages {
  /** 查询栏的查询按钮，默认“查询” */
  readonly filterSearch: string;
  /** 查询栏的重置按钮，默认“重置” */
  readonly filterReset: string;
  /** 查询栏展开更多条件，默认“展开” */
  readonly filterExpand: string;
  /** 查询栏收起更多条件，默认“收起” */
  readonly filterCollapse: string;
  /** 收起的条件里已经填了几项：`(2)` → “已设 2 项” */
  readonly filterActive: (count: number) => string;
  /** 时限标记：还剩几个工作日，默认“剩 n 个工作日” */
  readonly deadlineRemaining: (workdays: number) => string;
  /** 时限标记：今天到期，默认“今天到期” */
  readonly deadlineDue: string;
  /** 时限标记：超时几个工作日（0 时是周末、假日里刚过期），默认“超时 n 个工作日”“已超时” */
  readonly deadlineOverdue: (workdays: number) => string;
  /** 时限标记：按时完成，默认“按时完成” */
  readonly deadlineDone: string;
  /** 时限标记：超时完成，默认“超时 n 个工作日完成” */
  readonly deadlineDoneLate: (workdays: number) => string;
  /** 时限标记的完整说明（title 与读屏）：截止日，默认“截止 2026-10-23” */
  readonly deadlineOn: (date: string) => string;
  /** 通知中心的标题与按钮名称，默认“通知” */
  readonly notifications: string;
  /** 通知中心按钮的名称（带未读数），默认“通知，未读 n 条” */
  readonly notificationsUnread: (count: number) => string;
  /** 通知中心：全部标为已读，默认“全部标为已读” */
  readonly notificationsMarkAllRead: string;
  /** 通知中心：不按类型筛选，默认“全部” */
  readonly notificationsAll: string;
  /** 通知中心：只看未读，默认“只看未读” */
  readonly notificationsUnreadOnly: string;
  /** 通知中心：没有通知，默认“没有通知” */
  readonly notificationsEmpty: string;
  /** 通知中心：一条未读的标记（读屏），默认“未读” */
  readonly notificationUnreadMark: string;
  /** 看板卡片把手的操作说明，默认“按空格拿起，左右方向键换列、上下方向键调整位置，再按空格放下，Esc 取消” */
  readonly kanbanInstructions: string;
  /** 看板：一列没有卡片时，默认“没有” */
  readonly kanbanEmpty: string;
  /** 窄屏时收着侧边导航的抽屉的标题，默认“导航” */
  readonly navigation: string;
  /** 窄屏时打开侧边导航的按钮，默认“打开导航” */
  readonly navigationOpen: string;
  /** 抽屉式侧边导航的开关按钮上的文字，默认“菜单” */
  readonly navigationMenu: string;
  /** 抽屉式侧边导航的宽度调整手柄，默认“调整导航宽度” */
  readonly navigationResize: string;
  /** AppShell 侧栏底部收起成图标栏的按钮，默认“收起侧栏” */
  readonly sidebarCollapse: string;
  /** AppShell 侧栏收起后展开的按钮，默认“展开侧栏” */
  readonly sidebarExpand: string;
  /** 页签区的名称，默认“打开的页面” */
  readonly pageTabsLabel: string;
  /** 页签的右键菜单的名称，默认“页签操作” */
  readonly pageTabsMenu: string;
  /** 页签的右键菜单：关闭这一个，默认“关闭” */
  readonly pageTabsClose: string;
  /** 页签的右键菜单：关闭其他的，默认“关闭其他” */
  readonly pageTabsCloseOthers: string;
  /** 页签的右键菜单：关闭右边的，默认“关闭右侧” */
  readonly pageTabsCloseRight: string;
  /** 主题切换的名称，默认“主题” */
  readonly themeLabel: string;
}

/** 页面组合的文案表：中文与英文，别的语言先找同语种、再用英文 */
export const patternsMessages: MessageTable<PatternsMessages> = {
  'zh-CN': {
    filterSearch: '查询',
    filterReset: '重置',
    filterExpand: '展开',
    filterCollapse: '收起',
    filterActive: (count) => `已设 ${count} 项`,
    deadlineRemaining: (workdays) => `剩 ${workdays} 个工作日`,
    deadlineDue: '今天到期',
    deadlineOverdue: (workdays) => (workdays > 0 ? `超时 ${workdays} 个工作日` : '已超时'),
    deadlineDone: '按时完成',
    deadlineDoneLate: (workdays) => `超时 ${workdays} 个工作日完成`,
    deadlineOn: (date) => `截止 ${date}`,
    notifications: '通知',
    notificationsUnread: (count) => (count > 0 ? `通知，未读 ${count} 条` : '通知'),
    notificationsMarkAllRead: '全部标为已读',
    notificationsAll: '全部',
    notificationsUnreadOnly: '只看未读',
    notificationsEmpty: '没有通知',
    notificationUnreadMark: '未读',
    kanbanInstructions: '按空格拿起，左右方向键换列、上下方向键调整位置，再按空格放下，Esc 取消',
    kanbanEmpty: '没有',
    navigation: '导航',
    navigationOpen: '打开导航',
    navigationMenu: '菜单',
    navigationResize: '调整导航宽度',
    sidebarCollapse: '收起侧栏',
    sidebarExpand: '展开侧栏',
    pageTabsLabel: '打开的页面',
    pageTabsMenu: '页签操作',
    pageTabsClose: '关闭',
    pageTabsCloseOthers: '关闭其他',
    pageTabsCloseRight: '关闭右侧',
    themeLabel: '主题',
  },
  'en-US': {
    filterSearch: 'Search',
    filterReset: 'Reset',
    filterExpand: 'More filters',
    filterCollapse: 'Fewer filters',
    filterActive: (count) => `${count} set`,
    deadlineRemaining: (workdays) => `${workdays} ${workdays === 1 ? 'workday' : 'workdays'} left`,
    deadlineDue: 'Due today',
    deadlineOverdue: (workdays) =>
      workdays > 0 ? `${workdays} ${workdays === 1 ? 'workday' : 'workdays'} overdue` : 'Overdue',
    deadlineDone: 'Done on time',
    deadlineDoneLate: (workdays) =>
      `Done ${workdays} ${workdays === 1 ? 'workday' : 'workdays'} late`,
    deadlineOn: (date) => `Due ${date}`,
    notifications: 'Notifications',
    notificationsUnread: (count) =>
      count > 0 ? `Notifications, ${count} unread` : 'Notifications',
    notificationsMarkAllRead: 'Mark all as read',
    notificationsAll: 'All',
    notificationsUnreadOnly: 'Unread only',
    notificationsEmpty: 'No notifications',
    notificationUnreadMark: 'Unread',
    kanbanInstructions:
      'Press space to pick up, use the left and right arrow keys to change column and the up and down arrow keys to change position, press space again to drop, Escape to cancel',
    kanbanEmpty: 'None',
    navigation: 'Navigation',
    navigationOpen: 'Open navigation',
    navigationMenu: 'Menu',
    navigationResize: 'Resize navigation',
    sidebarCollapse: 'Collapse sidebar',
    sidebarExpand: 'Expand sidebar',
    pageTabsLabel: 'Open pages',
    pageTabsMenu: 'Tab actions',
    pageTabsClose: 'Close',
    pageTabsCloseOthers: 'Close others',
    pageTabsCloseRight: 'Close tabs to the right',
    themeLabel: 'Theme',
  },
};
