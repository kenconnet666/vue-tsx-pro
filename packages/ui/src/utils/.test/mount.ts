// 组件测试的挂载工具：渲染到一个挂在 document 上的容器里，每个测试结束后自动卸载
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { afterEach } from 'vitest';
import { createApp, type App, type VNodeChild } from 'vue';

const mounted: { app: App; host: HTMLElement }[] = [];

afterEach(() => {
  for (const { app, host } of mounted.splice(0)) {
    app.unmount();
    host.remove();
  }
});

/** 渲染 node，返回容器；组件的根元素是 `host.firstElementChild` */
export function mount(node: () => VNodeChild): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(_component(() => node));
  app.mount(host);
  mounted.push({ app, host });
  return host;
}

/** element 是否带着 styles 的全部原子类（组件按状态加样式时用来断言） */
export function hasStyles(element: Element, styles: StyleXStyles): boolean {
  return stylex
    .props(styles)
    .className!.split(' ')
    .every((name) => element.classList.contains(name));
}

/** 共用播报区（utils/dom/announcer）里现在的文字；announce 稍后才写入，断言时用 vi.waitFor */
export function announced(politeness: 'polite' | 'assertive' = 'polite'): string {
  return document.querySelector(`[data-live-announcer="${politeness}"]`)?.textContent ?? '';
}
