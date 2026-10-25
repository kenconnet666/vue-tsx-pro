/**
 * 数值区间（div role="group"）：两个 NumberField，最小到最大。预期收益量级、金额范围、数量区间的录入与筛选。
 *
 *   <Field label="预期收益量级">
 *     <NumberRangeField _value={_bind(range)} format={{ scale: 10_000 }} suffix="万元" min={0} />
 *   </Field>
 *
 * value 是 [起, 止]，任一端可以为空（null，“10 万元以上”）。两端都填了、起比止大时自动对调，不用报错。
 * min、max、step、format、prefix、suffix、valueType 与外观（variant、size、radius）两端共用，同 NumberField。
 * 在 Field 里时：标签点了聚焦第一个框，组以标签为名称、关联说明与错误；两个框各自念“最小值”“最大值”。
 * 写了 name（[起的名字, 止的名字]）时两端各用一个隐藏的 input 随表单提交。
 *
 * 部件：Root（div）、Start、End（NumberField）、Separator（span）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import type { NumericFormat } from '../config/lang/format';
import { useFieldControl } from '../form/Field';
import { compareNumeric, type NumericKind, type NumericValue } from '../utils/data/numeric';
import { defaultLabelledBy, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { fontSizeStyles } from '../utils/style/typography';
import type { ControlOptions } from './control';
import { NumberField, type NumberFieldProps } from './NumberField';

/** 区间的值：[起, 止]，空着的一端是 null */
export type NumberRange = readonly [NumericValue | null, NumericValue | null];

/** 角色由组件管理；原生的 placeholder、prefix 属性让给两个框的占位与前缀 */
export type NumberRangeFieldManaged = 'role' | 'placeholder' | 'prefix';

/** 未声明的属性落到外层 div 上 */
export interface NumberRangeFieldProps
  extends PartProps<'div', NumberRangeFieldManaged>, ControlOptions {
  /** [起, 止]：父级写 _value={_bind(range)}；任一端可以为 null */
  _value?: NumberRange;
  /** 两端共同的最小值 */
  min?: NumericValue;
  /** 两端共同的最大值 */
  max?: NumericValue;
  /** 步长，同 NumberField */
  step?: NumericValue;
  /** 显示格式，同 NumberField（scale 时按缩放后的单位输入） */
  format?: NumericFormat;
  /** 一开始为空时写回的类型，同 NumberField */
  valueType?: NumericKind;
  /** 框里文字前的内容 */
  prefix?: VNodeChild;
  /** 框里文字后的单位 */
  suffix?: VNodeChild;
  /** 两个框的占位文字，默认取语言包（最小值、最大值） */
  placeholder?: readonly [string, string];
  /** 两端中间的内容，默认“–” */
  separator?: VNodeChild;
  /** 表单提交时两端的 name */
  name?: readonly [string, string];
  /** 不可用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 起的那个框的部件属性 */
  propsStart?: Partial<NumberFieldProps>;
  /** 止的那个框的部件属性 */
  propsEnd?: Partial<NumberFieldProps>;
  /** 中间分隔的部件属性 */
  propsSeparator?: PartProps<'span', 'aria-hidden'>;
}

/** NumberRangeField 的样式：root、field、separator */
export const numberRangeFieldStyles = css.create({
  root: { display: 'flex', alignItems: 'center', gap: '_sm', minWidth: 0 },
  field: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  separator: { flexShrink: 0, color: '_textMuted' },
});

/** 数值区间：两个数字框，起比止大时自动对调 */
export const NumberRangeField = _component(
  ({
    _value: value = _bindable<NumberRange>([null, null]),
    min,
    max,
    step,
    format,
    valueType,
    prefix,
    suffix,
    placeholder,
    separator = '–',
    name,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    id,
    propsStart,
    propsEnd,
    propsSeparator,
    ...rest
  }: NumberRangeFieldProps) => {
    const lang = useLang();
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));

    /** 改一端：两端都有值且起比止大时对调 */
    function set(index: 0 | 1, next: NumericValue | null) {
      const pair: [NumericValue | null, NumericValue | null] = [value[0], value[1]];
      pair[index] = next;
      const [start, end] = pair;
      value = start != null && end != null && compareNumeric(start, end) > 0 ? [end, start] : pair;
    }

    return () => {
      const state = control();
      const shared = {
        min,
        max,
        step,
        format,
        valueType,
        prefix,
        suffix,
        variant,
        size,
        radius,
        disabled: state.disabled,
        readonly: state.readonly,
        invalid: state.invalid,
        stepper: false,
        propsRoot: { sx: numberRangeFieldStyles.field },
      };
      return (
        <div
          {...mergeAttrs<'div'>(
            // 分隔符跟两个框一样大
            { sx: [numberRangeFieldStyles.root, size && fontSizeStyles[size]] },
            rest,
            {
              role: 'group',
              'aria-labelledby': defaultLabelledBy(rest, state.labelledBy),
              'aria-describedby': state.describedBy,
            },
          )}
          data-disabled={state.disabled || undefined}
          data-invalid={state.invalid || undefined}
        >
          <NumberField
            {...mergePartProps<NumberFieldProps>(
              { ...shared, placeholder: placeholder?.[0] ?? lang.sliderMin },
              propsStart,
              {
                // 标签的 for 指向第一个框：点标签聚焦“起”
                id: state.id,
                required: state.required,
                name: name?.[0],
                'aria-label': lang.sliderMin,
              },
            )}
            _value={_bind(
              () => value[0],
              (next: NumericValue | null) => set(0, next),
            )}
          />
          <span
            {...mergeAttrs<'span'>({ sx: numberRangeFieldStyles.separator }, propsSeparator, {
              'aria-hidden': true,
            })}
          >
            {separator}
          </span>
          <NumberField
            {...mergePartProps<NumberFieldProps>(
              { ...shared, placeholder: placeholder?.[1] ?? lang.sliderMax },
              propsEnd,
              {
                id: state.id ? `${state.id}-end` : undefined,
                name: name?.[1],
                'aria-label': lang.sliderMax,
              },
            )}
            _value={_bind(
              () => value[1],
              (next: NumericValue | null) => set(1, next),
            )}
          />
        </div>
      );
    };
  },
);
