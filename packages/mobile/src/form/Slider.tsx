/**
 * 滑块：在一段范围里拖动选一个数（音量、价格上限），给两个数时是区间（价格区间）。点轨道直接跳过去。
 *
 *   <Slider _value={volume} />
 *   <Slider _value={price} min={0} max={1000} step={50} />      price 是 [200, 600] 时两个滑块
 *
 * 拖动时值跟着变，松手时 onChange；横滑才接管手势，竖滑照常滚动页面。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useHost, type HostRect } from '../utils/host';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { useForm } from './context';

/** 一个数，或区间的两端 */
export type SliderValue = number | [number, number];

/** 未声明的属性落到根元素（div）上 */
export interface SliderProps extends Omit<PartProps<'div'>, 'onChange'> {
  /** 当前的值；双向绑定写 `_value={x}`。数组时是区间 */
  _value?: SliderValue;
  /**
   * 最小值
   * @default 0
   */
  min?: number;
  /**
   * 最大值
   * @default 100
   */
  max?: number;
  /**
   * 步长
   * @default 1
   */
  step?: number;
  /** 禁用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
  /** 松手（或点了轨道、按了方向键）之后 */
  onChange?: (value: SliderValue) => void;
  /** 轨道的部件属性 */
  propsTrack?: PartProps<'div'>;
  /** 滑块（两个时都用）的部件属性 */
  propsThumb?: PartProps<'div'>;
}

/** Slider 的样式：root、track、fill、thumb */
export const sliderStyles = css.create({
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    height: '2em',
    // 两端留出半个滑块，滑块不出界
    paddingInline: '0.75em',
    touchAction: 'pan-y',
    userSelect: 'none',
    opacity: { default: 1, '[data-disabled]': '_disabled' },
  },
  track: {
    position: 'relative',
    flex: '1 1 auto',
    height: '0.25em',
    borderRadius: '_full',
    backgroundColor: '_fillActive',
  },
  fill: { position: 'absolute', insetBlock: 0, borderRadius: '_full', backgroundColor: '_accent' },
  thumb: {
    boxSizing: 'border-box',
    position: 'absolute',
    insetBlockStart: '50%',
    width: '1.5em',
    height: '1.5em',
    borderRadius: '_full',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    // 滑块在亮暗两套主题里都是白的（同 Switch 的圆点）
    backgroundColor: '#fff',
    boxShadow: '_sm',
    transform: 'translate(-50%, -50%)',
    cursor: { default: 'grab', '[data-disabled]': 'not-allowed' },
  },
});

// 判定横竖的移动距离（px）
const LOCK_DISTANCE = 6;

/** 滑块（div > 轨道：已选的一段 + 滑块） */
export const Slider = _component(
  ({
    _value: value = _bindable<SliderValue>(0),
    min = 0,
    max = 100,
    step = 1,
    disabled,
    readonly = false,
    onChange,
    propsTrack,
    propsThumb,
    ...rest
  }: SliderProps) => {
    const host = useHost();
    const form = useForm();
    let track: unknown = null;
    let rect: HostRect | null = null;
    let horizontal = _state(false);
    let start = { x: 0, y: 0 };
    let direction: 'h' | 'v' | null = null;
    // 拖的是区间的哪一端
    let active = 0;

    const interactive = () => !(disabled ?? form?.disabled) && !readonly && !form?.readonly;
    const ends = (): [number, number] => (Array.isArray(value) ? value : [min, value]);
    const percent = (number: number) => ((number - min) / (max - min || 1)) * 100;
    const snap = (number: number) => {
      const stepped = Math.round((number - min) / step) * step + min;
      return Number(Math.min(max, Math.max(min, stepped)).toFixed(10));
    };
    const valueAt = (x: number) =>
      rect ? snap(min + ((x - rect.left) / (rect.width || 1)) * (max - min)) : null;
    /** 把一端改成 next：区间两端交叉时换成拖另一端 */
    const setEnd = (index: number, next: number) => {
      if (!Array.isArray(value)) return void (value = next);
      const pair: [number, number] = [...value];
      pair[index] = next;
      if (pair[0] > pair[1]) {
        pair.reverse();
        active = 1 - index;
      }
      value = pair;
    };
    const nearest = (number: number) => {
      if (!Array.isArray(value)) return 0;
      return Math.abs(number - value[0]) <= Math.abs(number - value[1]) ? 0 : 1;
    };
    const pointX = (event: Event) =>
      (event as TouchEvent).changedTouches?.[0]?.clientX ?? (event as MouseEvent).clientX;

    const onTouchstart = (event: TouchEvent) => {
      if (!interactive()) return;
      const touch = event.touches[0]!;
      start = { x: touch.clientX, y: touch.clientY };
      direction = null;
      void host.measure(track).then((measured) => (rect = measured));
    };
    const onTouchmove = (event: TouchEvent) => {
      if (!interactive() || !rect) return;
      const touch = event.touches[0]!;
      if (!direction) {
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;
        direction = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        horizontal = direction === 'h';
        if (horizontal) active = nearest(valueAt(start.x) ?? min);
      }
      if (direction !== 'h') return;
      const next = valueAt(touch.clientX);
      if (next !== null) setEnd(active, next);
    };
    const onTouchend = () => {
      if (horizontal) onChange?.(value);
      horizontal = false;
    };
    // 点轨道：跳到点的位置（滑动不触发点击）
    const onClick = (event: Event) => {
      if (!interactive()) return;
      const x = pointX(event);
      void host.measure(track).then((measured) => {
        rect = measured;
        const next = valueAt(x);
        if (next === null) return;
        active = nearest(next);
        setEnd(active, next);
        onChange?.(value);
      });
    };
    const onKeydown = (index: number, event: KeyboardEvent) => {
      if (!interactive()) return;
      const delta = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[
        event.key
      ];
      if (delta === undefined) return;
      event.preventDefault();
      setEnd(index, snap(ends()[index]! + delta));
      onChange?.(value);
    };

    return () => {
      const off = !interactive();
      const [low, high] = ends();
      const range = Array.isArray(value);
      const thumbs = range ? [low, high] : [high];
      return (
        <div
          {...mergeAttrs<'div'>({ sx: sliderStyles.root }, rest, {
            onTouchstart,
            onTouchmove,
            onTouchend,
            onTouchcancel: onTouchend,
            onClick,
            ...dataAttrs({
              // 小程序：收 touchmove；横滑期间 catch，页面不跟着滚
              'data-touch-move': horizontal ? 'catch' : true,
              'data-disabled': disabled ?? form?.disabled,
            }),
          })}
        >
          <div
            {...mergeAttrs<'div'>({ sx: sliderStyles.track }, propsTrack)}
            ref={(node: unknown) => (track = node)}
          >
            <div
              {...mergeAttrs<'div'>({
                sx: sliderStyles.fill,
                style: {
                  insetInlineStart: `${range ? percent(low) : 0}%`,
                  width: `${percent(high) - (range ? percent(low) : 0)}%`,
                },
              })}
            />
            {thumbs.map((number, index) => (
              <div
                {...mergeAttrs<'div'>(
                  { sx: sliderStyles.thumb, style: { insetInlineStart: `${percent(number)}%` } },
                  propsThumb,
                  {
                    role: 'slider',
                    tabindex: off ? undefined : 0,
                    'aria-valuemin': min,
                    'aria-valuemax': max,
                    'aria-valuenow': number,
                    'aria-disabled': off ? 'true' : undefined,
                    onKeydown: (event: KeyboardEvent) => onKeydown(range ? index : 1, event),
                    ...dataAttrs({ 'data-disabled': off }),
                  },
                )}
              />
            ))}
          </div>
        </div>
      );
    };
  },
);
