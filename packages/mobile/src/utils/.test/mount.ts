// 测试用：把渲染函数挂到一个新的 div 上（H5 端），返回这个 div
import { createApp, defineComponent, type VNodeChild } from 'vue';

export function mount(render: () => VNodeChild): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  createApp(defineComponent(() => render)).mount(root);
  return root;
}
