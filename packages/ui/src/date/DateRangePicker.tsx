/**
 * 日期区间选择器：一个输入框里两组分段（开始 – 结束），按钮弹出区间日历，旁边可以放快捷区间（最近 7 天、本月……）。
 * 参考 React Aria DateRangePicker（同一个外壳里两组 DateInput）、Ant Design RangePicker 的 presets。
 *
 *   <Field label="统计区间"><DateRangePicker value={_bind(range)} max={today} presets={['last7Days', 'thisMonth']} /></Field>
 *   <DateRangePicker granularity="month" value={_bind(months)} aria-label="预算期间" />      // { start: '2026-01', end: '2026-06' }
 *   <DateRangePicker granularity="minute" value={_bind(window)} aria-label="维护窗口" />   // '2026-10-24T22:00' – '2026-10-25T06:00'
 *
 * 值是 `{ start, end }`（两端都含；ISO 字符串或 DateValue，写回时保持同一种类型），两端都填好才写回，删掉一段写回 null。
 * granularity 同 DateField：month、year 按月、按年（日历选整月、整年），quarter 弹出季度面板选一段季度，
 * week 按 ISO 周（日历周一开始、行首是周数），hour / minute / second 是日期时间区间
 * （日历里选日期，开始补 00:00、结束补 23:59，已经填了的时间不变）。
 * 结束早于开始、超出范围、是不可选的日期时外壳显示出错，值照样写回，由表单校验决定能不能提交。
 * 开始那组刚填全时焦点自动进结束那组；日历里点开始、再点结束后关闭，焦点回到按钮。Esc、点外部关闭，分段里 Alt + ↓ 打开。
 *
 * 部件：Root（外壳，role="group"，主元素）、Start / End（两组分段）、Separator、Clear、Button、Popover、Presets、Calendar。
 */
import { CalendarRange } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { useId, watch } from 'vue';
import type { PresetIconButtonProps } from '../base/CloseButton';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import {
  controlClear,
  controlSx,
  focusOnShell,
  controlIcon,
  useControlAppearance,
  type ControlIconOptions,
  type ControlOptions,
} from '../input/control';
import {
  clampDate,
  fullIsoDay,
  lastIsoDay,
  parseIsoDate,
  presetIsoRange,
  toIsoDate,
  toIsoQuarter,
  toIsoWeek,
  type DateRange,
  type DateRangePreset,
} from '../utils/data/date';
import { toElement } from '../utils/dom/element';
import { openSetter, type OpenChangeProps } from '../utils/dom/open-change';
import { defaultLabelledBy, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  toDateLimits,
  useDateLocale,
  type DateInput,
  type DateLimitProps,
  type DateValueTypes,
} from './date-locale';
import { segmentFields, type DateFieldGranularity } from './date-segments';
import {
  dateUnitOf,
  isoToValue,
  isPeriodDisabled,
  isTimeGranularity,
  valueToIso,
} from './DateField';
import { DateSegmentGroup, type DateSegmentGroupProps } from './DateSegmentGroup';
import {
  focusCalendar,
  renderPickerPresets,
  usePickerPopover,
  type PickerPopoverParts,
} from './picker-popover';
import { QuarterCalendar } from './QuarterCalendar';
import { RangeCalendar, type RangeCalendarProps } from './RangeCalendar';
import { firstSegmentOf, segmentedFieldStyles, useFieldSegments } from './SegmentedField';

/** 自定义的快捷区间（财年、上个结算周期） */
export interface DateRangeCustomPreset<V extends DateInput = string> {
  /** 按钮上的文字 */
  label: string;
  /** 区间；函数时每次打开按当时算（跟着今天变） */
  value: DateRange<V> | (() => DateRange<V>);
}

/** 未声明的属性落到外壳（role="group"）上 */
export interface DateRangePickerProps<V extends DateInput = string>
  extends
    PartProps<'div', 'role'>,
    ControlOptions,
    ControlIconOptions,
    DateLimitProps,
    PickerPopoverParts,
    OpenChangeProps {
  /** 区间（两端都含）：父级写 value={_bind(x)}；没填全时 null */
  value?: DateRange<V> | null;
  /** 弹层是否打开：父级可写 open={_bind(x)} */
  open?: boolean;
  /** 值为空、推不出类型时写回哪一种，默认 iso（字符串） */
  valueType?: keyof DateValueTypes;
  /** 精确到哪一段（同 DateField），默认 day；month、year 按月、按年，hour / minute / second 是日期时间区间 */
  granularity?: DateFieldGranularity;
  /**
   * 快捷区间，显示在日历旁边、夹到 min–max 之内：内置的名字（按今天与语言的一周第一天算），
   * 或自己的 `{ label, value }`（value 可以是函数，每次打开时按当时算）
   */
  presets?: readonly (DateRangePreset | DateRangeCustomPreset<V>)[];
  /** 日历并排显示几个月，默认 2 */
  visibleMonths?: number;
  /** 区间里允许夹着不可选的日期，默认 false */
  allowsUnavailableInRange?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过；不写时结束早于开始、超出范围、是不可选的日期也算 */
  invalid?: boolean;
  /** 有值时显示清空按钮 */
  clearable?: boolean;
  /** 表单提交时开始日期的 name（ISO 字符串） */
  startName?: string;
  /** 表单提交时结束日期的 name */
  endName?: string;
  /** 开始那组分段的部件属性 */
  propsStart?: Partial<DateSegmentGroupProps>;
  /** 结束那组分段的部件属性 */
  propsEnd?: Partial<DateSegmentGroupProps>;
  /** 两组之间的分隔符的部件属性 */
  propsSeparator?: PartProps<'span', 'aria-hidden'>;
  /** 清空按钮的部件属性 */
  propsClear?: Omit<Partial<PresetIconButtonProps>, 'onClick'>;
  /** 快捷区间那一列的部件属性 */
  propsPresets?: PartProps<'div', 'role'>;
  /** 区间日历的部件属性（值、范围由选择器给出） */
  propsCalendar?: Omit<
    Partial<RangeCalendarProps<V>>,
    'value' | 'min' | 'max' | 'isDateUnavailable' | 'valueType' | 'onPick'
  >;
}

/** DateRangePicker 的样式：separator、popover（快捷区间的样式见 pickerPresetStyles） */
export const dateRangePickerStyles = css.create({
  separator: { flexShrink: 0, paddingInline: '_xs', color: '_textMuted' },
  popover: { display: 'flex', alignItems: 'flex-start', gap: '_sm', padding: '_sm' },
});

/** 自定义快捷区间的值 → ISO 日期区间（DateValue 取年月日） */
function isoRangeOf<V extends DateInput>(
  value: DateRange<V> | (() => DateRange<V>),
): DateRange<string> {
  const range = typeof value === 'function' ? value() : value;
  const iso = (input: DateInput) =>
    typeof input === 'string' ? input.slice(0, 10) : toIsoDate(input);
  return { start: iso(range.start), end: iso(range.end) };
}

/** 日期区间选择器：两组分段 + 弹出的区间日历与快捷区间 */
export const DateRangePicker = _component(
  <V extends DateInput>({
    value = _bindable<DateRange<V> | null>(null),
    open = _bindable(false),
    onOpenChange,
    valueType,
    granularity = 'day',
    min,
    max,
    isDateUnavailable,
    presets,
    visibleMonths = 2,
    allowsUnavailableInRange = false,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    clearable = false,
    startName,
    endName,
    placement,
    id,
    propsStart,
    propsEnd,
    propsSeparator,
    propsClear,
    icon,
    propsIcon,
    propsButton,
    propsPopover,
    propsPresets,
    propsCalendar,
    ...rest
  }: DateRangePickerProps<V>) => {
    const lang = useLang();
    const locale = useDateLocale();
    const generatedId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    const editable = () => !control().disabled && !control().readonly;
    const limits = _derived(toDateLimits(locale, { min, max, isDateUnavailable }));
    let startGroup = _state.raw<HTMLElement | null>(null);
    let endGroup = _state.raw<HTMLElement | null>(null);
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    const picker = usePickerPopover(
      () => ({
        open,
        placement,
        editable: editable(),
        label: lang.datePickerOpen,
        size: appearance().size,
      }),
      { toggle: setOpen, shown: focusCalendar },
    );

    // 两端各自的 ISO 字符串（按 granularity 的形式）：只填了一端时值仍是 null，这里记着填了的那一端
    const toIso = (date: DateInput) => valueToIso(date, granularity);
    let start = _state<string | null>(null);
    let end = _state<string | null>(null);
    // 自己写回的值不再同步回两端（否则删掉一端时，写回的 null 会把另一端也清掉）
    let written: DateRange<V> | null | undefined;
    // 值清空后再填：仍按清空前的类型写回
    let lastLike: V | undefined;
    watch(
      () => value,
      (next) => {
        if (next === written) return;
        start = next ? toIso(next.start) : null;
        end = next ? toIso(next.end) : null;
      },
      { immediate: true },
    );

    function commit() {
      lastLike = value?.start ?? lastLike;
      const like = (iso: string) => isoToValue(iso, lastLike, granularity, valueType) as V;
      written = start && end ? { start: like(start), end: like(end) } : null;
      if (written !== null || value !== null) value = written;
    }

    const startSegments = useFieldSegments(
      () => ({ fields: segmentFields(granularity), value: start, readonly: !editable() }),
      (iso) => {
        start = iso;
        commit();
      },
      // 开始那组最后一段输入满了：焦点进结束那组
      (direction) => direction === 1 && firstSegmentOf(endGroup)?.focus(),
    );
    const endSegments = useFieldSegments(
      () => ({ fields: segmentFields(granularity), value: end, readonly: !editable() }),
      (iso) => {
        end = iso;
        commit();
      },
      // 结束那组第一段删空后再删：回到开始那组的最后一段
      (direction) => {
        if (direction !== -1) return;
        const segments = startGroup?.querySelectorAll<HTMLElement>('[role="spinbutton"]');
        segments?.[segments.length - 1]?.focus();
      },
    );

    const outOfRange = (iso: string | null) =>
      iso != null && isPeriodDisabled(iso, granularity, limits, locale);

    /** 整天的区间 → 按 granularity 的形式：月、年截短；带时间时开始补 00:00、结束补 23:59（已经填了的时间不变） */
    function fromDays(range: DateRange<string>): DateRange<string> {
      if (granularity === 'year')
        return { start: range.start.slice(0, 4), end: range.end.slice(0, 4) };
      if (granularity === 'month')
        return { start: range.start.slice(0, 7), end: range.end.slice(0, 7) };
      if (granularity === 'quarter' || granularity === 'week') {
        const period = granularity === 'quarter' ? toIsoQuarter : toIsoWeek;
        return {
          start: period(parseIsoDate(range.start)!),
          end: period(parseIsoDate(range.end)!),
        };
      }
      if (!isTimeGranularity(granularity)) return range;
      const timeOf = (iso: string | null, fallback: string) =>
        iso != null && iso.length > 10 ? iso.slice(10) : fallback;
      const endTime = { hour: 'T23:00', minute: 'T23:59', second: 'T23:59:59' }[granularity];
      return {
        start: range.start + timeOf(start, granularity === 'second' ? 'T00:00:00' : 'T00:00'),
        end: range.end + timeOf(end, endTime),
      };
    }

    // 区间日历用整天的 ISO 日期：按月、按年、按周时是整段（开始那段的第一天到结束那段的最后一天）
    const calendarRange = (): DateRange<string> | null =>
      start == null || end == null ? null : { start: fullIsoDay(start), end: lastIsoDay(end) };

    /** 季度面板选好了区间（'YYYY-Qn'） */
    function pickQuarters(range: DateRange<string> | null) {
      if (range == null) return;
      start = range.start;
      end = range.end;
      commit();
    }

    /** 日历选好了区间：换回 granularity 的形式；带时间时焦点去开始的“时”接着输入 */
    function pickRange(range: DateRange<string> | null) {
      if (range == null) return;
      const next = fromDays(range);
      start = next.start;
      end = next.end;
      commit();
    }

    function clear() {
      startSegments.clear();
      endSegments.clear();
      start = null;
      end = null;
      commit();
      firstSegmentOf(startGroup)?.focus();
    }

    /** 点外壳空白处：开始没填全时去开始那组，否则去结束那组 */
    const firstEmpty = () =>
      start == null ? firstSegmentOf(startGroup) : firstSegmentOf(endGroup);

    /** 快捷区间夹到 min–max 之内：今天之后不能选时，“本月”就是本月 1 日到今天 */
    function presetValue(preset: DateRangePreset | DateRangeCustomPreset<V>): DateRange<string> {
      const range =
        typeof preset === 'string'
          ? presetIsoRange(preset, locale.week, locale.timeZone)
          : isoRangeOf(preset.value);
      const clamp = (iso: string) => toIsoDate(clampDate(parseIsoDate(iso)!, limits));
      return { start: clamp(range.start), end: clamp(range.end) };
    }

    function pickPreset(preset: DateRangePreset | DateRangeCustomPreset<V>) {
      const range = fromDays(presetValue(preset));
      start = range.start;
      end = range.end;
      commit();
      setOpen(false, 'select');
    }

    return () => {
      const state = control();
      const base = state.id ?? generatedId;
      const ids = { start: `${base}-start-label`, end: `${base}-end-label` };
      const reversed = start != null && end != null && end < start;
      const bad = state.invalid || reversed || outOfRange(start) || outOfRange(end);
      const filled = start != null || end != null || startSegments.partial || endSegments.partial;
      // 两组的名称：字段的标签 + “开始日期” / “结束日期”
      const labelledBy = (own: string) => [state.labelledBy, own].filter(Boolean).join(' ');
      const group = (side: 'start' | 'end') => {
        const isStart = side === 'start';
        return (
          <DateSegmentGroup
            {...mergePartProps<DateSegmentGroupProps>(
              {
                // 开始那组按内容宽，结束那组占满剩下的宽度：读起来是“开始 – 结束”，空白在最后
                sx: isStart ? undefined : segmentedFieldStyles.input,
                segments: isStart ? startSegments : endSegments,
                labelledBy: labelledBy(ids[side]),
                describedBy: state.describedBy,
              },
              isStart ? propsStart : propsEnd,
              {
                ref: (element: unknown) => {
                  const found = toElement(element);
                  if (isStart) startGroup = found;
                  else endGroup = found;
                },
                id: isStart ? base : `${base}-end`,
                segments: isStart ? startSegments : endSegments,
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                invalid: bad,
                onKeydown: picker.onKeydown,
              },
            )}
          />
        );
      };
      return (
        <>
          <div
            {...mergeAttrs<'div'>(
              {
                sx: controlSx(appearance(), { ...state, invalid: bad }),
                'aria-labelledby': defaultLabelledBy(rest, state.labelledBy),
              },
              rest,
              {
                ref: picker.anchorRef,
                role: 'group',
                'aria-disabled': state.disabled || undefined,
                onPointerdown: state.disabled ? undefined : focusOnShell(firstEmpty),
              },
            )}
            data-invalid={bad || undefined}
            data-disabled={state.disabled || undefined}
          >
            {controlIcon(icon, propsIcon)}
            <VisuallyHidden id={ids.start}>{lang.dateRangeStart}</VisuallyHidden>
            <VisuallyHidden id={ids.end}>{lang.dateRangeEnd}</VisuallyHidden>
            {group('start')}
            <span
              {...mergeAttrs<'span'>({ sx: dateRangePickerStyles.separator }, propsSeparator)}
              aria-hidden="true"
            >
              –
            </span>
            {group('end')}
            {clearable && filled && editable() && controlClear(propsClear, clear)}
            {picker.button(CalendarRange, propsButton)}
            <FormValue name={startName} value={start} disabled={state.disabled} />
            <FormValue name={endName} value={end} disabled={state.disabled} />
          </div>
          {picker.panel(
            dateRangePickerStyles.popover,
            propsPopover,
            open && [
              renderPickerPresets(
                (presets ?? []).map((preset) => {
                  const range = presetValue(preset);
                  return {
                    key: typeof preset === 'string' ? preset : preset.label,
                    label: typeof preset === 'string' ? lang.dateRangePreset[preset] : preset.label,
                    active: (() => {
                      const shown = fromDays(range);
                      return shown.start === start && shown.end === end;
                    })(),
                    onPick: () => pickPreset(preset),
                  };
                }),
                lang.dateRangePresets,
                propsPresets,
              ),
              granularity === 'quarter' ? (
                <QuarterCalendar
                  mode="range"
                  value={start != null && end != null ? { start, end } : null}
                  {...{ 'onUpdate:value': pickQuarters }}
                  min={min}
                  max={max}
                  aria-label={lang.datePickerOpen}
                  onPick={() => setOpen(false, 'select')}
                />
              ) : (
                <RangeCalendar
                  {...propsCalendar}
                  {...{ 'onUpdate:value': pickRange }}
                  value={calendarRange()}
                  granularity={dateUnitOf(granularity)}
                  min={min}
                  max={max}
                  isDateUnavailable={isDateUnavailable}
                  visibleMonths={visibleMonths}
                  allowsUnavailableInRange={allowsUnavailableInRange}
                  // 按周：按 ISO 8601 的周排（周一开始），行首是第几周
                  {...(granularity === 'week' && { firstDayOfWeek: 1, showWeekNumbers: true })}
                  onPick={() => {
                    setOpen(false, 'select');
                    // 带时间时接着输入时间：焦点去开始那组的“时”
                    if (isTimeGranularity(granularity))
                      startGroup?.querySelector<HTMLElement>('[data-type="hour"]')?.focus();
                  }}
                />
              ),
            ],
          )}
        </>
      );
    };
  },
);
