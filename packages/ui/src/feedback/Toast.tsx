/**
 * 通知（toast）：操作结果的短暂提示，几秒后自动消失。控制器 + 显示区域（参考 Sonner、Radix Toast、React Aria Toast）：
 *
 *   // toaster.ts：应用里创建一次，组件内外（请求拦截器、store）都能导入使用
 *   export const toaster = createToaster();
 *   // App：放一个显示区域
 *   <Toaster controller={toaster} placement="bottom-end" />
 *   // 任意位置
 *   toaster.show({ tone: 'success', title: '已保存' });
 *   const id = toaster.show({ title: '已删除', action: <Button onClick={() => undo(id)}>撤销</Button> });
 *   await toaster.promise(upload(file), { loading: { title: '正在上传' }, success: { title: '上传完成' }, error: (e) => ({ title: String(e) }) });
 *
 * 控制器是普通对象，不经 Provider 注入（COMPONENTS.md §1 的“命令式能力”），所以组件外也能用。
 *
 * - 每条通知就是 Alert（surface 外观加阴影），图标、标题、正文、操作、关闭按钮都复用它；加载中用 Alert 的 loading。
 * - 计时：默认 5 秒；指针在区域上、焦点在区域里、页面切到后台时暂停；加载中的、duration 为 Infinity 的不自动消失。
 * - 无障碍：区域是带名称的 landmark（section），F8 跳到通知区域；列表 aria-live="polite"，新通知被读屏念出。
 *   关闭一条后焦点交给相邻的通知，没有时回到进入通知区域之前的位置。
 * - 区域传送到 body（或最上层的模态里），用 ConfigScope 带上当前的主题与语言。
 * - 顶层：区域是 popover="manual"，显示在页面之上；模态打开时外面的元素都是 inert 的（顶层也不例外），
 *   所以这时区域移进最上层的模态 dialog 里（topModal），通知里的按钮仍可点击、可 Tab 到。
 * - 动画：进场淡入并从边缘移入（@starting-style），离场时高度收起（复用 Collapse）后从列表移除。
 * - 横向滑动（触摸、鼠标拖动）超过宽度的 35% 就关闭，否则弹回（startMove；同 Sonner、Radix Toast 的滑动关闭）。
 */
import { utils } from 'animejs';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowReactive,
  Teleport,
  watch,
  type VNodeChild,
} from 'vue';
import type { IconData } from '../base/Icon';
import { useLang } from '../config/context';
import { ConfigScope } from '../config/Provider';
import { Collapse } from '../display/Collapse';
import { useAnimate } from '../utils/motion/animation';
import { useLayoutAnimation } from '../utils/motion/layout';
import { usePresence } from '../utils/motion/presence';
import { startMove } from '../utils/dom/move';
import { toElement, topModal } from '../utils/dom/overlay';
import { useHotkeys, type HotkeyMap } from '../utils/dom/hotkeys';
import { focusAfterRemoval } from '../utils/dom/focus';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import { Alert, type AlertProps } from './Alert';

/** 一条通知的内容与行为 */
export interface ToastOptions {
  /** 标题（加粗的第一行） */
  title?: VNodeChild;
  /** 正文 */
  description?: VNodeChild;
  /** 色调，默认 neutral */
  tone?: StatusTone;
  /** 图标；不写时按色调选，false 不显示 */
  icon?: IconData | false;
  /** 进行中：图标换成加载指示，不自动消失 */
  loading?: boolean;
  /** 右侧的操作（如“撤销”按钮） */
  action?: VNodeChild;
  /** 显示关闭按钮，默认 true */
  closable?: boolean;
  /** 显示多久（毫秒）后自动消失；Infinity 不自动消失；不写时用 createToaster 的默认值 */
  duration?: number;
}

/** 列表里的一条通知 */
export interface ToastRecord extends ToastOptions {
  /** show 返回的编号 */
  readonly id: string;
  /** 正在离场（已关闭，等离场过渡结束后移除） */
  readonly closing: boolean;
  /** 本轮自动关闭的计时：总时长（毫秒）与编号（重新计时时换一个）；不自动关闭（加载中、Infinity）时为 null */
  readonly countdown: { readonly duration: number; readonly id: number } | null;
}

/** promise 各阶段的通知：固定内容，或由结果算出 */
export type ToastMessage<T> = ToastOptions | ((value: T) => ToastOptions);

/** toaster.promise 的三个阶段 */
export interface ToastPromiseMessages<T> {
  /** 进行中（自动带上 loading） */
  loading: ToastOptions;
  /** 成功，默认色调 success */
  success: ToastMessage<T>;
  /** 失败，默认色调 danger */
  error: ToastMessage<unknown>;
}

/** createToaster 的选项 */
export interface ToasterOptions {
  /** 默认显示时长（毫秒），默认 5000 */
  duration?: number;
}

/** 通知控制器：createToaster() 创建，交给 <Toaster controller>，在任何地方调用 */
export interface ToasterController {
  /** 当前的通知，旧的在前 */
  readonly toasts: readonly ToastRecord[];
  /** 计时是否暂停（悬停、聚焦、页面隐藏时） */
  readonly paused: boolean;
  /** 显示一条通知，返回它的编号 */
  show(options: ToastOptions): string;
  /** 改一条通知的内容（如加载完成）；计时按新的 duration 重新开始 */
  update(id: string, options: ToastOptions): void;
  /** 关闭一条通知；不给编号时关闭全部 */
  dismiss(id?: string): void;
  /** 进行中 → 成功 / 失败：同一条通知依次更新；返回原 Promise 的结果（失败时照样抛出） */
  promise<T>(promise: Promise<T>, messages: ToastPromiseMessages<T>): Promise<T>;
  /** 暂停 / 继续所有通知的计时：Toaster 在悬停、聚焦、页面隐藏时调用 */
  pause(): void;
  /** 继续计时，见 pause */
  resume(): void;
  /** 从列表里移除（Toaster 在离场过渡结束后调用；直接调用则没有离场动画） */
  remove(id: string): void;
}

/** 控制器内部可写的通知记录 */
type MutableToast = { -readonly [K in keyof ToastRecord]: ToastRecord[K] };

interface Timer {
  remaining: number;
  startedAt: number;
  handle?: ReturnType<typeof setTimeout>;
}

let nextId = 0;

/** 创建通知控制器 */
export function createToaster({
  duration: defaultDuration = 5000,
}: ToasterOptions = {}): ToasterController {
  // 浅层响应：列表增删与每条通知的字段变化会触发渲染；内容是 VNode，不需要（也不该）深层代理
  const toasts = shallowReactive<MutableToast[]>([]);
  const timers = new Map<string, Timer>();
  const state = shallowReactive({ paused: false });
  let countdowns = 0;

  const find = (id: string) => toasts.find((toast) => toast.id === id);

  function start(id: string, timer: Timer) {
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => controller.dismiss(id), timer.remaining);
  }

  function schedule(toast: MutableToast) {
    clearTimeout(timers.get(toast.id)?.handle);
    timers.delete(toast.id);
    const duration = toast.loading ? Infinity : (toast.duration ?? defaultDuration);
    toast.countdown = Number.isFinite(duration) ? { duration, id: ++countdowns } : null;
    if (!toast.countdown) return;
    const timer: Timer = { remaining: duration, startedAt: 0 };
    timers.set(toast.id, timer);
    if (!state.paused) start(toast.id, timer);
  }

  const resolve = <T,>(message: ToastMessage<T>, value: T) =>
    typeof message === 'function' ? message(value) : message;

  const controller: ToasterController = {
    toasts,
    get paused() {
      return state.paused;
    },
    show(options) {
      const id = `toast-${++nextId}`;
      toasts.push(shallowReactive({ ...options, id, closing: false, countdown: null }));
      schedule(find(id)!);
      return id;
    },
    update(id, options) {
      const toast = find(id);
      if (!toast || toast.closing) return;
      Object.assign(toast, options);
      schedule(toast);
    },
    dismiss(id) {
      for (const toast of id == null ? toasts : [find(id)]) {
        if (!toast || toast.closing) continue;
        toast.closing = true;
        toast.countdown = null;
        clearTimeout(timers.get(toast.id)?.handle);
        timers.delete(toast.id);
      }
    },
    async promise(promise, { loading, success, error }) {
      const id = controller.show({ closable: false, ...loading, loading: true });
      try {
        const value = await promise;
        controller.update(id, {
          tone: 'success',
          closable: true,
          ...resolve(success, value),
          loading: false,
        });
        return value;
      } catch (reason) {
        controller.update(id, {
          tone: 'danger',
          closable: true,
          ...resolve(error, reason),
          loading: false,
        });
        throw reason;
      }
    },
    pause() {
      if (state.paused) return;
      state.paused = true;
      for (const timer of timers.values()) {
        clearTimeout(timer.handle);
        timer.handle = undefined;
        timer.remaining -= Date.now() - timer.startedAt;
      }
    },
    resume() {
      if (!state.paused) return;
      state.paused = false;
      for (const [id, timer] of timers) start(id, timer);
    },
    remove(id) {
      const index = toasts.findIndex((toast) => toast.id === id);
      if (index >= 0) toasts.splice(index, 1);
      clearTimeout(timers.get(id)?.handle);
      timers.delete(id);
    },
  };
  return controller;
}

/** 通知显示在视口的哪个位置 */
export interface ToastPlacements {
  /** 左上（从右到左排版时右上） */
  'top-start': unknown;
  /** 顶部居中 */
  top: unknown;
  /** 右上（从右到左排版时左上） */
  'top-end': unknown;
  /** 左下（从右到左排版时右下） */
  'bottom-start': unknown;
  /** 底部居中 */
  bottom: unknown;
  /** 右下（默认；从右到左排版时左下） */
  'bottom-end': unknown;
}

/** 未声明的属性落到区域（section）上；aria-label 默认取语言包（通知） */
export interface ToasterProps extends PartProps<'section', 'popover' | 'tabindex'> {
  /** createToaster() 创建的控制器 */
  controller: ToasterController;
  /** 显示位置，默认 bottom-end */
  placement?: keyof ToastPlacements;
  /** 最多同时显示几条，默认 3；更早的先不显示，前面的关闭后补上 */
  max?: number;
  /** 叠成一摞（同 Sonner）：只露出最新的一条，更早的缩小叠在后面；悬停或聚焦时展开，展开收起有布局动画。默认 false（平铺） */
  stack?: boolean;
  /** 在自动关闭的通知底部显示剩余时间条（暂停计时时一起停），默认 false */
  progress?: boolean;
  /** 列表（ol）的部件属性 */
  propsList?: PartProps<'ol', 'aria-live'>;
  /** 每一项（li）的部件属性 */
  propsItem?: PartProps<'li'> | ((toast: ToastRecord) => PartProps<'li'>);
  /** 每条通知（Alert）的部件属性 */
  propsToast?: Partial<AlertProps> | ((toast: ToastRecord) => Partial<AlertProps>);
  /** 剩余时间条的部件属性 */
  propsProgress?: PartProps<'span'>;
}

const countdown = stylex.keyframes({
  from: { transform: 'scaleX(1)' },
  to: { transform: 'scaleX(0)' },
});

/** Toaster 的样式：region、list、listFromTop、item、itemFromBottom、itemFromTop 等 */
export const toastStyles = stylex.create({
  region: {
    // 原生 popover 默认居中、带边框与底色，改为贴着视口的一角
    position: 'fixed',
    inset: 'auto',
    margin: 0,
    padding: '_lg',
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
    boxSizing: 'border-box',
    width: 'min(26em, 100vw)',
    maxHeight: '100dvh',
    // 区域本身不挡住下面页面的点击，只有通知能点
    pointerEvents: 'none',
    outlineStyle: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  // 新通知靠近所在的边缘：在顶部时最新的在最上面
  listFromTop: { flexDirection: 'column-reverse' },
  item: {
    pointerEvents: 'auto',
    // 纵向仍可滚动页面，横向交给滑动关闭
    touchAction: 'pan-y',
    opacity: { default: 1, '@starting-style': 0 },
    transition: 'opacity _durations.md _easings.enter, translate _durations.md _easings.enter',
  },
  itemFromBottom: { translate: { default: 'none', '@starting-style': '0 0.75em' } },
  itemFromTop: { translate: { default: 'none', '@starting-style': '0 -0.75em' } },
  itemClosing: {
    opacity: 0,
    transition: 'opacity _durations.sm _easings.exit',
  },
  // 间距放在每一项里：离场收起高度时间距一起收掉；剩余时间条按它定位
  gap: { position: 'relative', paddingBlock: '_xs' },
  toast: { boxShadow: '_lg' },
  // 贴着通知底边的细条，从满到空；时长是这条通知的计时（不是主题时长），由动态样式给出
  countdown: {
    position: 'absolute',
    insetInline: '_md',
    bottom: 'calc(_space.xs + _borderWidths.xs)',
    height: '_borderWidths.sm',
    borderRadius: '_full',
    backgroundColor: 'color-mix(in srgb, _textMuted 50%, transparent)',
    transformOrigin: { default: 'left', ':dir(rtl)': 'right' },
    animationName: countdown,
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
    pointerEvents: 'none',
  },
  countdownPaused: { animationPlayState: 'paused' },
  // 叠放：每一项都定位、按深度排层叠顺序；最新的一条留在文档流里撑起高度，更早的绝对定位叠在它后面
  stacked: {
    position: 'relative',
    transition:
      'opacity _durations.md _easings.standard, translate _durations.md _easings.standard, scale _durations.md _easings.standard',
  },
  stackedBehind: { position: 'absolute', insetInline: 0 },
  stackedHidden: { opacity: 0 },
  stackedFromTop: { top: 0 },
  stackedFromBottom: { bottom: 0 },
});

// 深度是运行时的数，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Toaster 的样式：叠放时第 depth 层（0 是最新的）的位移、缩放与层叠顺序 */
export const toastStackStyles = stylex.create({
  depth: (offset: string, scale: number, zIndex: number) => ({ translate: offset, scale, zIndex }),
});

// 时长来自每条通知，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Toaster 的样式：剩余时间条的时长 */
export const toastCountdownStyles = stylex.create({
  duration: (ms: string) => ({ animationDuration: ms }),
});

/** Toaster 的样式：top-start、top、top-end、bottom-start、bottom、bottom-end */
export const toastPlacementStyles = stylex.create({
  'top-start': { top: 0, insetInlineStart: 0 },
  top: { top: 0, insetInline: 0, marginInline: 'auto' },
  'top-end': { top: 0, insetInlineEnd: 0 },
  'bottom-start': { bottom: 0, insetInlineStart: 0 },
  bottom: { bottom: 0, insetInline: 0, marginInline: 'auto' },
  'bottom-end': { bottom: 0, insetInlineEnd: 0 },
});

/** Toaster 里每条通知的 props */
export interface ToastItemProps {
  /** 这条通知 */
  toast: ToastRecord;
  /** 所属的通知器：关闭、暂停计时 */
  controller: ToasterController;
  /** Toaster 在顶部：进场从上方滑入 */
  fromTop: boolean;
  /** 最后一条被关闭时焦点回到这里 */
  fallbackFocus: () => HTMLElement | null;
  /** 每条通知外层（li）的部件属性 */
  propsItem: ToasterProps['propsItem'];
  /** 通知本身（Alert）的部件属性 */
  propsToast: ToasterProps['propsToast'];
  /** 叠放时的深度（0 是最新的一条）；平铺或展开时为 null */
  depth: number | null;
  /** 显示剩余时间条 */
  progress: boolean;
  /** 剩余时间条的部件属性 */
  propsProgress: ToasterProps['propsProgress'];
}

/** 滑动超过宽度的这个比例就关闭 */
const SWIPE_RATIO = 0.35;

/** 叠放的一层：每深一层错开 0.75em、缩小 5%，第三层之后隐藏 */
function stackSx(depth: number, fromTop: boolean) {
  const offset = `0 ${(fromTop ? 0.75 : -0.75) * depth}em`;
  return [
    toastStyles.stacked,
    depth > 0 && [
      toastStyles.stackedBehind,
      fromTop ? toastStyles.stackedFromTop : toastStyles.stackedFromBottom,
    ],
    toastStackStyles.depth(offset, 1 - depth * 0.05, 100 - depth),
    depth > 2 && toastStyles.stackedHidden,
  ];
}

/** 列表里的一项：Collapse 负责离场时收起高度，收起后从控制器里移除 */
export const ToastItem = _component(
  ({
    toast,
    controller,
    fromTop,
    fallbackFocus,
    depth,
    progress,
    propsItem,
    propsToast,
    propsProgress,
  }: ToastItemProps) => {
    let item: HTMLElement | null = null;
    const animate = useAnimate();

    const presence = usePresence(() => !toast.closing, {
      onExited: () => controller.remove(toast.id),
    });

    function close() {
      if (item) focusAfterRemoval(item, fallbackFocus());
      controller.dismiss(toast.id);
    }

    // 横向滑动关闭：拖动中直接写元素的样式（不触发渲染）。松开时过了阈值就沿滑动方向滑出再关闭，
    // 不够就用弹簧弹回（Anime.js，时长取主题；减少动态效果时立即到位）
    function onPointerdown(event: PointerEvent) {
      const element = item;
      if (!element || toast.closing) return;
      if ((event.target as Element).closest('button, a, input, textarea, select')) return;
      const width = element.getBoundingClientRect().width;
      startMove(event, {
        threshold: 4,
        onMove: ({ deltaX }) => {
          // 拖动中跟手：去掉进出场的 CSS 过渡，不然每一帧都在追赶
          element.style.transition = 'none';
          void utils.set(element, {
            x: deltaX,
            opacity: Math.max(0, 1 - Math.abs(deltaX) / width),
          });
        },
        onEnd: ({ deltaX, moved, cancelled }) => {
          // 弹回后去掉内联样式：之后的离场淡出要靠 CSS 的 opacity
          const settled = () => {
            element.style.transition = '';
            element.style.removeProperty('transform');
            element.style.removeProperty('opacity');
          };
          if (moved && !cancelled && Math.abs(deltaX) > width * SWIPE_RATIO) {
            const out = { x: Math.sign(deltaX) * width, opacity: 0 };
            void animate(element, out, { duration: 'sm', ease: 'exit' }).then(() => {
              close();
              element.style.transition = '';
            });
            return;
          }
          void animate(element, { x: 0, opacity: 1 }, { bounce: 0.35 }).then(settled);
        },
      });
    }

    return () => {
      const itemProps = typeof propsItem === 'function' ? propsItem(toast) : propsItem;
      const toastProps = typeof propsToast === 'function' ? propsToast(toast) : propsToast;
      return (
        <li
          {...mergeAttrs<'li'>(
            {
              sx: [
                toastStyles.item,
                fromTop ? toastStyles.itemFromTop : toastStyles.itemFromBottom,
                depth != null && stackSx(depth, fromTop),
                toast.closing && toastStyles.itemClosing,
              ],
            },
            itemProps,
            {
              ref: (element: unknown) => {
                item = toElement(element);
                presence.ref(element);
              },
              onPointerdown,
            },
          )}
          data-state={presence.state}
        >
          <Collapse open={!toast.closing} propsContent={{ sx: toastStyles.gap }}>
            <Alert
              {...mergePartProps<AlertProps>(
                {
                  variant: 'surface',
                  tone: toast.tone ?? 'neutral',
                  icon: toast.icon,
                  loading: toast.loading,
                  title: toast.title,
                  action: toast.action,
                  sx: toastStyles.toast,
                },
                toastProps,
                { onClose: toast.closable === false ? undefined : close },
              )}
            >
              {toast.description}
            </Alert>
            {progress && toast.countdown && (
              <span
                key={toast.countdown.id}
                {...mergeAttrs<'span'>({ sx: toastStyles.countdown }, propsProgress, {
                  sx: [
                    toastCountdownStyles.duration(`${toast.countdown.duration}ms`),
                    controller.paused && toastStyles.countdownPaused,
                  ],
                  'aria-hidden': true,
                })}
              />
            )}
          </Collapse>
        </li>
      );
    };
  },
  { name: 'ToastItem' },
);

/** 通知的显示区域：放一个即可；模态打开时自动移进最上层的模态 */
export const Toaster = _component(
  ({
    controller,
    placement = 'bottom-end',
    max = 3,
    stack = false,
    progress = false,
    propsList,
    propsItem,
    propsToast,
    propsProgress,
    ...rest
  }: ToasterProps) => {
    const lang = useLang();
    let region = _state.raw<HTMLElement | null>(null);
    let hovering = _state(false);
    let focused = _state(false);
    let hidden = _state(typeof document !== 'undefined' && document.hidden);
    // 叠放时悬停或聚焦就展开；展开、收起时各项从旧位置平移过去
    let list = _state.raw<HTMLElement | null>(null);
    let expanded = _state(false);
    const layout = useLayoutAnimation(() => list, { children: ':scope > li' });
    watch(
      () => hovering || focused,
      (next) => {
        if (stack) void layout.change(() => (expanded = next));
        else expanded = next;
      },
    );
    // 进入通知区域之前焦点所在的元素：最后一条通知被关闭后焦点回到这里
    let outsideFocus: HTMLElement | null = null;

    _effect(() => {
      if (hovering || focused || hidden) controller.pause();
      else controller.resume();
    });

    // 移动到别的父元素（Teleport 换目标）时浏览器会关掉 popover，移完重新打开
    const reopen = () => {
      if (region?.isConnected && !region.matches(':popover-open')) region.showPopover();
    };
    watch(topModal, () => void nextTick(reopen));

    const onVisibility = () => (hidden = document.hidden);
    // F8 跳到通知区域（同 Radix Toast）；输入框里也能用
    const noHotkeys: HotkeyMap = {};
    useHotkeys(
      () => (region && controller.toasts.length ? { F8: () => region?.focus() } : noHotkeys),
      { inInputs: true },
    );
    onMounted(() => {
      reopen();
      document.addEventListener('visibilitychange', onVisibility);
    });
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      controller.resume();
    });

    function onFocusin(event: FocusEvent) {
      focused = true;
      const from = event.relatedTarget;
      if (from instanceof HTMLElement && !region?.contains(from)) outsideFocus = from;
    }
    function onFocusout(event: FocusEvent) {
      const to = event.relatedTarget;
      if (!(to instanceof Node && region?.contains(to))) focused = false;
    }

    return () => {
      const fromTop = placement.startsWith('top');
      const visible = controller.toasts.slice(-max);
      // 深度只数还在显示的：正在离场的不占一层
      let depth = visible.filter((toast) => !toast.closing).length;
      const depths = visible.map((toast) => (toast.closing ? depth : --depth));
      const stacked = stack && !expanded;
      return (
        <Teleport to={topModal() ?? 'body'}>
          <ConfigScope>
            <section
              {...mergeAttrs<'section'>(
                {
                  sx: [toastStyles.region, toastPlacementStyles[placement]],
                  'aria-label': lang.toasterLabel,
                },
                rest,
                {
                  ref: _toRef(region),
                  popover: 'manual',
                  tabindex: -1,
                  onPointerenter: () => (hovering = true),
                  onPointerleave: () => (hovering = false),
                  onFocusin,
                  onFocusout,
                },
              )}
              data-placement={placement}
              data-expanded={stack ? String(!stacked) : undefined}
            >
              <ol
                {...mergeAttrs<'ol'>(
                  { sx: [toastStyles.list, fromTop && toastStyles.listFromTop] },
                  propsList,
                  {
                    ref: _toRef(list),
                    'aria-live': 'polite',
                  },
                )}
              >
                {visible.map((toast, index) => (
                  <ToastItem
                    key={toast.id}
                    depth={stacked ? depths[index]! : null}
                    toast={toast}
                    controller={controller}
                    fromTop={fromTop}
                    fallbackFocus={() => outsideFocus}
                    propsItem={propsItem}
                    propsToast={propsToast}
                    progress={progress}
                    propsProgress={propsProgress}
                  />
                ))}
              </ol>
            </section>
          </ConfigScope>
        </Teleport>
      );
    };
  },
);
