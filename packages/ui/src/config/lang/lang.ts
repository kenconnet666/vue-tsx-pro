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
  /** 下拉框没有选项时的提示，默认“没有选项” */
  readonly selectEmpty: string;
  /** 下拉框未选择时的占位文字，默认“请选择” */
  readonly selectPlaceholder: string;
  /** 分页的总条数，默认“共 n 条” */
  readonly paginationTotal: (total: number) => string;
  /** 分页导航的无障碍名称，默认“分页” */
  readonly pagination: string;
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
}

/** 基于已有语言局部修改：`defineLang(zhCN, { selectEmpty: '暂无数据', timeZone: 'Asia/Tokyo' })` */
export function defineLang(base: Lang, overrides: Partial<Lang>): Lang {
  return { ...base, ...overrides };
}
