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

  // ───────── 组件文案 ─────────

  /** 外链（target=_blank）给读屏的提示，默认“（在新窗口打开）” */
  readonly linkNewWindow: string;
  /** 下拉框没有选项时的提示，默认“没有选项” */
  readonly selectEmpty: string;
  /** 下拉框未选择时的占位文字，默认“请选择” */
  readonly selectPlaceholder: string;
  /** 分页的总条数，默认“共 n 条” */
  readonly paginationTotal: (total: number) => string;
  /** 表单必填校验的提示，默认“请填写{label}” */
  readonly formRequired: (label: string) => string;
}

/** 基于已有语言局部修改：`defineLang(zhCN, { selectEmpty: '暂无数据', timeZone: 'Asia/Tokyo' })` */
export function defineLang(base: Lang, overrides: Partial<Lang>): Lang {
  return { ...base, ...overrides };
}
