/**
 * 日历（WAI-ARIA 的日期网格）：选一天或多天，可以并排几个月、显示周数、自定义日期格、切到月份与年份视图。
 * 参考 React Aria Calendar、Mantine DatePicker（inline）。
 *
 *   <Calendar _value={_bind(date)} min="2026-01-01" aria-label="出发日期" />
 *   <Calendar selectionMode="multiple" _value={_bind(days)} visibleMonths={2} />
 *   <Calendar _value={_bind(day)}>{(date, cell) => <><span>{…}</span><small>¥399</small></>}</Calendar>
 *
 * 值是 ISO 日期字符串（'2026-10-20'，与原生 input type="date"、URL 参数、zod 的 z.iso.date() 一致），
 * 也可以是 @internationalized/date 的 DateValue；写回时保持传入的类型（CalendarDateTime 选了另一天，时间不变）。
 * 月份名、星期名、读屏念的完整日期都由 Intl 按当前语言生成，一周从哪天开始按语言（可用 firstDayOfWeek 覆盖）。
 * 选一个区间用 RangeCalendar；选月份、年份用 granularity="month" / "year"（DatePicker 的同名 granularity 就是这样做的）。
 *
 * 键盘：←→ 一天、↑↓ 一周，Page Up / Down 一个月、加 Shift 一年，Home / End 到这周两端，Enter / 空格选中。
 * 部件见 CalendarView。
 */
import { _component } from '@vue-tsx-pro/tsx';
import type { CalendarDate } from '@internationalized/date';
import { isSameDate, type DateUnit } from '../utils/data/date';
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

/** Calendar 共有的属性；未声明的属性落到根元素上 */
export interface CalendarBaseProps<V extends DateInput>
  extends Omit<CalendarViewProps, 'calendar'>, DateLimitProps {
  /** 并排显示几个月，默认 1 */
  visibleMonths?: number;
  /** 选择的粒度：day（默认）、month（选月份）、year（选年份） */
  granularity?: DateUnit;
  /** 没有已选日期时一开始显示哪天所在的月，默认今天 */
  defaultFocused?: DateInput;
  /** 值为空、推不出类型时写回哪一种，默认 iso（字符串）；绑定的是 CalendarDate 且一开始为空时写 dateValue */
  valueType?: keyof DateValueTypes;
  /** 只读：能翻页、移动焦点，不能改选择 */
  readonly?: boolean;
  /** 点选了一天（再点已选的那天也会调用）：日期选择器据此关闭弹层 */
  onPick?: (date: V) => void;
}

/** 单选：value 是一个日期 */
export interface SingleCalendarProps<V extends DateInput> {
  /** 选择方式，默认 single */
  selectionMode?: 'single';
  /** 选中的日期（ISO 字符串或 DateValue，写回时保持同一种类型）：父级写 _value={_bind(x)}；没有时 null */
  _value?: V | null;
}

/** 多选：value 是日期的数组 */
export interface MultipleCalendarProps<V extends DateInput> {
  /** 选择方式 */
  selectionMode: 'multiple';
  /** 选中的日期（ISO 字符串或 DateValue）：父级写 _value={_bind(list)} */
  _value?: V[];
}

/** 单选或多选一天（多天） */
export type CalendarProps<V extends DateInput = string> = CalendarBaseProps<V> &
  (SingleCalendarProps<V> | MultipleCalendarProps<V>);

/** 日历：选一天或多天 */
export const Calendar = _component(
  <V extends DateInput>({
    selectionMode = 'single',
    _value: value = _bindable<V | V[] | null | undefined>(undefined),
    min,
    max,
    isDateUnavailable,
    visibleMonths = 1,
    granularity = 'day',
    defaultFocused,
    valueType,
    firstDayOfWeek,
    readonly = false,
    disabled = false,
    onPick,
    ...rest
  }: CalendarProps<V>) => {
    const locale = useDateLocale(() => ({ firstDayOfWeek }));
    const values = (): readonly V[] =>
      value == null ? [] : Array.isArray(value) ? value : [value];
    const selected = _derived(
      values()
        .map((item) => locale.fromValue(item))
        .filter((date): date is CalendarDate => date != null),
    );
    // 值清空后再选：仍按清空前的类型写回
    let lastLike: V | undefined;
    const limits = _derived(toDateLimits(locale, { min, max, isDateUnavailable }));
    const calendar = useCalendarState({
      mode: () => selectionMode,
      selected: () => selected,
      onChange: (dates) => {
        const current = values();
        lastLike = current[0] ?? lastLike;
        // 多选时没变的那几天原样保留（DateValue 的时间、时区不丢）
        const picked = dates.map(
          (date) =>
            current.find((item) => isSameDate(locale.fromValue(item), date, granularity)) ??
            (writeDateLike(date, lastLike, valueType) as V),
        );
        value = selectionMode === 'multiple' ? picked : (picked[0] ?? null);
        if (selectionMode === 'single' && picked[0] != null) onPick?.(picked[0]);
      },
      today: () => locale.today(),
      limits: () => limits,
      week: () => locale.week,
      unit: () => granularity,
      visibleMonths: () => visibleMonths,
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
