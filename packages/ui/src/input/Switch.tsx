/**
 * 开关（原生 input type="checkbox" + role="switch"）：立即生效的开 / 关设置，如“接收通知”。
 * 需要提交才生效的选项用 Checkbox。结构与样式见 choice-styles.ts：input 画成轨道，滑块叠在上面。
 *
 *   <Switch checked={_bind(notify)}>接收通知</Switch>
 *
 * 读屏念“开关，开 / 关”；空格切换（原生）。在 Field 里时关联说明与错误、沿用其状态。
 * 部件：Root（label）、Control（叠放层）、Thumb（滑块）、Label（文字）；未声明的属性落到 input 上。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useFieldControl } from './Field';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/typography';
import { choiceStyles } from './choice-styles';

/** 角色、勾选状态与可用性由组件管理；原生的 size 属性让给字号档位 */
type Managed =
  | 'type'
  | 'role'
  | 'checked'
  | 'disabled'
  | 'required'
  | 'size'
  | 'aria-invalid'
  | 'aria-describedby';

/** 未声明的属性落到 input 上；外层 label 用 propsRoot */
export interface SwitchProps extends PartProps<'input', Managed> {
  /** 是否打开：父级写 checked={_bind(x)} */
  checked?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 字号档位；不写时继承上下文字号 */
  size?: TextSize;
  /** 外层 label 的部件属性 */
  propsRoot?: PartProps<'label'>;
  /** 叠放层的部件属性 */
  propsControl?: PartProps<'span'>;
  /** 滑块的部件属性 */
  propsThumb?: PartProps<'span'>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 文字 */
  children?: VNodeChild;
}

const styles = stylex.create({
  track: { width: '2.25em', height: '1.25em', borderRadius: '_full', borderColor: 'transparent' },
  trackOff: { backgroundColor: '_borderStrong' },
  // 滑块靠起始边，打开后移到结束边：用逻辑方向的外边距，从右到左排版自动反过来
  thumb: {
    justifySelf: 'start',
    width: '0.875em',
    height: '0.875em',
    marginInlineStart: '0.1875em',
    borderRadius: '_full',
    backgroundColor: '_background',
    boxShadow: '_sm',
    transition: 'margin-inline-start _durations.sm _easings.standard',
  },
  thumbOn: { marginInlineStart: '1.1875em', backgroundColor: '_accentContrast' },
});

/** 开关：立即生效的开 / 关 */
export const Switch = _component(
  ({
    checked = _bindable(false),
    disabled,
    required,
    invalid,
    size,
    id,
    propsRoot,
    propsControl,
    propsThumb,
    propsLabel,
    children,
    ...rest
  }: SwitchProps) => {
    const control = useFieldControl(() => ({ id, invalid, required, disabled }));
    return () => {
      const state = control();
      return (
        <label
          {...elementProps(
            mergeProps<'label'>(
              {
                sx: [
                  choiceStyles.root,
                  size && fontSizeStyles[size],
                  state.disabled && choiceStyles.disabled,
                ],
              },
              propsRoot,
            ),
          )}
          data-state={checked ? 'checked' : 'unchecked'}
          data-disabled={state.disabled || undefined}
        >
          <span {...elementProps(mergeProps<'span'>({ sx: choiceStyles.control }, propsControl))}>
            <input
              {...elementProps(
                mergeProps<'input'>(
                  {
                    sx: [
                      choiceStyles.input,
                      styles.track,
                      checked ? choiceStyles.checked : styles.trackOff,
                      state.invalid && choiceStyles.invalid,
                    ],
                  },
                  rest,
                  {
                    type: 'checkbox',
                    role: 'switch',
                    id: state.id,
                    checked,
                    disabled: state.disabled,
                    required: state.required,
                    'aria-invalid': state.invalid || undefined,
                    'aria-describedby': state.describedBy,
                    onChange: (event: Event) =>
                      (checked = (event.target as HTMLInputElement).checked),
                  },
                ),
              )}
            />
            <span
              {...elementProps(
                mergeProps<'span'>(
                  { sx: [choiceStyles.mark, styles.thumb, checked && styles.thumbOn] },
                  propsThumb,
                ),
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
