/**
 * 数字输入框（role="spinbutton"）：外壳同 TextField，右侧带减少 / 增加按钮。参考 React Aria NumberField、WAI-ARIA Spinbutton。
 *
 *   <Field label="数量"><NumberField value={_bind(count)} min={1} max={99} /></Field>
 *   <NumberField value={_bind(price)} step={0.01} format={{ style: 'currency', currency: 'CNY' }} aria-label="单价" />
 *   <NumberField value={_bind(amount)} valueType={Decimal} step={new Decimal('0.01')} />   // 金额：Decimal 精确运算
 *
 * - 值可以是 number、bigint 或 decimal.js 的 Decimal，写回时保持传入的类型（一开始为空时按 valueType）；
 *   bigint 与 Decimal 的加减、对齐步长都精确运算，不经过浮点数。表单提交的是十进制文本（FormValue），不是显示的格式。
 * - 输入时是普通文本；失焦或回车时解析、夹到 min–max、对齐到 step 后写回（snapToStep，没有浮点误差），解析不了时恢复原值；
 *   清空后写回 null。没在编辑时按 format（Intl.NumberFormat 的选项）与当前语言显示，编辑时去掉千分位。
 * - 认当前语言的小数点与千分位，也认中文输入法打出的全角数字和全角句点。
 * - ↑ / ↓ 加减 step，Page Up / Page Down 加减 bigStep，Home / End 到 min / max；按钮不在 Tab 顺序里（键盘用方向键），
 *   按住按钮连续加减（先停 400ms，之后每 60ms 一步，同 React Aria）。
 *
 * 未声明的属性落到 input（主元素）上，外壳用 propsRoot。部件：Root、Input、Decrement、Increment（IconButton）。
 */
import { Minus, Plus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { onBeforeUnmount } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import {
  addNumeric,
  compareNumeric,
  multiplyNumeric,
  numericKind,
  snapNumeric,
  toNumber,
  toNumericKind,
  type NumericKind,
  type NumericValue,
} from '../utils/data/numeric';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  controlIcon,
  controlStyles,
  controlSx,
  useControlAppearance,
  type ControlIconOptions,
  type ControlOptions,
} from './control';

/** 值、角色与状态由组件管理 */
export type NumberFieldManaged =
  | 'value'
  | 'name'
  | 'type'
  | 'role'
  | 'inputmode'
  | 'min'
  | 'max'
  | 'step'
  | 'size'
  | 'disabled'
  | 'readonly'
  | 'required'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuetext'
  | 'aria-invalid'
  | 'aria-describedby';

/** 未声明的属性落到 input（主元素）上；外壳用 propsRoot */
export interface NumberFieldProps
  extends PartProps<'input', NumberFieldManaged>, ControlOptions, ControlIconOptions {
  /** 当前值：number、bigint 或 Decimal，父级写 value={_bind(x)}；空着时为 null。写回时保持传入的类型 */
  value?: NumericValue | null;
  /**
   * 值一开始为空时写回的类型：'number'（默认）、'bigint'，或 Decimal 构造函数（`valueType={Decimal}`，
   * Decimal.clone 配过精度的也行）。有值以后按值本身的类型
   */
  valueType?: NumericKind;
  /** 最小值；在表单里默认按 schema（z.number().min(0)、decimalSchema 的 min） */
  min?: NumericValue;
  /** 最大值；在表单里默认按 schema */
  max?: NumericValue;
  /** 步长，默认 1（schema 是 z.number().multipleOf(0.5) 时按它）；提交时对齐到 min + n × step。bigint 至少为 1 */
  step?: NumericValue;
  /** Page Up / Page Down 的步长，默认 step × 10 */
  bigStep?: NumericValue;
  /** 表单字段名：提交的是十进制文本（不带千分位与货币符号），不是输入框里显示的格式 */
  name?: string;
  /** 显示格式（Intl.NumberFormat 的选项），如 `{ style: 'currency', currency: 'CNY' }` */
  format?: Intl.NumberFormatOptions;
  /** 显示减少 / 增加按钮，默认 true */
  stepper?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 减少按钮的部件属性 */
  propsDecrement?: Partial<IconButtonProps>;
  /** 增加按钮的部件属性 */
  propsIncrement?: Partial<IconButtonProps>;
}

/** 当前语言的数字符号：小数点、千分位、负号 */
function numberSymbols(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6);
  const find = (type: string) => parts.find((part) => part.type === type)?.value;
  return {
    decimal: find('decimal') ?? '.',
    group: find('group') ?? ',',
    minus: find('minusSign') ?? '-',
  };
}

/**
 * 按语言把用户输入规范成十进制文本（'-1234.5'）：去掉千分位与空白，认全角数字；
 * 空字符串为 null，解析不了时为 undefined。不经过浮点数，大整数、长小数不丢精度
 */
export function normalizeNumber(text: string, locale: string): string | null | undefined {
  const { decimal, group, minus } = numberSymbols(locale);
  let normalized = text
    // 全角数字、全角句点与负号（中文输入法）
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[．｡]/g, '.')
    .replace(/[－−]/g, '-')
    .replace(/[\s  ]/g, '');
  if (!normalized) return null;
  if (group !== decimal) normalized = normalized.split(group).join('');
  if (decimal !== '.') normalized = normalized.split(decimal).join('.');
  normalized = normalized.split(minus).join('-');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return undefined;
  // '.5' → '0.5'、'12.' → '12'：Decimal 与 BigInt 都认的写法
  return normalized.replace(/^(-?)\./, '$10.').replace(/\.$/, '');
}

/** 按语言解析用户输入成 number：解析不了时为 NaN，空字符串为 null */
export function parseNumber(text: string, locale: string): number | null {
  const normalized = normalizeNumber(text, locale);
  if (normalized === undefined) return Number.NaN;
  return normalized === null ? null : Number(normalized);
}

/** 数字输入框：输入、方向键与按钮加减，提交时夹到范围并对齐步长 */
export const NumberField = _component(
  ({
    value = _bindable<NumericValue | null>(null),
    valueType = 'number',
    min,
    max,
    step,
    bigStep,
    format,
    name,
    stepper = true,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    id,
    propsRoot,
    icon,
    propsIcon,
    propsDecrement,
    propsIncrement,
    ...rest
  }: NumberFieldProps) => {
    const lang = useLang();
    const formatter = useFormat();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    // 范围与步长：显式写的 > 表单 schema 推出的（z.number().int().min(0)）> 不限、1
    const low = (): NumericValue | undefined => min ?? control().constraints.min;
    const high = (): NumericValue | undefined => max ?? control().constraints.max;
    const increment = (): NumericValue => step ?? control().constraints.step ?? 1;
    let input = _state.raw<HTMLInputElement | null>(null);
    // 编辑中的文字；不在编辑时为 null，显示格式化后的值
    let draft = _state<string | null>(null);
    // 写回的类型：最近一次有值时的类型；一直为空时按 valueType
    let lastKind: NumericKind | undefined;
    const kind = () => {
      if (value != null) lastKind = numericKind(value);
      return lastKind ?? valueType;
    };

    const snap = (next: NumericValue) => snapNumeric(next, increment(), low(), high(), kind());
    const plain = (next: NumericValue | null) =>
      next == null ? '' : formatter.number(next, { useGrouping: false, maximumFractionDigits: 20 });

    /** 解析并写回（解析不了时恢复原值） */
    function commit() {
      if (draft == null) return;
      const parsed = normalizeNumber(draft, lang.code);
      if (parsed === null) value = null;
      else if (parsed !== undefined) value = snap(toNumericKind(parsed, kind()));
      draft = null;
    }

    /** 从当前值（编辑中则先解析）加减 delta 的 times 倍；没有值时从 min（或 0）开始 */
    function stepBy(delta: NumericValue, times: number) {
      const typed = draft != null ? normalizeNumber(draft, lang.code) : null;
      const current = draft != null ? (typed == null ? null : toNumericKind(typed, kind())) : value;
      const offset = multiplyNumeric(delta, times, kind());
      value = snap(current == null ? (low() ?? 0) : addNumeric(current, offset, kind()));
      if (draft != null) draft = plain(value);
    }

    function onKeydown(event: KeyboardEvent) {
      const state = control();
      if (state.disabled || state.readonly) return;
      const lowest = low();
      const highest = high();
      const actions: Record<string, (() => void) | undefined> = {
        ArrowUp: () => stepBy(increment(), 1),
        ArrowDown: () => stepBy(increment(), -1),
        PageUp: () => (bigStep == null ? stepBy(increment(), 10) : stepBy(bigStep, 1)),
        PageDown: () => (bigStep == null ? stepBy(increment(), -10) : stepBy(bigStep, -1)),
        Home: lowest == null ? undefined : () => (value = toNumericKind(lowest, kind())),
        End: highest == null ? undefined : () => (value = toNumericKind(highest, kind())),
        Enter: commit,
      };
      const action = actions[event.key];
      if (!action) return;
      if (event.key !== 'Enter') event.preventDefault();
      action();
    }

    // 按住按钮不让 input 失焦：焦点留在输入框里，接着可以用方向键
    const keepFocus = (event: PointerEvent) => {
      if (document.activeElement === input) event.preventDefault();
    };

    // 按住步进按钮：先走一步，停一下后连续走；松开（在哪里松开都算）时停
    let repeat: ReturnType<typeof setTimeout> | undefined;
    // 指针按下已经走过一步，随后的 click 不再走（读屏、键盘触发的 click 照常走一步）
    let stepped = false;
    const stopRepeat = () => clearTimeout(repeat);
    /** direction 为 1 或 -1：按住时连续加减 step */
    function hold(event: PointerEvent, direction: number) {
      keepFocus(event);
      if (event.button !== 0) return;
      stepped = true;
      stepBy(increment(), direction);
      const tick = (wait: number) => {
        repeat = setTimeout(() => {
          stepBy(increment(), direction);
          tick(60);
        }, wait);
      };
      tick(400);
      window.addEventListener('pointerup', stopRepeat, { once: true });
      window.addEventListener('pointercancel', stopRepeat, { once: true });
    }
    function clickStep(direction: number) {
      if (stepped) stepped = false;
      else stepBy(increment(), direction);
    }
    onBeforeUnmount(stopRepeat);

    /** 读屏与原生属性只认 number：bigint、Decimal 转成近似的浮点数 */
    const approximate = (item: NumericValue | null | undefined) =>
      item == null ? undefined : toNumber(item);
    const isInteger = (item: NumericValue) =>
      typeof item === 'bigint' ||
      (typeof item === 'number' ? Number.isInteger(item) : item.isInteger());

    return () => {
      const state = control();
      const editable = !state.disabled && !state.readonly;
      const shown = draft ?? (value == null ? '' : formatter.number(value, format));
      const lowest = low();
      const highest = high();
      const integer = isInteger(increment()) && (lowest == null || isInteger(lowest));
      const atLowest = value != null && lowest != null && compareNumeric(value, lowest) <= 0;
      const atHighest = value != null && highest != null && compareNumeric(value, highest) >= 0;
      return (
        <div
          {...mergeAttrs<'div'>({ sx: controlSx(appearance(), state) }, propsRoot)}
          data-invalid={state.invalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          {controlIcon(icon, propsIcon)}
          <input
            {...mergeAttrs<'input'>({ sx: controlStyles.input }, rest, {
              ref: _toRef(input),
              id: state.id,
              type: 'text',
              role: 'spinbutton',
              inputmode:
                integer && lowest != null && compareNumeric(lowest, 0) >= 0 ? 'numeric' : 'decimal',
              autocomplete: rest.autocomplete ?? 'off',
              value: shown,
              disabled: state.disabled,
              readonly: state.readonly,
              required: state.required,
              'aria-valuenow': approximate(value),
              'aria-valuemin': approximate(lowest),
              'aria-valuemax': approximate(highest),
              'aria-valuetext': value == null ? undefined : formatter.number(value, format),
              'aria-invalid': state.invalid || undefined,
              'aria-describedby': state.describedBy,
              onFocus: () => (draft = plain(value)),
              onInput: (event: Event) => (draft = (event.target as HTMLInputElement).value),
              onBlur: commit,
              onKeydown,
            })}
          />
          {stepper && (
            <>
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  {
                    sx: controlStyles.button,
                    radius: 'full',
                    icon: Minus,
                    'aria-label': lang.numberDecrement,
                  },
                  propsDecrement,
                  {
                    tabindex: -1,
                    disabled: !editable || atLowest,
                    onPointerdown: (event: PointerEvent) => hold(event, -1),
                    onClick: () => clickStep(-1),
                  },
                )}
              />
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  {
                    sx: controlStyles.button,
                    radius: 'full',
                    icon: Plus,
                    'aria-label': lang.numberIncrement,
                  },
                  propsIncrement,
                  {
                    tabindex: -1,
                    disabled: !editable || atHighest,
                    onPointerdown: (event: PointerEvent) => hold(event, 1),
                    onClick: () => clickStep(1),
                  },
                )}
              />
            </>
          )}
          <FormValue name={name} value={value} />
        </div>
      );
    };
  },
);
