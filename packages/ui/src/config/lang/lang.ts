/**
 * 语言：地区、时间与组件文案平铺在一个对象里，组件里用 useLang() 读取：
 *   lang.timeZone、lang.confirm、lang.paginationTotal(42)
 *
 * 命名：通用文案不加前缀；组件文案用组件名作前缀（selectEmpty），键入 lang.select 即可筛出。
 * 需要插值的文案写成函数。
 *
 * 页面级的组件（主题编辑器、文档站组件）自带各语言的文案（messages.ts），不在这里逐条列出：
 * 新增一种语言只翻这里的字段，它们没有这种语言时显示英文。
 */
import type { $ZodErrorMap } from 'zod/v4/core';
import type { DateSegmentType } from '../../date/date-segments';
import type { DateRangePreset } from '../../utils/data/date';
import type { DocsKitMessages } from '../../docs-kit/messages';
import type { PatternsMessages } from '../../patterns/messages';
import type { ThemeCustomizerMessages } from '../../theme-customize/messages';
import type { WorkflowMessages } from '../../workflow/messages';

/** 文字方向 */
export interface Directions {
  /** 从左到右：中文、英文等 */
  ltr: unknown;
  /** 从右到左：阿拉伯文、希伯来文等；方向相关的样式与图标随之镜像 */
  rtl: unknown;
}

/** 小时制 */
export interface HourCycles {
  /** 12 小时制，带上午/下午 */
  h12: unknown;
  /** 24 小时制，0–23 */
  h23: unknown;
}

/** 一种语言的全部配置：地区格式与界面文案平铺在一个对象里（COMPONENTS.md §6.3） */
export interface Lang {
  // ───────── 地区与格式 ─────────

  /** BCP 47 语言标签，决定数字、日期等 Intl 格式化规则，如 `'zh-CN'` */
  readonly code: string;
  /** 文字方向 */
  readonly direction: keyof Directions;
  /** 时区，如 `'Asia/Shanghai'`；不写时使用浏览器时区 */
  readonly timeZone?: string;
  /**
   * 日历系统，如 `'gregory'`（公历）、`'japanese'`（和历）。Intl 格式化都认；日期组件的网格与运算用
   * @internationalized/date，它不支持的（如 `'chinese'` 农历）按公历排
   */
  readonly calendar: string;
  /** 一周的第一天，0 表示周日；不写时按地区惯例 */
  readonly firstDayOfWeek?: number;
  /** 12 或 24 小时制；不写时按地区惯例 */
  readonly hourCycle?: keyof HourCycles;
  /** 金额的默认币种，如 `'CNY'` */
  readonly currency: string;

  // ───────── 通用文案 ─────────

  /** 确认按钮，默认“确定” */
  readonly confirm: string;
  /** 取消按钮，默认“取消” */
  readonly cancel: string;
  /** 关闭按钮（弹层、标签）的无障碍名称，默认“关闭” */
  readonly close: string;
  /** 清空输入的按钮，默认“清空” */
  readonly clear: string;
  /** 加载中提示，默认“加载中” */
  readonly loading: string;
  /** 移除（标签、已选项）的按钮名称，默认“移除” */
  readonly remove: string;
  /** 复制按钮的名称，默认“复制” */
  readonly copy: string;
  /** 复制成功后读屏播报的提示，默认“已复制” */
  readonly copied: string;
  /** 没有值时显示的占位（表格单元格、图表提示、描述列表），默认“—” */
  readonly emptyValue: string;
  /** 表单里该填的没有填（null、undefined、空字符串、空数组）时的错误，默认“必填”；schema 里自己写的提示优先 */
  readonly formRequired: string;
  /** 其余校验错误的文案：取 zod 自带的语言包（`zod/v4/locales` 的 localeError）；schema 里自己写的提示优先 */
  readonly formIssues: $ZodErrorMap;
  /** 未保存离开时确认对话框的标题，默认“离开这个页面？” */
  readonly leaveTitle: string;
  /** 未保存离开时确认对话框的说明，默认“有未保存的修改，离开后会丢失。” */
  readonly leaveDescription: string;
  /** 未保存离开时确认对话框的确认按钮，默认“离开” */
  readonly leaveConfirm: string;

  // ───────── 组件文案 ─────────

  /** 通知区域（Toaster）的无障碍名称，默认“通知” */
  readonly toasterLabel: string;
  /** 外链（target=_blank）给读屏的提示，默认“（在新窗口打开）” */
  readonly linkNewWindow: string;
  /** 密码框里“显示密码”切换按钮的名称（按下状态由 aria-pressed 表示），默认“显示密码” */
  readonly passwordShow: string;
  /** 字数计数给读屏的说明：`(12, 100)` → “已输入 12 个字符，最多 100 个” */
  readonly characterCount: (count: number, max?: number) => string;
  /** 范围滑块里较小一端的滑块名称，默认“最小值” */
  readonly sliderMin: string;
  /** 范围滑块里较大一端的滑块名称，默认“最大值” */
  readonly sliderMax: string;
  /** 角标计数给读屏的说明：`(5)` → “5 条新消息” */
  readonly indicatorCount: (count: number) => string;
  /** 角标小圆点给读屏的说明，默认“有新消息” */
  readonly indicatorDot: string;
  /** 头像组折叠的人数：`(3)` → “还有 3 人” */
  readonly avatarMore: (count: number) => string;
  /** 数字输入框“减少”按钮的名称，默认“减少” */
  readonly numberDecrement: string;
  /** 数字输入框“增加”按钮的名称，默认“增加” */
  readonly numberIncrement: string;
  /** 组合框下拉箭头（显示全部选项）的名称，默认“显示选项” */
  readonly comboboxToggle: string;
  /** 表格表头“全选”勾选框的名称，默认“全选” */
  readonly tableSelectAll: string;
  /** DataTable：单选时勾选列的标题（只给读屏），默认“选择” */
  readonly tableSelectColumn: string;
  /** 表格每行勾选框的名称，默认“选择第 n 行” */
  readonly tableSelectRow: (row: number) => string;
  /** 表格列宽调整手柄的名称，默认“调整“列名”的列宽” */
  readonly tableResizeColumn: (column: string) => string;
  /** 表格没有数据时的提示，默认“暂无数据” */
  readonly tableEmpty: string;
  /** 表格合计行第一列的文字，默认“合计” */
  readonly tableSummary: string;
  /** 批量操作栏里已选的行数：`(3)` → “已选 3 项” */
  readonly tableSelectedCount: (count: number) => string;
  /** 选项列表：输入搜索词后给读屏播报的结果条数，默认“{count} 个选项” */
  readonly listResultCount: (count: number) => string;
  /** 远程选项（Select、Combobox、TreeSelect 的 load）加载失败时列表里的提示，默认“加载失败，请重试” */
  readonly listLoadFailed: string;
  /** 批量操作栏里取消全部选择的按钮，默认“取消选择” */
  readonly tableClearSelection: string;
  /** 详情列的列标题（只给读屏），默认“详情” */
  readonly tableDetails: string;
  /** 展开详情的按钮的名称（展开与否由 aria-expanded 表示），默认“行名 的详情” */
  readonly tableRowDetails: (row: string) => string;
  /** 表头筛选按钮的名称：`('状态', true)` → “筛选“状态”（已筛选）” */
  readonly tableFilterColumn: (column: string, active: boolean) => string;
  /** 表头筛选里的搜索框、关键字输入框的名称，默认“搜索” */
  readonly tableFilterSearch: string;
  /** 表头筛选里清空这一列筛选的按钮，默认“清除筛选” */
  readonly tableFilterClear: string;
  /** 列菜单按钮的名称：`('金额')` → ““金额”列的操作” */
  readonly tableColumnMenu: (column: string) => string;
  /** 列菜单：升序，默认“升序” */
  readonly tableSortAscending: string;
  /** 列菜单：降序，默认“降序” */
  readonly tableSortDescending: string;
  /** 列菜单：取消这一列的排序，默认“取消排序” */
  readonly tableSortClear: string;
  /** 多列排序时列标题上的次序（只给读屏）：`(2, '升序')` → “第 2 排序，升序” */
  readonly tableSortPriority: (priority: number, direction: string) => string;
  /** 列菜单：固定在开头，默认“固定在开头” */
  readonly tablePinStart: string;
  /** 列菜单：固定在结尾，默认“固定在结尾” */
  readonly tablePinEnd: string;
  /** 列菜单：取消固定，默认“取消固定” */
  readonly tableUnpin: string;
  /** 列菜单：往前移一列，默认“向前移” */
  readonly tableMoveBackward: string;
  /** 列菜单：往后移一列，默认“向后移” */
  readonly tableMoveForward: string;
  /** 列菜单：隐藏这一列，默认“隐藏这一列” */
  readonly tableHideColumn: string;
  /** 图表没有数据时的提示，默认“暂无数据” */
  readonly chartEmpty: string;
  /** 图表的数据表（给读屏）里类目那一列的表头，默认“类目” */
  readonly chartCategory: string;
  /** 环形图数据表的“数值”一列，默认“数值” */
  readonly chartValue: string;
  /** 环形图数据表与提示框的“占比”，默认“占比” */
  readonly chartShare: string;
  /** 环形图中间总数下面的说明，默认“合计” */
  readonly chartTotal: string;
  /** 桑基图、弦图数据表里“流向”一列，默认“流向” */
  readonly chartFlow: string;
  /** 一条流向的写法：`('官网', '注册')` → “官网 → 注册” */
  readonly chartFlowLabel: (source: string, target: string) => string;
  /** 瀑布图里往上走的一步，默认“增加” */
  readonly chartIncrease: string;
  /** 瀑布图里往下走的一步，默认“减少” */
  readonly chartDecrease: string;
  /** 瀑布图数据表与提示框的“变动”，默认“变动” */
  readonly chartChange: string;
  /** 瀑布图数据表与提示框的“累计”，默认“累计” */
  readonly chartCumulative: string;
  /** 漏斗图：比上一环节的转化率，默认“环节转化” */
  readonly chartStepRate: string;
  /** 漏斗图：比第一环节的转化率，默认“总转化” */
  readonly chartOverallRate: string;
  /** 漏斗图数据表里“环节”一列，默认“环节” */
  readonly chartStage: string;
  /** 网络图数据表里“连接”一列，默认“连接” */
  readonly chartLink: string;
  /** 网络图提示框：一个节点连着几个节点，默认“连接 n 个” */
  readonly chartDegree: (count: number) => string;
  /** 树形表格展开按钮的名称（展开与否由 aria-expanded 表示），默认“行名 的子项” */
  readonly treeToggle: (row: string) => string;
  /** 分栏的分隔条的名称，默认“调整分栏” */
  readonly splitterResize: string;
  /** 分栏收起一侧的按钮，默认“收起” */
  readonly splitterCollapse: string;
  /** 分栏展开一侧的按钮，默认“展开” */
  readonly splitterExpand: string;
  /** 选择文件区域的提示，默认“点击或拖放文件到这里” */
  readonly fileDrop: string;
  /** 文件超过大小上限时的错误，默认“文件不能超过 上限” */
  readonly fileTooLarge: (max: string) => string;
  /** 文件类型不在 accept 里时的错误，默认“不支持这种文件类型” */
  readonly fileTypeRejected: string;
  /** 上传失败时的提示，默认“上传失败” */
  readonly uploadFailed: string;
  /** 上传完成时的提示，默认“已上传” */
  readonly uploadDone: string;
  /** 重新上传按钮的名称，默认“重新上传 文件名” */
  readonly uploadRetry: (file: string) => string;
  /** 移除文件按钮的名称，默认“移除 文件名” */
  readonly uploadRemove: (file: string) => string;
  /** 拖动排序把手的名称，默认“移动 项名” */
  readonly sortableHandle: (item: string) => string;
  /** 拖动排序把手的操作说明（aria-describedby），默认“按空格拿起，用方向键移动，再按空格放下，Esc 取消” */
  readonly sortableInstructions: string;
  /** 拿起时的播报，默认“已拿起 项名，在第 n 位，共 m 项” */
  readonly sortableGrabbed: (item: string, position: number, total: number) => string;
  /** 移动后的播报，默认“项名 移到第 n 位，共 m 项” */
  readonly sortableMoved: (item: string, position: number, total: number) => string;
  /** 放下时的播报，默认“已放下 项名，在第 n 位，共 m 项” */
  readonly sortableDropped: (item: string, position: number, total: number) => string;
  /** 取消时的播报，默认“已取消，项名 回到第 n 位” */
  readonly sortableCancelled: (item: string, position: number) => string;
  /** 分组拖动排序把手的操作说明，默认“按空格拿起，上下方向键在组内移动、左右方向键换组，再按空格放下，Esc 取消” */
  readonly sortableGroupInstructions: string;
  /** 分组时拿起的播报，默认“已拿起 项名，在 组名 第 n 位” */
  readonly sortableGroupGrabbed: (item: string, group: string, position: number) => string;
  /** 分组时落点变了的播报；不能放时带上原因 */
  readonly sortableOver: (
    item: string,
    group: string,
    position: number,
    reason: string | null,
  ) => string;
  /** 分组时放下的播报，默认“已把 项名 放到 组名 第 n 位” */
  readonly sortableGroupDropped: (item: string, group: string, position: number) => string;
  /** 分组时取消的播报，默认“已取消，项名 回到 组名 第 n 位” */
  readonly sortableGroupCancelled: (item: string, group: string, position: number) => string;
  /** 放到不能放的组、弹回时的播报 */
  readonly sortableRejected: (item: string, reason: string) => string;
  /** 结果页的常见状态（403、404、500）的默认标题与说明 */
  readonly resultStatus: Readonly<
    Record<'403' | '404' | '500', { readonly title: string; readonly description: string }>
  >;
  /** 评分的一档（单选项的名称），默认“3 星”“3.5 星” */
  readonly ratingStar: (value: number) => string;
  /** 只读评分的读法，默认“4.5 星，满分 5 星”；没有评分时 value 为 null，默认“未评分” */
  readonly ratingSummary: (value: number | null, count: number) => string;
  /** 回到顶部按钮的名称，默认“回到顶部” */
  readonly backToTop: string;
  /** 截断文字的展开按钮，默认“展开” */
  readonly ellipsisExpand: string;
  /** 截断文字的收起按钮，默认“收起” */
  readonly ellipsisCollapse: string;
  /** 进度的目标值（读屏念在进度后面），默认“目标 80%” */
  readonly progressTarget: (value: string) => string;
  /** 引导的“上一步”按钮，默认“上一步” */
  readonly tourPrevious: string;
  /** 引导的“下一步”按钮，默认“下一步” */
  readonly tourNext: string;
  /** 引导最后一步的按钮，默认“完成” */
  readonly tourFinish: string;
  /** 跳过引导的按钮，默认“跳过” */
  readonly tourSkip: string;
  /** 引导的步数，默认“n / m” */
  readonly tourProgress: (current: number, total: number) => string;
  /** 下拉框没有选项时的提示，默认“没有选项” */
  readonly selectEmpty: string;
  /** 下拉框未选择时的占位文字，默认“请选择” */
  readonly selectPlaceholder: string;
  /** 下拉框里搜索框的占位文字与名称，默认“搜索” */
  readonly selectSearch: string;
  /** 下拉框搜索没有结果时的提示，默认“没有匹配的选项” */
  readonly selectNoMatch: string;
  /** 下拉框可新建时的那一项：`('报废件')` → “新建“报废件”” */
  readonly selectCreate: (text: string) => string;
  /** 多选的已选内容，读屏念给用户：`(['A', 'B'])` → “A、B” */
  readonly selectSummary: (labels: readonly string[]) => string;
  /** 多选折起的标签数：`(3)` → “+3” */
  readonly selectMoreTags: (count: number) => string;
  /** 分页的总条数，默认“共 1,286 条”（按语言加千分位） */
  readonly paginationTotal: (total: number) => string;
  /** 分页栏的当前范围：`(21, 40, 1286)` → “第 21–40 条，共 1,286 条” */
  readonly paginationRange: (from: number, to: number, total: number) => string;
  /** 分页导航的无障碍名称，默认“分页” */
  readonly pagination: string;
  /** 每页条数选择里的一项：`(20)` → “20 条/页” */
  readonly pageSizeOption: (size: number) => string;
  /** 每页条数选择的名称，默认“每页条数” */
  readonly pageSizeLabel: string;
  /** 跳页输入框前的文字，默认“跳至” */
  readonly pageJumpBefore: string;
  /** 跳页输入框后的文字，默认“页” */
  readonly pageJumpAfter: string;
  /** 跳页输入框的名称，默认“跳到第几页” */
  readonly pageJumpLabel: string;
  /** 右键菜单（ContextMenu）的默认名称，默认“更多操作” */
  readonly contextMenuLabel: string;
  /** 上一页按钮的名称，默认“上一页” */
  readonly previousPage: string;
  /** 下一页按钮的名称，默认“下一页” */
  readonly nextPage: string;
  /** 页码按钮的名称，默认“第 n 页” */
  readonly pageLabel: (page: number) => string;
  /** 树没有节点时的提示，默认“暂无数据” */
  readonly treeEmpty: string;
  /** 标签页的关闭按钮：`('订单')` → “关闭 订单” */
  readonly tabClose: (label: string) => string;
  /** 新建标签页的按钮，默认“新建标签页” */
  readonly tabAdd: string;
  /** 列出全部标签页的菜单按钮，默认“全部标签页” */
  readonly tabList: string;
  /** 标签栏往前滚的按钮，默认“往前滚” */
  readonly tabScrollPrevious: string;
  /** 标签栏往后滚的按钮，默认“往后滚” */
  readonly tabScrollNext: string;
  /** 移动了一个标签页（读屏播报）：`('订单', 2, 5)` → “订单移到第 2 个，共 5 个” */
  readonly tabMoved: (label: string, position: number, total: number) => string;
  /** 横向导航里收起来的项的菜单按钮，默认“更多” */
  readonly navBarMore: string;
  /** 树搜索没有匹配时的提示，默认“没有匹配的节点” */
  readonly treeNoMatch: string;
  /** 树里移动了一个节点（读屏播报）：`('测算组', '成本管理部', 2)` → “测算组移到成本管理部下第 2 位”；放到第一层时 parent 为 undefined */
  readonly treeMoved: (item: string, parent: string | undefined, position: number) => string;
  /** 穿梭框左边的默认标题，默认“可选” */
  readonly transferSource: string;
  /** 穿梭框右边的默认标题，默认“已选” */
  readonly transferTarget: string;
  /** 移到另一边的按钮名称：`('已选')` → “移到已选” */
  readonly transferMoveTo: (title: string) => string;
  /** 一边的全选框名称：`('可选')` → “全选可选” */
  readonly transferSelectAll: (title: string) => string;
  /** 一边勾上了几项：`(2, 10)` → “2 / 10” */
  readonly transferCount: (checked: number, total: number) => string;
  /** 移动之后的播报：`(3, '已选')` → “已把 3 项移到已选” */
  readonly transferMoved: (count: number, title: string) => string;
  /** 面包屑导航的无障碍名称，默认“面包屑” */
  readonly breadcrumbs: string;
  /** 面包屑折叠按钮（打开被折叠各级的菜单）的名称，默认“显示被折叠的路径” */
  readonly breadcrumbsExpand: string;
  /** 步骤的状态给读屏的文字，接在标题后面：`('complete')` → “（已完成）”；当前步骤由 aria-current 念出，不用它 */
  readonly stepState: (state: 'complete' | 'upcoming' | 'error') => string;

  // ───────── 日期组件 ─────────

  /** 日历“上个月”按钮，默认“上个月” */
  readonly calendarPreviousMonth: string;
  /** 日历“下个月”按钮，默认“下个月” */
  readonly calendarNextMonth: string;
  /** 月份视图“上一年”按钮，默认“上一年” */
  readonly calendarPreviousYear: string;
  /** 月份视图“下一年”按钮，默认“下一年” */
  readonly calendarNextYear: string;
  /** 季度面板的标题：`(2026)` → “2026年” */
  readonly calendarYear: (year: number) => string;
  /** 季度面板里一格的文字：`(4)` → “四季度” / “Q4” */
  readonly calendarQuarter: (quarter: number) => string;
  /** 整页月历里一天有几项日程（读屏念在日期后面）：`(3)` → “3 项日程” */
  readonly calendarBoardCount: (count: number) => string;
  /** 整页月历里收起的日程：`(2)` → “还有 2 项” */
  readonly calendarBoardMore: (count: number) => string;
  /** 年份视图“上一个十年”按钮，默认“上一个十年” */
  readonly calendarPreviousDecade: string;
  /** 年份视图“下一个十年”按钮，默认“下一个十年” */
  readonly calendarNextDecade: string;
  /** 标题按钮（切到月份视图）的名称：`('2026年10月')` → “选择月份：2026年10月” */
  readonly calendarChooseMonth: (current: string) => string;
  /** 标题按钮（切到年份视图）的名称：`('2026年')` → “选择年份：2026年” */
  readonly calendarChooseYear: (current: string) => string;
  /** 周数一列的表头，默认“周” */
  readonly calendarWeek: string;
  /** 周数给读屏的说明：`(43)` → “第 43 周” */
  readonly calendarWeekNumber: (week: number) => string;
  /** 今天那一格的读屏名称：`('2026年10月20日星期二')` → “今天，2026年10月20日星期二” */
  readonly calendarToday: (date: string) => string;
  /** 区间选了开始、等着选结束时给读屏的提示，默认“请选择结束日期” */
  readonly calendarPickEnd: string;
  /** 日期选择器打开日历的按钮，默认“选择日期” */
  readonly datePickerOpen: string;
  /** 时间选择器打开列表的按钮，默认“选择时间” */
  readonly timePickerOpen: string;
  /** 区间开始那组分段的名称，默认“开始日期” */
  readonly dateRangeStart: string;
  /** 区间结束那组分段的名称，默认“结束日期” */
  readonly dateRangeEnd: string;
  /** 快捷选项那一组的名称，默认“快捷选项” */
  readonly dateRangePresets: string;
  /** 日期选择器旁边快捷选项那一组的名称，默认“快捷选项” */
  readonly datePickerPresets: string;
  /** 选季度时日历下方“今天”按钮的文字，默认“本季度” */
  readonly datePickerThisQuarter: string;
  /** 快捷区间的名字 */
  readonly dateRangePreset: Readonly<Record<DateRangePreset, string>>;
  /** 选“现在”的按钮（时间、日期时间选择器），默认“此刻” */
  readonly timePickerNow: string;
  /** 还没填的段给读屏的取值，默认“未填写” */
  readonly dateFieldEmpty: string;
  /** 分段的占位文字 */
  readonly dateFieldPlaceholders: Readonly<Partial<Record<DateSegmentType, string>>>;
  /** 季度、周输入框的排法：`{year}`、`{quarter}`、`{week}` 是各段，其余是照原样显示的文字 */
  readonly dateFieldPeriodPatterns: Readonly<{ quarter: string; week: string }>;

  // ───────── 3D ─────────

  /** 模型查看器加载中给读屏的提示，默认“正在加载模型” */
  readonly modelViewerLoading: string;
  /** 模型加载失败时显示，默认“模型加载失败” */
  readonly modelViewerError: string;

  // ───────── 内容页与应用外壳：代码块、标题锚点、目录、导航、搜索、主题切换、取色、翻页 ─────────

  /** 长代码折叠时展开的按钮，默认“展开全部” */
  readonly codeExpand: string;
  /** 展开后收起长代码的按钮，默认“收起” */
  readonly codeCollapse: string;
  /** 标题旁的锚点链接名称，默认“链接到本节” */
  readonly headingAnchor: string;
  /** 跳到正文的链接，默认“跳到正文” */
  readonly skipToContent: string;
  /** 页内目录的名称，默认“本页目录” */
  readonly tableOfContents: string;
  /** 抽屉宽度调整手柄的名称，默认“调整抽屉宽度” */
  readonly drawerResize: string;
  /** 搜索面板与搜索按钮的名称，默认“搜索” */
  readonly searchLabel: string;
  /** 搜索框的占位文字，默认“搜索文档” */
  readonly searchPlaceholder: string;
  /** 搜索没有结果，默认“没有找到相关内容” */
  readonly searchEmpty: string;
  /** 主题：亮色，默认“亮色” */
  readonly themeLight: string;
  /** 主题偏好：跟随系统（createThemePreference 的 'system'），默认“跟随系统” */
  readonly themeSystem: string;
  /** 主题：暗色，默认“暗色” */
  readonly themeDark: string;
  /** 主题：纸张，默认“纸张” */
  readonly themePaper: string;
  /** 主题：午夜，默认“午夜” */
  readonly themeMidnight: string;
  /** 主题：高对比，默认“高对比” */
  readonly themeHighContrast: string;
  /** 主题：海洋，默认“海洋” */
  readonly themeOcean: string;
  /** 主题：森林，默认“森林” */
  readonly themeForest: string;
  /** 主题：柠檬，默认“柠檬” */
  readonly themeLemon: string;
  /** 主题：樱花，默认“樱花” */
  readonly themeSakura: string;
  /** 主题：喜庆，默认“喜庆” */
  readonly themeFestive: string;
  /** 主题：赛博朋克，默认“赛博朋克” */
  readonly themeCyberpunk: string;
  /** 主题：咖啡，默认“咖啡” */
  readonly themeCoffee: string;
  /** ColorField 色块（原生取色器）的名称，默认“选择颜色” */
  readonly colorPick: string;
  /** 翻页导航（上一篇、下一篇）的名称，默认“翻页” */
  readonly pagerLabel: string;
  /** 上一篇（翻页导航），默认“上一篇” */
  readonly pagerPrevious: string;
  /** 下一篇（翻页导航），默认“下一篇” */
  readonly pagerNext: string;

  // ───────── 页面级组件自带的文案 ─────────

  /**
   * 改写或补上页面级组件的文案，按组件只写要改的字段：
   * `{ messages: { docsKit: { name: '名前' } } }`。没写的取组件自带的表（同语种、再英文，见 messages.ts）
   */
  readonly messages?: { readonly [K in keyof LangMessages]?: Partial<LangMessages[K]> };
}

/** 自带文案的页面级组件：名字 → 它的文案 */
export interface LangMessages {
  /** 主题编辑器 ThemeCustomizer */
  readonly themeCustomizer: ThemeCustomizerMessages;
  /** 文档站组件 CodePreview、PropsTable（@vue-tsx-pro/ui/docs-kit） */
  readonly docsKit: DocsKitMessages;
  /** 流程组件 FlowDiagram、WorkflowTimeline、ApprovalActions */
  readonly workflow: WorkflowMessages;
  /** 页面组合（@vue-tsx-pro/ui/patterns）：AppShell、FilterBar、NotificationCenter、KanbanBoard… */
  readonly patterns: PatternsMessages;
}

/** 基于已有语言局部修改：`defineLang(zhCN, { selectEmpty: '暂无数据', timeZone: 'Asia/Tokyo' })` */
export function defineLang(base: Lang, overrides: Partial<Lang>): Lang {
  if (!base.messages || !overrides.messages) return { ...base, ...overrides };
  // 页面级组件的文案按组件合并：两边各改了同一个组件的不同字段时都保留
  const messages: Record<string, object | undefined> = { ...base.messages };
  for (const [name, fields] of Object.entries(overrides.messages)) {
    messages[name] = { ...messages[name], ...fields };
  }
  return { ...base, ...overrides, messages };
}
