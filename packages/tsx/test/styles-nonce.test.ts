// 内容安全策略：引擎建的 <style> 带上 nonce——setStyleNonce 设的优先，没设时读 Vite 约定的 <meta property="csp-nonce">
// 样式表在模块里只建一次，每个用例重新加载模块、清掉上一个用例建的表
import { afterEach, expect, it, vi } from 'vitest';

const engineSheet = () => document.querySelector<HTMLStyleElement>('style[data-vue-tsx-pro]');

afterEach(() => {
  engineSheet()?.remove();
  document.head.querySelector('meta[property="csp-nonce"]')?.remove();
  vi.resetModules();
});

it('没设时读 Vite 写在 meta 上的 nonce', async () => {
  engineSheet()?.remove();
  vi.resetModules();
  const meta = document.createElement('meta');
  meta.setAttribute('property', 'csp-nonce');
  meta.setAttribute('nonce', 'from-meta');
  document.head.append(meta);
  const { insert } = await import('../src/styles/sheet');
  insert('x-nonce-meta', ['.x-nonce-meta{color:red}'], 0);
  expect(engineSheet()!.nonce).toBe('from-meta');
});

it('setStyleNonce 设的优先于 meta', async () => {
  engineSheet()?.remove();
  vi.resetModules();
  const meta = document.createElement('meta');
  meta.setAttribute('property', 'csp-nonce');
  meta.setAttribute('nonce', 'from-meta');
  document.head.append(meta);
  const { insert, setStyleNonce } = await import('../src/styles/sheet');
  setStyleNonce('from-app');
  insert('x-nonce-app', ['.x-nonce-app{color:red}'], 0);
  expect(engineSheet()!.nonce).toBe('from-app');
});
