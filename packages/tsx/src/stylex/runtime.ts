/**
 * 运行时的 StyleX：`stylex.create`、`keyframes`、`createTheme`、`when.*` 在运行时生成原子类与 CSS 规则，
 * 不需要 StyleX 的 Babel 插件。产物的形状与 StyleX 编译后的一致（`{ 属性: 类名, $$css: true }`、
 * 动态样式返回 `[类名表, 行内变量]`），`stylex.props` / `attrs` 的合并照旧。
 *
 * 语义照搬 StyleX 0.19（源码见 facebook/stylex 的 babel-plugin/src/shared）：
 *   - 每个“属性 + 值 + 条件”一个原子类，类名是它们的哈希；同一属性的各条件类合在一个键上，覆盖时整组替换；
 *   - 优先级同 @stylexjs/shared 的 getPriority（priority.ts 的精简版：长属性压过简写、:active 压过 :hover、@media 压过无条件…），
 *     注入交给 @stylexjs/stylex 自带的 inject（同一张样式表按优先级排序，并按优先级抬高选择器的特异性）；
 *   - at-rule 里的选择器按条件数重复类名（`.x.x`），when.* 再多重复一次，同编译版。
 *
 * 惰性：create 返回的对象，每个命名空间第一次被读到（多半是第一次渲染）时才展开、注入，结果留在对象上。
 * 规则按内容去重，同样的“属性 + 值 + 条件”只生成一次。
 *
 * `*.stylex.ts` 里的 defineVars、defineConsts、defineMarker 仍由 StyleX 编译（变量名要跨文件一致），
 * 编译时开 runtimeInjection，与这里共用同一张样式表。
 */
import inject from '@stylexjs/stylex/lib/stylex-inject';
import { getPriority } from './priority';

type StyleValue = string | number | null | undefined | readonly (string | number)[] | StyleObject;
interface StyleObject {
  readonly [key: string]: StyleValue;
}
/** 编译后的样式：属性键 → 类名（null 表示去掉前面合并进来的同名属性） */
type Compiled = { [key: string]: string | null | true; $$css: true };

/** 规则内容 → 类名：同一条规则只生成、注入一次 */
const classNames = new Map<string, string>();
/** 已注册的动态样式变量（@property，不往子元素继承） */
const dynamicVars = new Set<string>();

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
const UNITLESS = new Set([
  'WebkitLineClamp',
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'counterSet',
  'counterReset',
  'columnCount',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexOrder',
  'gridRow',
  'gridRowStart',
  'gridRowEnd',
  'gridColumn',
  'gridColumnStart',
  'gridColumnEnd',
  'gridArea',
  'fontWeight',
  'hyphenateLimitChars',
  'lineClamp',
  'lineHeight',
  'maskBorderOutset',
  'maskBorderSlice',
  'maskBorderWidth',
  'opacity',
  'order',
  'orphans',
  'tabSize',
  'widows',
  'zIndex',
  'fillOpacity',
  'floodOpacity',
  'rotate',
  'scale',
  'shapeImageThreshold',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
  'mathDepth',
  'zoom',
]);
const MILLISECONDS = new Set([
  'animationDelay',
  'animationDuration',
  'transitionDelay',
  'transitionDuration',
]);

/** 值转成 CSS 文本：数字按属性补单位（四位小数） */
function cssValue(property: string, value: string | number): string {
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

/** 一条原子规则：类名（第一次见到时注入） */
function atomic(property: string, value: string, conditions: readonly string[]): string {
  const key = `${conditions.join('')}|${property}:${value}`;
  let name = classNames.get(key);
  if (name) return name;
  name = `x${hash(key)}`;
  classNames.set(key, name);
  const pseudos = conditions.filter((c) => c.startsWith(':'));
  const atRules = conditions.filter((c) => c.startsWith('@'));
  // 伪类在前、伪元素在后：.x:hover::before
  const classes = pseudos.filter((p) => !p.startsWith('::')).join('');
  const elements = pseudos.filter((p) => p.startsWith('::')).join('');
  const selector =
    `.${name}` +
    (classes.includes(':where(') ? `.${name}` : '') +
    atRules.map(() => `.${name}`).join('') +
    classes +
    elements;
  const dashed = dashify(property);
  const declarations = (Array.isArray(value) ? value : [value])
    .map((v) => `${dashed}:${v}`)
    .join(';');
  const css = atRules.reduce(
    (rule, atRule) => `${atRule}{${rule}}`,
    `${selector}{${declarations}}`,
  );
  const priority =
    getPriority(dashed) +
    pseudos.reduce((sum, p) => sum + getPriority(p), 0) +
    atRules.reduce((sum, a) => sum + getPriority(a), 0);
  inject({ ltr: css, priority });
  return name;
}

/**
 * 一个属性（可能带条件对象 { default, ':hover', '@media …' }）展开成原子类，交给 visit；
 * 值为 null 时不生成（StyleX：null 表示去掉）
 */
function walk(
  property: string,
  value: StyleValue,
  conditions: readonly string[],
  visit: (
    value: string | number | readonly (string | number)[],
    conditions: readonly string[],
  ) => void,
) {
  if (value === null || value === undefined) return;
  if (isObject(value)) {
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'default') {
        walk(property, nested, conditions, visit);
        continue;
      }
      const condition = CONDITIONS[key] ?? key;
      // 条件只能是伪类、伪元素或 @ 规则；写错的别名、裸的属性选择器会被当成无条件样式，这里直接报出来
      if (!condition.startsWith(':') && !condition.startsWith('@')) {
        throw new Error(`stylex: ${property} 的条件 "${key}" 不是伪类、@ 规则或已知的别名`);
      }
      walk(property, nested, [...conditions, condition], visit);
    }
    return;
  }
  visit(value as string | number | readonly (string | number)[], conditions);
}

/** 命名空间里的每个属性：顶层的伪元素、条件块（'::before': {…}）展开成带前缀的属性 */
function eachProperty(
  namespace: StyleObject,
  visit: (key: string, property: string, value: StyleValue, conditions: readonly string[]) => void,
) {
  for (const [key, value] of Object.entries(namespace)) {
    const condition = CONDITIONS[key] ?? key;
    if ((condition.startsWith(':') || condition.startsWith('@')) && isObject(value)) {
      for (const [property, nested] of Object.entries(value)) {
        visit(`${key}_${property}`, property, nested, [condition]);
      }
    } else visit(key, key, value, []);
  }
}

/** 静态命名空间 → 类名表 */
function compileNamespace(namespace: StyleObject): Compiled {
  const compiled: Compiled = { $$css: true };
  eachProperty(namespace, (key, property, value, base) => {
    const classes: string[] = [];
    walk(property, value, base, (leaf, conditions) => {
      const text = Array.isArray(leaf)
        ? leaf.map((v) => cssValue(property, v)).join(', ')
        : cssValue(property, leaf as string | number);
      classes.push(atomic(property, text, conditions));
    });
    compiled[key] = classes.length ? [...new Set(classes)].join(' ') : null;
  });
  return compiled;
}

/** 动态样式的变量名：按属性与条件，同 StyleX 的 --x-属性（带条件时加条件的哈希） */
function dynamicVar(property: string, conditions: readonly string[]): string {
  const name = conditions.length
    ? `--x-${property}-${hash(conditions.join(''))}`
    : `--x-${property}`;
  if (!dynamicVars.has(name)) {
    dynamicVars.add(name);
    // 不继承：子元素用同一个动态类却没设值时，不会拿到父元素的值
    inject({ ltr: `@property ${name} { syntax: "*"; inherits: false;}`, priority: 0 });
  }
  return name;
}

/** 动态样式：每个值走一个固定的类（引用变量），值写进行内的变量；返回 [类名表, 行内变量] */
function dynamicNamespace(factory: (...args: never[]) => StyleObject) {
  return (...args: never[]) => {
    const compiled: Compiled = { $$css: true };
    const inline: Record<string, string> = {};
    eachProperty(factory(...args), (key, property, value, base) => {
      const classes: string[] = [];
      walk(property, value, base, (leaf, conditions) => {
        const variable = dynamicVar(property, conditions);
        classes.push(atomic(property, `var(${variable})`, conditions));
        inline[variable] = Array.isArray(leaf)
          ? leaf.map((v) => cssValue(property, v)).join(', ')
          : cssValue(property, leaf as string | number);
      });
      compiled[key] = classes.length ? classes.join(' ') : null;
    });
    return [compiled, inline] as const;
  };
}

/** stylex.create：命名空间第一次被读时展开（惰性），动态样式（函数）每次调用生成行内变量 */
export function create<S extends Record<string, unknown>>(namespaces: S): S {
  const result: Record<string, unknown> = {};
  for (const [name, namespace] of Object.entries(namespaces)) {
    if (typeof namespace === 'function') {
      result[name] = dynamicNamespace(namespace as (...args: never[]) => StyleObject);
      continue;
    }
    Object.defineProperty(result, name, {
      enumerable: true,
      configurable: true,
      get() {
        const compiled = compileNamespace(namespace as StyleObject);
        Object.defineProperty(result, name, { value: compiled, enumerable: true });
        return compiled;
      },
    });
  }
  return result as S;
}

/** stylex.keyframes：返回动画名，规则第一次调用时注入 */
export function keyframes(frames: Record<string, StyleObject>): string {
  const body = Object.entries(frames)
    .map(
      ([step, declarations]) =>
        `${step}{${Object.entries(declarations)
          .filter(([, value]) => value !== null && value !== undefined)
          .map(
            ([property, value]) =>
              `${dashify(property)}:${cssValue(property, value as string | number)}`,
          )
          .join(';')}}`,
    )
    .join('');
  const name = `x${hash(body)}-B`;
  if (!classNames.has(`@keyframes ${name}`)) {
    classNames.set(`@keyframes ${name}`, name);
    inject({ ltr: `@keyframes ${name}{${body}}`, priority: 0 });
  }
  return name;
}

/** 变量组（*.stylex.ts 里编译好的 defineVars）：变量名是 var(--x…) 里的名字 */
type VarGroup = Record<string, string> & { __varGroupHash__: string };

/**
 * stylex.createTheme：一个只改变量的类（同编译版：`.x.x, .x.x:root { --变量: 值 }`，优先级 0.4），
 * 返回 `{ [变量组哈希]: '主题类 变量组哈希', $$css: true }`；值可以是条件对象（{ default, '@media …' }）
 */
export function createTheme(group: VarGroup, overrides: Record<string, StyleValue>) {
  const groupHash = group.__varGroupHash__;
  const name = `x${hash(groupHash + JSON.stringify(overrides))}`;
  if (!classNames.has(`theme ${name}`)) {
    classNames.set(`theme ${name}`, name);
    const byAtRule = new Map<string, string[]>();
    for (const [key, value] of Object.entries(overrides)) {
      const variable = /var\((--[^)]+)\)/.exec(group[key] ?? '')?.[1];
      if (!variable) continue;
      walk(key, value, [], (leaf, conditions) => {
        const atRule = conditions.join('');
        const list = byAtRule.get(atRule) ?? [];
        list.push(`${variable}:${cssValue('--', leaf as string | number)}`);
        byAtRule.set(atRule, list);
      });
    }
    for (const [atRule, declarations] of byAtRule) {
      const rule = `.${name}.${name}, .${name}.${name}:root{${declarations.join(';')}}`;
      inject({
        ltr: atRule ? `${atRule}{${rule}}` : rule,
        priority: 0.4 + (atRule ? getPriority(atRule) / 10 : 0),
      });
    }
  }
  return { [groupHash]: `${name} ${groupHash}`, $$css: true } as const;
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
