/**
 * Vitest 的文件模块缓存（fsModuleCache）按源文件内容命中，不知道编译器变了：
 * 升级本包、或在本仓库改了编译器后，会继续用旧的编译结果。这里算出编译器代码的哈希，
 * 由预设通过 configureVitest 加进缓存键（见 index.ts）。
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let cached: string | undefined;

/** 编译器代码的哈希（进程内只算一次） */
export function compilerCacheKey(): string {
  return (cached ??= hashFiles(compilerFiles()));
}

/**
 * 产物：dist 下的全部 js（编译器打进了共享 chunk）；仓库源码：编译器与 Vite 预设的源文件
 */
function compilerFiles() {
  const here = dirname(fileURLToPath(import.meta.url));
  const fromSource = here.replaceAll('\\', '/').endsWith('/src/vite');
  const directories = fromSource ? [here, join(here, '../compiler')] : [here];
  return directories.flatMap((directory) =>
    readdirSync(directory)
      .filter((file) => /\.(js|ts)$/.test(file) && !file.endsWith('.d.ts'))
      .map((file) => join(directory, file)),
  );
}

function hashFiles(files: string[]) {
  const hash = createHash('sha1');
  for (const file of files.sort()) hash.update(readFileSync(file));
  return hash.digest('hex').slice(0, 16);
}
