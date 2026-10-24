/**
 * 日历的界面（WAI-ARIA 的日期网格）：页头（上一页、标题、下一页）、并排的月份网格、月份视图与年份视图、页脚。
 * 状态由调用方的 useCalendarState 给（同 ListboxView 与 useListState 的分工）：Calendar、RangeCalendar、各种日期选择器共用。
 *
 *   const calendar = useCalendarState({ … });
 *   <CalendarView calendar={calendar} showWeekNumbers>{(date, cell) => …}</CalendarView>
 *
 * - 每个月一张 table role="grid"，日期格是 td role="gridcell"（aria-selected）里的按钮；焦点日期那一格 tabindex=0，
 *   键盘移动后焦点跟过去（handleCalendarKeydown）；读屏念的完整日期（今天、星期）由 Intl 生成；
 * - 标题按钮切到月份视图、再切到年份视图（不比选择的粒度更细）；翻页时用 aria-live 播报新的月份；
 * - 并排几个月时只显示本月的日期（补齐的上下月留空，不重复出现）；只有一个月时补齐的日期变淡、可以点。
 *
 * 部件：Root、Header、Previous、Next（IconButton）、Heading（标题按钮）、Months（并排的月份）、Grid（table）、
 * Weekday（星期表头）、WeekNumber（周数）、Cell（td）、CellButton（日期 / 月份 / 年份按钮）、Footer。
 */
import { ChevronLeft, ChevronRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { nextTick, useId, type VNodeChild } from 'vue';
import { buttonBaseStyles } from '../base/button-core';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { VisuallyHidden, visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useFormat } from '../config/lang/format';
import {
  monthGrid,
  monthsOfYear,
  weekdayNames,
  weekOfYear,
  yearsOfDecade,
} from '../utils/data/date';
import { isRtl } from '../utils/dom/direction';
import { hasContent, dataAttrs, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { interactionTransitions } from '../utils/style/transitions';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import {
  handleCalendarKeydown,
  type CalendarCellState,
  type CalendarState,
} from './calendar-state';
import { useDateLocale } from './date-locale';
import { useLang } from '../config/context';
import type { CalendarDate } from '@internationalized/date';
import { t } from '../config/theme/tokens';

/** 角色由组件管理 */
export type CalendarViewManaged = 'role';

/** 按项给的部件属性：固定的对象，或按这一格的日期（ISO）与状态返回 */
export type CalendarItemProps<P> = P | ((date: string, cell: CalendarCellState) => P);

/** 日历界面的外观与内容选项：Calendar、RangeCalendar、日期选择器原样转交 */
export interface CalendarViewOptions {
  /** 字号档位，格子随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 在每行前显示一年里的第几周 */
  showWeekNumbers?: boolean;
  /** 总是 6 行（翻页时高度不跳），默认 true */
  fixedWeeks?: boolean;
  /** 不可用：不能翻页、不能选 */
  disabled?: boolean;
  /**
   * 自定义日期格的内容（价格、标记点）：拿到日期（ISO）与这一格的状态；不写时是日期数字。
   * 读屏先念完整日期再念这里的文字：日期数字这类重复的部分可以加 aria-hidden
   */
  children?: (date: string, cell: CalendarCellState) => VNodeChild;
  /** 页脚：今天、清除这类按钮 */
  footer?: VNodeChild;
  /** 页头的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 上一页按钮的部件属性 */
  propsPrevious?: Omit<Partial<IconButtonProps>, 'disabled' | 'onClick'>;
  /** 下一页按钮的部件属性 */
  propsNext?: Omit<Partial<IconButtonProps>, 'disabled' | 'onClick'>;
  /** 标题按钮的部件属性 */
  propsHeading?: PartProps<'button', 'type' | 'aria-label'>;
  /** 并排月份那一层的部件属性 */
  propsMonths?: PartProps<'div'>;
  /** 每张网格（table）的部件属性 */
  propsGrid?: PartProps<'table', 'role' | 'aria-label' | 'aria-multiselectable'>;
  /** 星期表头的部件属性 */
  propsWeekday?: PartProps<'th', 'scope'>;
  /** 周数的部件属性 */
  propsWeekNumber?: PartProps<'th', 'scope' | 'aria-label'>;
  /** 每格（td）的部件属性 */
  propsCell?: CalendarItemProps<PartProps<'td', 'role' | 'aria-selected' | 'aria-disabled'>>;
  /** 每格里按钮的部件属性 */
  propsCellButton?: CalendarItemProps<
    PartProps<'button', 'type' | 'tabindex' | 'disabled' | 'aria-label' | 'aria-disabled'>
  >;
  /** 页脚的部件属性 */
  propsFooter?: PartProps<'div'>;
}

/** 未声明的属性落到根元素上（aria-label 等） */
export interface CalendarViewProps
  extends PartProps<'div', CalendarViewManaged>, CalendarViewOptions {
  /** 日历状态（useCalendarState） */
  calendar: CalendarState;
  /** 一周的第一天（0 表示周日），与 useCalendarState 的 week 一致；不写时取语言配置 */
  firstDayOfWeek?: number;
}

/** CalendarView 的样式：root、months、month、header、heading、grid、weekday、cell、button 等 */
export const calendarStyles = css.create({
  root: {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: '_sm',
    color: '_text',
    lineHeight: '_normal',
    userSelect: 'none',
  },
  months: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '_xl' },
  month: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  header: {
    display: 'grid',
    gridTemplateColumns: `max(${t.sizes.control}, ${t.sizes.minTarget}) 1fr max(${t.sizes.control}, ${t.sizes.minTarget})`,
    alignItems: 'center',
    gap: '_xs',
  },
  // 占住按钮的位置：并排几个月时中间的月没有翻页按钮，标题仍居中
  spacer: { width: `max(${t.sizes.control}, ${t.sizes.minTarget})` },
  heading: {
    display: 'inline-flex',
    alignItems: 'center',
    justifySelf: 'center',
    minHeight: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
    paddingInline: '_sm',
    borderRadius: '_md',
    fontWeight: '_semibold',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
  },
  headingStatic: {
    cursor: 'default',
    backgroundColor: { default: 'transparent', ':hover': 'transparent' },
  },
  grid: { borderCollapse: 'collapse', borderSpacing: 0 },
  // 月份、年份视图：一行 3 格，与日期网格同宽
  periodGrid: { width: `calc(7 * max(2.25em, ${t.sizes.minTarget}))` },
  weekday: {
    paddingBlock: '_xs',
    paddingInline: 0,
    color: '_textMuted',
    fontWeight: '_normal',
    textAlign: 'center',
  },
  weekNumber: {
    paddingInlineEnd: '_xs',
    color: '_textMuted',
    fontWeight: '_normal',
    textAlign: 'center',
  },
  cell: { padding: 0, textAlign: 'center' },
  // 区间的底色画在 td 上，相邻的格连成一条；两端与每行的首尾是圆的
  inRange: {
    backgroundColor: '_accentSoft',
    borderStartStartRadius: { default: 0, ':first-of-type': '_md' },
    borderEndStartRadius: { default: 0, ':first-of-type': '_md' },
    borderStartEndRadius: { default: 0, ':last-of-type': '_md' },
    borderEndEndRadius: { default: 0, ':last-of-type': '_md' },
  },
  rangeStart: { borderStartStartRadius: '_md', borderEndStartRadius: '_md' },
  rangeEnd: { borderStartEndRadius: '_md', borderEndEndRadius: '_md' },
  button: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: `max(2.25em, ${t.sizes.minTarget})`,
    height: `max(2.25em, ${t.sizes.minTarget})`,
    borderRadius: '_md',
    fontVariantNumeric: 'tabular-nums',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
  },
  periodButton: { width: '_full', height: `max(3em, ${t.sizes.minTarget})` },
  outside: { color: '_textMuted' },
  today: {
    fontWeight: '_semibold',
    boxShadow: `inset 0 0 0 ${t.borderWidths.xs} ${t.colors.accentBorder}`,
  },
  selected: {
    backgroundColor: { default: '_accent', ':hover': '_accentHover' },
    color: '_accentContrast',
    boxShadow: 'none',
  },
  // 区间中间的格：按钮透明，底色是 td 的那一条
  middle: {
    backgroundColor: { default: 'transparent', ':hover': '_accentSoftHover' },
    color: '_accentText',
  },
  unavailable: { color: '_textMuted', textDecorationLine: 'line-through' },
  disabled: {
    opacity: '_disabled',
    cursor: 'not-allowed',
    backgroundColor: { default: 'transparent', ':hover': 'transparent' },
  },
  footer: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '_sm' },
});

/** 网格行列：月份、年份视图一行 3 格 */
const chunk = <T,>(items: readonly T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, row) =>
    items.slice(row * size, row * size + size),
  );

const resolve = <P,>(
  props: CalendarItemProps<P> | undefined,
  date: string,
  cell: CalendarCellState,
) =>
  typeof props === 'function'
    ? (props as (date: string, cell: CalendarCellState) => P)(date, cell)
    : props;

/** 日历的界面：页头、月份网格（或月份、年份视图）、页脚 */
export const CalendarView = _component(
  ({
    calendar,
    firstDayOfWeek,
    size,
    showWeekNumbers = false,
    fixedWeeks = true,
    disabled = false,
    children,
    footer,
    propsHeader,
    propsPrevious,
    propsNext,
    propsHeading,
    propsMonths,
    propsGrid,
    propsWeekday,
    propsWeekNumber,
    propsCell,
    propsCellButton,
    propsFooter,
    ...rest
  }: CalendarViewProps) => {
    const format = useFormat();
    const locale = useDateLocale(() => ({ firstDayOfWeek }));
    const lang = useLang();
    const id = useId();
    const hintId = `${id}-hint`;
    let root = _state.raw<HTMLElement | null>(null);

    /** 键盘移动后把焦点交给新的焦点格（翻页、换视图后它是新渲染的） */
    function onKeydown(event: KeyboardEvent) {
      if (disabled || !root) return;
      if (!handleCalendarKeydown(calendar, event, isRtl(root))) return;
      event.preventDefault();
      void nextTick(() => root?.querySelector<HTMLElement>('[data-focused]')?.focus());
    }

    const title = (date: CalendarDate) => {
      if (calendar.view === 'day') return format.date(date, { year: 'numeric', month: 'long' });
      if (calendar.view === 'month') return format.date(date, { year: 'numeric' });
      const end = date.add({ years: 9 });
      return `${format.date(date, { year: 'numeric' })} – ${format.date(end, { year: 'numeric' })}`;
    };

    /**
     * 一格：td + 按钮；label 是读屏念的完整日期，content 是格子里显示的。
     * 读屏名称来自按钮里的文字而不是 aria-label：自定义内容（如房价）跟在完整日期后面一起念，
     * 名称总包含看得见的文字（中文日期里“20”不是单独的词，写成 aria-label 时对不上）；
     * 默认内容只是日期数字，不重复念。kind 为 period 时是月份、年份格
     */
    function cell(
      date: CalendarDate,
      month: CalendarDate | undefined,
      label: string,
      content: VNodeChild,
      kind: 'day' | 'custom' | 'period' = 'day',
    ) {
      const period = kind === 'period';
      const state = calendar.cell(date, month);
      const iso = locale.toIso(date);
      const off = disabled || state.disabled;
      const range = calendar.mode === 'range';
      const ends = range && (state.rangeStart || state.rangeEnd);
      const marked = range ? ends : state.selected;
      return (
        <td
          key={iso}
          {...mergeAttrs<'td'>(
            {
              sx: [
                calendarStyles.cell,
                state.inRange && calendarStyles.inRange,
                state.rangeStart && calendarStyles.rangeStart,
                state.rangeEnd && calendarStyles.rangeEnd,
              ],
            },
            resolve(propsCell, iso, state),
            {
              role: 'gridcell',
              'aria-selected': state.selected,
              'aria-disabled': off || undefined,
              ...dataAttrs({ 'data-in-range': state.inRange || undefined }),
            },
          )}
        >
          <button
            {...mergeAttrs<'button'>(
              {
                sx: [
                  buttonBaseStyles.root,
                  interactionTransitions.colors,
                  calendarStyles.button,
                  period && calendarStyles.periodButton,
                  focusRingStyles.tight,
                  state.outside && calendarStyles.outside,
                  state.today && calendarStyles.today,
                  state.unavailable && calendarStyles.unavailable,
                  state.inRange && !ends && calendarStyles.middle,
                  marked && calendarStyles.selected,
                  off && calendarStyles.disabled,
                ],
                'aria-describedby': calendar.anchor ? hintId : undefined,
              },
              resolve(propsCellButton, iso, state),
              {
                type: 'button',
                tabindex: state.focused && !state.outside ? 0 : -1,
                'aria-disabled': off || undefined,
                onClick: () => {
                  if (!off) calendar.activate(date);
                },
                // 点击、程序聚焦到别的格子时，键盘从这一格接着走
                onFocus: () => {
                  if (!state.focused) calendar.focus(date);
                },
                onPointerenter: () => calendar.hover(date),
                // 写在受管层而不是 JSX 上：元素上只有一处展开，不用再经 Vue 的 mergeProps（每页几百格）
                ...dataAttrs({
                  'data-date': iso,
                  'data-focused': (state.focused && !state.outside) || undefined,
                  'data-selected': state.selected || undefined,
                  'data-today': state.today || undefined,
                  'data-outside': state.outside || undefined,
                  'data-unavailable': state.unavailable || undefined,
                  'data-disabled': off || undefined,
                }),
              },
            )}
          >
            {/* 每格一个：直接用样式，不多建几百个组件实例 */}
            <span {...css.attrs(visuallyHiddenStyles.hidden)}>
              {state.today ? lang.calendarToday(label) : label}
            </span>
            {kind === 'custom' ? content : <span aria-hidden="true">{content}</span>}
          </button>
        </td>
      );
    }

    const gridAttrs = (label: string) =>
      mergeAttrs<'table'>(
        {
          sx: [calendarStyles.grid, calendar.view !== 'day' && calendarStyles.periodGrid],
        },
        propsGrid,
        {
          'aria-label': label,
          role: 'grid',
          'aria-multiselectable': calendar.mode !== 'single' || undefined,
          onKeydown,
          onPointerleave: () => calendar.hover(null),
        },
      );

    function dayGrid(month: CalendarDate, single: boolean) {
      const weeks = monthGrid(month, { ...locale.week, fixedWeeks });
      const names = weekdayNames(locale.locale, {
        firstDayOfWeek: locale.week.firstDayOfWeek,
        format: 'narrow',
      });
      const longNames = weekdayNames(locale.locale, {
        firstDayOfWeek: locale.week.firstDayOfWeek,
        format: 'long',
      });
      return (
        <table {...gridAttrs(title(month))}>
          <thead aria-hidden="true">
            <tr>
              {showWeekNumbers && (
                <th
                  {...mergeAttrs<'th'>({ sx: calendarStyles.weekNumber }, propsWeekNumber, {
                    scope: 'col',
                  })}
                >
                  {lang.calendarWeek}
                </th>
              )}
              {names.map((name, index) => (
                <th
                  key={index}
                  {...mergeAttrs<'th'>(
                    { sx: calendarStyles.weekday, title: longNames[index] },
                    propsWeekday,
                    {
                      scope: 'col',
                    },
                  )}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]!.toString()}>
                {showWeekNumbers && (
                  <th
                    {...mergeAttrs<'th'>({ sx: calendarStyles.weekNumber }, propsWeekNumber, {
                      'aria-label': lang.calendarWeekNumber(weekOfYear(week[0]!, locale.week)),
                      scope: 'row',
                    })}
                  >
                    {weekOfYear(week[0]!, locale.week)}
                  </th>
                )}
                {week.map((date) => {
                  const outside = date.month !== month.month;
                  // 并排几个月时补齐的日期留空：同一天不在两张网格里重复出现
                  if (outside && !single)
                    return <td key={date.toString()} {...css.attrs(calendarStyles.cell)} />;
                  return cell(
                    date,
                    month,
                    format.date(date, { dateStyle: 'full' }),
                    children
                      ? children(locale.toIso(date), calendar.cell(date, month))
                      : locale.dayNumber(date),
                    children ? 'custom' : 'day',
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    function periodGrid() {
      const page = calendar.page;
      const month = calendar.view === 'month';
      const items = month ? monthsOfYear(page) : yearsOfDecade(page);
      return (
        <table {...gridAttrs(title(page))}>
          <tbody>
            {chunk(items, 3).map((row) => (
              <tr key={row[0]!.toString()}>
                {row.map((date) =>
                  cell(
                    date,
                    undefined,
                    month
                      ? format.date(date, { year: 'numeric', month: 'long' })
                      : format.date(date, { year: 'numeric' }),
                    month
                      ? format.date(date, { month: 'short' })
                      : format.date(date, { year: 'numeric' }),
                    'period',
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return () => {
      const view = calendar.view;
      const months = calendar.months;
      const coarser = view === 'day' ? 'month' : view === 'month' ? 'year' : undefined;
      const [previousLabel, nextLabel] =
        view === 'day'
          ? [lang.calendarPreviousMonth, lang.calendarNextMonth]
          : view === 'month'
            ? [lang.calendarPreviousYear, lang.calendarNextYear]
            : [lang.calendarPreviousDecade, lang.calendarNextDecade];
      const previous = (
        <IconButton
          {...mergePartProps<IconButtonProps>(
            { icon: ChevronLeft, 'aria-label': previousLabel, propsIcon: { flipInRtl: true } },
            propsPrevious,
            {
              disabled: disabled || !calendar.canTurnPage(-1),
              onClick: () => calendar.turnPage(-1),
            },
          )}
        />
      );
      const next = (
        <IconButton
          {...mergePartProps<IconButtonProps>(
            { icon: ChevronRight, 'aria-label': nextLabel, propsIcon: { flipInRtl: true } },
            propsNext,
            { disabled: disabled || !calendar.canTurnPage(1), onClick: () => calendar.turnPage(1) },
          )}
        />
      );
      const spacer = <span {...css.attrs(calendarStyles.spacer)} />;
      return (
        <div
          {...mergeAttrs<'div'>({ sx: [calendarStyles.root, size && fontSizeStyles[size]] }, rest, {
            ref: _toRef(root),
            role: 'group',
          })}
          data-view={view}
          data-disabled={disabled || undefined}
        >
          <div {...mergeAttrs<'div'>({ sx: calendarStyles.months }, propsMonths)}>
            {months.map((month, index) => {
              const label = title(month);
              return (
                <div key={month.toString()} {...css.attrs(calendarStyles.month)}>
                  <div {...mergeAttrs<'div'>({ sx: calendarStyles.header }, propsHeader)}>
                    {index === 0 ? previous : spacer}
                    {coarser && !disabled ? (
                      <button
                        {...mergeAttrs<'button'>(
                          {
                            sx: [
                              buttonBaseStyles.root,
                              interactionTransitions.colors,
                              calendarStyles.heading,
                              focusRingStyles.visible,
                            ],
                          },
                          propsHeading,
                          {
                            'aria-label':
                              coarser === 'month'
                                ? lang.calendarChooseMonth(label)
                                : lang.calendarChooseYear(label),
                            type: 'button',
                            onClick: () => calendar.setView(coarser),
                          },
                        )}
                      >
                        {label}
                      </button>
                    ) : (
                      // 已经是最粗的视图（或不可用）：标题只是文字
                      <span {...css.attrs(calendarStyles.heading, calendarStyles.headingStatic)}>
                        {label}
                      </span>
                    )}
                    {index === months.length - 1 ? next : spacer}
                  </div>
                  {view === 'day' ? dayGrid(month, months.length === 1) : periodGrid()}
                </div>
              );
            })}
          </div>
          {/* 翻页、换视图时播报新的标题；不放在标题按钮上，免得聚焦按钮时重复念 */}
          <VisuallyHidden aria-live="polite">{months.map(title).join('，')}</VisuallyHidden>
          {calendar.anchor && <VisuallyHidden id={hintId}>{lang.calendarPickEnd}</VisuallyHidden>}
          {hasContent(footer) && (
            <div {...mergeAttrs<'div'>({ sx: calendarStyles.footer }, propsFooter)}>{footer}</div>
          )}
        </div>
      );
    };
  },
);
