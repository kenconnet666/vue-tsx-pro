/**
 * 单行文本框：外壳（div）里放原生 input，前后可以带图标，可以一键清空；type="password" 时带显示 / 隐藏密码的按钮。
 *
 *   <TextField value={_bind(keyword)} type="search" icon={Search} clearable aria-label="搜索" />
 *   <Field label="密码" error={errors.password}><TextField value={_bind(password)} type="password" /></Field>
 *
 * 未声明的属性落到 input（主元素）上，外壳用 propsRoot（COMPONENTS.md §2）。
 * 双向绑定经 v-model：中文输入法组合输入期间不写回，组合结束才写回。
 * 在 Field 里时自动关联标签、说明、错误信息，并沿用 Field 的 invalid / required / disabled / readonly。
 *
 * 部件：Root（外壳）、Input、Icon、IconEnd、Clear（ClearButton）、Reveal（显示密码的 IconButton）。
 */
import { Eye, EyeOff } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { ClearButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { useFieldControl } from './Field';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import {
  controlStyles,
  controlSx,
  focusOnShell,
  useControlAppearance,
  type ControlOptions,
} from './control';

/** 值与状态由组件管理；原生的 size 属性（字符宽度）让给字号档位 */
export type TextFieldManaged =
  'value' | 'disabled' | 'readonly' | 'required' | 'size' | 'aria-invalid' | 'aria-describedby';

/** 未声明的属性落到 input（主元素）上；外壳用 propsRoot */
export interface TextFieldProps extends PartProps<'input', TextFieldManaged>, ControlOptions {
  /** 输入值：父级写 value={_bind(x)} 双向绑定 */
  value?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：可以选中、复制，不能修改 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 有内容时显示清空按钮 */
  clearable?: boolean;
  /** 前置图标 */
  icon?: IconData;
  /** 后置图标 */
  iconEnd?: IconData;
  /** 外壳（边框、焦点环）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 前置图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 后置图标的部件属性 */
  propsIconEnd?: Partial<IconProps>;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
  /** 显示 / 隐藏密码按钮的部件属性 */
  propsReveal?: Partial<IconButtonProps>;
}

/** 单行文本框：未声明的属性落到 input 上 */
export const TextField = _component(
  ({
    value = _bindable(''),
    type = 'text',
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    clearable = false,
    icon,
    iconEnd,
    id,
    propsRoot,
    propsIcon,
    propsIconEnd,
    propsClear,
    propsReveal,
    ...rest
  }: TextFieldProps) => {
    const lang = useLang();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let input = _state.raw<HTMLInputElement | null>(null);
    let revealed = _state(false);

    function clear() {
      value = '';
      input?.focus();
    }

    return () => {
      const state = control();
      const editable = !state.disabled && !state.readonly;
      const password = type === 'password';
      return (
        <div
          {...elementProps(
            mergeProps<'div'>({ sx: controlSx(appearance(), state) }, propsRoot, {
              onPointerdown: focusOnShell(() => input),
            }),
          )}
          data-invalid={state.invalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          {icon && (
            <Icon {...mergePartProps<IconProps>({ icon, sx: controlStyles.icon }, propsIcon)} />
          )}
          {/* _bind 编译为 v-model：复用 Vue 对输入法组合输入的处理，组合结束才写回 */}
          <input
            {...elementProps(
              mergeProps<'input'>({ sx: controlStyles.input }, rest, {
                ref: _toRef(input),
                id: state.id,
                type: password && revealed ? 'text' : type,
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                'aria-invalid': state.invalid || undefined,
                'aria-describedby': state.describedBy,
              }),
            )}
            value={_bind(value)}
          />
          {clearable && value && editable && (
            <ClearButton
              {...mergePartProps<PresetIconButtonProps>(
                { sx: controlStyles.button, radius: 'full' },
                propsClear,
                { onClick: clear },
              )}
            />
          )}
          {password && (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  sx: controlStyles.button,
                  radius: 'full',
                  icon: revealed ? EyeOff : Eye,
                  // 名称不变、用 aria-pressed 表示状态：读屏念“显示密码，已按下”（名称跟着变会和按下状态打架）
                  'aria-label': lang.passwordShow,
                },
                propsReveal,
                {
                  disabled: state.disabled,
                  'aria-pressed': revealed,
                  onClick: () => (revealed = !revealed),
                },
              )}
            />
          )}
          {iconEnd && (
            <Icon
              {...mergePartProps<IconProps>(
                { icon: iconEnd, sx: controlStyles.icon },
                propsIconEnd,
              )}
            />
          )}
        </div>
      );
    };
  },
);
