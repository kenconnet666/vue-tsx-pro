// 测试用：把渲染函数挂到一个新的 div 上（H5 端），返回这个 div。每个用例结束后自动卸载并清空 body
// （命令式反馈的出口跟着应用活着，不卸载会在下一个用例里多渲染一份）
import { afterEach } from 'vitest';
import { createApp, defineComponent, type App, type VNodeChild } from 'vue';

const mounted: App[] = [];

afterEach(() => {
  for (const app of mounted.splice(0)) app.unmount();
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
});

export function mount(render: () => VNodeChild): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(defineComponent(() => render));
  app.mount(root);
  mounted.push(app);
  return root;
}
