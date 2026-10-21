// 开发时的 StyleX CSS：用到 StyleX 的模块末尾等自己的规则进了页面，新打开的页面不会先按没有样式渲染
import { expect, it } from 'vitest';
import { stylexCss, StylexRules } from '../src/vite/stylex';

type Rule = Parameters<StylexRules['set']>[1][number];
const rule = (className: string): Rule => [
  className,
  { ltr: `.${className}{color:red}`, rtl: null },
  3000,
];

function plugin(rules: StylexRules, serve: boolean) {
  const css = stylexCss(rules) as unknown as {
    configResolved: (config: { base: string }) => void;
    configureServer: (server: unknown) => void;
    transform: (
      this: { environment: { name: string } },
      code: string,
      id: string,
      options?: { ssr?: boolean },
    ) => { code: string; map: null } | undefined;
  };
  css.configResolved({ base: '/' });
  css.configureServer({
    httpServer: serve ? { once() {} } : null,
    middlewares: { use() {} },
    environments: { client: { hot: { send() {} } } },
  });
  return (code: string, id: string, environment = 'client', ssr = false) =>
    css.transform.call({ environment: { name: environment } }, code, id, { ssr });
}

it('规则记下从哪个版本起进了 CSS；内容不变不算新版本，去掉规则后不再有版本', () => {
  const rules = new StylexRules({});
  rules.set('/a.tsx', [rule('a')]);
  rules.set('/b.tsx', [rule('b')]);
  expect(rules.versionOf('/a.tsx')).toBe(1);
  expect(rules.versionOf('/b.tsx')).toBe(2);
  rules.set('/a.tsx', [rule('a')]);
  expect(rules.versionOf('/a.tsx')).toBe(1);
  rules.set('/a.tsx', []);
  expect(rules.versionOf('/a.tsx')).toBeUndefined();
  expect(rules.version).toBe(3);
});

it('开发服务器里，有规则的模块末尾等它的版本；不挪动已有代码', () => {
  const rules = new StylexRules({});
  const transform = plugin(rules, true);
  rules.set('/a.tsx', [rule('a')]);
  const result = transform('export const a = 1;', '/a.tsx');
  expect(result?.map).toBeNull();
  expect(result?.code.startsWith('export const a = 1;\n')).toBe(true);
  expect(result?.code).toContain(
    'import { stylexReady as __stylexReady } from "virtual:vue-tsx-pro/stylex-client";',
  );
  expect(result?.code).toContain('await __stylexReady(1);');
});

it('没有规则的模块、SSR、不提供页面的服务器（Vitest）都不加', () => {
  const rules = new StylexRules({});
  rules.set('/a.tsx', [rule('a')]);
  const transform = plugin(rules, true);
  expect(transform('export {};', '/plain.ts')).toBeUndefined();
  expect(transform('export {};', '/a.tsx', 'ssr', true)).toBeUndefined();
  expect(plugin(rules, false)('export {};', '/a.tsx')).toBeUndefined();
});
