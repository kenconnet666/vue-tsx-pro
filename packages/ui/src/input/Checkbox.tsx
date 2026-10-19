/**
 * 复选框（原生 input type="checkbox"）与复选组。结构与样式见 choice-styles.ts。
 *
 *   <Checkbox checked={_bind(agreed)}>我已阅读并同意</Checkbox>
 *   <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll}>全选</Checkbox>
 *   <Field label="通知方式">
 *     <CheckboxGroup value={_bind(channels)} name="channels">
 *       <Checkbox value="email">邮件</Checkbox>
 *       <Checkbox value="sms">短信</Checkbox>
 *     </CheckboxGroup>
 *   </Field>
 *
 * 部分勾选（indeterminate）是原生 input 的属性，读屏念“部分选中”。在 Field 里时关联说明与错误、沿用其状态；
 * 复选组用 role="group"，以 Field 的标签为名称（aria-labelledby）。
 *
 * 部件：Root（label）、Control（叠放层）、Indicator（对勾 / 横线图标）、Label（文字）；未声明的属性落到 input 上。
 */
import { Check, Minus } from '@lucide/icons';
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { useFieldControl } from '../form/Field';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { toggleSelection } from '../utils/selection';
import { fontSizeStyles, type TextSize } from '../utils/typography';
import { choiceGroupStyles, choiceStyles, type ChoiceOrientations } from './choice-styles';

interface GroupState {
  readonly value: readonly string[];
  readonly name: string | undefined;
  readonly disabled: boolean;
  readonly invalid: boolean;
  toggle(value: string): void;
}

const GroupContext = createContext<GroupState>('CheckboxGroup');

/** 勾选状态与可用性由组件管理；原生的 size 属性让给字号档位 */
type Managed =
  'type' | 'checked' | 'disabled' | 'required' | 'size' | 'aria-invalid' | 'aria-describedby';

/** 未声明的属性落到 input 上；外层 label 用 propsRoot */
export interface CheckboxProps extends PartProps<'input', Managed> {
  /** 是否勾选：父级写 checked={_bind(x)}；在复选组里时由组决定 */
  checked?: boolean;
  /** 部分勾选（“全选”下面只选了一部分）：显示横线，读屏念“部分选中” */
  indeterminate?: boolean;
  /** 在复选组里的值；单独使用时是表单提交的值（默认 on） */
  value?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 必填（如“同意条款”） */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 字号档位；不写时继承上下文字号 */
  size?: TextSize;
  /** 外层 label 的部件属性 */
  propsRoot?: PartProps<'label'>;
  /** 叠放层的部件属性 */
  propsControl?: PartProps<'span'>;
  /** 对勾 / 横线图标的部件属性 */
  propsIndicator?: Partial<IconProps>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 文字 */
  children?: VNodeChild;
}

const styles = stylex.create({
  box: { width: '1.125em', height: '1.125em', borderRadius: '_sm' },
  indicator: { width: '0.875em', height: '0.875em', color: '_accentContrast' },
  hidden: { visibility: 'hidden' },
});

/** 复选框：原生 checkbox 加自绘的方框与对勾 */
export const Checkbox = _component(
  ({
    checked = _bindable(false),
    indeterminate = false,
    value,
    disabled,
    required,
    invalid,
    size,
    id,
    propsRoot,
    propsControl,
    propsIndicator,
    propsLabel,
    children,
    ...rest
  }: CheckboxProps) => {
    const group = GroupContext.inject(null);
    const control = useFieldControl(() => ({ id, invalid, required, disabled }));
    let input = _state.raw<HTMLInputElement | null>(null);

    // indeterminate 只能经 DOM 属性设置
    _effect(() => {
      if (input) input.indeterminate = indeterminate;
    });

    function onChange(event: Event) {
      const next = (event.target as HTMLInputElement).checked;
      if (group && value != null) group.toggle(value);
      else checked = next;
    }

    return () => {
      // 在复选组里时，id 与说明归组所有，不再给每一项
      const field = group ? undefined : control();
      const isChecked = group && value != null ? group.value.includes(value) : checked;
      const off = disabled ?? group?.disabled ?? field?.disabled ?? false;
      const bad = invalid ?? group?.invalid ?? field?.invalid ?? false;
      const marked = isChecked || indeterminate;
      return (
        <label
          {...elementProps(
            mergeProps<'label'>(
              {
                sx: [choiceStyles.root, size && fontSizeStyles[size], off && choiceStyles.disabled],
              },
              propsRoot,
            ),
          )}
          data-state={indeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
          data-disabled={off || undefined}
        >
          <span {...elementProps(mergeProps<'span'>({ sx: choiceStyles.control }, propsControl))}>
            <input
              {...elementProps(
                mergeProps<'input'>(
                  {
                    sx: [
                      choiceStyles.input,
                      styles.box,
                      marked && choiceStyles.checked,
                      bad && choiceStyles.invalid,
                    ],
                  },
                  rest,
                  {
                    ref: _toRef(input),
                    type: 'checkbox',
                    id: field?.id ?? id,
                    name: rest.name ?? group?.name,
                    value,
                    checked: isChecked,
                    disabled: off,
                    required: required ?? field?.required,
                    'aria-invalid': bad || undefined,
                    'aria-describedby': field?.describedBy,
                    onChange,
                  },
                ),
              )}
            />
            <Icon
              {...mergePartProps<IconProps>(
                {
                  icon: indeterminate ? Minus : Check,
                  strokeWidth: 3,
                  sx: [choiceStyles.mark, styles.indicator, !marked && styles.hidden],
                },
                propsIndicator,
              )}
            />
          </span>
          {children != null && (
            <span {...elementProps(mergeProps<'span'>({ sx: choiceStyles.label }, propsLabel))}>
              {children}
            </span>
          )}
        </label>
      );
    };
  },
);

/** 未声明的属性落到 div（role="group"）上 */
export interface CheckboxGroupProps extends PartProps<'div', 'role'> {
  /** 勾选的值：父级写 value={_bind(list)} */
  value?: string[];
  /** 表单提交时各项共用的 name */
  name?: string;
  /** 整组不可用 */
  disabled?: boolean;
  /** 校验未通过（如“至少选一项”） */
  invalid?: boolean;
  /** 排列方向，默认 vertical */
  orientation?: keyof ChoiceOrientations;
  /** Checkbox */
  children?: VNodeChild;
}

/** 一组复选框：value 是勾选项的值的数组 */
export const CheckboxGroup = _component(
  ({
    value = _bindable<string[]>([]),
    name,
    disabled,
    invalid,
    orientation = 'vertical',
    id,
    children,
    ...rest
  }: CheckboxGroupProps) => {
    const control = useFieldControl(() => ({ id, disabled, invalid }));
    GroupContext.provide({
      get value() {
        return value;
      },
      get name() {
        return name;
      },
      get disabled() {
        return control().disabled;
      },
      get invalid() {
        return control().invalid;
      },
      toggle(item) {
        value = [...toggleSelection(value, item, { mode: 'multiple' })];
      },
    });

    return () => {
      const state = control();
      return (
        <div
          {...elementProps(
            mergeProps<'div'>({ sx: choiceGroupStyles[orientation] }, rest, {
              id: state.id,
              role: 'group',
              'aria-labelledby': rest['aria-labelledby'] ?? state.labelledBy,
              'aria-describedby': state.describedBy,
            }),
          )}
          data-orientation={orientation}
          data-disabled={state.disabled || undefined}
        >
          {children}
        </div>
      );
    };
  },
);
