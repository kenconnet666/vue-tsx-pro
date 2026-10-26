// 示例测试的挂载工具：和文档站一样装上 createUi，渲染到挂在 document 上的容器里，每个测试结束后自动卸载
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { createUi } from '@zerodep-dev/vue-tsx-pro-ui';
import { afterEach } from 'vitest';
import { createApp, h, type App, type Component } from 'vue';

const mounted: { app: App; host: HTMLElement }[] = [];

afterEach(() => {
  for (const { app, host } of mounted.splice(0)) {
    app.unmount();
    host.remove();
  }
});

/** 渲染一个示例（或任意组件），返回容器 */
export function mount(component: Component): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(_component(() => () => h(component))).use(createUi());
  app.mount(host);
  mounted.push({ app, host });
  return host;
}
