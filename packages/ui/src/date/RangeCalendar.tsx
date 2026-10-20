/**
 * 区间日历：先点开始、再点结束，中间悬停时预览；酒店的入住与离店、报表的起止日期。参考 React Aria RangeCalendar。
 *
 *   <RangeCalendar value={_bind(stay)} visibleMonths={2} min={today} isDateUnavailable={booked} />
 *
 * 值是 `{ start, end }`（两端都含；ISO 字符串或 DateValue，写回时保持同一种类型）；反着点也会排好序。
 * 默认区间里不能夹着不可选的日期（订满的那天）：选了开始之后，越过不可选日期的那一侧都不能再选；
 * 允许时写 allowsUnavailableInRange。选到一半按 Esc 取消。键盘与部件同 Calendar（部件见 CalendarView）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import type { DateRange } from '../utils/data/date';
import { useCalendarState } from './calendar-state';
import { CalendarView, type CalendarViewProps } from './CalendarView';
import {
  toDateLimits,
  useDateLocale,
  writeDateLike,
  type DateInput,
  type DateLimitProps,
  type DateValueTypes,
} from './date-locale';

/** 未声明的属性落到根元素上 */
export interface RangeCalendarProps<V extends DateInput = string>
  extends Omit<CalendarViewProps, 'calendar'>, DateLimitProps {
  /** 选中的区间（两端都含）：父级写 value={_bind(x)}；没有时 null */
  value?: DateRange<V> | null;
  /** 并排显示几个月，默认 1；酒店、机票常用 2 */
  visibleMonths?: number;
  /** 区间里允许夹着不可选的日期，默认 false */
  allowsUnavailableInRange?: boolean;
  /** 没有已选区间时一开始显示哪天所在的月，默认今天 */
  defaultFocused?: DateInput;
  /** 值为空、推不出类型时写回哪一种，默认 iso（字符串） */
  valueType?: keyof DateValueTypes;
  /** 只读：能翻页、移动焦点，不能改选择 */
  readonly?: boolean;
  /** 选完了一个区间（点了结束）：日期选择器据此关闭弹层 */
  onPick?: (range: DateRange<V>) => void;
}

/** 区间日历：选开始与结束 */
export const RangeCalendar = _component(
  <V extends DateInput>({
    value = _bindable<DateRange<V> | null>(null),
    min,
    max,
    isDateUnavailable,
    visibleMonths = 1,
    allowsUnavailableInRange = false,
    defaultFocused,
    valueType,
    firstDayOfWeek,
    readonly = false,
    disabled = false,
    onPick,
    ...rest
  }: RangeCalendarProps<V>) => {
    const locale = useDateLocale(() => ({ firstDayOfWeek }));
    const selected = _derived.by(() => {
      const start = locale.fromValue(value?.start);
      const end = locale.fromValue(value?.end);
      return start && end ? [start, end] : [];
    });
    // 值清空后再选：仍按清空前的类型写回
    let lastLike: V | undefined;
    const limits = _derived(toDateLimits(locale, { min, max, isDateUnavailable }));
    const calendar = useCalendarState({
      mode: () => 'range',
      selected: () => selected,
      onChange: ([start, end]) => {
        lastLike = value?.start ?? lastLike;
        const write = (date: typeof start) => writeDateLike(date!, lastLike, valueType) as V;
        const range = { start: write(start), end: write(end) };
        value = range;
        onPick?.(range);
      },
      today: () => locale.today(),
      limits: () => limits,
      week: () => locale.week,
      visibleMonths: () => visibleMonths,
      allowsUnavailableInRange: () => allowsUnavailableInRange,
      readonly: () => readonly || disabled,
      defaultFocused: () => locale.fromValue(defaultFocused),
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
