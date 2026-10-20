/**
 * 日历的状态（WAI-ARIA 日期网格的数据层）：焦点日期、显示哪一页、单选 / 区间 / 多选、区间悬停预览、键盘操作。
 * 不碰 DOM：Calendar 渲染网格，焦点日期那一格 tabindex=0，键盘移动后把焦点移过去。
 * 参考 React Aria 的 useCalendarState / useRangeCalendarState。
 *
 * 三种视图：day（月份网格）、month（一年的各月）、year（一个十年）。unit 是选择的粒度：
 * Calendar 是 day，MonthPicker 是 month；在比 unit 粗的视图里点一格是“进到这一格”（年 → 月 → 日），不是选中。
 *
 *   const calendar = useCalendarState({ mode: () => 'single', selected: () => (date ? [date] : []), onChange, … });
 *   if (handleCalendarKeydown(calendar, event, isRtl(grid))) event.preventDefault();
 */
import {
  endOfWeek,
  startOfWeek,
  type CalendarDate,
  type DateDuration,
} from '@internationalized/date';
import { computed, ref, shallowRef } from 'vue';
import {
  clampDate,
  compareDates,
  isDateDisabled,
  isInRange,
  isOutOfRange,
  isOutsideDecade,
  isSameDate,
  orderedRange,
  rangeHasUnavailable,
  toDayOfWeek,
  type DateLimits,
  type DateRange,
  type DateUnit,
  type WeekOptions,
} from '../utils/data/date';

/** 日期的选择方式 */
export interface CalendarSelectionModes {
  /** 单选一天 */
  single: unknown;
  /** 选一个区间：先点开始、再点结束，中间悬停时预览 */
  range: unknown;
  /** 多选：每天独立切换 */
  multiple: unknown;
}

/** 日期的选择方式 */
export type CalendarSelectionMode = keyof CalendarSelectionModes;

/** useCalendarState 的选项：都是读取函数，props 变化时跟着变 */
export interface CalendarStateOptions {
  /** 选择方式 */
  mode: () => CalendarSelectionMode;
  /** 已选的日期：单选一个、区间是 [开始, 结束]、多选若干；没有时空数组 */
  selected: () => readonly CalendarDate[];
  /** 选择变化：单选 [日期]，区间 [开始, 结束]（已排好序），多选是新的列表 */
  onChange: (dates: readonly CalendarDate[]) => void;
  /** 今天（按语言的时区与日历）：没有已选日期时焦点从这里开始 */
  today: () => CalendarDate;
  /** 可选范围与不可选的日期 */
  limits: () => DateLimits;
  /** 一周的排法：Home / End、月份网格都按它 */
  week: () => WeekOptions;
  /** 选择的粒度，默认 day；MonthPicker 是 month，YearPicker 是 year */
  unit?: () => DateUnit;
  /** 并排显示几个月（只在 day 视图），默认 1 */
  visibleMonths?: () => number;
  /** 区间里允许夹着不可选的日期，默认 false：选了开始之后，越过不可选日期的那一侧都不能再选 */
  allowsUnavailableInRange?: () => boolean;
  /** 只读：能翻页、移动焦点，不能改选择 */
  readonly?: () => boolean;
  /** 没有已选日期时一开始显示哪天所在的页（如酒店预订默认显示下个月）；不写时是今天 */
  defaultFocused?: () => CalendarDate | null | undefined;
}

/** 一格的状态：渲染与 data 属性用 */
export interface CalendarCellState {
  /** 已选（区间里是两端与中间的每一天） */
  selected: boolean;
  /** 不能选：范围外、不可选、或区间选到一半时越过了不可选的日期 */
  disabled: boolean;
  /** 是不可选的日期（isUnavailable）：画删除线 */
  unavailable: boolean;
  /** 今天（这个月、今年） */
  today: boolean;
  /** 焦点所在的格：tabindex=0 */
  focused: boolean;
  /** 不在这一页：月份网格里补齐的上下月、年份视图里补上的两年 */
  outside: boolean;
  /** 区间的开始 */
  rangeStart: boolean;
  /** 区间的结束 */
  rangeEnd: boolean;
  /** 在区间里（含两端；选到一半时是预览的区间） */
  inRange: boolean;
}

/** 日历的状态与操作 */
export interface CalendarState {
  /** 当前视图 */
  readonly view: DateUnit;
  /** 选择的粒度 */
  readonly unit: DateUnit;
  /** 焦点日期：总是精确到天，切到 month、year 视图再回来时回到原来那天 */
  readonly focused: CalendarDate;
  /** 当前页的第一格：day 视图是第一个月的 1 日，month 视图是这年 1 月 1 日，year 视图是十年的第一年 */
  readonly page: CalendarDate;
  /** day 视图里并排的各月（每月 1 日）；其他视图只有 page */
  readonly months: readonly CalendarDate[];
  /** 区间：已选的，或选到一半时从开始到悬停 / 焦点日期的预览 */
  readonly range: DateRange | null;
  /** 区间选到一半：已经点了的开始 */
  readonly anchor: CalendarDate | null;
  /** 已选的日期有不能选的（范围外、不可选，或区间里夹着不可选的日期） */
  readonly invalid: boolean;
  /** 一周的排法 */
  readonly week: WeekOptions;
  /** 切换视图（不能比选择的粒度更细） */
  setView(view: DateUnit): void;
  /** 移动焦点日期（夹到可选范围内），移出当前页时翻页 */
  focus(date: CalendarDate): void;
  /** 翻页：day 视图一次翻并排的月数，month 视图一年，year 视图十年；焦点跟着走 */
  turnPage(direction: 1 | -1): void;
  /** 这个方向还能不能翻页（整页都在可选范围之外时不能） */
  canTurnPage(direction: 1 | -1): boolean;
  /** 点了一格：当前视图是选择的粒度时选中，否则进到这一格（年 → 月 → 日） */
  activate(date: CalendarDate): void;
  /** 指针悬停的日期：区间选到一半时预览；离开网格时传 null */
  hover(date: CalendarDate | null): void;
  /** 一格的状态；month 是这格所在的月份网格（判断是不是补齐的上下月） */
  cell(date: CalendarDate, month?: CalendarDate): CalendarCellState;
  /** 取消选到一半的区间（Esc） */
  cancelRange(): void;
}

/** 视图从粗到细 */
const VIEWS: readonly DateUnit[] = ['year', 'month', 'day'];

/** 日历状态（组件 setup 里调用） */
export function useCalendarState(config: CalendarStateOptions): CalendarState {
  const unit = () => config.unit?.() ?? 'day';
  const visibleMonths = () => Math.max(1, config.visibleMonths?.() ?? 1);

  const view = ref<DateUnit>(unit());
  const anchor = shallowRef<CalendarDate | null>(null);
  const hovered = shallowRef<CalendarDate | null>(null);
  const initial = config.selected()[0] ?? config.defaultFocused?.() ?? config.today();
  const focused = shallowRef(clampDate(initial, config.limits()));
  const page = shallowRef(pageOf(focused.value, view.value));

  /** 日期所在页的第一格 */
  function pageOf(date: CalendarDate, current: DateUnit): CalendarDate {
    if (current === 'year')
      return date.set({ year: Math.floor(date.year / 10) * 10, month: 1, day: 1 });
    if (current === 'month') return date.set({ month: 1, day: 1 });
    return date.set({ day: 1 });
  }

  /** 一页的跨度 */
  function pageSize(current: DateUnit): DateDuration {
    if (current === 'year') return { years: 10 };
    if (current === 'month') return { years: 1 };
    return { months: visibleMonths() };
  }

  const pageEnd = () => page.value.add(pageSize(view.value)).subtract({ days: 1 });

  /** 焦点移出当前页时翻页：往前移出时焦点所在的月排在最后，往后移出时排在最前（同 React Aria） */
  function followFocus() {
    const date = focused.value;
    if (date.compare(page.value) >= 0 && date.compare(pageEnd()) <= 0) return;
    const backward = date.compare(page.value) < 0;
    page.value =
      backward && view.value === 'day'
        ? date.set({ day: 1 }).subtract({ months: visibleMonths() - 1 })
        : pageOf(date, view.value);
  }

  // 区间选到一半、不允许夹着不可选的日期时：开始两侧最近的不可选日期之内才能选
  const limits = computed((): DateLimits => {
    const base = config.limits();
    const start = anchor.value;
    if (!start || !base.isUnavailable || config.allowsUnavailableInRange?.()) return base;
    const bound = (step: 1 | -1, edge: CalendarDate | null | undefined) => {
      // 最多找一年：再远的不会出现在同一次选择里
      let date = start;
      for (let offset = 0; offset < 366; offset++) {
        const next = date.add({ days: step });
        if (edge && compareDates(next, edge) * step > 0) return edge;
        if (base.isUnavailable!(next)) return date;
        date = next;
      }
      return edge;
    };
    return { ...base, min: bound(-1, base.min), max: bound(1, base.max) };
  });

  const selectedRange = computed((): DateRange | null => {
    const [start, end] = config.selected();
    return config.mode() === 'range' && start && end ? orderedRange(start, end) : null;
  });

  const range = computed((): DateRange | null => {
    if (config.mode() !== 'range') return null;
    if (!anchor.value) return selectedRange.value;
    return orderedRange(anchor.value, clampDate(hovered.value ?? focused.value, limits.value));
  });

  const invalid = computed(() => {
    const base = config.limits();
    if (config.selected().some((date) => isDateDisabled(date, base, unit()))) return true;
    const picked = selectedRange.value;
    return (
      picked != null &&
      !config.allowsUnavailableInRange?.() &&
      rangeHasUnavailable(picked, base.isUnavailable)
    );
  });

  function select(date: CalendarDate) {
    if (config.readonly?.() || isDateDisabled(date, limits.value, unit())) return;
    const current = config.selected();
    const same = (item: CalendarDate) => isSameDate(item, date, unit());
    switch (config.mode()) {
      case 'single':
        if (!current.some(same)) config.onChange([date]);
        return;
      case 'multiple':
        config.onChange(
          current.some(same) ? current.filter((item) => !same(item)) : [...current, date],
        );
        return;
      case 'range': {
        if (!anchor.value) {
          anchor.value = date;
          return;
        }
        const picked = orderedRange(anchor.value, date);
        anchor.value = null;
        hovered.value = null;
        config.onChange([picked.start, picked.end]);
      }
    }
  }

  const state: CalendarState = {
    get view() {
      return view.value;
    },
    get unit() {
      return unit();
    },
    get focused() {
      return focused.value;
    },
    get page() {
      return page.value;
    },
    get months() {
      if (view.value !== 'day') return [page.value];
      return Array.from({ length: visibleMonths() }, (_, index) =>
        page.value.add({ months: index }),
      );
    },
    get range() {
      return range.value;
    },
    get anchor() {
      return anchor.value;
    },
    get invalid() {
      return invalid.value;
    },
    get week() {
      return config.week();
    },
    setView(next) {
      if (VIEWS.indexOf(next) > VIEWS.indexOf(unit())) return;
      view.value = next;
      page.value = pageOf(focused.value, next);
    },
    focus(date) {
      focused.value = isOutOfRange(date, limits.value, view.value)
        ? clampDate(date, limits.value)
        : date;
      followFocus();
    },
    turnPage(direction) {
      if (!state.canTurnPage(direction)) return;
      const size = pageSize(view.value);
      const move = (date: CalendarDate) => (direction > 0 ? date.add(size) : date.subtract(size));
      page.value = move(page.value);
      focused.value = clampDate(move(focused.value), limits.value);
      // 夹回范围后可能不在翻到的这页了：焦点落到这页里可选的第一天
      if (focused.value.compare(page.value) < 0 || focused.value.compare(pageEnd()) > 0) {
        focused.value = clampDate(page.value, limits.value);
      }
    },
    canTurnPage(direction) {
      const { min, max } = config.limits();
      if (direction < 0) return min == null || page.value.subtract({ days: 1 }).compare(min) >= 0;
      return max == null || page.value.add(pageSize(view.value)).compare(max) <= 0;
    },
    activate(date) {
      if (view.value === unit()) {
        state.focus(date);
        select(date);
        return;
      }
      // 进到下一级视图：焦点保留原来的月、日（这个月没有那天时取最后一天）
      const finer = VIEWS[VIEWS.indexOf(view.value) + 1]!;
      const next =
        view.value === 'year'
          ? focused.value.set({ year: date.year })
          : focused.value.set({ year: date.year, month: date.month });
      view.value = finer;
      focused.value = clampDate(next, limits.value);
      page.value = pageOf(focused.value, finer);
    },
    hover(date) {
      hovered.value = date;
    },
    cancelRange() {
      anchor.value = null;
      hovered.value = null;
    },
    cell(date, month) {
      const current = view.value;
      const preview = range.value;
      const inRange = isInRange(date, preview, current);
      return {
        selected:
          config.mode() === 'range'
            ? inRange
            : config.selected().some((item) => isSameDate(item, date, current)),
        disabled: isDateDisabled(date, limits.value, current),
        unavailable: current === 'day' && (config.limits().isUnavailable?.(date) ?? false),
        today: isSameDate(date, config.today(), current),
        focused: isSameDate(date, focused.value, current),
        outside:
          current === 'day'
            ? month != null && !isSameDate(date, month, 'month')
            : current === 'year' && isOutsideDecade(date, page.value),
        rangeStart: preview != null && isSameDate(date, preview.start, current),
        rangeEnd: preview != null && isSameDate(date, preview.end, current),
        inRange,
      };
    },
  };
  return state;
}

/**
 * 日期网格的键盘操作（WAI-ARIA Date Picker Dialog 的网格部分）：
 * day 视图里 ←→ 一天（从右到左排版时反过来）、↑↓ 一周，Page Up / Down 一个月、加 Shift 一年，Home / End 到这周的第一天 / 最后一天；
 * month、year 视图里 ←→ 一格、↑↓ 一行（3 格），Page Up / Down 翻一页，Home / End 到这页的两端；
 * Enter / 空格选中（或进到下一级视图）；Esc 取消选到一半的区间（没有时不处理，交给弹层关闭）。
 * 返回是否处理了这个按键（处理了就该 preventDefault）
 */
export function handleCalendarKeydown(
  state: CalendarState,
  event: KeyboardEvent,
  rtl = false,
): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return false;
  const date = state.focused;
  const forward = rtl ? -1 : 1;
  const { locale, firstDayOfWeek } = state.week;
  const first = toDayOfWeek(firstDayOfWeek);
  const actions: Record<string, (() => void) | undefined> =
    state.view === 'day'
      ? {
          ArrowRight: () => state.focus(date.add({ days: forward })),
          ArrowLeft: () => state.focus(date.subtract({ days: forward })),
          ArrowDown: () => state.focus(date.add({ weeks: 1 })),
          ArrowUp: () => state.focus(date.subtract({ weeks: 1 })),
          PageDown: () => state.focus(date.add(event.shiftKey ? { years: 1 } : { months: 1 })),
          PageUp: () => state.focus(date.subtract(event.shiftKey ? { years: 1 } : { months: 1 })),
          Home: () => state.focus(startOfWeek(date, locale, first)),
          End: () => state.focus(endOfWeek(date, locale, first)),
        }
      : gridActions(state, forward);
  actions.Enter = () => state.activate(date);
  actions[' '] = actions.Enter;
  if (state.anchor) actions.Escape = () => state.cancelRange();
  const action = actions[event.key];
  if (!action) return false;
  action();
  return true;
}

/** month、year 视图：3 列的网格，一格是一个月或一年 */
function gridActions(state: CalendarState, forward: number): Record<string, () => void> {
  const date = state.focused;
  const cell: keyof DateDuration = state.view === 'month' ? 'months' : 'years';
  const pageSize: DateDuration = state.view === 'month' ? { years: 1 } : { years: 10 };
  const by = (amount: number) => () => state.focus(date.add({ [cell]: amount }));
  // year 视图的一页是十年（前后补上的两年属于别的页）；month 视图是这一年
  const last =
    state.view === 'month'
      ? state.page.set({ month: state.page.calendar.getMonthsInYear(state.page) })
      : state.page.add({ years: 9 });
  return {
    ArrowRight: by(forward),
    ArrowLeft: by(-forward),
    ArrowDown: by(3),
    ArrowUp: by(-3),
    PageDown: () => state.focus(date.add(pageSize)),
    PageUp: () => state.focus(date.subtract(pageSize)),
    Home: () =>
      state.focus(
        state.view === 'month' ? date.set({ month: 1 }) : date.set({ year: state.page.year }),
      ),
    End: () =>
      state.focus(
        state.view === 'month' ? date.set({ month: last.month }) : date.set({ year: last.year }),
      ),
  };
}
