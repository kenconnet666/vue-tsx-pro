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
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { Plugin } from 'vite';
import type { ApiProp, ApiPropKinds, ApiValue, ComponentApi } from '@vue-tsx-pro/ui';

const ui = resolve(dirname(fileURLToPath(import.meta.url)), '../../../packages/ui');
const src = join(ui, 'src').split('\\').join('/');
/** 部件属性的通用部分（sx）声明在这里：不逐条列出 */
const PART_PROPS_FILE = `${src}/utils/props.ts`;

let program: ts.Program | undefined;
let stale = true;

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
  program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
    oldProgram: program,
  });
  stale = false;
  return program;
}

const docOf = (symbol: ts.Symbol, checker: ts.TypeChecker) =>
  ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();

/** 有组件的入口：主入口与子路径（图表在 @vue-tsx-pro/ui/charts） */
const ENTRIES = ['index.ts', 'charts/index.ts'];

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
    const value = isBindable ? initializer.arguments[0]?.getText() : initializer.getText();
    defaults.set(name, { value, bindable: isBindable });
  }
  return defaults;
}

function kindOf(name: string): keyof ApiPropKinds {
  if (/^props[A-Z]/.test(name)) return 'part';
  if (/^on[A-Z]/.test(name)) return 'event';
  if (name === 'children' || /^render[A-Z]/.test(name)) return 'content';
  return 'prop';
}

/** 一个 Props 接口的 API 数据；组件名默认是接口名去掉 Props */
export function extractComponentApi(interfaceName: string): ComponentApi {
  const checker = currentProgram().getTypeChecker();
  const symbol = exportedSymbol(checker, interfaceName);
  const declaration = symbol.declarations?.[0];
  if (!declaration) throw new Error(`找不到 ${interfaceName} 的声明`);
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  const defaults = implementationDefaults(checker, interfaceName.replace(/Props$/, ''));

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
    description: docOf(symbol, checker),
    props,
  };
}

const PREFIX = 'virtual:api/';

/** Vite 插件：`virtual:api/<接口名>` 导出那个接口的 API 数据；组件库源码变了重新生成 */
export function componentApi(): Plugin {
  const loaded = new Set<string>();
  return {
    name: 'docs:component-api',
    resolveId: (id) => (id.startsWith(PREFIX) ? `\0${id}` : undefined),
    load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return;
      loaded.add(id);
      const api = extractComponentApi(id.slice(PREFIX.length + 1));
      return `export default ${JSON.stringify(api)};\n`;
    },
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (!file.split('\\').join('/').startsWith(src)) return;
        stale = true;
        for (const id of loaded) {
          const module = server.moduleGraph.getModuleById(id);
          if (module) server.moduleGraph.invalidateModule(module);
        }
      });
    },
  };
}
