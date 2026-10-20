/**
 * 数字输入框（role="spinbutton"）：外壳同 TextField，右侧带减少 / 增加按钮。参考 React Aria NumberField、WAI-ARIA Spinbutton。
 *
 *   <Field label="数量"><NumberField value={_bind(count)} min={1} max={99} /></Field>
 *   <NumberField value={_bind(price)} step={0.01} format={{ style: 'currency', currency: 'CNY' }} aria-label="单价" />
 *
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
import { useFieldControl } from './Field';
import { snapToStep } from '../utils/data/layout';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { controlStyles, controlSx, useControlAppearance, type ControlOptions } from './control';

/** 值、角色与状态由组件管理 */
export type NumberFieldManaged =
  | 'value'
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
export interface NumberFieldProps extends PartProps<'input', NumberFieldManaged>, ControlOptions {
  /** 当前值：父级写 value={_bind(x)}；空着时为 null */
  value?: number | null;
  /** 最小值；在表单里默认按 schema（z.number().min(0)） */
  min?: number;
  /** 最大值；在表单里默认按 schema */
  max?: number;
  /** 步长，默认 1（schema 是 z.number().multipleOf(0.5) 时按它）；提交时对齐到 min + n × step */
  step?: number;
  /** Page Up / Page Down 的步长，默认 step × 10 */
  bigStep?: number;
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

/** 按语言解析用户输入：去掉千分位与空白，认全角数字；解析不了时为 NaN，空字符串为 null */
export function parseNumber(text: string, locale: string): number | null {
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
  return /^-?(\d+\.?\d*|\.\d+)$/.test(normalized) ? Number(normalized) : Number.NaN;
}

/** 数字输入框：输入、方向键与按钮加减，提交时夹到范围并对齐步长 */
export const NumberField = _component(
  ({
    value = _bindable<number | null>(null),
    min,
    max,
    step,
    bigStep,
    format,
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
    propsDecrement,
    propsIncrement,
    ...rest
  }: NumberFieldProps) => {
    const lang = useLang();
    const formatter = useFormat();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    // 范围与步长：显式写的 > 表单 schema 推出的（z.number().int().min(0)）> 不限、1
    const low = () => min ?? control().constraints.min ?? -Infinity;
    const high = () => max ?? control().constraints.max ?? Infinity;
    const increment = () => step ?? control().constraints.step ?? 1;
    let input = _state.raw<HTMLInputElement | null>(null);
    // 编辑中的文字；不在编辑时为 null，显示格式化后的值
    let draft = _state<string | null>(null);

    const snap = (next: number) => snapToStep(next, increment(), low(), high());
    const plain = (next: number | null) =>
      next == null ? '' : formatter.number(next, { useGrouping: false, maximumFractionDigits: 20 });

    /** 解析并写回；返回是否成功（解析不了时恢复原值） */
    function commit() {
      if (draft == null) return;
      const parsed = parseNumber(draft, lang.code);
      if (parsed === null) value = null;
      else if (!Number.isNaN(parsed)) value = snap(parsed);
      draft = null;
    }

    /** 从当前值（编辑中则先解析）加减；没有值时从 min（或 0）开始 */
    function stepBy(delta: number) {
      const current = draft != null ? parseNumber(draft, lang.code) : value;
      const base =
        current == null || Number.isNaN(current) ? (Number.isFinite(low()) ? low() : 0) : current;
      value = snap(current == null || Number.isNaN(current) ? base : base + delta);
      if (draft != null) draft = plain(value);
    }

    function onKeydown(event: KeyboardEvent) {
      const state = control();
      if (state.disabled || state.readonly) return;
      const big = bigStep ?? increment() * 10;
      const actions: Record<string, (() => void) | undefined> = {
        ArrowUp: () => stepBy(increment()),
        ArrowDown: () => stepBy(-increment()),
        PageUp: () => stepBy(big),
        PageDown: () => stepBy(-big),
        Home: Number.isFinite(low()) ? () => (value = low()) : undefined,
        End: Number.isFinite(high()) ? () => (value = high()) : undefined,
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
    function hold(event: PointerEvent, delta: number) {
      keepFocus(event);
      if (event.button !== 0) return;
      stepped = true;
      stepBy(delta);
      const tick = (wait: number) => {
        repeat = setTimeout(() => {
          stepBy(delta);
          tick(60);
        }, wait);
      };
      tick(400);
      window.addEventListener('pointerup', stopRepeat, { once: true });
      window.addEventListener('pointercancel', stopRepeat, { once: true });
    }
    function clickStep(delta: number) {
      if (stepped) stepped = false;
      else stepBy(delta);
    }
    onBeforeUnmount(stopRepeat);

    return () => {
      const state = control();
      const editable = !state.disabled && !state.readonly;
      const shown = draft ?? (value == null ? '' : formatter.number(value, format));
      const integer =
        Number.isInteger(increment()) && (!Number.isFinite(low()) || Number.isInteger(low()));
      return (
        <div
          {...mergeAttrs<'div'>({ sx: controlSx(appearance(), state) }, propsRoot)}
          data-invalid={state.invalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          <input
            {...mergeAttrs<'input'>({ sx: controlStyles.input }, rest, {
              ref: _toRef(input),
              id: state.id,
              type: 'text',
              role: 'spinbutton',
              inputmode: integer && low() >= 0 ? 'numeric' : 'decimal',
              autocomplete: rest.autocomplete ?? 'off',
              value: shown,
              disabled: state.disabled,
              readonly: state.readonly,
              required: state.required,
              'aria-valuenow': value ?? undefined,
              'aria-valuemin': Number.isFinite(low()) ? low() : undefined,
              'aria-valuemax': Number.isFinite(high()) ? high() : undefined,
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
                    disabled: !editable || (value != null && value <= low()),
                    onPointerdown: (event: PointerEvent) => hold(event, -increment()),
                    onClick: () => clickStep(-increment()),
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
                    disabled: !editable || (value != null && value >= high()),
                    onPointerdown: (event: PointerEvent) => hold(event, increment()),
                    onClick: () => clickStep(increment()),
                  },
                )}
              />
            </>
          )}
        </div>
      );
    };
  },
);
