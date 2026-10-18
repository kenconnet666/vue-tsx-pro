// 试点组件：验证主元素透传（...rest → input）、部件 props、输入法、清除按钮，不进组件库
import type { LucideIconData } from '@lucide/icons';
import { X } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { elementProps, mergeProps, useLang, type PartProps } from '@vue-tsx-pro/ui';
import { colors, controls, radii, space } from '@vue-tsx-pro/ui/tokens.stylex';
import { Icon, type IconProps } from './Icon';

/** 未声明的属性落到 input（主元素）上；外层容器用 propsRoot */
export interface TextFieldProps extends PartProps<'input', 'value' | 'disabled' | 'aria-invalid'> {
  /** 输入值：父级写 value={_bind(x)} 双向绑定 */
  value?: string;
  disabled?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 有内容时显示清除按钮 */
  clearable?: boolean;
  /** 前置图标 */
  icon?: LucideIconData;
  propsRoot?: PartProps<'div'>;
  propsIcon?: Partial<IconProps>;
  propsClear?: PartProps<'button', 'type' | 'disabled'>;
}

const styles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.sm,
    minHeight: `max(${controls.height}, ${controls.minTarget})`,
    paddingInline: space.md,
    borderWidth: controls.borderWidth,
    borderStyle: 'solid',
    borderColor: { default: colors.border, ':hover': colors.borderStrong },
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.text,
    outlineStyle: { default: 'none', ':focus-within': 'solid' },
    outlineWidth: controls.focusRingWidth,
    outlineColor: colors.focusRing,
    // 压住边框
    outlineOffset: `calc(-1 * ${controls.borderWidth})`,
  },
  invalid: { borderColor: colors.danger, outlineColor: colors.danger },
  disabled: { opacity: controls.disabledOpacity },
  icon: { color: colors.textMuted },
  input: {
    flexGrow: 1,
    minWidth: 0,
    paddingBlock: space.xs,
    borderWidth: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    '::placeholder': { color: colors.textPlaceholder },
  },
  clear: {
    display: 'inline-flex',
    padding: '0.15em',
    borderWidth: 0,
    borderRadius: radii.sm,
    backgroundColor: { default: 'transparent', ':hover': colors.fillHover },
    color: colors.textMuted,
    cursor: 'pointer',
  },
});

export const TextField = _component(
  ({
    value = _bindable(''),
    disabled = false,
    invalid = false,
    clearable = false,
    icon,
    propsRoot,
    propsIcon,
    propsClear,
    ...rest
  }: TextFieldProps) => {
    const lang = useLang();
    let input = _state.raw<HTMLInputElement | null>(null);

    function clear() {
      value = '';
      input?.focus();
    }

    return () => (
      <div
        {...elementProps(
          mergeProps({ sx: styles.root }, propsRoot, {
            sx: [invalid && styles.invalid, disabled && styles.disabled],
          }),
        )}
      >
        {icon && <Icon icon={icon} {...mergeProps({ sx: styles.icon }, propsIcon)} />}
        {/* _bind 编译为 v-model：复用 Vue 对输入法组合输入的处理，组合结束才写回 */}
        <input
          {...elementProps(
            mergeProps({ sx: styles.input }, rest, {
              ref: _toRef(input),
              disabled,
              'aria-invalid': invalid || undefined,
            }),
          )}
          value={_bind(value)}
        />
        {clearable && value && !disabled && (
          <button
            {...elementProps(
              mergeProps({ sx: styles.clear, 'aria-label': lang.clear }, propsClear, {
                type: 'button',
                onClick: clear,
              }),
            )}
          >
            <Icon icon={X} />
          </button>
        )}
      </div>
    );
  },
);
