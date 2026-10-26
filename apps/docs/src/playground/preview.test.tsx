// 代码演练场的预览：独立的 Vue 应用，用户代码出错只报告，不往外抛
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { darkTheme, defaultConfig, useConfig } from '@zerodep-dev/vue-tsx-pro-ui';
import { afterEach, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mountPreview } from './preview';

const host = document.createElement('div');
document.body.append(host);
// 预览把错误同时打到控制台：测试里不打
vi.spyOn(console, 'error').mockImplementation(() => {});
afterEach(() => host.replaceChildren());

it('与页面共用组件库配置；卸载后清空', () => {
  const config = { ...defaultConfig, theme: darkTheme };
  const Theme = _component(() => {
    const ui = useConfig();
    return () => <span>{ui.theme.name}</span>;
  });
  const unmount = mountPreview(host, Theme, { config, onError: () => {} });
  expect(host.textContent).toBe(darkTheme.name);
  unmount();
  expect(host.innerHTML).toBe('');
});

it('setup、渲染里出错：报告错误，不再渲染出错的组件', () => {
  const errors: unknown[] = [];
  const Broken = _component(() => () => {
    throw new Error('渲染坏了');
  });
  expect(() =>
    mountPreview(host, Broken, { config: defaultConfig, onError: (e) => errors.push(e) }),
  ).not.toThrow();
  expect(errors).toEqual([new Error('渲染坏了')]);
  expect(host.textContent).toBe('');
});

it('事件处理里出错：报告错误', async () => {
  const errors: unknown[] = [];
  const Clicky = _component(() => () => (
    <button
      onClick={() => {
        throw new Error('点坏了');
      }}
    >
      点
    </button>
  ));
  mountPreview(host, Clicky, { config: defaultConfig, onError: (e) => errors.push(e) });
  host.querySelector('button')!.click();
  await nextTick();
  expect(errors).toEqual([new Error('点坏了')]);
  expect(host.querySelector('button')).toBeNull();
});
