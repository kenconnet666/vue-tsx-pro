/**
 * 主题 tokens 的两种写法（COMPONENTS.md §4），改写成 token 变量并补上 import：
 *   fontSize: '_xs'          值整个是一个 token：短写，按对照表（stylex/token-map.ts）找组 → fontSizes.xs
 *   width: '_space.md'      带组名，任何属性都能用（跨组取值）→ space.md
 *   minHeight: `max(${t.sizes.control}, 24px)`  值里夹着 token：模板字符串里写 t.组.名 → sizes.control
 * 在 StyleX 编译之前运行，StyleX 看到的就是手写 import 的变量（它只认从 .stylex 文件直接导入的变量）；
 * 组件库构建不编译 StyleX，也要做这一步，产物里才不会留下字符串与 t。
 */
import { transformAsync, types as t, type NodePath, type PluginObject } from '@babel/core';
import { TOKEN_GROUP_OF } from '../stylex/token-map.ts';
import { languageOf, parserPlugins, STYLEX_SOURCES, type Binding } from './ast.ts';
import { needsTokens } from './detect.ts';
import type { SourceMap } from './compile.ts';
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

const STYLE_FUNCTIONS = new Set(['create', 'keyframes', 'recipe']);
const TOKEN = /^_(?:(\w+)\.)?(\w+)$/;

/**
 * 把 stylex.create / keyframes 里的 token 字符串（'_xs'、'_space.md'）与文件里的 t.组.名 改写成 token 变量，
 * 并补上 import；没有这些写法时返回 null，写错时抛出带代码帧的错误。
 */
export async function compileTokens(
  code: string,
  filename: string,
  load: TokenModuleLoader,
): Promise<{ code: string; map: SourceMap | null } | null> {
  if (!needsTokens(code)) return null;
  const state = { changed: false };
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    parserOpts: { plugins: parserPlugins(languageOf(filename)) },
    plugins: [() => tokensBabelPlugin(load, state)],
  });
  if (!result || !state.changed) return null;
  return { code: result.code ?? '', map: result.map ?? null };
}

export { needsTokens };

/** token 写法的 Babel 插件；state.changed 记下有没有改写 */
export function tokensBabelPlugin(
  load: TokenModuleLoader,
  state = { changed: false },
): PluginObject {
  return {
    name: 'vue-tsx-pro-tokens',
    visitor: {
      Program(program) {
        const rewriter = new TokenRewriter(program, load);
        const rewroteTokenObject = rewriter.rewriteTokenObject();
        for (const call of styleCalls(program)) rewriter.rewriteCall(call);
        state.changed = rewriter.insertImport() || rewroteTokenObject;
      },
    },
  };
}

/** 文件里所有 stylex.create(…) / create(…)（以及 keyframes），只认从 StyleX 入口导入的 */
function styleCalls(program: NodePath<t.Program>) {
  const namespaces = new Set<string>();
  const named = new Set<string>();
  for (const statement of program.node.body) {
    if (!t.isImportDeclaration(statement) || !STYLEX_SOURCES.includes(statement.source.value))
      continue;
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

  private readonly load: TokenModuleLoader;

  constructor(program: NodePath<t.Program>, load: TokenModuleLoader) {
    this.program = program;
    this.load = load;
  }

  /**
   * 文件里所有的 t.组.名 → 组变量的成员访问（与字符串写法共用一份 import）。整个文件都改写，
   * 写在 create 外面的常量 StyleX 也能求值；t 没有别的用处时删掉它的导入。返回有没有改写
   */
  rewriteTokenObject() {
    let changed = false;
    for (const binding of this.tokenObjectBindings()) {
      const references = binding.referencePaths;
      let rewritten = 0;
      for (const reference of references) {
        const group = reference.parentPath;
        const token = group?.parentPath;
        if (!group?.isMemberExpression({ object: reference.node })) continue;
        if (!token?.isMemberExpression({ object: group.node })) continue;
        const groupName = staticKey(group.node);
        const name = staticKey(token.node);
        if (groupName == null || name == null) continue;
        token.replaceWith(
          this.member(groupName, name, token, (owner, entry) => `t.${owner}.${entry}`),
        );
        rewritten++;
      }
      if (rewritten && rewritten === references.length) removeImportSpecifier(binding.path);
      changed ||= rewritten > 0;
    }
    return changed;
  }

  /**
   * 导入的 t：组件库包名（及其子路径）导入的，或在组件库自己的源码里相对路径导入的。
   * 只认这些，应用里别的 t（如 i18n 的翻译函数）不受影响
   */
  private tokenObjectBindings() {
    const bindings: Binding[] = [];
    for (const statement of this.program.node.body) {
      if (!t.isImportDeclaration(statement) || statement.importKind === 'type') continue;
      for (const specifier of statement.specifiers) {
        if (!t.isImportSpecifier(specifier) || importedName(specifier) !== 't') continue;
        if (specifier.importKind === 'type' || !this.isTokenPackage(statement.source.value))
          continue;
        const binding = this.program.scope.getBinding(specifier.local.name);
        if (binding?.referencePaths.length) bindings.push(binding);
      }
    }
    return bindings;
  }

  private isTokenPackage(source: string) {
    if (this.module === undefined) this.module = this.load();
    const importPath = this.module?.importPath;
    if (!importPath) return false;
    if (importPath.startsWith('.')) return source.startsWith('.');
    const name = packageName(importPath);
    return source === name || source.startsWith(`${name}/`);
  }

  /** create({ 组: 样式 | (参数) => 样式 }) 与 keyframes({ from: 样式, '50%': 样式 }) */
  rewriteCall(call: NodePath<t.CallExpression>) {
    const argument = call.get('arguments')[0];
    if (!argument) return;
    const callee = call.node.callee;
    const name = t.isIdentifier(callee)
      ? callee.name
      : t.isMemberExpression(callee) && t.isIdentifier(callee.property)
        ? callee.property.name
        : '';
    if (name === 'recipe') this.rewriteRecipe(unwrapTypes(argument));
    else this.rewriteGroups(unwrapTypes(argument));
    assertNoTokensLeft(argument);
  }

  /** recipe({ base, variants: { 档位: { 取值: … } }, compound: [{ when, … }] })：每处都是 { 部件: 样式 } */
  private rewriteRecipe(config: NodePath) {
    if (!config.isObjectExpression()) return;
    for (const entry of config.get('properties')) {
      if (!entry.isObjectProperty() || !t.isIdentifier(entry.node.key)) continue;
      const value = unwrapTypes(entry.get('value'));
      if (entry.node.key.name === 'base') this.rewriteGroups(value);
      else if (entry.node.key.name === 'variants' && value.isObjectExpression()) {
        for (const variant of value.get('properties')) {
          if (!variant.isObjectProperty()) continue;
          const values = unwrapTypes(variant.get('value'));
          if (!values.isObjectExpression()) continue;
          for (const option of values.get('properties')) {
            if (option.isObjectProperty()) this.rewriteGroups(unwrapTypes(option.get('value')));
          }
        }
      } else if (entry.node.key.name === 'compound' && value.isArrayExpression()) {
        for (const item of value.get('elements'))
          this.rewriteGroups(unwrapTypes(item as NodePath), ['when']);
      }
    }
  }

  /** { 组: 样式 | (参数) => 样式 }；skip 里的键不是样式（组合档位的 when） */
  private rewriteGroups(groups: NodePath, skip: readonly string[] = []) {
    if (groups.isObjectExpression()) {
      for (const entry of groups.get('properties')) {
        if (
          entry.isObjectProperty() &&
          t.isIdentifier(entry.node.key) &&
          skip.includes(entry.node.key.name)
        )
          continue;
        if (!entry.isObjectProperty()) continue;
        const value = unwrapTypes(entry.get('value'));
        if (value.isObjectExpression()) this.rewriteStyles(value);
        else if (value.isArrowFunctionExpression() || value.isFunctionExpression()) {
          for (const styles of returnedObjects(value)) this.rewriteStyles(styles);
        }
      }
    }
  }

  insertImport() {
    if (!this.locals.size) return false;
    const specifiers = [...this.locals].map(([group, local]) =>
      t.importSpecifier(local, t.identifier(group)),
    );
    const [declaration] = this.program.unshiftContainer(
      'body',
      t.importDeclaration(specifiers, t.stringLiteral(this.module!.importPath)),
    );
    // 同一遍里接着运行的 StyleX 要从作用域找到这些变量才能求值
    this.program.scope.registerDeclaration(declaration!);
    return true;
  }

  /**
   * 一组样式：键是 CSS 属性，或嵌套样式的伪元素（'::before'）、伪类与 @ 规则，或覆盖变量的 `[vars.x]`。
   * 变量没有属性名可查对照表，只认带组名的写法（短写在 resolve 里报错）；不改写的话 token 原样进了 CSS，
   * 变量值无效，用到它的声明整条失效且没有任何提示
   */
  private rewriteStyles(styles: NodePath<t.ObjectExpression>) {
    for (const entry of styles.get('properties')) {
      if (!entry.isObjectProperty()) continue;
      const key = entry.node.key;
      const name = entry.node.computed
        ? `[${entry.get('key').getSource()}]`
        : t.isIdentifier(key)
          ? key.name
          : t.isStringLiteral(key)
            ? key.value
            : null;
      if (name == null) continue;
      const value = unwrapTypes(entry.get('value'));
      if (/^[:@]/.test(name)) {
        if (value.isObjectExpression()) this.rewriteStyles(value);
      } else {
        this.rewriteValue(name, value);
      }
    }
  }

  /** 属性值：字符串、回退数组、按条件取值的对象（条件可嵌套）、动态样式里的三元表达式 */
  private rewriteValue(property: string, path: NodePath<t.Node | null>) {
    const value = unwrapTypes(path);
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
   * 整个值是一个 token → 成员访问。值里夹着 token（`'max(_control, 24px)'`）的字符串写法不支持：
   * 拼在字符串中间的 token 编辑器没有类型提示，报错并给出改成 t 的模板字符串。没有 token 时返回 null，原样保留
   */
  private rewriteString(property: string, text: string, path: NodePath) {
    if (TOKEN.test(text)) return this.resolve(property, text, path);
    const references = embeddedTokens(text);
    if (references.length) {
      let template = '';
      let last = 0;
      for (const { token, start, end } of references) {
        const [, explicitGroup, name] = parseToken(token);
        const group = explicitGroup ?? TOKEN_GROUP_OF.get(property) ?? '组名';
        template += `${escapeTemplate(text.slice(last, start))}\${t.${group}.${name}}`;
        last = end;
      }
      template += escapeTemplate(text.slice(last));
      throw fail(
        path,
        `值里夹着的 token 要写成模板字符串里的 t.组.名（import { t } from '@vue-tsx-pro/ui'）：\`${template}\``,
      );
    }
    if (!text.startsWith('_')) return null;
    throw fail(path, `'${text}' 不是主题 token 的写法：短写 '_xs'，或带组名 '_space.md'`);
  }

  private resolve(property: string, text: string, path: NodePath) {
    const [, explicitGroup, name] = parseToken(text);
    const group = explicitGroup ?? TOKEN_GROUP_OF.get(property);
    if (!group) {
      // 列出真正有这个 token 的组，直接给出能用的写法
      const owners = [...this.tokenModule(path).groups]
        .filter(([, names]) => names.has(name))
        .map(([owner]) => `'_${owner}.${name}'`);
      const suggestion = owners.length ? owners.join(' 或 ') : `'_组名.${name}'`;
      throw fail(path, `${property} 不在 token 对照表里，没有短写；请写带组名的 ${suggestion}`);
    }
    return this.member(group, name, path, (owner, token) =>
      explicitGroup ? `'_${owner}.${token}'` : `'_${token}'`,
    );
  }

  /** 组变量的成员访问（`_space.md`）；组或 token 不存在时报错，按 spell 的写法列出可用的 */
  private member(
    group: string,
    name: string,
    path: NodePath,
    spell: (group: string, token: string) => string,
  ) {
    const module = this.tokenModule(path);
    const tokens = module.groups.get(group);
    if (!tokens) {
      const available = [...module.groups.keys()].join('、');
      throw fail(path, `没有名为 ${group} 的 token 组（可用：${available}）`);
    }
    if (!tokens.has(name)) {
      const available = [...tokens].map((token) => spell(group, token)).join('、');
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

/** 动态样式函数返回的样式对象：`(w) => ({ … })`、按条件返回的（`w ? { … } : { … }`）、函数体里 return 的对象 */
function returnedObjects(fn: NodePath<t.ArrowFunctionExpression | t.FunctionExpression>) {
  const objects: NodePath<t.ObjectExpression>[] = [];
  const collect = (path: unknown) => {
    const value = unwrapTypes(path);
    if (value.isObjectExpression()) objects.push(value);
    else if (value.isConditionalExpression()) {
      collect(value.get('consequent'));
      collect(value.get('alternate'));
    } else if (value.isLogicalExpression()) collect(value.get('right'));
  };
  const body = fn.get('body');
  if (!body.isBlockStatement()) {
    collect(body);
    return objects;
  }
  body.traverse({
    Function(inner) {
      inner.skip();
    },
    ReturnStatement(statement) {
      collect(statement.get('argument'));
    },
  });
  return objects;
}

/** 去掉只影响类型的外壳：`{…} as const`、`satisfies`、`x!`、括号 */
// 参数收 unknown：Babel 的 NodePath 联合类型互相不能赋值（get() 得到的是各种 NodePath 的联合）
function unwrapTypes(path: unknown): NodePath {
  let current = path as NodePath;
  while (
    current.isTSAsExpression() ||
    current.isTSSatisfiesExpression() ||
    current.isTSNonNullExpression() ||
    current.isTSTypeAssertion() ||
    current.isParenthesizedExpression()
  ) {
    current = current.get('expression') as NodePath;
  }
  return current;
}

/** 文字里是不是 token 写法（整个是 token，或夹着 token） */
const looksLikeToken = (text: string) => TOKEN.test(text) || embeddedTokens(text).length > 0;

/**
 * 改写完还留着 token 写法：是没认出来的形状（模板字符串、写在 create 外面的对象、展开别的对象），
 * 原样进了 CSS 就是无效的变量值、整条声明失效且没有提示，所以报错，指出该怎么写
 */
function assertNoTokensLeft(argument: NodePath) {
  argument.traverse({
    StringLiteral(path) {
      const parent = path.parentPath;
      // 键（'::before'、'@media …'）不是值
      if (parent?.isObjectProperty() && parent.node.key === path.node) return;
      if (looksLikeToken(path.node.value)) {
        throw fail(
          path,
          `'${path.node.value}' 在这里不会改写成主题 token：token 写法只认样式的属性值（字符串、回退数组、按条件取值的对象）`,
        );
      }
    },
    TemplateLiteral(path) {
      if (path.node.quasis.some((quasi) => looksLikeToken(quasi.value.cooked ?? quasi.value.raw))) {
        throw fail(path, '模板字符串里的 token 要写成 ${t.组.名}，如 `calc(${t.space.sm} + 2px)`');
      }
    },
    Identifier(path) {
      if (!path.isReferencedIdentifier()) return;
      const binding = path.scope.getBinding(path.node.name);
      const init = binding?.path.isVariableDeclarator() ? binding.path.get('init') : null;
      if (!init?.node || !containsToken(init as NodePath)) return;
      throw fail(
        path,
        `${path.node.name} 里的 token 写法不会改写：token 写法只在 stylex.create / keyframes 的参数里改写，样式请直接写在里面`,
      );
    },
  });
}

/** 子树里有没有 token 写法的字符串（属性的键除外） */
function containsToken(path: NodePath): boolean {
  let found = false;
  const check = (node: t.StringLiteral) => {
    if (looksLikeToken(node.value)) found = true;
  };
  if (path.isStringLiteral()) check(path.node);
  path.traverse({
    StringLiteral(inner) {
      const parent = inner.parentPath;
      if (parent?.isObjectProperty() && parent.node.key === inner.node) return;
      check(inner.node);
      if (found) inner.stop();
    },
  });
  return found;
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

const parseToken = (text: string) =>
  TOKEN.exec(text) as unknown as [string, string | undefined, string];

/** 不计算的成员名：`t.space` 的 space、`t['space']` 的 space */
function staticKey(member: t.MemberExpression) {
  if (!member.computed) return t.isIdentifier(member.property) ? member.property.name : null;
  return t.isStringLiteral(member.property) ? member.property.value : null;
}

/** 删掉一个导入的名字；那条 import 只剩它时整条删掉 */
function removeImportSpecifier(specifier: NodePath) {
  const declaration = specifier.parentPath;
  if (declaration?.isImportDeclaration() && declaration.node.specifiers.length === 1) {
    declaration.remove();
  } else specifier.remove();
}

/** '@vue-tsx-pro/ui/tokens.stylex' → '@vue-tsx-pro/ui' */
const packageName = (specifier: string) =>
  specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/');

/** 模板字符串的原文：反斜杠、反引号与 ${ 要转义 */
function escapeTemplate(text: string) {
  return text.replace(/\\|`|\$\{/g, (char) => `\\${char}`);
}
