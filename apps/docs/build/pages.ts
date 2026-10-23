/**
 * `virtual:doc-pages`：收集 src/components/<分类>/<Name>/docs.tsx，生成组件页的清单（路由、侧栏、搜索、翻页都用它）。
 *
 * 每个文档页导出一个字面量的 meta（标题、简介、排序），这里在构建时静态读出，页面本身仍按需加载：
 *
 *   export const meta = { title: 'Button 按钮', description: '触发一个操作', order: 1 };
 *   export default _component(() => () => <DocPage …>…</DocPage>);
 *
 * 新增、删除文档页时整页刷新；改了某页的 meta（标题、简介、排序）时也重新生成清单并刷新，只改正文时照常热更新。
 */
import { globSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as ts from 'typescript/ast';
import { API } from 'typescript/sync';
import type { Plugin, ViteDevServer } from 'vite';

const ID = 'virtual:doc-pages';
const RESOLVED = `\0${ID}`;
const PATTERN = 'src/components/*/*/docs.tsx';

/** 路径统一成正斜杠：监听事件与 glob 给出的写法不同 */
const normalize = (file: string) => file.split('\\').join('/');

let api: API | undefined;

/** 解析一个文档页：语法树传回本地后就不需要 tsc 子进程留着，立即释放 */
function parse(file: string) {
  api ??= new API();
  const retained = api.createSourceFile(file, readFileSync(file, 'utf8'));
  retained.dispose();
  return retained.sourceFile;
}

/** meta 里允许的字段：只读字符串与数字字面量 */
function readMeta(file: string): Record<string, string | number> {
  const source = parse(file);
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
        if (ts.isStringLiteralLikeNode(value)) meta[property.name.getText(source)] = value.text;
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
  // 上次生成清单时各页的 meta：改动时比较，只有 meta 变了才需要重新生成
  const metas = new Map<string, string>();
  const isPage = (file: string) =>
    relative(root, file)
      .split('\\')
      .join('/')
      .match(/^src\/components\/[^/]+\/[^/]+\/docs\.tsx$/);

  function reloadOnChange(server: ViteDevServer, file: string, event: 'add' | 'unlink' | 'change') {
    if (!isPage(file)) return;
    if (event === 'change') {
      let meta: string;
      try {
        meta = JSON.stringify(readMeta(file));
      } catch {
        return; // 正在编辑、meta 暂时不完整：等写完再说
      }
      if (metas.get(normalize(file)) === meta) return;
    }
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
          const [, , category, name] = path.split('/');
          const meta = readMeta(file);
          metas.set(normalize(file), JSON.stringify(meta));
          return `{ category: ${JSON.stringify(category)}, name: ${JSON.stringify(name)}, meta: ${JSON.stringify(meta)}, load: () => import(${JSON.stringify(`/${path}`)}) }`;
        });
      return `export default [\n  ${entries.join(',\n  ')}\n];\n`;
    },
    configureServer(server) {
      server.watcher.on('add', (file) => reloadOnChange(server, file, 'add'));
      server.watcher.on('unlink', (file) => reloadOnChange(server, file, 'unlink'));
      server.watcher.on('change', (file) => reloadOnChange(server, file, 'change'));
    },
  };
}
