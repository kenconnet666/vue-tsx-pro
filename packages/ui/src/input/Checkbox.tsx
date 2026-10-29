/**
 * 复选框（原生 input type="checkbox"）与复选组。结构与样式见 choice-styles.ts。
 *
 *   <Checkbox _checked={agreed}>我已阅读并同意</Checkbox>
 *   <Checkbox _checked={allChecked} indeterminate={someChecked} onChange={toggleAll}>全选</Checkbox>
 *   <Field label="通知方式">
 *     <CheckboxGroup _value={channels} name="channels">
 *       <Checkbox value="email">邮件</Checkbox>
 *       <Checkbox value="sms">短信</Checkbox>
 *     </CheckboxGroup>
 *   </Field>
 *   <CheckboxGroup _value={channels} items={[{ value: 'email', label: '邮件', description: '每天汇总一封' }, …]} />
 *
 * 部分勾选（indeterminate）是原生 input 的属性，读屏念“部分选中”。在 Field 里时关联说明与错误、沿用其状态；
 * 复选组用 role="group"，以 Field 的标签为名称（aria-labelledby）。
 *
 * 部件：Root（label）、Control（叠放层）、Indicator（对勾 / 横线图标）、Label（文字）；未声明的属性落到 input 上。
 */
import { Check, Minus } from '@lucide/icons';
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, type VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { useFieldControl } from '../form/Field';
import { toListboxOption, type ListboxOption, type OptionMapping } from './list-state';
import {
  hasContent,
  defaultLabelledBy,
  mergeAttrs,
  mergePartProps,
  type PartProps,
} from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { toggleSelection } from '../utils/data/selection';
import type { StatusTone } from '../utils/style/tone-styles';
import type { TextSize } from '../utils/style/typography';
import { useRecipe } from '../config/styles';
import {
  choiceInputStyles,
  choiceParts,
  choiceRecipe,
  useChoiceAppearance,
  type ChoiceOrientations,
  readonlyChoiceHandlers,
  syncChecked,
} from './choice-styles';

/** CheckboxGroup 交给组内 Checkbox 的状态 */
export interface CheckboxGroupState {
  /** 已勾选的值 */
  readonly value: readonly string[];
  /** 表单提交时的 name，组内每个 Checkbox 共用 */
  readonly name: string | undefined;
  /** 整组不可用 */
  readonly disabled: boolean;
  /** 整组只读 */
  readonly readonly: boolean;
  /** 整组校验未通过 */
  readonly invalid: boolean;
  /** 勾选或取消一个值 */
  toggle(value: string): void;
}

/** CheckboxGroup 的上下文：自定义的勾选项可以 inject 它接入组 */
export const CheckboxGroupContext = createContext<CheckboxGroupState>('CheckboxGroup');

/** 勾选状态与可用性由组件管理；原生的 size 属性让给字号档位 */
export type CheckboxManaged =
  'type' | 'checked' | 'disabled' | 'required' | 'size' | 'aria-invalid' | 'aria-describedby';

/** 未声明的属性落到 input 上；外层 label 用 propsRoot */
export interface CheckboxProps extends PartProps<'input', CheckboxManaged> {
  /** 是否勾选：父级写 _checked={x}；在复选组里时由组决定 */
  _checked?: boolean;
  /** 部分勾选（“全选”下面只选了一部分）：显示横线，读屏念“部分选中” */
  indeterminate?: boolean;
  /** 在复选组里的值；单独使用时是表单提交的值（默认 on） */
  value?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能聚焦、读屏念“只读”，勾选状态不能改（查看详情、审批时）；外观照常 */
  readonly?: boolean;
  /** 必填（如“同意条款”） */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 字号档位；不写时继承上下文字号 */
  size?: TextSize;
  /** 选中时的色调（与 Button、Badge 等同一套），默认 accent；可以用 defaults.Choice 统一改 */
  tone?: StatusTone;
  /** 外层 label 的部件属性 */
  propsRoot?: PartProps<'label'>;
  /** 叠放层的部件属性 */
  propsControl?: PartProps<'span'>;
  /** 对勾 / 横线图标的部件属性 */
  propsIndicator?: Partial<IconProps>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 文字下方的说明（aria-describedby） */
  description?: VNodeChild;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'span'>;
  /** 文字 */
  children?: VNodeChild;
}

/** Checkbox 的样式：box、indicator、hidden */
export const checkboxStyles = css.create({
  box: { width: '1.125em', height: '1.125em', borderRadius: '_sm' },
  indicator: { width: '0.875em', height: '0.875em', color: 'var(--tone-on-fill)' },
  hidden: { visibility: 'hidden' },
});

/** 复选框：原生 checkbox 加自绘的方框与对勾 */
export const Checkbox = _component(
  ({
    _checked: checked = _bindable(false),
    indeterminate = false,
    value,
    disabled,
    readonly,
    required,
    invalid,
    size,
    tone,
    id,
    propsRoot,
    propsControl,
    propsIndicator,
    propsLabel,
    description,
    propsDescription,
    children,
    ...rest
  }: CheckboxProps) => {
    const group = CheckboxGroupContext.inject(null);
    const descriptionId = `${useId()}-description`;
    const appearance = useChoiceAppearance(() => ({ size, tone }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let input = _state.raw<HTMLInputElement | null>(null);
    // 用户点击勾上时对勾描线；初次渲染、外部改值不播
    let drawCheck = _state(false);

    // indeterminate 只能经 DOM 属性设置
    _effect(() => {
      if (input) input.indeterminate = indeterminate;
    });

    function onChange(event: Event) {
      const target = event.target as HTMLInputElement;
      const next = target.checked;
      drawCheck = next;
      if (group && value != null) group.toggle(value);
      else checked = next;
      syncChecked([target], () => (group && value != null ? group.value.includes(value) : checked));
    }

    return () => {
      // 在复选组里时，id 与说明归组所有，不再给每一项
      const field = group ? undefined : control();
      const isChecked = group && value != null ? group.value.includes(value) : checked;
      const off = disabled ?? group?.disabled ?? field?.disabled ?? false;
      const locked = readonly ?? group?.readonly ?? field?.readonly ?? false;
      const bad = invalid ?? group?.invalid ?? field?.invalid ?? false;
      const marked = isChecked || indeterminate;
      const s = choiceParts(appearance(), { disabled: off, readonly: locked });
      return (
        <label
          {...mergeAttrs<'label'>(s.root, propsRoot)}
          data-state={indeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
          data-disabled={off || undefined}
          data-readonly={locked || undefined}
        >
          <span {...mergeAttrs<'span'>(s.control, propsControl)}>
            <input
              {...mergeAttrs<'input'>(
                {
                  ...s.input,
                  sx: [
                    s.input.sx,
                    focusRingStyles.tight,
                    checkboxStyles.box,
                    marked && choiceInputStyles.checked,
                    bad && choiceInputStyles.invalid,
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
                  'aria-readonly': locked || undefined,
                  'aria-describedby':
                    [field?.describedBy, hasContent(description) && descriptionId]
                      .filter(Boolean)
                      .join(' ') || undefined,
                  onChange,
                  ...(locked && readonlyChoiceHandlers),
                },
              )}
            />
            <Icon
              {...mergePartProps<IconProps>(
                {
                  ...s.indicator,
                  icon: indeterminate ? Minus : Check,
                  draw: drawCheck && isChecked && !indeterminate,
                  strokeWidth: 3,
                  sx: [s.indicator.sx, checkboxStyles.indicator, !marked && checkboxStyles.hidden],
                },
                propsIndicator,
              )}
            />
          </span>
          {(hasContent(children) || hasContent(description)) && (
            <span {...mergeAttrs<'span'>(s.label, propsLabel)}>
              {children}
              {hasContent(description) && (
                <span
                  {...mergeAttrs<'span'>(s.description, propsDescription, {
                    id: descriptionId,
                  })}
                >
                  {description}
                </span>
              )}
            </span>
          )}
        </label>
      );
    };
  },
);

/** 未声明的属性落到 div（role="group"）上 */
export interface CheckboxGroupBaseProps<T> extends PartProps<'div', 'role'> {
  /** 勾选的值：父级写 _value={list} */
  _value?: string[];
  /** 表单提交时各项共用的 name */
  name?: string;
  /** 整组不可用 */
  disabled?: boolean;
  /** 整组只读 */
  readonly?: boolean;
  /** 校验未通过（如“至少选一项”） */
  invalid?: boolean;
  /** 排列方向，默认 vertical */
  orientation?: keyof ChoiceOrientations;
  /** 各项：ListboxOption（值、文字、说明、不可用）、字符串，或任意数据加 toOption；写了 children 时不用 */
  items?: readonly T[];
  /** Checkbox；不写时按 items 生成 */
  children?: VNodeChild;
}

/** CheckboxGroup 的属性：items 是 ListboxOption、字符串时不用 toOption */
export type CheckboxGroupProps<T = ListboxOption> = CheckboxGroupBaseProps<T> & OptionMapping<T>;

/** 一组复选框：value 是勾选项的值的数组 */
export const CheckboxGroup = _component(
  <T = ListboxOption,>({
    _value: value = _bindable<string[]>([]),
    name,
    disabled,
    readonly,
    invalid,
    orientation = 'vertical',
    id,
    items,
    toOption,
    children,
    ...rest
  }: CheckboxGroupProps<T>) => {
    const control = useFieldControl(() => ({ id, disabled, readonly, invalid }));
    const recipe = useRecipe(choiceRecipe);
    CheckboxGroupContext.provide({
      get value() {
        return value;
      },
      get name() {
        return name;
      },
      get disabled() {
        return control().disabled;
      },
      get readonly() {
        return control().readonly;
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
          {...mergeAttrs<'div'>(recipe({ orientation }).group, rest, {
            id: state.id,
            role: 'group',
            'aria-labelledby': defaultLabelledBy(rest, state.labelledBy),
            'aria-describedby': state.describedBy,
          })}
          data-orientation={orientation}
          data-disabled={state.disabled || undefined}
          data-readonly={state.readonly || undefined}
        >
          {children ??
            items?.map((item) => {
              const option = toListboxOption(item, toOption);
              return (
                <Checkbox
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled || undefined}
                  description={option.description}
                >
                  {option.label}
                </Checkbox>
              );
            })}
        </div>
      );
    };
  },
);
