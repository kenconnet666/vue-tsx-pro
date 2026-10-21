/**
 * 悬停浮层的开关时机（Tooltip、HoverCard 共用）：指针停留 delay 后打开，离开 closeDelay 后关闭（可以移到浮层上），
 * 键盘聚焦（:focus-visible）立即打开，按下触发器、失焦时关闭，触屏不打开（没有悬停）。
 * 同一组（createHoverGroup）里同一时间只开一个；刚关掉一个（skipDelay 内）时下一个直接打开，在一排触发器上移动不用每次等。
 *
 *   const tooltips = createHoverGroup();              // 模块级：所有 Tooltip 一组
 *   const hover = useHoverIntent(tooltips, () => ({ delay, closeDelay: 100, disabled }), (next) => (open = next));
 *   trigger({ ...hover.trigger }) / <div {...hover.panel}>
 *   hover.opened() / hover.closed()                   // 浮层真的显示、隐藏时告诉组（关掉同组的另一个、记下关闭时间）
 */
import { onScopeDispose } from 'vue';

/** 一组悬停浮层共用的状态：正在显示的那个与上次关闭的时间 */
export interface HoverGroup {
  /** 正在显示的那个（同一时间只显示一个） */
  shown: { close: () => void } | undefined;
  /** 上次关闭的时间（毫秒时间戳） */
  lastClosed: number;
  /** 刚关掉一个后多久之内，下一个直接打开（毫秒） */
  readonly skipDelay: number;
}

/** 新建一组悬停浮层；skipDelay 默认 300（同 Radix 的 skipDelayDuration） */
export function createHoverGroup(skipDelay = 300): HoverGroup {
  return { shown: undefined, lastClosed: 0, skipDelay };
}

/** useHoverIntent 每次读取的选项 */
export interface HoverIntentOptions {
  /** 指针停留多久后打开（毫秒） */
  delay: number;
  /** 指针离开多久后关闭（毫秒）：留出移到浮层上的时间 */
  closeDelay: number;
  /** 不打开 */
  disabled?: boolean;
}

/** useHoverIntent 的返回值 */
export interface HoverIntent {
  /** 展开到触发器上的事件 */
  readonly trigger: {
    onPointerenter: (event: PointerEvent) => void;
    onPointerleave: () => void;
    onPointerdown: () => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: () => void;
  };
  /** 展开到浮层上的事件：指针移到浮层上不关闭，离开浮层后再关闭 */
  readonly panel: {
    onPointerenter: () => void;
    onPointerleave: () => void;
  };
  /** 立即关闭（Esc） */
  closeNow(): void;
  /** 浮层显示了：关掉同组正显示的另一个 */
  opened(): void;
  /** 浮层隐藏了：记下时间，供下一个跳过延迟 */
  closed(): void;
}

/** 悬停、聚焦打开的时机（在 setup 里调用）；setOpen 写组件的 open */
export function useHoverIntent(
  group: HoverGroup,
  read: () => HoverIntentOptions,
  setOpen: (open: boolean) => void,
): HoverIntent {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let visible = false;
  const self = { close: () => setOpen(false) };

  function schedule(next: boolean, wait: number) {
    clearTimeout(timer);
    if (wait <= 0) setOpen(next);
    else timer = setTimeout(() => setOpen(next), wait);
  }
  const warm = () => group.shown != null || Date.now() - group.lastClosed < group.skipDelay;
  const closeSoon = () => schedule(false, read().closeDelay);
  const closeNow = () => schedule(false, 0);

  onScopeDispose(() => {
    clearTimeout(timer);
    if (group.shown === self) group.shown = undefined;
  });

  return {
    trigger: {
      onPointerenter(event) {
        if (read().disabled || event.pointerType === 'touch') return;
        schedule(true, warm() ? 0 : read().delay);
      },
      onPointerleave: closeSoon,
      onPointerdown: closeNow,
      onFocus(event) {
        if (read().disabled) return;
        // 只在键盘聚焦时打开；点击聚焦（按钮被按下）时不打开
        if ((event.target as Element).matches(':focus-visible')) schedule(true, 0);
      },
      onBlur: closeNow,
    },
    panel: {
      onPointerenter: () => clearTimeout(timer),
      onPointerleave: closeSoon,
    },
    closeNow,
    opened() {
      visible = true;
      if (group.shown !== self) group.shown?.close();
      group.shown = self;
    },
    closed() {
      if (visible) group.lastClosed = Date.now();
      visible = false;
      if (group.shown === self) group.shown = undefined;
    },
  };
}
