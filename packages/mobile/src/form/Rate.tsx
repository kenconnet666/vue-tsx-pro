/**
 * 评分：一排星，点一颗或在上面滑动选分数，可以有半颗。只读时用来展示评分。
 *
 *   <Rate _value={score} />
 *   <Rate _value={4.5} allowHalf readonly />
 *   <Rate _value={mood} icon={Heart} tone="danger" count={3} />
 */
import { Star } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Icon, type IconData } from '../base/Icon';
import { useHost, type HostRect } from '../utils/host';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { useForm } from './context';

/** 未声明的属性落到根元素（div）上 */
export interface RateProps extends Omit<PartProps<'div', 'role' | 'tabindex'>, 'onChange'> {
  /** 分数；双向绑定写 `_value={x}` */
  _value?: number;
  /**
   * 几颗星
   * @default 5
   */
  count?: number;
  /** 可以选半颗 */
  allowHalf?: boolean;
  /** 只读：只展示 */
  readonly?: boolean;
  /** 禁用 */
  disabled?: boolean;
  /**
   * 图标
   * @default Star
   */
  icon?: IconData;
  /**
   * 选中部分的色调
   * @default 'warning'
   */
  tone?: 'warning' | 'danger' | 'accent';
  /** 分数变了 */
  onChange?: (value: number) => void;
  /** 每颗星的部件属性 */
  propsItem?: PartProps<'span'>;
}

/** Rate 的样式：root、item、void、各色调、half */
export const rateStyles = css.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25em',
    fontSize: '1.25em',
    verticalAlign: 'middle',
    userSelect: 'none',
    cursor: { default: 'pointer', '[data-readonly]': 'default', '[data-disabled]': 'not-allowed' },
    opacity: { default: 1, '[data-disabled]': '_disabled' },
  },
  item: { position: 'relative', display: 'inline-flex' },
  void: { color: '_fillActive' },
  warning: { color: '_warning' },
  danger: { color: '_danger' },
  accent: { color: '_accent' },
  // 半颗：选中色的星叠在上面，只露出左半
  half: {
    position: 'absolute',
    insetBlock: 0,
    insetInlineStart: 0,
    width: '50%',
    overflow: 'hidden',
  },
});

/** 评分（div[role=slider] > 各颗星） */
export const Rate = _component(
  ({
    _value: value = _bindable(0),
    count = 5,
    allowHalf = false,
    readonly = false,
    disabled,
    icon = Star,
    tone = 'warning',
    onChange,
    propsItem,
    ...rest
  }: RateProps) => {
    const host = useHost();
    const form = useForm();
    const items: unknown[] = [];
    let rects: (HostRect | null)[] = [];
    const isDisabled = () => disabled ?? form?.disabled ?? false;
    const interactive = () => !readonly && !form?.readonly && !isDisabled();
    const set = (next: number) => {
      if (next === value) return;
      value = next;
      onChange?.(next);
    };
    /** 横坐标落在哪颗星的哪一半：分数 */
    const scoreAt = (x: number) => {
      let score = 0;
      rects.forEach((rect, index) => {
        if (!rect || x < rect.left) return;
        const half = allowHalf && x < rect.left + rect.width / 2;
        score = half ? index + 0.5 : index + 1;
      });
      return score;
    };
    const measure = async () => {
      rects = await Promise.all(items.slice(0, count).map((item) => host.measure(item)));
    };
    const pointX = (event: Event) => {
      const touch = (event as TouchEvent).changedTouches?.[0];
      return touch ? touch.clientX : (event as MouseEvent).clientX;
    };

    return () => {
      const off = isDisabled();
      return (
        <div
          {...mergeAttrs<'div'>({ sx: [rateStyles.root, rateStyles[tone]] }, rest, {
            role: 'slider',
            tabindex: interactive() ? 0 : undefined,
            'aria-valuemin': 0,
            'aria-valuemax': count,
            'aria-valuenow': value,
            'aria-readonly': readonly ? 'true' : undefined,
            'aria-disabled': off ? 'true' : undefined,
            onTouchstart: () => interactive() && void measure(),
            onTouchmove: (event: TouchEvent) => {
              if (!interactive() || !rects.length) return;
              const score = scoreAt(pointX(event));
              // 滑到最左边也至少一颗：清零只能点同一颗（见 onClick）
              if (score > 0) set(score);
            },
            onClick: (event: Event) => {
              if (!interactive()) return;
              const x = pointX(event);
              const pick = () => {
                const score = scoreAt(x);
                // 再点一下当前的分数：清零
                set(score === value ? 0 : score);
                // 量到的位置只用这一次：页面滚动、布局变了下次重新量
                rects = [];
              };
              // 鼠标点的（没有按下时量过）：先量
              if (rects.length) pick();
              else void measure().then(pick);
            },
            onKeydown: (event: KeyboardEvent) => {
              if (!interactive()) return;
              const delta = allowHalf ? 0.5 : 1;
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
                set(Math.min(count, value + delta));
              else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
                set(Math.max(0, value - delta));
              else return;
              event.preventDefault();
            },
            ...dataAttrs({
              // 小程序：收 touchmove（在星上滑动选分数）
              'data-touch-move': interactive() || undefined,
              'data-readonly': readonly,
              'data-disabled': off,
            }),
          })}
        >
          {Array.from({ length: count }, (_, index) => {
            const fill = Math.min(1, Math.max(0, value - index));
            return (
              <span
                {...mergeAttrs<'span'>({ sx: rateStyles.item }, propsItem)}
                ref={(node: unknown) => (items[index] = node)}
              >
                <Icon icon={icon} filled sx={fill === 1 ? undefined : rateStyles.void} />
                {fill > 0 && fill < 1 && (
                  <span {...mergeAttrs<'span'>({ sx: rateStyles.half })}>
                    <Icon icon={icon} filled />
                  </span>
                )}
              </span>
            );
          })}
        </div>
      );
    };
  },
);
