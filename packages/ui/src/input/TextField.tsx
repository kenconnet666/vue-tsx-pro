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
 * 部件：Root（外壳）、Input、Icon、IconEnd、Prefix、Suffix（固定文字）、Clear（ClearButton）、Reveal（显示密码的 IconButton）、
 * Count（字数计数 CharacterCount）。
 */
import { Eye, EyeOff } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { useId, type VNodeChild } from 'vue';
import { ClearButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { CharacterCount, type CharacterCountProps } from './CharacterCount';
import { useFieldControl } from '../form/Field';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  controlStyles,
  controlSx,
  focusOnShell,
  useControlAppearance,
  type ControlOptions,
} from './control';

/** 值与状态由组件管理；原生的 size 属性（字符宽度）让给字号档位，prefix 属性（RDFa）让给前缀 */
export type TextFieldManaged =
  | 'value'
  | 'disabled'
  | 'readonly'
  | 'required'
  | 'size'
  | 'prefix'
  | 'aria-invalid'
  | 'aria-describedby';

/** schema 的格式（JSON Schema format）→ 输入框的 type：手机上弹出对应的键盘 */
const FORMAT_TYPES: Readonly<Record<string, 'email' | 'url'>> = { email: 'email', uri: 'url' };

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
  /** 输入框前的固定文字（如 `https://`、`¥`），不算在值里 */
  prefix?: VNodeChild;
  /** 输入框后的固定文字（如 `.com`、`元`），不算在值里 */
  suffix?: VNodeChild;
  /** 显示字数计数；上限取 maxlength（含 zod 推出的约束），超出时用危险色 */
  showCount?: boolean;
  /** 外壳（边框、焦点环）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 前置图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 后置图标的部件属性 */
  propsIconEnd?: Partial<IconProps>;
  /** 前缀文字的部件属性 */
  propsPrefix?: PartProps<'span'>;
  /** 后缀文字的部件属性 */
  propsSuffix?: PartProps<'span'>;
  /** 字数计数的部件属性 */
  propsCount?: Partial<CharacterCountProps>;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
  /** 显示 / 隐藏密码按钮的部件属性 */
  propsReveal?: Partial<IconButtonProps>;
}

/** 单行文本框：未声明的属性落到 input 上 */
export const TextField = _component(
  ({
    value = _bindable(''),
    type,
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
    prefix,
    suffix,
    showCount = false,
    id,
    propsRoot,
    propsIcon,
    propsIconEnd,
    propsPrefix,
    propsSuffix,
    propsCount,
    propsClear,
    propsReveal,
    ...rest
  }: TextFieldProps) => {
    const lang = useLang();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let input = _state.raw<HTMLInputElement | null>(null);
    let revealed = _state(false);
    const countId = useId();

    function clear() {
      value = '';
      input?.focus();
    }

    return () => {
      const state = control();
      const editable = !state.disabled && !state.readonly;
      const constraints = state.constraints;
      // 不写 type 时按 schema 的格式选：z.email() → email、z.url() → url
      const inputType = type ?? FORMAT_TYPES[constraints.format ?? ''] ?? 'text';
      const password = inputType === 'password';
      const limit = rest.maxlength ?? constraints.maxLength;
      const describedBy = [state.describedBy, showCount && countId].filter(Boolean).join(' ');
      return (
        <div
          {...mergeAttrs<'div'>({ sx: controlSx(appearance(), state) }, propsRoot, {
            onPointerdown: focusOnShell(() => input),
          })}
          data-invalid={state.invalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          {icon && (
            <Icon {...mergePartProps<IconProps>({ icon, sx: controlStyles.icon }, propsIcon)} />
          )}
          {prefix != null && (
            <span {...mergeAttrs<'span'>({ sx: controlStyles.affix }, propsPrefix)}>{prefix}</span>
          )}
          {/* _bind 编译为 v-model：复用 Vue 对输入法组合输入的处理，组合结束才写回 */}
          <input
            {...mergeAttrs<'input'>(
              {
                sx: controlStyles.input,
                minlength: constraints.minLength,
                maxlength: constraints.maxLength,
              },
              rest,
              {
                ref: _toRef(input),
                id: state.id,
                type: password && revealed ? 'text' : inputType,
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                'aria-invalid': state.invalid || undefined,
                'aria-describedby': describedBy || undefined,
              },
            )}
            value={_bind(value)}
          />
          {suffix != null && (
            <span {...mergeAttrs<'span'>({ sx: controlStyles.affix }, propsSuffix)}>{suffix}</span>
          )}
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
          {showCount && (
            <CharacterCount
              {...mergePartProps<CharacterCountProps>(
                { count: value.length, max: limit == null ? undefined : Number(limit) },
                propsCount,
                { id: countId },
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
