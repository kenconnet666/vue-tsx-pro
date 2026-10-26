// 组件库的入口与文档站对得上：文档页顶部的导入语句（DocPage 的 imports，只是一段文字）里的名字确实由写的那个入口导出
// （组件在主入口与子路径之间挪动后，编译检查不到这些文字）；代码演练场能导入每个带组件的入口
import { beforeAll, describe, expect, it } from 'vitest';
import pkg from '../../../../packages/ui/package.json' with { type: 'json' };
import { playgroundModuleNames } from '../playground/run';

const sources = import.meta.glob<string>('../components/*/*/docs.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const entryNames = Object.keys(pkg.exports)
  .filter((key) => key !== './package.json')
  .map((key) => `@zerodep-dev/vue-tsx-pro-ui${key.slice(1)}`);

const modules = new Map<string, Record<string, unknown>>();

describe('文档页的导入语句', () => {
  // 第一次加载主入口要编译上千个模块
  beforeAll(async () => {
    for (const entry of entryNames) modules.set(entry, await import(/* @vite-ignore */ entry));
  }, 120_000);

  it.each(Object.entries(sources))('%s', (_path, source) => {
    for (const [, names, entry] of source.matchAll(
      /import\s*\{([^}]*)\}\s*from\s*'(@zerodep-dev\/vue-tsx-pro-ui[^']*)'/g,
    )) {
      const module = modules.get(entry!);
      expect(module, `没有入口 ${entry}`).toBeDefined();
      const values = names!
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name && !name.startsWith('type '))
        .map((name) => name.split(/\s+as\s+/)[0]!);
      const missing = values.filter((name) => !(name in module!));
      expect(missing, `${entry} 没有导出`).toEqual([]);
    }
  });
});

it('代码演练场能导入组件库带组件的入口（主入口与带目录的子路径）', () => {
  const componentEntries = Object.entries(pkg.exports).flatMap(([key, target]) =>
    typeof target === 'object' && target['@vue-tsx-pro/source'].endsWith('index.ts')
      ? [`@zerodep-dev/vue-tsx-pro-ui${key.slice(1)}`]
      : [],
  );
  expect(componentEntries.filter((entry) => !playgroundModuleNames.includes(entry))).toEqual([]);
});
