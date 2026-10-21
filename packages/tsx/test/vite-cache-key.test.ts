// 编译器变了，Vitest 缓存的旧编译结果要作废：预设把编译器代码的哈希加进缓存键；
// 用 import.meta.glob 的模块不进文件缓存（展开成哪些文件取决于磁盘，内容没变也可能多了文件）
import { expect, it } from 'vitest';
import { vueTsxPro } from '../src/vite/index';

type Generator = (module: { sourceCode: string }) => string | false;

function cacheKeyGenerator() {
  const plugin = vueTsxPro().find((plugin) => plugin.name === 'vue-tsx-pro') as unknown as {
    configureVitest: (context: { defineCacheKeyGenerator: (generator: Generator) => void }) => void;
  };
  let generator: Generator | undefined;
  plugin.configureVitest({ defineCacheKeyGenerator: (defined) => (generator = defined) });
  return generator!;
}

it('缓存键是编译器代码的哈希，同一进程内不变', () => {
  const generator = cacheKeyGenerator();
  const key = generator({ sourceCode: 'export const a = 1;' });
  expect(key).toMatch(/^[0-9a-f]{16}$/);
  expect(generator({ sourceCode: 'export const b = 2;' })).toBe(key);
});

it('用 import.meta.glob 的模块不进文件缓存', () => {
  const generator = cacheKeyGenerator();
  expect(generator({ sourceCode: "const pages = import.meta.glob('./pages/*.tsx');" })).toBe(false);
});
