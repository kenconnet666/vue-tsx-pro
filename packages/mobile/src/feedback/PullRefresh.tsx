/**
 * 下拉刷新：页面在顶部时往下拉，露出提示（下拉刷新 → 松手刷新 → 加载中），松手后调用 onRefresh。
 *
 *   <PullRefresh _refreshing={loading} onRefresh={reload}>
 *     <List … />
 *   </PullRefresh>
 *
 * onRefresh 返回 Promise 时自动在完成后收起；不返回时由使用方把 _refreshing 改回 false。
 * 只在页面滚到顶时接管下拉；拉动期间挡住页面自己的滚动与回弹（H5 取消 touchmove，小程序换成 catch）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount, watch, type VNodeChild } from 'vue';
import { useConfig } from '../config/context';
import { useHost } from '../utils/host';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { Loading } from './Loading';

/** 下拉的阶段 */
export interface PullRefreshStatuses {
  /** 没在拉 */
  normal: unknown;
  /** 拉了但还不够，松手会弹回 */
  pulling: unknown;
  /** 拉够了，松手就刷新 */
  loosing: unknown;
  /** 刷新中 */
  loading: unknown;
  /** 刷新完了，显示一会儿成功的提示 */
  success: unknown;
}

/** 下拉的阶段 */
export type PullRefreshStatus = keyof PullRefreshStatuses;

/** 未声明的属性落到根元素（div）上 */
export interface PullRefreshProps extends PartProps<'div'> {
  /** 是否在刷新；双向绑定写 `_refreshing={x}` */
  _refreshing?: boolean;
  /** 松手刷新；返回 Promise 时完成后自动收起 */
  onRefresh?: () => void | Promise<unknown>;
  /** 不能下拉 */
  disabled?: boolean;
  /**
   * 顶部提示区的高度（px），也是拉到多少算"拉够了"
   * @default 50
   */
  headHeight?: number;
  /** 各阶段的提示文字；不给时用语言包 */
  pullingText?: VNodeChild;
  loosingText?: VNodeChild;
  loadingText?: VNodeChild;
  /** 刷新完显示的文字；不给时直接收起 */
  successText?: VNodeChild;
  /**
   * 成功提示显示多久（ms）
   * @default 500
   */
  successDuration?: number;
  /** 自定义提示区的内容（代替各阶段的文字） */
  head?: (status: PullRefreshStatus, distance: number) => VNodeChild;
  /** 内容 */
  children?: VNodeChild;
  /** 提示区的部件属性 */
  propsHead?: PartProps<'div'>;
}

/** PullRefresh 的样式：root、track、dragging、head */
export const pullRefreshStyles = css.create({
  root: { overflow: 'hidden', userSelect: 'none' },
  track: {
    position: 'relative',
    transitionProperty: 'transform',
    transitionDuration: '_md',
    transitionTimingFunction: '_standard',
  },
  dragging: { transitionDuration: '0s' },
  head: {
    position: 'absolute',
    insetInline: 0,
    insetBlockEnd: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontSize: '_sm',
    color: '_textMuted',
  },
});

// 判定横竖的移动距离（px）
const LOCK_DISTANCE = 8;

/** 拉的手感：提示区高度以内跟手，再往下越拉越沉 */
function damp(dy: number, head: number) {
  if (dy <= head) return dy;
  if (dy <= head * 2) return head + (dy - head) / 2;
  return head * 1.5 + (dy - head * 2) / 4;
}

/** 下拉刷新（div > 滑动层：提示区 + 内容） */
export const PullRefresh = _component(
  ({
    _refreshing: refreshing = _bindable(false),
    onRefresh,
    disabled = false,
    headHeight = 50,
    pullingText,
    loosingText,
    loadingText,
    successText,
    successDuration = 500,
    head,
    children,
    propsHead,
    ...rest
  }: PullRefreshProps) => {
    const host = useHost();
    const config = useConfig();
    // 拉动中的距离（null 是没在拉）；刷新完的成功提示
    let drag = _state<number | null>(null);
    let pulling = _state(false);
    let succeeded = _state(false);
    let start = { x: 0, y: 0 };
    let direction: 'h' | 'v' | null = null;
    let tracking = false;
    let successTimer: ReturnType<typeof setTimeout> | undefined;

    const status = (): PullRefreshStatus => {
      if (refreshing) return 'loading';
      if (succeeded) return 'success';
      if (drag === null || drag === 0) return 'normal';
      return drag >= headHeight ? 'loosing' : 'pulling';
    };

    // 刷新结束：有成功提示时先停一会儿再收起
    watch(
      () => refreshing,
      (now, before) => {
        if (now || !before || successText === undefined) return;
        succeeded = true;
        clearTimeout(successTimer);
        successTimer = setTimeout(() => (succeeded = false), successDuration);
      },
    );
    onBeforeUnmount(() => clearTimeout(successTimer));

    const refresh = async () => {
      refreshing = true;
      const pending = onRefresh?.();
      if (!(pending instanceof Promise)) return;
      try {
        await pending;
      } finally {
        refreshing = false;
      }
    };

    const onTouchstart = (event: TouchEvent) => {
      // 只在页面滚到顶、没在刷新时接管
      tracking = !disabled && !refreshing && !succeeded && host.scrollTop() <= 0;
      if (!tracking) return;
      const touch = event.touches[0]!;
      start = { x: touch.clientX, y: touch.clientY };
      direction = null;
    };
    const onTouchmove = (event: TouchEvent) => {
      if (!tracking) return;
      const touch = event.touches[0]!;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!direction) {
        if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;
        direction = dy > 0 && dy > Math.abs(dx) ? 'v' : 'h';
        // 往上推、横滑：交给页面
        if (direction === 'h') return void (tracking = false);
        pulling = true;
      }
      // 挡住浏览器自己的下拉（刷新整页、回弹）
      if (event.cancelable) event.preventDefault();
      drag = damp(Math.max(0, dy), headHeight);
    };
    const onTouchend = () => {
      tracking = false;
      pulling = false;
      if (drag === null) return;
      const loosing = drag >= headHeight;
      drag = null;
      if (loosing) void refresh();
    };

    const text = (current: PullRefreshStatus): VNodeChild => {
      switch (current) {
        case 'pulling':
          return pullingText ?? config.lang.pulling;
        case 'loosing':
          return loosingText ?? config.lang.loosing;
        case 'loading':
          return <Loading>{loadingText ?? config.lang.refreshing}</Loading>;
        case 'success':
          return successText;
        default:
          return null;
      }
    };

    return () => {
      const current = status();
      const distance = drag ?? (current === 'loading' || current === 'success' ? headHeight : 0);
      return (
        <div
          {...mergeAttrs<'div'>({ sx: pullRefreshStyles.root }, rest, {
            onTouchstart,
            onTouchmove,
            onTouchend,
            onTouchcancel: onTouchend,
            ...dataAttrs({
              'data-status': current,
              // 小程序：收 touchmove；拉动期间 catch，页面不跟着滚
              'data-touch-move': pulling ? 'catch' : true,
            }),
          })}
        >
          <div
            {...mergeAttrs<'div'>({
              sx: [pullRefreshStyles.track, drag !== null && pullRefreshStyles.dragging],
              style: { transform: distance ? `translateY(${distance}px)` : 'none' },
            })}
          >
            <div
              {...mergeAttrs<'div'>(
                { sx: pullRefreshStyles.head, style: { height: `${headHeight}px` } },
                propsHead,
                {
                  'aria-live': 'polite',
                },
              )}
            >
              {head ? head(current, distance) : text(current)}
            </div>
            {children}
          </div>
        </div>
      );
    };
  },
);
