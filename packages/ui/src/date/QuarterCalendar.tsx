/**
 * 季度面板：一年一页的四个季度（季度报表、考核周期），翻页换年；选一个季度，或选一段区间（先开始、再结束）。
 * DatePicker、DateRangePicker 的 granularity="quarter" 弹出的就是它，也可以单独放在页面上。
 *
 *   <QuarterCalendar value={_bind(quarter)} aria-label="考核季度" />               // '2026-Q4'
 *   <QuarterCalendar mode="range" value={_bind(range)} aria-label="对比区间" />    // { start: '2026-Q1', end: '2026-Q3' }
 *
 * 外观与 Calendar 的月份视图一致（同一套 calendarStyles）：一行四格，区间连成一条，本季度带描边。
 * 焦点在当前季度上（roving tabindex）：←→ 移动（到头时换年；从右到左排版时反过来），Home / End 到第一、第四季度，
 * Page Up / Down 换年，Enter / 空格选中；区间选到一半时悬停预览，Esc 取消。整段在 min–max 之外的季度不可用。
 *
 * 部件：Root（div，role="group"）、Header、Previous、Next（IconButton）、Heading、Grid（table）、Cell、CellButton。
 */
import { ChevronLeft, ChevronRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { nextTick, useId } from 'vue';
import { buttonBaseStyles } from '../base/button-core';
import { IconButton } from '../base/IconButton';
import { VisuallyHidden, visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { toIsoQuarter, type DateRange } from '../utils/data/date';
import { isRtl } from '../utils/dom/direction';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { interactionTransitions } from '../utils/style/transitions';
import { calendarStyles } from './CalendarView';
import { isPeriodDisabled } from './DateField';
import { toDateLimits, useDateLocale, type DateInput } from './date-locale';

/** 未声明的属性落到根元素上（aria-label 等） */
export interface QuarterCalendarProps extends PartProps<'div', 'role'> {
  /** 选一个季度（默认），或选一段区间 */
  mode?: 'single' | 'range';
  /** 单选时是 'YYYY-Qn'，区间时是 `{ start, end }`：父级写 value={_bind(x)}；没有时 null */
  value?: string | DateRange<string> | null;
  /** 最早可选的日期：整个季度都早于它时不可用 */
  min?: DateInput;
  /** 最晚可选的日期：整个季度都晚于它时不可用 */
  max?: DateInput;
  /** 不可用：不能翻页、不能选 */
  disabled?: boolean;
  /** 只读：能翻页、移动焦点，不能改选择 */
  readonly?: boolean;
  /** 选好了（单选选了一个，区间选了结束）：日期选择器据此关闭弹层 */
  onPick?: () => void;
}

const quarterKey = (year: number, quarter: number) =>
  `${String(year).padStart(4, '0')}-Q${quarter}`;
const yearOf = (key: string) => Number(key.slice(0, 4));
const quarterOf = (key: string) => Number(key.slice(6));
/** 两个季度排好序（'YYYY-Qn' 按字符串比较就是先后） */
const ordered = (a: string, b: string): DateRange<string> =>
  a <= b ? { start: a, end: b } : { start: b, end: a };

/** 季度面板：四个季度一页，单选或区间 */
export const QuarterCalendar = _component(
  ({
    mode = 'single',
    value = _bindable<string | DateRange<string> | null>(null),
    min,
    max,
    disabled = false,
    readonly = false,
    onPick,
    ...rest
  }: QuarterCalendarProps) => {
    const lang = useLang();
    const locale = useDateLocale();
    const hintId = useId();
    const limits = _derived(toDateLimits(locale, { min, max }));
    const current = () => toIsoQuarter(locale.today());
    const chosen = () => (value == null ? null : typeof value === 'string' ? value : value.start);
    // 一开始显示已选（没有时是本季度）那一年，焦点也在它上面
    let focused = _state(chosen() ?? current());
    let year = _state(_untrack(yearOf(focused)));
    // 区间：选了开始、还没选结束时的开始，与悬停的季度（预览）
    let anchor = _state<string | null>(null);
    let hovered = _state<string | null>(null);
    let root = _state.raw<HTMLElement | null>(null);

    const off = (key: string) => isPeriodDisabled(key, 'quarter', limits, locale);
    const range = (): DateRange<string> | null => {
      if (mode !== 'range') return null;
      if (anchor) return ordered(anchor, hovered ?? anchor);
      return value != null && typeof value !== 'string' ? value : null;
    };

    function pick(key: string) {
      if (disabled || readonly || off(key)) return;
      focused = key;
      if (mode === 'single') {
        value = key;
        onPick?.();
        return;
      }
      if (!anchor) {
        anchor = key;
        hovered = key;
        return;
      }
      value = ordered(anchor, key);
      anchor = null;
      hovered = null;
      onPick?.();
    }

    /** 焦点移到 key（换到它那一年），再把 DOM 焦点交过去 */
    function moveTo(key: string) {
      focused = key;
      year = yearOf(key);
      if (anchor) hovered = key;
      void nextTick(() => root?.querySelector<HTMLElement>('[data-focused]')?.focus());
    }

    function onKeydown(event: KeyboardEvent) {
      if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
      const quarter = quarterOf(focused);
      const at = yearOf(focused);
      const forward = root && isRtl(root) ? 'ArrowLeft' : 'ArrowRight';
      const backward = forward === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
      const step = (delta: number) => {
        const index = at * 4 + quarter - 1 + delta;
        moveTo(quarterKey(Math.floor(index / 4), (index % 4) + 1));
      };
      switch (event.key) {
        case forward:
          step(1);
          break;
        case backward:
          step(-1);
          break;
        case 'Home':
          moveTo(quarterKey(at, 1));
          break;
        case 'End':
          moveTo(quarterKey(at, 4));
          break;
        case 'PageUp':
          moveTo(quarterKey(at - 1, quarter));
          break;
        case 'PageDown':
          moveTo(quarterKey(at + 1, quarter));
          break;
        case 'Escape':
          // 取消选到一半的区间；没有时交给弹层关闭
          if (!anchor) return;
          anchor = null;
          hovered = null;
          break;
        default:
          return;
      }
      event.preventDefault();
    }

    return () => {
      const preview = range();
      const today = current();
      const heading = String(year);
      return (
        <div
          {...mergeAttrs<'div'>({ sx: calendarStyles.root }, rest, {
            ref: _toRef(root),
            role: 'group',
          })}
          data-view="quarter"
          data-disabled={disabled || undefined}
        >
          <div {...css.attrs(calendarStyles.header)}>
            <IconButton
              icon={ChevronLeft}
              aria-label={lang.calendarPreviousYear}
              propsIcon={{ flipInRtl: true }}
              disabled={disabled}
              onClick={() => (year -= 1)}
            />
            <span {...css.attrs(calendarStyles.heading, calendarStyles.headingStatic)}>
              {lang.calendarYear(year)}
            </span>
            <IconButton
              icon={ChevronRight}
              aria-label={lang.calendarNextYear}
              propsIcon={{ flipInRtl: true }}
              disabled={disabled}
              onClick={() => (year += 1)}
            />
          </div>
          <table
            {...css.attrs(calendarStyles.grid, calendarStyles.periodGrid)}
            role="grid"
            aria-label={lang.calendarYear(year)}
            aria-multiselectable={mode === 'range' || undefined}
            onKeydown={onKeydown}
          >
            <tbody>
              <tr>
                {[1, 2, 3, 4].map((quarter) => {
                  const key = quarterKey(year, quarter);
                  const disabledHere = disabled || off(key);
                  const inRange = preview != null && key >= preview.start && key <= preview.end;
                  const ends = preview != null && (key === preview.start || key === preview.end);
                  const selected = mode === 'range' ? inRange : value === key;
                  const isFocused = key === focused || (yearOf(focused) !== year && quarter === 1);
                  return (
                    <td
                      key={key}
                      role="gridcell"
                      aria-selected={selected}
                      aria-disabled={disabledHere || undefined}
                      {...css.attrs(
                        calendarStyles.cell,
                        inRange && calendarStyles.inRange,
                        preview != null && key === preview.start && calendarStyles.rangeStart,
                        preview != null && key === preview.end && calendarStyles.rangeEnd,
                      )}
                    >
                      <button
                        type="button"
                        tabindex={isFocused ? 0 : -1}
                        aria-disabled={disabledHere || undefined}
                        aria-describedby={anchor ? hintId : undefined}
                        {...css.attrs(
                          buttonBaseStyles.root,
                          interactionTransitions.colors,
                          calendarStyles.button,
                          calendarStyles.periodButton,
                          focusRingStyles.tight,
                          key === today && calendarStyles.today,
                          inRange && !ends && calendarStyles.middle,
                          (mode === 'range' ? ends : selected) && calendarStyles.selected,
                          disabledHere && calendarStyles.disabled,
                        )}
                        data-quarter={key}
                        data-focused={isFocused || undefined}
                        data-selected={selected || undefined}
                        data-disabled={disabledHere || undefined}
                        onClick={() => pick(key)}
                        onFocus={() => (focused = key)}
                        onPointerenter={() => anchor && (hovered = key)}
                      >
                        <span {...css.attrs(visuallyHiddenStyles.hidden)}>
                          {lang.dateFieldPeriodPatterns.quarter
                            .replace('{year}', String(year))
                            .replace('{quarter}', String(quarter))}
                        </span>
                        <span aria-hidden="true">{lang.calendarQuarter(quarter)}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
          <VisuallyHidden aria-live="polite">{heading}</VisuallyHidden>
          {anchor && <VisuallyHidden id={hintId}>{lang.calendarPickEnd}</VisuallyHidden>}
        </div>
      );
    };
  },
);
