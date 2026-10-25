/**
 * 日期输入框：分段输入年、月、日（不带弹层），段的顺序按语言（zh-CN 年/月/日，en-US 月/日/年）。
 * 参考 React Aria DateField、原生 input type="date"。要弹出日历用 DatePicker。
 *
 *   <Field label="生日"><DateField _value={birthday} max={today} /></Field>
 *   <DateField granularity="minute" _value={at} aria-label="开始时间" />   // '2026-10-20T14:30'
 *   <DateField granularity="month" _value={month} aria-label="账期" />     // '2026-10'
 *
 * 值是 ISO 字符串，形式随 granularity：year 'YYYY'、month 'YYYY-MM'、day 'YYYY-MM-DD'，
 * hour / minute / second 是日期加时间 'YYYY-MM-DDTHH:mm[:ss]'（同原生 datetime-local）；
 * 也可以是 DateValue，写回时保持同一种类型（ZonedDateTime 的时区、CalendarDateTime 没显示的时间不丢）。
 * 值在 min–max 之外、是不可选的日期或时刻（isTimeUnavailable）时显示出错（aria-invalid），值照样写回，由表单校验决定能不能提交。
 *
 * 键盘：数字逐段输入（满了自动跳段），↑↓ 加减，Page Up / Down 大步，Home / End 最小 / 最大，
 * Backspace 删一位（删空回到上一段），←→ 与 Tab 换段。部件见 SegmentedField。
 */
import { _component } from '@vue-tsx-pro/tsx';
import {
  toCalendar,
  toCalendarDateTime,
  type CalendarDate,
  type CalendarDateTime,
  type Time,
} from '@internationalized/date';
import {
  compareDates,
  fullIsoDay,
  lastIsoDay,
  parseIsoDate,
  parseIsoDateTime,
  parseIsoTime,
  toIsoDate,
  toIsoDateTime,
  toIsoQuarter,
  toIsoTime,
  toIsoWeek,
  type DateLimits,
  type DateUnit,
} from '../utils/data/date';
import {
  toDateLimits,
  useDateLocale,
  type DateInput,
  type DateLocale,
  type DateLimitProps,
  type DateValueTypes,
} from './date-locale';
import { segmentFields, type DateFieldGranularity } from './date-segments';
import { SegmentedField, type SegmentedFieldOptions } from './SegmentedField';

/** 未声明的属性落到这组分段上（主元素）；外壳用 propsRoot */
export interface DateFieldProps<V extends DateInput = string>
  extends SegmentedFieldOptions, DateLimitProps {
  /** 值：ISO 字符串（形式随 granularity）或 DateValue，写回时保持同一种类型；父级写 _value={x}；没填全时 null */
  _value?: V | null;
  /** 精确到哪一段，默认 day；到 hour / minute / second 时是日期加时间 */
  granularity?: DateFieldGranularity;
  /** 值为空、推不出类型时写回哪一种，默认 iso（字符串）；dateValue 写 CalendarDate（带时间时 CalendarDateTime） */
  valueType?: keyof DateValueTypes;
  /**
   * 带时间时不可选的时刻（午休、非营业时间）：键入时显示出错。参数是 'HH:mm'、同一时刻的 Time 与那一天的 ISO 日期，
   * 周末与平日可以不一样：`(_, time, date) => time.hour < 9 || time.hour >= (isWeekend(…) ? 12 : 18)`
   */
  isTimeUnavailable?: (time: string, value: Time, date: string) => boolean;
}

/** 粒度 → 日历的粒度：年、月照搬，到日及以下都按日（选日期、比较范围） */
export const dateUnitOf = (granularity: DateFieldGranularity): DateUnit =>
  granularity === 'year' || granularity === 'month' ? granularity : 'day';

/** 精确到时、分、秒：值是日期加时间 */
export const isTimeGranularity = (granularity: DateFieldGranularity) =>
  granularity === 'hour' || granularity === 'minute' || granularity === 'second';

/** ISO 日期时间统一到秒（'2026-10-20T14:30' → '2026-10-20T14:30:00'），去掉时区后缀：按字符串比较就是按时间先后 */
const toSeconds = (iso: string) => (iso.length >= 19 ? iso.slice(0, 19) : `${iso.slice(0, 16)}:00`);

/**
 * 带时间的 min / max → 比较用的 ISO 日期时间；只给了日期（或不带时间的 granularity）时为 null，
 * 那一整天都可选，只按日期比较
 */
function timeBound(limit: DateInput | undefined, granularity: DateFieldGranularity) {
  if (limit == null || !isTimeGranularity(granularity)) return null;
  if (typeof limit === 'string') return limit.includes('T') ? toSeconds(limit) : null;
  return 'hour' in limit ? toSeconds(valueToIso(limit, granularity)) : null;
}

/**
 * 这一段（年、季度、月、周、日，按值的形式）能不能选：整段都在 min–max 之外，或（按日选时）是不可选的日期。
 * DateField、DatePicker 的快捷选项与“今天”、DateRangePicker 的两端共用
 */
export function isPeriodDisabled(
  iso: string,
  granularity: DateFieldGranularity,
  limits: DateLimits,
  locale: DateLocale,
): boolean {
  const start = locale.fromValue(fullIsoDay(iso));
  const end = locale.fromValue(lastIsoDay(iso));
  if (start == null || end == null) return false;
  if (limits.max != null && compareDates(start, limits.max) > 0) return true;
  if (limits.min != null && compareDates(end, limits.min) < 0) return true;
  const byDay = granularity === 'day' || isTimeGranularity(granularity);
  return byDay && (limits.isUnavailable?.(start) ?? false);
}

/** 值 → 分段输入用的 ISO 字符串（形式随 granularity） */
export function valueToIso(value: DateInput, granularity: DateFieldGranularity): string {
  if (typeof value === 'string') return value;
  if (isTimeGranularity(granularity)) {
    return toIsoDateTime(toCalendarDateTime(value), granularity === 'second');
  }
  if (granularity === 'quarter') return toIsoQuarter(value);
  if (granularity === 'week') return toIsoWeek(value);
  const day = toIsoDate(value);
  return granularity === 'year' ? day.slice(0, 4) : granularity === 'month' ? day.slice(0, 7) : day;
}

/** 分段输入填好的 ISO 字符串 → 和 like 同一种类型的值 */
export function isoToValue(
  iso: string,
  like: DateInput | undefined,
  granularity: DateFieldGranularity,
  valueType: keyof DateValueTypes = 'iso',
): DateInput {
  if (typeof like === 'string' || (like == null && valueType === 'iso')) return iso;
  const parsed: CalendarDate | CalendarDateTime = isTimeGranularity(granularity)
    ? parseIsoDateTime(iso)!
    : parseIsoDate(fullIsoDay(iso))!;
  if (like == null) return parsed;
  const converted = toCalendar(parsed, like.calendar);
  if (!('hour' in like)) return converted;
  const { era, year, month, day } = converted;
  if (!('hour' in converted)) return like.set({ era, year, month, day });
  const { hour, minute, second } = converted;
  return like.set({ era, year, month, day, hour, minute, second });
}

/** 日期输入框：分段输入 */
export const DateField = _component(
  <V extends DateInput>({
    _value: value = _bindable<V | null>(null),
    granularity = 'day',
    valueType,
    min,
    max,
    isDateUnavailable,
    isTimeUnavailable,
    ...rest
  }: DateFieldProps<V>) => {
    const locale = useDateLocale();
    const limits = _derived(toDateLimits(locale, { min, max, isDateUnavailable }));
    // 先按日期比较（含不可选的日期）；min / max 带时间时，同一天里再比时分秒
    const outOfRange = (iso: string) => {
      if (isPeriodDisabled(iso, granularity, limits, locale)) return true;
      const low = timeBound(min, granularity);
      const high = timeBound(max, granularity);
      const at = isTimeGranularity(granularity) ? toSeconds(iso) : '';
      if ((low != null && at < low) || (high != null && at > high)) return true;
      const time = isTimeGranularity(granularity) ? parseIsoTime(iso.slice(11)) : null;
      return (
        time != null && (isTimeUnavailable?.(toIsoTime(time), time, iso.slice(0, 10)) ?? false)
      );
    };
    const iso = _derived(value == null ? null : valueToIso(value, granularity));
    // 值清空后再填：仍按清空前的类型写回
    let lastLike: V | undefined;
    function write(next: string | null) {
      lastLike = value ?? lastLike;
      value = next == null ? null : (isoToValue(next, lastLike, granularity, valueType) as V);
    }
    return () => (
      <SegmentedField
        {...rest}
        onUpdate:_value={write}
        _value={iso}
        fields={segmentFields(granularity)}
        outOfRange={outOfRange}
      />
    );
  },
);
