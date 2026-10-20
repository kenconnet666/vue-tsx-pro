// 主题偏好：记住选择、跟随系统、其他标签页同步；防闪烁脚本；createUi 的 paintDocument
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createUi } from '../createUi';
import { darkTheme } from '../theme/dark';
import { lightTheme } from '../theme/light';
import { paperTheme } from '../theme/paper';
import { createThemePreference, themeBootScript } from '../theme/preference';

const themes = { light: lightTheme, dark: darkTheme, paper: paperTheme };
const KEY = 'test-theme';

afterEach(() => {
  localStorage.clear();
  const root = document.documentElement;
  root.removeAttribute('style');
  root.removeAttribute('class');
  delete root.dataset.theme;
});

describe('createThemePreference', () => {
  it('没记过时跟随系统；切换后记住，下次创建沿用', async () => {
    const first = createThemePreference({ themes, storageKey: KEY });
    expect([first.preference, first.name]).toEqual(['system', 'light']);
    await first.set('paper');
    expect([first.preference, first.theme]).toEqual(['paper', paperTheme]);
    expect(localStorage.getItem(KEY)).toBe('paper');
    expect(createThemePreference({ themes, storageKey: KEY }).name).toBe('paper');
  });

  it('记的主题已经没有了时用 fallback；不认识的名字报错', () => {
    localStorage.setItem(KEY, 'sepia');
    const preference = createThemePreference({ themes, storageKey: KEY, fallback: 'dark' });
    expect(preference.name).toBe('dark');
    expect(() => preference.set('sepia' as 'dark')).toThrow('没有名为 sepia 的主题');
  });

  it('其他标签页改了偏好：跟着变', () => {
    const preference = createThemePreference({ themes, storageKey: KEY });
    localStorage.setItem(KEY, 'dark');
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    expect(preference.name).toBe('dark');
  });
});

describe('themeBootScript', () => {
  const colors = {
    light: { background: '#fcfcfd', text: '#1c2024', colorScheme: 'light' as const },
    dark: { background: '#111113', text: '#edeef0', colorScheme: 'dark' as const },
    paper: { background: '#f5efdf', text: '#3b2f20', colorScheme: 'light' as const },
  };

  it('按记住的偏好写好底色、文字色、配色方案与 data-theme', () => {
    localStorage.setItem(KEY, 'paper');
    // oxlint-disable-next-line no-implied-eval -- 要验证的就是生成的脚本文本
    new Function(themeBootScript({ themes: colors, storageKey: KEY }))();
    const root = document.documentElement;
    expect(root.dataset.theme).toBe('paper');
    expect(root.style.backgroundColor).toBe('#f5efdf');
    expect(root.style.colorScheme).toBe('light');
  });

  it('没记过时跟随系统（测试环境是亮色）', () => {
    // oxlint-disable-next-line no-implied-eval -- 要验证的就是生成的脚本文本
    new Function(themeBootScript({ themes: colors, storageKey: KEY }))();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('createUi 的 paintDocument', () => {
  it('接手防闪烁脚本写的行内颜色，主题写在页面根元素上', async () => {
    const root = document.documentElement;
    root.style.backgroundColor = '#f5efdf';
    const app = createApp({ render: () => null });
    app.use(createUi({ theme: paperTheme, paintDocument: true }));
    app.mount(document.createElement('div'));
    await nextTick();
    expect(root.style.backgroundColor).toBe('');
    expect(root.dataset.theme).toBe('paper');
    expect(root.classList.length).toBeGreaterThan(0);
    app.unmount();
  });
});
