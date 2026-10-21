/**
 * 日期选择器：DateField 加一个打开日历的按钮，日历弹在输入框下方；可以直接键入，也可以点选。
 * 参考 React Aria DatePicker（输入框可键入，按钮打开对话框里的 Calendar）、Mantine DatePickerInput。
 *
 *   <Field label="出发日期"><DatePicker value={_bind(date)} min={today} /></Field>
 *   <DatePicker granularity="month" value={_bind(month)} aria-label="账期" />     // 选月份：'2026-10'
 *   <DatePicker granularity="minute" value={_bind(at)} aria-label="开始时间" />  // 日期加时间：'2026-10-20T14:30'
 *
 * granularity 决定值的形式（同 DateField）与弹出的选择：year、month 选年份、月份，其余选日期。
 * 选好后关闭，焦点回到按钮；带时间时焦点落到“时”那一段接着输入（没有时间时先补 00:00）。
 * Esc、点外部关闭；分段里按 Alt + ↓ 打开（同原生 select）。
 *
 * 部件：同 DateField，另有 Button（打开按钮）、Popover（弹层，role="dialog"）、Calendar。
 */
import { CalendarDays } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { toCalendarDateTime } from '@internationalized/date';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useLang } from '../config/context';
import { useFieldControl } from '../form/Field';
import type { DateUnit } from '../utils/data/date';
import { mergePartProps, type PartProps } from '../utils/props';
import { Calendar, type CalendarBaseProps } from './Calendar';
import { DateField, type DateFieldProps } from './DateField';
import type { DateInput } from './date-locale';
import type { DateFieldGranularity } from './date-segments';
import { focusCalendar, usePickerPopover, type PickerPopoverParts } from './picker-popover';

/** 未声明的属性落到这组分段上（主元素）；外壳用 propsRoot */
export interface DatePickerProps<V extends DateInput = string>
  extends DateFieldProps<V>, PickerPopoverParts {
  /** 弹层是否打开：父级可写 open={_bind(x)} */
  open?: boolean;
  /** 日历并排显示几个月，默认 1 */
  visibleMonths?: number;
  /** 日历的部件属性（值、范围、粒度由选择器给出） */
  propsCalendar?: Omit<
    Partial<CalendarBaseProps<V>>,
    'granularity' | 'min' | 'max' | 'isDateUnavailable' | 'valueType' | 'onPick'
  >;
}

/** DatePicker 的样式：popover */
export const datePickerStyles = stylex.create({
  popover: { padding: '_sm' },
});

const TIME_GRANULARITIES = new Set<DateFieldGranularity>(['hour', 'minute', 'second']);

/** 选择器的粒度 → 日历的粒度：年、月照搬，到日及以下都是选日期 */
const calendarUnit = (granularity: DateFieldGranularity): DateUnit =>
  granularity === 'year' || granularity === 'month' ? granularity : 'day';

/** 日期选择器：分段输入 + 弹出的日历 */
export const DatePicker = _component(
  <V extends DateInput>({
    value = _bindable<V | null>(null),
    open = _bindable(false),
    granularity = 'day',
    valueType,
    min,
    max,
    isDateUnavailable,
    placement,
    visibleMonths = 1,
    id,
    disabled,
    readonly,
    invalid,
    required,
    propsRoot,
    propsButton,
    propsPopover,
    propsCalendar,
    onKeydown,
    ...rest
  }: DatePickerProps<V>) => {
    const lang = useLang();
    // 输入由里面的 DateField 接 Field；这里只读状态决定能不能打开面板
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }), {
      delegate: true,
    });
    const hasTime = () => TIME_GRANULARITIES.has(granularity);
    const picker = usePickerPopover(
      () => ({
        open,
        placement,
        editable: !control().disabled && !control().readonly,
        label: lang.datePickerOpen,
      }),
      { toggle: (next) => (open = next), shown: focusCalendar },
    );

    // 字符串值按 granularity 的形式（'2026'、'2026-10'、'2026-10-20T14:30'）：日历只认完整的日期
    const calendarValue = _derived.by((): DateInput | null => {
      if (typeof value !== 'string') return value;
      if (value.length === 4) return `${value}-01-01`;
      return value.length === 7 ? `${value}-01` : value.slice(0, 10);
    });

    /** 日历选了一天：换回 granularity 的形式；带时间的保留原来的时间，没有时补 00:00 */
    function pickDay(day: DateInput | null) {
      if (day == null) return;
      if (typeof day !== 'string') {
        // 空值按 dateValue 写回时日历给的是 CalendarDate：带时间的粒度要 CalendarDateTime
        value = (hasTime() && !('hour' in day) ? toCalendarDateTime(day) : day) as V;
        return;
      }
      if (granularity === 'year') value = day.slice(0, 4) as V;
      else if (granularity === 'month') value = day.slice(0, 7) as V;
      else if (!hasTime()) value = day as V;
      else {
        const time = typeof value === 'string' && value.length > 10 ? value.slice(10) : undefined;
        value = `${day}${time ?? (granularity === 'second' ? 'T00:00:00' : 'T00:00')}` as V;
      }
    }

    function picked() {
      open = false;
      // 带时间时接着输入时间：焦点去“时”那一段（关闭后的归还焦点只在焦点丢失时生效，不会抢回去）
      if (hasTime()) picker.anchor?.querySelector<HTMLElement>('[data-type="hour"]')?.focus();
    }

    return () => (
      <>
        <DateField
          {...rest}
          {...{ 'onUpdate:value': (next: V | null) => (value = next) }}
          value={value}
          granularity={granularity}
          valueType={valueType}
          min={min}
          max={max}
          isDateUnavailable={isDateUnavailable}
          id={id}
          disabled={disabled}
          readonly={readonly}
          invalid={invalid}
          required={required}
          onKeydown={(event) => {
            onKeydown?.(event);
            picker.onKeydown(event);
          }}
          propsRoot={mergePartProps<PartProps<'div'>>({}, propsRoot, { ref: picker.anchorRef })}
          suffix={picker.button(CalendarDays, propsButton)}
        />
        {picker.panel(
          datePickerStyles.popover,
          propsPopover,
          open && (
            <Calendar<V>
              {...propsCalendar}
              {...{ 'onUpdate:value': pickDay }}
              value={calendarValue as V | null}
              granularity={calendarUnit(granularity)}
              valueType={valueType}
              min={min}
              max={max}
              isDateUnavailable={isDateUnavailable}
              visibleMonths={visibleMonths}
              onPick={picked}
            />
          ),
        )}
      </>
    );
  },
);
