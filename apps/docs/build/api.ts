/**
 * 从组件库的类型与 JSDoc 生成 API 文档的数据：`import api from 'virtual:api/ButtonProps'`。
 *
 * 读的是写代码时就有的信息，不另外手写：
 * - 每个 prop 的类型、必填、说明（JSDoc）、`@default` 标签；
 * - 档位类的类型（`keyof ButtonVariants`、`TextSize`）展开成可选值，每个值带上接口里那个键的注释；
 * - 组件实现的参数解构里的默认值（`type = 'button'`）与 `_bindable(…)`（可以 `_bind` 双向绑定）；
 * - 接口自己的注释（“未声明的属性落到 button 上”）。
 * 只列组件库里声明的 prop；继承来的原生属性与通用的 sx 不逐条列出。
 *
 * 用 TypeScript 7 的程序化 API（typescript/sync）：程序与检查器在 tsc 子进程里，这里同步调用。程序只建一次，
 * 组件库的源码变了，下次读取时重建（热更新时 API 表跟着变）。提取放在 Worker 线程里（api-worker.ts），
 * 开发服务器启动时就开始建程序，期间照常响应其他请求。
 * 提取结果按源码哈希存在磁盘上（apiCache），源码没变时重启、再次构建都直接读，不建程序。
 */
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { version as typescriptVersion } from 'typescript';
import * as ts from 'typescript/ast';
import { API, SymbolFlags, type Checker, type Program, type Symbol } from 'typescript/sync';
import type { Plugin } from 'vite';
import type { ApiProp, ApiPropKinds, ApiValue, ComponentApi } from '@vue-tsx-pro/ui/docs-kit';

// vite.config 把 fs 映射成浏览器里的替身（演练场的 Babel 要用），测试加载本文件时也会被映射：直接取 Node 的内置模块
const { existsSync, globSync, mkdirSync, readFileSync, rmSync, writeFileSync } =
  process.getBuiltinModule('node:fs');

const ui = resolve(dirname(fileURLToPath(import.meta.url)), '../../../packages/ui');
const src = join(ui, 'src').split('\\').join('/');
/** 部件属性的通用部分（sx）声明在这里：不逐条列出 */
const PART_PROPS_FILE = `${src}/utils/props.ts`;

/** 组件库的 package.json：入口登记在它的 exports 里 */
const MANIFEST = join(ui, 'package.json').split('\\').join('/');

/** 组件库的全部入口：导入路径（@vue-tsx-pro/ui/patterns）与源码文件（相对 src） */
function readEntries() {
  const exports = JSON.parse(readFileSync(MANIFEST, 'utf8')).exports as Record<string, unknown>;
  return Object.entries(exports).flatMap(([key, target]) =>
    typeof target === 'object' && target !== null
      ? [
          {
            name: `@vue-tsx-pro/ui${key.slice(1)}`,
            source: (target as Record<string, string>)['@vue-tsx-pro/source']!.replace(
              './src/',
              '',
            ),
          },
        ]
      : [],
  );
}

/** 当前程序的入口：每次重建程序时重读，加了子路径不用重启开发服务器 */
let entries = readEntries();
let api: API | undefined;
let program: Program | undefined;
/** 当前程序里各入口导出的名字 → 符号（别名已解开）与导出它的入口；同名时取先登记的入口 */
let exported = new Map<string, { symbol: Symbol; entry: string }>();
let stale = true;

/** 组件库源码变了：下次读取时重建程序 */
export function invalidateProgram(): void {
  stale = true;
}

/** 提前建好程序（Worker 空闲时做），之后提取 API 不用等 */
export function warmProgram(): void {
  currentProgram();
}

function currentProgram(): Program {
  if (program && !stale) return program;
  api ??= new API();
  const { options } = api.parseConfigFile(join(ui, 'tsconfig.json'));
  // 只从入口出发：tsconfig 里的测试文件会把 vitest、playwright 的类型也拉进来，程序大一倍
  entries = readEntries();
  program?.getProject().dispose();
  program = api.createProgram(
    entries.map((entry) => `${src}/${entry.source}`),
    options,
  );
  exported = exportTable(api, program);
  stale = false;
  return program;
}

// 每次调用检查器都是一次跨进程往返：导出表建程序时一次取齐，一批符号的注释用 api.batch 一次取回
function exportTable(api: API, program: Program) {
  const { checker } = program.getProject();
  const table = new Map<string, { symbol: Symbol; entry: string }>();
  for (const entry of entries) {
    const file = program.getSourceFile(`${src}/${entry.source}`)!;
    for (const symbol of checker.getExportsOfModule(checker.getSymbolAtLocation(file)!)) {
      if (!table.has(symbol.name)) table.set(symbol.name, { symbol, entry: entry.name });
    }
  }
  const aliases = [...table.values()].filter(({ symbol }) => symbol.flags & SymbolFlags.Alias);
  const targets = api.batch(...aliases.map(({ symbol }) => checker.getAliasedSymbol.gen(symbol)));
  aliases.forEach((item, index) => (item.symbol = targets[index]!));
  return table;
}

const currentChecker = (): Checker => currentProgram().getProject().checker;

const docOf = (symbol: Symbol, checker: Checker) => symbol.getDocumentationComment(checker).trim();

const docsOf = (symbols: readonly Symbol[], checker: Checker) =>
  api!
    .batch(...symbols.map((symbol) => checker.getDocumentationCommentOfSymbol.gen(symbol)))
    .map((doc) => doc.trim());

/** 符号的声明里第一个满足条件的语法树节点（声明是句柄，按需从程序取回） */
function declarationOf<T extends ts.Node>(
  symbol: Symbol,
  is: (node: ts.Node) => node is T,
): T | undefined {
  for (const handle of symbol.declarations) {
    const node = handle.resolve();
    if (node && is(node)) return node;
  }
  return undefined;
}

const fileOf = (node: ts.Node) => node.getSourceFile().fileName.split('\\').join('/');

const resolveAlias = (symbol: Symbol | undefined, checker: Checker) =>
  symbol && symbol.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;

/**
 * 成员按源码里写的顺序：自己的成员在前，再按 extends 的顺序展开基类型；交叉、联合逐个展开，
 * Omit、Pick 这类工具类型展开第一个类型参数。检查器给出的属性顺序是实现细节（TypeScript 6、7 就不一样），
 * 文档表不跟着它变
 */
function memberOrder(symbol: Symbol, checker: Checker, seen = new Set<number>()): string[] {
  if (seen.has(symbol.id)) return [];
  seen.add(symbol.id);
  const ofType = (node: ts.TypeNode): string[] => {
    if (ts.isTypeLiteralNode(node)) return memberNames(node.members);
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node))
      return node.types.flatMap(ofType);
    if (ts.isParenthesizedTypeNode(node)) return ofType(node.type);
    if (ts.isTypeReferenceNode(node)) return ofReference(node.typeName, node.typeArguments);
    return [];
  };
  const ofReference = (name: ts.Node, typeArguments?: ts.NodeArray<ts.TypeNode>) => {
    const target = resolveAlias(checker.getSymbolAtLocation(name), checker);
    const first = typeArguments?.[0];
    return [...(target ? memberOrder(target, checker, seen) : []), ...(first ? ofType(first) : [])];
  };
  return symbol.declarations.flatMap((handle) => {
    const node = handle.resolve();
    if (node && ts.isTypeAliasDeclaration(node)) return ofType(node.type);
    if (!node || !ts.isInterfaceDeclaration(node)) return [];
    const bases = (node.heritageClauses ?? []).flatMap((clause) =>
      clause.types.flatMap((type) =>
        ts.isTypeReferenceNode(type)
          ? ofType(type)
          : ofReference(type.expression, type.typeArguments),
      ),
    );
    return [...memberNames(node.members), ...bases];
  });
}

const memberNames = (members: ts.NodeArray<ts.TypeElement>) =>
  members.flatMap((member) => ts.getNameOfDeclaration(member)?.getText() ?? []);

/** 按 memberOrder 排序；顺序里找不到的排在最后，保持原来的相对顺序 */
function sortByOrder<T>(items: T[], order: string[], nameOf: (item: T) => string): T[] {
  const rank = new Map<string, number>();
  order.forEach((name, index) => rank.has(name) || rank.set(name, index));
  const of = (item: T) => rank.get(nameOf(item)) ?? order.length;
  return items.sort((a, b) => of(a) - of(b));
}

/** 组件的符号；入口没有导出这个名字时 undefined */
const componentSymbol = (name: string): Symbol | undefined => exported.get(name)?.symbol;

/** 组件库入口（含子路径）导出的名字 → 符号 */
function exportedSymbol(name: string): Symbol {
  const symbol = componentSymbol(name);
  if (symbol) return symbol;
  throw new Error(
    `@vue-tsx-pro/ui 的入口（${entries.map((entry) => entry.name).join('、')}）都没有导出 ${name}`,
  );
}

/** 档位类型展开成可选值：`keyof X` 取 X 的键与注释；类型别名顺着找；字面量联合直接列出 */
function valuesOf(
  node: ts.TypeNode | undefined,
  checker: Checker,
  depth = 0,
): ApiValue[] | undefined {
  if (!node || depth > 3) return undefined;
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword) {
    const properties = checker.getPropertiesOfType(checker.getTypeFromTypeNode(node.type));
    const descriptions = docsOf(properties, checker);
    const values = properties.map((property, index) => ({
      value: property.name,
      description: descriptions[index]!,
    }));
    const target =
      ts.isTypeReferenceNode(node.type) &&
      resolveAlias(checker.getSymbolAtLocation(node.type.typeName), checker);
    return target
      ? sortByOrder(values, memberOrder(target, checker), (item) => item.value)
      : values;
  }
  if (ts.isTypeReferenceNode(node)) {
    const resolved = resolveAlias(checker.getSymbolAtLocation(node.typeName), checker);
    const alias = resolved && declarationOf(resolved, ts.isTypeAliasDeclaration);
    return alias ? valuesOf(alias.type, checker, depth + 1) : undefined;
  }
  if (ts.isUnionTypeNode(node)) {
    const literals = node.types.flatMap((type) =>
      ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal) ? [type.literal.text] : [],
    );
    // 联合里混着别的类型（如 TextSize | number）时只展开其中的档位
    const nested = node.types.flatMap((type) => valuesOf(type, checker, depth + 1) ?? []);
    const values = [...literals.map((value) => ({ value, description: '' })), ...nested];
    return values.length ? values : undefined;
  }
  return undefined;
}

/** 组件实现的参数解构：prop → 默认值的源码、是否 _bindable */
function implementationDefaults(componentName: string) {
  const defaults = new Map<string, { value?: string; bindable: boolean }>();
  const symbol = componentSymbol(componentName);
  const call = symbol && declarationOf(symbol, ts.isVariableDeclaration)?.initializer;
  if (!call || !ts.isCallExpression(call)) return defaults;
  const setup = call.arguments[0];
  if (!setup || !(ts.isArrowFunction(setup) || ts.isFunctionExpression(setup))) return defaults;
  const pattern = setup.parameters[0]?.name;
  if (!pattern || !ts.isObjectBindingPattern(pattern)) return defaults;
  for (const element of pattern.elements) {
    const key = element.propertyName ?? element.name;
    const name = key && (ts.isIdentifier(key) || ts.isStringLiteral(key)) ? key.text : undefined;
    if (!name || !element.initializer) continue;
    const initializer = element.initializer;
    const isBindable =
      ts.isCallExpression(initializer) && initializer.expression.getText() === '_bindable';
    const expression = isBindable ? initializer.arguments[0] : initializer;
    defaults.set(name, {
      value: expression && withoutAssertions(expression).getText(),
      bindable: isBindable,
    });
  }
  return defaults;
}

/** 默认值里的类型断言只是给类型检查看的（_bindable(0 as V)）：表格里显示表达式本身 */
function withoutAssertions(node: ts.Expression): ts.Expression {
  while (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isTypeAssertion(node)) {
    node = node.expression;
  }
  return node;
}

function kindOf(name: string): keyof ApiPropKinds {
  if (/^props[A-Z]/.test(name)) return 'part';
  if (/^on[A-Z]/.test(name)) return 'event';
  if (name === 'children' || /^render[A-Z]/.test(name)) return 'content';
  return 'prop';
}

/**
 * Props 接口对应的组件：接口名去掉 Props（ButtonBaseProps → ButtonBase）；
 * 没有这个导出时是泛型组件的 XxxBaseProps，再去掉 Base（SelectBaseProps → Select）
 */
function componentOf(interfaceName: string): string {
  const component = interfaceName.replace(/Props$/, '');
  return componentSymbol(component) ? component : component.replace(/Base$/, '');
}

const isPropertyLike = (node: ts.Node) =>
  ts.isPropertySignatureDeclaration(node) || ts.isPropertyDeclaration(node);

/** 属性的声明按源码位置排：联合类型的同名 prop（单选、多选两种写法）以先写的那种为准 */
function sourceOrder(property: Symbol): ts.Node[] {
  return property.declarations
    .flatMap((handle) => handle.resolve() ?? [])
    .sort((a, b) => fileOf(a).localeCompare(fileOf(b)) || a.pos - b.pos);
}

/** 联合类型的同名 prop：各个声明的注释按源码顺序拼起来，相同的只留一份 */
function unionDoc(declarations: ts.Node[], checker: Checker): string {
  const docs = docsOf(
    declarations.map((node) => api!.getSymbol(node as ts.Declaration)),
    checker,
  );
  return [...new Set(docs.filter(Boolean))].join('\n');
}

/** 一个 Props 接口的 API 数据，默认值从对应组件的参数里读 */
export function extractComponentApi(interfaceName: string): ComponentApi {
  const checker = currentChecker();
  const symbol = exportedSymbol(interfaceName);
  if (!symbol.declarations.length) throw new Error(`找不到 ${interfaceName} 的声明`);
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  const component = componentOf(interfaceName);
  const defaults = implementationDefaults(component);

  // 继承来的原生属性只看声明在哪个文件，不取注释
  const declared = checker.getPropertiesOfType(type).flatMap((property) => {
    const declarations = sourceOrder(property);
    const file = declarations[0] && fileOf(declarations[0]);
    return file?.startsWith(src) && file !== PART_PROPS_FILE ? [{ property, declarations }] : [];
  });
  sortByOrder(declared, memberOrder(symbol, checker), ({ property }) => property.name);
  const symbols = declared.map(({ property }) => property);
  const descriptions = docsOf(symbols, checker);
  const tags = api!.batch(...symbols.map((property) => checker.getJsDocTagsOfSymbol.gen(property)));
  const props: ApiProp[] = declared.map(({ property, declarations }, index) => {
    const declaration = declarations[0]!;
    const typeNode = isPropertyLike(declaration) ? declaration.type : undefined;
    const tag = tags[index]!.find((item) => item.name === 'default');
    const implementation = defaults.get(property.name);
    return {
      name: property.name,
      kind: kindOf(property.name),
      type:
        typeNode?.getText().replace(/\s+/g, ' ') ??
        checker.typeToString(checker.getTypeOfSymbol(property)),
      required: !(property.flags & SymbolFlags.Optional),
      default: tag ? tag.text : implementation?.value,
      bindable: implementation?.bindable || undefined,
      description: declarations.length > 1 ? unionDoc(declarations, checker) : descriptions[index]!,
      values: valuesOf(typeNode, checker),
    };
  });
  // 说明取组件自己的注释（“按钮（button）：样式、色调…”），没有时才用接口的（“未声明的属性落到…上”这类）
  const componentDoc = componentSymbol(component);
  return {
    name: interfaceName,
    component,
    description: (componentDoc && docOf(componentDoc, checker)) || docOf(symbol, checker),
    props,
  };
}

/** 组件目录里的一项：组件名、从哪个入口导入、所在分类（源码目录）与 API 数据 */
export interface CatalogEntry {
  name: string;
  entry: string;
  category: string;
  api: ComponentApi;
}

/** 各入口导出的组件：同一个入口同时导出了值 Xxx 与接口 XxxProps 的都算，按组件名排序 */
export function extractCatalog(): CatalogEntry[] {
  currentProgram();
  const entryOf = (name: string) => exported.get(name)?.entry;
  const catalog: CatalogEntry[] = [];
  for (const name of [...exported.keys()].sort()) {
    const component = name.replace(/Props$/, '');
    if (component === name || !/^[A-Z]/.test(component) || entryOf(component) !== entryOf(name))
      continue;
    const declaration = exportedSymbol(component).declarations[0]?.resolve();
    const path = declaration && fileOf(declaration);
    if (!path?.startsWith(src)) continue;
    const api = extractComponentApi(name);
    // 演练场只调属性与内容：部件属性、事件不进目录，数据小一半
    const props = api.props.filter((prop) => prop.kind === 'prop' || prop.kind === 'content');
    catalog.push({
      name: component,
      entry: entryOf(component)!,
      category: path.slice(src.length + 1).split('/')[0]!,
      api: { ...api, props },
    });
  }
  return catalog;
}

const PREFIX = 'virtual:api/';
const CATALOG = 'virtual:api-catalog';

/** 发给 api-worker.ts 的请求：接口名（`ButtonProps`）或整个目录；回复是模块代码 */
export type ApiRequest = { id: number; interfaceName?: string };
export type ApiResponse = { id: number; code: string } | { id: number; error: string };

/** 在 Worker 线程里提取 API；Worker 第一次用到时才启动 */
function apiWorker() {
  let worker: Worker | undefined;
  let nextId = 0;
  let rebuild: ReturnType<typeof setTimeout> | undefined;
  const pending = new Map<
    number,
    { resolve: (code: string) => void; reject: (error: Error) => void }
  >();

  const current = () => {
    if (worker) return worker;
    worker = new Worker(new URL('./api-worker.ts', import.meta.url));
    worker.unref();
    worker.on('message', (response: ApiResponse) => {
      const request = pending.get(response.id);
      pending.delete(response.id);
      if ('error' in response) request?.reject(new Error(response.error));
      else request?.resolve(response.code);
    });
    worker.on('error', (error) => {
      for (const request of pending.values()) request.reject(error);
      pending.clear();
      worker = undefined;
    });
    return worker;
  };

  return {
    /** 接口的 API 数据（不传接口名时是组件目录），返回模块代码 */
    load: (interfaceName?: string) =>
      new Promise<string>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        current().postMessage({ id, interfaceName } satisfies ApiRequest);
      }),
    /** 源码变了：马上作废程序；连着保存几个文件时停下来半秒再在后台重建，不一次次重建 */
    invalidate: () => {
      current().postMessage('invalidate');
      clearTimeout(rebuild);
      rebuild = setTimeout(() => current().postMessage('warm'), 500);
    },
    /** 提前建好程序 */
    warm: () => current().postMessage('warm'),
    /** 构建结束、服务器关闭：停掉 Worker，不留它在后台建程序 */
    close: () => {
      clearTimeout(rebuild);
      void worker?.terminate();
      worker = undefined;
    },
  };
}

/**
 * 提取结果存在 cacheDir/docs-api/<源码哈希> 下：重启开发服务器、再次构建时直接读，不用等 Worker 建几秒的
 * TypeScript 程序。哈希取组件库与 tsx 包的源码、本文件与 TypeScript 的版本，源码一改就换目录，旧目录删掉
 */
function apiCache(cacheDir: string) {
  const root = join(cacheDir, 'docs-api');
  let dir: string | undefined;
  const current = () => (dir ??= join(root, sourceHash()));
  const file = (name: string) => join(current(), `${name}.js`);
  return {
    /** 当前源码已经有缓存（不必预热 Worker） */
    has: () => existsSync(current()),
    read(name: string) {
      try {
        return readFileSync(file(name), 'utf8');
      } catch {
        return undefined;
      }
    },
    write(name: string, code: string) {
      try {
        if (!existsSync(current())) {
          rmSync(root, { recursive: true, force: true });
          mkdirSync(current(), { recursive: true });
        }
        writeFileSync(file(name), code);
      } catch {
        // 写不了就下次重新提取
      }
    },
    /** 源码变了：下次读写时重新算哈希 */
    invalidate: () => (dir = undefined),
  };
}

function sourceHash() {
  const hash = createHash('sha1')
    .update(typescriptVersion)
    .update(readFileSync(fileURLToPath(import.meta.url)));
  const tsx = join(ui, '../tsx');
  const files = [
    ...globSync('src/**/*.{ts,tsx}', { cwd: ui }).map((path) => join(ui, path)),
    ...globSync('{src,types}/**/*.ts', { cwd: tsx }).map((path) => join(tsx, path)),
  ].sort();
  for (const path of files) hash.update(path).update(readFileSync(path));
  return hash.digest('hex').slice(0, 16);
}

/**
 * Vite 插件：`virtual:api/<接口名>` 导出那个接口的 API 数据，`virtual:api-catalog` 导出全部组件的目录（组件演练场用）；
 * 组件库源码变了重新生成
 */
export function componentApi(): Plugin {
  const worker = apiWorker();
  const loaded = new Set<string>();
  let cache: ReturnType<typeof apiCache> | undefined;
  const load = async (name: string, interfaceName?: string) => {
    const cached = cache?.read(name);
    if (cached !== undefined) return cached;
    const code = await worker.load(interfaceName);
    cache?.write(name, code);
    return code;
  };
  return {
    name: 'docs:component-api',
    configResolved(config) {
      cache = apiCache(config.cacheDir);
    },
    resolveId: (id) => (id.startsWith(PREFIX) || id === CATALOG ? `\0${id}` : undefined),
    load(id) {
      if (id === `\0${CATALOG}`) {
        loaded.add(id);
        return load('catalog');
      }
      if (!id.startsWith(`\0${PREFIX}`)) return;
      loaded.add(id);
      const interfaceName = id.slice(PREFIX.length + 1);
      return load(interfaceName, interfaceName);
    },
    // 构建结束、开发服务器与测试的服务器关闭时都会调用：停掉 Worker。
    // 只 unref 不够：Worker 的消息端口仍会拖住进程，构建、测试结束后不退出
    closeBundle: () => worker.close(),
    configureServer(server) {
      // Vitest 的服务器没有 httpServer：不预热、不监听文件
      if (!server.httpServer) return;
      // 当前源码已有缓存时不必预热：页面直接读缓存，源码改了才需要程序
      if (!cache?.has()) worker.warm();
      // 组件库源码在 docs 根目录之外：Vite 只监听页面加载过的文件，没打开过的入口（three/index.ts）改了收不到，
      // API 数据就一直是旧的。整个源码目录都监听上；package.json 改了 exports（加子路径）也要重建
      server.watcher.add([src, MANIFEST]);
      server.watcher.on('change', (file) => {
        const path = file.split('\\').join('/');
        if (!path.startsWith(src) && path !== MANIFEST) return;
        worker.invalidate();
        cache?.invalidate();
        for (const id of loaded) {
          const module = server.moduleGraph.getModuleById(id);
          if (module) server.moduleGraph.invalidateModule(module);
        }
      });
    },
  };
}
