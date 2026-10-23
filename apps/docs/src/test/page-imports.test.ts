// 文档页顶部的导入语句（DocPage 的 imports，只是一段文字）里的名字，确实由写的那个入口导出：组件在主入口与子路径之间挪动后，
// 编译检查不到这些文字，这里补上
import { beforeAll, describe, expect, it } from 'vitest';
import pkg from '../../../../packages/ui/package.json' with { type: 'json' };

const sources = import.meta.glob<string>('../components/*/*/docs.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const entryNames = Object.keys(pkg.exports)
  .filter((key) => key !== './package.json')
  .map((key) => `@vue-tsx-pro/ui${key.slice(1)}`);

const modules = new Map<string, Record<string, unknown>>();

describe('文档页的导入语句', () => {
  // 第一次加载主入口要编译上千个模块
  beforeAll(async () => {
    for (const entry of entryNames) modules.set(entry, await import(/* @vite-ignore */ entry));
  }, 120_000);

  it.each(Object.entries(sources))('%s', (_path, source) => {
    for (const [, names, entry] of source.matchAll(
      /import\s*\{([^}]*)\}\s*from\s*'(@vue-tsx-pro\/ui[^']*)'/g,
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
