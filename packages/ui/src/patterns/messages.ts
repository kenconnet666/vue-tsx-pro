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
  /** 查询栏的高级筛选（按钮、条件构造器的名称、摘要的开头），默认“高级筛选” */
  readonly filterAdvanced: string;
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
  /** 上下抽屉的高度手柄的名称，默认“调整导航高度” */
  readonly navigationResizeHeight: string;
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
  /** 查询表格：刷新，默认“刷新” */
  readonly queryTableRefresh: string;
  /** 查询表格：加载失败的提示条上的重试按钮，默认“重试” */
  readonly queryTableRetry: string;
  /** 查询表格：行高菜单，默认“行高” */
  readonly queryTableDensity: string;
  /** 行高：紧凑，默认“紧凑” */
  readonly queryTableDensityCompact: string;
  /** 行高：标准，默认“标准” */
  readonly queryTableDensityStandard: string;
  /** 行高：宽松，默认“宽松” */
  readonly queryTableDensityComfortable: string;
  /** 查询表格：全屏，默认“全屏” */
  readonly queryTableFullscreen: string;
  /** 查询表格：退出全屏，默认“退出全屏” */
  readonly queryTableExitFullscreen: string;
  /** 查询表格分页导航的名称：`('任务台账')` → “任务台账分页” */
  readonly queryTablePagination: (title: string) => string;
  /** 查询表格的查询栏（search 地标）的名称：`('任务台账')` → “任务台账查询” */
  readonly queryTableSearch: (title: string) => string;
  /** 分步表单：上一步，默认“上一步” */
  readonly stepsFormPrevious: string;
  /** 分步表单：下一步，默认“下一步” */
  readonly stepsFormNext: string;
  /** 分步表单：最后一步的提交，默认“提交” */
  readonly stepsFormSubmit: string;
  /** 分步表单这一步内容的名称：`(2, 3)` → “第 2 步，共 3 步” */
  readonly stepsFormStep: (step: number, total: number) => string;
  /** 导入的四步：上传文件、对应列、校验与预览、完成 */
  readonly dataImportSteps: readonly [string, string, string, string];
  /** 导入：支持的格式说明：`('.xlsx, .csv')` → “支持 .xlsx, .csv” */
  readonly dataImportAccept: (accept: string) => string;
  /** 导入：下载模板按钮，默认“下载模板” */
  readonly dataImportTemplate: string;
  /** 导入：选工作表，默认“工作表” */
  readonly dataImportSheet: string;
  /** 导入：读文件失败：`('…')` → “读不了这个文件：…” */
  readonly dataImportParseFailed: (reason: string) => string;
  /** 导入：文件里没有数据行，默认“文件里没有数据行” */
  readonly dataImportEmpty: string;
  /** 导入：对应列表格的列标题“字段” */
  readonly dataImportField: string;
  /** 导入：对应列表格的列标题“文件中的列” */
  readonly dataImportColumn: string;
  /** 导入：对应列表格的列标题“示例” */
  readonly dataImportSample: string;
  /** 导入：不导入这个字段，默认“不导入” */
  readonly dataImportSkip: string;
  /** 导入：必填字段还没对应：`(['零件号'])` → “必填的字段还没对应：零件号” */
  readonly dataImportUnmapped: (labels: readonly string[]) => string;
  /** 导入：校验结果：`(120, 118, 2)` → “共 120 行，可以导入 118 行，2 行有错” */
  readonly dataImportSummary: (total: number, valid: number, invalid: number) => string;
  /** 导入：只看有错的行，默认“只看有错的行” */
  readonly dataImportOnlyErrors: string;
  /** 导入：预览表的“序号”列（第几行数据） */
  readonly dataImportRow: string;
  /** 导入：预览表的“校验”列 */
  readonly dataImportStatus: string;
  /** 导入：没有错的行，默认“可以导入” */
  readonly dataImportValid: string;
  /** 导入：改了格子之后的提示，默认“格子可以直接改，改完重新校验” */
  readonly dataImportEditHint: string;
  /** 导入：确认按钮：`(118)` → “导入 118 行” */
  readonly dataImportSubmit: (count: number) => string;
  /** 导入：完成：`(118)` → “已导入 118 行” */
  readonly dataImportDone: (count: number) => string;
  /** 导入：再导入一份，默认“再导入一份” */
  readonly dataImportAgain: string;
  /** 导入：数字列里不是数字，默认“不是数字” */
  readonly dataImportNotNumber: string;
  /** 导入：所在的预览表的名称，默认“导入预览” */
  readonly dataImportPreview: string;
  /** 主题切换的名称，默认“主题” */
  readonly themeLabel: string;
  /** 布局切换的名称，默认“布局” */
  readonly layoutLabel: string;
  /** 布局切换：侧栏形式一组的标题，默认“侧栏形式” */
  readonly layoutMode: string;
  /** 布局切换：固定侧栏，默认“固定” */
  readonly layoutModeDocked: string;
  /** 布局切换：抽屉式侧栏，默认“抽屉” */
  readonly layoutModeOverlay: string;
  /** 布局切换：抽屉位置一组的标题，默认“抽屉位置” */
  readonly layoutSide: string;
  /** 布局切换：抽屉在起始边，默认“左侧” */
  readonly layoutSideStart: string;
  /** 布局切换：抽屉在结束边，默认“右侧” */
  readonly layoutSideEnd: string;
  /** 布局切换：抽屉在顶部，默认“顶部” */
  readonly layoutSideTop: string;
  /** 布局切换：抽屉在底部，默认“底部” */
  readonly layoutSideBottom: string;
  /** 留言：留言列表的名称，默认“留言” */
  readonly comments: string;
  /** 留言：没有留言时，默认“还没有留言” */
  readonly commentsEmpty: string;
  /** 留言：输入框的提示，默认“写下留言，输入 @ 提及相关的人” */
  readonly commentPlaceholder: string;
  /** 留言：回复按钮，默认“回复” */
  readonly commentReply: string;
  /** 留言：回复某人时输入框的名称：`('林小满')` → “回复 林小满” */
  readonly commentReplyTo: (name: string) => string;
  /** 留言：发送按钮，默认“发送” */
  readonly commentSend: string;
  /** 留言：取消回复，默认“取消” */
  readonly commentCancel: string;
  /** 留言：添加附件的按钮，默认“附件” */
  readonly commentAttach: string;
  /** 留言：发送的快捷键说明，默认“Ctrl + Enter 发送” */
  readonly commentSendHint: string;
  /** 留言：发送失败，默认“发送失败，内容已保留，请重试” */
  readonly commentSendFailed: string;
  /** 留言：改过的留言的标记，默认“已编辑” */
  readonly commentEdited: string;
  /** 留言：一条留言下面回复列表的名称：`(3)` → “3 条回复” */
  readonly commentReplies: (count: number) => string;
  /** 留言：附件列表的名称，默认“附件” */
  readonly commentAttachments: string;
}

/** 页面组合的文案表：中文与英文，别的语言先找同语种、再用英文 */
export const patternsMessages: MessageTable<PatternsMessages> = {
  'zh-CN': {
    filterSearch: '查询',
    filterReset: '重置',
    filterExpand: '展开',
    filterCollapse: '收起',
    filterActive: (count) => `已设 ${count} 项`,
    filterAdvanced: '高级筛选',
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
    navigationResizeHeight: '调整导航高度',
    sidebarCollapse: '收起侧栏',
    sidebarExpand: '展开侧栏',
    pageTabsLabel: '打开的页面',
    pageTabsMenu: '页签操作',
    pageTabsClose: '关闭',
    pageTabsCloseOthers: '关闭其他',
    pageTabsCloseRight: '关闭右侧',
    queryTableRefresh: '刷新',
    queryTableRetry: '重试',
    queryTableDensity: '行高',
    queryTableDensityCompact: '紧凑',
    queryTableDensityStandard: '标准',
    queryTableDensityComfortable: '宽松',
    queryTableFullscreen: '全屏',
    queryTableExitFullscreen: '退出全屏',
    queryTablePagination: (title) => `${title}分页`,
    queryTableSearch: (title) => `${title}查询`,
    stepsFormPrevious: '上一步',
    stepsFormNext: '下一步',
    stepsFormSubmit: '提交',
    stepsFormStep: (step, total) => `第 ${step} 步，共 ${total} 步`,
    dataImportSteps: ['上传文件', '对应列', '校验与预览', '完成'],
    dataImportAccept: (accept) => `支持 ${accept}`,
    dataImportTemplate: '下载模板',
    dataImportSheet: '工作表',
    dataImportParseFailed: (reason) => `读不了这个文件：${reason}`,
    dataImportEmpty: '文件里没有数据行',
    dataImportField: '字段',
    dataImportColumn: '文件中的列',
    dataImportSample: '示例',
    dataImportSkip: '不导入',
    dataImportUnmapped: (labels) => `必填的字段还没对应：${labels.join('、')}`,
    dataImportSummary: (total, valid, invalid) =>
      `共 ${total} 行，可以导入 ${valid} 行${invalid ? `，${invalid} 行有错` : ''}`,
    dataImportOnlyErrors: '只看有错的行',
    dataImportRow: '序号',
    dataImportStatus: '校验',
    dataImportValid: '可以导入',
    dataImportEditHint: '有错的格子可以直接改，改完重新校验',
    dataImportSubmit: (count) => `导入 ${count} 行`,
    dataImportDone: (count) => `已导入 ${count} 行`,
    dataImportAgain: '再导入一份',
    dataImportNotNumber: '不是数字',
    dataImportPreview: '导入预览',
    themeLabel: '主题',
    layoutLabel: '布局',
    layoutMode: '侧栏形式',
    layoutModeDocked: '固定',
    layoutModeOverlay: '抽屉',
    layoutSide: '抽屉位置',
    layoutSideStart: '左侧',
    layoutSideEnd: '右侧',
    layoutSideTop: '顶部',
    layoutSideBottom: '底部',
    comments: '留言',
    commentsEmpty: '还没有留言',
    commentPlaceholder: '写下留言，输入 @ 提及相关的人',
    commentReply: '回复',
    commentReplyTo: (name) => `回复 ${name}`,
    commentSend: '发送',
    commentCancel: '取消',
    commentAttach: '附件',
    commentSendHint: 'Ctrl + Enter 发送',
    commentSendFailed: '发送失败，内容已保留，请重试',
    commentEdited: '已编辑',
    commentReplies: (count) => `${count} 条回复`,
    commentAttachments: '附件',
  },
  'en-US': {
    filterSearch: 'Search',
    filterReset: 'Reset',
    filterExpand: 'More filters',
    filterCollapse: 'Fewer filters',
    filterActive: (count) => `${count} set`,
    filterAdvanced: 'Advanced filter',
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
    navigationResizeHeight: 'Resize navigation height',
    sidebarCollapse: 'Collapse sidebar',
    sidebarExpand: 'Expand sidebar',
    pageTabsLabel: 'Open pages',
    pageTabsMenu: 'Tab actions',
    pageTabsClose: 'Close',
    pageTabsCloseOthers: 'Close others',
    pageTabsCloseRight: 'Close tabs to the right',
    queryTableRefresh: 'Refresh',
    queryTableRetry: 'Retry',
    queryTableDensity: 'Row height',
    queryTableDensityCompact: 'Compact',
    queryTableDensityStandard: 'Standard',
    queryTableDensityComfortable: 'Comfortable',
    queryTableFullscreen: 'Full screen',
    queryTableExitFullscreen: 'Exit full screen',
    queryTablePagination: (title) => `${title} pagination`,
    queryTableSearch: (title) => `Search ${title}`,
    stepsFormPrevious: 'Previous',
    stepsFormNext: 'Next',
    stepsFormSubmit: 'Submit',
    stepsFormStep: (step, total) => `Step ${step} of ${total}`,
    dataImportSteps: ['Upload', 'Map columns', 'Review', 'Done'],
    dataImportAccept: (accept) => `Supports ${accept}`,
    dataImportTemplate: 'Download template',
    dataImportSheet: 'Sheet',
    dataImportParseFailed: (reason) => `Can't read this file: ${reason}`,
    dataImportEmpty: 'The file has no data rows',
    dataImportField: 'Field',
    dataImportColumn: 'Column in file',
    dataImportSample: 'Sample',
    dataImportSkip: "Don't import",
    dataImportUnmapped: (labels) => `Required fields not mapped: ${labels.join(', ')}`,
    dataImportSummary: (total, valid, invalid) =>
      `${total} rows, ${valid} ready to import${invalid ? `, ${invalid} with problems` : ''}`,
    dataImportOnlyErrors: 'Only rows with problems',
    dataImportRow: '#',
    dataImportStatus: 'Check',
    dataImportValid: 'Ready',
    dataImportEditHint: 'Fix cells in place; they are checked again',
    dataImportSubmit: (count) => `Import ${count} rows`,
    dataImportDone: (count) => `Imported ${count} rows`,
    dataImportAgain: 'Import another file',
    dataImportNotNumber: 'Not a number',
    dataImportPreview: 'Import preview',
    themeLabel: 'Theme',
    layoutLabel: 'Layout',
    layoutMode: 'Sidebar',
    layoutModeDocked: 'Docked',
    layoutModeOverlay: 'Drawer',
    layoutSide: 'Drawer position',
    layoutSideStart: 'Left',
    layoutSideEnd: 'Right',
    layoutSideTop: 'Top',
    layoutSideBottom: 'Bottom',
    comments: 'Comments',
    commentsEmpty: 'No comments yet',
    commentPlaceholder: 'Write a comment, type @ to mention someone',
    commentReply: 'Reply',
    commentReplyTo: (name) => `Reply to ${name}`,
    commentSend: 'Send',
    commentCancel: 'Cancel',
    commentAttach: 'Attach',
    commentSendHint: 'Ctrl + Enter to send',
    commentSendFailed: 'Could not send. Your text is kept, please try again',
    commentEdited: 'Edited',
    commentReplies: (count) => (count === 1 ? '1 reply' : `${count} replies`),
    commentAttachments: 'Attachments',
  },
};
