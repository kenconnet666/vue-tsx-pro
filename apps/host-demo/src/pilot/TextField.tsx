// 试点组件：验证主元素透传（...rest → input）、部件 props、输入法、清除按钮（ClearButton），不进组件库
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  ClearButton,
  elementProps,
  Icon,
  mergeProps,
  type PresetIconButtonProps,
  type IconData,
  type IconProps,
  type PartProps,
} from '@vue-tsx-pro/ui';

/** 未声明的属性落到 input（主元素）上；外层容器用 propsRoot */
export interface TextFieldProps extends PartProps<'input', 'value' | 'disabled' | 'aria-invalid'> {
  /** 输入值：父级写 value={_bind(x)} 双向绑定 */
  value?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 有内容时显示清除按钮 */
  clearable?: boolean;
  /** 前置图标 */
  icon?: IconData;
  /** 外层容器（边框、焦点环）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 前置图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 清除按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
}

const styles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    minHeight: 'max(_control, _minTarget)',
    paddingInline: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: { default: '_border', ':hover': '_borderStrong' },
    borderRadius: '_md',
    backgroundColor: '_surface',
    color: '_text',
    outlineStyle: { default: 'none', ':focus-within': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    // 压住边框
    outlineOffset: 'calc(-1 * _xs)',
  },
  invalid: { borderColor: '_danger', outlineColor: '_danger' },
  disabled: { opacity: '_disabled' },
  icon: { color: '_textMuted' },
  input: {
    flexGrow: 1,
    minWidth: 0,
    paddingBlock: '_xs',
    borderWidth: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    '::placeholder': { color: '_textPlaceholder' },
  },
  // 比默认的图标按钮紧凑，放进输入框里；仍不小于 24px 的点击区域
  clear: {
    width: 'max(1.5em, _sizes.minTarget)',
    minHeight: 'max(1.5em, _sizes.minTarget)',
    color: '_textMuted',
  },
});

/** 试点文本框：未声明的属性落到 input 上 */
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
    let input = _state.raw<HTMLInputElement | null>(null);

    function clear() {
      value = '';
      input?.focus();
    }

    return () => (
      <div
        {...elementProps(
          mergeProps<'div'>({ sx: styles.root }, propsRoot, {
            sx: [invalid && styles.invalid, disabled && styles.disabled],
          }),
        )}
      >
        {icon && <Icon icon={icon} {...mergeProps<IconProps>({ sx: styles.icon }, propsIcon)} />}
        {/* _bind 编译为 v-model：复用 Vue 对输入法组合输入的处理，组合结束才写回 */}
        <input
          {...elementProps(
            mergeProps<'input'>({ sx: styles.input }, rest, {
              ref: _toRef(input),
              disabled,
              'aria-invalid': invalid || undefined,
            }),
          )}
          value={_bind(value)}
        />
        {clearable && value && !disabled && (
          <ClearButton
            {...mergeProps<PresetIconButtonProps>(
              { sx: styles.clear, radius: 'full' },
              propsClear,
              { onClick: clear },
            )}
          />
        )}
      </div>
    );
  },
);
