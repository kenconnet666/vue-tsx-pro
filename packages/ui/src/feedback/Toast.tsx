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
import { startMove } from '../utils/dom/move';
import { topModal } from '../utils/dom/overlay';
import { focusAfterRemoval } from '../utils/dom/focus';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import { afterTransitions } from '../utils/style/transitions';
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
  const toasts = shallowReactive<(ToastRecord & { closing: boolean })[]>([]);
  const timers = new Map<string, Timer>();
  let paused = false;

  const find = (id: string) => toasts.find((toast) => toast.id === id);

  function start(id: string, timer: Timer) {
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => controller.dismiss(id), timer.remaining);
  }

  function schedule(toast: ToastRecord) {
    clearTimeout(timers.get(toast.id)?.handle);
    timers.delete(toast.id);
    const duration = toast.loading ? Infinity : (toast.duration ?? defaultDuration);
    if (!Number.isFinite(duration)) return;
    const timer: Timer = { remaining: duration, startedAt: 0 };
    timers.set(toast.id, timer);
    if (!paused) start(toast.id, timer);
  }

  const resolve = <T,>(message: ToastMessage<T>, value: T) =>
    typeof message === 'function' ? message(value) : message;

  const controller: ToasterController = {
    toasts,
    show(options) {
      const id = `toast-${++nextId}`;
      toasts.push(shallowReactive({ ...options, id, closing: false }));
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
      if (paused) return;
      paused = true;
      for (const timer of timers.values()) {
        clearTimeout(timer.handle);
        timer.handle = undefined;
        timer.remaining -= Date.now() - timer.startedAt;
      }
    },
    resume() {
      if (!paused) return;
      paused = false;
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
  /** 列表（ol）的部件属性 */
  propsList?: PartProps<'ol', 'aria-live'>;
  /** 每一项（li）的部件属性 */
  propsItem?: PartProps<'li'> | ((toast: ToastRecord) => PartProps<'li'>);
  /** 每条通知（Alert）的部件属性 */
  propsToast?: Partial<AlertProps> | ((toast: ToastRecord) => Partial<AlertProps>);
}

const styles = stylex.create({
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
  // 间距放在每一项里：离场收起高度时间距一起收掉
  gap: { paddingBlock: '_xs' },
  toast: { boxShadow: '_lg' },
});

const placementStyles = stylex.create({
  'top-start': { top: 0, insetInlineStart: 0 },
  top: { top: 0, insetInline: 0, marginInline: 'auto' },
  'top-end': { top: 0, insetInlineEnd: 0 },
  'bottom-start': { bottom: 0, insetInlineStart: 0 },
  bottom: { bottom: 0, insetInline: 0, marginInline: 'auto' },
  'bottom-end': { bottom: 0, insetInlineEnd: 0 },
});

interface ToastItemProps {
  toast: ToastRecord;
  controller: ToasterController;
  fromTop: boolean;
  /** 最后一条被关闭时焦点回到这里 */
  fallbackFocus: () => HTMLElement | null;
  propsItem: ToasterProps['propsItem'];
  propsToast: ToasterProps['propsToast'];
}

/** 滑动超过宽度的这个比例就关闭 */
const SWIPE_RATIO = 0.35;

/** 列表里的一项：Collapse 负责离场时收起高度，收起后从控制器里移除 */
const ToastItem = _component(
  ({ toast, controller, fromTop, fallbackFocus, propsItem, propsToast }: ToastItemProps) => {
    let item = _state.raw<HTMLElement | null>(null);

    _effect(() => {
      if (!toast.closing || !item) return;
      let cancelled = false;
      void afterTransitions(item).then(() => {
        if (!cancelled) controller.remove(toast.id);
      });
      return () => (cancelled = true);
    });

    function close() {
      if (item) focusAfterRemoval(item, fallbackFocus());
      controller.dismiss(toast.id);
    }

    // 横向滑动关闭：拖动中直接写元素的样式（不触发渲染），松开时按距离决定关闭或弹回
    function onPointerdown(event: PointerEvent) {
      const element = item;
      if (!element || toast.closing) return;
      if ((event.target as Element).closest('button, a, input, textarea, select')) return;
      const width = element.getBoundingClientRect().width;
      startMove(event, {
        threshold: 4,
        onMove: ({ deltaX }) => {
          element.style.transition = 'none';
          element.style.translate = `${deltaX}px 0`;
          element.style.opacity = String(Math.max(0, 1 - Math.abs(deltaX) / width));
        },
        onEnd: ({ deltaX, moved, cancelled }) => {
          element.style.transition = '';
          if (moved && !cancelled && Math.abs(deltaX) > width * SWIPE_RATIO) {
            close();
            return;
          }
          element.style.translate = '';
          element.style.opacity = '';
        },
      });
    }

    return () => {
      const itemProps = typeof propsItem === 'function' ? propsItem(toast) : propsItem;
      const toastProps = typeof propsToast === 'function' ? propsToast(toast) : propsToast;
      return (
        <li
          {...elementProps(
            mergeProps<'li'>(
              {
                sx: [
                  styles.item,
                  fromTop ? styles.itemFromTop : styles.itemFromBottom,
                  toast.closing && styles.itemClosing,
                ],
              },
              itemProps,
              { ref: _toRef(item), onPointerdown },
            ),
          )}
          data-state={toast.closing ? 'closed' : 'open'}
        >
          <Collapse open={!toast.closing} propsContent={{ sx: styles.gap }}>
            <Alert
              {...mergePartProps<AlertProps>(
                {
                  variant: 'surface',
                  tone: toast.tone ?? 'neutral',
                  icon: toast.icon,
                  loading: toast.loading,
                  title: toast.title,
                  action: toast.action,
                  sx: styles.toast,
                },
                toastProps,
                { onClose: toast.closable === false ? undefined : close },
              )}
            >
              {toast.description}
            </Alert>
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
    propsList,
    propsItem,
    propsToast,
    ...rest
  }: ToasterProps) => {
    const lang = useLang();
    let region = _state.raw<HTMLElement | null>(null);
    let hovering = _state(false);
    let focused = _state(false);
    let hidden = _state(typeof document !== 'undefined' && document.hidden);
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
    // F8 跳到通知区域（同 Radix Toast）
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'F8' || !region || !controller.toasts.length) return;
      event.preventDefault();
      region.focus();
    };
    onMounted(() => {
      reopen();
      document.addEventListener('visibilitychange', onVisibility);
      document.addEventListener('keydown', onKeydown);
    });
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKeydown);
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
      return (
        <Teleport to={topModal() ?? 'body'}>
          <ConfigScope>
            <section
              {...elementProps(
                mergeProps<'section'>(
                  {
                    sx: [styles.region, placementStyles[placement]],
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
                ),
              )}
              data-placement={placement}
            >
              <ol
                {...elementProps(
                  mergeProps<'ol'>(
                    { sx: [styles.list, fromTop && styles.listFromTop] },
                    propsList,
                    {
                      'aria-live': 'polite',
                    },
                  ),
                )}
              >
                {visible.map((toast) => (
                  <ToastItem
                    key={toast.id}
                    toast={toast}
                    controller={controller}
                    fromTop={fromTop}
                    fallbackFocus={() => outsideFocus}
                    propsItem={propsItem}
                    propsToast={propsToast}
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
