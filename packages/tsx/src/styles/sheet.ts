/**
 * 运行时样式引擎的样式表：一张 <style>，规则按名字（类名、关键帧名）登记，同样的内容只插一次；
 * 记下规则原文（SSR 输出、测试断言用），热更新时按名字换掉。
 *
 * 规则分层（级联层 @layer）：最前面的 vtp.base 放基础规则（globalRule，如组件库给部件统一 box-sizing），
 * 变量组与主题在 vtp.vars，一个元素的样式按合并来源分段，第 k 段在 vtp.s{k}（fragment.ts）。
 * 后面的层不论特异性都盖过前面的层；宿主不分层的 CSS 盖过整个组件库。表的开头先声明层的顺序。
 * 不认 @layer 的环境（测试用的 happy-dom）插不带层的规则，原文仍记带层的写法
 */

/** 一个元素最多分几段（超出的并进最后一段） */
export const SEGMENT_LIMIT = 8;

/** 规则所在的层：基础规则、变量组与主题、样式的第 k 段 */
export type Layer = number | 'base' | 'vars';

/** 层名：基础规则在 base，变量组与主题在 vars，样式的第 k 段在 s{k} */
export const layerName = (layer: Layer) =>
  typeof layer === 'number' ? `vtp.s${layer}` : `vtp.${layer}`;

/** 层的顺序：样式表最前面声明一次 */
export const LAYER_ORDER = `@layer ${[
  'base' as const,
  'vars' as const,
  ...Array.from({ length: SEGMENT_LIMIT }, (_, index) => index),
]
  .map(layerName)
  .join(',')};`;

/** 基础规则登记的名字前缀：服务端渲染时总会带上 */
export const BASE_PREFIX = 'base:';

/** 规则放进层里；layer 不给时不分层（关键帧） */
const wrap = (text: string, layer: Layer | undefined) =>
  layer === undefined ? text : `@layer ${layerName(layer)}{${text}}`;

/**
 * 插过的规则：类名（关键帧名、变量名）→ 规则原文与 CSSOM 里的规则。同样的内容只插一次；
 * 原文给 SSR 输出 <style>，也不依赖 CSSOM 的序列化（浏览器、测试用的 DOM 会丢掉不认识的声明）；
 * CSSOM 的规则留着，热更新时按类名换掉
 */
const inserted = new Map<
  string,
  {
    texts: readonly string[];
    rules: CSSRule[];
    /** 从服务端输出的样式表接管来的：规则已在表里，只知道名字 */
    adopted?: boolean;
  }
>();
let sheet: CSSStyleSheet | null | undefined;
/** 样式表认 @layer（浏览器都认；happy-dom 不认，插不带层的规则） */
let layered = true;

/** 样式标签的 nonce（内容安全策略）：setStyleNonce 设的，没设时读 Vite 约定的 `<meta property="csp-nonce">` */
let nonce: string | undefined;

/**
 * 内容安全策略（CSP）的 nonce：页面的 style-src 不允许 'unsafe-inline' 时，引擎建的 `<style>` 要带上它浏览器才认。
 * 要在第一条样式插入之前设（createUi 的 nonce 选项会设）：浏览器只在 `<style>` 进入页面时查 nonce，之后经 CSSOM 加规则不受限。
 * Vite 配了 `html.cspNonce` 时自动读到，不必再设
 */
export function setStyleNonce(value: string | undefined): void {
  nonce = value;
}

/** 浏览器把 nonce 属性藏起来（getAttribute 读到空串），要读 .nonce；不支持 .nonce 的环境退回读属性 */
function metaNonce(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const meta = document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]');
  return meta?.nonce || meta?.getAttribute('nonce') || undefined;
}

/**
 * 引擎自己的样式表：放在 head 最前面，宿主页面后加载的同等特异性的 CSS 能盖过组件库。
 * 服务端渲染输出过这张表（renderStyleTag）时直接接管它：表里已有的规则按 data-names 登记，不再重复插入
 */
function styleSheet(): CSSStyleSheet | null {
  if (sheet !== undefined) return sheet;
  if (typeof document === 'undefined') return (sheet = null);
  const rendered = document.querySelector<HTMLStyleElement>('style[data-vue-tsx-pro]');
  if (rendered?.sheet) {
    fromServer = true;
    for (const name of rendered.dataset.names?.split(' ') ?? []) {
      if (name && !inserted.has(name)) inserted.set(name, { texts: [], rules: [], adopted: true });
    }
    // 服务端输出的表开头已经声明了层的顺序（renderStyleTag），这里只看环境认不认 @layer
    sheet = rendered.sheet;
    try {
      sheet.deleteRule(sheet.insertRule(`@layer ${layerName('vars')};`, sheet.cssRules.length));
    } catch {
      layered = false;
    }
    return sheet;
  }
  const element = document.createElement('style');
  element.dataset.vueTsxPro = '';
  const value = nonce ?? metaNonce();
  if (value) element.nonce = value;
  document.head.prepend(element);
  sheet = element.sheet;
  try {
    sheet?.insertRule(LAYER_ORDER, 0);
  } catch {
    layered = false;
  }
  return sheet;
}

/**
 * 插入一个名字的规则（已有时先删掉旧的：热更新改写规则）；layer 是规则所在的层（不给时不分层），
 * 记下的原文带层，插进样式表时环境不认 @layer 就不带
 */
export function insert(name: string, rawTexts: readonly string[], layer?: Layer) {
  const texts = rawTexts.map((text) => wrap(text, layer));
  const target = styleSheet();
  const previous = inserted.get(name);
  if (previous && target) {
    for (const rule of previous.rules) {
      const index = Array.prototype.indexOf.call(target.cssRules, rule);
      if (index >= 0) target.deleteRule(index);
    }
  }
  const rules: CSSRule[] = [];
  if (target) {
    for (const [index, text] of texts.entries()) {
      // 浏览器不认的规则（测试环境的 DOM 不认的语法）跳过，同 StyleX 的 inject；样式表里写错的 CSS 本来也会被忽略
      try {
        const rule = layered ? text : rawTexts[index]!;
        rules.push(target.cssRules[target.insertRule(rule, target.cssRules.length)]!);
      } catch {}
    }
  }
  inserted.set(name, { texts, rules });
}

/**
 * 按名字登记的规则（变量组）：模块执行时总会调用，同名再调用（热更新）换成新的取值。
 * 服务端输出过的不重复插入，只记下原文；之后的热更新照常插入，排在后面、盖过接管来的那条
 */
export function insertNamed(name: string, texts: readonly string[], layer?: Layer) {
  if (sheet === undefined) styleSheet();
  if (inserted.get(name)?.adopted)
    inserted.set(name, { texts: texts.map((text) => wrap(text, layer)), rules: [] });
  else insert(name, texts, layer);
}

/** 页面是服务端渲染出来的（接管了服务端输出的样式表） */
let fromServer = false;

/**
 * 动态样式是否一律写成变量（dynamic.ts）：在服务端渲染、或接管了服务端渲染的页面里是。
 * 动态样式平时把"一直没变过的值"直接写进类里，是否变过记在整个进程里：服务端渲染过许多页面后早已转成变量，
 * 刚打开的浏览器却还没有，同一个元素两边的类就对不上（水合不一致）。一律写成变量，两边按同样的规则出类
 */
export function variablesOnly(): boolean {
  if (sheet === undefined) styleSheet();
  return sheet === null || fromServer;
}

/** 这个名字的规则插过没有；浏览器里第一次问时先接管服务端输出的样式表（见 styleSheet） */
export function isInserted(name: string): boolean {
  if (sheet === undefined) styleSheet();
  return inserted.has(name);
}

/**
 * 服务端渲染：一段 HTML 用到的规则写成一个 `<style data-vue-tsx-pro data-names="…">`，放进 head 的最前面。
 * 包括 class 里出现的引擎类名（组合类、主题类、标记）、这些规则引用的关键帧，以及全部变量组（:root 上的默认值）与基础规则。
 * 类名按内容哈希，同样的样式在所有请求里同名，所以不必按请求隔离：渲染完按 HTML 取用到的就行。
 * 客户端接管这张表，data-names 里的规则不再重复插入。
 * `include`：HTML 里没出现也要带上的类名（防闪烁脚本会换到 <html> 上的主题类）；
 * `nonce`：这次响应的内容安全策略 nonce（每个请求不同，所以按次传，不用 setStyleNonce）
 */
export function renderStyleTag(
  html: string,
  options: { include?: readonly string[]; nonce?: string } = {},
): string {
  const used = new Set(options.include?.filter((name) => inserted.has(name)));
  for (const match of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const name of match[1]!.split(/\s+/)) if (inserted.has(name)) used.add(name);
  }
  for (const name of inserted.keys())
    if (name.startsWith('--') || name.startsWith(BASE_PREFIX)) used.add(name);
  // 规则里引用的关键帧（animation 的名字也是引擎生成的 x…-B）
  for (const name of [...used]) {
    for (const text of inserted.get(name)!.texts) {
      for (const frame of text.match(/\bx[0-9a-z]+-B\b/g) ?? [])
        if (inserted.has(frame)) used.add(frame);
    }
  }
  const names = [...inserted.keys()].filter((name) => used.has(name));
  // 层的顺序写在最前面：客户端接管这张表，之后插的规则按同样的顺序分层
  const css = [LAYER_ORDER, ...names.flatMap((name) => inserted.get(name)!.texts)].join('\n');
  // 规则原文里不会有 </style>；防御性地转义，免得用户的样式值截断标签
  const nonceAttr = options.nonce ? ` nonce="${options.nonce.replaceAll('"', '&quot;')}"` : '';
  return `<style data-vue-tsx-pro${nonceAttr} data-names="${names.join(' ')}">${css.replaceAll('</', '<\\/')}</style>`;
}

/** 已插入的全部规则原文，一条一行，最前面是层的顺序（小程序的构建、测试断言用） */
export function styleText(): string {
  return [LAYER_ORDER, ...[...inserted.values()].flatMap((record) => record.texts)].join('\n');
}

/** murmurhash2（同 @emotion/hash、StyleX 的 createHash），转 36 进制 */
export function hash(text: string): string {
  let h = 0;
  let i = 0;
  let length = text.length;
  for (; length >= 4; ++i, length -= 4) {
    let k =
      (text.charCodeAt(i) & 0xff) |
      ((text.charCodeAt(++i) & 0xff) << 8) |
      ((text.charCodeAt(++i) & 0xff) << 16) |
      ((text.charCodeAt(++i) & 0xff) << 24);
    k = (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16);
    k ^= k >>> 24;
    h =
      ((k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16)) ^
      ((h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16));
  }
  // 剩下不足 4 个字符的尾巴（同原算法的 switch 穿透）
  if (length >= 3) h ^= (text.charCodeAt(i + 2) & 0xff) << 16;
  if (length >= 2) h ^= (text.charCodeAt(i + 1) & 0xff) << 8;
  if (length >= 1) {
    h ^= text.charCodeAt(i) & 0xff;
    h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16);
  }
  h ^= h >>> 13;
  h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16);
  return ((h ^ (h >>> 15)) >>> 0).toString(36);
}
