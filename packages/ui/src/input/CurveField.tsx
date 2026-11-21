/**
 * 曲线编辑：一条从左到右的曲线由几个关键帧（x, y）定，拖动关键帧改形状——粒子的大小随寿命、动画的缓动、音量包络、
 * 定价的阶梯。横轴是 0 到 1（走过的比例），纵轴的范围给定或按关键帧自动定。参考 Unity 的 AnimationCurve 编辑器、
 * Blender 的 Curve Widget。
 *
 *   let size = _state<CurveKey[]>([{ x: 0, y: 0.2 }, { x: 0.3, y: 1 }, { x: 1, y: 0 }]);
 *   <CurveField _value={size} aria-label="大小随寿命" onValueCommit={save} />
 *   <CurveField _value={volume} interpolation="smooth" yMin={0} yMax={2} />
 *
 * - 拖动关键帧改位置（左右不越过相邻的关键帧，顺序不变），在空处双击加一个关键帧，右键或 Delete 删一个（至少留一个）；
 *   拖动中实时写回 _value，一次操作结束（松开、按键、加删）时调用 onValueCommit。
 * - 键盘：关键帧按顺序各占一个 Tab 位置；←/→ 挪横坐标、↑/↓ 挪纵坐标（按 xStep、yStep，按住 Shift 十倍），
 *   Delete / Backspace 删除，Insert 在这一帧和下一帧中间加一帧。读屏念每一帧的坐标（valueText 可以改念法）。
 * - interpolation：linear 折线（默认）、smooth 单调的三次插值（平滑、不冲过关键帧之间的范围）、step 阶梯；
 *   evaluateCurve 按同样的规则取值，使用方拿它算曲线上的点。
 *
 * 部件（data-scope="curve-field"）：Root（外层）、Plot（画曲线的 svg）、Line（曲线）、Axis（y = 0 的线）、Key（关键帧）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useLang } from '../config/context';
import { partAttrs } from '../config/styles';
import { useFieldControl } from '../form/Field';
import { clamp } from '../utils/data/number';
import { startMove } from '../utils/dom/move';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { toneFillStyles, type StatusTone } from '../utils/style/tone-styles';

/** 一个关键帧：横坐标 x（0 到 1）、纵坐标 y */
export interface CurveKey {
  readonly x: number;
  readonly y: number;
}

/** 关键帧之间怎么连 */
export interface CurveInterpolations {
  /** 折线 */
  linear: unknown;
  /** 单调的三次插值：平滑，两帧之间不超出它们的范围 */
  smooth: unknown;
  /** 阶梯：保持前一帧的值，到下一帧时跳过去 */
  step: unknown;
}

/** 角色、可聚焦由组件管理 */
export type CurveFieldManaged = 'role' | 'aria-disabled' | 'aria-readonly';

/** 未声明的属性落到外层 div 上，名称写 aria-label */
export interface CurveFieldProps extends PartProps<'div', CurveFieldManaged> {
  /** 关键帧（按 x 从小到大）：父级写 _value={x} 双向绑定，拖动中实时写回 */
  _value?: readonly CurveKey[];
  /**
   * 关键帧之间怎么连
   * @default 'linear'
   */
  interpolation?: keyof CurveInterpolations;
  /** 纵轴的下限；不写时取 0 和关键帧里最小的 */
  yMin?: number;
  /** 纵轴的上限；不写时取 1 和关键帧里最大的（再留一成的空） */
  yMax?: number;
  /**
   * 横坐标对齐的步长（拖动、方向键）
   * @default 0.01
   */
  xStep?: number;
  /**
   * 纵坐标对齐的步长；不写时取纵轴范围的百分之一附近的整数步长（1、2、5 乘 10 的幂，如范围 1.1 时是 0.01）
   */
  yStep?: number;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能聚焦、读屏念坐标，拖动与按键不改值 */
  readonly?: boolean;
  /** 曲线与关键帧的色调，默认 accent */
  tone?: StatusTone;
  /** 读屏念的一帧，如 `(key) => \`${key.x * 100}%：${key.y}\``；不写时念两个坐标 */
  valueText?: (key: CurveKey) => string;
  /** 一次操作结束（松开、按键、加删）时的关键帧 */
  onValueCommit?: (value: readonly CurveKey[]) => void;
  /** 画曲线的 svg 的部件属性 */
  propsPlot?: PartProps<'svg'>;
  /** 关键帧的部件属性 */
  propsKey?: PartProps<'span'> | ((key: CurveKey, index: number) => PartProps<'span'>);
}

/**
 * 曲线在 x 处的值（x 在关键帧范围外时取两头的值）。和 CurveField 画的一样：linear 折线、smooth 单调三次（Fritsch–Carlson）、
 * step 阶梯。keys 按 x 从小到大。
 */
export function evaluateCurve(
  keys: readonly CurveKey[],
  x: number,
  interpolation: keyof CurveInterpolations = 'linear',
): number {
  if (keys.length === 0) return 0;
  if (x <= keys[0]!.x) return keys[0]!.y;
  const last = keys[keys.length - 1]!;
  if (x >= last.x) return last.y;
  let i = 0;
  while (keys[i + 1]!.x < x) i++;
  const a = keys[i]!,
    b = keys[i + 1]!;
  if (interpolation === 'step') return a.y;
  const span = b.x - a.x;
  const u = span > 0 ? (x - a.x) / span : 0;
  if (interpolation === 'linear') return a.y + (b.y - a.y) * u;
  const [ta, tb] = [tangent(keys, i), tangent(keys, i + 1)];
  // 三次 Hermite
  const u2 = u * u,
    u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * a.y +
    (u3 - 2 * u2 + u) * span * ta +
    (-2 * u3 + 3 * u2) * b.y +
    (u3 - u2) * span * tb
  );
}

/** 单调三次插值在第 i 帧的切线：两边斜率异号或有一边平时为 0，否则取调和平均（Fritsch–Carlson，不冲过头） */
function tangent(keys: readonly CurveKey[], i: number): number {
  const slope = (j: number) => {
    const a = keys[j]!,
      b = keys[j + 1]!;
    return b.x > a.x ? (b.y - a.y) / (b.x - a.x) : 0;
  };
  if (i === 0) return slope(0);
  if (i === keys.length - 1) return slope(i - 1);
  const s0 = slope(i - 1),
    s1 = slope(i);
  if (s0 * s1 <= 0) return 0;
  return (2 * s0 * s1) / (s0 + s1);
}

/** 不小于 raw 附近的整数步长：1、2、5 乘 10 的幂（键盘挪出来的值是 1.01 而不是 1.0111） */
function niceStep(raw: number): number {
  if (!(raw > 0)) return 0.01;
  const power = 10 ** Math.floor(Math.log10(raw));
  const mantissa = raw / power;
  return (mantissa < 1.5 ? 1 : mantissa < 3.5 ? 2 : mantissa < 7.5 ? 5 : 10) * power;
}

/** 部件的标记（data-scope="curve-field"） */
const curvePart = (part: string) => partAttrs({ name: 'CurveField' }, part);

/** CurveField 的样式：root、plot、line、axis、key 等 */
export const curveFieldStyles = css.create({
  root: {
    position: 'relative',
    width: '_full',
    height: '6em',
    borderRadius: '_md',
    backgroundColor: '_fill',
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'crosshair',
  },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
  readonly: { cursor: 'default' },
  plot: { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' },
  line: { fill: 'none', stroke: 'var(--tone-fill)', strokeWidth: 2 },
  axis: { stroke: '_border', strokeWidth: 1 },
  key: {
    position: 'absolute',
    width: '0.75em',
    height: '0.75em',
    marginInlineStart: '-0.375em',
    marginBlockStart: '-0.375em',
    borderRadius: '_full',
    backgroundColor: 'var(--tone-fill)',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '_surface',
    cursor: 'grab',
    // 点击区域比画出来的大（WCAG 2.5.8 的 24px）
    '::before': { content: '""', position: 'absolute', inset: '-0.5em' },
  },
  keyOff: { cursor: 'inherit' },
});

const DEFAULT_KEYS: readonly CurveKey[] = [
  { x: 0, y: 1 },
  { x: 1, y: 1 },
];

/** 曲线编辑 */
export const CurveField = _component(
  ({
    _value: value = _bindable<readonly CurveKey[]>(DEFAULT_KEYS),
    interpolation = 'linear',
    yMin,
    yMax,
    xStep = 0.01,
    yStep,
    disabled,
    readonly,
    tone = 'accent',
    valueText,
    onValueCommit,
    id,
    propsPlot,
    propsKey,
    ...rest
  }: CurveFieldProps) => {
    const lang = useLang();
    const control = useFieldControl(() => ({ id, disabled, readonly }));
    const off = () => control().disabled || control().readonly;
    let root = _state.raw<HTMLElement | null>(null);
    const keyElements: (HTMLElement | null)[] = [];
    /** 拖动期间冻住的纵轴范围：自动范围跟着拖的点变，图会跳 */
    let frozen = _state.raw<readonly [number, number] | undefined>(undefined);

    const range = (): readonly [number, number] => {
      if (frozen) return frozen;
      const ys = value.map((key) => key.y);
      const low = yMin ?? Math.min(0, ...ys);
      const high = yMax ?? Math.max(1, ...ys) * 1.1;
      return high > low ? [low, high] : [low, low + 1];
    };
    const step = () => yStep ?? niceStep((range()[1] - range()[0]) / 100);
    const snap = (v: number, s: number) => Math.round(v / s) * s;
    const round = (v: number) => Math.round(v * 1e6) / 1e6;

    /** 指针位置换成曲线坐标 */
    const at = (clientX: number, clientY: number): CurveKey => {
      const rect = root!.getBoundingClientRect();
      const [low, high] = range();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = low + (1 - clamp((clientY - rect.top) / rect.height, 0, 1)) * (high - low);
      return { x: round(snap(x, xStep)), y: round(snap(y, step())) };
    };

    /** 把第 index 帧挪到 key：横坐标夹在相邻两帧之间 */
    function move(index: number, key: CurveKey) {
      const lower = index > 0 ? value[index - 1]!.x : 0;
      const upper = index < value.length - 1 ? value[index + 1]!.x : 1;
      const [low, high] =
        yMin !== undefined && yMax !== undefined ? [yMin, yMax] : [-Infinity, Infinity];
      value = value.map((k, i) =>
        i === index ? { x: clamp(key.x, lower, upper), y: clamp(key.y, low, high) } : k,
      );
    }

    function grab(index: number, event: PointerEvent) {
      if (off()) return;
      event.preventDefault();
      event.stopPropagation();
      keyElements[index]?.focus();
      frozen = range();
      startMove(event, {
        onMove: ({ clientX, clientY }) => move(index, at(clientX, clientY)),
        onEnd: () => {
          frozen = undefined;
          onValueCommit?.(value);
        },
      });
    }

    function add(key: CurveKey) {
      if (off()) return;
      const index = value.findIndex((k) => k.x > key.x);
      const at_ = index < 0 ? value.length : index;
      value = [...value.slice(0, at_), key, ...value.slice(at_)];
      onValueCommit?.(value);
      // 新的一帧接住焦点（渲染之后）
      queueMicrotask(() => keyElements[at_]?.focus());
    }

    function remove(index: number) {
      if (off() || value.length <= 1) return;
      value = value.filter((_, i) => i !== index);
      onValueCommit?.(value);
      queueMicrotask(() => keyElements[Math.min(index, value.length - 1)]?.focus());
    }

    function onKeydown(index: number, event: KeyboardEvent) {
      if (off()) return;
      const key = value[index]!;
      const scale = event.shiftKey ? 10 : 1;
      const moves: Record<string, CurveKey> = {
        ArrowLeft: { x: key.x - xStep * scale, y: key.y },
        ArrowRight: { x: key.x + xStep * scale, y: key.y },
        ArrowUp: { x: key.x, y: key.y + step() * scale },
        ArrowDown: { x: key.x, y: key.y - step() * scale },
      };
      const next = moves[event.key];
      if (next) {
        event.preventDefault();
        move(index, { x: round(next.x), y: round(next.y) });
        onValueCommit?.(value);
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        remove(index);
      } else if (event.key === 'Insert') {
        event.preventDefault();
        const after = value[index + 1];
        const x = after ? (key.x + after.x) / 2 : Math.min(1, key.x + 0.1);
        add({ x: round(x), y: round(evaluateCurve(value, x, interpolation)) });
      }
    }

    /** 曲线：在 0..1 × 0..1 的坐标里画（svg 拉伸到外框） */
    const path = () => {
      const [low, high] = range();
      const y = (v: number) => 1 - (v - low) / (high - low);
      const keys = value;
      if (keys.length === 0) return '';
      const points: string[] = [`0,${y(keys[0]!.y)}`];
      if (interpolation === 'step') {
        keys.forEach((key, i) => {
          if (i > 0) points.push(`${key.x},${y(keys[i - 1]!.y)}`);
          points.push(`${key.x},${y(key.y)}`);
        });
      } else if (interpolation === 'smooth') {
        for (let s = 0; s <= 128; s++)
          points.push(`${s / 128},${y(evaluateCurve(keys, s / 128, 'smooth'))}`);
      } else {
        for (const key of keys) points.push(`${key.x},${y(key.y)}`);
      }
      points.push(`1,${y(keys[keys.length - 1]!.y)}`);
      return `M${points.join('L')}`;
    };

    const text = (key: CurveKey) => valueText?.(key) ?? lang.curveKey(round(key.x), round(key.y));

    return () => {
      const [low, high] = range();
      const state = control();
      const axis = low < 0 && high > 0 ? 1 - (0 - low) / (high - low) : undefined;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                curveFieldStyles.root,
                toneFillStyles[tone],
                state.disabled && curveFieldStyles.disabled,
                state.readonly && curveFieldStyles.readonly,
              ],
              ...curvePart('root'),
            },
            rest,
            {
              role: 'group',
              'aria-disabled': state.disabled || undefined,
              'aria-readonly': state.readonly || undefined,
              ref: (element: unknown) => (root = element as HTMLElement | null),
              onDblclick: (event: MouseEvent) => {
                if (event.target !== root && !(event.target as Element).closest?.('svg')) return;
                add(at(event.clientX, event.clientY));
              },
            },
          )}
        >
          <svg
            {...mergeAttrs<'svg'>({ sx: curveFieldStyles.plot, ...curvePart('plot') }, propsPlot)}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {axis !== undefined && (
              <line
                {...css.attrs(curveFieldStyles.axis)}
                {...curvePart('axis')}
                vector-effect="non-scaling-stroke"
                x1="0"
                x2="1"
                y1={axis}
                y2={axis}
              />
            )}
            <path
              {...css.attrs(curveFieldStyles.line)}
              {...curvePart('line')}
              vector-effect="non-scaling-stroke"
              d={path()}
            />
          </svg>
          {value.map((key, index) => (
            <span
              {...mergeAttrs<'span'>(
                {
                  sx: [
                    curveFieldStyles.key,
                    focusRingStyles.visible,
                    off() && curveFieldStyles.keyOff,
                  ],
                  ...curvePart('key'),
                },
                typeof propsKey === 'function' ? propsKey(key, index) : propsKey,
                {
                  role: 'button',
                  tabindex: state.disabled ? -1 : 0,
                  'aria-roledescription': lang.curveKeyRole,
                  'aria-label': text(key),
                  'aria-disabled': state.disabled || undefined,
                  style: {
                    left: `${key.x * 100}%`,
                    top: `${(1 - (key.y - low) / (high - low)) * 100}%`,
                  },
                  ref: (element: unknown) => (keyElements[index] = element as HTMLElement | null),
                  onPointerdown: (event: PointerEvent) => grab(index, event),
                  onKeydown: (event: KeyboardEvent) => onKeydown(index, event),
                  onContextmenu: (event: MouseEvent) => {
                    event.preventDefault();
                    remove(index);
                  },
                  onDblclick: (event: MouseEvent) => event.stopPropagation(),
                },
              )}
            />
          ))}
        </div>
      );
    };
  },
);
