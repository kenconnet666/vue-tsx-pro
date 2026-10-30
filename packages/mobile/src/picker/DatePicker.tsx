/**
 * 日期选择器与时间选择器：滚轮选年月日（可以只要年月）、选时分（分钟可以按步长）。建在 Picker 上，常放在底部弹出层里。
 *
 *   <DatePicker _value={birthday} minDate={new Date(1950, 0, 1)} maxDate={new Date()} onConfirm={(date) => …} />
 *   <DatePicker _value={month} columns={['year', 'month']} />
 *   <TimePicker _value={time} minuteStep={15} />          time 是 "09:30"
 *
 * 换了年月时日子按那个月的天数修正（3 月 31 日换到 2 月是 2 月 28 / 29 日），超出 minDate、maxDate 的项不出现。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { useConfig } from '../config/context';
import type { PartProps } from '../utils/props';
import { Picker, type PickerOption } from './Picker';

/** 日期的列 */
export type DateColumn = 'year' | 'month' | 'day';

/** 共有的属性 */
interface PickerShellProps extends Omit<PartProps<'div', 'title'>, 'onChange'> {
  /** 标题 */
  title?: VNodeChild;
  /** 点了取消 */
  onCancel?: () => void;
  /** 可见的行数 */
  visibleItemCount?: number;
}

/** 未声明的属性落到选择器的根元素上 */
export interface DatePickerProps extends PickerShellProps {
  /** 选中的日期；双向绑定写 `_value={x}`。不给时是今天（限在范围内） */
  _value?: Date;
  /** 最早的日期；默认十年前的 1 月 1 日 */
  minDate?: Date;
  /** 最晚的日期；默认十年后的 12 月 31 日 */
  maxDate?: Date;
  /**
   * 显示哪几列
   * @default ['year', 'month', 'day']
   */
  columns?: DateColumn[];
  /** 点了确认 */
  onConfirm?: (date: Date) => void;
}

const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate();
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);
const pad = (value: number) => String(value).padStart(2, '0');

/** 日期选择器（Picker） */
export const DatePicker = _component(
  ({
    _value: value = _bindable<Date | undefined>(undefined),
    minDate,
    maxDate,
    columns = ['year', 'month', 'day'],
    onConfirm,
    ...rest
  }: DatePickerProps) => {
    const config = useConfig();
    const now = new Date();
    const min = _derived(minDate ?? new Date(now.getFullYear() - 10, 0, 1));
    const max = _derived(maxDate ?? new Date(now.getFullYear() + 10, 11, 31));
    /** 把日期限在范围内（只看年月日） */
    const clamp = (date: Date) => {
      const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (day < min) return new Date(min.getFullYear(), min.getMonth(), min.getDate());
      if (day > max) return new Date(max.getFullYear(), max.getMonth(), max.getDate());
      return day;
    };
    const current = _derived(clamp(value ?? now));

    /** 各列的选项：月份、日子按当前的年月与范围裁剪 */
    const lists = _derived.by(() => {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const atMin = (unit: 'year' | 'month') =>
        year === min.getFullYear() && (unit === 'year' || month === min.getMonth() + 1);
      const atMax = (unit: 'year' | 'month') =>
        year === max.getFullYear() && (unit === 'year' || month === max.getMonth() + 1);
      const units = config.lang.dateUnits;
      const all: Record<DateColumn, PickerOption[]> = {
        year: range(min.getFullYear(), max.getFullYear()).map((n) => ({
          text: `${n}${units.year}`,
          value: n,
        })),
        month: range(
          atMin('year') ? min.getMonth() + 1 : 1,
          atMax('year') ? max.getMonth() + 1 : 12,
        ).map((n) => ({ text: `${pad(n)}${units.month}`, value: n })),
        day: range(
          atMin('month') ? min.getDate() : 1,
          atMax('month') ? max.getDate() : daysIn(year, month),
        ).map((n) => ({ text: `${pad(n)}${units.day}`, value: n })),
      };
      return columns.map((column) => all[column]);
    });

    const valuesOf = (date: Date) =>
      columns.map((column) =>
        column === 'year'
          ? date.getFullYear()
          : column === 'month'
            ? date.getMonth() + 1
            : date.getDate(),
      );
    /** 各列的值 → 日期：缺的列取当前的，日子按月份的天数修正 */
    const dateOf = (values: (string | number)[]) => {
      const pick = (column: DateColumn, fallback: number) => {
        const position = columns.indexOf(column);
        return position >= 0 ? Number(values[position]) : fallback;
      };
      const year = pick('year', current.getFullYear());
      const month = pick('month', current.getMonth() + 1);
      const day = Math.min(pick('day', current.getDate()), daysIn(year, month));
      return clamp(new Date(year, month - 1, day));
    };

    return () => (
      <Picker
        {...rest}
        columns={lists}
        _value={valuesOf(current)}
        onChange={({ values }) => (value = dateOf(values))}
        onConfirm={({ values }) => onConfirm?.(dateOf(values))}
      />
    );
  },
);

/** 未声明的属性落到选择器的根元素上 */
export interface TimePickerProps extends PickerShellProps {
  /** 选中的时间 "HH:mm"；双向绑定写 `_value={x}`。不给时是 00:00 */
  _value?: string;
  /**
   * 最小、最大的小时
   * @default 0、23
   */
  minHour?: number;
  maxHour?: number;
  /**
   * 分钟的步长
   * @default 1
   */
  minuteStep?: number;
  /** 点了确认 */
  onConfirm?: (time: string) => void;
}

/** 时间选择器（Picker：时、分两列） */
export const TimePicker = _component(
  ({
    _value: value = _bindable('00:00'),
    minHour = 0,
    maxHour = 23,
    minuteStep = 1,
    onConfirm,
    ...rest
  }: TimePickerProps) => {
    const config = useConfig();
    const lists = _derived.by(() => {
      const units = config.lang.dateUnits;
      return [
        range(minHour, maxHour).map((n) => ({ text: `${pad(n)}${units.hour}`, value: n })),
        range(0, Math.floor(59 / minuteStep)).map((n) => ({
          text: `${pad(n * minuteStep)}${units.minute}`,
          value: n * minuteStep,
        })),
      ];
    });
    const parts = () => {
      const [hour = '0', minute = '0'] = value.split(':');
      return [Number(hour), Math.round(Number(minute) / minuteStep) * minuteStep];
    };
    const format = (values: (string | number)[]) => values.map((n) => pad(Number(n))).join(':');
    return () => (
      <Picker
        {...rest}
        columns={lists}
        _value={parts()}
        onChange={({ values }) => (value = format(values))}
        onConfirm={({ values }) => onConfirm?.(format(values))}
      />
    );
  },
);
