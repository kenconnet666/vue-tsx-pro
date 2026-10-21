/**
 * 滑块：在一个范围里拖动选值（音量、进度、价格）。WAI-ARIA 的 Slider 模式：滑块是 role="slider"，
 * 方向键 ±step，Page Up / Page Down ±bigStep，Home / End 到两端；从右到左排版时横向的方向键反过来。
 * 点击轨道任意位置直接跳过去并接着拖动。参考 Radix Slider、React Aria useSlider。
 *
 *   <Slider value={_bind(volume)} aria-label="音量" />
 *   <Slider value={_bind(price)} min={0} max={1000} step={50} valueText={(v) => `${v} 元`} />
 *   <Slider value={_bind(range)} aria-label="价格" marks={[0, { value: 500, label: '500' }, 1000]} />   范围：[低, 高]
 *
 * value 是数组 [低, 高] 时是范围选择：两个滑块各自可聚焦、可拖动，不能交叉；点击轨道移动离得近的那个。
 * 两个滑块的名称在 aria-label（或 Field 的标签）后面加上“最小值”“最大值”，取值范围互相限制（同 WAI-ARIA 多滑块）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { startMove } from '../utils/dom/move';
import { defaultLabelledBy, mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { toneFillStyles, type StatusTone } from '../utils/style/tone-styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { clamp, snapToStep } from '../utils/data/number';
import { inlineArrows, isRtl } from '../utils/dom/direction';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';

/** 滑块方向 */
export interface SliderOrientations {
  /** 横向（默认）：起始端是最小值 */
  horizontal: unknown;
  /** 纵向：底端是最小值；高度由使用方给，默认 10em */
  vertical: unknown;
}

/** 单值，或范围 [低, 高] */
export type SliderValue = number | readonly [number, number];

/** 轨道上的一个刻度 */
export interface SliderMark {
  /** 刻度所在的值 */
  value: number;
  /** 刻度下方（纵向时右侧）的文字 */
  label?: VNodeChild;
}

/** 角色、取值与可聚焦由组件管理 */
export type SliderManaged =
  | 'role'
  | 'tabindex'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuenow'
  | 'aria-valuetext'
  | 'aria-orientation'
  | 'aria-disabled';

/** 未声明的属性落到滑块（role="slider" 的主元素，范围时两个都有）上，名称写 aria-label；外层用 propsRoot */
export interface SliderProps<V extends SliderValue = number> extends PartProps<
  'div',
  SliderManaged
> {
  /** 当前值：父级写 value={_bind(x)} 双向绑定，拖动中实时写回；数组 [低, 高] 时是范围选择 */
  value?: V;
  /** 最小值，默认 0 */
  min?: number;
  /** 最大值，默认 100 */
  max?: number;
  /** 步长，默认 1；取值总是对齐到 min + n × step */
  step?: number;
  /** Page Up / Page Down 的步长，默认为范围的十分之一（至少一个 step） */
  bigStep?: number;
  /** 方向，默认 horizontal */
  orientation?: keyof SliderOrientations;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：滑块能聚焦、读屏念“只读”，拖动与方向键不改值（查看详情、审批时）；外观照常 */
  readonly?: boolean;
  /** 字号档位，滑块与轨道随之缩放；不写时继承 */
  size?: TextSize;
  /** 已选范围与滑块描边的色调（与 Button、Badge 等同一套），默认 accent */
  tone?: StatusTone;
  /** 刻度：数字或带文字的 { value, label }；有文字时滑块下方（纵向时右侧）留出位置 */
  marks?: readonly (number | SliderMark)[];
  /** 读屏念的取值文字（aria-valuetext），如 `(v) => \`${v}%\``；不写时念数字 */
  valueText?: (value: number) => string;
  /** 表单字段名：给了就带隐藏的 input（范围时两个同名），随表单提交 */
  name?: string;
  /** 一次操作结束（松开、按键）时的值：保存、发请求放在这里，不必每次移动都发 */
  onValueCommit?: (value: V) => void;
  /** 外层（轨道与滑块的容器）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 轨道的部件属性 */
  propsTrack?: PartProps<'div'>;
  /** 已选范围（轨道上着色的部分）的部件属性；位置与长度由组件写 */
  propsRange?: PartProps<'div'>;
  /** 刻度点的部件属性 */
  propsMark?: PartProps<'span'> | ((mark: SliderMark) => PartProps<'span'>);
  /** 刻度文字的部件属性 */
  propsMarkLabel?: PartProps<'span'> | ((mark: SliderMark) => PartProps<'span'>);
}

/** Slider 的样式：root、horizontal、vertical、disabled、readonly、track、range、thumb、mark、markLabel 等 */
export const sliderStyles = stylex.create({
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    // 触摸拖动不触发页面滚动
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'pointer',
  },
  // 点击区域至少 24px（WCAG 2.5.8）。滑块的中心对准取值，两端各留半个滑块的外边距：
  // 滑块在最小、最大值时不伸出组件的盒子，不压到旁边的控件
  horizontal: {
    width: 'calc(100% - _space.lg - _space.xs)',
    marginInline: 'calc((_space.lg + _space.xs) / 2)',
    minHeight: '_minTarget',
  },
  vertical: {
    flexDirection: 'column',
    height: '10em',
    marginBlock: 'calc((_space.lg + _space.xs) / 2)',
    minWidth: '_minTarget',
  },
  // 刻度文字放在轨道下方（纵向时右侧），给它留出位置
  labelledHorizontal: { paddingBlockEnd: '1.5em' },
  labelledVertical: { paddingInlineEnd: '3em' },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
  readonly: { cursor: 'default' },
  track: {
    position: 'relative',
    flexGrow: 1,
    borderRadius: '_full',
    backgroundColor: '_fill',
    overflow: 'hidden',
  },
  trackHorizontal: { height: 'calc(_space.xs * 1.5)' },
  trackVertical: { width: 'calc(_space.xs * 1.5)' },
  range: { position: 'absolute', backgroundColor: 'var(--tone-fill)' },
  rangeHorizontal: { insetBlock: 0 },
  rangeVertical: { insetInline: 0 },
  thumb: {
    position: 'absolute',
    boxSizing: 'border-box',
    width: 'calc(_space.lg + _space.xs)',
    height: 'calc(_space.lg + _space.xs)',
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderColor: 'var(--tone-fill)',
    borderRadius: '_full',
    backgroundColor: '_surface',
    boxShadow: '_sm',
    cursor: 'grab',
  },
  // 用逻辑方向的外边距把滑块的中心对准取值位置：从右到左排版时也对
  thumbHorizontal: { marginInlineStart: 'calc((_space.lg + _space.xs) / -2)' },
  thumbVertical: { marginBottom: 'calc((_space.lg + _space.xs) / -2)' },
  // 轨道里的小圆点；在已选范围里时换成反色
  mark: {
    position: 'absolute',
    width: '_space.xs',
    height: '_space.xs',
    borderRadius: '_full',
    backgroundColor: '_borderStrong',
    pointerEvents: 'none',
  },
  markHorizontal: { top: '50%', translate: { default: '-50% -50%', ':dir(rtl)': '50% -50%' } },
  markVertical: { left: '50%', translate: '-50% 50%' },
  markActive: { backgroundColor: 'var(--tone-on-fill)' },
  markLabel: {
    position: 'absolute',
    fontSize: '_sm',
    lineHeight: '_tight',
    color: '_textMuted',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  markLabelHorizontal: {
    top: 'calc(50% + _space.sm)',
    translate: { default: '-50% -0.75em', ':dir(rtl)': '50% -0.75em' },
  },
  markLabelVertical: { left: 'calc(50% + _space.md)', translate: '0 50%' },
});

// 位置是任意值，用动态样式（编译为 CSS 变量）；单独一个 create，见 COMPONENTS.md §4
/** Slider 的样式：inline（横向的起点）、size（横向的长度）、bottom、height（纵向） */
export const sliderPositionStyles = stylex.create({
  inline: (percent: string) => ({ insetInlineStart: percent }),
  width: (percent: string) => ({ width: percent }),
  bottom: (percent: string) => ({ bottom: percent }),
  height: (percent: string) => ({ height: percent }),
});

/** 滑块：在 min–max 之间按 step 拖动或用键盘选值；value 为 [低, 高] 时选一个范围 */
export const Slider = _component(
  <V extends SliderValue = number>({
    value = _bindable<V>(0 as V),
    min = 0,
    max = 100,
    step = 1,
    bigStep,
    orientation = 'horizontal',
    disabled,
    readonly,
    size,
    tone = 'accent',
    marks,
    valueText,
    name,
    onValueCommit,
    propsRoot,
    propsTrack,
    propsRange,
    propsMark,
    propsMarkLabel,
    id,
    ...rest
  }: SliderProps<V>) => {
    const lang = useLang();
    // 在 Field 里时：标签作为名称、关联说明与错误、沿用不可用与只读
    const control = useFieldControl(() => ({ id, disabled, readonly }));
    /** 不接受改值：不可用或只读 */
    const off = () => control().disabled || control().readonly;
    const labelId = useId();
    let track = _state.raw<HTMLElement | null>(null);
    const thumbs: (HTMLElement | null)[] = [null, null];

    const isRange = () => Array.isArray(value);
    /** 各滑块的值（单值时只有一个） */
    const values = (): number[] => (Array.isArray(value) ? [...value] : [value as number]);
    /** 夹在范围内并对齐到步长 */
    const snap = (raw: number) => snapToStep(raw, step, min, max);
    const rtl = () => orientation === 'horizontal' && !!track && isRtl(track);

    /** 第 index 个滑块能取的范围：范围选择时不能越过另一个 */
    function bounds(index: number): [number, number] {
      if (!isRange()) return [min, max];
      const [low, high] = values() as [number, number];
      return index === 0 ? [min, high] : [low, max];
    }

    /** 改第 index 个滑块的值 */
    function set(index: number, raw: number) {
      const [lower, upper] = bounds(index);
      const next = clamp(snap(raw), lower, upper);
      if (!isRange()) {
        value = next as V;
        return;
      }
      const pair = values() as [number, number];
      pair[index] = next;
      value = pair as unknown as V;
    }

    /** 指针位置对应的值 */
    function valueAt(clientX: number, clientY: number) {
      const rect = track!.getBoundingClientRect();
      let ratio =
        orientation === 'vertical'
          ? (rect.bottom - clientY) / rect.height
          : (clientX - rect.left) / rect.width;
      if (rtl()) ratio = 1 - ratio;
      return snap(min + clamp(ratio, 0, 1) * (max - min));
    }

    /** 离 target 最近的滑块；两个重合时按方向选（往高处去的拿高的那个） */
    function nearest(target: number) {
      if (!isRange()) return 0;
      const [low, high] = values() as [number, number];
      if (low === high) return target > high ? 1 : 0;
      return Math.abs(target - low) <= Math.abs(target - high) ? 0 : 1;
    }

    function grab(event: PointerEvent) {
      if (off() || event.button !== 0 || !track) return;
      // 不让浏览器把焦点放到别处、开始选中文字；焦点交给滑块，键盘接着可以微调
      event.preventDefault();
      const target = valueAt(event.clientX, event.clientY);
      const index = nearest(target);
      thumbs[index]?.focus();
      set(index, target);
      startMove(event, {
        onMove: ({ clientX, clientY }) => set(index, valueAt(clientX, clientY)),
        onEnd: () => onValueCommit?.(value),
      });
    }

    function onKeydown(index: number, event: KeyboardEvent) {
      if (off()) return;
      const current = values()[index]!;
      const big = bigStep ?? Math.max(step, (max - min) / 10);
      // 从右到左排版时，横向的左右键反过来（右边是起点）
      const { forward, backward } = inlineArrows(rtl());
      const [lower, upper] = bounds(index);
      const next: Record<string, number> = {
        [forward]: current + step,
        ArrowUp: current + step,
        [backward]: current - step,
        ArrowDown: current - step,
        PageUp: current + big,
        PageDown: current - big,
        Home: lower,
        End: upper,
      };
      if (!(event.key in next)) return;
      event.preventDefault();
      set(index, next[event.key]!);
      onValueCommit?.(value);
    }

    const percentOf = (number: number) =>
      max > min ? ((clamp(number, min, max) - min) / (max - min)) * 100 : 0;

    return () => {
      const vertical = orientation === 'vertical';
      const field = control();
      const range = isRange();
      // 父级传入超出范围的值时按范围内显示（不改父级的值），滑块不会跑出轨道
      const shown = values().map((number) => clamp(number, min, max));
      const [start, end] = range
        ? [percentOf(shown[0]!), percentOf(shown[1]!)]
        : [0, percentOf(shown[0]!)];
      const normalized = (marks ?? []).map((mark) =>
        typeof mark === 'number' ? { value: mark } : mark,
      );
      const labelled = normalized.some((mark) => mark.label != null);
      const position = (percent: number) =>
        vertical
          ? sliderPositionStyles.bottom(`${percent}%`)
          : sliderPositionStyles.inline(`${percent}%`);

      const renderThumb = (number: number, index: number) => {
        const [lower, upper] = bounds(index);
        const part = range ? (index === 0 ? lang.sliderMin : lang.sliderMax) : undefined;
        const ownLabel = rest['aria-label'];
        // 范围时每个滑块的名称后面加“最小值 / 最大值”：有 aria-label 时拼在一起，用 Field 的标签时连上隐藏的文字
        const labelledBy = defaultLabelledBy(rest, field.labelledBy);
        return (
          <div
            key={index}
            {...mergeAttrs<'div'>(
              {
                sx: [
                  sliderStyles.thumb,
                  focusRingStyles.visible,
                  vertical ? sliderStyles.thumbVertical : sliderStyles.thumbHorizontal,
                  position(percentOf(number)),
                ],
              },
              rest,
              {
                ref: (element: unknown) => (thumbs[index] = element as HTMLElement | null),
                role: 'slider',
                id: index === 0 ? field.id : undefined,
                tabindex: field.disabled ? undefined : 0,
                'aria-valuemin': lower,
                'aria-valuemax': upper,
                'aria-valuenow': number,
                'aria-valuetext': valueText?.(number),
                'aria-orientation': orientation,
                'aria-disabled': field.disabled || undefined,
                'aria-readonly': field.readonly || undefined,
                'aria-label': part && ownLabel != null ? `${ownLabel} ${part}` : ownLabel,
                'aria-labelledby':
                  part && labelledBy ? `${labelledBy} ${labelId}-${index}` : labelledBy,
                'aria-describedby': field.describedBy,
                'aria-invalid': field.invalid || undefined,
                onKeydown: (event: KeyboardEvent) => onKeydown(index, event),
              },
            )}
            data-index={range ? index : undefined}
          >
            {part && labelledBy && (
              <VisuallyHidden id={`${labelId}-${index}`}>{part}</VisuallyHidden>
            )}
          </div>
        );
      };

      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                sliderStyles.root,
                vertical ? sliderStyles.vertical : sliderStyles.horizontal,
                labelled &&
                  (vertical ? sliderStyles.labelledVertical : sliderStyles.labelledHorizontal),
                toneFillStyles[tone],
                size && fontSizeStyles[size],
              ],
            },
            propsRoot,
            {
              sx: [
                field.readonly && sliderStyles.readonly,
                field.disabled && sliderStyles.disabled,
              ],
              onPointerdown: grab,
            },
          )}
          data-disabled={field.disabled || undefined}
          data-readonly={field.readonly || undefined}
          data-orientation={orientation}
          data-range={range || undefined}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  sliderStyles.track,
                  vertical ? sliderStyles.trackVertical : sliderStyles.trackHorizontal,
                ],
              },
              propsTrack,
              { ref: _toRef(track) },
            )}
          >
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    sliderStyles.range,
                    vertical ? sliderStyles.rangeVertical : sliderStyles.rangeHorizontal,
                  ],
                },
                propsRange,
                {
                  sx: [
                    position(start),
                    vertical
                      ? sliderPositionStyles.height(`${end - start}%`)
                      : sliderPositionStyles.width(`${end - start}%`),
                  ],
                },
              )}
            />
            {normalized.map((mark) => {
              const percent = percentOf(mark.value);
              const own = typeof propsMark === 'function' ? propsMark(mark) : propsMark;
              return (
                <span
                  key={mark.value}
                  {...mergeAttrs<'span'>(
                    {
                      sx: [
                        sliderStyles.mark,
                        vertical ? sliderStyles.markVertical : sliderStyles.markHorizontal,
                        percent >= start && percent <= end && sliderStyles.markActive,
                      ],
                    },
                    own,
                    { sx: position(percent) },
                  )}
                />
              );
            })}
          </div>
          {shown.map(renderThumb)}
          {normalized.map((mark) => {
            if (mark.label == null) return null;
            const own =
              typeof propsMarkLabel === 'function' ? propsMarkLabel(mark) : propsMarkLabel;
            return (
              <span
                key={mark.value}
                {...mergeAttrs<'span'>(
                  {
                    sx: [
                      sliderStyles.markLabel,
                      vertical ? sliderStyles.markLabelVertical : sliderStyles.markLabelHorizontal,
                    ],
                  },
                  own,
                  { sx: position(percentOf(mark.value)), 'aria-hidden': true },
                )}
              >
                {mark.label}
              </span>
            );
          })}
          <FormValue name={name} value={range ? shown : shown[0]} disabled={control().disabled} />
        </div>
      );
    };
  },
);
