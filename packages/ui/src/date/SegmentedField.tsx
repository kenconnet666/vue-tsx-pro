/**
 * 分段输入框：输入框外壳（同 TextField）里放一组日期分段、可选的前置图标、清空按钮与尾部内容。
 * DateField、TimeField 是它的两种用法（只差有哪些段与怎样校验）；日期选择器把打开日历的按钮放在 suffix 里。
 *
 *   <SegmentedField fields={['hour', 'minute']} value={_bind(time)} />
 *
 * 值是 ISO 字符串（fieldsToIso）；所有段都填了才写回，删掉一段写回 null。写了 name 时用隐藏的 input 随表单提交。
 * 点外壳的空白处时焦点进第一个没填的段。
 *
 * 部件：Root（外壳）、Input（DateSegmentGroup，主元素）、Segment、Literal、Icon、Clear。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { now } from '@internationalized/date';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { ClearButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useLang } from '../config/context';
import type { HourCycles } from '../config/lang/lang';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import {
  controlStyles,
  controlSx,
  focusOnShell,
  useControlAppearance,
  type ControlOptions,
} from '../input/control';
import { toElement } from '../utils/dom/overlay';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { useDateLocale } from './date-locale';
import { fieldsToIso, isoToFields, useDateSegments, type DateSegmentType } from './date-segments';
import { DateSegmentGroup, type DateSegmentGroupProps } from './DateSegmentGroup';
import { useDateTexts } from './date-texts';

/** 由组件管理：角色与关联 */
export type SegmentedFieldManaged = 'role' | 'aria-describedby';

/** 分段输入框共有的属性（DateField、TimeField 都有）；未声明的属性落到这组分段上（主元素） */
export interface SegmentedFieldOptions
  extends
    PartProps<'div', SegmentedFieldManaged>,
    ControlOptions,
    Pick<DateSegmentGroupProps, 'propsSegment' | 'propsLiteral'> {
  /** 12 / 24 小时制（有时的段时）；不写时按语言 */
  hourCycle?: keyof HourCycles;
  /** 不可用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过；不写时值超出范围、是不可选的日期也算 */
  invalid?: boolean;
  /** 表单提交时的 name（用隐藏的 input，值是 ISO 字符串） */
  name?: string;
  /** 有值时显示清空按钮 */
  clearable?: boolean;
  /** 前置图标 */
  icon?: IconData;
  /** 框里最后的内容：日期选择器打开日历的按钮 */
  suffix?: VNodeChild;
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 前置图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
}

/** 未声明的属性落到这组分段上 */
export interface SegmentedFieldProps extends SegmentedFieldOptions {
  /** 值（ISO 字符串）：父级写 value={_bind(x)}；没填全时 null */
  value?: string | null;
  /** 有哪些段，按年 → 秒的顺序（显示顺序按语言） */
  fields: readonly Exclude<DateSegmentType, 'dayPeriod'>[];
  /** 值超出范围、不可选（有值时调用）：外壳显示出错 */
  outOfRange?: (value: string) => boolean;
}

/** SegmentedField 的样式：input */
export const segmentedFieldStyles = stylex.create({
  // 分段占满剩下的宽度：清空按钮、尾部内容贴着外壳的结束边
  input: { flexGrow: 1 },
});

/** 分段输入框：外壳 + 一组日期分段 */
export const SegmentedField = _component(
  ({
    value = _bindable<string | null>(null),
    fields,
    outOfRange,
    hourCycle,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    name,
    clearable = false,
    icon,
    suffix,
    id,
    propsRoot,
    propsIcon,
    propsClear,
    propsSegment,
    propsLiteral,
    ...rest
  }: SegmentedFieldProps) => {
    const lang = useLang();
    const locale = useDateLocale();
    const texts = useDateTexts();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let group = _state.raw<HTMLElement | null>(null);

    const segments = useDateSegments({
      fields: () => fields,
      locale: () => lang.code,
      hourCycle: () => hourCycle ?? lang.hourCycle,
      value: () => isoToFields(value, fields),
      onChange: (next) => (value = next ? fieldsToIso(next, fields) : null),
      placeholderValue: () => {
        const current = now(locale.timeZone);
        return {
          year: current.year,
          month: current.month,
          day: current.day,
          hour: current.hour,
          minute: current.minute,
          second: 0,
        };
      },
      placeholders: () => texts().dateFieldPlaceholders,
      readonly: () => control().disabled || control().readonly,
    });

    /** 第一个没填的段（都填了时第一段）：点外壳空白处、清空后焦点去这里 */
    const firstSegment = () =>
      group?.querySelector<HTMLElement>('[role="spinbutton"][data-placeholder]') ??
      group?.querySelector<HTMLElement>('[role="spinbutton"]') ??
      null;

    function clear() {
      segments.clear();
      value = null;
      firstSegment()?.focus();
    }

    return () => {
      const state = control();
      const bad = state.invalid || (value != null && (outOfRange?.(value) ?? false));
      const filled = value != null || segments.partial;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: controlSx(appearance(), { ...state, invalid: bad }) },
            propsRoot,
            {
              onPointerdown: state.disabled ? undefined : focusOnShell(firstSegment),
            },
          )}
          data-invalid={bad || undefined}
          data-disabled={state.disabled || undefined}
        >
          {icon && (
            <Icon {...mergePartProps<IconProps>({ icon, sx: controlStyles.icon }, propsIcon)} />
          )}
          <DateSegmentGroup
            {...mergePartProps<DateSegmentGroupProps>(
              {
                sx: segmentedFieldStyles.input,
                segments,
                labelledBy: state.labelledBy,
                describedBy: state.describedBy,
              },
              rest,
              {
                ref: (instance: unknown) => (group = toElement(instance)),
                id: state.id,
                segments,
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                invalid: bad,
                propsSegment,
                propsLiteral,
              },
            )}
          />
          {clearable && filled && !state.disabled && !state.readonly && (
            <ClearButton
              {...mergePartProps<PresetIconButtonProps>(
                { sx: controlStyles.button, radius: 'full' },
                propsClear,
                {
                  onClick: clear,
                },
              )}
            />
          )}
          {suffix}
          <FormValue name={name} value={value} />
        </div>
      );
    };
  },
);
