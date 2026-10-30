/**
 * 滚轮的一列（Picker、DatePicker、TimePicker 共用，内部组件）：上下拖动带惯性，松手对齐到最近的一项，跳过禁用的项；
 * 点一项直接滚过去；H5 里聚焦后可以用方向键。
 *
 * 项高按 em 写（随字号），拖动要换算成像素：挂上时量一次列的高度，每次按下时再量。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted, type VNodeChild } from 'vue';
import { useHost } from '../utils/host';
import { dataAttrs, mergeAttrs } from '../utils/props';

/** 一个选项 */
export interface PickerOption {
  /** 显示的文字 */
  text: VNodeChild;
  /** 值 */
  value: string | number;
  /** 不能选 */
  disabled?: boolean;
  /** 联动时的下一列 */
  children?: PickerOption[];
}

/** 一列的属性 */
export interface PickerColumnProps {
  /** 选项 */
  options: PickerOption[];
  /** 选中的序号 */
  index: number;
  /** 可见的行数（奇数） */
  visible: number;
  /** 读屏的名称 */
  label?: string;
  /** 选中的项变了（拖完、点了、按了方向键） */
  onSelect: (index: number) => void;
}

/** 一行的高度（em） */
export const PICKER_ITEM_HEIGHT = 2.75;

/** PickerColumn 的样式 */
export const pickerColumnStyles = css.create({
  column: {
    position: 'relative',
    flex: '1 1 0',
    minWidth: 0,
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    outlineStyle: 'none',
  },
  list: {
    transitionProperty: 'transform',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.68, 1)',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: `${PICKER_ITEM_HEIGHT}em`,
    paddingInline: '_xs',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontSize: '_md',
    color: { default: '_text', '[data-disabled]': '_textDisabled' },
    cursor: { default: 'pointer', '[data-disabled]': 'not-allowed' },
  },
});

/** 离边缘还能多拖的阻尼：越过两端时只跟手三分之一 */
const RESISTANCE = 1 / 3;

/** 找到离 index 最近的可选项 */
function nearestEnabled(options: PickerOption[], index: number): number {
  const clamped = Math.min(options.length - 1, Math.max(0, index));
  for (let distance = 0; distance < options.length; distance++) {
    for (const candidate of [clamped + distance, clamped - distance])
      if (options[candidate] && !options[candidate].disabled) return candidate;
  }
  return clamped;
}

/** 滚轮的一列（div[role=listbox]） */
export const PickerColumn = _component(
  ({ options, index, visible, label, onSelect }: PickerColumnProps) => {
    const host = useHost();
    let column: unknown = null;
    // 一行的像素高度：量列的高度除以可见的行数
    let itemPx = 44;
    const measure = async () => {
      const rect = await host.measure(column);
      if (rect?.height) itemPx = rect.height / visible;
    };
    onMounted(() => void measure());

    // 拖动中的偏移（px，相对选中项居中的位置）；null 是没在拖
    let drag = _state<number | null>(null);
    let duration = _state(0);
    let start = { y: 0, time: 0, index: 0 };
    let moves: { y: number; time: number }[] = [];

    const select = (next: number, ms: number) => {
      duration = ms;
      const target = nearestEnabled(options, next);
      if (target !== index) onSelect(target);
    };
    const onTouchstart = (event: TouchEvent) => {
      void measure();
      const y = event.touches[0]!.clientY;
      start = { y, time: Date.now(), index };
      moves = [{ y, time: start.time }];
      drag = 0;
      duration = 0;
    };
    const onTouchmove = (event: TouchEvent) => {
      if (drag === null) return;
      event.preventDefault();
      const y = event.touches[0]!.clientY;
      const now = Date.now();
      moves = [...moves.filter((move) => now - move.time < 100), { y, time: now }];
      let offset = y - start.y;
      // 越过第一项、最后一项时加阻尼
      const top = start.index * itemPx;
      const bottom = (options.length - 1 - start.index) * itemPx;
      if (offset > top) offset = top + (offset - top) * RESISTANCE;
      if (offset < -bottom) offset = -bottom + (offset + bottom) * RESISTANCE;
      drag = offset;
    };
    const onTouchend = () => {
      if (drag === null) return;
      const offset = drag;
      drag = null;
      // 惯性：最后 100ms 的速度（px/ms）乘一个时长，快甩滚得远
      const first = moves[0]!;
      const last = moves[moves.length - 1]!;
      const velocity = last.time > first.time ? (last.y - first.y) / (last.time - first.time) : 0;
      const momentum = Math.abs(velocity) > 0.3 ? velocity * 250 : 0;
      const steps = Math.round((offset + momentum) / itemPx);
      select(start.index - steps, Math.min(1000, 200 + Math.abs(momentum) * 1.5));
    };

    return () => {
      // 列表的偏移：选中的项在中间那一行
      const middle = ((visible - 1) / 2) * PICKER_ITEM_HEIGHT;
      const transform =
        drag === null
          ? `translateY(${middle - index * PICKER_ITEM_HEIGHT}em)`
          : `translateY(calc(${middle - start.index * PICKER_ITEM_HEIGHT}em + ${drag}px))`;
      return (
        <div
          {...mergeAttrs<'div'>({
            sx: pickerColumnStyles.column,
            style: { height: `${visible * PICKER_ITEM_HEIGHT}em` },
          })}
          role="listbox"
          aria-label={label}
          tabindex={0}
          onTouchstart={onTouchstart}
          onTouchmove={onTouchmove}
          onTouchend={onTouchend}
          onTouchcancel={onTouchend}
          onKeydown={(event: KeyboardEvent) => {
            const delta = { ArrowDown: 1, ArrowUp: -1 }[event.key];
            if (delta === undefined) return;
            event.preventDefault();
            // 方向键越过禁用的项往同一个方向找
            let next = index + delta;
            while (options[next]?.disabled) next += delta;
            if (options[next]) select(next, 200);
          }}
          // 小程序：收 touchmove，拖动期间页面不跟着滚
          {...dataAttrs({ 'data-touch-move': 'catch' })}
          ref={(node: unknown) => (column = node)}
        >
          <div
            {...mergeAttrs<'div'>({
              sx: pickerColumnStyles.list,
              style: { transform, transitionDuration: `${drag === null ? duration : 0}ms` },
            })}
          >
            {options.map((option, position) => (
              <div
                {...mergeAttrs<'div'>({ sx: pickerColumnStyles.item })}
                role="option"
                aria-selected={position === index ? 'true' : 'false'}
                aria-disabled={option.disabled ? 'true' : undefined}
                {...dataAttrs({ 'data-disabled': option.disabled })}
                onClick={() => !option.disabled && select(position, 200)}
              >
                {option.text}
              </div>
            ))}
          </div>
        </div>
      );
    };
  },
);
