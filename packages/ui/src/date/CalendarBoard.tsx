/**
 * 整页的月历（日历看板）：一个月铺满一页，每天一个大格子，格子里放日程、排班、节假日这类按天的内容。
 * 参考 Ant Design Calendar 的 fullscreen、Google 日历的月视图。要在输入框里选日期用 DatePicker，小日历用 Calendar。
 *
 *   <CalendarBoard
 *     events={meetings}
 *     getEventDate={(meeting) => meeting.date}
 *     getEventLabel={(meeting) => meeting.title}
 *     value={_bind(day)}
 *     aria-label="会议日程"
 *   />
 *
 * - 数据按天放进格子：getEventDate 是哪一天（带时间的取日期），getEventEnd 给了时跨天的每一天都有它；
 *   每天最多显示 maxEvents 条，其余收成“还有 N 项”（点了选中那一天，由页面在旁边列出全部）。
 *   renderEvent 自定义一条的显示（默认是带色调的一行文字），renderDay 往格子里加别的内容（排班、价格），
 *   getDayNote 是日期旁边的小字（节假日、“休”“班”、农历）。
 * - 键盘与 Calendar 一致（同一个 useCalendarState）：每天的日期数字是一个按钮，焦点在当前日期上，
 *   ←→ 一天、↑↓ 一周、Page Up / Down 一个月、Home / End 到这周两端，Enter / 空格选中；读屏念完整日期与有几项日程。
 *   格子里的日程可以是链接、按钮，Tab 照常进去。
 * - 页头：标题（翻页时播报）、toolbar（筛选、视图切换）、“今天”、上个月 / 下个月；month 可以双向绑定（翻页写回）。
 *
 * 部件：Root（div，role="group"）、Header、Title、Today、Previous、Next、Grid（table）、Weekday、Cell（td）、
 * DayButton（日期数字）、Note、Events（ul）、Event、More。
 */
import { ChevronLeft, ChevronRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { isWeekend, type CalendarDate } from '@internationalized/date';
import * as css from '@vue-tsx-pro/tsx/styles';
import { nextTick, useId, watch, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { buttonBaseStyles } from '../base/button-core';
import { IconButton } from '../base/IconButton';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { t } from '../config/theme/tokens';
import { isSameDate, monthGrid, weekdayNames } from '../utils/data/date';
import { isRtl } from '../utils/dom/direction';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { statusToneSx, type StatusTone } from '../utils/style/tone-styles';
import { interactionTransitions } from '../utils/style/transitions';
import { handleCalendarKeydown, useCalendarState } from './calendar-state';
import { toDateLimits, useDateLocale, type DateLimitProps } from './date-locale';

/** 一天的状态：renderDay、getDayNote 之外的自定义内容用 */
export interface CalendarBoardDayState {
  /** 今天 */
  today: boolean;
  /** 补齐的上个月、下个月的日子 */
  outside: boolean;
  /** 选中的那一天 */
  selected: boolean;
  /** 周六、周日（按语言） */
  weekend: boolean;
  /** 不可选（范围外、不可选的日期） */
  disabled: boolean;
}

/** 未声明的属性落到根元素上；aria-label 是整个月历的名称 */
export interface CalendarBoardProps<T = unknown> extends PartProps<'div', 'role'>, DateLimitProps {
  /** 选中的那一天（ISO 日期）：父级写 value={_bind(day)}；没有时 null */
  value?: string | null;
  /** 显示哪个月（'YYYY-MM'）：父级可写 month={_bind(m)}，翻页时写回；不写时从选中的那天（或今天）开始 */
  month?: string;
  /** 一周的第一天，0 是周日；不写时按语言 */
  firstDayOfWeek?: number;
  /** 按天放的数据：日程、排班、提醒 */
  events?: readonly T[];
  /** 数据在哪一天（ISO 日期；带时间的取日期部分） */
  getEventDate?: (event: T) => string;
  /** 跨天的数据在哪一天结束（含）；不写时只在 getEventDate 那一天 */
  getEventEnd?: (event: T) => string;
  /** 数据的 key；不写时用它在 events 里的位置 */
  getEventKey?: (event: T) => string;
  /** 默认显示的文字 */
  getEventLabel?: (event: T) => string;
  /** 默认显示的色调，默认 accent */
  getEventTone?: (event: T) => StatusTone;
  /** 自定义一条数据的显示 */
  renderEvent?: (event: T, date: string) => VNodeChild;
  /** 每天最多显示几条，其余收成“还有 N 项”，默认 3 */
  maxEvents?: number;
  /** 日期旁边的小字（节假日、“休”“班”、农历） */
  getDayNote?: (date: string) => VNodeChild;
  /** 往格子里加别的内容（排班、价格），放在日程下面 */
  renderDay?: (date: string, state: CalendarBoardDayState) => VNodeChild;
  /** 页头右边的内容（筛选、视图切换） */
  toolbar?: VNodeChild;
  /** 只读：能翻页、移动焦点，不能选 */
  readonly?: boolean;
  /** “今天”按钮的部件属性 */
  propsToday?: Partial<ButtonProps>;
  /** 每格（td）的部件属性，可以按日期给 */
  propsCell?: PartProps<'td', 'role' | 'aria-selected'> | ((date: string) => PartProps<'td'>);
}

/** CalendarBoard 的样式 */
export const calendarBoardStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: 0 },
  header: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '_sm' },
  title: { fontSize: '_lg', fontWeight: '_semibold', marginInlineEnd: 'auto' },
  grid: {
    width: '_full',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    borderSpacing: 0,
  },
  weekday: {
    paddingBlock: '_xs',
    paddingInline: '_sm',
    color: '_textMuted',
    fontWeight: '_normal',
    fontSize: '_sm',
    textAlign: 'start',
  },
  cell: {
    height: '7em',
    padding: '_xs',
    verticalAlign: 'top',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    cursor: 'pointer',
    transition: `background-color ${t.durations.sm} ${t.easings.standard}`,
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
  },
  weekend: { backgroundColor: { default: '_surfaceMuted', ':hover': '_fillHover' } },
  outside: { color: '_textMuted' },
  selected: {
    backgroundColor: { default: '_accentSoft', ':hover': '_accentSoftHover' },
    boxShadow: `inset 0 0 0 ${t.borderWidths.sm} ${t.colors.accentBorder}`,
  },
  disabled: { cursor: 'not-allowed', opacity: '_disabled' },
  // 只读：格子不像能点
  readonly: { cursor: 'default' },
  dayHead: { display: 'flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
  // 日期数字：可聚焦的按钮，焦点环画在它上面
  day: {
    display: 'inline-grid',
    placeItems: 'center',
    flexShrink: 0,
    minWidth: '1.75em',
    height: '1.75em',
    paddingInline: '_xs',
    borderRadius: '_full',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: '_medium',
  },
  today: { backgroundColor: '_accent', color: '_accentContrast' },
  note: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '_xs',
    color: '_textMuted',
  },
  events: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBlock: '_xs',
    marginInline: 0,
    padding: 0,
    listStyle: 'none',
  },
  event: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingInline: '_xs',
    borderRadius: '_sm',
    fontSize: '_xs',
    lineHeight: '1.6',
  },
  more: {
    paddingInline: '_xs',
    borderRadius: '_sm',
    fontSize: '_xs',
    color: '_textMuted',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
  },
});

/** 整页的月历：每天一个大格子，放日程、排班、节假日 */
export const CalendarBoard = _component(
  <T,>({
    value = _bindable<string | null>(null),
    month = _bindable<string | undefined>(undefined),
    firstDayOfWeek,
    min,
    max,
    isDateUnavailable,
    events = [],
    getEventDate,
    getEventEnd,
    getEventKey,
    getEventLabel,
    getEventTone,
    renderEvent,
    maxEvents = 3,
    getDayNote,
    renderDay,
    toolbar,
    readonly = false,
    propsToday,
    propsCell,
    ...rest
  }: CalendarBoardProps<T>) => {
    const lang = useLang();
    const format = useFormat();
    const locale = useDateLocale(() => ({ firstDayOfWeek }));
    const titleId = useId();
    let root = _state.raw<HTMLElement | null>(null);
    const limits = _derived(toDateLimits(locale, { min, max, isDateUnavailable }));
    const selected = _derived.by(() => {
      const day = locale.fromValue(value);
      return day ? [day] : [];
    });
    const calendar = useCalendarState({
      mode: () => 'single',
      selected: () => selected,
      onChange: ([day]) => {
        value = locale.toIso(day!);
      },
      today: () => locale.today(),
      limits: () => limits,
      week: () => locale.week,
      readonly: () => readonly,
      defaultFocused: () => (month ? locale.fromValue(`${month}-01`) : null),
    });

    // 翻页写回 month；父级改了 month 时翻过去
    watch(
      () => calendar.page.toString().slice(0, 7),
      (page) => {
        if (month !== undefined && month !== page) month = page;
      },
    );
    watch(
      () => month,
      (next) => {
        const target = next ? locale.fromValue(`${next}-01`) : null;
        if (target && !isSameDate(target, calendar.page, 'month')) calendar.focus(target);
      },
    );

    /** 按天分好的数据：ISO 日期 → 那天的数据（跨天的每一天都有） */
    const byDay = _derived.by(() => {
      const map = new Map<string, T[]>();
      if (!getEventDate) return map;
      for (const event of events) {
        const first = locale.fromValue(getEventDate(event).slice(0, 10));
        if (!first) continue;
        const last = getEventEnd ? locale.fromValue(getEventEnd(event).slice(0, 10)) : null;
        // 跨天的最多铺 366 天，数据错了（结束早于开始、跨好几年）也不会卡住
        for (let day = first, count = 0; count < 366; day = day.add({ days: 1 }), count++) {
          const key = locale.toIso(day);
          map.set(key, [...(map.get(key) ?? []), event]);
          if (!last || day.compare(last) >= 0) break;
        }
      }
      return map;
    });

    function onKeydown(event: KeyboardEvent) {
      // 格子里的日程（链接、按钮）自己处理按键
      if (!(event.target as Element).matches('[data-day]')) return;
      if (!handleCalendarKeydown(calendar, event, !!root && isRtl(root))) return;
      event.preventDefault();
      void nextTick(() => root?.querySelector<HTMLElement>('[data-day][data-focused]')?.focus());
    }

    /** 点格子的空白处：选中那一天（点里面的链接、按钮时照常） */
    function onCellClick(event: MouseEvent, day: CalendarDate) {
      if ((event.target as Element).closest('a, button, input, [role="button"]')) return;
      calendar.activate(day);
    }

    function renderCell(day: CalendarDate, page: CalendarDate) {
      const iso = locale.toIso(day);
      const state = calendar.cell(day, page);
      const dayState: CalendarBoardDayState = {
        today: state.today,
        outside: state.outside,
        selected: state.selected,
        weekend: isWeekend(day, locale.locale),
        disabled: state.disabled,
      };
      const list = byDay.get(iso) ?? [];
      const shown = list.slice(0, Math.max(0, maxEvents));
      const own = typeof propsCell === 'function' ? propsCell(iso) : propsCell;
      const label = format.date(day, { dateStyle: 'full' });
      return (
        <td
          key={iso}
          {...mergeAttrs<'td'>(
            {
              sx: [
                calendarBoardStyles.cell,
                dayState.weekend && calendarBoardStyles.weekend,
                state.outside && calendarBoardStyles.outside,
                state.selected && calendarBoardStyles.selected,
                state.disabled && calendarBoardStyles.disabled,
                readonly && calendarBoardStyles.readonly,
              ],
            },
            own,
            {
              role: 'gridcell',
              'aria-selected': state.selected,
              onClick: (event: MouseEvent) => onCellClick(event, day),
              onPointerenter: () => calendar.hover(day),
            },
          )}
          data-date={iso}
          data-today={state.today || undefined}
          data-outside={state.outside || undefined}
        >
          <div {...css.attrs(calendarBoardStyles.dayHead)}>
            <button
              type="button"
              tabindex={state.focused && !state.outside ? 0 : -1}
              aria-label={[
                state.today ? lang.calendarToday(label) : label,
                list.length > 0 ? lang.calendarBoardCount(list.length) : null,
              ]
                .filter(Boolean)
                .join('，')}
              aria-disabled={state.disabled || undefined}
              {...css.attrs(
                buttonBaseStyles.root,
                interactionTransitions.colors,
                calendarBoardStyles.day,
                focusRingStyles.tight,
                state.today && calendarBoardStyles.today,
              )}
              data-day=""
              data-focused={(state.focused && !state.outside) || undefined}
              onClick={(event: MouseEvent) => {
                event.stopPropagation();
                if (!state.disabled) calendar.activate(day);
              }}
              onFocus={() => {
                if (!state.focused) calendar.focus(day);
              }}
            >
              {locale.dayNumber(day)}
            </button>
            {getDayNote && <span {...css.attrs(calendarBoardStyles.note)}>{getDayNote(iso)}</span>}
          </div>
          {shown.length > 0 && (
            <ul {...css.attrs(calendarBoardStyles.events)}>
              {shown.map((event, index) => (
                <li key={getEventKey?.(event) ?? index}>
                  {renderEvent ? (
                    renderEvent(event, iso)
                  ) : (
                    <span
                      {...css.attrs(
                        calendarBoardStyles.event,
                        statusToneSx('soft', getEventTone?.(event) ?? 'accent'),
                      )}
                    >
                      {getEventLabel?.(event) ?? ''}
                    </span>
                  )}
                </li>
              ))}
              {list.length > shown.length && (
                <li>
                  <button
                    type="button"
                    {...css.attrs(
                      buttonBaseStyles.root,
                      interactionTransitions.colors,
                      calendarBoardStyles.more,
                      focusRingStyles.tight,
                    )}
                    onClick={(event: MouseEvent) => {
                      event.stopPropagation();
                      calendar.activate(day);
                    }}
                  >
                    {lang.calendarBoardMore(list.length - shown.length)}
                  </button>
                </li>
              )}
            </ul>
          )}
          {renderDay?.(iso, dayState)}
        </td>
      );
    }

    return () => {
      const page = calendar.page;
      const title = format.date(page, { year: 'numeric', month: 'long' });
      const weeks = monthGrid(page, { ...locale.week, fixedWeeks: false });
      const names = weekdayNames(locale.locale, {
        firstDayOfWeek: locale.week.firstDayOfWeek,
        format: 'short',
      });
      return (
        <div
          {...mergeAttrs<'div'>({ sx: calendarBoardStyles.root }, rest, {
            ref: _toRef(root),
            role: 'group',
          })}
        >
          <div {...css.attrs(calendarBoardStyles.header)}>
            <span id={titleId} {...css.attrs(calendarBoardStyles.title)}>
              {title}
            </span>
            {toolbar}
            <Button
              {...mergePartProps<ButtonProps>(
                { size: 'sm', variant: 'soft', tone: 'neutral' },
                propsToday,
                {
                  onClick: () => {
                    calendar.focus(locale.today());
                    void nextTick(() =>
                      root?.querySelector<HTMLElement>('[data-day][data-focused]')?.focus(),
                    );
                  },
                },
              )}
            >
              {lang.dateRangePreset.today}
            </Button>
            <IconButton
              icon={ChevronLeft}
              aria-label={lang.calendarPreviousMonth}
              propsIcon={{ flipInRtl: true }}
              size="sm"
              disabled={!calendar.canTurnPage(-1)}
              onClick={() => calendar.turnPage(-1)}
            />
            <IconButton
              icon={ChevronRight}
              aria-label={lang.calendarNextMonth}
              propsIcon={{ flipInRtl: true }}
              size="sm"
              disabled={!calendar.canTurnPage(1)}
              onClick={() => calendar.turnPage(1)}
            />
          </div>
          <table
            {...css.attrs(calendarBoardStyles.grid)}
            role="grid"
            aria-labelledby={titleId}
            onKeydown={onKeydown}
            onPointerleave={() => calendar.hover(null)}
          >
            <thead>
              <tr>
                {names.map((name) => (
                  <th key={name} scope="col" {...css.attrs(calendarBoardStyles.weekday)}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week[0]!.toString()}>{week.map((day) => renderCell(day, page))}</tr>
              ))}
            </tbody>
          </table>
          {/* 翻页时播报新的月份 */}
          <VisuallyHidden aria-live="polite">{title}</VisuallyHidden>
        </div>
      );
    };
  },
);
