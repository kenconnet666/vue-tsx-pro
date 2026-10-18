/**
 * 滑块：在一个范围里拖动选值（音量、进度、价格）。WAI-ARIA 的 Slider 模式：滑块是 role="slider"，
 * 方向键 ±step，Page Up / Page Down ±bigStep，Home / End 到两端；从右到左排版时横向的方向键反过来。
 * 点击轨道任意位置直接跳过去并接着拖动。参考 Radix Slider、React Aria useSlider。
 *
 *   <Slider value={_bind(volume)} aria-label="音量" />
 *   <Slider value={_bind(price)} min={0} max={1000} step={50} valueText={(v) => `${v} 元`} />
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { startMove } from '../utils/move';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/styles';
import { fontSizeStyles, type TextSize } from '../utils/typography';

/** 滑块方向 */
export interface SliderOrientations {
  /** 横向（默认）：起始端是最小值 */
  horizontal: unknown;
  /** 纵向：底端是最小值；高度由使用方给，默认 10em */
  vertical: unknown;
}

/** 角色、取值与可聚焦由组件管理 */
type Managed =
  | 'role'
  | 'tabindex'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuenow'
  | 'aria-valuetext'
  | 'aria-orientation'
  | 'aria-disabled';

/** 未声明的属性落到滑块（role="slider" 的主元素）上，名称写 aria-label；外层用 propsRoot */
export interface SliderProps extends PartProps<'div', Managed> {
  /** 当前值：父级写 value={_bind(x)} 双向绑定，拖动中实时写回 */
  value?: number;
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
  /** 字号档位，滑块与轨道随之缩放；不写时继承 */
  size?: TextSize;
  /** 读屏念的取值文字（aria-valuetext），如 `(v) => \`${v}%\``；不写时念数字 */
  valueText?: (value: number) => string;
  /** 表单字段名：给了就带一个隐藏的 input，随表单提交 */
  name?: string;
  /** 一次操作结束（松开、按键）时的值：保存、发请求放在这里，不必每次移动都发 */
  onValueCommit?: (value: number) => void;
  /** 外层（轨道与滑块的容器）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 轨道的部件属性 */
  propsTrack?: PartProps<'div'>;
  /** 已选范围（轨道上着色的部分）的部件属性；长度由组件写在行内样式上 */
  propsRange?: PartProps<'div'>;
}

const styles = stylex.create({
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    // 触摸拖动不触发页面滚动
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'pointer',
  },
  // 点击区域至少 24px（WCAG 2.5.8）
  horizontal: { width: '_full', minHeight: '_minTarget' },
  vertical: { flexDirection: 'column', height: '10em', minWidth: '_minTarget' },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
  track: {
    position: 'relative',
    flexGrow: 1,
    borderRadius: '_full',
    backgroundColor: '_fill',
    overflow: 'hidden',
  },
  trackHorizontal: { height: 'calc(_space.xs * 1.5)' },
  trackVertical: { width: 'calc(_space.xs * 1.5)' },
  range: { position: 'absolute', backgroundColor: '_accent' },
  rangeHorizontal: { insetBlock: 0, insetInlineStart: 0 },
  rangeVertical: { insetInline: 0, bottom: 0 },
  thumb: {
    position: 'absolute',
    boxSizing: 'border-box',
    width: 'calc(_space.lg + _space.xs)',
    height: 'calc(_space.lg + _space.xs)',
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderColor: '_accent',
    borderRadius: '_full',
    backgroundColor: '_surface',
    boxShadow: '_sm',
    cursor: 'grab',
  },
  // 用逻辑方向的外边距把滑块的中心对准取值位置：从右到左排版时也对
  thumbHorizontal: { marginInlineStart: 'calc((_space.lg + _space.xs) / -2)' },
  thumbVertical: { marginBottom: 'calc((_space.lg + _space.xs) / -2)' },
});

// 位置是任意值，用动态样式（编译为 CSS 变量）；单独一个 create，见 COMPONENTS.md §4
const positionStyles = stylex.create({
  rangeWidth: (percent: string) => ({ width: percent }),
  rangeHeight: (percent: string) => ({ height: percent }),
  thumbInline: (percent: string) => ({ insetInlineStart: percent }),
  thumbBottom: (percent: string) => ({ bottom: percent }),
});

/** 小数位数：0.1 → 1，避免 0.1 + 0.2 这类浮点误差带进取值 */
const decimals = (step: number) => (String(step).split('.')[1] ?? '').length;

/** 滑块：在 min–max 之间按 step 拖动或用键盘选值 */
export const Slider = _component(
  ({
    value = _bindable(0),
    min = 0,
    max = 100,
    step = 1,
    bigStep,
    orientation = 'horizontal',
    disabled = false,
    size,
    valueText,
    name,
    onValueCommit,
    propsRoot,
    propsTrack,
    propsRange,
    ...rest
  }: SliderProps) => {
    let track = _state.raw<HTMLElement | null>(null);
    let thumb = _state.raw<HTMLElement | null>(null);

    /** 夹在范围内并对齐到步长 */
    const snap = (raw: number) => {
      const stepped = min + Math.round((raw - min) / step) * step;
      return Number(Math.min(max, Math.max(min, stepped)).toFixed(decimals(step)));
    };
    const isRtl = () =>
      orientation === 'horizontal' && !!track && getComputedStyle(track).direction === 'rtl';

    /** 指针位置对应的值 */
    function valueAt(clientX: number, clientY: number) {
      const rect = track!.getBoundingClientRect();
      let ratio =
        orientation === 'vertical'
          ? (rect.bottom - clientY) / rect.height
          : (clientX - rect.left) / rect.width;
      if (isRtl()) ratio = 1 - ratio;
      return snap(min + Math.min(1, Math.max(0, ratio)) * (max - min));
    }

    function grab(event: PointerEvent) {
      if (disabled || event.button !== 0 || !track) return;
      // 不让浏览器把焦点放到别处、开始选中文字；焦点交给滑块，键盘接着可以微调
      event.preventDefault();
      thumb?.focus();
      value = valueAt(event.clientX, event.clientY);
      startMove(event, {
        onMove: ({ clientX, clientY }) => (value = valueAt(clientX, clientY)),
        onEnd: () => onValueCommit?.(value),
      });
    }

    function onKeydown(event: KeyboardEvent) {
      if (disabled) return;
      const big = bigStep ?? Math.max(step, (max - min) / 10);
      // 从右到左排版时，横向的左右键反过来（右边是起点）
      const forward = isRtl() ? 'ArrowLeft' : 'ArrowRight';
      const backward = isRtl() ? 'ArrowRight' : 'ArrowLeft';
      const next: Record<string, number> = {
        [forward]: value + step,
        ArrowUp: value + step,
        [backward]: value - step,
        ArrowDown: value - step,
        PageUp: value + big,
        PageDown: value - big,
        Home: min,
        End: max,
      };
      if (!(event.key in next)) return;
      event.preventDefault();
      value = snap(next[event.key]!);
      onValueCommit?.(value);
    }

    return () => {
      const vertical = orientation === 'vertical';
      const percent = `${max > min ? ((value - min) / (max - min)) * 100 : 0}%`;
      return (
        <div
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [
                  styles.root,
                  vertical ? styles.vertical : styles.horizontal,
                  size && fontSizeStyles[size],
                ],
              },
              propsRoot,
              { sx: disabled && styles.disabled, onPointerdown: grab },
            ),
          )}
          data-disabled={disabled || undefined}
        >
          <div
            {...elementProps(
              mergeProps<'div'>(
                { sx: [styles.track, vertical ? styles.trackVertical : styles.trackHorizontal] },
                propsTrack,
                { ref: _toRef(track) },
              ),
            )}
          >
            <div
              {...elementProps(
                mergeProps<'div'>(
                  { sx: [styles.range, vertical ? styles.rangeVertical : styles.rangeHorizontal] },
                  propsRange,
                  {
                    sx: vertical
                      ? positionStyles.rangeHeight(percent)
                      : positionStyles.rangeWidth(percent),
                  },
                ),
              )}
            />
          </div>
          <div
            {...elementProps(
              mergeProps<'div'>(
                {
                  sx: [
                    styles.thumb,
                    focusRingStyles.visible,
                    vertical
                      ? [styles.thumbVertical, positionStyles.thumbBottom(percent)]
                      : [styles.thumbHorizontal, positionStyles.thumbInline(percent)],
                  ],
                },
                rest,
                {
                  ref: _toRef(thumb),
                  role: 'slider',
                  tabindex: disabled ? undefined : 0,
                  'aria-valuemin': min,
                  'aria-valuemax': max,
                  'aria-valuenow': value,
                  'aria-valuetext': valueText?.(value),
                  'aria-orientation': orientation,
                  'aria-disabled': disabled || undefined,
                  onKeydown,
                },
              ),
            )}
          />
          {name != null && <input type="hidden" name={name} value={value} />}
        </div>
      );
    };
  },
);
