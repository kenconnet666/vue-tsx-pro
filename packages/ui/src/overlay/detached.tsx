/**
 * 命令式的对话框（useConfirm、useFormDialog）共用的挂载：对话框渲染到 body 末尾、组件树之外，
 * 沿用调用处的配置（主题、语言、默认值，经 ConfigScope）与应用上下文（全局组件）；关上后等离场过渡播完再卸载。
 *
 *   const mount = useDetachedDialog();          // setup 里
 *   mount((host) => <Dialog open={_bind(host.open)} onClose={host.closed}>…</Dialog>);
 */
import { _component } from '@vue-tsx-pro/tsx';
import { getCurrentInstance, h, render, type VNodeChild } from 'vue';
import { ConfigContext, useConfig } from '../config/context';
import { ConfigScope } from '../config/Provider';
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
