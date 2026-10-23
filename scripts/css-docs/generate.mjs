/**
 * 生成 packages/tsx/src/stylex/styles.ts：StyleX 每个 CSS 属性的中文注释，以及每个关键字取值的说明。
 *
 * 数据来源（见 NOTICE.md）：
 *   - 属性集合与值类型：StyleX 自己的类型声明（值类型以索引访问引用，不复制）
 *   - 中文说明、常用值、适用场景、关键字说明：docs.json（本仓库维护）
 *   - 属性能写哪些关键字、接受哪类值：mdn-data 的值语法（见 keywords.mjs）
 *   - 初始值、是否继承、标准状态、MDN 链接：mdn-data
 *   - 浏览器支持（Baseline）：web-features
 *   - 数字值的单位规则：StyleX 编译器源码
 *   - 主题 tokens 的短写：packages/tsx/src/stylex/token-map.ts 的对照表
 *
 * 同时生成 ui 的主题 tokens 字符串写法的类型（见 tokens.mjs）。
 *
 * 用法：node scripts/css-docs/generate.mjs [--check]
 *   --check 只比较不写入，生成结果与仓库里的文件不一致时以非零退出（CI 用）
 *   缺关键字说明时报错，并把待写的清单（来源、语法、用到它的属性）写到 node_modules/.cache/css-docs-missing.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import prettier from 'prettier';
import * as ts from 'typescript/ast';
import { API, TypeFlags } from 'typescript/sync';
import { features } from 'web-features';
import { TOKEN_GROUP_OF } from '../../packages/tsx/src/stylex/token-map.ts';
import {
  CSS_WIDE,
  createOrigins,
  cssName,
  expandProperty,
  isCssWideKeyword,
  mdnProperty,
  TOKEN_DOMAINS,
} from './keywords.mjs';
import {
  generateTokenCatalog,
  generateTokenNames,
  qualifiedTokenInterfaceName,
  tokenCatalogOutput,
  tokenInterfaceName,
  tokenNamesOutput,
} from './tokens.mjs';
import { requireFrom, root } from '../lib/repo.mjs';

const output = join(root, 'packages/tsx/src/stylex/styles.ts');
const missingOutput = join(root, 'node_modules/.cache/css-docs-missing.json');
const require = requireFrom('packages/tsx');
const stylexDir = dirname(require.resolve('@stylexjs/stylex/package.json'));
const compilerEntry = require.resolve('@stylexjs/babel-plugin');
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
  // StyleX 的取值类型只由 string、字符串字面量、数字和 null 组成：含 string 的接受任意关键字，
  // 不含的只接受列出的字面量
  const properties = symbols.map((symbol, index) => {
    const members = unionMembers(types[index]);
    return {
      key: symbol.name,
      acceptsNumber: members.some((member) => member.flags & TypeFlags.NumberLike),
      open: members.some((member) => member.flags & TypeFlags.String),
      literals: members
        .filter((member) => member.flags & TypeFlags.StringLiteral)
        .map((member) => member.value),
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

// ───────────────────────── 事实数据：web-features ─────────────────────────

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

// ───────────────────────── 关键字：每段语法一个接口 ─────────────────────────

/** `<line-style>` → CssLineStyle（语法）；borderTopWidth → BorderTopWidthKeywords（属性自己的关键字） */
const originInterfaceName = (origin) =>
  origin.startsWith('<')
    ? `Css${pascal(origin.slice(1, -1).replace(/^css-/, ''))}`
    : `${origin[0].toUpperCase()}${origin.slice(1)}Keywords`;
const pascal = (name) => name.replace(/(^|-)([a-z])/g, (_, __, char) => char.toUpperCase());

/**
 * 每个属性的关键字：取值含任意字符串的属性（open）并上它语法里各个来源的接口，来源的说明所有属性共用；
 * 只接受固定字面量的属性（closed）单独一个接口，键与 StyleX 的字面量一一对应，说明按 属性 → 语法来源 → 全局 的顺序找。
 * 缺说明的记进 missing（按来源归类，写一份说明能覆盖所有用到它的属性）
 */
function buildKeywords(properties) {
  const origins = createOrigins(docs.keywordAliases);
  /** 接口名 → { origin, keys: Map<关键字, 说明> } */
  const interfaces = new Map();
  /** 来源 → { syntax, usedBy, keywords } */
  const missing = new Map();
  const used = new Set();
  const errors = [];

  const describe = (origin, keyword) => {
    const text = docs.keywords[origin]?.[keyword];
    if (text !== undefined) used.add(`${origin}\0${keyword}`);
    return text;
  };
  const markMissing = (origin, keyword, property, syntax) => {
    const entry = missing.get(origin) ?? { syntax, usedBy: new Set(), keywords: new Set() };
    entry.usedBy.add(property);
    entry.keywords.add(keyword);
    missing.set(origin, entry);
  };
  const addInterface = (name, origin, keys) => {
    const existing = interfaces.get(name);
    if (!existing) return void interfaces.set(name, { origin, keys });
    for (const [keyword, text] of keys) existing.keys.set(keyword, text);
  };

  const cssWide = new Map(
    ['initial', 'inherit', 'unset', 'revert', 'revert-layer'].map((keyword) => [
      keyword,
      describe(CSS_WIDE, keyword),
    ]),
  );
  for (const [keyword, text] of cssWide)
    if (text === undefined) markMissing(CSS_WIDE, keyword, '*');
  addInterface(originInterfaceName(CSS_WIDE), CSS_WIDE, cssWide);

  const byProperty = new Map();
  for (const property of properties) {
    const own = origins.ofProperty(property.key);
    const { sources, domains } = expandProperty(property.key, origins);
    const overrides = Object.keys(docs.keywords[own] ?? {});

    if (property.open) {
      const names = [];
      for (const { origin, syntax, keywords } of sources) {
        const keys = new Map();
        for (const keyword of keywords) {
          const text = describe(origin, keyword);
          if (text === undefined) markMissing(origin, keyword, property.key, syntax);
          keys.set(keyword, text);
        }
        addInterface(originInterfaceName(origin), origin, keys);
        names.push(originInterfaceName(origin));
      }
      // 属性自己的说明可以覆盖引用来的关键字（flexBasis 的 auto 与 width 的 auto 含义不同）：放进属性自己的接口
      const reachable = new Set(sources.flatMap(({ keywords }) => keywords));
      const ownKeys = new Map();
      for (const keyword of overrides) {
        if (!reachable.has(keyword))
          errors.push(`docs.keywords.${own}.${keyword}：${property.key} 的值语法里没有这个关键字`);
        ownKeys.set(keyword, describe(own, keyword));
      }
      if (ownKeys.size) {
        addInterface(originInterfaceName(own), own, ownKeys);
        names.unshift(originInterfaceName(own));
      }
      byProperty.set(property.key, { open: true, interfaces: [...new Set(names)], domains });
      continue;
    }

    // 属性来源的说明里可以有它不接受的值：同一来源还被别的属性引用（placeItems 引用 alignItems）。
    // 谁都用不到的说明由最后的“没有属性用到”检查报出
    const keys = new Map();
    for (const keyword of property.literals) {
      const source = sources.find(({ keywords }) => keywords.includes(keyword));
      const text =
        describe(own, keyword) ??
        (source && describe(source.origin, keyword)) ??
        (isCssWideKeyword(keyword) ? describe(CSS_WIDE, keyword) : undefined);
      if (text === undefined) {
        const origin = source?.origin ?? (isCssWideKeyword(keyword) ? CSS_WIDE : own);
        markMissing(origin, keyword, property.key, source?.syntax);
      }
      keys.set(keyword, text);
    }
    // 同一来源的属性字面量相同时共用一个接口（borderTopStyle、borderLeftStyle……）
    let name = `${originInterfaceName(own).replace(/Keywords$/, '')}Values`;
    const existing = interfaces.get(name);
    if (existing && [...existing.keys.keys()].join() !== [...keys.keys()].join())
      name = `${property.key[0].toUpperCase()}${property.key.slice(1)}Values`;
    addInterface(name, own, keys);
    byProperty.set(property.key, { open: false, interfaces: [name], domains });
  }

  const unused = Object.entries(docs.keywords).flatMap(([origin, keys]) =>
    Object.keys(keys)
      .filter((keyword) => !used.has(`${origin}\0${keyword}`))
      .map((keyword) => `docs.keywords.${origin}.${keyword}：没有属性用到`),
  );
  errors.push(...unused);
  return { interfaces, byProperty, missing, errors };
}

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

/** 属性注释里列出说明的关键字最多几个；更多时只列名字（每个值的说明在悬停取值时看） */
const LISTED_KEYWORDS = 12;

function propertyDoc({ key, acceptsNumber }, context) {
  const name = cssName(key);
  const summary = docs.properties[key];
  const lines = [summary.includes(`（${name}）`) ? summary : `${summary}（${name}）`];

  const detail = docs.details[key];
  const keywords = docs.keywords[context.origins.ofProperty(key)] ?? {};
  if (detail?.remarks) lines.push('', detail.remarks);
  const values = detail?.commonValues ?? Object.keys(keywords);
  if (values.length > LISTED_KEYWORDS && !detail?.commonValues) {
    lines.push('', `常用值：${values.map((value) => `\`${value}\``).join('、')}`);
  } else if (values.length) {
    lines.push('', '常用值：');
    for (const value of values)
      lines.push(`- \`${value}\`${keywords[value] ? `：${keywords[value]}` : ''}`);
  }
  if (detail?.usage) lines.push('', `适用场景：${detail.usage}`);

  const data = mdnProperty(key);
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

/**
 * 属性的取值类型：关键字（closed 用 KeywordValue 保证与 StyleX 完全相同，open 并上各来源的接口）、
 * 短写的 token 组，以及按取值域列出的带组名的 token（长度属性列出间距、尺寸、边框宽度……）
 */
function valueType(property, keywords) {
  const value = `CSSProperties['${property.key}']`;
  const { open, interfaces, domains } = keywords.byProperty.get(property.key);
  const short = TOKEN_GROUP_OF.get(property.key);
  const groups = Object.keys(TOKEN_DOMAINS).filter(
    (group) => domains.has(TOKEN_DOMAINS[group]) || TOKEN_DOMAINS[group] === TOKEN_DOMAINS[short],
  );
  if (short) groups.sort((a, b) => Number(b === short) - Number(a === short));
  const parts = open
    ? [
        `OpenValue<${value}>`,
        `keyof ${originInterfaceName(CSS_WIDE)}`,
        ...interfaces.map((name) => `keyof ${name}`),
      ]
    : [`KeywordValue<${interfaces[0]}, ${value}>`];
  if (short) parts.push(`keyof ${tokenInterfaceName(short)}`);
  parts.push(...groups.map((group) => `keyof ${qualifiedTokenInterfaceName(group)}`));
  return parts.join(' | ');
}

function checkInputs(properties, pseudoElements) {
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

  const groups = [...new Set(TOKEN_GROUP_OF.values())];
  const withoutDomain = groups.filter((group) => !TOKEN_DOMAINS[group]);
  if (withoutDomain.length)
    throw new Error(`keywords.mjs 的 TOKEN_DOMAINS 缺少 token 组：${withoutDomain.join('、')}`);

  // 每组的接口要从入口按名导出，ui 的 declare module 才能合并进来（漏了就没有补全，类型检查也发现不了）
  const entry = readFileSync(join(root, 'packages/tsx/src/stylex/index.ts'), 'utf8');
  const unexported = groups
    .flatMap((group) => [tokenInterfaceName(group), qualifiedTokenInterfaceName(group)])
    .filter((name) => !new RegExp(`\\b${name}\\b`).test(entry));
  if (unexported.length)
    throw new Error(`packages/tsx/src/stylex/index.ts 没有导出：${unexported.join('、')}`);
}

/** 缺说明时报错，并把待写的清单写到 node_modules/.cache，按来源列出语法与用到它的属性 */
function reportKeywordProblems({ missing, errors }) {
  if (missing.size) {
    const list = Object.fromEntries(
      [...missing].map(([origin, { syntax, usedBy, keywords }]) => [
        origin,
        { syntax, usedBy: [...usedBy], keywords: [...keywords] },
      ]),
    );
    mkdirSync(dirname(missingOutput), { recursive: true });
    writeFileSync(missingOutput, JSON.stringify(list, null, 2));
    const count = [...missing.values()].reduce((sum, { keywords }) => sum + keywords.size, 0);
    errors.push(
      `${missing.size} 个来源的 ${count} 个关键字缺少说明（docs.json 的 keywords），清单：${relative(root, missingOutput)}`,
    );
  }
  if (errors.length)
    throw new Error(`关键字说明有问题（scripts/css-docs/docs.json）：\n${errors.join('\n')}`);
}

async function generate() {
  const { properties, pseudoElements } = readStylexTypes();
  checkInputs(properties, pseudoElements);
  const keywords = buildKeywords(properties);
  reportKeywordProblems(keywords);

  const context = {
    numberRules: readNumberRules(),
    baseline: readBaseline(),
    origins: createOrigins(docs.keywordAliases),
  };
  const members = [
    ...properties.map((property) => [
      jsdoc(propertyDoc(property, context)),
      `${property.key}?: StyleValue<${valueType(property, keywords)}>;`,
    ]),
    ...pseudoElements.map((key) => [
      jsdoc([`伪元素 \`${key}\`：${docs.pseudoElements[key]}`]),
      `'${key}'?: DocumentedStyles;`,
    ]),
  ];

  const keywordInterfaces = [...keywords.interfaces]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([name, { keys }]) => [
      `interface ${name} {`,
      ...[...keys].flatMap(([keyword, text]) => [
        jsdoc([`\`${keyword}\`：${text}`]),
        `'${keyword}': unknown;`,
      ]),
      '}',
      '',
    ]);

  const tokenGroups = [...new Set(TOKEN_GROUP_OF.values())];
  const tokenInterfaces = tokenGroups
    .flatMap((group) => [tokenInterfaceName(group), qualifiedTokenInterfaceName(group)])
    .sort();
  const code = [
    '// 由 scripts/css-docs/generate.mjs 生成，请勿手改；数据来源见 scripts/css-docs/NOTICE.md。',
    '// 主题库填入 token 接口之前，`keyof FontSizesTokens` 这类 token 名都是 never（联合里多余、彼此重复）',
    '// oxlint-disable no-redundant-type-constituents, no-duplicate-type-constituents',
    "import type { CSSProperties } from '@stylexjs/stylex';",
    "import type { KeywordValue, OpenValue, StyleValue } from './value';",
    // token 接口声明在入口 index.ts：主题库用 declare module 增补的就是入口模块，声明与增补在同一个模块里，
    // IDE 才能把 '_xs' 解析到唯一的那一组（声明在这里再转出时，WebStorm 会列出所有同名的 token）
    `import type { ${tokenInterfaces.join(', ')} } from './index';`,
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
    '// 关键字说明：每段值语法一个接口（Css 开头），属性自己的关键字以 Keywords 结尾，只接受固定几个值的属性以 Values 结尾；',
    '// 键上的注释在悬停取值时显示',
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
