/**
 * 组件的主题定制：应用级 `createUi({ styles })`、局部 `<Provider styles>` 改组件的样式与档位，不必包一层组件
 * （参考 MUI 主题的 styleOverrides / variants、Panda 的配方扩展）。
 *
 *   createUi({
 *     styles: {
 *       Button: {
 *         base: { root: { letterSpacing: '0.02em' } },                  // 追加在组件自己的样式之后
 *         variants: { size: { xl: { root: { fontSize: '_xxl' } } } },  // 新档位：先扩展 ButtonVariants 接口
 *       },
 *     },
 *   })
 *
 * 合并顺序：组件的基础 < 档位 < 组合档位 < createUi 的定制 < 外层 Provider < 内层 Provider < 使用方的 sx。
 * 用配方写的组件（css.recipe 给了 name）才认这里的定制；部件上的 data-scope / data-part 也来自配方（partAttrs）。
 */
import type { CompiledStyles, Recipe, RecipeExtension } from '@vue-tsx-pro/tsx/styles';
import { useConfig } from './context';
import type { BadgePart } from '../base/badge-styles';
import type { ButtonPart } from '../base/button-core';
import type { TabPart } from '../navigation/Tabs';

/** 可以定制样式的组件与它们的部件；新的配方组件在这里登记 */
export interface ComponentStyles {
  /** Button、LinkButton、IconButton、IconLinkButton 共用 */
  Button?: RecipeExtension<ButtonPart>;
  /** Badge、Tag 共用 */
  Badge?: RecipeExtension<BadgePart>;
  /** Tabs 里的标签（Tab） */
  Tab?: RecipeExtension<TabPart>;
}

/** 各层的定制：外层在前，组件按顺序交给配方（内层排在后面、盖过外层） */
export type StyleLayers = {
  readonly [Name in keyof ComponentStyles]?: readonly NonNullable<ComponentStyles[Name]>[];
};

/** 加上一层定制：按组件逐个追加在外层之后；这一层没写的组件沿用外层的数组（同一个对象，配方的缓存照样命中） */
export function mergeStyles(outer: StyleLayers, inner: ComponentStyles | undefined): StyleLayers {
  if (!inner) return outer;
  const merged: Record<string, readonly unknown[] | undefined> = { ...outer };
  for (const [name, extension] of Object.entries(inner)) {
    if (extension) merged[name] = [...(merged[name] ?? []), extension];
  }
  return merged as StyleLayers;
}

/**
 * 配方加上 createUi / Provider 里这个组件的定制：在 setup 里调用，返回的函数在渲染时传档位选择。
 *
 *   const button = useRecipe(buttonRecipe);
 *   return () => <button {...mergeAttrs<'button'>({ sx: button({ variant }).root, ...partAttrs(buttonRecipe, 'root') }, rest)} />
 */
export function useRecipe<P extends string, V>(
  recipe: Recipe<P, V>,
): (selection?: Parameters<Recipe<P, V>>[0]) => Readonly<Record<P, readonly CompiledStyles[]>> {
  const config = useConfig();
  const name = recipe.name as keyof ComponentStyles | undefined;
  return (selection) => {
    const layers = name && (config.styles[name] as readonly RecipeExtension<P>[] | undefined);
    return layers?.length ? recipe(selection, ...layers) : recipe(selection);
  };
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
