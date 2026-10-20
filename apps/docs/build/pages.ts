/**
 * `virtual:doc-pages`：收集 src/components/<分类>/<Name>/docs.tsx，生成组件页的清单（路由、侧栏、搜索、翻页都用它）。
 *
 * 每个文档页导出一个字面量的 meta（标题、简介、排序），这里在构建时静态读出，页面本身仍按需加载：
 *
 *   export const meta = { title: 'Button 按钮', description: '触发一个操作', order: 1 };
 *   export default _component(() => () => <DocPage …>…</DocPage>);
 *
 * 新增、删除文档页时整页刷新；改了 meta 时清单跟着更新。
 */
import { globSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import type { Plugin, ViteDevServer } from 'vite';

const ID = 'virtual:doc-pages';
const RESOLVED = `\0${ID}`;
const PATTERN = 'src/components/*/*/docs.tsx';

/** meta 里允许的字段：只读字符串与数字字面量 */
function readMeta(file: string): Record<string, string | number> {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest);
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(source) !== 'meta') continue;
      const object = declaration.initializer;
      if (!object || !ts.isObjectLiteralExpression(object)) break;
      const meta: Record<string, string | number> = {};
      for (const property of object.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const value = property.initializer;
        if (ts.isStringLiteralLike(value)) meta[property.name.getText(source)] = value.text;
        else if (ts.isNumericLiteral(value))
          meta[property.name.getText(source)] = Number(value.text);
      }
      if (typeof meta.title !== 'string' || typeof meta.description !== 'string')
        throw new Error(`${file}：meta 要有字符串字面量的 title 与 description`);
      return meta;
    }
  }
  throw new Error(`${file}：没有导出 meta（标题、简介）`);
}

export function docPages(): Plugin {
  let root = process.cwd();
  const isPage = (file: string) =>
    relative(root, file)
      .split('\\')
      .join('/')
      .match(/^src\/components\/[^/]+\/[^/]+\/docs\.tsx$/);

  function reloadOnChange(server: ViteDevServer, file: string) {
    if (!isPage(file)) return;
    const module = server.moduleGraph.getModuleById(RESOLVED);
    if (module) server.moduleGraph.invalidateModule(module);
    server.ws.send({ type: 'full-reload' });
  }

  return {
    name: 'docs:pages',
    configResolved(config) {
      root = config.root;
    },
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load(id) {
      if (id !== RESOLVED) return;
      const entries = globSync(PATTERN, { cwd: root })
        .map((path) => path.split('\\').join('/'))
        .sort()
        .map((path) => {
          const file = join(root, path);
          this.addWatchFile(file);
          const [, , category, name] = path.split('/');
          const meta = readMeta(file);
          return `{ category: ${JSON.stringify(category)}, name: ${JSON.stringify(name)}, meta: ${JSON.stringify(meta)}, load: () => import(${JSON.stringify(`/${path}`)}) }`;
        });
      return `export default [\n  ${entries.join(',\n  ')}\n];\n`;
    },
    configureServer(server) {
      server.watcher.on('add', (file) => reloadOnChange(server, file));
      server.watcher.on('unlink', (file) => reloadOnChange(server, file));
    },
  };
}
