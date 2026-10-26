/**
 * 日期时间的文字（time 元素）：按当前语言、时区、日历格式化，datetime 属性写机器可读的值。参考 HTML 的 time 元素。
 *
 *   <DateTime value={order.placedAt} />                                    // 2026年10月20日 14:30
 *   <DateTime value="2026-10-20" dateStyle="full" />                       // 2026年10月20日星期二
 *   <DateTime value={at} options={{ month: 'short', day: 'numeric' }} />
 *
 * 值是 Date、DateValue 或 ISO 字符串（同 useFormat().date）。不写格式时：只有日期的值显示日期，带时间的再加上时分。
 * 要“3 分钟前”这样的写法用 RelativeTime。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { DateValue } from '@internationalized/date';
import { useFormat } from '../config/lang/format';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 日期时间的值：Date、DateValue 或 ISO 字符串 */
export type DateTimeInput = Date | DateValue | string;

/** 未声明的属性落到 time 上 */
export interface DateTimeProps extends PartProps<'time', 'datetime'> {
  /** 值 */
  value: DateTimeInput;
  /** 日期的详略：full、long、medium、short；不写时 medium */
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle'];
  /** 时间的详略；不写时带时间的值用 short，只有日期的值不显示 */
  timeStyle?: Intl.DateTimeFormatOptions['timeStyle'];
  /** 逐项指定（年、月、星期……），写了时忽略 dateStyle、timeStyle */
  options?: Intl.DateTimeFormatOptions;
}

/** 值里有没有时间：Date、带 T 的字符串、CalendarDateTime 与 ZonedDateTime */
export const hasTimeOf = (value: DateTimeInput) =>
  value instanceof Date || (typeof value === 'string' ? value.includes('T') : 'hour' in value);

/** time 元素的 datetime：Date 写 UTC 的 ISO，其余原样（DateValue 的 toString 就是 ISO） */
export const machineDateTime = (value: DateTimeInput) =>
  value instanceof Date ? value.toISOString() : value.toString();

/** 日期时间的文字（time） */
export const DateTime = _component(
  ({ value, dateStyle, timeStyle, options, ...rest }: DateTimeProps) => {
    const format = useFormat();
    return () => {
      const resolved: Intl.DateTimeFormatOptions = options ?? {
        dateStyle: dateStyle ?? 'medium',
        timeStyle: timeStyle ?? (hasTimeOf(value) ? 'short' : undefined),
      };
      return (
        <time {...mergeAttrs<'time'>({}, rest, { datetime: machineDateTime(value) })}>
          {format.date(value, resolved)}
        </time>
      );
    };
  },
);
