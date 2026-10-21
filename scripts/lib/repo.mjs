/** 脚本共用：仓库根目录、从工作区里某个包解析依赖、把 TS / TSX 源文件解析成语法树 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/** 仓库根目录 */
export const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** 从工作区里某个包解析依赖（脚本要用的库装在那个包里）：`requireFrom('packages/ui')('@unovis/ts')` */
export const requireFrom = (dir) => createRequire(join(root, dir, 'package.json'));

/** 解析 TS / TSX 源文件（节点带父节点，语法按扩展名）；text 不传时读文件 */
export function parseSource(file, text = readFileSync(file, 'utf8')) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
}
