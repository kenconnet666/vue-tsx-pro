/**
 * 生成 packages/ui/src/config/theme/token-names.ts：主题 tokens 短写（`fontSize: '_xs'`）的类型。
 *
 * 读 tokens.stylex.ts 里每个 `export const 组 = stylex.defineVars({ … })` 的键与注释，
 * 用 declare module 填入 @vue-tsx-pro/tsx/stylex 里对照表各组的接口（FontSizesTokens 等）；
 * 键上带着 token 原来的注释，悬停取值时就能看到说明。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ts from 'typescript/ast';
import { TOKEN_GROUP_OF } from '../../packages/tsx/src/stylex/token-map.ts';
import { parseSource } from '../lib/repo.mjs';

/**
 * 短写的类型：每组一个接口（fontSizes → FontSizesTokens），属性直接写 `keyof FontSizesTokens`。
 * 不能写成 `keyof 总接口['fontSizes']`：WebStorm 解析字符串时会丢掉组名，把各组同名的 `_xs` 都列为跳转目标
 */
export const tokenInterfaceName = (group) => `${group[0].toUpperCase()}${group.slice(1)}Tokens`;

/** 带组名的写法（`'_space.md'`）的接口：space → QualifiedSpaceTokens */
export const qualifiedTokenInterfaceName = (group) => `Qualified${tokenInterfaceName(group)}`;

export function tokenNamesOutput(root) {
  return join(root, 'packages/ui/src/config/theme/token-names.ts');
}

export function generateTokenNames(root) {
  const groups = readTokenGroups(join(root, 'packages/ui/src/config/theme/tokens.stylex.ts'));
  const mapped = new Set(TOKEN_GROUP_OF.values());
  const missing = [...mapped].filter((group) => !groups.some((item) => item.name === group));
  if (missing.length)
    throw new Error(`对照表里的 token 组在 tokens.stylex.ts 里没有定义：${missing.join('、')}`);

  const shortGroups = groups.filter((group) => mapped.has(group.name));
  // 短写（'_xs'）与带组名的写法（'_fontSizes.xs'）各一个接口，键上的注释相同
  const tokenInterface = (group, name, key) => [
    group.doc,
    `interface ${name} {`,
    ...group.tokens.flatMap((token) => [
      docWith(token.doc, `${group.name}.${token.name}`),
      `${key(token.name)}: unknown;`,
    ]),
    '}',
  ];
  return [
    '// 由 scripts/css-docs/generate.mjs 根据 tokens.stylex.ts 生成，请勿手改。',
    '// 主题 tokens 字符串写法的类型（COMPONENTS.md §4）：每组一个短写的接口、一个带组名的接口',
    "declare module '@vue-tsx-pro/tsx/stylex' {",
    ...shortGroups.flatMap((group) => [
      ...tokenInterface(group, tokenInterfaceName(group.name), (name) => `_${name}`),
      ...tokenInterface(
        group,
        qualifiedTokenInterfaceName(group.name),
        (name) => `'_${group.name}.${name}'`,
      ),
    ]),
    '}',
    '',
    'export {};',
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

/** export const 组 = stylex.defineVars('vtp-组', { … }) → 组名、注释与各 token 的名字、注释 */
export function readTokenGroups(file) {
  const text = readFileSync(file, 'utf8');
  const source = parseSource(file, text);
  const groups = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
      continue;
    for (const declaration of statement.declarationList.declarations) {
      const call = declaration.initializer;
      if (!call || !ts.isCallExpression(call) || !call.expression.getText().endsWith('defineVars'))
        continue;
      const object = call.arguments[1];
      if (!object || !ts.isObjectLiteralExpression(object)) continue;
      groups.push({
        name: declaration.name.getText(),
        doc: leadingDoc(text, statement),
        tokens: object.properties.map((property) => ({
          name: property.name.getText(),
          doc: leadingDoc(text, property),
          // 默认值（亮色主题）：字符串字面量，或带条件的取值（如“减少动态效果”时为 0）里的 default
          value: ts.isPropertyAssignment(property) ? defaultValue(property.initializer) : undefined,
        })),
      });
    }
  }
  return groups;
}

/** 取值表达式的默认值：`'14px'` → 14px；`{ default: '120ms', [reduce]: '0ms' }` → 120ms */
function defaultValue(node) {
  if (ts.isStringLiteralLikeNode(node)) return node.text;
  if (!ts.isObjectLiteralExpression(node)) return undefined;
  const fallback = node.properties.find(
    (property) => ts.isPropertyAssignment(property) && property.name.getText() === 'default',
  );
  return fallback ? defaultValue(fallback.initializer) : undefined;
}

/** 节点前最后一段 `/** … *\/` 注释 */
function leadingDoc(text, node) {
  const ranges = ts.getLeadingCommentRanges(text, node.pos) ?? [];
  const range = ranges.findLast(({ pos }) => text.startsWith('/**', pos));
  return range ? text.slice(range.pos, range.end) : undefined;
}

/** 在注释末尾加一行 token 的来源，如 `fontSizes.xs` */
function docWith(doc, path) {
  if (!doc) return `/** \`${path}\` */`;
  const body = doc
    .replace(/^\/\*\*\s?/, '')
    .replace(/\s*\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();
  return [
    '/**',
    ...body.split('\n').map((line) => ` * ${line}`.trimEnd()),
    ` *`,
    ` * \`${path}\``,
    ' */',
  ].join('\n');
}

/** 中文字符与全角标点 */
const CJK = /[　-〿一-鿿＀-￯]/;

/**
 * 注释的正文：去掉开头结尾的注释符号与每行开头的星号，合成一段。
 * 行与行之间补一个空格，但两边都是中文时直接接上（中文之间不加空格）
 */
function docText(doc) {
  if (!doc) return '';
  return doc
    .replace(/^\/\*\*\s?/, '')
    .replace(/\s*\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .reduce((text, line) =>
      CJK.test(text.at(-1) ?? '') && CJK.test(line[0]) ? text + line : `${text} ${line}`,
    );
}

export function tokenCatalogOutput(root) {
  return join(root, 'packages/ui/src/theme-customize/token-catalog.ts');
}

/**
 * 生成 packages/ui/src/theme-customize/token-catalog.ts：每组每个 token 的默认值（亮色主题）与说明。
 * 主题编辑器按默认值换算（圆角、缩放、动效速度），文档站的 token 表也读它
 */
export function generateTokenCatalog(root) {
  const groups = readTokenGroups(join(root, 'packages/ui/src/config/theme/tokens.stylex.ts'));
  const catalog = groups.map((group) => ({
    name: group.name,
    description: docText(group.doc),
    tokens: group.tokens
      .filter((token) => token.value !== undefined)
      .map((token) => ({ name: token.name, value: token.value, description: docText(token.doc) })),
  }));
  return [
    '// 由 scripts/css-docs/generate.mjs 根据 tokens.stylex.ts 生成，请勿手改。',
    '',
    '/** 一个主题 token */',
    'export interface TokenEntry {',
    '  /** 键，如 accent */',
    '  readonly name: string;',
    '  /** 默认值（亮色主题） */',
    '  readonly value: string;',
    '  /** 说明 */',
    '  readonly description: string;',
    '}',
    '',
    '/** 一组主题 token */',
    'export interface TokenGroupEntry {',
    '  /** 组名，如 colors */',
    '  readonly name: string;',
    '  /** 说明 */',
    '  readonly description: string;',
    '  /** 组里的 token */',
    '  readonly tokens: readonly TokenEntry[];',
    '}',
    '',
    '/** 主题 tokens 的清单：每组每个 token 的默认值与说明（主题编辑器、文档的 token 表用它） */',
    `export const tokenCatalog: readonly TokenGroupEntry[] = ${JSON.stringify(catalog, null, 2)};`,
    '',
  ].join('\n');
}
