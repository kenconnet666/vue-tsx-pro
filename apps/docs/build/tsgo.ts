/**
 * 浏览器里的 TypeScript 7（tsgo-wasm，与仓库的 typescript 同一个提交）：流程工作室的语言服务在 Worker 里跑它。
 * wasm 解开有五十多 MB，超过 Cloudflare Pages 单个文件 25MB 的上限，所以发 gzip 过的（约 12MB），Worker 用
 * DecompressionStream 解开。文件名带版本号，可以长期缓存。
 *
 *   import { tsgoWasmUrl } from 'virtual:tsgo-wasm';   // 开发时由这里的中间件提供，构建时产出到 assets/
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

const ID = 'virtual:tsgo-wasm';
const RESOLVED = `\0${ID}`;

export function tsgoWasm(): Plugin {
  const require = createRequire(import.meta.url);
  const dir = dirname(require.resolve('tsgo-wasm/package.json'));
  const { version, buildInfo } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    version: string;
    buildInfo: { date: string; commit: string };
  };
  // 显示用：哪天、从哪个提交构建的（与仓库的 typescript 对照）
  const build = `${buildInfo.date} · ${buildInfo.commit.slice(0, 7)}`;
  const fileName = `assets/tsgo-${version}.wasm.gz`;
  let gzipped: Buffer | undefined;
  // 压一次要一两秒：用到时才压，压过的留着
  const compressed = () =>
    (gzipped ??= gzipSync(readFileSync(join(dir, 'tsgo.wasm')), { level: 9 }));
  let base = '/';
  let building = false;

  return {
    name: 'docs:tsgo-wasm',
    configResolved(config) {
      base = config.base;
      building = config.command === 'build';
    },
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load(id, options) {
      if (id !== RESOLVED) return;
      // 只在浏览器的构建里产出（服务端渲染的构建用不到这个文件）
      if (building && !options?.ssr)
        this.emitFile({ type: 'asset', fileName, source: compressed() });
      return `export const tsgoWasmUrl = ${JSON.stringify(base + fileName)};\nexport const tsgoBuild = ${JSON.stringify(build)};\n`;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url !== base + fileName) return next();
        response.setHeader('content-type', 'application/gzip');
        response.setHeader('cache-control', 'max-age=31536000, immutable');
        response.end(compressed());
      });
    },
  };
}
