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
 * TypeScript 程序只建一次；组件库的源码变了，下次读取时增量重建（热更新时 API 表跟着变）。
 * 建程序要几秒：Vite 插件把提取放在 Worker 线程里（api-worker.ts），开发服务器启动时就开始建，期间照常响应其他请求。
 * 提取结果按源码哈希存在磁盘上（apiCache），源码没变时重启、再次构建都直接读，不建程序。
 */
import { createHash } from 'node:crypto';
import { existsSync, globSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import ts from 'typescript';
import type { Plugin } from 'vite';
import type { ApiProp, ApiPropKinds, ApiValue, ComponentApi } from '@vue-tsx-pro/ui/docs-kit';

const ui = resolve(dirname(fileURLToPath(import.meta.url)), '../../../packages/ui');
const src = join(ui, 'src').split('\\').join('/');
/** 部件属性的通用部分（sx）声明在这里：不逐条列出 */
const PART_PROPS_FILE = `${src}/utils/props.ts`;

/** 有组件的入口：主入口与子路径（图表、3D、文档站组件） */
const ENTRIES = ['index.ts', 'charts/index.ts', 'three/index.ts', 'docs-kit/index.ts'];

let program: ts.Program | undefined;
let stale = true;

/** 组件库源码变了：下次读取时增量重建程序 */
export function invalidateProgram(): void {
  stale = true;
}

/** 提前建好程序与类型检查器（Worker 空闲时做），之后提取 API 不用等 */
export function warmProgram(): void {
  currentProgram().getTypeChecker();
}

// 解析过的文件按内容缓存：默认的编译器宿主每次重建都重新解析全部一千多个文件，改一个文件也要等几秒
const parsed = new Map<string, ts.SourceFile>();

function compilerHost(options: ts.CompilerOptions): ts.CompilerHost {
  const host = ts.createCompilerHost(options);
  const parse = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    const text = host.readFile(fileName);
    const cached = parsed.get(fileName);
    if (text !== undefined && cached?.text === text) return cached;
    const file = parse(fileName, languageVersion, onError, shouldCreate);
    if (file) parsed.set(fileName, file);
    return file;
  };
  return host;
}

function currentProgram(): ts.Program {
  if (program && !stale) return program;
  const configPath = join(ui, 'tsconfig.json');
  const config = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
      },
    },
  )!;
  // 只从入口出发：tsconfig 里的测试文件会把 vitest、playwright 的类型也拉进来，程序大一倍
  program = ts.createProgram({
    rootNames: ENTRIES.map((entry) => `${src}/${entry}`),
    options: config.options,
    host: compilerHost(config.options),
    oldProgram: program,
  });
  stale = false;
  return program;
}

const docOf = (symbol: ts.Symbol, checker: ts.TypeChecker) =>
  ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();

/** 组件库入口（含子路径）导出的名字 → 符号 */
function exportedSymbol(checker: ts.TypeChecker, name: string): ts.Symbol {
  for (const entry of ENTRIES) {
    const file = currentProgram().getSourceFile(`${src}/${entry}`)!;
    const module = checker.getSymbolAtLocation(file)!;
    const symbol = checker.getExportsOfModule(module).find((item) => item.name === name);
    if (symbol) {
      return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    }
  }
  throw new Error(`@vue-tsx-pro/ui 的入口（${ENTRIES.join('、')}）都没有导出 ${name}`);
}

/** 档位类型展开成可选值：`keyof X` 取 X 的键与注释；类型别名顺着找；字面量联合直接列出 */
function valuesOf(
  node: ts.TypeNode | undefined,
  checker: ts.TypeChecker,
  depth = 0,
): ApiValue[] | undefined {
  if (!node || depth > 3) return undefined;
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword) {
    const target = checker.getTypeFromTypeNode(node.type);
    return checker.getPropertiesOfType(target).map((property) => ({
      value: property.name,
      description: docOf(property, checker),
    }));
  }
  if (ts.isTypeReferenceNode(node)) {
    const symbol = checker.getSymbolAtLocation(node.typeName);
    const resolved =
      symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const alias = resolved?.declarations?.find(ts.isTypeAliasDeclaration);
    return alias ? valuesOf(alias.type, checker, depth + 1) : undefined;
  }
  if (ts.isUnionTypeNode(node)) {
    const literals = node.types.filter(
      (type): type is ts.LiteralTypeNode =>
        ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal),
    );
    // 联合里混着别的类型（如 TextSize | number）时只展开其中的档位
    const nested = node.types.flatMap((type) => valuesOf(type, checker, depth + 1) ?? []);
    const values = [
      ...literals.map((type) => ({
        value: (type.literal as ts.StringLiteral).text,
        description: '',
      })),
      ...nested,
    ];
    return values.length ? values : undefined;
  }
  return undefined;
}

/** 组件实现的参数解构：prop → 默认值的源码、是否 _bindable */
function implementationDefaults(checker: ts.TypeChecker, componentName: string) {
  const defaults = new Map<string, { value?: string; bindable: boolean }>();
  let symbol: ts.Symbol;
  try {
    symbol = exportedSymbol(checker, componentName);
  } catch {
    return defaults;
  }
  const declaration = symbol.declarations?.find(ts.isVariableDeclaration);
  const call = declaration?.initializer;
  if (!call || !ts.isCallExpression(call)) return defaults;
  const setup = call.arguments[0];
  if (!setup || !(ts.isArrowFunction(setup) || ts.isFunctionExpression(setup))) return defaults;
  const pattern = setup.parameters[0]?.name;
  if (!pattern || !ts.isObjectBindingPattern(pattern)) return defaults;
  for (const element of pattern.elements) {
    const key = element.propertyName ?? element.name;
    const name = ts.isIdentifier(key) || ts.isStringLiteral(key) ? key.text : undefined;
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
  while (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node)
  ) {
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
function componentOf(checker: ts.TypeChecker, interfaceName: string): string {
  const component = interfaceName.replace(/Props$/, '');
  try {
    exportedSymbol(checker, component);
    return component;
  } catch {
    return component.replace(/Base$/, '');
  }
}

/** 一个 Props 接口的 API 数据，默认值从对应组件的参数里读 */
export function extractComponentApi(interfaceName: string): ComponentApi {
  const checker = currentProgram().getTypeChecker();
  const symbol = exportedSymbol(checker, interfaceName);
  const declaration = symbol.declarations?.[0];
  if (!declaration) throw new Error(`找不到 ${interfaceName} 的声明`);
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  const component = componentOf(checker, interfaceName);
  const defaults = implementationDefaults(checker, component);

  const props: ApiProp[] = [];
  for (const property of checker.getPropertiesOfType(type)) {
    const propertyDeclaration = property.declarations?.[0];
    const file = propertyDeclaration?.getSourceFile().fileName.split('\\').join('/');
    if (!propertyDeclaration || !file?.startsWith(src) || file === PART_PROPS_FILE) continue;
    const typeNode =
      ts.isPropertySignature(propertyDeclaration) || ts.isPropertyDeclaration(propertyDeclaration)
        ? propertyDeclaration.type
        : undefined;
    const tag = property.getJsDocTags(checker).find((item) => item.name === 'default');
    const implementation = defaults.get(property.name);
    props.push({
      name: property.name,
      kind: kindOf(property.name),
      type:
        typeNode?.getText().replace(/\s+/g, ' ') ??
        checker.typeToString(checker.getTypeOfSymbol(property)),
      required: !(property.flags & ts.SymbolFlags.Optional),
      default: tag ? ts.displayPartsToString(tag.text) : implementation?.value,
      bindable: implementation?.bindable || undefined,
      description: docOf(property, checker),
      values: valuesOf(typeNode, checker),
    });
  }
  return {
    name: interfaceName,
    component,
    description: docOf(symbol, checker),
    props,
  };
}

/** 组件目录里的一项：组件名、所在分类（源码目录）与 API 数据 */
export interface CatalogEntry {
  name: string;
  category: string;
  api: ComponentApi;
}

/** 主入口导出的组件：同时导出了值 Xxx 与接口 XxxProps 的都算，按组件名排序 */
export function extractCatalog(): CatalogEntry[] {
  const checker = currentProgram().getTypeChecker();
  const file = currentProgram().getSourceFile(`${src}/index.ts`)!;
  const names = new Set(
    checker.getExportsOfModule(checker.getSymbolAtLocation(file)!).map((symbol) => symbol.name),
  );
  const entries: CatalogEntry[] = [];
  for (const name of [...names].sort()) {
    const component = name.replace(/Props$/, '');
    if (component === name || !/^[A-Z]/.test(component) || !names.has(component)) continue;
    const symbol = exportedSymbol(checker, component);
    const path = symbol.declarations?.[0]?.getSourceFile().fileName.split('\\').join('/');
    if (!path?.startsWith(src)) continue;
    const api = extractComponentApi(name);
    // 演练场只调属性与内容：部件属性、事件不进目录，数据小一半
    const props = api.props.filter((prop) => prop.kind === 'prop' || prop.kind === 'content');
    entries.push({
      name: component,
      category: path.slice(src.length + 1).split('/')[0]!,
      // 说明取组件自己的注释（“按钮（button）：样式、色调…”），没有时才用接口的
      api: { ...api, description: docOf(symbol, checker) || api.description, props },
    });
  }
  return entries;
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
    .update(ts.version)
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
      // API 数据就一直是旧的。整个源码目录都监听上
      server.watcher.add(src);
      server.watcher.on('change', (file) => {
        if (!file.split('\\').join('/').startsWith(src)) return;
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
