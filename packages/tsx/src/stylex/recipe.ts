/**
 * 配方（recipe）：一个组件的部件 × 档位 × 默认值写在一处，渲染时一次调用拿到每个部件的样式（同 Panda 的 sva）。
 *
 *   const button = recipe({
 *     parts: ['root', 'icon'],
 *     base: { root: { display: 'inline-flex', color: { default: '_text', _disabled: '_textDisabled' } } },
 *     variants: {
 *       size: { sm: { root: { fontSize: '_sm' } }, md: { root: { fontSize: '_md' } } },
 *       fullWidth: { true: { root: { width: '100%' } } },        // 布尔档位写 true / false 键
 *     },
 *     compound: [{ when: { size: 'sm', fullWidth: true }, root: { paddingInline: 0 } }],
 *     defaults: { size: 'md' },
 *   });
 *   const s = button({ size, fullWidth });       // { root: [...样式], icon: [...] }，按档位组合缓存
 *   <button {...stylex.attrs(s.root, sx)} />
 *
 * 每个部件的样式是 create 的结果（片段，用到时才展开），合并时后者覆盖前者，
 * 所以“基础 < 档位 < 组合档位 < 调用方的 sx”的顺序由 attrs 的参数顺序保证。
 */
import type { CompiledStyles } from './index';
import { HOT, hotUpdate } from './hot';
import { create } from './runtime';

/** 一个部件的样式对象（同 stylex.create 的一组） */
type PartStyle = Record<string, unknown>;
/** 每个部件的样式（可以只写其中几个） */
type PartStyles<P extends string> = Partial<Record<P, PartStyle>>;
/** 档位：档位名 → 取值 → 各部件的样式 */
type Variants<P extends string> = Record<string, Record<string, PartStyles<P>>>;

/** 取值的键是 'true' / 'false' 时，调用侧收 boolean */
type ValueOf<K> = K extends 'true' | 'false' ? boolean : K;
/** 调用配方时的档位选择 */
export type VariantSelection<V> = {
  [Name in keyof V]?: ValueOf<keyof V[Name]> | null | undefined;
};

/** 配方的定义 */
export interface RecipeConfig<P extends string, V extends Variants<P>> {
  /** 部件名 */
  parts: readonly P[];
  /** 不分档位的基础样式 */
  base?: PartStyles<P>;
  /** 档位 */
  variants?: V;
  /** 几个档位同时取某些值时追加的样式 */
  compound?: readonly ({ when: VariantSelection<V> } & PartStyles<P>)[];
  /** 不传时的档位取值 */
  defaults?: VariantSelection<V>;
}

/** 编译后的样式（create 的结果） */
type Compiled = CompiledStyles;

/** 配方：传档位选择，返回每个部件的样式数组（交给 stylex.attrs） */
export interface Recipe<P extends string, V> {
  (selection?: VariantSelection<V>): Readonly<Record<P, readonly Compiled[]>>;
  /** 部件名 */
  readonly parts: readonly P[];
}

/** 定义配方（见文件开头） */
export function recipe<const P extends string, const V extends Variants<P> = {}>(
  config: RecipeConfig<P, V>,
): Recipe<P, V> {
  let state = build(config);
  const cache = new Map<string, Record<P, Compiled[]>>();

  const resolve = ((selection: Record<string, unknown> = {}) => {
    const { parts, names, defaults, segments, compound } = state;
    const picked = names.map((name) => {
      const value = selection[name] ?? defaults[name];
      return value === undefined || value === null
        ? undefined
        : String(value as string | number | boolean);
    });
    const key = picked.join('\0');
    const hit = cache.get(key);
    if (hit) return hit;
    const result = Object.fromEntries(parts.map((part) => [part, [] as Compiled[]])) as Record<
      P,
      Compiled[]
    >;
    const push = (styles: Record<P, Compiled> | undefined) => {
      if (!styles) return;
      for (const part of parts) if (part in styles) result[part].push(styles[part]);
    };
    push(segments.get('base'));
    names.forEach((name, index) => {
      const value = picked[index];
      if (value !== undefined) push(segments.get(`variant\0${name}\0${value}`));
    });
    compound.forEach(({ when }, index) => {
      const matches = Object.entries(when).every(
        ([name, value]) => picked[names.indexOf(name)] === String(value),
      );
      if (matches) push(segments.get(`compound\0${index}`));
    });
    cache.set(key, result);
    return result;
  }) as unknown as Recipe<P, V>;
  Object.defineProperty(resolve, 'parts', { get: () => state.parts });
  // 热更新（runtime.ts 的 hotStyles）：同一段的样式原地换声明，片段对象不变，已渲染的类按原类名改写；
  // 换上新的档位结构、清掉组合缓存
  Object.defineProperty(resolve, HOT, {
    value: (next: Recipe<P, V>) => {
      const incoming = (next as unknown as { [STATE]: RecipeState<P> })[STATE];
      for (const [path, styles] of incoming.segments) {
        const previous = state.segments.get(path);
        if (!previous) continue;
        hotUpdate(previous, styles);
        incoming.segments.set(path, previous);
      }
      state = incoming;
      cache.clear();
    },
  });
  Object.defineProperty(resolve, STATE, { get: () => state });
  return resolve;
}

const STATE = Symbol('recipe state');

/** 配方展开后的状态：每段样式（create 的结果）按路径存，热更新时整体换成新的 */
interface RecipeState<P extends string> {
  parts: readonly P[];
  names: readonly string[];
  defaults: Readonly<Record<string, unknown>>;
  /** 'base'、'variant\0档位\0取值'、'compound\0序号' → 这一段各部件的样式 */
  segments: Map<string, Record<P, Compiled>>;
  compound: readonly { when: Readonly<Record<string, unknown>> }[];
}

/** 每段样式各 create 一次（惰性：第一次用到时才展开），之后按档位组合查表 */
function build<P extends string, V extends Variants<P>>(
  config: RecipeConfig<P, V>,
): RecipeState<P> {
  const { parts, base = {}, variants = {} as V, compound = [], defaults = {} } = config;
  const compile = (styles: object) =>
    create(styles as Record<string, PartStyle>) as unknown as Record<P, Compiled>;
  const segments = new Map<string, Record<P, Compiled>>([['base', compile(base)]]);
  for (const [name, values] of Object.entries(variants)) {
    for (const [value, styles] of Object.entries(values)) {
      segments.set(`variant\0${name}\0${value}`, compile(styles));
    }
  }
  compound.forEach((entry, index) => {
    const { when, ...styles } = entry;
    void when;
    segments.set(`compound\0${index}`, compile(styles));
  });
  return {
    parts,
    names: Object.keys(variants),
    defaults: defaults as Record<string, unknown>,
    segments,
    compound: compound.map(({ when }) => ({ when: when as Record<string, unknown> })),
  };
}
