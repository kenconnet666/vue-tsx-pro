/**
 * 主题 tokens 的字符串写法（COMPONENTS.md §4）：stylex.create / stylex.keyframes 里的
 *   fontSize: '_xs'          短写，按对照表（stylex/token-map.ts）找组 → fontSizes.xs
 *   width: '_space.md'      带组名，任何属性都能用（跨组取值）→ space.md
 *   minHeight: 'max(_control, _minTarget)'  值里夹着 token → 模板字符串（拼接、计算、多值）
 * 改写成 token 变量并补上 import。在 StyleX 编译之前运行，StyleX 看到的就是手写 import 的变量；
 * 组件库构建不编译 StyleX，也要做这一步，产物里才不会留下字符串。
 */
import { transformAsync, types as t, type NodePath, type PluginObj } from '@babel/core';
import { TOKEN_GROUP_OF } from '../stylex/token-map.ts';
import { parserPlugins } from './ast.ts';
import { fail } from './errors.ts';

/** token 模块：生成的 import 写哪个路径，以及各组有哪些 token */
export interface TokenModule {
  /** 生成的 import 语句里写的路径：同包为相对路径，其他包为包名 */
  importPath: string;
  /** 组名 → 该组的 token 名，用来报错与列出可用的 token */
  groups: ReadonlyMap<string, ReadonlySet<string>>;
}

/** 按需取 token 模块（只有文件里真的用到字符串写法才去找）；找不到时返回 null */
export type TokenModuleLoader = () => TokenModule | null;

const STYLEX_SOURCES = new Set(['@stylexjs/stylex', '@vue-tsx-pro/tsx/stylex']);
const STYLE_FUNCTIONS = new Set(['create', 'keyframes']);
const TOKEN = /^_(?:(\w+)\.)?(\w+)$/;

/**
 * 把 stylex.create / keyframes 里的 token 字符串（'_xs'、'_space.md'、'calc(-1 * _sm)'）改写成 token 变量，
 * 并补上 import；没有这种写法时返回 null，写错时抛出带代码帧的错误。
 */
export async function compileTokens(code: string, filename: string, load: TokenModuleLoader) {
  if (
    !/(?<![\w$.-])_[A-Za-z]/.test(code) ||
    !/@stylexjs\/stylex|@vue-tsx-pro\/tsx\/stylex/.test(code)
  ) {
    return null;
  }
  const state = { changed: false };
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    parserOpts: { plugins: parserPlugins(filename) },
    plugins: [() => tokensBabelPlugin(load, state)],
  });
  if (!result || !state.changed) return null;
  return { code: result.code ?? '', map: result.map };
}

function tokensBabelPlugin(load: TokenModuleLoader, state: { changed: boolean }): PluginObj {
  return {
    name: 'vue-tsx-pro-tokens',
    visitor: {
      Program(program) {
        const calls = styleCalls(program);
        if (!calls.length) return;
        const rewriter = new TokenRewriter(program, load);
        for (const call of calls) rewriter.rewriteCall(call);
        state.changed = rewriter.insertImport();
      },
    },
  };
}

/** 文件里所有 stylex.create(…) / create(…)（以及 keyframes），只认从 StyleX 入口导入的 */
function styleCalls(program: NodePath<t.Program>) {
  const namespaces = new Set<string>();
  const named = new Set<string>();
  for (const statement of program.node.body) {
    if (!t.isImportDeclaration(statement) || !STYLEX_SOURCES.has(statement.source.value)) continue;
    for (const specifier of statement.specifiers) {
      if (!t.isImportSpecifier(specifier)) namespaces.add(specifier.local.name);
      else if (STYLE_FUNCTIONS.has(importedName(specifier))) named.add(specifier.local.name);
    }
  }
  const calls: NodePath<t.CallExpression>[] = [];
  program.traverse({
    CallExpression(path) {
      const callee = path.node.callee;
      const matches = t.isIdentifier(callee)
        ? named.has(callee.name)
        : t.isMemberExpression(callee) &&
          !callee.computed &&
          t.isIdentifier(callee.object) &&
          namespaces.has(callee.object.name) &&
          t.isIdentifier(callee.property) &&
          STYLE_FUNCTIONS.has(callee.property.name);
      if (matches) calls.push(path);
    },
  });
  return calls;
}

const importedName = (specifier: t.ImportSpecifier) =>
  t.isIdentifier(specifier.imported) ? specifier.imported.name : specifier.imported.value;

class TokenRewriter {
  private module: TokenModule | null | undefined;

  /** 组名 → 本文件里导入后的本地名 */
  private locals = new Map<string, t.Identifier>();

  private program: NodePath<t.Program>;

  private load: TokenModuleLoader;

  constructor(program: NodePath<t.Program>, load: TokenModuleLoader) {
    this.program = program;
    this.load = load;
  }

  /** create({ 组: 样式 | (参数) => 样式 }) 与 keyframes({ from: 样式, '50%': 样式 }) */
  rewriteCall(call: NodePath<t.CallExpression>) {
    const argument = call.get('arguments')[0];
    if (!argument?.isObjectExpression()) return;
    for (const entry of argument.get('properties')) {
      if (!entry.isObjectProperty()) continue;
      const value = entry.get('value');
      if (value.isObjectExpression()) this.rewriteStyles(value);
      else if (value.isArrowFunctionExpression() || value.isFunctionExpression()) {
        for (const styles of returnedObjects(value)) this.rewriteStyles(styles);
      }
    }
  }

  insertImport() {
    if (!this.locals.size) return false;
    const specifiers = [...this.locals].map(([group, local]) =>
      t.importSpecifier(local, t.identifier(group)),
    );
    this.program.unshiftContainer(
      'body',
      t.importDeclaration(specifiers, t.stringLiteral(this.module!.importPath)),
    );
    return true;
  }

  /** 一组样式：键是 CSS 属性，或嵌套样式的伪元素（'::before'）、伪类与 @ 规则 */
  private rewriteStyles(styles: NodePath<t.ObjectExpression>) {
    for (const entry of styles.get('properties')) {
      if (!entry.isObjectProperty() || entry.node.computed) continue;
      const key = entry.node.key;
      const name = t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : null;
      if (name == null) continue;
      const value = entry.get('value');
      if (/^[:@]/.test(name)) {
        if (value.isObjectExpression()) this.rewriteStyles(value);
      } else {
        this.rewriteValue(name, value);
      }
    }
  }

  /** 属性值：字符串、回退数组、按条件取值的对象（条件可嵌套）、动态样式里的三元表达式 */
  private rewriteValue(property: string, value: NodePath<t.Node | null | undefined>) {
    if (value.isStringLiteral()) {
      const replacement = this.rewriteString(property, value.node.value, value);
      if (replacement) value.replaceWith(replacement);
    } else if (value.isArrayExpression()) {
      for (const element of value.get('elements')) this.rewriteValue(property, element);
    } else if (value.isObjectExpression()) {
      for (const entry of value.get('properties')) {
        if (entry.isObjectProperty()) this.rewriteValue(property, entry.get('value'));
      }
    } else if (value.isConditionalExpression()) {
      this.rewriteValue(property, value.get('consequent'));
      this.rewriteValue(property, value.get('alternate'));
    }
  }

  /**
   * 整个值是一个 token → 成员访问；值里夹着 token（`max(_control, _minTarget)`、`'_sm _md'`）
   * → 模板字符串，与手写 `` `max(${sizes.control}, …)` `` 相同。没有 token 时返回 null，原样保留
   */
  private rewriteString(property: string, text: string, path: NodePath) {
    if (TOKEN.test(text)) return this.resolve(property, text, path);
    const references = embeddedTokens(text);
    if (!references.length) {
      if (!text.startsWith('_')) return null;
      throw fail(path, `'${text}' 不是主题 token 的写法：短写 '_xs'，或带组名 '_space.md'`);
    }
    const parts: string[] = [];
    let last = 0;
    for (const { start, end } of references) {
      parts.push(text.slice(last, start));
      last = end;
    }
    parts.push(text.slice(last));
    const quasis = parts.map((cooked, index) =>
      t.templateElement({ raw: escapeTemplate(cooked), cooked }, index === parts.length - 1),
    );
    const expressions = references.map(({ token }) => this.resolve(property, token, path));
    return t.templateLiteral(quasis, expressions);
  }

  private resolve(property: string, text: string, path: NodePath) {
    const [, explicitGroup, name] = TOKEN.exec(text) as unknown as [
      string,
      string | undefined,
      string,
    ];
    const group = explicitGroup ?? TOKEN_GROUP_OF.get(property);
    if (!group) {
      // 列出真正有这个 token 的组，直接给出能用的写法
      const owners = [...this.tokenModule(path).groups]
        .filter(([, names]) => names.has(name))
        .map(([owner]) => `'_${owner}.${name}'`);
      const suggestion = owners.length ? owners.join(' 或 ') : `'_组名.${name}'`;
      throw fail(path, `${property} 不在 token 对照表里，没有短写；请写带组名的 ${suggestion}`);
    }
    const module = this.tokenModule(path);
    const tokens = module.groups.get(group);
    if (!tokens) {
      const available = [...module.groups.keys()].join('、');
      throw fail(path, `没有名为 ${group} 的 token 组（可用：${available}）`);
    }
    if (!tokens.has(name)) {
      const prefix = explicitGroup ? `_${group}.` : '_';
      const available = [...tokens].map((token) => `'${prefix}${token}'`).join('、');
      throw fail(path, `${group} 里没有 ${name}（可用：${available}）`);
    }
    return t.memberExpression(t.identifier(this.local(group).name), t.identifier(name));
  }

  private tokenModule(path: NodePath) {
    if (this.module === undefined) this.module = this.load();
    if (!this.module) {
      throw fail(
        path,
        '找不到主题 tokens 模块，无法解析 token 写法（见 vueTsxPro 的 tokens 选项）',
      );
    }
    return this.module;
  }

  private local(group: string) {
    let local = this.locals.get(group);
    if (!local) {
      local = this.program.scope.generateUidIdentifier(group);
      this.locals.set(group, local);
    }
    return local;
  }
}

/** 动态样式函数返回的样式对象：`(w) => ({ … })` 或函数体里 return 的对象 */
function returnedObjects(fn: NodePath<t.ArrowFunctionExpression | t.FunctionExpression>) {
  const body = fn.get('body');
  if (body.isObjectExpression()) return [body];
  const objects: NodePath<t.ObjectExpression>[] = [];
  body.traverse({
    Function(inner) {
      inner.skip();
    },
    ReturnStatement(statement) {
      const argument = statement.get('argument');
      if (argument.isObjectExpression()) objects.push(argument);
    },
  });
  return objects;
}

/**
 * 值里夹着的 token：前后不能紧挨字母、数字、`-`、`.`（`foo_bar`、`--_x` 不算），
 * 引号里的文字（content 属性）与 url(…) 里的路径不处理
 */
const EMBEDDED_TOKEN = /(?<![\w$.-])_[A-Za-z]\w*(?:\.[A-Za-z]\w*)?(?![\w-])/g;
const LITERAL_REGION = /(["'])(?:\\.|(?!\1).)*\1|url\([^)]*\)/g;

function embeddedTokens(text: string) {
  const skipped = [...text.matchAll(LITERAL_REGION)].map((match) => [
    match.index,
    match.index + match[0].length,
  ]);
  return [...text.matchAll(EMBEDDED_TOKEN)]
    .filter((match) => !skipped.some(([from, to]) => match.index >= from! && match.index < to!))
    .map((match) => ({ token: match[0], start: match.index, end: match.index + match[0].length }));
}

/** 模板字符串的原文：反斜杠、反引号与 ${ 要转义 */
function escapeTemplate(text: string) {
  return text.replace(/\\|`|\$\{/g, (char) => `\\${char}`);
}
