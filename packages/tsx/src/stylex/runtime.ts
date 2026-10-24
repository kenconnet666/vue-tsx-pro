/**
 * 运行时样式引擎：写法同 StyleX（create、attrs、createTheme、keyframes、when），实现同 Emotion / zerodep-css：
 * 一个元素一次 attrs 合成一个类，规则在第一次用到时插入；状态变化只改该改的那一处。
 *
 *   - create 只产出“片段”（声明表），不注入；命名空间第一次被读到时才展开。
 *   - attrs(片段…) 按片段对象逐层查缓存（WeakMap 链），命中时不拼字符串、不算哈希，返回同一个结果对象，
 *     Vue 比对 class 相同就不碰 DOM。未命中时合并成一个组合类：`.c{…} .c:hover{…} @media(…){.c.c{…}}`，
 *     类名是内容的哈希，同样的组合只插一次。一个元素只挂一个生成的类，没有原子类之间的优先级问题；
 *     块内按 StyleX 的属性优先级排序（简写在前、长属性在后），条件块按条件优先级排序（:hover < :active < @media）。
 *   - 合并语义：后面的普通值整体替换该属性（同 StyleX，含它的条件值）；条件对象按条件逐项合并，
 *     其中的 null 表示“这个条件不改”（不会像 StyleX 那样把前面的默认值清掉）；顶层的 null 去掉该属性。
 *   - 动态样式（create 里的函数）：一直没变过的属性写进类里；值变过的属性永久转成变量（类里写 var(--x-属性)、
 *     值进元素的行内样式），之后值怎么变类名都不变、不插新规则。变量注册为不继承（@property inherits: false）。
 *   - 响应式绑定（stylex.bind，编译器把 JSX 里的 `styles.bar(item.width)` 自动改写成它）：渲染时只算类名、不追踪依赖，
 *     元素挂上后由一个响应式 effect 直接改元素上的变量。值变化不重新渲染组件、不做 vdom 比对，只改那一个变量。
 *   - 状态样式用条件别名（_selected、_disabled…）跟着 DOM 上的 aria / data 属性走：状态变化只改属性，类名不变。
 *   - 主题（createTheme）是一个只改变量的类，换主题只换这个类，组件不用重新渲染。
 *   - 热更新（hotStyles，编译器包在顶层 create / recipe 外面）：模块重新执行时新声明写进旧片段，
 *     用到它的组合类按原类名改写规则，组件不重新渲染。
 *
 * 编译模式（StyleX 在编译期把 create 换成原子类）产出的对象不是片段，attrs 交给 StyleX 的 props 处理，两种模式都能用。
 * `*.stylex.ts` 里的 defineVars、defineConsts、defineMarker 仍由 StyleX 编译（变量名要跨文件、跨源码与产物一致）。
 */
import { props as stylexProps } from '@stylexjs/stylex';
import { getCurrentInstance, ReactiveEffect, type ComponentInternalInstance } from 'vue';
import { untrack } from '../runtime/state';
import { getPriority } from './priority';

type Leaf = string | number;
type StyleValue = Leaf | null | undefined | readonly Leaf[] | StyleObject;
interface StyleObject {
  readonly [key: string]: StyleValue;
}

/** 一个属性的取值：条件链（伪类、@ 规则按书写顺序，用 \0 连接；无条件是 ''）→ 值 */
interface PropertyEntry {
  /** 普通值（或顶层 null）：合并时整体替换前面的同名属性；条件对象为 false，按条件逐项合并 */
  readonly replace: boolean;
  readonly values: ReadonlyMap<string, readonly string[]>;
}
/** 片段的声明表：属性（连字符写法）→ 取值 */
type Declarations = ReadonlyMap<string, PropertyEntry>;

/** 规则文本里类名的占位（控制字符，不会出现在 CSS 值里；& 可能出现在 url 里） */
const SELF = '\u0001';

const FRAGMENT = Symbol('stylex fragment');
const THEME = Symbol('stylex theme');
const DYNAMIC = Symbol('stylex dynamic');
const BINDING = Symbol('stylex binding');
const EVALUATE = Symbol('stylex evaluate');

/** 动态样式算一次的结果：片段（只随形状变）与行内变量 */
interface Evaluated {
  readonly fragment: Fragment;
  readonly inline: Readonly<Record<string, string>>;
}
/** create 里的函数：调用得到 [片段, 行内变量]；EVALUATE 给 attrs 与绑定用 */
interface DynamicStyle {
  (...args: never[]): readonly [Fragment, Readonly<Record<string, string>>];
  readonly [EVALUATE]: (args: readonly unknown[]) => Evaluated;
}

/** create 的一个命名空间（对外的类型是 CompiledStyles，$$css 让它能和编译版的样式一起传） */
interface Fragment {
  readonly $$css: true;
  readonly [FRAGMENT]: Declarations;
}
/** createTheme 的结果：变量组 → 主题类 */
interface ThemeStyle {
  readonly $$css: true;
  readonly [THEME]: readonly [group: string, className: string];
}
/** attrs 的结果 */
export interface Attrs {
  /** 组合类，加上主题、标记的类 */
  class?: string;
  /** 动态样式的行内变量 */
  style?: Readonly<Record<string, string>>;
  /** 有响应式绑定时：元素挂上后起 effect 改变量，卸载时停掉 */
  ref?: (element: unknown) => void;
}

/* ───────────────────────── 样式表 ───────────────────────── */

/**
 * 插过的规则：类名（关键帧名、变量名）→ 规则原文与 CSSOM 里的规则。同样的内容只插一次；
 * 原文给 SSR 输出 <style>，也不依赖 CSSOM 的序列化（浏览器、测试用的 DOM 会丢掉不认识的声明）；
 * CSSOM 的规则留着，热更新时按类名换掉
 */
const inserted = new Map<string, { texts: readonly string[]; rules: CSSRule[] }>();
let sheet: CSSStyleSheet | null | undefined;

/** 引擎自己的样式表：放在 head 最前面，宿主页面后加载的同等特异性的 CSS 能盖过组件库 */
function styleSheet(): CSSStyleSheet | null {
  if (sheet !== undefined) return sheet;
  if (typeof document === 'undefined') return (sheet = null);
  const element = document.createElement('style');
  element.dataset.vueTsxPro = '';
  document.head.prepend(element);
  return (sheet = element.sheet);
}

/** 插入一个名字的规则（已有时先删掉旧的：热更新改写规则） */
function insert(name: string, texts: readonly string[]) {
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
    for (const text of texts) {
      // 浏览器不认的规则（老浏览器的 @property、测试环境的 DOM）跳过，同 StyleX 的 inject；样式表里写错的 CSS 本来也会被忽略
      try {
        rules.push(target.cssRules[target.insertRule(text, target.cssRules.length)]!);
      } catch {}
    }
  }
  inserted.set(name, { texts, rules });
}

/** 已插入的全部规则原文，一条一行（SSR 输出 <style> 用） */
export function styleText(): string {
  return [...inserted.values()].flatMap((record) => record.texts).join('\n');
}

/* ───────────────────────── 值与条件 ───────────────────────── */

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

/** camelCase → kebab-case；自定义属性（--x）原样 */
const dashify = (property: string) =>
  property.startsWith('--') ? property : property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

// 数字不补 px 的属性、补 ms 的属性：同 StyleX（babel-plugin/src/shared/utils/transform-value.js）
const UNITLESS = new Set(
  'WebkitLineClamp animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth counterSet counterReset columnCount flex flexGrow flexShrink flexOrder gridRow gridRowStart gridRowEnd gridColumn gridColumnStart gridColumnEnd gridArea fontWeight hyphenateLimitChars lineClamp lineHeight maskBorderOutset maskBorderSlice maskBorderWidth opacity order orphans tabSize widows zIndex fillOpacity floodOpacity rotate scale shapeImageThreshold stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth mathDepth zoom'.split(
    ' ',
  ),
);
const MILLISECONDS = new Set([
  'animationDelay',
  'animationDuration',
  'transitionDelay',
  'transitionDuration',
]);

/** 值转成 CSS 文本：数字按属性补单位（四位小数） */
function cssValue(property: string, value: Leaf): string {
  if (typeof value === 'string') return value.trim();
  const rounded = String(Math.round(value * 10000) / 10000);
  if (UNITLESS.has(property) || property.startsWith('--')) return rounded;
  return rounded + (MILLISECONDS.has(property) ? 'ms' : 'px');
}

/**
 * 条件别名：样式里写 `{ color: { default: '_text', _selected: '_accentText' } }`，状态跟着 DOM 上的
 * aria / data 属性走（COMPONENTS.md §2.2），组件不必再写 `selected && styles.selected`；
 * 一个别名合并了原生、ARIA、data 几种写法，使用方不必关心组件用的是哪一种
 */
export const CONDITIONS: Readonly<Record<string, string>> = {
  _hover: ':hover',
  _active: ':active',
  _focus: ':focus',
  _focusVisible: ':focus-visible',
  _focusWithin: ':focus-within',
  _disabled: ':is(:disabled,[aria-disabled="true"],[data-disabled])',
  _selected: ':is([aria-selected="true"],[data-selected])',
  _checked: ':is(:checked,[aria-checked="true"],[data-state="checked"])',
  _indeterminate: ':is(:indeterminate,[aria-checked="mixed"],[data-state="indeterminate"])',
  _pressed: ':is([aria-pressed="true"],[data-pressed])',
  _expanded: ':is([aria-expanded="true"],[data-expanded])',
  _open: ':is([open],[data-state="open"])',
  _current: ':is([aria-current]:not([aria-current="false"]),[data-current])',
  _invalid: ':is([aria-invalid="true"],[data-invalid])',
  _readonly: ':is([aria-readonly="true"],[data-readonly])',
  _highlighted: ':is([data-highlighted])',
  _dragging: ':is([data-dragging])',
  _placeholder: '::placeholder',
  _forcedColors: '@media (forced-colors: active)',
  _reducedMotion: '@media (prefers-reduced-motion: reduce)',
  _rtl: ':dir(rtl)',
};

const isObject = (value: unknown): value is StyleObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** 条件键 → 选择器片段或 @ 规则；写错的别名、裸的属性选择器直接报错（否则会变成无条件样式） */
function condition(property: string, key: string): string {
  const resolved = CONDITIONS[key] ?? key;
  if (!resolved.startsWith(':') && !resolved.startsWith('@')) {
    throw new Error(`stylex: ${property} 的条件 "${key}" 不是伪类、@ 规则或已知的别名`);
  }
  return resolved;
}

/* ───────────────────────── 片段 ───────────────────────── */

/** 命名空间展开后的一个叶子 */
interface LeafEntry {
  property: string;
  /** 顶层的普通值（含 null）：合并时整体替换前面的同名属性 */
  replace: boolean;
  chain: readonly string[];
  /** CSS 文本（回退值数组是多条）；顶层 null 是 null：去掉该属性 */
  texts: readonly string[] | null;
}

const texts = (property: string, value: Leaf | readonly Leaf[]) =>
  (Array.isArray(value) ? value : [value as Leaf]).map((v) => cssValue(property, v));

/** 命名空间的每个叶子。顶层的条件块（'::before': {…}、':hover': {…}）展开成各属性的条件值 */
function eachLeaf(namespace: StyleObject, visit: (leaf: LeafEntry) => void) {
  for (const [key, value] of Object.entries(namespace)) {
    const resolved = CONDITIONS[key] ?? key;
    if ((resolved.startsWith(':') || resolved.startsWith('@')) && isObject(value)) {
      for (const [property, nested] of Object.entries(value)) {
        walk(property, nested, [resolved], (chain, leaf) =>
          visit({ property, replace: false, chain, texts: texts(property, leaf) }),
        );
      }
    } else if (value === null || value === undefined) {
      visit({ property: key, replace: true, chain: [], texts: null });
    } else {
      const replace = !isObject(value);
      walk(key, value, [], (chain, leaf) =>
        visit({ property: key, replace, chain, texts: texts(key, leaf) }),
      );
    }
  }
}

/** 叶子 → 声明表 */
function tableOf(leaves: readonly LeafEntry[]): Declarations {
  const table = new Map<string, { replace: boolean; values: Map<string, readonly string[]> }>();
  for (const { property, replace, chain, texts } of leaves) {
    const dashed = dashify(property);
    let entry = table.get(dashed);
    if (!entry) table.set(dashed, (entry = { replace, values: new Map() }));
    if (texts) entry.values.set(chain.join('\0'), texts);
  }
  return table;
}

function declarations(namespace: StyleObject): Declarations {
  const leaves: LeafEntry[] = [];
  eachLeaf(namespace, (leaf) => leaves.push(leaf));
  return tableOf(leaves);
}

/** 条件对象逐层展开到叶子；null / undefined 不产出（条件里的 null 表示“这个条件不改”） */
function walk(
  property: string,
  value: StyleValue,
  chain: readonly string[],
  visit: (chain: readonly string[], value: Leaf | readonly Leaf[]) => void,
) {
  if (value === null || value === undefined) return;
  if (!isObject(value)) return visit(chain, value as Leaf | readonly Leaf[]);
  for (const [key, nested] of Object.entries(value)) {
    walk(property, nested, key === 'default' ? chain : [...chain, condition(property, key)], visit);
  }
}

// 声明表可写：热更新时换成新的（hotStyles），片段对象本身不变，用到它的缓存、已渲染的类照样有效
const fragment = (table: Declarations): Fragment =>
  Object.defineProperty({ $$css: true }, FRAGMENT, { value: table, writable: true }) as Fragment;

/** 动态样式的变量名：按属性与条件（同 StyleX 的 --x-属性），注册为不继承 */
function dynamicVar(property: string, chain: readonly string[]): string {
  const name = chain.length ? `--x-${property}-${hash(chain.join(''))}` : `--x-${property}`;
  // 不继承：子元素用同一个动态类却没设值时，不会拿到父元素的值
  if (!inserted.has(name)) insert(name, [`@property ${name}{syntax:"*";inherits:false}`]);
  return name;
}

/**
 * 动态样式：一直没变过的属性直接写进类里（多半是常量，同手写，元素上不挂变量）；
 * 值一旦和第一次不同，这个属性就永久转成变量（类里写 var(--x-属性)、值进行内样式）。
 * 一个动态命名空间最多产生“属性数 + 1”种类，不随取值增长；转成变量之后值怎么变类都不变。
 * StyleX 把动态命名空间的属性一律变成行内变量，每个元素多挂几个，样式重算更慢。
 * 响应式绑定遇到“这个属性刚开始变”（类还是写死的那种）时请组件重新渲染一次换类，之后只改变量
 */
function dynamic(factory: (...args: never[]) => StyleObject): DynamicStyle {
  const first = new Map<string, string>();
  const varying = new Set<string>();
  const shapes = new Map<string, Fragment>();
  const evaluate = (args: readonly unknown[]): Evaluated => {
    const inline: Record<string, string> = {};
    const leaves: LeafEntry[] = [];
    let shape = '';
    eachLeaf(factory(...(args as never[])), (leaf) => {
      const key = leaf.chain.length ? `${leaf.property}\0${leaf.chain.join('\0')}` : leaf.property;
      const text = leaf.texts?.join(', ') ?? '';
      const seen = first.get(key);
      if (seen === undefined) first.set(key, text);
      else if (seen !== text) varying.add(key);
      if (!leaf.texts || !varying.has(key)) {
        shape += `${key}=${text};`;
        leaves.push(leaf);
        return;
      }
      const variable = dynamicVar(leaf.property, leaf.chain);
      inline[variable] = text;
      shape += `${key};`;
      leaves.push({ ...leaf, texts: [`var(${variable})`] });
    });
    let shared = shapes.get(shape);
    if (!shared) shapes.set(shape, (shared = fragment(tableOf(leaves))));
    return { fragment: shared, inline };
  };
  const style = (...args: never[]) => {
    const { fragment, inline } = evaluate(args);
    const result = [fragment, inline] as const;
    Object.defineProperty(result, DYNAMIC, { value: true });
    return result;
  };
  return Object.assign(style, { [EVALUATE]: evaluate });
}

/** 一个响应式绑定：动态样式与读参数的函数 */
interface Binding {
  readonly [BINDING]: true;
  readonly style: DynamicStyle;
  readonly args: () => readonly unknown[];
}

/**
 * 动态样式的响应式绑定：`stylex.bind(styles.bar, () => [item.width])`。交给 attrs / sx 后，
 * 参数变化时只改元素上的变量，不重新渲染组件。JSX 里写 `styles.bar(item.width)` 时编译器自动改写成它
 */
export function bind<Args extends unknown[]>(
  style: (...args: Args) => unknown,
  args: () => NoInfer<Args>,
): Binding {
  return { [BINDING]: true, style: style as unknown as DynamicStyle, args };
}

/** stylex.create：命名空间第一次被读时展开（惰性）；函数是动态样式 */
export function create<S extends Record<string, unknown>>(namespaces: S): S {
  const result: Record<string, unknown> = {};
  for (const [name, namespace] of Object.entries(namespaces)) {
    if (typeof namespace === 'function') {
      result[name] = dynamic(namespace as (...args: never[]) => StyleObject);
      continue;
    }
    Object.defineProperty(result, name, {
      enumerable: true,
      configurable: true,
      get() {
        const value = fragment(declarations(namespace as StyleObject));
        Object.defineProperty(result, name, { value, enumerable: true, configurable: true });
        return value;
      },
    });
  }
  return result as S;
}

/* ───────────────────────── 组合 ───────────────────────── */

/** 合并几个片段的声明表（规则见文件开头），不改动片段本身 */
function merge(tables: readonly Declarations[]): Declarations {
  if (tables.length === 1) return tables[0]!;
  const merged = new Map<string, PropertyEntry>();
  for (const table of tables) {
    for (const [property, entry] of table) {
      const previous = merged.get(property);
      if (!previous || entry.replace) merged.set(property, entry);
      else
        merged.set(property, {
          replace: false,
          values: new Map([...previous.values, ...entry.values]),
        });
    }
  }
  return merged;
}

/** 条件链的排序权重：伪类、@ 规则的优先级相加（同 StyleX 的规则顺序） */
const chainWeight = (chain: string) =>
  chain ? chain.split('\0').reduce((sum, part) => sum + getPriority(part), 0) : 0;

/**
 * 声明表 → 规则文本（类名用 SELF 占位）。每个条件链一条规则：
 * @ 规则里的选择器按层数重复类名（.c.c），压过同级的伪类；when.*（:where）再重复一次，同 StyleX
 */
function serialize(table: Declarations): string[] {
  const byChain = new Map<string, [property: string, values: readonly string[]][]>();
  for (const [property, entry] of table) {
    for (const [chain, values] of entry.values) {
      let list = byChain.get(chain);
      if (!list) byChain.set(chain, (list = []));
      list.push([property, values]);
    }
  }
  return [...byChain]
    .sort(([a], [b]) => chainWeight(a) - chainWeight(b))
    .map(([chain, list]) => {
      const body = list
        .sort(([a], [b]) => getPriority(a) - getPriority(b))
        .flatMap(([property, values]) => values.map((value) => `${property}:${value}`))
        .join(';');
      const parts = chain ? chain.split('\0') : [];
      const atRules = parts.filter((part) => part.startsWith('@'));
      const pseudos = parts.filter((part) => part.startsWith(':'));
      const classes = pseudos.filter((part) => !part.startsWith('::')).join('');
      const elements = pseudos.filter((part) => part.startsWith('::')).join('');
      const selector =
        `.${SELF}`.repeat(1 + atRules.length + (classes.includes(':where(') ? 1 : 0)) +
        classes +
        elements;
      return atRules.reduceRight((rule, atRule) => `${atRule}{${rule}}`, `${selector}{${body}}`);
    });
}

/** 组合类 → 组成它的片段；片段 → 用到它的组合类（热更新改了片段时据此改写规则） */
const composites = new Map<string, readonly Fragment[]>();
const usedBy = new WeakMap<Fragment, Set<string>>();

/** 组合一组片段：类名是规则内容的哈希，第一次出现时插入 */
function composite(fragments: readonly Fragment[]): string {
  const rules = serialize(merge(fragments.map((part) => part[FRAGMENT])));
  if (!rules.length) return '';
  const name = `x${hash(rules.join(''))}`;
  if (!inserted.has(name))
    insert(
      name,
      rules.map((rule) => rule.replaceAll(SELF, name)),
    );
  if (!composites.has(name)) {
    composites.set(name, fragments);
    for (const part of fragments) {
      let names = usedBy.get(part);
      if (!names) usedBy.set(part, (names = new Set()));
      names.add(name);
    }
  }
  return name;
}

/** 组合缓存：按参与的对象（片段、主题、编译版的样式）逐层索引 */
interface CacheNode {
  next?: WeakMap<object, CacheNode>;
  result?: Attrs;
}
const cache: CacheNode = {};

type AttrsArg = StyleValue | boolean | object | readonly AttrsArg[];

/**
 * 合并样式成元素属性 `{ class, style }`，后面的覆盖前面的；假值忽略，可以嵌套成数组。
 * 只有静态片段时返回缓存的同一个对象；有动态样式时 class 走缓存，style 是这次的变量值；
 * 有响应式绑定（bind）时再带一个 ref：元素挂上后由 effect 改变量（见 watchBindings）
 */
export function attrs(...styles: readonly AttrsArg[]): Attrs {
  const parts: object[] = [];
  let inline: Record<string, string> | undefined;
  let bindings: BindingEntry[] | undefined;
  const addInline = (values: Readonly<Record<string, string>>) => {
    // 还没有属性转成变量时行内为空：不给 style，结果仍是缓存的同一个对象
    for (const _ in values) {
      inline = Object.assign(inline ?? {}, values);
      return;
    }
  };
  const collect = (value: AttrsArg) => {
    if (!value || typeof value !== 'object') return;
    if (BINDING in value) {
      // 渲染时只取这一次的值算类名与首屏的变量，不追踪：参数变化交给元素上的 effect，不让组件重新渲染
      const binding = value as Binding;
      const { fragment, inline: values } = untrack(() => binding.style[EVALUATE](binding.args()));
      parts.push(fragment);
      addInline(values);
      (bindings ??= []).push({ binding, fragment, initial: Object.keys(values) });
      return;
    }
    if (Array.isArray(value)) {
      if (DYNAMIC in value) {
        parts.push(value[0] as object);
        addInline(value[1] as Record<string, string>);
      } else if (isCompiledDynamic(value)) {
        // 编译模式：StyleX 编译期生成的动态样式也返回 [类名表, 行内变量]，变量值可能是数字或空
        parts.push(value[0]);
        const values: Record<string, string> = {};
        for (const [name, v] of Object.entries(value[1]))
          if (v != null) values[name] = String(v as string | number);
        addInline(values);
      } else value.forEach(collect);
      return;
    }
    parts.push(value);
  };
  styles.forEach(collect);

  let node = cache;
  for (const part of parts) {
    node.next ??= new WeakMap();
    let child = node.next.get(part);
    if (!child) node.next.set(part, (child = {}));
    node = child;
  }
  node.result ??= resolve(parts);
  if (!inline && !bindings) return node.result;
  const result: Attrs = inline ? { ...node.result, style: inline } : { ...node.result };
  if (bindings) result.ref = watchBindings(bindings);
  return result;
}

/**
 * StyleX 编译期的动态样式结果：[带 $$css 的类名表, 变量表]，变量表的键都是 --x… 变量名
 * （要和两个样式组成的数组 `[styles.a, stylex.bind(…)]` 区分开）
 */
const isCompiledDynamic = (value: readonly unknown[]): value is [object, Record<string, unknown>] =>
  value.length === 2 &&
  isObject(value[0]) &&
  '$$css' in value[0] &&
  isObject(value[1]) &&
  !('$$css' in value[1]) &&
  !(BINDING in value[1]) &&
  Object.keys(value[1]).every((key) => key.startsWith('--'));

/** 一次渲染里的一个绑定：渲染时算出的片段，与它写在行内的变量（effect 只管这些，同一元素上别的动态样式的变量不碰） */
interface BindingEntry {
  binding: Binding;
  fragment: Fragment;
  initial: readonly string[];
}

/** 一个元素上的响应式绑定：重新渲染时复用（只换读取函数），卸载时停掉 */
interface BoundElement {
  bindings: readonly BindingEntry[];
  /** 元素已卸载、effect 已停 */
  stopped: boolean;
  /** 现在写在元素上的变量 */
  applied: Set<string>;
  effect: ReactiveEffect;
  /** 形状变了时请它重新渲染 */
  instance: ComponentInternalInstance | null;
}
const boundElements = new WeakMap<Element, BoundElement>();

/** 变了的绑定攒到同一个微任务里批量更新（同一轮里改几次参数只改一次 DOM） */
const dirty = new Set<BoundElement>();
function schedule(bound: BoundElement) {
  if (!dirty.size) queueMicrotask(flush);
  dirty.add(bound);
}
function flush() {
  // 先取出再清空：某个绑定出错时，之后的更新照样能排进新的微任务
  const batch = [...dirty];
  dirty.clear();
  for (const bound of batch) if (!bound.stopped) bound.effect.run();
}

/** 读绑定的参数、只改元素上变了的变量；形状变了（多出、少了属性）时类也要换，请组件重新渲染 */
function apply(element: HTMLElement, bound: BoundElement) {
  const next = new Set<string>();
  let reshaped = false;
  for (const { binding, fragment } of bound.bindings) {
    const evaluated = binding.style[EVALUATE](binding.args());
    if (evaluated.fragment !== fragment) reshaped = true;
    for (const name in evaluated.inline) {
      const value = evaluated.inline[name]!;
      next.add(name);
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
    }
  }
  for (const name of bound.applied) if (!next.has(name)) element.style.removeProperty(name);
  bound.applied = next;
  if (reshaped) bound.instance?.proxy?.$forceUpdate();
}

/**
 * 元素的 ref：挂上时起一个 effect（Vue 公开的 ReactiveEffect，依赖变化时排进微任务）；
 * 组件重新渲染会给一个新的 ref 函数，同一个元素就复用原来的 effect，换上这次的读取函数重跑一次（重新收集依赖）；
 * 卸载时 Vue 用 null 调用 ref，停掉 effect。（ref 函数换了时 Vue 不会用 null 调旧的那个，所以状态按元素存）
 */
function watchBindings(bindings: readonly BindingEntry[]) {
  const instance = getCurrentInstance();
  let current: Element | undefined;
  return (element: unknown) => {
    if (!element) {
      if (!current) return;
      const bound = boundElements.get(current);
      if (bound) {
        bound.stopped = true;
        bound.effect.stop();
      }
      boundElements.delete(current);
      current = undefined;
      return;
    }
    current = element as HTMLElement;
    const existing = boundElements.get(current);
    if (existing) {
      existing.bindings = bindings;
      existing.instance = instance;
      existing.effect.run();
      return;
    }
    const target = current as HTMLElement;
    const bound: BoundElement = {
      bindings,
      stopped: false,
      applied: new Set(bindings.flatMap((entry) => entry.initial)),
      instance,
      effect: new ReactiveEffect(() => apply(target, bound)),
    };
    bound.effect.scheduler = () => schedule(bound);
    boundElements.set(target, bound);
    bound.effect.run();
  };
}

/** 缓存没命中：片段合成一个类；主题按变量组后者覆盖前者；编译版的样式交给 StyleX 的 props */
function resolve(parts: readonly object[]): Attrs {
  const fragments: Fragment[] = [];
  const themes = new Map<string, string>();
  const compiled: object[] = [];
  for (const part of parts) {
    if (FRAGMENT in part) fragments.push(part as Fragment);
    else if (THEME in part) {
      const [group, className] = (part as ThemeStyle)[THEME];
      themes.delete(group);
      themes.set(group, className);
    } else compiled.push(part);
  }
  const classes = [
    fragments.length ? composite(fragments) : '',
    ...themes.values(),
    compiled.length ? (stylexProps(compiled as never).className ?? '') : '',
  ].filter(Boolean);
  return Object.freeze(classes.length ? { class: classes.join(' ') } : {});
}

/* ───────────────────────── 热更新 ───────────────────────── */

/** 配方等自己管理状态的样式对象实现它：拿到同一 id 的新对象时把自己原地换成新的 */
export const HOT = Symbol('stylex hot');
const hotObjects = new Map<string, object>();

/**
 * 编译器包在顶层 `const 名 = stylex.create(…)` / `recipe(…)` 外面（开发服务器，compiler/style-hot.ts）：
 * 第一次登记；模块热更新重新执行时把新内容写进旧对象并返回旧对象——导入方手里拿的还是它，
 * 已插入的规则按原类名改写，组件不用重新渲染
 */
export function hotStyles<T extends object>(id: string, value: T): T {
  const previous = hotObjects.get(id) as T | undefined;
  if (!previous) {
    hotObjects.set(id, value);
    return value;
  }
  if (HOT in previous) (previous as { [HOT]: (next: T) => void })[HOT](value);
  else hotUpdate(previous as Record<string, unknown>, value as Record<string, unknown>);
  return previous;
}

/** create 的结果原地换成新的：已展开的片段换声明表并改写用到它的规则；动态样式、新加的命名空间直接换上 */
export function hotUpdate(previous: Record<string, unknown>, next: Record<string, unknown>) {
  for (const name of Object.keys(next)) {
    const value = next[name];
    const current = Object.getOwnPropertyDescriptor(previous, name);
    if (current && !current.get && isFragment(current.value) && isFragment(value)) {
      replaceFragment(current.value, value[FRAGMENT]);
    } else {
      Object.defineProperty(previous, name, { value, enumerable: true, configurable: true });
    }
  }
}

const isFragment = (value: unknown): value is Fragment =>
  typeof value === 'object' && value !== null && FRAGMENT in value;

/** 片段换成新的声明表，用到它的组合类按原类名重写规则 */
function replaceFragment(target: Fragment, table: Declarations) {
  (target as { [FRAGMENT]: Declarations })[FRAGMENT] = table;
  for (const name of usedBy.get(target) ?? []) {
    const fragments = composites.get(name)!;
    const rules = serialize(merge(fragments.map((part) => part[FRAGMENT])));
    insert(
      name,
      rules.map((rule) => rule.replaceAll(SELF, name)),
    );
  }
}

/* ───────────────────────── 关键帧、主题、条件选择器 ───────────────────────── */

/** stylex.keyframes：返回动画名，规则第一次调用时插入 */
export function keyframes(frames: Record<string, StyleObject>): string {
  const body = Object.entries(frames)
    .map(
      ([step, declarations]) =>
        `${step}{${Object.entries(declarations)
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([property, value]) => `${dashify(property)}:${cssValue(property, value as Leaf)}`)
          .join(';')}}`,
    )
    .join('');
  const name = `x${hash(body)}-B`;
  if (!inserted.has(name)) insert(name, [`@keyframes ${name}{${body}}`]);
  return name;
}

/** 变量组（*.stylex.ts 里编译好的 defineVars）：值是 var(--x…) */
type VarGroup = Record<string, string> & { __varGroupHash__: string };

/**
 * stylex.createTheme：一个只改变量的类（`.t.t, .t.t:root { --变量: 值 }`，压过 :root 上的默认值），
 * 值可以是条件对象（{ default, '@media …' }）。同一变量组的主题在一次 attrs 里后者覆盖前者
 */
export function createTheme(group: VarGroup, overrides: Record<string, StyleValue>): ThemeStyle {
  const groupHash = group.__varGroupHash__;
  const byAtRule = new Map<string, string[]>();
  for (const [key, value] of Object.entries(overrides)) {
    const variable = /var\((--[^)]+)\)/.exec(group[key] ?? '')?.[1];
    if (!variable) continue;
    walk(key, value, [], (chain, leaf) => {
      const atRule = chain.join('');
      let list = byAtRule.get(atRule);
      if (!list) byAtRule.set(atRule, (list = []));
      list.push(`${variable}:${cssValue('--', leaf as Leaf)}`);
    });
  }
  const rules = [...byAtRule].map(([atRule, list]) => {
    const rule = `.${SELF}.${SELF},.${SELF}.${SELF}:root{${list.join(';')}}`;
    return atRule ? `${atRule}{${rule}}` : rule;
  });
  const name = `x${hash(groupHash + rules.join(''))}`;
  if (!inserted.has(name))
    insert(
      name,
      rules.map((rule) => rule.replaceAll(SELF, name)),
    );
  return Object.freeze({ $$css: true, [THEME]: [groupHash, name] as const }) as ThemeStyle;
}

/** 标记（*.stylex.ts 里编译好的 defineMarker）的类名 */
const markerClass = (marker: Record<string, unknown> | undefined) =>
  marker ? Object.keys(marker).find((key) => key !== '$$css')! : 'x-default-marker';

/** stylex.when.*：按祖先、后代、兄弟的状态取样式的条件键（同编译版的 :where(…) 选择器） */
export const when = {
  ancestor: (pseudo: string, marker?: Record<string, unknown>) =>
    `:where(.${markerClass(marker)}${pseudo} *)`,
  descendant: (pseudo: string, marker?: Record<string, unknown>) =>
    `:where(:has(.${markerClass(marker)}${pseudo}))`,
  siblingBefore: (pseudo: string, marker?: Record<string, unknown>) =>
    `:where(.${markerClass(marker)}${pseudo} ~ *)`,
  siblingAfter: (pseudo: string, marker?: Record<string, unknown>) =>
    `:where(:has(~ .${markerClass(marker)}${pseudo}))`,
  anySibling: (pseudo: string, marker?: Record<string, unknown>) =>
    `:where(.${markerClass(marker)}${pseudo} ~ *, :has(~ .${markerClass(marker)}${pseudo}))`,
};
