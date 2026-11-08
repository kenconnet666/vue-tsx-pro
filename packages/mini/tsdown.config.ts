import fs from 'node:fs';
import module, { createRequire } from 'node:module';
import path, { dirname, join } from 'node:path';
import url, { pathToFileURL } from 'node:url';
import { defineConfig } from 'tsdown';

// 同 tsx 包：声明由 TypeScript 7 的原生 tsc 生成，7.1 要显式给出可执行文件；getExePath 要传入 Node 的模块
const typescriptDir = dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
const { default: getExePath } = await import(
  pathToFileURL(join(typescriptDir, 'lib/getExePath.js')).href
);

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    // 补全逻辑层缺的全局函数：构建出的入口第一行导入它（build/index.ts）
    globals: 'src/globals.ts',
    testing: 'src/testing.ts',
    // 构建工具跑在 Node 里
    build: 'src/build/index.ts',
    // 命令行 vtp-mini（package.json 的 bin）
    cli: 'src/cli.ts',
  },
  format: 'esm',
  platform: 'neutral',
  deps: { neverBundle: [/^node:/] },
  dts: { generator: 'tsgo', tsgo: { path: getExePath({ fs, module, path, url }) } },
});
