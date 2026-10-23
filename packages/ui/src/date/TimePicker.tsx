/**
 * 时间选择器：TimeField 加一个打开时间列表的按钮，按 step 列出可选的时间（同 Google 日历的时间下拉）；可以直接键入，也可以点选。
 * 参考 Mantine TimePicker 的 presets、MUI 的 digital clock；列表是 Listbox（↑↓、Home / End、按数字跳转）。
 *
 *   <Field label="开会时间"><TimePicker value={_bind(time)} min="09:00" max="18:00" /></Field>
 *   <TimePicker step={15} value={_bind(time)} aria-label="提醒时间" />
 *
 * 值同 TimeField（'HH:mm'，或 Time）。列表从 min（默认 00:00）起每 step 分钟一项，到 max 为止，按语言的 12 / 24 小时制显示；
 * 不在列表里的时间（14:47）照样能键入；isTimeUnavailable 的时间在列表里不可用、键入时显示出错。
 * 列表下方“此刻”选当前时间（此刻不可选时不可用）。选好后关闭，焦点回到按钮；Esc、点外部关闭，分段里 Alt + ↓ 打开。
 *
 * 部件：同 TimeField，另有 Button（打开按钮）、Popover（弹层）、List（Listbox）、Now（“此刻”按钮）。
 */
import { Clock } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { now, Time } from '@internationalized/date';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Button, type ButtonProps } from '../base/Button';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { useFieldControl } from '../form/Field';
import { Listbox, type ListboxProps } from '../input/Listbox';
import type { ListboxOption } from '../input/list-state';
import { parseIsoTime, toIsoTime } from '../utils/data/date';
import { mergePartProps, type PartProps } from '../utils/props';
import { useDateLocale } from './date-locale';
import { usePickerPopover, type PickerPopoverParts } from './picker-popover';
import { TimeField, toTime, type TimeFieldProps, type TimeInput } from './TimeField';

/** 未声明的属性落到这组分段上（主元素）；外壳用 propsRoot */
export interface TimePickerProps<V extends TimeInput = string>
  extends TimeFieldProps<V>, PickerPopoverParts {
  /** 列表是否打开：父级可写 open={_bind(x)} */
  open?: boolean;
  /** 列表里相邻两项相隔几分钟，默认 30 */
  step?: number;
  /** 时间列表的部件属性 */
  propsList?: Omit<Partial<ListboxProps>, 'items' | 'value' | 'onPick'>;
  /** “此刻”按钮的部件属性 */
  propsNow?: Omit<Partial<ButtonProps>, 'onClick'>;
}

/** TimePicker 的样式：popover、list、now */
export const timePickerStyles = stylex.create({
  popover: { display: 'flex', flexDirection: 'column', padding: '_xs' },
  // 弹层与输入框同宽，列表最多十来项高，其余滚动
  list: { maxHeight: '16em' },
  now: { marginTop: '_xs' },
});

const minutesOf = (time: Time) => time.hour * 60 + time.minute;

/** 时间选择器：分段输入 + 按步长列出的时间 */
export const TimePicker = _component(
  <V extends TimeInput>({
    value = _bindable<V | null>(null),
    open = _bindable(false),
    step = 30,
    granularity = 'minute',
    valueType = 'iso',
    min,
    max,
    isTimeUnavailable,
    hourCycle,
    placement,
    id,
    disabled,
    readonly,
    invalid,
    required,
    propsRoot,
    propsButton,
    propsPopover,
    propsList,
    propsNow,
    onKeydown,
    ...rest
  }: TimePickerProps<V>) => {
    const lang = useLang();
    const format = useFormat();
    const locale = useDateLocale();
    // 输入由里面的 TimeField 接 Field；这里只读状态决定能不能打开面板
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }), {
      delegate: true,
    });
    const picker = usePickerPopover(
      () => ({
        open,
        placement,
        matchWidth: true,
        editable: !control().disabled && !control().readonly,
        label: lang.timePickerOpen,
        size: rest.size,
      }),
      {
        toggle: (next) => (open = next),
        shown: (panel) => panel.querySelector<HTMLElement>('[role="listbox"]')?.focus(),
      },
    );

    /** 列表的选项：min 到 max，每 step 分钟一项，按语言的小时制显示 */
    const options = _derived.by((): ListboxOption[] => {
      const first = minutesOf(toTime(min) ?? new Time(0, 0));
      const last = minutesOf(toTime(max) ?? new Time(23, 59));
      const result: ListboxOption[] = [];
      for (let minutes = first; minutes <= last; minutes += Math.max(step, 1)) {
        const time = new Time(Math.floor(minutes / 60), minutes % 60);
        const iso = toIsoTime(time);
        result.push({
          value: iso,
          label: format.date(iso, { timeStyle: 'short', hourCycle }),
          disabled: isTimeUnavailable?.(iso, time) ?? false,
        });
      }
      return result;
    });

    // 当前值正好是列表里的一项时高亮它（只比时分）
    const selected = _derived.by(() => {
      const time = toTime(value);
      return time ? toIsoTime(time) : undefined;
    });

    /** 写回：和当前值同一种类型（Time 或字符串），精确到秒时补 :00 */
    function write(time: Time) {
      const asTime = (value != null && typeof value !== 'string') || valueType === 'dateValue';
      value = (asTime ? time : toIsoTime(time, granularity === 'second')) as V;
      open = false;
    }

    /** 此刻（精确到分） */
    const nowTime = () => {
      const current = now(locale.timeZone);
      return new Time(current.hour, current.minute);
    };
    /** 此刻能不能选：在 min–max 之内，不是不可选的时间 */
    function nowAvailable() {
      const time = nowTime();
      const low = toTime(min);
      const high = toTime(max);
      return !(
        (low != null && time.compare(low) < 0) ||
        (high != null && time.compare(high) > 0) ||
        (isTimeUnavailable?.(toIsoTime(time), time) ?? false)
      );
    }

    return () => (
      <>
        <TimeField
          {...rest}
          {...{ 'onUpdate:value': (next: V | null) => (value = next) }}
          value={value}
          granularity={granularity}
          valueType={valueType}
          min={min}
          max={max}
          isTimeUnavailable={isTimeUnavailable}
          hourCycle={hourCycle}
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
          suffix={picker.button(Clock, propsButton)}
        />
        {picker.panel(
          timePickerStyles.popover,
          propsPopover,
          open && [
            <Listbox
              {...mergePartProps<ListboxProps>(
                { sx: timePickerStyles.list, 'aria-label': lang.timePickerOpen, items: options },
                propsList,
                // 在 Field 里时 Listbox 默认取 Field 的控件 id：那是输入框的，列表要自己的 id
                {
                  id: `${picker.id}-list`,
                  items: options,
                  value: selected,
                  onPick: (iso) => write(parseIsoTime(iso)!),
                  required: true,
                },
              )}
            />,
            <Button
              {...mergePartProps<ButtonProps>(
                { sx: timePickerStyles.now, variant: 'ghost', size: 'sm', fullWidth: true },
                propsNow,
                { disabled: !nowAvailable(), onClick: () => write(nowTime()) },
              )}
            >
              {lang.timePickerNow}
            </Button>,
          ],
        )}
      </>
    );
  },
);
