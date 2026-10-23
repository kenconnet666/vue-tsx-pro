/**
 * CSS 属性的关键字与取值域：展开 mdn-data 里属性的值语法（`<line-width> | auto`），
 * 得到每个属性能写哪些关键字、它们出自哪段语法（来源），以及属性接受哪类值（长度、颜色、时长……）。
 *
 * 来源是关键字说明的单位：同一段语法（`<line-style>`、`<named-color>`）的关键字只写一份说明，所有用到它的属性共用；
 * 属性自己语法里的关键字以属性为来源（StyleX 的键，`borderTopWidth`）。值语法完全相同的属性合成一个来源
 * （`marginTop`、`marginLeft`…… 用名字最短的那个），docs.json 的 keywordAliases 还可以手动指定。
 */
import { requireFrom } from '../lib/repo.mjs';

const require = requireFrom('.');
const mdnProperties = require('mdn-data/css/properties.json');
const mdnSyntaxes = require('mdn-data/css/syntaxes.json');

/** CSS 全局关键字（所有属性都接受）的来源名；docs.json 里它们的说明写在这个键下 */
export const CSS_WIDE = '<css-wide-keywords>';
const CSS_WIDE_KEYWORDS = new Set(['initial', 'inherit', 'unset', 'revert', 'revert-layer']);

/** 不展开的语法：已废弃的系统颜色（ActiveBorder 等），列进补全只会误导 */
const SKIPPED_SYNTAXES = new Set(['deprecated-system-color']);

/** 取值域：语法里出现这些值类型时，属性接受对应的主题 token（带组名的写法） */
const DOMAIN_MARKERS = {
  length: 'length',
  'length-percentage': 'length',
  color: 'color',
  time: 'time',
  'easing-function': 'easing',
  shadow: 'shadow',
  'shadow-t': 'shadow',
  'family-name': 'family',
  'generic-family': 'family',
  'font-weight-absolute': 'weight',
  "'line-height'": 'lineHeight',
  'alpha-value': 'opacity',
  'opacity-value': 'opacity',
};

/** 主题 token 组 → 取值域 */
export const TOKEN_DOMAINS = {
  space: 'length',
  sizes: 'length',
  borderWidths: 'length',
  radii: 'length',
  fontSizes: 'length',
  letterSpacings: 'length',
  strokeWidths: 'length',
  colors: 'color',
  durations: 'time',
  easings: 'easing',
  shadows: 'shadow',
  fonts: 'family',
  fontWeights: 'weight',
  lineHeights: 'lineHeight',
  opacities: 'opacity',
};

/** WebkitBoxOrient → -webkit-box-orient */
export function cssName(key) {
  return key
    .replace(/^(Webkit|Moz|Ms)/, (prefix) => `-${prefix.toLowerCase()}`)
    .replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/** -webkit-box-orient → WebkitBoxOrient */
function styleKey(name) {
  return name
    .replace(/^-(webkit|moz|ms)-/, (_, prefix) => `${prefix[0].toUpperCase()}${prefix.slice(1)}-`)
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/** mdn 的属性数据（初始值、是否继承、状态、链接） */
export const mdnProperty = (key) => mdnProperties[cssName(key)];

/**
 * 一段值语法里的关键字与引用。`<'margin-top'>` 引用属性，`<line-width>` 引用语法，
 * `<calc-size()>`、`fit-content(…)` 是函数（不展开，函数里的词不是独立的取值），`'['` 这类是字面字符
 */
function parseSyntax(syntax) {
  const keywords = [];
  const references = [];
  const token = /<'([^']+)'>|<([\w-]+)(\(\))?(?:\s*\[[^\]]*\])?>|'[^']*'|([a-zA-Z][\w-]*)(\()?/g;
  for (const [, property, name, isFunction, word, call] of syntax.matchAll(token)) {
    if (property) references.push(`'${property}'`);
    else if (name && !isFunction) references.push(name);
    else if (word && !call) keywords.push(word);
  }
  return { keywords, references };
}

/** 方向、轴、尺寸维度的词：去掉它们后同名的属性是一族（margin-top 与 margin-inline-start，min-width 与 min-block-size） */
const SIDE_WORDS = new Set(
  'top right bottom left block inline x y start end width height size before after'.split(' '),
);
const family = (name) =>
  name
    .split('-')
    .filter((word) => !SIDE_WORDS.has(word))
    .join('-');

/**
 * 关键字说明的来源键：语法写成 `<line-style>`，属性写成 StyleX 的键。同一族且值语法相同的属性合成名字最短的那个
 * （只看语法会把 width 与 min-width、accent-color 与 caret-color 的 auto 混在一起，含义其实不同），keywordAliases 优先
 */
export function createOrigins(keywordAliases) {
  const canonical = new Map();
  const names = Object.keys(mdnProperties).sort(
    (a, b) => a.length - b.length || a.localeCompare(b),
  );
  for (const name of names) {
    const id = `${family(name)}\0${mdnProperties[name].syntax}`;
    if (!canonical.has(id)) canonical.set(id, styleKey(name));
  }
  const ofProperty = (key) => {
    const name = cssName(key);
    const data = mdnProperties[name];
    return keywordAliases[key] ?? (data && canonical.get(`${family(name)}\0${data.syntax}`)) ?? key;
  };
  return {
    ofProperty,
    of: (reference) =>
      reference.startsWith("'") ? ofProperty(styleKey(reference.slice(1, -1))) : `<${reference}>`,
  };
}

/**
 * 展开一个属性的值语法：按出现顺序列出各来源的关键字（不含全局关键字），以及取值域。
 * mdn 没有这个属性（StyleX 自己的键、非标准属性）时为空
 */
export function expandProperty(key, origins) {
  const visited = new Set();
  const sources = [];
  const domains = new Set();
  const visit = (reference) => {
    if (visited.has(reference) || SKIPPED_SYNTAXES.has(reference)) return;
    visited.add(reference);
    if (DOMAIN_MARKERS[reference]) domains.add(DOMAIN_MARKERS[reference]);
    const syntax = reference.startsWith("'")
      ? mdnProperties[reference.slice(1, -1)]?.syntax
      : mdnSyntaxes[reference]?.syntax;
    if (!syntax) return;
    const { keywords, references } = parseSyntax(syntax);
    const own = [...new Set(keywords)].filter((keyword) => !CSS_WIDE_KEYWORDS.has(keyword));
    if (own.length) sources.push({ origin: origins.of(reference), syntax, keywords: own });
    references.forEach(visit);
  };
  if (mdnProperty(key)) visit(`'${cssName(key)}'`);
  return { sources, domains };
}

export const isCssWideKeyword = (keyword) => CSS_WIDE_KEYWORDS.has(keyword);
