/**
 * 时间选择器：TimeField 加一个打开时间列表的按钮，按 step 列出可选的时间（同 Google 日历的时间下拉）；可以直接键入，也可以点选。
 * 参考 Mantine TimePicker 的 presets、MUI 的 digital clock；列表是 Listbox（↑↓、Home / End、按数字跳转）。
 *
 *   <Field label="开会时间"><TimePicker value={_bind(time)} min="09:00" max="18:00" /></Field>
 *   <TimePicker step={15} value={_bind(time)} aria-label="提醒时间" />
 *
 * 值同 TimeField（'HH:mm'，或 Time）。列表从 min（默认 00:00）起每 step 分钟一项，到 max 为止，按语言的 12 / 24 小时制显示；
 * 不在列表里的时间（14:47）照样能键入。列表下方“此刻”选当前时间。选好后关闭，焦点回到按钮；Esc、点外部关闭，分段里 Alt + ↓ 打开。
 *
 * 部件：同 TimeField，另有 Button（打开按钮）、Popover（弹层）、List（Listbox）、Now（“此刻”按钮）。
 */
import { Clock } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { now, Time } from '@internationalized/date';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { useFieldControl } from '../form/Field';
import { controlStyles } from '../input/control';
import { Listbox, type ListboxProps } from '../input/Listbox';
import type { ListboxOption } from '../input/list-state';
import { parseIsoTime, toIsoTime } from '../utils/data/date';
import { toElement } from '../utils/dom/overlay';
import { floatingStyles, useAnchoredPopover, type FloatingPlacement } from '../utils/dom/floating';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { transitions } from '../utils/style/transitions';
import { useDateLocale } from './date-locale';
import { TimeField, type TimeFieldProps, type TimeInput } from './TimeField';

/** 未声明的属性落到这组分段上（主元素）；外壳用 propsRoot */
export interface TimePickerProps<V extends TimeInput = string> extends TimeFieldProps<V> {
  /** 列表是否打开：父级可写 open={_bind(x)} */
  open?: boolean;
  /** 列表里相邻两项相隔几分钟，默认 30 */
  step?: number;
  /** 弹出位置，默认 bottom-start；空间不够时自动翻转 */
  placement?: FloatingPlacement;
  /** 打开按钮的部件属性 */
  propsButton?: Omit<Partial<IconButtonProps>, 'onClick' | 'aria-expanded' | 'aria-controls'>;
  /** 弹层的部件属性 */
  propsPopover?: PartProps<'div', 'id' | 'popover' | 'role'>;
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
    hourCycle,
    placement = 'bottom-start',
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
    const popoverId = useId();
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    const editable = () => !control().disabled && !control().readonly;
    let shell = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    let button = _state.raw<HTMLElement | null>(null);

    const { onToggle } = useAnchoredPopover(
      () => ({
        open,
        anchor: shell,
        panel,
        floating: { placement, matchWidth: true },
        // 锚点是输入框外壳（不可聚焦）：关闭时焦点还给打开按钮
        restoreFocus: button,
      }),
      {
        close: () => (open = false),
        shown: (element) => element.querySelector<HTMLElement>('[role="listbox"]')?.focus(),
      },
    );

    const toTime = (input: TimeInput | null | undefined) =>
      typeof input === 'string' || input == null ? parseIsoTime(input) : input;

    /** 列表的选项：min 到 max，每 step 分钟一项，按语言的小时制显示 */
    const options = _derived.by((): ListboxOption[] => {
      const first = minutesOf(toTime(min) ?? new Time(0, 0));
      const last = minutesOf(toTime(max) ?? new Time(23, 59));
      const result: ListboxOption[] = [];
      for (let minutes = first; minutes <= last; minutes += Math.max(step, 1)) {
        const iso = toIsoTime(new Time(Math.floor(minutes / 60), minutes % 60));
        result.push({ value: iso, label: format.date(iso, { timeStyle: 'short', hourCycle }) });
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
    }

    function pick(iso: string) {
      write(parseIsoTime(iso)!);
      open = false;
    }

    function pickNow() {
      const current = now(locale.timeZone);
      write(new Time(current.hour, current.minute));
      open = false;
    }

    function keydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
      onKeydown?.(event);
      if (event.altKey && event.key === 'ArrowDown' && editable()) {
        event.preventDefault();
        open = true;
      }
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
          hourCycle={hourCycle}
          id={id}
          disabled={disabled}
          readonly={readonly}
          invalid={invalid}
          required={required}
          onKeydown={keydown}
          propsRoot={mergePartProps<PartProps<'div'>>({}, propsRoot, {
            ref: (element: unknown) => (shell = toElement(element)),
          })}
          suffix={
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  sx: controlStyles.button,
                  radius: 'full',
                  icon: Clock,
                  'aria-label': lang.timePickerOpen,
                },
                propsButton,
                {
                  ref: (element: unknown) => (button = toElement(element)),
                  disabled: !editable(),
                  'aria-haspopup': 'dialog',
                  'aria-expanded': open,
                  'aria-controls': popoverId,
                  onClick: () => (open = !open),
                },
              )}
            />
          }
        />
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                floatingStyles.anchored,
                floatingStyles.surface,
                timePickerStyles.popover,
                transitions.scale,
              ],
              'aria-label': lang.timePickerOpen,
            },
            propsPopover,
            { ref: _toRef(panel), id: popoverId, popover: 'auto', role: 'dialog', onToggle },
          )}
          data-state={open ? 'open' : 'closed'}
        >
          {open && [
            <Listbox
              {...mergePartProps<ListboxProps>(
                {
                  sx: timePickerStyles.list,
                  'aria-label': lang.timePickerOpen,
                  items: options,
                },
                propsList,
                // 在 Field 里时 Listbox 默认取 Field 的控件 id：那是输入框的，列表要自己的 id
                {
                  id: `${popoverId}-list`,
                  items: options,
                  value: selected,
                  onPick: pick,
                  required: true,
                },
              )}
            />,
            <Button
              {...mergePartProps<ButtonProps>(
                { sx: timePickerStyles.now, variant: 'ghost', size: 'sm', fullWidth: true },
                propsNow,
                { onClick: pickNow },
              )}
            >
              {lang.timePickerNow}
            </Button>,
          ]}
        </div>
      </>
    );
  },
);
