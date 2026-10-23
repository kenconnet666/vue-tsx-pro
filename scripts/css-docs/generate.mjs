/**
 * 生成 packages/tsx/src/stylex/styles.ts：StyleX 每个 CSS 属性的中文注释。
 *
 * 数据来源（见 NOTICE.md）：
 *   - 属性集合与值类型：StyleX 自己的类型声明（值类型以索引访问引用，不复制）
 *   - 中文说明、常用值、适用场景：docs.json（本仓库维护）
 *   - 初始值、是否继承、标准状态、MDN 链接：mdn-data
 *   - 浏览器支持（Baseline）：web-features
 *   - 数字值的单位规则：StyleX 编译器源码
 *   - 主题 tokens 的短写：packages/tsx/src/stylex/token-map.ts 的对照表
 *
 * 同时生成 ui 的主题 tokens 字符串写法的类型（见 tokens.mjs）。
 *
 * 用法：node scripts/css-docs/generate.mjs [--check]
 *   --check 只比较不写入，生成结果与仓库里的文件不一致时以非零退出（CI 用）
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import prettier from 'prettier';
import * as ts from 'typescript/ast';
import { API, TypeFlags } from 'typescript/sync';
import { features } from 'web-features';
import { TOKEN_GROUP_OF } from '../../packages/tsx/src/stylex/token-map.ts';
import {
  generateTokenCatalog,
  generateTokenNames,
  tokenCatalogOutput,
  tokenInterfaceName,
  tokenNamesOutput,
} from './tokens.mjs';
import { requireFrom, root } from '../lib/repo.mjs';

const output = join(root, 'packages/tsx/src/stylex/styles.ts');
const require = requireFrom('packages/tsx');
const stylexDir = dirname(require.resolve('@stylexjs/stylex/package.json'));
const compilerEntry = require.resolve('@stylexjs/babel-plugin');
const mdn = requireFrom('.')('mdn-data/css/properties.json');
const docs = JSON.parse(readFileSync(join(root, 'scripts/css-docs/docs.json'), 'utf8'));

// ───────────────────────── StyleX：属性集合、伪元素、数字单位 ─────────────────────────

function readStylexTypes() {
  const typesDir = join(stylexDir, 'lib/es/types');
  const program = new API().createProgram([join(typesDir, 'StyleXTypes.d.ts')], { noEmit: true });
  const { checker } = program.getProject();
  const findAlias = (file, name) =>
    program
      .getSourceFile(join(typesDir, file))
      .statements.find((node) => ts.isTypeAliasDeclaration(node) && node.name.text === name);

  const cssType = checker.getTypeAtLocation(findAlias('StyleXCSSTypes.d.ts', 'CSSProperties').name);
  const symbols = checker.getPropertiesOfType(cssType);
  const types = checker.getTypeOfSymbol(symbols);
  const properties = symbols.map((symbol, index) => {
    const members = unionMembers(types[index]);
    const literals = new Set(
      members
        .filter((member) => member.flags & TypeFlags.StringLiteral)
        .map((member) => member.value),
    );
    // StyleX 的取值类型只由 string、字符串字面量、数字和 null 组成，字面量能否赋给它不必问检查器
    const open = members.some((member) => member.flags & TypeFlags.String);
    return {
      key: symbol.name,
      acceptsNumber: members.some((member) => member.flags & TypeFlags.NumberLike),
      accepts: (keyword) => open || literals.has(keyword),
    };
  });

  // CSSPropertiesWithExtras = Partial<Readonly<CSSProperties & { '::before': CSSProperties; … }>>
  const pseudoElements = [];
  const visit = (node) => {
    if (
      ts.isPropertySignatureDeclaration(node) &&
      ts.isStringLiteral(node.name) &&
      node.name.text.startsWith('::')
    ) {
      pseudoElements.push(node.name.text);
    }
    node.forEachChild(visit);
  };
  visit(findAlias('StyleXTypes.d.ts', 'CSSPropertiesWithExtras'));
  return { properties, pseudoElements };
}

const unionMembers = (type) => (type.flags & TypeFlags.Union ? type.getTypes() : [type]);

/** 从 StyleX 编译器源码读出“不加单位”的属性与特殊单位，保证与编译行为一致 */
function readNumberRules() {
  const source = readFileSync(compilerEntry, 'utf8');
  const unitless = source.match(/const unitlessNumberProperties = new Set\(\[([^\]]+)\]\)/);
  const suffixes = source.match(/const numberPropertySuffixes = \{([^}]+)\}/);
  if (!unitless || !suffixes) throw new Error('StyleX 编译器源码结构变了，无法读取数字单位规则');
  const names = (text) => [...text.matchAll(/'([\w-]+)'/g)].map((match) => match[1]);
  return {
    unitless: new Set(names(unitless[1])),
    suffixes: Object.fromEntries(
      [...suffixes[1].matchAll(/(\w+): '(\w+)'/g)].map((m) => [m[1], m[2]]),
    ),
  };
}

// ───────────────────────── 事实数据：mdn-data 与 web-features ─────────────────────────

/** WebkitBoxOrient → -webkit-box-orient */
function cssName(key) {
  return key
    .replace(/^(Webkit|Moz|Ms)/, (prefix) => `-${prefix.toLowerCase()}`)
    .replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function readBaseline() {
  const byKey = new Map();
  for (const feature of Object.values(features)) {
    for (const [key, status] of Object.entries(feature.status?.by_compat_key ?? {})) {
      byKey.set(key, status);
    }
  }
  return (name) => byKey.get(`css.properties.${name}`);
}

const year = (date) => date.replace(/^≤/, '').slice(0, 4);

function baselineText(status) {
  if (!status) return undefined;
  if (status.baseline === 'high') return `${year(status.baseline_high_date)} 年起广泛可用`;
  if (status.baseline === 'low') return `${year(status.baseline_low_date)} 年起新近可用`;
  return '尚未在所有主流浏览器可用';
}

const STATUS_TEXT = { nonstandard: '非标准', experimental: '实验性', obsolete: '已废弃' };

// ───────────────────────── 生成注释 ─────────────────────────

function jsdoc(lines) {
  const body = lines
    .join('\n')
    .replaceAll('*/', '*\\/')
    .split('\n')
    .map((line) => ` * ${line}`.trimEnd());
  return ['/**', ...body, ' */'].join('\n');
}

function numberRule(key, rules) {
  if (rules.unitless.has(key)) return '数字值不加单位';
  return `数字值自动加 \`${rules.suffixes[key] ?? 'px'}\``;
}

function propertyDoc({ key, acceptsNumber }, context) {
  const name = cssName(key);
  const summary = docs.properties[key];
  const lines = [summary.includes(`（${name}）`) ? summary : `${summary}（${name}）`];

  const detail = docs.details[key];
  const keywords = docs.keywords[docs.keywordAliases[key] ?? key] ?? {};
  if (detail?.remarks) lines.push('', detail.remarks);
  const values = detail?.commonValues ?? Object.keys(keywords);
  if (values.length) {
    lines.push('', '常用值：');
    for (const value of values)
      lines.push(`- \`${value}\`${keywords[value] ? `：${keywords[value]}` : ''}`);
  }
  if (detail?.usage) lines.push('', `适用场景：${detail.usage}`);

  const data = mdn[name];
  const facts = [];
  if (acceptsNumber) facts.push(numberRule(key, context.numberRules));
  if (typeof data?.initial === 'string') facts.push(`初始值 \`${data.initial}\``);
  else if (Array.isArray(data?.initial)) facts.push('简写属性，初始值见各分项');
  if (data) facts.push(data.inherited ? '继承' : '不继承');
  if (STATUS_TEXT[data?.status]) facts.push(STATUS_TEXT[data.status]);
  const baseline = baselineText(context.baseline(name));
  if (baseline) facts.push(`Baseline：${baseline}`);
  if (facts.length) lines.push('', facts.join('；') + '。');
  if (data?.mdn_url) lines.push(`@see ${data.mdn_url}`);
  return lines;
}

/** display → DisplayKeywords */
const keywordsName = (group) => `${group[0].toUpperCase()}${group.slice(1)}Keywords`;

/**
 * 关键字分组 → 取值说明里出现的关键字。一组可能被多个属性共用（keywordAliases），
 * 每个关键字必须被共用它的所有属性接受，否则带说明的取值类型会比 StyleX 的宽。
 */
function readKeywordGroups(properties) {
  const groups = new Map();
  const rejected = [];
  for (const property of properties) {
    const group = docs.keywordAliases[property.key] ?? property.key;
    const keywords = Object.keys(docs.keywords[group] ?? {});
    for (const keyword of keywords) {
      if (!property.accepts(keyword)) rejected.push(`${property.key}: ${keyword}`);
    }
    if (keywords.length) groups.set(group, keywords);
  }
  if (rejected.length)
    throw new Error(
      `以下关键字 StyleX 的类型不接受（scripts/css-docs/docs.json）：\n${rejected.join('\n')}`,
    );
  return groups;
}

async function generate() {
  const { properties, pseudoElements } = readStylexTypes();
  const missing = [
    ...properties.filter(({ key }) => !docs.properties[key]).map(({ key }) => key),
    ...pseudoElements.filter((key) => !docs.pseudoElements[key]),
  ];
  if (missing.length)
    throw new Error(
      `以下 StyleX 属性缺少中文说明（scripts/css-docs/docs.json）：\n${missing.join('\n')}`,
    );

  const known = new Set(properties.map(({ key }) => key));
  const unknown = [...TOKEN_GROUP_OF.keys()].filter((key) => !known.has(key));
  if (unknown.length)
    throw new Error(
      `token 对照表里有 StyleX 不认识的属性（token-map.ts）：\n${unknown.join('\n')}`,
    );

  // 每组的接口要从入口按名导出，ui 的 declare module 才能合并进来（漏了就没有补全，类型检查也发现不了）
  const entry = readFileSync(join(root, 'packages/tsx/src/stylex/index.ts'), 'utf8');
  const unexported = [...new Set(TOKEN_GROUP_OF.values())]
    .map(tokenInterfaceName)
    .filter((name) => !new RegExp(`\\b${name}\\b`).test(entry));
  if (unexported.length)
    throw new Error(`packages/tsx/src/stylex/index.ts 没有导出：${unexported.join('、')}`);

  const context = { numberRules: readNumberRules(), baseline: readBaseline() };
  const keywordGroups = readKeywordGroups(properties);
  const valueType = ({ key }) => {
    const value = `CSSProperties['${key}']`;
    const group = docs.keywordAliases[key] ?? key;
    const tokens = TOKEN_GROUP_OF.get(key) && tokenInterfaceName(TOKEN_GROUP_OF.get(key));
    if (!keywordGroups.has(group)) return tokens ? `KeywordValue<${tokens}, ${value}>` : value;
    const keywords = `KeywordValue<${keywordsName(group)}, ${value}>`;
    // KeywordValue 已把 string 改写成 string & {}，再并上 token 名不会被吸收
    return tokens ? `${keywords} | keyof ${tokens}` : keywords;
  };
  const members = [
    ...properties.map((property) => [
      jsdoc(propertyDoc(property, context)),
      `${property.key}?: StyleValue<${valueType(property)}>;`,
    ]),
    ...pseudoElements.map((key) => [
      jsdoc([`伪元素 \`${key}\`：${docs.pseudoElements[key]}`]),
      `'${key}'?: DocumentedStyles;`,
    ]),
  ];

  const keywordInterfaces = [...keywordGroups].flatMap(([group, keywords]) => [
    `interface ${keywordsName(group)} {`,
    ...keywords.flatMap((keyword) => [
      jsdoc([`\`${keyword}\`：${docs.keywords[group][keyword]}`]),
      `'${keyword}': unknown;`,
    ]),
    '}',
    '',
  ]);

  const code = [
    '// 由 scripts/css-docs/generate.mjs 生成，请勿手改；数据来源见 scripts/css-docs/NOTICE.md。',
    '// 主题库填入 token 接口之前，`keyof FontSizesTokens` 这类短写是 never',
    '// oxlint-disable no-redundant-type-constituents',
    "import type { CSSProperties } from '@stylexjs/stylex';",
    "import type { KeywordValue, StyleValue } from './value';",
    // token 接口声明在入口 index.ts：主题库用 declare module 增补的就是入口模块，声明与增补在同一个模块里，
    // IDE 才能把 '_xs' 解析到唯一的那一组（声明在这里再转出时，WebStorm 会列出所有同名的 token）
    `import type { ${[...new Set(TOKEN_GROUP_OF.values())].map(tokenInterfaceName).sort().join(', ')} } from './index';`,
    '',
    '/** StyleX 样式对象：每个属性带中文说明，值类型直接引用 StyleX 自己的定义 */',
    'export interface DocumentedStyles {',
    ...members.flat(),
    '  /**',
    "   * 自定义属性（CSS 变量）：`'--vis-axis-grid-color': colors.borderMuted`，把第三方库的主题变量指到 tokens 上。",
    '   */',
    '  [customProperty: `--${string}`]: StyleValue<string | number> | undefined;',
    '}',
    '',
    '// 各属性的关键字说明：键上的注释在悬停取值时显示',
    ...keywordInterfaces,
  ].join('\n');
  return format(code, output);
}

async function format(code, file) {
  const config = await prettier.resolveConfig(file);
  return prettier.format(code, { ...config, filepath: file });
}

const tokenNames = tokenNamesOutput(root);
const outputs = [
  [output, await generate()],
  [tokenNames, await format(generateTokenNames(root), tokenNames)],
  [tokenCatalogOutput(root), await format(generateTokenCatalog(root), tokenCatalogOutput(root))],
];
const check = process.argv.includes('--check');
for (const [file, code] of outputs) {
  if (!check) writeFileSync(file, code);
  else if (!existsSync(file) || readFileSync(file, 'utf8') !== code) {
    console.error(`${relative(root, file)} 与数据不一致，请运行 pnpm css-docs`);
    process.exitCode = 1;
  }
}
