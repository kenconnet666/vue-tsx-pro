/**
 * 组件的主题定制：应用级 `createUi({ components })`、局部 `<Provider components>` 里各组件的 `styles` 与 `variants`
 * 改组件的样式与档位，不必包一层组件（参考 MUI 主题的 styleOverrides / variants、Panda 的配方扩展；写法见 components.ts）。
 * 这里把每层定制换成配方的扩展（RecipeExtension），按层交给配方。
 *
 * 合并顺序：组件的基础 < 档位 < 组合档位 < createUi 的定制 < 外层 Provider < 内层 Provider < 使用方的 sx；
 * 每层定制、使用方的 sx 各成一段，进依次靠后的级联层（STYLE-ENGINE.md §11）。
 * 用配方写的组件（css.recipe 给了 name）才认这里的定制；部件上的 data-scope / data-part 也来自配方（partAttrs）。
 */
import type { CompiledStyles, Recipe, RecipeExtension } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { ComponentName, PartOf } from './components';
import { useConfig } from './context';

/** 可以定制样式的组件与它们的部件：从 UiComponents（components.ts）推出 */
export type ComponentStyles = { [Name in ComponentName]?: RecipeExtension<PartOf<Name>> } & {
  /** @deprecated 改名为 Tabs（配方名与 useDefaults 的名字统一） */
  Tab?: RecipeExtension<PartOf<'Tabs'>>;
};

/** 各层的定制：外层在前，组件按顺序交给配方（内层排在后面、盖过外层） @internal */
export type StyleLayers = {
  readonly [Name in ComponentName]?: readonly RecipeExtension<PartOf<Name>>[];
};

/** 加上一层定制：按组件逐个追加在外层之后；这一层没写的组件沿用外层的数组（同一个对象，配方的缓存照样命中） @internal */
export function mergeStyles(outer: StyleLayers, inner: ComponentStyles | undefined): StyleLayers {
  if (!inner) return outer;
  const merged: Record<string, readonly unknown[] | undefined> = { ...outer };
  for (const [key, extension] of Object.entries(inner)) {
    const name = key === 'Tab' ? 'Tabs' : key;
    if (extension) merged[name] = [...(merged[name] ?? []), extension];
  }
  return merged as StyleLayers;
}

/** 一个部件交给 mergeAttrs / mergeProps 的默认层：样式与部件标记 */
export type PartLayer = Readonly<{
  sx: readonly CompiledStyles[];
  'data-scope': string;
  'data-part': string;
}>;

/** useRecipe 的结果：渲染时传档位选择，得到每个部件的默认层 */
export type RecipeLayers<P extends string> = (selection?: object) => Readonly<Record<P, PartLayer>>;

/** 配方算出的样式 → 各部件的默认层；同一组样式（配方按档位组合缓存）返回同一个对象，渲染里不新建 */
const layerCache = new WeakMap<object, Readonly<Record<string, PartLayer>>>();

/**
 * 配方加上 createUi / Provider 里这个组件的定制：在 setup 里调用，返回的函数在渲染时传档位选择，
 * 得到每个部件的默认层（样式 + data-scope / data-part），直接交给部件的合并：
 *
 *   const recipe = useRecipe(alertRecipe);
 *   return () => {
 *     const s = recipe({ variant });
 *     return <div {...mergeAttrs<'div'>(s.root, rest)}><div {...mergeAttrs<'div'>(s.title, propsTitle)} /></div>;
 *   };
 *
 * 根元素还要加别的样式时：`{ ...s.root, sx: [s.root.sx, 别的] }`
 */
export function useRecipe<P extends string, V, N extends ComponentName>(
  recipe: Recipe<P, V, N>,
): RecipeLayers<P> {
  const config = useConfig();
  const name = recipe.name;
  // 这个实例上一次的档位与结果：重新渲染时档位多半没变，不必再进配方拼键查表
  let lastLayers: readonly RecipeExtension<P>[] | undefined;
  let lastSelection: Readonly<Record<string, unknown>> | undefined;
  let lastResult: Readonly<Record<P, PartLayer>> | undefined;
  return (selection) => {
    const layers =
      (name && (config.styles[name] as readonly RecipeExtension<P>[] | undefined)) || undefined;
    if (
      lastResult &&
      layers === lastLayers &&
      sameSelection(selection as Readonly<Record<string, unknown>> | undefined, lastSelection)
    ) {
      return lastResult;
    }
    const picked = selection as Readonly<Record<string, unknown>> | undefined;
    const styles = layers?.length ? recipe(picked, ...layers) : recipe(picked);
    let result = layerCache.get(styles) as Readonly<Record<P, PartLayer>> | undefined;
    if (!result) {
      result = Object.fromEntries(
        recipe.parts.map((part) => [part, { sx: styles[part], ...partAttrs(recipe, part) }]),
      ) as Readonly<Record<P, PartLayer>>;
      layerCache.set(styles, result);
    }
    lastLayers = layers;
    // 存一份拷贝：调用方原地改了同一个对象时也能看出变化
    lastSelection = picked && { ...picked };
    return (lastResult = result);
  };
}

/** 两次的档位选择相同：同一个组件每次传的键一样，逐个比值 */
function sameSelection(
  a: Readonly<Record<string, unknown>> | undefined,
  b: Readonly<Record<string, unknown>> | undefined,
): boolean {
  if (!a || !b) return a === b;
  let count = 0;
  for (const key in a) {
    if (a[key] !== b[key]) return false;
    count++;
  }
  for (const _ in b) count--;
  return count === 0;
}

/** 部件的 data 属性 */
export type PartAttrs = Readonly<{ 'data-scope': string; 'data-part': string }>;

const partCache = new Map<string, PartAttrs>();

/**
 * 部件的标记：`data-scope="button" data-part="icon"`（组件名转成连字符小写）。使用方的全局 CSS、测试
 * 都能稳定地选中部件，不依赖生成的类名（同 Ark UI、Zag 的约定）。同一组合返回同一个对象
 */
export function partAttrs(recipe: { readonly name: string | undefined }, part: string): PartAttrs {
  const scope = (recipe.name ?? '').replace(/[A-Z]/g, (c, index: number) =>
    index ? `-${c.toLowerCase()}` : c.toLowerCase(),
  );
  const key = `${scope}\0${part}`;
  let attrs = partCache.get(key);
  if (!attrs)
    partCache.set(key, (attrs = Object.freeze({ 'data-scope': scope, 'data-part': part })));
  return attrs;
}
