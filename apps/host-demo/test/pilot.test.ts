// 试点组件在宿主里的行为（布局、焦点、原生 popover 需要真实浏览器，见 COMPONENTS.md §7 结论）
import { afterEach, expect, it } from 'vitest';
import { createApp, h, nextTick, type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';
import { Button, LinkButton } from '@vue-tsx-pro/ui';

let mounted: App | undefined;
afterEach(() => mounted?.unmount());

async function openPilot() {
  const { app, router } = createHostApp(createMemoryHistory());
  await router.push('/pilot');
  await router.isReady();
  const el = document.createElement('div');
  document.body.append(el);
  app.mount(el);
  mounted = app;
  return el;
}

const $ = <T extends Element = HTMLElement>(el: Element, selector: string) =>
  el.querySelector<T>(selector)!;

it('LinkButton 渲染为链接，部件 props 落到图标上；Button 的禁用与加载状态', async () => {
  const el = await openPilot();
  const link = $(el, '.link-button');
  expect([link.tagName, link.getAttribute('href')]).toEqual(['A', '/profile/42']);
  expect(link.querySelector('svg')!.style.strokeWidth).toBe('3');
  const buttons = [...el.querySelectorAll('button')];
  expect(buttons.find((b) => b.textContent === '禁用')!.disabled).toBe(true);
  const loading = buttons.find((b) => b.textContent === '加载中')!;
  // 加载中不用 disabled：焦点保留，点击由组件拦下
  expect([loading.disabled, loading.getAttribute('aria-busy')]).toEqual([false, 'true']);
});

it('TextField：输入写回父级，清除按钮按当前语言提供无障碍名称', async () => {
  const el = await openPilot();
  const input = $<HTMLInputElement>(el, '.search-field input');
  expect(input.getAttribute('aria-label')).toBe('搜索'); // ...rest 落到主元素 input
  input.value = 'vue';
  input.dispatchEvent(new Event('input'));
  await nextTick();
  expect($(el, '.keyword').textContent).toBe('vue');

  const clear = () => $(el, '.search-field button');
  expect(clear().getAttribute('aria-label')).toBe('清空');
  $(el, '.toggle-lang').click();
  await nextTick();
  expect(clear().getAttribute('aria-label')).toBe('Clear');
  clear().click();
  await nextTick();
  expect([input.value, $(el, '.keyword').textContent]).toEqual(['', '']);
});

it('Provider：页面内切换主题', async () => {
  const el = await openPilot();
  const root = $(el, '[data-theme]');
  expect(root.dataset.theme).toBe('light');
  $(el, '.toggle-theme').click();
  await nextTick();
  expect(root.dataset.theme).toBe('dark');
});

it('Popover：触发器带上关联属性', async () => {
  const el = await openPilot();
  const trigger = $(el, '.menu-trigger');
  const panel = $(el, `#${trigger.getAttribute('aria-controls')}`);
  expect([trigger.getAttribute('aria-expanded'), panel.getAttribute('popover')]).toEqual([
    'false',
    'auto',
  ]);
});

it('LinkButton：禁用时去掉 href，不触发使用方的点击回调', () => {
  let clicks = 0;
  const el = document.createElement('div');
  const host = createApp({
    render: () => h(LinkButton, { href: '/x', disabled: true, onClick: () => clicks++ }, () => 'x'),
  });
  host.mount(el);
  el.querySelector('a')!.click();
  expect([clicks, el.querySelector('a')!.hasAttribute('href')]).toEqual([0, false]);
  host.unmount();
});

it('Button：type 默认为 button，可以改成 submit', () => {
  const el = document.createElement('div');
  const host = createApp({
    render: () => [h(Button, null, () => 'a'), h(Button, { type: 'submit' }, () => 'b')],
  });
  host.mount(el);
  expect([...el.querySelectorAll('button')].map((button) => button.type)).toEqual([
    'button',
    'submit',
  ]);
  host.unmount();
});
