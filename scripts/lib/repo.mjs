/** 脚本共用：仓库根目录、从工作区里某个包解析依赖、把 TS / TSX 源文件解析成语法树 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API } from 'typescript/sync';

/** 仓库根目录 */
export const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** 从工作区里某个包解析依赖（脚本要用的库装在那个包里）：`requireFrom('packages/ui')('@unovis/ts')` */
export const requireFrom = (dir) => createRequire(join(root, dir, 'package.json'));

let api;

/**
 * 解析 TS / TSX 源文件（节点带父节点，语法按扩展名）；text 不传时读文件。
 * 解析在 TypeScript 7 的 tsc 子进程里做：语法树传回本地后就不需要远端留着，立即释放租约
 */
export function parseSource(file, text = readFileSync(file, 'utf8')) {
  api ??= new API();
  const retained = api.createSourceFile(file, text);
  retained.dispose();
  return retained.sourceFile;
}

/**
 * 组件库的入口：packages/ui/package.json 的 exports 是唯一的登记处，构建、导出生成、分层检查、文档站都从这里读。
 * `name` 是导入路径（`@vue-tsx-pro/ui/charts`），`source` 是源码文件（相对 packages/ui/src，`charts/index.ts`）。
 */
export function uiEntries() {
  const pkg = JSON.parse(readFileSync(join(root, 'packages/ui/package.json'), 'utf8'));
  return Object.entries(pkg.exports).flatMap(([key, target]) => {
    const source = typeof target === 'object' ? target['@vue-tsx-pro/source'] : undefined;
    if (!source) return [];
    return [{ name: `@vue-tsx-pro/ui${key.slice(1)}`, source: source.replace(/^\.\/src\//, '') }];
  });
}
