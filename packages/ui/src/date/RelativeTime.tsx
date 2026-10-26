/**
 * 相对时间（time 元素）：“刚刚”“3 分钟前”“昨天”“2 年后”，随时间自动更新；悬停显示完整的日期时间。
 * 参考 GitHub 的 <relative-time>（threshold 之后改写日期）、Intl.RelativeTimeFormat。
 *
 *   <RelativeTime value={comment.createdAt} />
 *   <RelativeTime value={deadline} threshold={{ days: 7 }} />   // 一周以外直接写日期
 *
 * 值同 DateTime。单位按相差多久自动取（45 秒以内用秒，45 分钟以内用分……），措辞用 numeric: 'auto'（“昨天”而不是“1 天前”）。
 * 更新的频率随单位变：秒级每秒，分钟级每 10 秒，小时级每分钟，更远的每小时；页面隐藏时不更新。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { DateTimeDuration } from '@internationalized/date';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { relativeUnit, toInstant } from '../utils/data/date';
import { mergeAttrs, type PartProps } from '../utils/props';
import { useNow } from './clock';
import { hasTimeOf, machineDateTime, type DateTimeInput } from './DateTime';

/** 未声明的属性落到 time 上 */
export interface RelativeTimeProps extends PartProps<'time', 'datetime'> {
  /** 值：Date、DateValue 或 ISO 字符串 */
  value: DateTimeInput;
  /** 详略：long（“3 分钟前”，默认）、short、narrow */
  format?: Intl.RelativeTimeFormatStyle;
  /** 相差超过多久就改写日期（同 DateTime）；不写时一直是相对时间 */
  threshold?: DateTimeDuration;
  /** 以哪个时刻为“现在”（毫秒时间戳）：写了就不再随时间更新（服务端渲染、截图、测试） */
  now?: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/** 时长 → 毫秒：月按 30 天、年按 365 天，作为阈值足够 */
const durationMs = ({
  years = 0,
  months = 0,
  weeks = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
}: DateTimeDuration) =>
  ((years * 365 + months * 30 + weeks * 7 + days) * 24 + hours) * HOUR +
  minutes * MINUTE +
  seconds * SECOND;

/** 不同单位下多久更新一次 */
const REFRESH: Partial<Record<Intl.RelativeTimeFormatUnit, number>> = {
  second: SECOND,
  minute: 10 * SECOND,
  hour: MINUTE,
};

/** 相对时间 */
export const RelativeTime = _component(
  ({ value, format: style = 'long', threshold, now: fixedNow, ...rest }: RelativeTimeProps) => {
    const lang = useLang();
    const format = useFormat();
    const instant = () => toInstant(value, lang.timeZone);
    const absolute = (current: number) =>
      threshold != null && Math.abs(instant() - current) > durationMs(threshold);
    const clock = useNow((current) => {
      if (fixedNow != null || Number.isNaN(instant()) || absolute(current)) return null;
      return REFRESH[relativeUnit(instant() - current).unit] ?? HOUR;
    });

    return () => {
      const current = fixedNow ?? clock.value;
      const full = format.date(value, {
        dateStyle: 'full',
        timeStyle: hasTimeOf(value) ? 'short' : undefined,
      });
      const text = absolute(current)
        ? format.date(value, { dateStyle: 'medium' })
        : format.relative(value, { now: current, style });
      return (
        <time {...mergeAttrs<'time'>({ title: full }, rest, { datetime: machineDateTime(value) })}>
          {text}
        </time>
      );
    };
  },
);
