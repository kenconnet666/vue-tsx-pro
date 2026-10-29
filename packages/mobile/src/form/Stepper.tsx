/**
 * 步进器：减号、数字、加号，调整数量（购物车的件数、人数）。按住加减号连续变化；中间的数字也可以直接输入，失焦时按范围修正。
 *
 *   <Stepper _value={count} min={1} max={99} />
 *   <Stepper _value={weight} step={0.5} decimalLength={1} theme="round" />
 */
import { Minus, Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount } from 'vue';
import { Icon } from '../base/Icon';
import { useConfig } from '../config/context';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { useForm } from './context';

/** 外观 */
export interface StepperThemes {
  /** 方块按钮，浅灰底（默认） */
  default: unknown;
  /** 圆按钮：减号描边、加号实底 */
  round: unknown;
}

/** 未声明的属性落到根元素（div）上 */
export interface StepperProps extends Omit<PartProps<'div', 'role'>, 'onChange'> {
  /** 当前的数；双向绑定写 `_value={x}` */
  _value?: number;
  /**
   * 最小值
   * @default 1
   */
  min?: number;
  /** 最大值 */
  max?: number;
  /**
   * 每次加减多少
   * @default 1
   */
  step?: number;
  /** 保留几位小数；不给时按 step 的小数位 */
  decimalLength?: number;
  /**
   * 外观
   * @default 'default'
   */
  theme?: keyof StepperThemes;
  /** 禁用 */
  disabled?: boolean;
  /** 中间的数不能直接输入（只能点加减） */
  disableInput?: boolean;
  /**
   * 按住加减号时连续变化
   * @default true
   */
  longPress?: boolean;
  /** 数变了 */
  onChange?: (value: number) => void;
  /** 减号按钮的部件属性 */
  propsMinus?: PartProps<'button'>;
  /** 加号按钮的部件属性 */
  propsPlus?: PartProps<'button'>;
  /** 输入框的部件属性 */
  propsInput?: PartProps<'input', 'value' | 'disabled' | 'readonly' | 'inputmode'>;
}

/** Stepper 的样式：root、button、round、plusRound、input */
export const stepperStyles = css.create({
  root: { display: 'inline-flex', alignItems: 'center', gap: '0.15em', verticalAlign: 'middle' },
  button: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2em',
    height: '2em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: '_sm',
    backgroundColor: { default: '_fill', ':active:not([disabled])': '_fillActive' },
    color: { default: '_text', '[disabled]': '_textDisabled' },
    fontSize: '1em',
    cursor: { default: 'pointer', '[disabled]': 'not-allowed' },
    userSelect: 'none',
  },
  round: {
    borderRadius: '_full',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: { default: '_accent', '[disabled]': '_border' },
    backgroundColor: { default: '_surface', ':active:not([disabled])': '_accentSoft' },
    color: { default: '_accentText', '[disabled]': '_textDisabled' },
  },
  plusRound: {
    backgroundColor: {
      default: '_accent',
      ':active:not([disabled])': '_accentActive',
      '[disabled]': '_fill',
    },
    color: { default: '_accentContrast', '[disabled]': '_textDisabled' },
  },
  input: {
    boxSizing: 'border-box',
    width: '2.6em',
    height: '2em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: '_sm',
    backgroundColor: '_fill',
    color: { default: '_text', '[disabled]': '_textDisabled' },
    fontFamily: 'inherit',
    fontSize: 'inherit',
    textAlign: 'center',
    outlineStyle: 'none',
  },
  inputRound: { backgroundColor: 'transparent' },
});

/** 按住多久开始连续变化、之后每隔多久变一次（ms） */
const HOLD_DELAY = 500;
const REPEAT_INTERVAL = 150;

/** 小数位：step 是 0.5 时是 1 */
const decimalsOf = (step: number) => (String(step).split('.')[1] ?? '').length;

/** 步进器（div > 减号 + 输入框 + 加号） */
export const Stepper = _component(
  ({
    _value: value = _bindable(1),
    min = 1,
    max = Number.POSITIVE_INFINITY,
    step = 1,
    decimalLength,
    theme = 'default',
    disabled,
    disableInput = false,
    longPress = true,
    onChange,
    propsMinus,
    propsPlus,
    propsInput,
    ...rest
  }: StepperProps) => {
    const config = useConfig();
    const form = useForm();
    // 正在输入的文字：失焦时才换成数
    let draft = _state<string | null>(null);
    const digits = () => decimalLength ?? decimalsOf(step);
    const clamp = (next: number) => {
      const bounded = Math.min(max, Math.max(min, next));
      return Number(bounded.toFixed(digits()));
    };
    const set = (next: number) => {
      const fixed = clamp(next);
      if (fixed === value) return;
      value = fixed;
      onChange?.(fixed);
    };
    const isDisabled = () => disabled ?? form?.disabled ?? false;

    // 按住连续加减；连续变化过之后松手，那一次点击不再算
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let repeatTimer: ReturnType<typeof setInterval> | undefined;
    let held = false;
    const stopHold = () => {
      clearTimeout(holdTimer);
      clearInterval(repeatTimer);
    };
    onBeforeUnmount(stopHold);
    const startHold = (direction: 1 | -1) => {
      held = false;
      if (!longPress) return;
      stopHold();
      holdTimer = setTimeout(() => {
        held = true;
        repeatTimer = setInterval(() => set(value + direction * step), REPEAT_INTERVAL);
      }, HOLD_DELAY);
    };

    const button = (direction: 1 | -1) => {
      const off =
        isDisabled() || form?.readonly || (direction < 0 ? value <= min : value >= max) || false;
      return (
        <button
          {...mergeAttrs<'button'>(
            {
              sx: [
                stepperStyles.button,
                theme === 'round' && stepperStyles.round,
                theme === 'round' && direction > 0 && stepperStyles.plusRound,
              ],
            },
            direction > 0 ? propsPlus : propsMinus,
            {
              type: 'button',
              disabled: off,
              'aria-label': direction > 0 ? config.lang.increase : config.lang.decrease,
              onTouchstart: () => startHold(direction),
              onTouchend: stopHold,
              onTouchcancel: stopHold,
              onClick: () => {
                if (held) return void (held = false);
                set(value + direction * step);
              },
            },
          )}
        >
          <Icon icon={direction > 0 ? Plus : Minus} />
        </button>
      );
    };

    return () => {
      const off = isDisabled();
      return (
        <div
          {...mergeAttrs<'div'>({ sx: stepperStyles.root }, rest, {
            role: 'group',
            ...dataAttrs({ 'data-disabled': off }),
          })}
        >
          {button(-1)}
          <input
            {...mergeAttrs<'input'>(
              { sx: [stepperStyles.input, theme === 'round' && stepperStyles.inputRound] },
              propsInput,
              {
                value: draft ?? value.toFixed(digits()),
                type: 'text',
                inputmode: digits() > 0 || min < 0 ? 'decimal' : 'numeric',
                disabled: off,
                readonly: disableInput || form?.readonly,
                'aria-valuemin': min,
                'aria-valuemax': Number.isFinite(max) ? max : undefined,
                'aria-valuenow': value,
                role: 'spinbutton',
                onInput: (event: Event) => (draft = (event.target as HTMLInputElement).value),
                onBlur: () => {
                  if (draft === null) return;
                  const parsed = Number.parseFloat(draft);
                  draft = null;
                  if (!Number.isNaN(parsed)) set(parsed);
                },
              },
            )}
          />
          {button(1)}
        </div>
      );
    };
  },
);
