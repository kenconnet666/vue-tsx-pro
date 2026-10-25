/**
 * 验证码输入框：一格一个字符的短信验证码、动态口令、取件码。
 *
 *   <Field label="短信验证码"><OtpField _value={code} onComplete={verify} /></Field>
 *   <OtpField length={8} type="alphanumeric" groups={[4, 4]} aria-label="恢复码" />
 *
 * 参考 input-otp（shadcn 的 InputOTP）的做法：只有一个真正的 input（透明、盖在格子上面），格子只是显示。
 * 所以短信验证码的自动填充（autocomplete="one-time-code"）、整段粘贴、退格、选中都是原生的，读屏看到的是一个输入框；
 * 输入时只留数字（或字母数字），填满时调用 onComplete。焦点在框里时当前格画焦点环，空格里有闪烁的光标。
 * 部件：Root（div：格子的容器）、Input（主元素）、Slot（div，每格一个）、Separator（groups 之间）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useFieldControl } from '../form/Field';
import { mergeAttrs, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { t } from '../config/theme/tokens';

/** 能输入的字符 */
export interface OtpCharsets {
  /** 只有数字（默认），手机弹出数字键盘 */
  numeric: unknown;
  /** 字母与数字，字母转成大写 */
  alphanumeric: unknown;
}

/** 值、类型与状态由组件管理 */
export type OtpFieldManaged =
  'value' | 'type' | 'maxlength' | 'inputmode' | 'pattern' | 'disabled' | 'readonly' | 'required';

/** 未声明的属性落到 input（主元素）上；格子的容器用 propsRoot */
export interface OtpFieldProps extends PartProps<'input', OtpFieldManaged> {
  /** 输入的字符：父级写 _value={code} */
  _value?: string;
  /** 几位，默认 6 */
  length?: number;
  /** 能输入的字符，默认 numeric */
  type?: keyof OtpCharsets;
  /** 分组显示（如 [3, 3] 在中间加一道短横线）；各组加起来要等于 length */
  groups?: readonly number[];
  /** 显示成圆点（动态口令、支付密码） */
  mask?: boolean;
  /** 填满时调用（输入、粘贴、自动填充都算） */
  onComplete?: (value: string) => void;
  /** 字号档位：格子随之缩放 */
  size?: TextSize;
  /** 不可用（不写时取 Field 的） */
  disabled?: boolean;
  /** 只读（不写时取 Field 的） */
  readonly?: boolean;
  /** 必填（不写时取 Field 的） */
  required?: boolean;
  /** 校验未通过（不写时取 Field 的） */
  invalid?: boolean;
  /** 格子的容器的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 每一格的部件属性 */
  propsSlot?: PartProps<'div'>;
  /** 分组之间的分隔的部件属性 */
  propsSeparator?: PartProps<'span'>;
  children?: VNodeChild;
}

const blink = css.keyframes({ '50%': { opacity: 0 } });

/** OtpField 的样式：root、input、slot、active、invalid、disabled、caret、separator */
export const otpFieldStyles = css.create({
  root: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
  },
  // 真正的输入框盖在格子上面：透明、光标与选中都不显示，点哪一格都是点它
  input: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
    appearance: 'none',
    color: 'transparent',
    caretColor: 'transparent',
    fontSize: '1em',
    letterSpacing: '-0.5em',
    cursor: 'text',
    '::selection': { backgroundColor: 'transparent' },
  },
  slot: {
    boxSizing: 'border-box',
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: '2.5em',
    height: `max(2.75em, ${t.sizes.minTarget})`,
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_surface',
    color: '_text',
    fontSize: '1.15em',
    fontWeight: '_semibold',
    fontVariantNumeric: 'tabular-nums',
    transition: `border-color ${t.durations.sm} ${t.easings.standard}`,
  },
  // 当前格：同输入框聚焦时的强调描边与焦点环
  active: {
    borderColor: '_accent',
    outlineWidth: '_borderWidths.sm',
    outlineStyle: 'solid',
    outlineColor: '_accentBorder',
    outlineOffset: 0,
  },
  invalid: { borderColor: '_danger' },
  disabled: { opacity: '_disabled' },
  // 空的当前格里闪烁的光标；减少动态效果时常亮
  caret: {
    width: '1px',
    height: '1.1em',
    backgroundColor: '_text',
    animationName: { default: blink, '@media (prefers-reduced-motion: reduce)': 'none' },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'steps(1)',
  },
  separator: { width: '0.6em', height: '2px', backgroundColor: '_borderStrong' },
});

const SANITIZE = {
  numeric: (text: string) => text.replace(/\D/g, ''),
  alphanumeric: (text: string) => text.replace(/[^0-9a-z]/gi, '').toUpperCase(),
};

/** 验证码输入框：一个原生 input + 显示用的格子 */
export const OtpField = _component(
  ({
    _value: value = _bindable(''),
    length = 6,
    type = 'numeric',
    groups,
    mask = false,
    onComplete,
    size,
    disabled,
    readonly,
    required,
    invalid,
    id,
    propsRoot,
    propsSlot,
    propsSeparator,
    ...rest
  }: OtpFieldProps) => {
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let focused = _state(false);

    function onInput(event: Event) {
      const input = event.target as HTMLInputElement;
      const next = SANITIZE[type](input.value).slice(0, length);
      // 过滤掉的字符不留在输入框里
      if (input.value !== next) input.value = next;
      if (next === value) return;
      value = next;
      if (next.length === length) onComplete?.(next);
    }

    /** 第 index 格后面是不是一组的结尾（要加分隔） */
    const groupEnds = () => {
      const ends = new Set<number>();
      let sum = 0;
      for (const size of groups ?? []) {
        sum += size;
        if (sum < length) ends.add(sum - 1);
      }
      return ends;
    };

    return () => {
      const state = control();
      // 值只有数字与字母（输入时已过滤），按字符拆开就是按格
      const chars = value.split('');
      const current = Math.min(chars.length, length - 1);
      const ends = groupEnds();
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [otpFieldStyles.root, size && fontSizeStyles[size]] },
            propsRoot,
          )}
          data-invalid={state.invalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          {Array.from({ length }, (_, index) => {
            const char = chars[index];
            const active = focused && !state.readonly && index === current;
            return [
              <div
                key={`slot-${index}`}
                aria-hidden="true"
                {...mergeAttrs<'div'>(
                  {
                    sx: [
                      otpFieldStyles.slot,
                      state.invalid && otpFieldStyles.invalid,
                      active && otpFieldStyles.active,
                      state.disabled && otpFieldStyles.disabled,
                    ],
                  },
                  propsSlot,
                )}
                data-state={char ? 'filled' : 'empty'}
              >
                {char
                  ? mask
                    ? '•'
                    : char
                  : active && <span {...css.attrs(otpFieldStyles.caret)} />}
              </div>,
              ends.has(index) && (
                <span
                  key={`separator-${index}`}
                  aria-hidden="true"
                  {...mergeAttrs<'span'>({ sx: otpFieldStyles.separator }, propsSeparator)}
                />
              ),
            ];
          })}
          <input
            {...mergeAttrs<'input'>(
              { sx: otpFieldStyles.input, autocomplete: 'one-time-code', spellcheck: false },
              rest,
              {
                id: state.id,
                value,
                type: mask ? 'password' : 'text',
                inputmode: type === 'numeric' ? 'numeric' : 'text',
                pattern: type === 'numeric' ? `\\d{${length}}` : `[0-9A-Za-z]{${length}}`,
                maxlength: length,
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                'aria-invalid': state.invalid || undefined,
                'aria-describedby': state.describedBy,
                onInput,
                onFocus: () => (focused = true),
                onBlur: () => (focused = false),
              },
            )}
          />
        </div>
      );
    };
  },
);
