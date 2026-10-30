/**
 * 日历：按月排开的日期格子，选一天、选一段（入住到离店）、或选几天。常放在底部弹出层里，下面一个确认按钮。
 *
 *   <Calendar _value={date} onConfirm={(day) => …} />
 *   <Calendar type="range" _value={stay} minDate={today} maxDate={inSixMonths} dayInfo={(day) => ({ bottom: '¥299' })} />
 *   <Calendar type="multiple" _value={days} />
 *
 * 选的过程在组件里，点了确认才写回 _value（showConfirm 为 false 时选完就写回）。一周从周几开始、星期的写法随语言包。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { useConfig } from '../config/context';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 选择的方式 */
export interface CalendarTypes {
  /** 一天（默认） */
  single: unknown;
  /** 一段：先点开始，再点结束 */
  range: unknown;
  /** 几天：点一下选上，再点一下取消 */
  multiple: unknown;
}

/** 日历的值：一天、一段 [开始, 结束]、几天 */
export type CalendarValue = Date | [Date, Date] | Date[];

/** 某一天的额外信息 */
export interface CalendarDayInfo {
  /** 日子下面的小字（价格、节日） */
  bottom?: VNodeChild;
  /** 这一天不能选 */
  disabled?: boolean;
}

/** 未声明的属性落到根元素（div）上 */
export interface CalendarProps extends Omit<PartProps<'div', 'title'>, 'onSelect'> {
  /**
   * 选择的方式
   * @default 'single'
   */
  type?: keyof CalendarTypes;
  /** 选中的日期；双向绑定写 `_value={x}`（确认时写回） */
  _value?: CalendarValue | null;
  /** 最早可选的日子；默认今天 */
  minDate?: Date;
  /** 最晚可选的日子；默认半年后 */
  maxDate?: Date;
  /** 标题 */
  title?: VNodeChild;
  /**
   * 下面显示确认按钮
   * @default true
   */
  showConfirm?: boolean;
  /** 确认的文字；不给时用语言包 */
  confirmText?: VNodeChild;
  /** 每一天的额外信息 */
  dayInfo?: (day: Date) => CalendarDayInfo | undefined;
  /** 点了一天 */
  onSelect?: (day: Date) => void;
  /** 点了确认（或不显示确认按钮时选完了） */
  onConfirm?: (value: CalendarValue) => void;
}

/** Calendar 的样式 */
export const calendarStyles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '_surface',
    userSelect: 'none',
  },
  title: {
    paddingBlock: '0.8em',
    textAlign: 'center',
    fontSize: '_lg',
    fontWeight: '_semibold',
    color: '_text',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    paddingBlock: '0.4em',
    fontSize: '_xs',
    color: '_textMuted',
    textAlign: 'center',
    boxShadow: '_sm',
  },
  body: { height: '22em', overflowY: 'auto' },
  month: { paddingBlockEnd: '_sm' },
  monthTitle: {
    paddingBlock: '0.7em',
    textAlign: 'center',
    fontSize: '_md',
    fontWeight: '_medium',
    color: '_text',
  },
  days: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '0.25em' },
  day: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '3.4em',
    fontSize: '_md',
    color: { default: '_text', '[data-disabled]': '_textDisabled' },
    cursor: { default: 'pointer', '[data-disabled]': 'not-allowed' },
  },
  // 区间中间的几天：浅色底连成一条
  middle: { backgroundColor: '_accentSoft', color: '_accentText' },
  selected: { borderRadius: '_md', backgroundColor: '_accent', color: '_accentContrast' },
  rangeStart: { borderStartEndRadius: 0, borderEndEndRadius: 0 },
  rangeEnd: { borderStartStartRadius: 0, borderEndStartRadius: 0 },
  bottom: { fontSize: '0.65em', lineHeight: '1.2', minHeight: '1.2em' },
  footer: {
    paddingBlock: '_sm',
    paddingInline: '_lg',
    paddingBlockEnd: 'calc(0.5em + env(safe-area-inset-bottom))',
  },
});

/** 某天 0 点 */
const dayOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const sameDay = (a: Date | undefined, b: Date) => !!a && a.getTime() === dayOf(b).getTime();

/** 值 → 选中的日子列表（区间时是 [开始, 结束?]） */
function toDays(value: CalendarValue | null | undefined): Date[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(dayOf);
}

/** 日历（div > 标题 + 星期 + 各月 + 确认） */
export const Calendar = _component(
  ({
    type = 'single',
    _value: value = _bindable<CalendarValue | null>(null),
    minDate,
    maxDate,
    title,
    showConfirm = true,
    confirmText,
    dayInfo,
    onSelect,
    onConfirm,
    ...rest
  }: CalendarProps) => {
    const config = useConfig();
    const today = dayOf(new Date());
    const min = _derived(dayOf(minDate ?? today));
    const max = _derived(
      dayOf(maxDate ?? new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())),
    );
    // 选的过程：确认前不写回 _value（覆盖派生值）；外面改了 _value 时重新跟随
    let picked = _derived(toDays(value));

    /** 各月：从 min 的月份到 max 的月份 */
    const months = _derived.by(() => {
      const list: { year: number; month: number }[] = [];
      for (
        let cursor = new Date(min.getFullYear(), min.getMonth(), 1);
        cursor <= max;
        cursor.setMonth(cursor.getMonth() + 1)
      )
        list.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
      return list;
    });

    const complete = () => (type === 'range' ? picked.length === 2 : picked.length > 0);
    const result = (): CalendarValue =>
      type === 'single' ? picked[0]! : type === 'range' ? [picked[0]!, picked[1]!] : [...picked];
    const commit = () => {
      if (!complete()) return;
      value = result();
      onConfirm?.(value);
    };

    const choose = (day: Date) => {
      onSelect?.(day);
      if (type === 'single') picked = [day];
      else if (type === 'multiple')
        picked = picked.some((item) => sameDay(item, day))
          ? picked.filter((item) => !sameDay(item, day))
          : [...picked, day].sort((a, b) => a.getTime() - b.getTime());
      // 区间：没开始或已经选完时重新开始；点在开始之前时当成新的开始
      else if (picked.length !== 1 || day < picked[0]!) picked = [day];
      else picked = [picked[0]!, day];
      if (!showConfirm && complete()) commit();
    };

    const renderDay = (day: Date) => {
      const info = dayInfo?.(day);
      const disabled = day < min || day > max || !!info?.disabled;
      const [start, end] = picked;
      const isStart = type === 'range' && sameDay(start, day);
      const isEnd = type === 'range' && sameDay(end, day);
      const selected =
        type === 'range' ? isStart || isEnd : picked.some((item) => sameDay(item, day));
      const middle = type === 'range' && !!start && !!end && day > start && day < end;
      const bottom = isStart ? config.lang.start : isEnd ? config.lang.end : info?.bottom;
      return (
        <div
          {...mergeAttrs<'div'>({
            sx: [
              calendarStyles.day,
              middle && calendarStyles.middle,
              selected && calendarStyles.selected,
              isStart && !!end && calendarStyles.rangeStart,
              isEnd && calendarStyles.rangeEnd,
            ],
          })}
          role="gridcell"
          aria-selected={selected ? 'true' : undefined}
          aria-disabled={disabled ? 'true' : undefined}
          {...dataAttrs({ 'data-disabled': disabled })}
          onClick={() => !disabled && choose(day)}
        >
          {day.getDate()}
          <span {...mergeAttrs<'span'>({ sx: calendarStyles.bottom })}>
            {hasContent(bottom) ? bottom : null}
          </span>
        </div>
      );
    };

    return () => {
      const first = config.lang.firstDayOfWeek;
      const weekdays = [
        ...config.lang.weekdays.slice(first),
        ...config.lang.weekdays.slice(0, first),
      ];
      return (
        <div {...mergeAttrs<'div'>({ sx: calendarStyles.root }, rest)}>
          {hasContent(title) && (
            <div {...mergeAttrs<'div'>({ sx: calendarStyles.title })}>{title}</div>
          )}
          <div {...mergeAttrs<'div'>({ sx: calendarStyles.weekdays })} aria-hidden="true">
            {weekdays.map((name) => (
              <span>{name}</span>
            ))}
          </div>
          <div {...mergeAttrs<'div'>({ sx: calendarStyles.body })}>
            {months.map(({ year, month }) => {
              const count = new Date(year, month + 1, 0).getDate();
              // 第一天前面空几格
              const offset = (new Date(year, month, 1).getDay() - first + 7) % 7;
              return (
                <div
                  {...mergeAttrs<'div'>({ sx: calendarStyles.month })}
                  role="grid"
                  aria-label={config.lang.monthTitle(year, month + 1)}
                >
                  <div {...mergeAttrs<'div'>({ sx: calendarStyles.monthTitle })}>
                    {config.lang.monthTitle(year, month + 1)}
                  </div>
                  <div {...mergeAttrs<'div'>({ sx: calendarStyles.days })}>
                    {Array.from({ length: offset }, () => (
                      <span />
                    ))}
                    {Array.from({ length: count }, (_, index) =>
                      renderDay(new Date(year, month, index + 1)),
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {showConfirm && (
            <div {...mergeAttrs<'div'>({ sx: calendarStyles.footer })}>
              <Button fullWidth radius="full" disabled={!complete()} onClick={commit}>
                {confirmText ?? config.lang.confirm}
              </Button>
            </div>
          )}
        </div>
      );
    };
  },
);
