/**
 * 开发服务器的编译缓存：编译结果存在磁盘上（Vite 的 cacheDir 下），重启后没改过的文件直接取用、不再编译。
 * Vite 自己只缓存依赖预构建，每次重启都要把首页用到的几百个模块重新编译一遍。
 *
 * 键包含一切会影响结果的东西：编译器代码（compilerCacheKey）、Babel 与官方插件的版本、选项、模块 id 与代码，
 * 以及它导入的 .stylex 模块与 token 模块的内容——defineConsts 的值会内联进引用方，token 写法要读 token 的组名。
 * 每个模块一个文件，改了就覆盖，不会越积越多。读写失败都当作没有缓存。
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { SourceMap, StylexRule } from '../compiler/index.ts';
import { compilerCacheKey } from './cache-key.ts';

/** 一个模块的编译结果 */
export interface CachedResult {
  /** 编译后的代码（含热更新登记） */
  code: string;
  /** source map */
  map: SourceMap | null;
  /** StyleX 规则 */
  stylex: StylexRule[];
  /** 符文的警告（代码帧） */
  warnings: string[];
}

/** 影响编译结果的依赖包：版本变了缓存全部作废 */
const COMPILER_PACKAGES = [
  '@babel/core',
  '@babel/plugin-transform-typescript',
  '@stylexjs/babel-plugin',
  '@vue/babel-plugin-jsx',
];

/** 磁盘上的编译缓存；salt 是选项等对所有模块都一样的部分 */
export class CompileCache {
  private readonly dir: string;
  private readonly salt: string;

  constructor(cacheDir: string, salt: string) {
    this.dir = join(cacheDir, 'vue-tsx-pro');
    const require = createRequire(import.meta.url);
    const versions = COMPILER_PACKAGES.map(
      (name) => (require(`${name}/package.json`) as { version: string }).version,
    );
    this.salt = [compilerCacheKey(), ...versions, salt].join('\0');
    mkdirSync(this.dir, { recursive: true });
  }

  /** 模块的缓存键；dependencies 是它导入的 .stylex 模块与 token 模块的文件路径 */
  key(id: string, code: string, dependencies: string[]) {
    const hash = createHash('sha1')
      .update(this.salt)
      .update('\0')
      .update(id)
      .update('\0')
      .update(code);
    for (const file of dependencies) {
      hash.update('\0').update(file).update('\0');
      try {
        hash.update(readFileSync(file));
      } catch {
        hash.update('missing');
      }
    }
    return hash.digest('hex');
  }

  /** 键对得上时返回缓存的结果 */
  read(id: string, key: string): CachedResult | undefined {
    try {
      const entry = JSON.parse(readFileSync(this.file(id), 'utf8')) as CachedResult & {
        key: string;
      };
      return entry.key === key ? entry : undefined;
    } catch {
      return undefined;
    }
  }

  /** 写入（覆盖这个模块原来的缓存） */
  write(id: string, key: string, result: CachedResult) {
    try {
      writeFileSync(this.file(id), JSON.stringify({ key, ...result }));
    } catch {
      // 磁盘满、权限不足：下次重新编译
    }
  }

  private file(id: string) {
    return join(this.dir, `${createHash('sha1').update(id).digest('hex')}.json`);
  }
}
