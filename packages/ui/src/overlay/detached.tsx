/**
 * 命令式的对话框（useConfirm、useFormDialog、useDialog、useDrawer）共用的挂载：对话框渲染到 body 末尾、组件树之外，
 * 沿用调用处的配置（主题、语言、默认值，经 ConfigScope）与应用上下文（全局组件）；关上后等离场过渡播完再卸载。
 *
 *   const mount = useDetachedDialog();          // setup 里
 *   mount((host) => <Dialog open={_bind(host.open)} onClose={host.closed}>…</Dialog>);
 *
 * useDetachedOverlay 在它上面加一层句柄（close、update、closed），useDialog、useDrawer 用它。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { getCurrentInstance, h, render, shallowRef, type VNodeChild } from 'vue';
import { ConfigContext, useConfig } from '../config/context';
import { ConfigScope } from '../config/Provider';
import type { OpenChangeProps, OpenChangeReasons } from '../utils/dom/open-change';
import { afterTransitions } from '../utils/style/transitions';

/** 交给对话框内容的控制：开着没有、关上了 */
export interface DetachedDialogHost {
  /** 对话框开着：对话框写 open={_bind(host.open)}，改成 false 就关上 */
  open: boolean;
  /** 对话框关上了（原生 close 事件里调用）：等离场过渡播完卸载 */
  closed: () => void;
}

/** 在 setup 里调用，返回 mount(content)：把对话框渲染到组件树之外 */
export function useDetachedDialog(): (content: (host: DetachedDialogHost) => VNodeChild) => void {
  // 在 setup 里记下配置与应用上下文：对话框挂在组件树之外，要靠它们拿到主题、语言、全局组件
  const config = useConfig();
  const appContext = getCurrentInstance()?.appContext ?? null;

  return (content) => {
    const container = document.createElement('div');
    document.body.append(container);

    function unmount() {
      const dialog = container.querySelector('dialog');
      void (dialog ? afterTransitions(dialog) : Promise.resolve()).then(() => {
        render(null, container);
        container.remove();
      });
    }

    const Host = _component(
      () => {
        ConfigContext.provide(config);
        let open = _state(true);
        const host: DetachedDialogHost = {
          get open() {
            return open;
          },
          set open(value) {
            open = value;
          },
          closed: unmount,
        };
        return () => <ConfigScope>{content(host)}</ConfigScope>;
      },
      { name: 'DetachedDialog' },
    );

    const vnode = h(Host);
    vnode.appContext = appContext;
    render(vnode, container);
  };
}

/** 命令式浮层（useDialog、useDrawer）的选项：浮层的属性（open 由句柄管理），content 是正文 */
export type DetachedOverlayOptions<P> = Omit<P, 'open' | 'children'> & {
  /** 正文；给函数时拿到句柄，正文里的按钮可以自己关上、改标题 */
  content?: VNodeChild | ((handle: DetachedOverlayHandle<P>) => VNodeChild);
};

/** useDialog().open、useDrawer().open 返回的句柄；方法不依赖 this，可以直接传出去（onSaved={handle.close}） */
export interface DetachedOverlayHandle<P> {
  /** 关上（onOpenChange 的原因是 imperative）；已经关上时什么也不做 */
  readonly close: () => void;
  /** 改属性（标题、宽度、确认按钮的文字、正文……），没写的保持不变 */
  readonly update: (patch: Partial<DetachedOverlayOptions<P>>) => void;
  /** 关上之后 resolve，得到关上的原因：确认是 confirm，Esc、遮罩、关闭按钮、close() 各是 escape、outside、close、imperative */
  readonly closed: Promise<keyof OpenChangeReasons>;
}

/** 原生 dialog 的 close 事件 */
type DialogCloseEvent = Event & { currentTarget: HTMLDialogElement };

/** 浮层要支持的：onOpenChange 报告原因，onClose 落到原生 dialog 上 */
interface DetachedOverlayProps extends OpenChangeProps {
  onClose?: (event: DialogCloseEvent) => void;
}

/**
 * 命令式浮层：在 setup 里调用，返回 open(options)。renderOverlay 把属性、开关与正文交给具体的浮层（Dialog、Drawer）：
 *
 *   useDetachedOverlay<DialogProps>((props, host, children) => <Dialog {...props} open={_bind(host.open)}>{children}</Dialog>);
 */
export function useDetachedOverlay<P extends DetachedOverlayProps>(
  renderOverlay: (
    props: Omit<P, 'open' | 'children'>,
    host: DetachedDialogHost,
    children: VNodeChild,
  ) => VNodeChild,
): (options: DetachedOverlayOptions<P>) => DetachedOverlayHandle<P> {
  const mount = useDetachedDialog();
  return (options) => {
    const state = shallowRef(options);
    let host: DetachedDialogHost | undefined;
    let reason: keyof OpenChangeReasons = 'imperative';
    let resolveClosed!: (reason: keyof OpenChangeReasons) => void;
    const handle: DetachedOverlayHandle<P> = {
      close: () => {
        if (!host?.open) return;
        reason = 'imperative';
        host.open = false;
        state.value.onOpenChange?.(false, { reason });
      },
      update: (patch) => {
        state.value = { ...state.value, ...patch };
      },
      closed: new Promise((resolve) => (resolveClosed = resolve)),
    };
    mount((current) => {
      host = current;
      const { content, onOpenChange, onClose, ...props } = state.value;
      const overlayProps = {
        ...props,
        onOpenChange: (open, details) => {
          if (!open) reason = details.reason;
          onOpenChange?.(open, details);
        },
        onClose: (event: DialogCloseEvent) => {
          onClose?.(event);
          // 原生 close 事件先到这里、后到浮层自己（它在那里报告原因）：等它报告完再 resolve
          queueMicrotask(() => resolveClosed(reason));
          current.closed();
        },
      } as Omit<P, 'open' | 'children'> & DetachedOverlayProps;
      return renderOverlay(
        overlayProps,
        current,
        typeof content === 'function' ? content(handle) : content,
      );
    });
    options.onOpenChange?.(true, { reason: 'imperative' });
    return handle;
  };
}
