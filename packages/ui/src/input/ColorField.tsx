/**
 * 颜色输入：前面是色块（点开取色器 ColorPicker），后面可以直接输入颜色值。主题编辑器、品牌色设置这类地方用。
 *
 *   <ColorField _value={brand} aria-label="品牌色" />
 *   <ColorField _value={brand} presets={brandColors} />          取色器里带预设
 *
 * - 值是 #rrggbb（有透明度时 #rrggbbaa）：输入 rgb()、颜色名也行，失焦或回车时规范成 #hex 写回；
 *   写不成颜色时外壳标为无效（aria-invalid），值不变，失焦后恢复成原来的值。
 * - 色块是按钮：点开的弹出层里是 ColorPicker（色板、色相、不透明度、吸管、预设与最近使用），改动马上写回；
 *   Esc 或点外面关上，焦点回到色块。外观在各个系统、浏览器里一样，也能选透明度（原生取色器做不到）。
 * - 接入 Field（标签、说明、错误、必填、不可用），外观同 TextField（control.tsx）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { useLang } from '../config/context';
import { useFieldControl } from '../form/Field';
import { Popover, type PopoverProps, type PopoverTriggerProps } from '../overlay/Popover';
import { parseColor, toHex } from '../utils/data/color';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { swatchStyles } from '../utils/style/swatch-styles';
import { focusRingStyles } from '../utils/style/styles';
import { ColorPicker, type ColorPickerProps } from './ColorPicker';
import { controlParts, focusOnShell, useControlAppearance, type ControlOptions } from './control';

/** 值、状态与无障碍关联由组件管理 */
export type ColorFieldManaged =
  | 'value'
  | 'type'
  | 'disabled'
  | 'readonly'
  | 'required'
  | 'size'
  | 'aria-invalid'
  | 'aria-describedby';

/** 未声明的属性落到文字输入框（input）上 */
export interface ColorFieldProps extends PartProps<'input', ColorFieldManaged>, ControlOptions {
  /** 颜色值（#rrggbb 或 #rrggbbaa）：父级写 _value={x} 双向绑定 */
  _value?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能看到颜色、复制取值，不能修改 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 取色器里的预设颜色 */
  presets?: readonly string[];
  /** 取色器里有不透明度滑块，默认 true */
  alpha?: boolean;
  /** 外壳（边框、焦点环）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 色块（打开取色器的按钮）的部件属性 */
  propsSwatch?: Partial<ButtonBaseProps>;
  /** 取色器（ColorPicker）的部件属性 */
  propsPicker?: Partial<ColorPickerProps>;
  /** 弹出层（Popover）的部件属性 */
  propsPopover?: Partial<PopoverProps>;
}

/** ColorField 的样式：swatch、fill、input */
const colorFieldStyles = css.create({
  // 色块：棋盘格垫底（swatchStyles），颜色铺在上面一层
  swatch: {
    position: 'relative',
    flexShrink: 0,
    width: '1.25em',
    height: '1.25em',
    borderRadius: '_sm',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', inset: 0 },
  // 等宽字体：#hex 各位对齐，改一位时不跳动
  input: { fontFamily: '_mono', fontVariantLigatures: 'none' },
});

// 颜色是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** ColorField 的动态样式：色块里的颜色 */
const colorFieldDynamicStyles = css.create({
  fill: (color: string) => ({ backgroundColor: color }),
});

/** 颜色输入（色块 + 文字输入）：值是 #hex */
export const ColorField = _component(
  ({
    _value: value = _bindable('#000000'),
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    presets,
    alpha,
    id,
    propsRoot,
    propsSwatch,
    propsPicker,
    propsPopover,
    ...rest
  }: ColorFieldProps) => {
    const lang = useLang();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let input = _state.raw<HTMLInputElement | null>(null);
    let open = _state(false);
    // 正在输入的文字：写成颜色之前不写回 value
    let draft = _state(_untrack(value));
    watch(
      () => value,
      (next) => (draft = next),
    );
    const parsed = () => parseColor(draft) !== undefined;

    function commit() {
      const hex = toHex(draft);
      if (hex) value = hex;
      draft = value;
    }

    /** 色块：打开取色器的按钮 */
    const swatch = (props: PopoverTriggerProps) => {
      const state = control();
      return (
        <ButtonBase
          {...mergePartProps<ButtonBaseProps>(
            { sx: [swatchStyles.checkerboard, colorFieldStyles.swatch, focusRingStyles.visible] },
            propsSwatch,
            { ...props, disabled: state.disabled || state.readonly, 'aria-label': lang.colorPick },
          )}
        >
          <span
            {...css.attrs(
              colorFieldStyles.fill,
              swatchStyles.ring,
              colorFieldDynamicStyles.fill(value),
            )}
          />
        </ButtonBase>
      );
    };

    return () => {
      const state = control();
      const showInvalid = state.invalid || !parsed();
      const s = controlParts(appearance(), { ...state, invalid: showInvalid });
      return (
        <div
          {...mergeAttrs<'div'>(s.root, propsRoot, { onPointerdown: focusOnShell(() => input) })}
          data-invalid={showInvalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          <Popover
            {...mergePartProps<PopoverProps>(
              { placement: 'bottom-start', trigger: swatch },
              propsPopover,
              {
                trigger: swatch,
              },
            )}
            _open={open}
          >
            <ColorPicker
              {...mergePartProps<ColorPickerProps>({ presets, alpha }, propsPicker)}
              _value={value}
            />
          </Popover>
          <input
            {...mergeAttrs<'input'>(
              { ...s.input, sx: [s.input.sx, colorFieldStyles.input] },
              rest,
              {
                ref: _toRef(input),
                id: state.id,
                type: 'text',
                spellcheck: false,
                autocomplete: 'off',
                disabled: state.disabled,
                readonly: state.readonly,
                required: state.required,
                'aria-invalid': showInvalid || undefined,
                'aria-describedby': state.describedBy,
                onBlur: commit,
                onKeydown: (event: KeyboardEvent) => {
                  if (event.key === 'Enter') commit();
                },
              },
            )}
            _value={draft}
          />
        </div>
      );
    };
  },
);
