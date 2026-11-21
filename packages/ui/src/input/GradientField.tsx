/**
 * 渐变编辑：一条颜色渐变由几个色标（位置 0 到 1、颜色）定——粒子的颜色随寿命、热力图的色带、主题的背景渐变。
 * 上面是渐变条（透明的地方露出棋盘格），下面是色标；选中的色标在最下面改颜色（带透明度）和位置。参考 Figma、
 * Unity 的 Gradient 编辑器。
 *
 *   let fade = _state<GradientStop[]>([{ offset: 0, color: '#ffe680ff' }, { offset: 1, color: '#33333300' }]);
 *   <GradientField _value={fade} aria-label="颜色随寿命" onValueCommit={save} />
 *
 * - 拖动色标改位置，双击渐变条在那里加一个色标（颜色取渐变在那一点的颜色），选中后 Delete 删掉（至少留一个）；
 *   拖动中实时写回 _value，一次操作结束时调用 onValueCommit。颜色是 #rrggbb 或 #rrggbbaa。
 * - 键盘：色标按顺序各占一个 Tab 位置（role="slider"，读屏念位置和颜色）；←/→ 按 step 挪（Shift 十倍），
 *   Home / End 到两端，Delete / Backspace 删除，Insert 在它和下一个色标中间加一个。
 * - sampleGradient 按同样的规则取渐变在某一点的颜色，gradientCss 写成 CSS 的 linear-gradient。
 *
 * 部件（data-scope="gradient-field"）：Root（外层）、Bar（渐变条）、Stops（色标的轨道）、Stop（色标）、Editor（选中色标的编辑行）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Trash2 } from '@lucide/icons';
import { IconButton } from '../base/IconButton';
import { useLang } from '../config/context';
import { partAttrs } from '../config/styles';
import { useFieldControl } from '../form/Field';
import { clamp } from '../utils/data/number';
import { parseColor, toHex } from '../utils/data/color';
import { startMove } from '../utils/dom/move';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { ColorField } from './ColorField';
import { NumberField } from './NumberField';

/** 一个色标：位置 offset（0 到 1）、颜色（#rrggbb 或 #rrggbbaa） */
export interface GradientStop {
  readonly offset: number;
  readonly color: string;
}

/** 角色由组件管理 */
export type GradientFieldManaged = 'role' | 'aria-disabled' | 'aria-readonly';

/** 未声明的属性落到外层 div 上，名称写 aria-label */
export interface GradientFieldProps extends PartProps<'div', GradientFieldManaged> {
  /** 色标（按 offset 从小到大）：父级写 _value={x} 双向绑定，拖动中实时写回 */
  _value?: readonly GradientStop[];
  /**
   * 色标位置对齐的步长（拖动、方向键）
   * @default 0.01
   */
  step?: number;
  /**
   * 能改透明度
   * @default true
   */
  alpha?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能聚焦、读屏念色标，拖动与按键不改值 */
  readonly?: boolean;
  /** 一次操作结束（松开、按键、加删、改颜色）时的色标 */
  onValueCommit?: (value: readonly GradientStop[]) => void;
  /** 渐变条的部件属性 */
  propsBar?: PartProps<'div'>;
  /** 色标的部件属性 */
  propsStop?: PartProps<'span'> | ((stop: GradientStop, index: number) => PartProps<'span'>);
}

/** 渐变在 offset 处的颜色（#rrggbbaa；在色标范围外时取两头的颜色）：相邻两个色标按 sRGB 线性插值，同 CSS 的渐变。 */
export function sampleGradient(stops: readonly GradientStop[], offset: number): string {
  if (stops.length === 0) return '#00000000';
  const rgba = (color: string) => {
    const c = parseColor(color);
    return c ? [c.r, c.g, c.b, c.alpha ?? 1] : [0, 0, 0, 1];
  };
  const hex = (v: readonly number[]) =>
    `#${v
      .map((c) =>
        Math.round(clamp(c, 0, 1) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`;
  if (offset <= stops[0]!.offset) return hex(rgba(stops[0]!.color));
  const last = stops[stops.length - 1]!;
  if (offset >= last.offset) return hex(rgba(last.color));
  let i = 0;
  while (stops[i + 1]!.offset < offset) i++;
  const a = stops[i]!,
    b = stops[i + 1]!;
  const u = b.offset > a.offset ? (offset - a.offset) / (b.offset - a.offset) : 0;
  const [ca, cb] = [rgba(a.color), rgba(b.color)];
  return hex(ca.map((c, k) => c + (cb[k]! - c) * u));
}

/** 写成 CSS 的 linear-gradient（angle 默认 to right） */
export function gradientCss(stops: readonly GradientStop[], angle = 'to right'): string {
  if (stops.length === 1) return stops[0]!.color;
  return `linear-gradient(${angle}, ${stops.map((stop) => `${stop.color} ${Math.round(stop.offset * 10000) / 100}%`).join(', ')})`;
}

/** 部件的标记（data-scope="gradient-field"） */
const gradientPart = (part: string) => partAttrs({ name: 'GradientField' }, part);

/** GradientField 的样式：root、bar、stops、stop、editor 等 */
export const gradientFieldStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_xs', width: '_full', minWidth: 0 },
  disabled: { opacity: '_disabled' },
  // 透明的地方露出棋盘格；按住双击加色标
  bar: {
    position: 'relative',
    height: '1.25em',
    borderRadius: '_sm',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '_border',
    cursor: 'copy',
    backgroundColor: '#ffffff',
    backgroundImage: 'repeating-conic-gradient(#c8c8c8 0% 25%, transparent 0% 50%)',
    backgroundSize: '10px 10px',
  },
  barOff: { cursor: 'default' },
  fill: { position: 'absolute', inset: 0, borderRadius: 'inherit' },
  // 色标的轨道：两头各留半个色标，色标在 0、1 时不伸出去
  stops: { position: 'relative', height: '1em', marginInline: '0.5em', touchAction: 'none' },
  stop: {
    position: 'absolute',
    top: 0,
    width: '1em',
    height: '1em',
    marginInlineStart: '-0.5em',
    borderRadius: '_sm',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '_border',
    cursor: 'ew-resize',
    '::before': { content: '""', position: 'absolute', inset: '-0.375em' },
  },
  selected: {
    borderColor: '_colors.accent',
    boxShadow: '0 0 0 1px var(--vtp-colors-accent, currentColor)',
  },
  stopOff: { cursor: 'default' },
  editor: { display: 'flex', alignItems: 'center', gap: '_xs', flexWrap: 'wrap' },
  offset: { width: '7em' },
});

const DEFAULT_STOPS: readonly GradientStop[] = [
  { offset: 0, color: '#ffffff' },
  { offset: 1, color: '#000000' },
];

/** 渐变编辑 */
export const GradientField = _component(
  ({
    _value: value = _bindable<readonly GradientStop[]>(DEFAULT_STOPS),
    step = 0.01,
    alpha = true,
    disabled,
    readonly,
    onValueCommit,
    id,
    propsBar,
    propsStop,
    ...rest
  }: GradientFieldProps) => {
    const lang = useLang();
    const control = useFieldControl(() => ({ id, disabled, readonly }));
    const off = () => control().disabled || control().readonly;
    let selected = _state(0);
    let track = _state.raw<HTMLElement | null>(null);
    const stopElements: (HTMLElement | null)[] = [];
    const round = (v: number) => Math.round(v * 10000) / 10000;
    const current = () => Math.min(selected, value.length - 1);

    /** 改第 index 个色标；位置变了重新排序，选中的跟着它 */
    function update(index: number, change: Partial<GradientStop>) {
      const target = { ...value[index]!, ...change };
      const others = value.filter((_, i) => i !== index);
      const at = others.findIndex((s) => s.offset > target.offset);
      const position = at < 0 ? others.length : at;
      value = [...others.slice(0, position), target, ...others.slice(position)];
      if (selected === index) selected = position;
      return position;
    }

    const offsetAt = (clientX: number) => {
      const rect = track!.getBoundingClientRect();
      return round(Math.round(clamp((clientX - rect.left) / rect.width, 0, 1) / step) * step);
    };

    function grab(index: number, event: PointerEvent) {
      selected = index;
      if (off()) return;
      event.preventDefault();
      stopElements[index]?.focus();
      let moving = index;
      startMove(event, {
        onMove: ({ clientX }) => {
          moving = update(moving, { offset: offsetAt(clientX) });
        },
        onEnd: ({ moved }) => {
          if (moved) onValueCommit?.(value);
          queueMicrotask(() => stopElements[moving]?.focus());
        },
      });
    }

    function add(offset: number) {
      if (off()) return;
      const stop = { offset: round(offset), color: sampleGradient(value, offset) };
      const at = value.findIndex((s) => s.offset > stop.offset);
      const position = at < 0 ? value.length : at;
      value = [...value.slice(0, position), stop, ...value.slice(position)];
      selected = position;
      onValueCommit?.(value);
      queueMicrotask(() => stopElements[position]?.focus());
    }

    function remove(index: number) {
      if (off() || value.length <= 1) return;
      value = value.filter((_, i) => i !== index);
      selected = Math.min(index, value.length - 1);
      onValueCommit?.(value);
      queueMicrotask(() => stopElements[selected]?.focus());
    }

    function onKeydown(index: number, event: KeyboardEvent) {
      if (off()) return;
      const stop = value[index]!;
      const scale = event.shiftKey ? 10 : 1;
      const moves: Record<string, number> = {
        ArrowLeft: stop.offset - step * scale,
        ArrowDown: stop.offset - step * scale,
        ArrowRight: stop.offset + step * scale,
        ArrowUp: stop.offset + step * scale,
        Home: 0,
        End: 1,
      };
      const next = moves[event.key];
      if (next !== undefined) {
        event.preventDefault();
        const position = update(index, { offset: round(clamp(next, 0, 1)) });
        onValueCommit?.(value);
        queueMicrotask(() => stopElements[position]?.focus());
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        remove(index);
      } else if (event.key === 'Insert') {
        event.preventDefault();
        const after = value[index + 1];
        add(after ? (stop.offset + after.offset) / 2 : Math.min(1, stop.offset + 0.1));
      }
    }

    return () => {
      const state = control();
      const index = current();
      const chosen = value[index];
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [gradientFieldStyles.root, state.disabled && gradientFieldStyles.disabled],
              ...gradientPart('root'),
            },
            rest,
            {
              role: 'group',
              'aria-disabled': state.disabled || undefined,
              'aria-readonly': state.readonly || undefined,
            },
          )}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [gradientFieldStyles.bar, off() && gradientFieldStyles.barOff],
                ...gradientPart('bar'),
              },
              propsBar,
              {
                title: off() ? undefined : lang.gradientAddHint,
                onDblclick: (event: MouseEvent) => {
                  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                  add(clamp((event.clientX - rect.left) / rect.width, 0, 1));
                },
              },
            )}
          >
            <span
              {...css.attrs(gradientFieldStyles.fill)}
              style={{ background: gradientCss(value) }}
            />
          </div>
          <div
            {...css.attrs(gradientFieldStyles.stops)}
            {...gradientPart('stops')}
            ref={(element: unknown) => (track = element as HTMLElement | null)}
          >
            {value.map((stop, i) => (
              <span
                {...mergeAttrs<'span'>(
                  {
                    sx: [
                      gradientFieldStyles.stop,
                      focusRingStyles.visible,
                      i === index && gradientFieldStyles.selected,
                      off() && gradientFieldStyles.stopOff,
                    ],
                    ...gradientPart('stop'),
                  },
                  typeof propsStop === 'function' ? propsStop(stop, i) : propsStop,
                  {
                    role: 'slider',
                    tabindex: state.disabled ? -1 : 0,
                    'aria-label': lang.gradientStop(i + 1),
                    'aria-valuemin': 0,
                    'aria-valuemax': 100,
                    'aria-valuenow': Math.round(stop.offset * 100),
                    'aria-valuetext': lang.gradientStopValue(
                      Math.round(stop.offset * 100),
                      stop.color,
                    ),
                    'aria-disabled': state.disabled || undefined,
                    'aria-readonly': state.readonly || undefined,
                    style: { left: `${stop.offset * 100}%`, background: stop.color },
                    ref: (element: unknown) => (stopElements[i] = element as HTMLElement | null),
                    onPointerdown: (event: PointerEvent) => grab(i, event),
                    onFocus: () => (selected = i),
                    onKeydown: (event: KeyboardEvent) => onKeydown(i, event),
                  },
                )}
              />
            ))}
          </div>
          {chosen && (
            <div {...css.attrs(gradientFieldStyles.editor)} {...gradientPart('editor')}>
              <ColorField
                size="sm"
                alpha={alpha}
                aria-label={lang.gradientStopColor}
                disabled={state.disabled}
                readonly={state.readonly}
                _value={chosen.color}
                onUpdate:_value={(color: string) => {
                  const hex = toHex(color);
                  if (!hex || hex === chosen.color) return;
                  update(index, { color: hex });
                  onValueCommit?.(value);
                }}
              />
              <NumberField
                {...css.attrs(gradientFieldStyles.offset)}
                size="sm"
                aria-label={lang.gradientStopOffset}
                suffix="%"
                min={0}
                max={100}
                step={step * 100}
                disabled={state.disabled}
                readonly={state.readonly}
                _value={round(chosen.offset * 100)}
                onUpdate:_value={(percent: number | null) => {
                  if (percent === null) return;
                  const offset = round(clamp(percent / 100, 0, 1));
                  if (offset === chosen.offset) return;
                  update(index, { offset });
                  onValueCommit?.(value);
                }}
              />
              {value.length > 1 && (
                <IconButton
                  icon={Trash2}
                  size="sm"
                  variant="ghost"
                  tone="neutral"
                  aria-label={lang.gradientStopRemove}
                  disabled={off()}
                  onClick={() => remove(index)}
                />
              )}
            </div>
          )}
        </div>
      );
    };
  },
);
