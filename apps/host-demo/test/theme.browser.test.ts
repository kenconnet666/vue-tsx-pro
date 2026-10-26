// 主题偏好在真实浏览器里：圆形展开切换（支持 View Transitions 的浏览器）后，页面根元素的底色跟着主题变
import {
  createThemePreference,
  createUi,
  darkTheme,
  lightTheme,
  paperTheme,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { afterEach, expect, it } from 'vitest';
import { createApp, type App } from 'vue';

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  localStorage.clear();
});

it('切换主题：页面底色、配色方案与 data-theme 跟着变', async () => {
  const preference = createThemePreference({
    themes: { light: lightTheme, dark: darkTheme, paper: paperTheme },
    storageKey: 'browser-test-theme',
    fallback: 'light',
  });
  app = createApp({ render: () => null });
  app.use(createUi({ theme: () => preference.theme, paintDocument: true }));
  app.mount(document.createElement('div'));
  const root = document.documentElement;
  const background = () => getComputedStyle(root).backgroundColor;
  await expect.poll(background).toBe('rgb(252, 252, 253)');

  await preference.set('paper', { origin: { x: 10, y: 10 } });
  await expect.poll(() => root.dataset.theme).toBe('paper');
  await expect.poll(background).toBe('rgb(245, 239, 223)');

  await preference.set('dark');
  await expect.poll(background).toBe('rgb(17, 17, 19)');
  expect(getComputedStyle(root).colorScheme).toBe('dark');
});
