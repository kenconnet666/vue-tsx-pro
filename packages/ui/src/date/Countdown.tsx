/**
 * 倒计时（role="timer"）：到某个时刻还剩多久，按秒（或分）更新；到点时调用 onEnd，停在 0。
 * 参考 Ant Design Statistic.Countdown、GitHub 的 <relative-time format="duration">。
 *
 *   <Countdown to={sale.startsAt} onEnd={refresh} />          // 2天 03:15:42
 *   <Countdown to={deadline} precision="minute" />            // 2天 03:15
 *   <Countdown to={deadline}>{({ days, hours }) => `还剩 ${days} 天 ${hours} 小时`}</Countdown>
 *
 * 目标时刻同 DateTime 的值（Date、DateValue 或 ISO 字符串）。默认显示 时:分:秒，超过一天时前面加天数（Intl 的单位写法）。
 * role="timer" 默认不播报（aria-live 为 off），读屏用户需要时自己读；到点的提示放在 onEnd 里（Toast 等）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { toInstant } from '../utils/data/date';
import { mergeAttrs, type PartProps } from '../utils/props';
import { useNow } from './clock';
import type { DateTimeInput } from './DateTime';

/** 还剩多久，拆成天、时、分、秒 */
export interface CountdownParts {
  /** 剩余的毫秒数，到点后是 0 */
  total: number;
  /** 整天数 */
  days: number;
  /** 不满一天的小时（0–23） */
  hours: number;
  /** 不满一小时的分钟（0–59） */
  minutes: number;
  /** 不满一分钟的秒（0–59）；精度为 minute 时总是 0 */
  seconds: number;
  /** 已经到点 */
  ended: boolean;
}

/** 更新与显示的精度 */
export interface CountdownPrecisions {
  /** 到秒（默认）：每秒更新 */
  second: unknown;
  /** 到分：每分钟更新，不显示秒 */
  minute: unknown;
}

/** 未声明的属性落到 span（role="timer"）上 */
export interface CountdownProps extends PartProps<'span', 'role'> {
  /** 目标时刻 */
  to: DateTimeInput;
  /** 精度，默认 second */
  precision?: keyof CountdownPrecisions;
  /** 到点时调用一次（挂载时已经过了的不调用） */
  onEnd?: () => void;
  /** 自定义显示：拿到拆好的天、时、分、秒 */
  children?: (parts: CountdownParts) => VNodeChild;
}

/** Countdown 的样式：root */
export const countdownStyles = css.create({
  // 等宽数字：每秒跳动时宽度不变
  root: { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
});

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/** 剩余的毫秒数 → 天、时、分、秒（按精度向上取整：还剩 0.4 秒时显示 1 秒，到点才是 0） */
export function countdownParts(
  total: number,
  precision: keyof CountdownPrecisions,
): CountdownParts {
  const unit = precision === 'minute' ? MINUTE : SECOND;
  const rounded = Math.ceil(Math.max(total, 0) / unit) * unit;
  const seconds = Math.floor(rounded / SECOND);
  return {
    total: Math.max(total, 0),
    days: Math.floor(seconds / 86_400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
    ended: total <= 0,
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** 倒计时 */
export const Countdown = _component(
  ({ to, precision = 'second', onEnd, children, ...rest }: CountdownProps) => {
    const lang = useLang();
    const format = useFormat();
    const target = () => toInstant(to, lang.timeZone);
    const now = useNow((current) =>
      current >= target() ? null : precision === 'minute' ? MINUTE : SECOND,
    );
    const parts = _derived(countdownParts(target() - now.value, precision));
    watch(
      () => parts.ended,
      (ended, before) => {
        if (ended && before === false) onEnd?.();
      },
    );

    return () => {
      const { days, hours, minutes, seconds } = parts;
      const clock = [hours, minutes, ...(precision === 'second' ? [seconds] : [])]
        .map(pad)
        .join(':');
      const dayText =
        days > 0
          ? `${format.number(days, { style: 'unit', unit: 'day', unitDisplay: 'long' })} `
          : '';
      return (
        <span {...mergeAttrs<'span'>({ sx: countdownStyles.root }, rest, { role: 'timer' })}>
          {children ? children(parts) : `${dayText}${clock}`}
        </span>
      );
    };
  },
);
