/**
 * 日历（WAI-ARIA 的日期网格）：选一天或多天，可以并排几个月、显示周数、自定义日期格、切到月份与年份视图。
 * 参考 React Aria Calendar、Mantine DatePicker（inline）。
 *
 *   <Calendar value={_bind(date)} min="2026-01-01" aria-label="出发日期" />
 *   <Calendar selectionMode="multiple" value={_bind(days)} visibleMonths={2} />
 *   <Calendar value={_bind(day)}>{(date, cell) => <><span>{…}</span><small>¥399</small></>}</Calendar>
 *
 * 值是 ISO 日期字符串（'2026-10-20'），与原生 input type="date"、URL 参数、zod 的 z.iso.date() 一致；
 * 月份名、星期名、读屏念的完整日期都由 Intl 按当前语言生成，一周从哪天开始按语言（可用 firstDayOfWeek 覆盖）。
 * 选一个区间用 RangeCalendar；选月份、年份用 granularity="month" / "year"（MonthPicker、YearPicker 就是这样做的）。
 *
 * 键盘：←→ 一天、↑↓ 一周，Page Up / Down 一个月、加 Shift 一年，Home / End 到这周两端，Enter / 空格选中。
 * 部件见 CalendarView。
 */
import { _component } from '@vue-tsx-pro/tsx';
import type { CalendarDate } from '@internationalized/date';
import type { DateUnit } from '../utils/data/date';
import { selectedValues } from '../utils/data/selection';
import { useCalendarState } from './calendar-state';
import { CalendarView, type CalendarViewProps } from './CalendarView';
import { toDateLimits, useDateLocale, type DateLimitProps } from './date-locale';

/** Calendar 共有的属性；未声明的属性落到根元素上 */
interface CalendarBaseProps extends Omit<CalendarViewProps, 'calendar'>, DateLimitProps {
  /** 并排显示几个月，默认 1 */
  visibleMonths?: number;
  /** 选择的粒度：day（默认）、month（选月份）、year（选年份） */
  granularity?: DateUnit;
  /** 没有已选日期时一开始显示哪天所在的月（ISO），默认今天 */
  defaultFocused?: string;
  /** 只读：能翻页、移动焦点，不能改选择 */
  readonly?: boolean;
  /** 点选了一天（再点已选的那天也会调用）：日期选择器据此关闭弹层 */
  onPick?: (date: string) => void;
}

/** 单选：value 是一个 ISO 日期 */
export interface SingleCalendarProps {
  /** 选择方式，默认 single */
  selectionMode?: 'single';
  /** 选中的日期（ISO）：父级写 value={_bind(x)}；没有时 null */
  value?: string | null;
}

/** 多选：value 是 ISO 日期的数组 */
export interface MultipleCalendarProps {
  /** 选择方式 */
  selectionMode: 'multiple';
  /** 选中的日期（ISO）：父级写 value={_bind(list)} */
  value?: string[];
}

/** 单选或多选一天（多天） */
export type CalendarProps = CalendarBaseProps & (SingleCalendarProps | MultipleCalendarProps);

/** 日历：选一天或多天 */
export const Calendar = _component(
  ({
    selectionMode = 'single',
    value = _bindable<string | string[] | null | undefined>(undefined),
    min,
    max,
    isDateUnavailable,
    visibleMonths = 1,
    granularity = 'day',
    defaultFocused,
    firstDayOfWeek,
    readonly = false,
    disabled = false,
    onPick,
    ...rest
  }: CalendarProps) => {
    const locale = useDateLocale(() => ({ firstDayOfWeek }));
    const selected = _derived(
      selectedValues(value ?? undefined)
        .map((date) => locale.fromIso(date))
        .filter((date): date is CalendarDate => date != null),
    );
    const limits = _derived(toDateLimits(locale, { min, max, isDateUnavailable }));
    const calendar = useCalendarState({
      mode: () => selectionMode,
      selected: () => selected,
      onChange: (dates) => {
        const picked = dates.map((date) => locale.toIso(date));
        value = selectionMode === 'multiple' ? picked : (picked[0] ?? null);
        if (selectionMode === 'single' && picked[0]) onPick?.(picked[0]);
      },
      today: () => locale.today(),
      limits: () => limits,
      week: () => locale.week,
      unit: () => granularity,
      visibleMonths: () => visibleMonths,
      readonly: () => readonly || disabled,
      defaultFocused: () => locale.fromIso(defaultFocused),
    });
    return () => (
      <CalendarView
        {...rest}
        calendar={calendar}
        firstDayOfWeek={firstDayOfWeek}
        disabled={disabled}
        data-invalid={calendar.invalid || undefined}
      />
    );
  },
);
