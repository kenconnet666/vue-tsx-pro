// 客户端接管服务端输出的样式表：data-names 里的规则不再重复插入，新用到的规则插进同一张表
import { expect, it, vi } from 'vitest';

it('接管 <style data-vue-tsx-pro>：已有的类不重复插入，新的类插进同一张表', async () => {
  document.head.innerHTML =
    '<style data-vue-tsx-pro data-names="xserver">.xserver{color:red}</style>';
  const { attrs, create, styleText } = await import('../src/styles/runtime');
  const element = document.querySelector<HTMLStyleElement>('style[data-vue-tsx-pro]')!;
  const { isInserted } = await import('../src/styles/sheet');
  expect(isInserted('xserver')).toBe(true);
  const fresh = attrs(create({ box: { color: 'green' } }).box).class!;
  expect(document.querySelectorAll('style[data-vue-tsx-pro]')).toHaveLength(1);
  expect([...element.sheet!.cssRules].map((rule) => rule.cssText).join('\n')).toContain(
    `.${fresh}`,
  );
  expect(styleText()).toContain(`.${fresh}`);
});

it('接管来的变量组：模块执行时不重复插入，之后的热更新照常换值', async () => {
  const element = document.querySelector<HTMLStyleElement>('style[data-vue-tsx-pro]')!;
  element.textContent += ':root{--adopted-gap:4px}';
  element.dataset.names += ' --adopted';
  // 样式表已经接管过（上一个用例），这里单独起一份模块重新接管
  vi.resetModules();
  const fresh = await import('../src/styles/runtime');
  const rootRules = () =>
    [...element.sheet!.cssRules].filter((rule) => rule.cssText.includes('--adopted-gap'));
  fresh.defineVars('adopted', { gap: '4px' });
  expect(rootRules()).toHaveLength(1);
  expect(fresh.styleText()).toContain('--adopted-gap:4px');
  fresh.defineVars('adopted', { gap: '8px' });
  expect(rootRules().at(-1)!.cssText).toContain('8px');
});
