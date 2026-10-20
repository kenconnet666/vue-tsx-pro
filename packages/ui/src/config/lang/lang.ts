/**
 * 语言：地区、时间与组件文案平铺在一个对象里，组件里用 useLang() 读取：
 *   lang.timeZone、lang.confirm、lang.paginationTotal(42)
 *
 * 命名：通用文案不加前缀；组件文案用组件名作前缀（selectEmpty），键入 lang.select 即可筛出。
 * 需要插值的文案写成函数。
 */
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
  /** 日历系统，如 `'gregory'`（公历）、`'chinese'`（农历） */
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
  /** 表格每行勾选框的名称，默认“选择第 n 行” */
  readonly tableSelectRow: (row: number) => string;
  /** 表格列宽调整手柄的名称，默认“调整“列名”的列宽” */
  readonly tableResizeColumn: (column: string) => string;
  /** 表格没有数据时的提示，默认“暂无数据” */
  readonly tableEmpty: string;
  /** 树形表格展开按钮的名称（展开与否由 aria-expanded 表示），默认“行名 的子项” */
  readonly treeToggle: (row: string) => string;
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
  /** 分页的总条数，默认“共 n 条” */
  readonly paginationTotal: (total: number) => string;
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
  /** 面包屑导航的无障碍名称，默认“面包屑” */
  readonly breadcrumbs: string;
  /** 面包屑折叠按钮（打开被折叠各级的菜单）的名称，默认“显示被折叠的路径” */
  readonly breadcrumbsExpand: string;
  /** 表单必填校验的提示，默认“请填写{label}” */
  readonly formRequired: (label: string) => string;
  /** 拖动验证的提示，同时是滑块的无障碍名称，默认“拖动滑块完成验证” */
  readonly slideVerifyHint: string;
  /** 拖动验证：等待服务端判定，默认“验证中…” */
  readonly slideVerifyChecking: string;
  /** 拖动验证：通过，默认“验证通过” */
  readonly slideVerifySuccess: string;
  /** 拖动验证：没通过，默认“验证失败，请重试” */
  readonly slideVerifyError: string;

  // ───────── 文档站一类页面的组件 ─────────

  /** 长代码折叠时展开的按钮，默认“展开全部” */
  readonly codeExpand: string;
  /** 展开后收起长代码的按钮，默认“收起” */
  readonly codeCollapse: string;
  /** 代码示例的预览区域名称，默认“预览” */
  readonly codePreview: string;
  /** 代码示例里显示源码的按钮，默认“显示代码” */
  readonly codeShow: string;
  /** 代码示例里收起源码的按钮，默认“隐藏代码” */
  readonly codeHide: string;
  /** 标题旁的锚点链接名称，默认“链接到本节” */
  readonly headingAnchor: string;
  /** 跳到正文的链接，默认“跳到正文” */
  readonly skipToContent: string;
  /** 页内目录的名称，默认“本页目录” */
  readonly tableOfContents: string;
  /** 窄屏时收着侧边导航的抽屉的标题，默认“导航” */
  readonly navigation: string;
  /** 窄屏时打开侧边导航的按钮，默认“打开导航” */
  readonly navigationOpen: string;
  /** 搜索面板与搜索按钮的名称，默认“搜索” */
  readonly searchLabel: string;
  /** 搜索框的占位文字，默认“搜索文档” */
  readonly searchPlaceholder: string;
  /** 搜索没有结果，默认“没有找到相关内容” */
  readonly searchEmpty: string;
  /** 主题切换的名称，默认“主题” */
  readonly themeLabel: string;
  /** 主题：跟随系统，默认“跟随系统” */
  readonly themeSystem: string;
  /** 主题：亮色，默认“亮色” */
  readonly themeLight: string;
  /** 主题：暗色，默认“暗色” */
  readonly themeDark: string;
  /** 主题：纸张，默认“纸张” */
  readonly themePaper: string;
  /** 翻页导航（上一篇、下一篇）的名称，默认“翻页” */
  readonly pagerLabel: string;
  /** 上一篇（翻页导航），默认“上一篇” */
  readonly pagerPrevious: string;
  /** 下一篇（翻页导航），默认“下一篇” */
  readonly pagerNext: string;
}

/** 基于已有语言局部修改：`defineLang(zhCN, { selectEmpty: '暂无数据', timeZone: 'Asia/Tokyo' })` */
export function defineLang(base: Lang, overrides: Partial<Lang>): Lang {
  return { ...base, ...overrides };
}
