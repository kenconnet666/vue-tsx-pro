/**
 * 单选框与单选组：从几个互斥的选项里选一个（配送方式、支付方式）。
 *
 *   <RadioGroup _value={delivery} direction="horizontal">
 *     <Radio name="express">快递</Radio>
 *     <Radio name="pickup">到店自提</Radio>
 *   </RadioGroup>
 *
 * 外观同复选框（圆框里打勾）；name 是选项的值。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { ChoiceManaged, ChoiceValue } from './Checkbox';
import { choiceStyles, renderChoice, type ChoiceDirections, type ChoiceShapes } from './choice';
import { useForm } from './context';

/** 单选组提供给各项的 */
interface RadioGroupState {
  readonly value: ChoiceValue | undefined;
  readonly disabled: boolean;
  readonly shape: keyof ChoiceShapes | undefined;
  select(name: ChoiceValue): void;
}

const RadioGroupContext = createContext<RadioGroupState>('RadioGroup');

/** 未声明的属性落到按钮上 */
export interface RadioProps extends PartProps<'button', ChoiceManaged> {
  /** 这一项的值 */
  name: ChoiceValue;
  /** 形状；不给时随组，默认圆 */
  shape?: keyof ChoiceShapes;
  /** 禁用 */
  disabled?: boolean;
  /** 文字 */
  children?: VNodeChild;
  /** 框的部件属性 */
  propsBox?: PartProps<'span'>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
}

/** 单选框（button[role=radio] > 框 + 文字）；放在 RadioGroup 里 */
export const Radio = _component(
  ({ name, shape, disabled, children, propsBox, propsLabel, ...rest }: RadioProps) => {
    const form = useForm();
    const group = RadioGroupContext.inject();
    return () => {
      const off = disabled ?? (group.disabled || form?.disabled || false);
      return renderChoice(
        {
          role: 'radio',
          checked: group.value === name,
          disabled: off,
          shape: shape ?? group.shape ?? 'round',
          onToggle: () => !form?.readonly && group.select(name),
        },
        rest,
        children,
        { propsBox, propsLabel },
      );
    };
  },
);

/** 未声明的属性落到组的 div 上 */
export interface RadioGroupProps extends Omit<PartProps<'div', 'role'>, 'onChange'> {
  /** 选中的值；双向绑定写 `_value={x}` */
  _value?: ChoiceValue;
  /**
   * 排列
   * @default 'vertical'
   */
  direction?: keyof ChoiceDirections;
  /** 全部禁用 */
  disabled?: boolean;
  /** 各项的形状 */
  shape?: keyof ChoiceShapes;
  /** 选了另一项 */
  onChange?: (value: ChoiceValue) => void;
  /** 各个 Radio */
  children?: VNodeChild;
}

/** 单选组（div[role=radiogroup]） */
export const RadioGroup = _component(
  ({
    _value: value = _bindable<ChoiceValue | undefined>(undefined),
    direction = 'vertical',
    disabled = false,
    shape,
    onChange,
    children,
    ...rest
  }: RadioGroupProps) => {
    RadioGroupContext.provide({
      get value() {
        return value;
      },
      get disabled() {
        return disabled;
      },
      get shape() {
        return shape;
      },
      select(name) {
        if (name === value) return;
        value = name;
        onChange?.(name);
      },
    });
    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [choiceStyles.group, direction === 'horizontal' && choiceStyles.horizontal] },
          rest,
          { role: 'radiogroup' },
        )}
      >
        {children}
      </div>
    );
  },
);
