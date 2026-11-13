/**
 * 组件默认值：应用级 `createUi({ components })`、局部 `<Provider components>` 里各组件的 `defaults`
 * 统一改组件的默认外观，不必每处都写（参考 Ant Design 的 ConfigProvider、MUI 主题的 defaultProps）。
 * 优先级：组件上显式写的 prop > 最近一层 Provider > createUi > 组件自己的默认值。
 *
 *   createUi({ components: { Button: { defaults: { variant: 'outline', size: 'sm' } } } })
 *
 * 只收外观类的选项（样式、尺寸、色调）；行为类的（disabled、loading）每处单独决定。
 */
import { computed } from 'vue';
import { useConfig } from './context';
import type { ComponentName, OptionsOf } from './components';
import { withoutUndefined } from '../utils/data/object';

/** 可以配置默认值的组件与选项：从 UiComponents（components.ts）推出，新组件在那里登记 */
export type ComponentDefaults = { [Name in ComponentName]?: OptionsOf<Name> };

/** 合并两层默认值：按组件逐个合并，内层写了的选项覆盖外层 @internal */
export function mergeDefaults(
  outer: ComponentDefaults,
  inner: ComponentDefaults | undefined,
): ComponentDefaults {
  if (!inner) return outer;
  const merged: Record<string, object | undefined> = { ...outer };
  for (const [name, options] of Object.entries(inner)) {
    merged[name] = {
      ...(outer as Record<string, object | undefined>)[name],
      ...withoutUndefined(options),
    };
  }
  return merged as ComponentDefaults;
}

/** useDefaults 合并后的选项：给了 fallback 的项一定有值，其余可能仍是 undefined（如不写时继承字号的 size） */
export type ResolvedDefaults<Own, Fallback> = {
  [K in keyof Own as K extends keyof Fallback ? K : never]-?: Exclude<Own[K], undefined>;
} & {
  [K in keyof Own as K extends keyof Fallback ? never : K]: Own[K];
};

/**
 * 组件的外观选项逐项合并：显式写的 prop > 最近一层 Provider > createUi > fallback（组件自己的默认值）。
 * 在 setup 里调用；返回的函数在渲染时调用，读到最新的 prop 与配置（Provider 切换后跟着变）。
 *
 *   const appearance = useDefaults('Card', () => ({ variant, padding }), { variant: 'surface', padding: 'lg' });
 *   const s = recipe(appearance());   // recipe = useRecipe(cardRecipe)：档位交给配方（config/styles.ts）
 */
export function useDefaults<
  Name extends keyof ComponentDefaults,
  Own extends NonNullable<ComponentDefaults[Name]>,
  const Fallback extends { [K in keyof Own]?: Exclude<Own[K], undefined> } = {},
>(name: Name, read: () => Own, fallback?: Fallback): () => ResolvedDefaults<Own, Fallback> {
  const config = useConfig();
  // 缓存合并结果：prop 或配置变了才重新合并，渲染里多次读取都是同一个对象
  const resolved = computed(() => {
    const own = read() as Record<string, unknown>;
    const provided = (config.defaults[name] ?? {}) as Record<string, unknown>;
    const defaults = (fallback ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = {};
    for (const key of Object.keys(own)) merged[key] = own[key] ?? provided[key] ?? defaults[key];
    return merged as ResolvedDefaults<Own, Fallback>;
  });
  return () => resolved.value;
}
