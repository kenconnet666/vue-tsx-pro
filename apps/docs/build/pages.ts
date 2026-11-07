/**
 * `virtual:doc-pages`：收集 src/components/<分类>/<Name>/docs.tsx，生成组件页的清单（路由、侧栏、搜索、翻页都用它）。
 *
 * 每个文档页导出一个字面量的 meta（标题、简介、排序），这里在构建时静态读出，页面本身仍按需加载：
 *
 *   export const meta = { title: 'Button 按钮', description: '触发一个操作', order: 1 };
 *   export default _component(() => () => <DocPage …>…</DocPage>);
 *
 * 各个示例（<Example id title>）的锚点、标题，和说明里 <Code> 写到的属性名也一并读出，给站内搜索用。
 *
 * 新增、删除文档页时整页刷新；改了某页的 meta（标题、简介、排序）或示例的标题时也重新生成清单并刷新，只改正文时照常热更新。
 */
import { globSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  isJsxAttribute,
  isJsxElement,
  isJsxSelfClosingElement,
  isJsxText,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteralLikeNode,
  isVariableStatement,
  type JsxOpeningLikeElement,
  type Node,
  type SourceFile,
} from 'typescript/ast';
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
function readMeta(file: string, source: SourceFile): Record<string, string | number> {
  for (const statement of source.statements) {
    if (!isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(source) !== 'meta') continue;
      const object = declaration.initializer;
      if (!object || !isObjectLiteralExpression(object)) break;
      const meta: Record<string, string | number> = {};
      for (const property of object.properties) {
        if (!isPropertyAssignment(property)) continue;
        const value = property.initializer;
        if (isStringLiteralLikeNode(value)) meta[property.name.getText(source)] = value.text;
        else if (isNumericLiteral(value)) meta[property.name.getText(source)] = Number(value.text);
      }
      if (typeof meta.title !== 'string' || typeof meta.description !== 'string')
        throw new Error(`${file}：meta 要有字符串字面量的 title 与 description`);
      return meta;
    }
  }
  throw new Error(`${file}：没有导出 meta（标题、简介）`);
}

/** 一个示例：锚点、标题，和说明里 <Code> 写到的标识符（属性名、函数名），搜索时也能按它们找到 */
interface ExampleEntry {
  id: string;
  title: string;
  keywords: string[];
}

/** JSX 元素上写成字符串的属性 */
function stringAttribute(element: JsxOpeningLikeElement, name: string, source: SourceFile) {
  for (const attribute of element.attributes.properties) {
    if (!isJsxAttribute(attribute) || attribute.name.getText(source) !== name) continue;
    const value = attribute.initializer;
    if (value && isStringLiteralLikeNode(value)) return value.text;
  }
  return undefined;
}

const IDENTIFIER = /^_?[A-Za-z][\w]{2,}$/;

/** 示例说明里 <Code> 写到的标识符（去重） */
function codeWords(node: Node, source: SourceFile): string[] {
  const words = new Set<string>();
  const visit = (child: Node): void => {
    if (isJsxElement(child) && child.openingElement.tagName.getText(source) === 'Code') {
      const text = child.children
        .filter(isJsxText)
        .map((part) => part.getText(source))
        .join('')
        .trim();
      if (IDENTIFIER.test(text)) words.add(text);
    }
    child.forEachChild(visit);
  };
  node.forEachChild(visit);
  return [...words];
}

/** 页面里的各个示例 */
function readExamples(source: SourceFile): ExampleEntry[] {
  const examples: ExampleEntry[] = [];
  const visit = (node: Node): void => {
    const opening = isJsxElement(node)
      ? node.openingElement
      : isJsxSelfClosingElement(node)
        ? node
        : undefined;
    if (opening && opening.tagName.getText(source) === 'Example') {
      const id = stringAttribute(opening, 'id', source);
      const title = stringAttribute(opening, 'title', source);
      if (id && title) {
        examples.push({ id, title, keywords: isJsxElement(node) ? codeWords(node, source) : [] });
      }
    }
    node.forEachChild(visit);
  };
  visit(source);
  return examples;
}

/** 读一个文档页：meta 与各个示例 */
function readPage(file: string) {
  const source = parse(file);
  return { meta: readMeta(file, source), examples: readExamples(source) };
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
        meta = JSON.stringify(readPage(file));
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
          const page = readPage(file);
          metas.set(normalize(file), JSON.stringify(page));
          return `{ category: ${JSON.stringify(category)}, name: ${JSON.stringify(name)}, meta: ${JSON.stringify(page.meta)}, examples: ${JSON.stringify(page.examples)}, load: () => import(${JSON.stringify(`/${path}`)}) }`;
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
