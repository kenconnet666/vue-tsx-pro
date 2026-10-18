// 宿主集成：TSX 页面挂在普通 Vue 项目的路由下，共享 store 与 inject
import { afterEach, expect, it } from 'vitest';
import { nextTick, type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let mounted: App | undefined;
afterEach(() => mounted?.unmount());

async function open(path: string) {
  const { app, router } = createHostApp(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  const el = document.createElement('div');
  app.mount(el);
  mounted = app;
  return { el, router };
}

const text = (el: Element, selector: string) => el.querySelector(selector)?.textContent;

it('TSX 页面作为路由组件渲染，读取路由参数与宿主 provide 的值', async () => {
  const { el } = await open('/profile/42');
  expect(text(el, 'h1')).toBe('用户 42');
  expect(text(el, '.site-name')).toBe('Host Demo');
  expect(el.querySelector('.profile')!.className).not.toBe('profile'); // StyleX 类名已合并
  expect(text(el, '.greeting')).toBe('你好，Ada');
});

it('TSX 页面写入 store，SFC 页面读到同一个值', async () => {
  const { el, router } = await open('/profile/42');
  const input = el.querySelector<HTMLInputElement>('.name-field')!;
  input.value = 'Grace';
  input.dispatchEvent(new Event('input'));
  await nextTick();
  expect(text(el, '.greeting')).toBe('你好，Grace');

  await router.push('/');
  await nextTick();
  expect(text(el, '.home-name')).toBe('当前用户：Grace');
});

it('路由参数变化时派生值随之更新', async () => {
  const { el, router } = await open('/profile/42');
  await router.push('/profile/7');
  await nextTick();
  expect(text(el, 'h1')).toBe('用户 7');
});
