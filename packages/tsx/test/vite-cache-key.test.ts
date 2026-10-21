// 编译器变了，Vitest 缓存的旧编译结果要作废：预设把编译器代码的哈希加进缓存键
import { expect, it } from 'vitest';
import { vueTsxPro } from '../src/vite/index';

it('vue-tsx-pro:runes 插件向 Vitest 注册缓存键：编译器代码的哈希，同一进程内不变', () => {
  const runes = vueTsxPro().find((plugin) => plugin.name === 'vue-tsx-pro') as unknown as {
    configureVitest: (context: {
      defineCacheKeyGenerator: (generator: () => string) => void;
    }) => void;
  };
  const keys: string[] = [];
  runes.configureVitest({
    defineCacheKeyGenerator: (generator) => keys.push(generator(), generator()),
  });
  expect(keys[0]).toMatch(/^[0-9a-f]{16}$/);
  expect(keys[1]).toBe(keys[0]);
});
