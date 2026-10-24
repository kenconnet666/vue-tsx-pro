// 组件库依赖的工具库在本工具链（Vite + happy-dom）下能正常解析与使用；升级依赖时先看这里
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { computePosition } from '@floating-ui/dom';
import { parseDate } from '@internationalized/date';
import { Check } from '@lucide/icons';
import Decimal from 'decimal.js';
import { animate, createDraggable, createLayout } from 'animejs';
import { tabbable } from 'tabbable';
import { z } from 'zod';
import { safeParseAsync, toJSONSchema } from 'zod/v4/core';
import manifest from '../../../package.json' with { type: 'json' };

it('decimal.js：十进制精确运算', () => {
  expect(new Decimal('0.1').plus('0.2').toString()).toBe('0.3');
});

it('@internationalized/date：日历运算', () => {
  expect(parseDate('2026-02-28').add({ days: 1 }).toString()).toBe('2026-03-01');
});

it('@lucide/icons：按名导入图标数据', () => {
  expect(Check.node[0]![0]).toBe('path');
});

it('tabbable：找出可聚焦元素', () => {
  const root = document.createElement('div');
  root.innerHTML = '<button>a</button><span>b</span><input disabled /><a href="#">c</a>';
  expect(tabbable(root, { displayCheck: 'none' }).map((el) => el.tagName)).toEqual(['BUTTON', 'A']);
});

it('@floating-ui/dom：可以导入定位函数', () => {
  expect(computePosition).toBeTypeOf('function');
});

it('animejs：动画 JS 对象的数值（canvas、3D 场景用）；拖拽与布局动画可以导入', async () => {
  expect(createDraggable).toBeTypeOf('function');
  expect(createLayout).toBeTypeOf('function');
  const target = { x: 0 };
  await animate(target, { x: 100, duration: 50 });
  expect(target.x).toBe(100);
});

// 可选 peer 依赖：以后的图表、3D 组件用，组件库开发时安装
// Unovis 在 vmForks 里由 Vite 内联编译（见 vitest.config.ts），第一次导入要几秒，CPU 忙时会超过默认的 5 秒
it('@unovis/ts、three：按需导入可以解析', { timeout: 30_000 }, async () => {
  const [{ XYContainer, Line }, { Scene, Vector3 }] = await Promise.all([
    import('@unovis/ts'),
    import('three'),
  ]);
  expect(XYContainer).toBeTypeOf('function');
  expect(Line).toBeTypeOf('function');
  expect(new Scene().children).toEqual([]);
  expect(new Vector3(3, 4, 0).length()).toBe(5);
});

it('zod（peer 依赖）：useForm 用 zod/v4/core 的校验与 JSON Schema 转换，zod 与 zod/mini 的 schema 都能用', async () => {
  const schema = z.object({ name: z.string().min(2) });
  const result = await safeParseAsync(schema, { name: 'x' });
  expect(result.error?.issues[0]!.path).toEqual(['name']);
  expect(toJSONSchema(schema, { io: 'input' })).toMatchObject({ required: ['name'] });
});

// 可选 peer 依赖：路由适配（子路径 @vue-tsx-pro/ui/vue-router）与以后需要共享状态的组件
it('vue-router、pinia：按需导入可以解析', async () => {
  const [{ createRouter, createMemoryHistory }, { createPinia, defineStore }] = await Promise.all([
    import('vue-router'),
    import('pinia'),
  ]);
  const router = createRouter({ history: createMemoryHistory(), routes: [] });
  expect(typeof router.push).toBe('function');
  expect(typeof createPinia().install).toBe('function');
  expect(defineStore).toBeTypeOf('function');
});

/** 源码（不含测试）运行时导入的第三方模块：去掉注释与 import type，不含 vue 与本仓库的包 */
function runtimeImports(directory: string): Set<string> {
  const found = new Set<string>();
  for (const entry of readdirSync(directory, { withFileTypes: true, recursive: true })) {
    const path = join(entry.parentPath, entry.name);
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || /[\\/]\.test[\\/]/.test(path)) continue;
    const code = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    const patterns = [
      /^(?:import|export)\s+(?!type\s)[^;]*?from\s*'([^']+)'/gm,
      /^import\s*'([^']+)'/gm,
      /\bimport\(\s*'([^']+)'\s*\)/g,
    ];
    for (const pattern of patterns) {
      for (const [, specifier] of code.matchAll(pattern)) found.add(specifier!);
    }
  }
  return new Set(
    [...found].filter(
      (specifier) =>
        !specifier.startsWith('.') &&
        !specifier.startsWith('node:') &&
        !specifier.startsWith('@vue-tsx-pro/') &&
        specifier !== 'vue',
    ),
  );
}

it('package.json 的 vueTsxPro.optimizeDeps 列全了源码运行时导入的第三方依赖（按源码读组件库的应用由 workspaceSource 按它预构建；漏了开发服务器会一个文件一个请求，打开某页才发现的依赖还会刷新页面）', () => {
  const imports = runtimeImports(join(import.meta.dirname, '../..'));
  const { include, exclude } = manifest.vueTsxPro.optimizeDeps;
  expect([...imports].sort()).toEqual([...include, ...exclude].sort());
});
