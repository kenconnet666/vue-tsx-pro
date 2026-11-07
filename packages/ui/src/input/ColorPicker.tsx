/**
 * 取色器（面板）：饱和度 / 明度的色板、色相与不透明度滑块、吸管（EyeDropper）、按格式输入、预设与最近使用。
 * 平铺在页面上（主题编辑器）或放进 ColorField 的弹出层。参考 React Aria 的 ColorArea / ColorSlider、Ant Design ColorPicker。
 *
 *   <ColorPicker _value={brand} presets={['#3e63dd', '#e5484d', '#30a46c']} />
 *   <ColorPicker _value={overlay} alpha={false} />                不要透明度
 *
 * - 值是 #rrggbb（有透明度时 #rrggbbaa），同 ColorField；内部按 HSV 记着，灰色、黑色时色相不丢。
 * - 色板：指针按下即跳过去并接着拖；聚焦后 ←→ 改饱和度、↑↓ 改明度（Shift 一次 10%），读屏念“饱和度 80%，明度 45%”。
 * - 色相、不透明度是 Slider（同一套键盘与读屏），轨道画成渐变。
 * - 吸管只在支持 EyeDropper 的浏览器里出现（Chromium）；格式在 hex、rgb、hsl 之间切，输入框里写任何 CSS 颜色都认。
 * - 最近使用：同一个页面里的取色器共用，最多 8 个，拖完一次、选了预设、取了色、输入后记下。
 * 部件（data-scope="color-picker"）：Root（div）、Area（色板）、Thumb、EyeDropper（IconButton）、Hue、Alpha（Slider）、
 * Preview、Format（ToggleGroup）、Input（TextField）、Swatches（预设、最近使用的一排）、Swatch（ButtonBase）。
 */
import { Pipette } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted, shallowRef, watch } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { partAttrs } from '../config/styles';
import { t } from '../config/theme/tokens';
import { useFieldControl } from '../form/Field';
import {
  formatColor,
  hsvaToHex,
  toHex,
  toHsva,
  type ColorFormats,
  type Hsva,
} from '../utils/data/color';
import { clamp } from '../utils/data/number';
import { startMove } from '../utils/dom/move';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { swatchStyles } from '../utils/style/swatch-styles';
import { focusRingStyles } from '../utils/style/styles';
import { Slider, type SliderProps } from './Slider';
import { TextField, type TextFieldProps } from './TextField';
import { ToggleGroup, ToggleItem, type ToggleGroupBaseProps } from './ToggleGroup';

/** 未声明的属性落到根元素（div）上 */
export interface ColorPickerProps extends PartProps<'div'> {
  /** 颜色值（#rrggbb 或 #rrggbbaa）：父级写 _value={x} */
  _value?: string;
  /** 有不透明度滑块，默认 true */
  alpha?: boolean;
  /** 预设的颜色（品牌色、主题色） */
  presets?: readonly string[];
  /** 显示最近使用的颜色，默认 true */
  recent?: boolean;
  /** 输入框一开始的写法，默认 hex */
  format?: keyof ColorFormats;
  /** 不可用（不写时取 Field 的） */
  disabled?: boolean;
  /** 饱和度 / 明度色板的部件属性 */
  propsArea?: PartProps<'div'>;
  /** 色板上的把手（role="slider"）的部件属性 */
  propsThumb?: PartProps<'div', 'role' | 'tabindex'>;
  /** 吸管按钮的部件属性 */
  propsEyeDropper?: Partial<IconButtonProps>;
  /** 色相滑块的部件属性 */
  propsHue?: Partial<SliderProps>;
  /** 不透明度滑块的部件属性 */
  propsAlpha?: Partial<SliderProps>;
  /** 当前颜色的预览块的部件属性 */
  propsPreview?: PartProps<'span'>;
  /** 写法切换（HEX / RGB / HSL）的部件属性 */
  propsFormat?: Partial<ToggleGroupBaseProps>;
  /** 颜色输入框的部件属性 */
  propsInput?: Partial<TextFieldProps>;
  /** 一排颜色（预设、最近使用）的部件属性 */
  propsSwatches?: PartProps<'div'>;
  /** 每一格颜色的部件属性 */
  propsSwatch?: Partial<ButtonBaseProps>;
}

/** 部件的标记（data-scope="color-picker"） */
const pickerPart = (part: string) => partAttrs({ name: 'ColorPicker' }, part);

/** 同一个页面里的取色器共用的最近使用（最新的在前） */
const recentColors = shallowRef<string[]>([]);
const RECENT_LIMIT = 8;
function remember(color: string) {
  recentColors.value = [color, ...recentColors.value.filter((item) => item !== color)].slice(
    0,
    RECENT_LIMIT,
  );
}

/** ColorPicker 的样式：root、area、thumb、row、hue、alpha、hiddenRange、swatches、swatch、preview */
export const colorPickerStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_sm', width: '16rem', maxWidth: '_full' },
  area: {
    position: 'relative',
    aspectRatio: '4 / 3',
    borderRadius: '_md',
    touchAction: 'none',
    cursor: 'crosshair',
  },
  thumb: {
    position: 'absolute',
    width: '1em',
    height: '1em',
    translate: '-50% -50%',
    borderRadius: '_full',
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderColor: '#fff',
    boxShadow: '0 0 0 1px rgb(0 0 0 / 0.3), inset 0 0 0 1px rgb(0 0 0 / 0.3)',
  },
  row: { display: 'flex', alignItems: 'center', gap: '_sm' },
  sliders: { display: 'flex', flexDirection: 'column', gap: '_xs', flexGrow: 1, minWidth: 0 },
  hue: {
    backgroundImage:
      'linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)',
  },
  // 渐变轨道上不要已选部分的填色
  hiddenRange: { backgroundColor: 'transparent' },
  track: { height: '0.75em', borderRadius: '_full' },
  preview: {
    flexShrink: 0,
    width: '2em',
    height: '2em',
    borderRadius: '_md',
  },
  swatches: { display: 'flex', flexWrap: 'wrap', gap: '_xs' },
  swatch: { width: '1.5em', height: '1.5em', borderRadius: '_sm' },
  label: { fontSize: '_xs', color: '_textMuted' },
  input: { flexGrow: 1, minWidth: 0 },
  fillBlock: { display: 'block' },
});

/** 动态样式（任意值，单独一个 create，见 COMPONENTS.md §4） */
const colorPickerDynamicStyles = css.create({
  // 色板：上面压黑（明度），左白右纯色（饱和度）
  area: (hue: string) => ({
    backgroundImage: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hue})`,
  }),
  // 不透明度：棋盘格上叠一层从透明到当前颜色的渐变
  alpha: (color: string) => ({
    backgroundImage: `linear-gradient(to right, transparent, ${color}), repeating-conic-gradient(${t.colors.fill} 0 25%, ${t.colors.surface} 0 50%)`,
    backgroundSize: '100% 100%, 0.5em 0.5em',
  }),
  fill: (color: string) => ({ backgroundColor: color }),
  thumb: (left: string, top: string, color: string) => ({ left, top, backgroundColor: color }),
});

/** 一格颜色（预设、最近使用）：棋盘格上叠颜色，点了选它 */
const swatch = (
  color: string,
  selected: boolean,
  onPick: () => void,
  part: Partial<ButtonBaseProps> | undefined,
) => (
  <ButtonBase
    key={color}
    {...mergePartProps<ButtonBaseProps>(
      {
        sx: [swatchStyles.checkerboard, colorPickerStyles.swatch, focusRingStyles.visible],
        ...pickerPart('swatch'),
      },
      part,
      { 'aria-label': color, 'aria-pressed': selected, onClick: onPick },
    )}
  >
    <span
      {...css.attrs(
        colorPickerStyles.swatch,
        colorPickerStyles.fillBlock,
        swatchStyles.ring,
        colorPickerDynamicStyles.fill(color),
      )}
      {...pickerPart('swatch')}
    />
  </ButtonBase>
);

/** 取色器面板 */
export const ColorPicker = _component(
  ({
    _value: value = _bindable('#3e63dd'),
    alpha = true,
    presets,
    recent = true,
    format: initialFormat = 'hex',
    disabled,
    propsArea,
    propsThumb,
    propsEyeDropper,
    propsHue,
    propsAlpha,
    propsPreview,
    propsFormat,
    propsInput,
    propsSwatches,
    propsSwatch,
    ...rest
  }: ColorPickerProps) => {
    const lang = useLang();
    const control = useFieldControl(() => ({ disabled }));
    let hsva = _state<Hsva>(toHsva(_untrack(value)) ?? { h: 0, s: 0, v: 0, a: 1 });
    let format = _state<keyof ColorFormats>(initialFormat);
    let draft = _state('');
    let area = _state.raw<HTMLElement | null>(null);
    /** 自己最后写出去的值：父级的 value 等于它时不重算 HSV（拖到灰色时色相不丢） */
    let emitted = _untrack(value);

    const hex = () => hsvaToHex(alpha ? hsva : { ...hsva, a: 1 });
    function set(next: Hsva) {
      hsva = next;
      emitted = hex();
      value = emitted;
    }
    watch(
      () => value,
      (next) => {
        if (next === emitted) return;
        const parsed = toHsva(next);
        if (parsed) hsva = parsed;
        emitted = next;
      },
    );
    // 输入框显示当前格式的写法；正在输入时不打断
    let typing = false;
    watch(
      () => [hex(), format] as const,
      ([color, current]) => {
        if (!typing) draft = formatColor(color, current);
      },
      { immediate: true },
    );

    /** 色板上的位置 → 饱和度、明度 */
    function pickAt(clientX: number, clientY: number) {
      const rect = area?.getBoundingClientRect();
      if (!rect) return;
      set({
        ...hsva,
        s: clamp((clientX - rect.left) / rect.width, 0, 1),
        v: clamp(1 - (clientY - rect.top) / rect.height, 0, 1),
      });
    }
    function onAreaPointerdown(event: PointerEvent) {
      if (control().disabled || event.button !== 0) return;
      event.preventDefault();
      pickAt(event.clientX, event.clientY);
      (area?.querySelector('[role="slider"]') as HTMLElement | null)?.focus();
      startMove(event, {
        onMove: (point) => pickAt(point.clientX, point.clientY),
        onEnd: () => remember(hex()),
      });
    }
    function onThumbKeydown(event: KeyboardEvent) {
      const step = event.shiftKey ? 0.1 : 0.01;
      const moves: Record<string, Partial<Hsva>> = {
        ArrowLeft: { s: hsva.s - step },
        ArrowRight: { s: hsva.s + step },
        ArrowUp: { v: hsva.v + step },
        ArrowDown: { v: hsva.v - step },
      };
      const move = moves[event.key];
      if (!move || control().disabled) return;
      event.preventDefault();
      set({
        ...hsva,
        s: clamp(move.s ?? hsva.s, 0, 1),
        v: clamp(move.v ?? hsva.v, 0, 1),
      });
    }

    function commitDraft() {
      typing = false;
      const parsed = toHex(draft);
      const next = parsed && toHsva(parsed);
      if (next) {
        set(next);
        remember(hex());
      }
      draft = formatColor(hex(), format);
    }

    function pick(color: string) {
      const next = toHsva(color);
      if (!next) return;
      set(next);
      remember(hex());
    }

    // 吸管：挂载后才看浏览器支不支持（服务端没有 window，先不画，水合时两边一致）
    let eyeDropper = _state.raw<
      (new () => { open: () => Promise<{ sRGBHex: string }> }) | undefined
    >(undefined);
    onMounted(() => {
      if ('EyeDropper' in window)
        eyeDropper = (window as unknown as { EyeDropper: typeof eyeDropper }).EyeDropper;
    });
    async function sample() {
      if (!eyeDropper) return;
      try {
        pick((await new eyeDropper().open()).sRGBHex);
      } catch {
        // 用户按 Esc 取消
      }
    }

    return () => {
      const state = control();
      const opaque = hsvaToHex({ ...hsva, a: 1 });
      const percent = (value: number) => Math.round(value * 100);
      const swatchRow = (title: string, colors: readonly string[]) =>
        colors.length > 0 && (
          <div role="group" aria-label={title}>
            <div
              {...css.attrs(colorPickerStyles.label)}
              {...pickerPart('label')}
              aria-hidden="true"
            >
              {title}
            </div>
            <div
              {...mergeAttrs<'div'>(
                { sx: colorPickerStyles.swatches, ...pickerPart('swatches') },
                propsSwatches,
              )}
            >
              {colors.map((color) =>
                swatch(color, toHex(color) === hex(), () => pick(color), propsSwatch),
              )}
            </div>
          </div>
        );
      return (
        <div
          {...mergeAttrs<'div'>({ sx: colorPickerStyles.root, ...pickerPart('root') }, rest)}
          data-disabled={state.disabled || undefined}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  colorPickerStyles.area,
                  colorPickerDynamicStyles.area(hsvaToHex({ h: hsva.h, s: 1, v: 1, a: 1 })),
                ],
                ...pickerPart('area'),
              },
              propsArea,
              { ref: _toRef(area), onPointerdown: onAreaPointerdown },
            )}
          >
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    colorPickerStyles.thumb,
                    focusRingStyles.visible,
                    colorPickerDynamicStyles.thumb(
                      `${hsva.s * 100}%`,
                      `${(1 - hsva.v) * 100}%`,
                      opaque,
                    ),
                  ],
                  ...pickerPart('thumb'),
                },
                propsThumb,
                {
                  'aria-label': lang.colorArea,
                  'aria-valuemin': 0,
                  'aria-valuemax': 100,
                  'aria-valuenow': percent(hsva.s),
                  'aria-valuetext': lang.colorAreaValue(percent(hsva.s), percent(hsva.v)),
                  'aria-disabled': state.disabled || undefined,
                  onKeydown: onThumbKeydown,
                  onKeyup: () => remember(hex()),
                },
              )}
              role="slider"
              tabindex={state.disabled ? -1 : 0}
            />
          </div>
          <div {...css.attrs(colorPickerStyles.row)} {...pickerPart('tools')}>
            {eyeDropper && (
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  {
                    icon: Pipette,
                    'aria-label': lang.colorEyeDropper,
                    size: 'sm',
                    variant: 'ghost',
                    tone: 'neutral',
                    ...pickerPart('eye-dropper'),
                  },
                  propsEyeDropper,
                  { disabled: state.disabled, onClick: () => void sample() },
                )}
              />
            )}
            <div {...css.attrs(colorPickerStyles.sliders)} {...pickerPart('sliders')}>
              <Slider
                {...mergePartProps<SliderProps>(
                  {
                    size: 'sm',
                    'aria-label': lang.colorHue,
                    valueText: (hue) => `${String(hue)}°`,
                    propsTrack: { sx: [colorPickerStyles.track, colorPickerStyles.hue] },
                    propsRange: { sx: colorPickerStyles.hiddenRange },
                    ...pickerPart('hue'),
                  },
                  propsHue,
                  { min: 0, max: 360, step: 1, disabled: state.disabled },
                )}
                _value={Math.round(hsva.h)}
                onUpdate:_value={(hue: number) => set({ ...hsva, h: hue })}
              />
              {alpha && (
                <Slider
                  {...mergePartProps<SliderProps>(
                    {
                      size: 'sm',
                      'aria-label': lang.colorAlpha,
                      valueText: (value) => `${String(value)}%`,
                      propsTrack: {
                        sx: [colorPickerStyles.track, colorPickerDynamicStyles.alpha(opaque)],
                      },
                      propsRange: { sx: colorPickerStyles.hiddenRange },
                      ...pickerPart('alpha'),
                    },
                    propsAlpha,
                    { min: 0, max: 100, step: 1, disabled: state.disabled },
                  )}
                  _value={percent(hsva.a)}
                  onUpdate:_value={(next: number) => set({ ...hsva, a: next / 100 })}
                />
              )}
            </div>
            <span
              {...mergeAttrs<'span'>(
                {
                  sx: [swatchStyles.checkerboard, colorPickerStyles.preview],
                  ...pickerPart('preview'),
                },
                propsPreview,
                { 'aria-hidden': 'true' },
              )}
            >
              <span
                {...css.attrs(
                  colorPickerStyles.preview,
                  colorPickerStyles.fillBlock,
                  swatchStyles.ring,
                  colorPickerDynamicStyles.fill(hex()),
                )}
                {...pickerPart('preview')}
              />
            </span>
          </div>
          <div {...css.attrs(colorPickerStyles.row)} {...pickerPart('fields')}>
            <ToggleGroup
              {...mergePartProps<ToggleGroupBaseProps>(
                { size: 'xs', 'aria-label': lang.colorFormat, ...pickerPart('format') },
                propsFormat,
                { required: true },
              )}
              _value={format}
            >
              <ToggleItem value="hex">HEX</ToggleItem>
              <ToggleItem value="rgb">RGB</ToggleItem>
              <ToggleItem value="hsl">HSL</ToggleItem>
            </ToggleGroup>
            <TextField
              {...mergePartProps<TextFieldProps>(
                {
                  size: 'sm',
                  'aria-label': lang.colorFormat,
                  spellcheck: false,
                  propsRoot: { sx: colorPickerStyles.input, ...pickerPart('input') },
                },
                propsInput,
                {
                  disabled: state.disabled,
                  onInput: () => (typing = true),
                  onBlur: commitDraft,
                  onKeydown: (event: KeyboardEvent) => event.key === 'Enter' && commitDraft(),
                },
              )}
              _value={draft}
            />
          </div>
          {presets && swatchRow(lang.colorPresets, presets)}
          {recent && swatchRow(lang.colorRecent, recentColors.value)}
        </div>
      );
    };
  },
);
