/**
 * 复选框与复选框组：从几个选项里选任意多个；单独一个用于“同意协议”这类确认。
 *
 *   <Checkbox _checked={agree}>我已阅读并同意《用户协议》</Checkbox>
 *   <CheckboxGroup _value={tags} direction="horizontal" max={3}>
 *     <Checkbox name="spicy">辣</Checkbox>
 *     <Checkbox name="sweet">甜</Checkbox>
 *   </CheckboxGroup>
 *
 * 在组里时 name 是选项的值，选中与否由组的 _value 决定；全选框用 indeterminate 表示部分选中。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import { choiceStyles, renderChoice, type ChoiceDirections, type ChoiceShapes } from './choice';
import { useForm } from './context';

/** 选项的值 */
export type ChoiceValue = string | number;

/** 复选框组提供给各项的 */
interface CheckboxGroupState {
  readonly value: readonly ChoiceValue[];
  readonly max: number | undefined;
  readonly disabled: boolean;
  readonly shape: keyof ChoiceShapes | undefined;
  toggle(name: ChoiceValue): void;
}

const CheckboxGroupContext = createContext<CheckboxGroupState>('CheckboxGroup');

/** 角色与状态由组件管理 */
export type ChoiceManaged = 'role' | 'aria-checked' | 'type' | 'disabled' | 'name';

/** 未声明的属性落到按钮上 */
export interface CheckboxProps extends Omit<PartProps<'button', ChoiceManaged>, 'onChange'> {
  /** 是否选中（单独用时）；双向绑定写 `_checked={x}` */
  _checked?: boolean;
  /** 在组里时：这一项的值 */
  name?: ChoiceValue;
  /** 半选：全选框在部分选中时 */
  indeterminate?: boolean;
  /** 形状；不给时随组，默认圆 */
  shape?: keyof ChoiceShapes;
  /** 禁用 */
  disabled?: boolean;
  /** 单独用时切换了 */
  onChange?: (checked: boolean) => void;
  /** 文字 */
  children?: VNodeChild;
  /** 框的部件属性 */
  propsBox?: PartProps<'span'>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
}

/** 复选框（button[role=checkbox] > 框 + 文字） */
export const Checkbox = _component(
  ({
    _checked: checked = _bindable(false),
    name,
    indeterminate = false,
    shape,
    disabled,
    onChange,
    children,
    propsBox,
    propsLabel,
    ...rest
  }: CheckboxProps) => {
    const form = useForm();
    const group = CheckboxGroupContext.inject(null);
    return () => {
      const inGroup = group !== null && name !== undefined;
      const selected = inGroup ? group.value.includes(name) : checked;
      // 选满了：没选中的项不能再选
      const full =
        inGroup && !selected && group.max !== undefined && group.value.length >= group.max;
      const off = disabled ?? (group?.disabled || form?.disabled || full || false);
      return renderChoice(
        {
          role: 'checkbox',
          checked: selected,
          indeterminate,
          disabled: off,
          shape: shape ?? group?.shape ?? 'round',
          onToggle: () => {
            if (form?.readonly) return;
            if (inGroup) return group.toggle(name);
            checked = !checked;
            onChange?.(checked);
          },
        },
        rest,
        children,
        { propsBox, propsLabel },
      );
    };
  },
);

/** 未声明的属性落到组的 div 上 */
export interface CheckboxGroupProps extends Omit<PartProps<'div', 'role'>, 'onChange'> {
  /** 选中的值；双向绑定写 `_value={x}` */
  _value?: ChoiceValue[];
  /**
   * 排列
   * @default 'vertical'
   */
  direction?: keyof ChoiceDirections;
  /** 最多选几个 */
  max?: number;
  /** 全部禁用 */
  disabled?: boolean;
  /** 各项的形状 */
  shape?: keyof ChoiceShapes;
  /** 选中的变了 */
  onChange?: (value: ChoiceValue[]) => void;
  /** 各个 Checkbox */
  children?: VNodeChild;
}

/** 复选框组（div[role=group]） */
export const CheckboxGroup = _component(
  ({
    _value: value = _bindable<ChoiceValue[]>([]),
    direction = 'vertical',
    max,
    disabled = false,
    shape,
    onChange,
    children,
    ...rest
  }: CheckboxGroupProps) => {
    CheckboxGroupContext.provide({
      get value() {
        return value;
      },
      get max() {
        return max;
      },
      get disabled() {
        return disabled;
      },
      get shape() {
        return shape;
      },
      toggle(name) {
        value = value.includes(name) ? value.filter((item) => item !== name) : [...value, name];
        onChange?.(value);
      },
    });
    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [choiceStyles.group, direction === 'horizontal' && choiceStyles.horizontal] },
          rest,
          { role: 'group' },
        )}
      >
        {children}
      </div>
    );
  },
);
