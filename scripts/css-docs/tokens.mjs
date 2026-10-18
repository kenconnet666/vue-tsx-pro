/**
 * 生成 packages/ui/src/config/theme/token-names.ts：主题 tokens 短写（`fontSize: '_xs'`）的类型。
 *
 * 读 tokens.stylex.ts 里每个 `export const 组 = stylex.defineVars({ … })` 的键与注释，
 * 用 declare module 填入 @vue-tsx-pro/tsx/stylex 里对照表各组的接口（FontSizesTokens 等）；
 * 键上带着 token 原来的注释，悬停取值时就能看到说明。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { TOKEN_GROUP_OF } from '../../packages/tsx/src/stylex/token-map.ts';

/**
 * 短写的类型：每组一个接口（fontSizes → FontSizesTokens），属性直接写 `keyof FontSizesTokens`。
 * 不能写成 `keyof 总接口['fontSizes']`：WebStorm 解析字符串时会丢掉组名，把各组同名的 `_xs` 都列为跳转目标
 */
export const tokenInterfaceName = (group) => `${group[0].toUpperCase()}${group.slice(1)}Tokens`;

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
  return [
    '// 由 scripts/css-docs/generate.mjs 根据 tokens.stylex.ts 生成，请勿手改。',
    '// 主题 tokens 字符串写法的类型（COMPONENTS.md §4）：每组一个接口',
    "declare module '@vue-tsx-pro/tsx/stylex' {",
    ...shortGroups.flatMap((group) => [
      group.doc,
      `interface ${tokenInterfaceName(group.name)} {`,
      ...group.tokens.flatMap((token) => [
        docWith(token.doc, `${group.name}.${token.name}`),
        `_${token.name}: unknown;`,
      ]),
      '}',
    ]),
    '}',
    '',
    'export {};',
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

/** export const 组 = stylex.defineVars({ … }) → 组名、注释与各 token 的名字、注释 */
function readTokenGroups(file) {
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const groups = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
      continue;
    for (const declaration of statement.declarationList.declarations) {
      const call = declaration.initializer;
      if (!call || !ts.isCallExpression(call) || !call.expression.getText().endsWith('defineVars'))
        continue;
      const object = call.arguments[0];
      if (!object || !ts.isObjectLiteralExpression(object)) continue;
      groups.push({
        name: declaration.name.getText(),
        doc: leadingDoc(text, statement),
        tokens: object.properties.map((property) => ({
          name: property.name.getText(),
          doc: leadingDoc(text, property),
        })),
      });
    }
  }
  return groups;
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
