// 试点组件在宿主里的行为（布局、焦点、原生 popover 需要真实浏览器，见 COMPONENTS.md §7 结论）
import { afterEach, expect, it } from 'vitest';
import { nextTick, type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

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

it('Button：href 渲染为链接，部件 props 落到图标上，禁用与加载状态', async () => {
  const el = await openPilot();
  const link = $(el, '.link-button');
  expect([link.tagName, link.getAttribute('href')]).toEqual(['A', '/profile/42']);
  expect(link.querySelector('svg')!.getAttribute('stroke-width')).toBe('3');
  const buttons = [...el.querySelectorAll('button')];
  expect(buttons.find((b) => b.textContent === '禁用')!.disabled).toBe(true);
  const loading = buttons.find((b) => b.textContent === '加载中')!;
  expect([loading.disabled, loading.getAttribute('aria-busy')]).toEqual([true, 'true']);
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
