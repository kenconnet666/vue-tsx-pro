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
 * 每个部件的样式是 create 的结果（运行时惰性生成原子类），合并时按属性键后者覆盖前者，
 * 所以“基础 < 档位 < 组合档位 < 调用方的 sx”的顺序由 attrs 的参数顺序保证。
 */
import type { CompiledStyles } from './index';
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
  const { parts, base = {}, variants = {} as V, compound = [], defaults = {} } = config;
  // 每段样式先 create 一次（惰性：第一次用到时才生成原子类），之后按档位组合查表
  const compile = (styles: PartStyles<P>) =>
    create(styles as Record<string, PartStyle>) as Record<P, Compiled>;
  const baseStyles = compile(base);
  const variantStyles = Object.fromEntries(
    Object.entries(variants).map(([name, values]) => [
      name,
      Object.fromEntries(Object.entries(values).map(([value, styles]) => [value, compile(styles)])),
    ]),
  ) as Record<string, Record<string, Record<P, Compiled>>>;
  const compoundStyles = compound.map(({ when, ...styles }) => ({
    when: when as Record<string, unknown>,
    styles: compile(styles as unknown as PartStyles<P>),
  }));
  const cache = new Map<string, Record<P, Compiled[]>>();
  const names = Object.keys(variants);

  const resolve = ((selection: Record<string, unknown> = {}) => {
    const picked = names.map((name) => {
      const value = selection[name] ?? (defaults as Record<string, unknown>)[name];
      return value === undefined || value === null ? undefined : String(value);
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
    push(baseStyles);
    names.forEach((name, index) => {
      const value = picked[index];
      if (value !== undefined) push(variantStyles[name]![value]);
    });
    for (const { when, styles } of compoundStyles) {
      const matches = Object.entries(when).every(
        ([name, value]) => picked[names.indexOf(name)] === String(value),
      );
      if (matches) push(styles);
    }
    cache.set(key, result);
    return result;
  }) as unknown as Recipe<P, V>;
  Object.defineProperty(resolve, 'parts', { value: parts });
  return resolve;
}
