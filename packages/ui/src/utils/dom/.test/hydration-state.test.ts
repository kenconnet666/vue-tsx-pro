// 水合时只有浏览器里读得到的初始状态（存的值、媒体查询）：先按服务端的渲染，挂载后换成真实的，节点上的属性跟着改过来
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { useMediaQuery } from '../media-query';
import { usePersistentState } from '../storage';

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

/** 服务端渲染出 HTML（那时没有存的值、没有 matchMedia），再在浏览器里水合 */
async function hydrate(component: ReturnType<typeof defineComponent>, prepare: () => void) {
  const html = await renderToString(createSSRApp(component));
  prepare();
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  createSSRApp(component).mount(container);
  const mismatched = [...warn.mock.calls, ...error.mock.calls].some((call) =>
    /hydration/i.test(String(call[0])),
  );
  warn.mockRestore();
  error.mockRestore();
  await nextTick();
  return { root: container.firstElementChild!, mismatched };
}

describe('水合时的初始状态', () => {
  it('usePersistentState：水合不报不一致，挂载后节点上是存的值', async () => {
    const Panel = defineComponent({
      setup() {
        const layout = usePersistentState('t.layout', { size: 40 });
        return () => h('div', { 'data-size': layout.value.size }, String(layout.value.size));
      },
    });
    const { root, mismatched } = await hydrate(Panel, () =>
      localStorage.setItem('t.layout', JSON.stringify({ size: 70 })),
    );
    expect(mismatched).toBe(false);
    expect(root.getAttribute('data-size')).toBe('70');
    expect(root.textContent).toBe('70');
  });

  it('useMediaQuery：水合不报不一致，挂载后是真实的结果', async () => {
    const Layout = defineComponent({
      setup() {
        const wide = useMediaQuery('(min-width: 64rem)');
        return () => h('div', { 'data-wide': wide.value ? '' : undefined });
      },
    });
    const { root, mismatched } = await hydrate(Layout, () =>
      vi.stubGlobal('matchMedia', () => ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {},
      })),
    );
    expect(mismatched).toBe(false);
    expect(root.hasAttribute('data-wide')).toBe(true);
  });
});
