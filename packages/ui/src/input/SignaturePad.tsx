/**
 * 手写签名：审批签字、签收、合同确认。canvas 上用指针（鼠标、笔、手指）写，笔画按速度粗细（写得快变细，参考 signature_pad），
 * 可以撤销上一笔、清空；值是透明底的 PNG（data URL），随表单提交（name）。只读时显示已签的图。
 *
 *   <Field label="签收人签字"><SignaturePad _value={signature} name="signature" /></Field>
 *   <SignaturePad value={record.signature} readonly />
 *   <SignaturePad handle={(pad) => (signer = pad)} />   signer.toSvg()、signer.toPng()
 *
 * 外框是输入框的外壳（边框、悬停、焦点环、出错、不可用、只读一样），底色与墨色是“纸面”（utils/style/paper.ts）：
 * 深色主题下仍是白底深色，导出的图放到白纸上看得见。父级换了 value（编辑页读回的旧签名）时把它画上，可以接着写或清空。
 * 写字只能靠指针（签名本身就是手写）：撤销、清空是按钮，键盘照常可用；画布是 role="img"，读屏念名称与“已签名 / 未签名”。
 * 部件：Root（外壳 div）、Canvas、Placeholder、Toolbar、Undo、Clear（IconButton）。
 */
import { Eraser, Undo2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onScopeDispose, useId, watch } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import { startMove } from '../utils/dom/move';
import { useResizeObserver } from '../utils/dom/resize';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { paperStyles } from '../utils/style/paper';
import { controlParts, useControlAppearance, type ControlOptions } from './control';
import { partAttrs } from '../config/styles';

/** 笔画上的一个点（相对画布左上角，CSS px）与它的笔宽 */
interface StrokePoint {
  x: number;
  y: number;
  width: number;
}

/** 画布上的一段：起点、控制点（二次贝塞尔）、终点与笔宽 */
interface Segment {
  from: readonly [number, number];
  control: readonly [number, number];
  to: readonly [number, number];
  width: number;
}

/** handle 拿到的方法 */
export interface SignaturePadHandle {
  /** 透明底的 PNG（data URL）；没签时 null */
  toPng: () => string | null;
  /** SVG 文字（笔画是路径，读回的旧签名是嵌入的图片）；没签时 null */
  toSvg: () => string | null;
  /** 撤销上一笔 */
  undo: () => void;
  /** 清空 */
  clear: () => void;
}

/** 未声明的属性落到外壳 div 上；名称写 aria-label，或放在 Field 里 */
export interface SignaturePadProps extends PartProps<'div'>, Pick<ControlOptions, 'radius'> {
  /** 签名（透明底的 PNG data URL）：父级写 _value={x}；没签时 null。每写完一笔更新 */
  _value?: string | null;
  /** 画布的高度，默认 10rem；宽度占满 */
  height?: string;
  /** 墨色（CSS 颜色）；默认是纸面的墨色 */
  penColor?: string;
  /** 最细的笔宽（px），默认 0.75 */
  minWidth?: number;
  /** 最粗的笔宽（px），默认 2.75 */
  maxWidth?: number;
  /** 只读：显示已签的图，不能写 */
  readonly?: boolean;
  /** 不可用（不写时取 Field 的） */
  disabled?: boolean;
  /** 出错（不写时取 Field 的） */
  invalid?: boolean;
  /** 表单提交时的 name：值是 PNG 的 data URL */
  name?: string;
  /** 拿到导出与撤销、清空的方法 */
  handle?: (pad: SignaturePadHandle) => void;
  /** 画布的部件属性 */
  propsCanvas?: PartProps<'canvas', 'role' | 'width' | 'height'>;
  /** 撤销按钮的部件属性 */
  propsUndo?: Partial<IconButtonProps>;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<IconButtonProps>;
}

/** 部件的标记（data-scope="signature-pad"） */
const signaturePadPart = (part: string) => partAttrs({ name: 'SignaturePad' }, part);

/** SignaturePad 的样式：root、writable、canvas、placeholder、toolbar */
export const signaturePadStyles = css.create({
  root: { position: 'relative', display: 'block', width: '_full', padding: 0, overflow: 'hidden' },
  writable: { cursor: 'crosshair' },
  // 触摸时不滚动页面、不缩放：手指的移动都是笔画
  canvas: { display: 'block', width: '_full', touchAction: 'none' },
  placeholder: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    color: '_textPlaceholder',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  toolbar: {
    position: 'absolute',
    insetBlockStart: '_xs',
    insetInlineEnd: '_xs',
    display: 'flex',
    gap: '_xs',
  },
});

/** 动态样式（任意值，单独一个 create，见 COMPONENTS.md §4） */
const signaturePadSizeStyles = css.create({ height: (value: string) => ({ height: value }) });

/** 速度的平滑权重：越大越稳（signature_pad 的 velocityFilterWeight） */
const VELOCITY_WEIGHT = 0.7;
/** 比这更近的点不记（CSS px）：手抖、高频事件 */
const MIN_DISTANCE = 1.5;

const mid = (a: StrokePoint, b: StrokePoint) => [(a.x + b.x) / 2, (a.y + b.y) / 2] as const;

/** 一笔拆成二次贝塞尔的段：穿过相邻两点的中点，控制点是原来的点；笔宽取两端的平均 */
function segmentsOf(stroke: readonly StrokePoint[]): Segment[] {
  if (stroke.length < 2) return [];
  const result: Segment[] = [];
  const first = stroke[0]!;
  let from: readonly [number, number] = [first.x, first.y];
  for (let i = 1; i < stroke.length; i++) {
    const point = stroke[i]!;
    const last = i === stroke.length - 1;
    const to = last ? ([point.x, point.y] as const) : mid(point, stroke[i + 1]!);
    const control = last ? to : ([point.x, point.y] as const);
    result.push({ from, control, to, width: (stroke[i - 1]!.width + point.width) / 2 });
    from = to;
  }
  return result;
}

/** 手写签名（canvas） */
export const SignaturePad = _component(
  ({
    _value: value = _bindable<string | null>(null),
    height = '10rem',
    penColor,
    minWidth = 0.75,
    maxWidth = 2.75,
    readonly,
    disabled,
    invalid,
    radius,
    name,
    id,
    handle,
    propsCanvas,
    propsUndo,
    propsClear,
    'aria-label': label,
    ...rest
  }: SignaturePadProps) => {
    const lang = useLang();
    const statusId = useId();
    const appearance = useControlAppearance(() => ({ radius }));
    const control = useFieldControl(() => ({ id, invalid, disabled, readonly }));
    let canvas = _state.raw<HTMLCanvasElement | null>(null);
    let strokes = _state.raw<StrokePoint[][]>([]);
    /** 读回的旧签名（父级给的 value）：画在最底下 */
    let base = _state.raw<HTMLImageElement | null>(null);
    /** 自己最后交出去的值：父级的 value 等于它时不是“换了签名” */
    let emitted: string | null = value;
    let drawing: { points: StrokePoint[]; velocity: number; time: number } | null = null;

    const editable = () => {
      const state = control();
      return !state.disabled && !state.readonly;
    };
    const empty = () => strokes.length === 0 && base === null;
    const ink = () => penColor ?? (canvas ? getComputedStyle(canvas).color : '#000');

    function context() {
      const context = canvas?.getContext('2d');
      if (!context) return null;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = context.fillStyle = ink();
      return context;
    }

    function drawSegments(context: CanvasRenderingContext2D, segments: readonly Segment[]) {
      for (const { from, control, to, width } of segments) {
        context.lineWidth = width;
        context.beginPath();
        context.moveTo(from[0], from[1]);
        context.quadraticCurveTo(control[0], control[1], to[0], to[1]);
        context.stroke();
      }
    }

    function drawDot(context: CanvasRenderingContext2D, point: StrokePoint) {
      context.beginPath();
      context.arc(point.x, point.y, point.width / 2, 0, Math.PI * 2);
      context.fill();
    }

    /** 整张重画：换了大小、撤销、读回旧签名时 */
    function redraw() {
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const { width, height: cssHeight } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(cssHeight * ratio);
      const context2d = context();
      if (!context2d) return;
      context2d.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (base) context2d.drawImage(base, 0, 0, width, cssHeight);
      for (const stroke of strokes) {
        if (stroke.length === 1) drawDot(context2d, stroke[0]!);
        else drawSegments(context2d, segmentsOf(stroke));
      }
    }

    useResizeObserver(() => canvas, redraw);

    function toPng() {
      return empty() || !canvas ? null : canvas.toDataURL('image/png');
    }

    function toSvg() {
      if (empty() || !canvas) return null;
      const { width, height: cssHeight } = canvas.getBoundingClientRect();
      const color = ink();
      const image = base
        ? `<image href="${base.src}" width="${width}" height="${cssHeight}"/>`
        : '';
      const paths = strokes
        .map((stroke) =>
          stroke.length === 1
            ? `<circle cx="${stroke[0]!.x}" cy="${stroke[0]!.y}" r="${stroke[0]!.width / 2}" fill="${color}"/>`
            : segmentsOf(stroke)
                .map(
                  ({ from, control, to, width: w }) =>
                    `<path d="M${from[0]} ${from[1]}Q${control[0]} ${control[1]} ${to[0]} ${to[1]}" stroke-width="${w.toFixed(2)}"/>`,
                )
                .join(''),
        )
        .join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cssHeight}" viewBox="0 0 ${width} ${cssHeight}">${image}<g fill="none" stroke="${color}" stroke-linecap="round">${paths}</g></svg>`;
    }

    function commit() {
      emitted = toPng();
      value = emitted;
    }

    function undo() {
      if (strokes.length > 0) strokes = strokes.slice(0, -1);
      else base = null;
      redraw();
      commit();
    }

    function clear() {
      strokes = [];
      base = null;
      redraw();
      commit();
    }

    // 父级换了签名（读回旧签名、在别处清空）：清掉笔画，旧签名画在底下
    watch(
      () => value,
      (next) => {
        if (next === emitted) return;
        emitted = next;
        strokes = [];
        base = null;
        if (!next) return redraw();
        const image = new Image();
        image.onload = () => {
          if (emitted !== next) return;
          base = image;
          redraw();
        };
        image.src = next;
      },
      { immediate: true },
    );

    watch(
      () => canvas,
      (element) => {
        if (element) handle?.({ toPng, toSvg, undo, clear });
      },
      { flush: 'post' },
    );

    /** 指针在画布上的位置，和按速度算出的笔宽 */
    function pointOf(event: PointerEvent): StrokePoint {
      const rect = canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const previous = drawing?.points.at(-1);
      if (!drawing || !previous) return { x, y, width: (minWidth + maxWidth) / 2 };
      const elapsed = Math.max(event.timeStamp - drawing.time, 1);
      const speed = Math.hypot(x - previous.x, y - previous.y) / elapsed;
      drawing.velocity = VELOCITY_WEIGHT * speed + (1 - VELOCITY_WEIGHT) * drawing.velocity;
      drawing.time = event.timeStamp;
      return { x, y, width: Math.max(maxWidth / (drawing.velocity + 1), minWidth) };
    }

    /** 按下开始一笔；之后的移动、抬笔（取消也一样收下已写的部分）由 startMove 跟踪 */
    let stopMove: (() => void) | undefined;
    onScopeDispose(() => stopMove?.());
    function onPointerdown(event: PointerEvent) {
      if (!editable() || event.button !== 0 || !canvas) return;
      event.preventDefault();
      drawing = { points: [], velocity: 0, time: event.timeStamp };
      drawing.points.push(pointOf(event));
      const context2d = context();
      if (context2d) drawDot(context2d, drawing.points[0]!);
      stopMove = startMove(event, { onMove: (_, move) => extend(move), onEnd: finish });
    }

    /** 接上新的点，只画新多出来的一段 */
    function extend(event: PointerEvent) {
      if (!drawing) return;
      const context2d = context();
      // 合并掉的中间点也画上，笔画更顺；不支持或拿不到（脚本派发的事件）时就用这一个
      const coalesced = event.getCoalescedEvents?.() ?? [];
      for (const sample of coalesced.length ? coalesced : [event]) {
        const previous = drawing.points.at(-1)!;
        const point = pointOf(sample);
        if (Math.hypot(point.x - previous.x, point.y - previous.y) < MIN_DISTANCE) continue;
        drawing.points.push(point);
        // 只画新多出来的一段：从上上个点与上个点的中点，经过上个点，到上个点与这个点的中点
        // （同 segmentsOf 里倒数第二段；最后半段等抬笔时补上）
        const points = drawing.points;
        if (context2d && points.length >= 3) {
          const [a, b, c] = points.slice(-3) as [StrokePoint, StrokePoint, StrokePoint];
          drawSegments(context2d, [
            {
              from: points.length === 3 ? [a.x, a.y] : mid(a, b),
              control: [b.x, b.y],
              to: mid(b, c),
              width: (a.width + b.width) / 2,
            },
          ]);
        }
      }
    }

    function finish() {
      stopMove = undefined;
      if (!drawing) return;
      const points = drawing.points;
      drawing = null;
      strokes = [...strokes, points];
      // 收尾：补上最后半段（并把整笔按最终的形状重画一次）
      redraw();
      commit();
    }

    return () => {
      const state = control();
      const s = controlParts(appearance(), state);
      const writable = editable();
      const signed = !empty();
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              ...s.root,
              sx: [
                s.root.sx,
                paperStyles.paper,
                signaturePadStyles.root,
                writable && signaturePadStyles.writable,
              ],
            },
            rest,
          )}
          data-disabled={state.disabled || undefined}
          data-invalid={state.invalid || undefined}
        >
          <canvas
            {...mergeAttrs<'canvas'>(
              { sx: [signaturePadStyles.canvas, signaturePadSizeStyles.height(height)] },
              propsCanvas,
              {
                ref: _toRef(canvas),
                id: state.id,
                role: 'img',
                'aria-labelledby': state.labelledBy,
                'aria-label': state.labelledBy ? undefined : (label ?? lang.signature),
                'aria-describedby': [statusId, state.describedBy].filter(Boolean).join(' '),
                onPointerdown,
              },
            )}
          />
          <span id={statusId} hidden>
            {signed ? lang.signatureSigned : lang.signatureEmpty}
          </span>
          {!signed && (
            <span
              {...css.attrs(signaturePadStyles.placeholder)}
              {...signaturePadPart('placeholder')}
              aria-hidden="true"
            >
              {writable ? lang.signaturePlaceholder : lang.signatureEmpty}
            </span>
          )}
          {writable && signed && (
            <div {...css.attrs(signaturePadStyles.toolbar)} {...signaturePadPart('toolbar')}>
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  {
                    icon: Undo2,
                    size: 'sm',
                    variant: 'ghost',
                    tone: 'neutral',
                    'aria-label': lang.signatureUndo,
                  },
                  propsUndo,
                  { onClick: undo },
                )}
              />
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  {
                    icon: Eraser,
                    size: 'sm',
                    variant: 'ghost',
                    tone: 'neutral',
                    'aria-label': lang.signatureClear,
                  },
                  propsClear,
                  { onClick: clear },
                )}
              />
            </div>
          )}
          <FormValue name={name} value={value} disabled={state.disabled} />
        </div>
      );
    };
  },
);
