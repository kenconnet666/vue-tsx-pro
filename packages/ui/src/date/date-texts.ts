/**
 * 日期组件的界面文案（上个月、今天、快捷区间的名字、分段的占位文字）。
 * 读屏念的完整日期、月份名、星期名不在这里：一律由 Intl 按当前语言生成。
 *
 * TODO(lang)：语言包（config/lang）正被另一项改动修改，暂时放在这里；那边提交后把这些键原样搬进 Lang
 * （命名已按 Lang 的规则加了组件前缀），zh-CN / en-US 各自填上，删除本文件，组件改用 useLang()。
 */
import { useLang } from '../config/context';
import type { DateSegmentType } from './date-segments';
import type { DateRangePreset } from '../utils/data/date';

/** 日期组件的文案 */
export interface DateTexts {
  /** 日历“上个月”按钮，默认“上个月” */
  readonly calendarPreviousMonth: string;
  /** 日历“下个月”按钮，默认“下个月” */
  readonly calendarNextMonth: string;
  /** 月份视图“上一年”按钮，默认“上一年” */
  readonly calendarPreviousYear: string;
  /** 月份视图“下一年”按钮，默认“下一年” */
  readonly calendarNextYear: string;
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
  /** 快捷区间的名字 */
  readonly dateRangePreset: Readonly<Record<DateRangePreset, string>>;
  /** 选“现在”的按钮（时间、日期时间选择器），默认“此刻” */
  readonly timePickerNow: string;
  /** 还没填的段给读屏的取值，默认“未填写” */
  readonly dateFieldEmpty: string;
  /** 分段的占位文字 */
  readonly dateFieldPlaceholders: Readonly<Partial<Record<DateSegmentType, string>>>;
}

const zh: DateTexts = {
  calendarPreviousMonth: '上个月',
  calendarNextMonth: '下个月',
  calendarPreviousYear: '上一年',
  calendarNextYear: '下一年',
  calendarPreviousDecade: '上一个十年',
  calendarNextDecade: '下一个十年',
  calendarChooseMonth: (current) => `选择月份：${current}`,
  calendarChooseYear: (current) => `选择年份：${current}`,
  calendarWeek: '周',
  calendarWeekNumber: (week) => `第 ${week} 周`,
  calendarToday: (date) => `今天，${date}`,
  calendarPickEnd: '请选择结束日期',
  datePickerOpen: '选择日期',
  timePickerOpen: '选择时间',
  dateRangeStart: '开始日期',
  dateRangeEnd: '结束日期',
  dateRangePresets: '快捷选项',
  dateRangePreset: {
    today: '今天',
    yesterday: '昨天',
    last7Days: '最近 7 天',
    last30Days: '最近 30 天',
    thisWeek: '本周',
    thisMonth: '本月',
    lastMonth: '上月',
    thisYear: '今年',
  },
  timePickerNow: '此刻',
  dateFieldEmpty: '未填写',
  dateFieldPlaceholders: {
    year: '年',
    month: '月',
    day: '日',
    hour: '时',
    minute: '分',
    second: '秒',
    dayPeriod: '上午',
  },
};

const en: DateTexts = {
  calendarPreviousMonth: 'Previous month',
  calendarNextMonth: 'Next month',
  calendarPreviousYear: 'Previous year',
  calendarNextYear: 'Next year',
  calendarPreviousDecade: 'Previous decade',
  calendarNextDecade: 'Next decade',
  calendarChooseMonth: (current) => `Choose month: ${current}`,
  calendarChooseYear: (current) => `Choose year: ${current}`,
  calendarWeek: 'Wk',
  calendarWeekNumber: (week) => `Week ${week}`,
  calendarToday: (date) => `Today, ${date}`,
  calendarPickEnd: 'Select an end date',
  datePickerOpen: 'Choose date',
  timePickerOpen: 'Choose time',
  dateRangeStart: 'Start date',
  dateRangeEnd: 'End date',
  dateRangePresets: 'Presets',
  dateRangePreset: {
    today: 'Today',
    yesterday: 'Yesterday',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    thisWeek: 'This week',
    thisMonth: 'This month',
    lastMonth: 'Last month',
    thisYear: 'This year',
  },
  timePickerNow: 'Now',
  dateFieldEmpty: 'Empty',
  dateFieldPlaceholders: {
    year: 'yyyy',
    month: 'mm',
    day: 'dd',
    hour: '––',
    minute: '––',
    second: '––',
    dayPeriod: 'AM',
  },
};

/** 当前语言的日期文案：在渲染函数里读取，随语言切换（中文用中文，其余用英文） */
export function useDateTexts(): () => DateTexts {
  const lang = useLang();
  return () => (lang.code.startsWith('zh') ? zh : en);
}
