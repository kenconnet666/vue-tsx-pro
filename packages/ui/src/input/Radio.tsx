/**
 * 单选组（role="radiogroup"）与单选项（原生 input type="radio"）。结构与样式见 choice-styles.ts。
 *
 *   <Field label="配送方式">
 *     <RadioGroup value={_bind(shipping)}>
 *       <Radio value="express">快递</Radio>
 *       <Radio value="pickup">自提</Radio>
 *     </RadioGroup>
 *   </Field>
 *
 * 同一组的原生 radio 共用一个 name：Tab 只停在选中项（没有选中时停在第一项），方向键在组内移动并选中，
 * 这些都是浏览器的原生行为，不需要漫游焦点。组以 Field 的标签为名称（aria-labelledby），关联说明与错误。
 *
 * 部件（Radio）：Root（label）、Control（叠放层）、Indicator（圆点）、Label（文字）；未声明的属性落到 input 上。
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { useFieldControl } from '../form/Field';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import type { StatusTone } from '../utils/style/tone-styles';
import type { TextSize } from '../utils/style/typography';
import {
  choiceGroupStyles,
  choiceStyles,
  choiceRootSx,
  useChoiceAppearance,
  type ChoiceOrientations,
  readonlyChoiceHandlers,
  syncChecked,
} from './choice-styles';

/** RadioGroup 交给组内 Radio 的状态 */
export interface RadioGroupState {
  /** 选中的值 */
  readonly value: string | undefined;
  /** 原生单选框的 name：同组共用，方向键在组内移动 */
  readonly name: string;
  /** 整组不可用 */
  readonly disabled: boolean;
  /** 整组只读 */
  readonly readonly: boolean;
  /** 必填 */
  readonly required: boolean;
  /** 整组校验未通过 */
  readonly invalid: boolean;
  /** 字号档位；不写时继承 */
  readonly size: TextSize | undefined;
  /** 选中时的色调 */
  readonly tone: StatusTone;
  /** 选中一个值 */
  select(value: string): void;
}

/** RadioGroup 的上下文：自定义的单选项可以 inject 它接入组 */
export const RadioGroupContext = createContext<RadioGroupState>('RadioGroup');

/** 未声明的属性落到 div（role="radiogroup"）上 */
export interface RadioGroupProps extends PartProps<'div', 'role'> {
  /** 选中项的值：父级写 value={_bind(x)} */
  value?: string;
  /** 表单提交时的 name；不写时自动生成（同组的 radio 要共用一个 name 才互斥） */
  name?: string;
  /** 整组不可用 */
  disabled?: boolean;
  /** 整组只读：能聚焦、读屏念“只读”，选中项不能改（查看详情、审批时）；外观照常 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 字号档位；不写时继承上下文字号 */
  size?: TextSize;
  /** 选中时的色调（与 Button、Badge 等同一套），默认 accent；可以用 defaults.Choice 统一改 */
  tone?: StatusTone;
  /** 排列方向，默认 vertical */
  orientation?: keyof ChoiceOrientations;
  /** Radio */
  children?: VNodeChild;
}

/** 单选组：value 是选中项的值 */
export const RadioGroup = _component(
  ({
    value = _bindable<string | undefined>(undefined),
    name,
    disabled,
    readonly,
    required,
    invalid,
    size,
    tone,
    orientation = 'vertical',
    id,
    children,
    ...rest
  }: RadioGroupProps) => {
    const generatedName = useId();
    const control = useFieldControl(() => ({ id, disabled, readonly, required, invalid }));
    const appearance = useChoiceAppearance(() => ({ size, tone }));
    RadioGroupContext.provide({
      get value() {
        return value;
      },
      get name() {
        return name ?? generatedName;
      },
      get disabled() {
        return control().disabled;
      },
      get readonly() {
        return control().readonly;
      },
      get required() {
        return control().required;
      },
      get invalid() {
        return control().invalid;
      },
      get size() {
        return appearance().size;
      },
      get tone() {
        return appearance().tone;
      },
      select: (next) => (value = next),
    });

    return () => {
      const state = control();
      return (
        <div
          {...mergeAttrs<'div'>({ sx: choiceGroupStyles[orientation] }, rest, {
            id: state.id,
            role: 'radiogroup',
            'aria-labelledby': rest['aria-labelledby'] ?? state.labelledBy,
            'aria-describedby': state.describedBy,
            'aria-invalid': state.invalid || undefined,
            'aria-required': state.required || undefined,
            'aria-readonly': state.readonly || undefined,
          })}
          data-orientation={orientation}
          data-disabled={state.disabled || undefined}
          data-readonly={state.readonly || undefined}
        >
          {children}
        </div>
      );
    };
  },
);

/** 选中、名称与可用性由组管理 */
export type RadioManaged = 'type' | 'name' | 'checked' | 'required' | 'size' | 'value';

/** 未声明的属性落到 input 上；外层 label 用 propsRoot */
export interface RadioProps extends PartProps<'input', RadioManaged> {
  /** 这一项的值 */
  value: string;
  /** 这一项不可用 */
  disabled?: boolean;
  /** 外层 label 的部件属性 */
  propsRoot?: PartProps<'label'>;
  /** 叠放层的部件属性 */
  propsControl?: PartProps<'span'>;
  /** 圆点的部件属性 */
  propsIndicator?: PartProps<'span'>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 文字 */
  children?: VNodeChild;
}

/** RadioGroup、Radio 的样式：circle、dot、dotChecked */
export const radioStyles = stylex.create({
  circle: { width: '1.125em', height: '1.125em', borderRadius: '_full' },
  dot: {
    width: '0.45em',
    height: '0.45em',
    borderRadius: '_full',
    backgroundColor: 'var(--tone-on-fill)',
    transform: 'scale(0)',
    transition: 'transform _durations.sm _easings.standard',
  },
  dotChecked: { transform: 'none' },
});

/** 单选项：放在 RadioGroup 里 */
export const Radio = _component(
  ({
    value,
    disabled,
    propsRoot,
    propsControl,
    propsIndicator,
    propsLabel,
    children,
    ...rest
  }: RadioProps) => {
    const group = RadioGroupContext.inject();
    return () => {
      const checked = group.value === value;
      const off = disabled ?? group.disabled;
      return (
        <label
          {...mergeAttrs<'label'>({ sx: choiceRootSx(group, off, group.readonly) }, propsRoot)}
          data-state={checked ? 'checked' : 'unchecked'}
          data-disabled={off || undefined}
          data-readonly={group.readonly || undefined}
        >
          <span {...mergeAttrs<'span'>({ sx: choiceStyles.control }, propsControl)}>
            <input
              {...mergeAttrs<'input'>(
                {
                  sx: [
                    choiceStyles.input,
                    focusRingStyles.tight,
                    radioStyles.circle,
                    checked && choiceStyles.checked,
                    group.invalid && choiceStyles.invalid,
                  ],
                },
                rest,
                {
                  type: 'radio',
                  name: group.name,
                  value,
                  checked,
                  disabled: off,
                  required: group.required,
                  onChange: (event: Event) => {
                    group.select(value);
                    // 浏览器已经取消了同组原来选中的那个：整组一起对回父级的值
                    const radios = (event.target as HTMLElement)
                      .closest('[role="radiogroup"]')
                      ?.querySelectorAll<HTMLInputElement>('input[type="radio"]');
                    syncChecked([...(radios ?? [])], (input) => input.value === group.value);
                  },
                  ...(group.readonly && readonlyChoiceHandlers),
                },
              )}
            />
            <span
              {...mergeAttrs<'span'>(
                { sx: [choiceStyles.mark, radioStyles.dot, checked && radioStyles.dotChecked] },
                propsIndicator,
              )}
            />
          </span>
          {children != null && (
            <span {...mergeAttrs<'span'>({ sx: choiceStyles.label }, propsLabel)}>{children}</span>
          )}
        </label>
      );
    };
  },
);
