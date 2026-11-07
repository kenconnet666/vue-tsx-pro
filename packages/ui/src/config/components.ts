/**
 * 可以定制的组件：一处登记，createUi / Provider 的 `components` 按它检查类型，`ComponentDefaults`（defaults.ts）
 * 与 `ComponentStyles`（styles.ts）都从这里推出。键是组件配方的 `name`（`css.recipe({ name: 'Button' })`，
 * 也是 useDefaults 的名字），useRecipe 只收登记过名字的配方，写错名字时类型检查报错。
 *
 *   createUi({
 *     components: {
 *       Button: {
 *         defaults: { variant: 'outline', radius: 'full' },              // 档位的默认值
 *         styles: { root: { letterSpacing: '0.02em' } },                  // 追加在组件自己的样式之后
 *         variants: { variant: { outline: { root: { borderStyle: 'dashed' } } } },  // 某个档位取值的样式
 *       },
 *     },
 *   })
 *
 * 新的配方组件在 UiComponents 里加一行：部件类型取配方的 `<组件>Part`，档位选项取组件的 `<组件>Options`。
 */
import type { PartStyles, Recipe, RecipeExtension } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { AlertOptions, AlertPart } from '../feedback/Alert';
import type { AvatarOptions, AvatarPart } from '../display/Avatar';
import type { BadgeOptions, BadgePart } from '../base/badge-styles';
import type { ButtonOptions, ButtonPart } from '../base/button-core';
import type { CardOptions, CardPart } from '../display/Card';
import type { CodeBlockOptions, CodeBlockPart } from '../base/CodeBlock';
import type { ChoiceOptions, ChoicePart } from '../input/choice-styles';
import type { ControlOptions, InputPart } from '../input/control';
import type { DataTableOptions, DataTablePart } from '../table/table-styles';
import type { DialogOptions, DialogPart } from '../overlay/Dialog';
import type { DrawerOptions, DrawerPart } from '../overlay/Drawer';
import type { EmptyOptions, EmptyPart } from '../feedback/Empty';
import type { IndicatorOptions, IndicatorPart } from '../base/Indicator';
import type { LinkOptions, LinkPart } from '../base/Link';
import type { ProgressOptions, ProgressPart } from '../feedback/Progress';
import type { ResultOptions, ResultPart } from '../feedback/Result';
import type { TablePart } from '../table/Table';
import type { TabPart, TabsOptions } from '../navigation/Tabs';
import type { StatOptions, StatPart } from '../display/Stat';
import type { TimelineOptions, TimelinePart } from '../display/Timeline';
import type { TourOptions, TourPart } from '../overlay/Tour';
import { useDefaults, type ComponentDefaults, type ResolvedDefaults } from './defaults';
import { useRecipe, type ComponentStyles, type PartLayer } from './styles';

/** 档位取值在配置里的键：布尔档位写 'true' / 'false' */
type ValueKey<T> = T extends boolean
  ? 'true' | 'false'
  : T extends string | number
    ? `${T}`
    : never;

/** 档位的样式：档位名 → 取值 → 各部件的样式。已有的取值追加在组件的样式之后，新的取值（扩展了档位接口后）只用这里的 */
export type VariantStyles<Part extends string, Options> = {
  readonly [Name in keyof Options]?: {
    readonly [Value in ValueKey<NonNullable<Options[Name]>>]?: PartStyles<Part>;
  };
};

/** 一个组件的定制 */
export interface ComponentConfig<Part extends string, Options extends object> {
  /** 档位的默认值：组件上显式写的 prop > 最近一层 Provider > createUi > 组件自己的默认值 */
  defaults?: Options;
  /** 各部件追加在组件自己样式之后的样式（`{ root: { letterSpacing: '0.02em' } }`） */
  styles?: PartStyles<Part>;
  /** 某个档位取值的样式：`{ variant: { outline: { root: { borderStyle: 'dashed' } } } }` */
  variants?: VariantStyles<Part, Options>;
}

/** 可以定制的组件与它们的部件、档位；新的配方组件在这里登记 */
export interface UiComponents {
  /** Button、LinkButton、IconButton、IconLinkButton 共用 */
  Button: ComponentConfig<
    ButtonPart,
    Partial<Pick<ButtonOptions, 'variant' | 'tone' | 'size' | 'radius'>>
  >;
  /** Badge、Tag 共用 */
  Badge: ComponentConfig<BadgePart, BadgeOptions>;
  /** Alert */
  Alert: ComponentConfig<AlertPart, AlertOptions>;
  /** Tabs 与其中的标签 */
  Tabs: ComponentConfig<TabPart, TabsOptions>;
  /** Link */
  Link: ComponentConfig<LinkPart, LinkOptions>;
  /** Indicator */
  Indicator: ComponentConfig<IndicatorPart, IndicatorOptions>;
  /** Avatar（AvatarGroup 的“+N”也取它的外层样式） */
  Avatar: ComponentConfig<AvatarPart, AvatarOptions>;
  /** CodeBlock（CodeGroup、示例的源码也是它） */
  CodeBlock: ComponentConfig<CodeBlockPart, CodeBlockOptions>;
  /** Card */
  Card: ComponentConfig<CardPart, CardOptions>;
  /** Progress（条形与环形） */
  Progress: ComponentConfig<ProgressPart, ProgressOptions>;
  /** Empty */
  Empty: ComponentConfig<EmptyPart, EmptyOptions>;
  /** Result */
  Result: ComponentConfig<ResultPart, ResultOptions>;
  /** Stat（StatGroup 里的每一个也是它） */
  Stat: ComponentConfig<StatPart, StatOptions>;
  /** Timeline */
  Timeline: ComponentConfig<TimelinePart, TimelineOptions>;
  /** Tour */
  Tour: ComponentConfig<TourPart, TourOptions>;
  /** Dialog、AlertDialog 共用：dialog 元素与标题行、标题、关闭按钮、说明、正文、页脚 */
  Dialog: ComponentConfig<DialogPart, DialogOptions>;
  /** Drawer：同 Dialog 的部件 */
  Drawer: ComponentConfig<DrawerPart, DrawerOptions>;
  /** TextField、Textarea、NumberField、Select、Combobox、Cascader、TreeSelect、TagsInput、ColorField 与日期输入框的外壳共用 */
  Input: ComponentConfig<InputPart, ControlOptions>;
  /** Checkbox、Radio、Switch 与复选组、单选组共用 */
  Choice: ComponentConfig<ChoicePart, ChoiceOptions>;
  /** DataTable、TreeDataTable 共用 */
  DataTable: ComponentConfig<DataTablePart, DataTableOptions>;
  /** 静态表格 Table 及其行、单元格 */
  Table: ComponentConfig<TablePart, DataTableOptions>;
}

/** 可以定制的组件名 */
export type ComponentName = keyof UiComponents;

/** createUi / Provider 的 components：只写要定制的组件 */
export type ComponentsOptions = { readonly [Name in ComponentName]?: UiComponents[Name] };

/** 一个组件的部件名 */
export type PartOf<Name extends ComponentName> =
  UiComponents[Name] extends ComponentConfig<infer Part, object> ? Part : never;

/** 一个组件的档位选项 */
export type OptionsOf<Name extends ComponentName> = NonNullable<UiComponents[Name]['defaults']>;

const extensions = new WeakMap<object, RecipeExtension<string>>();

/** 一个组件的定制换成配方的扩展（styles → base），按配置对象记住：同一份配置反复传入时配方的缓存照样命中 @internal */
export function extensionOf(
  config: ComponentConfig<string, object>,
): RecipeExtension<string> | undefined {
  if (!config.styles && !config.variants) return undefined;
  let extension = extensions.get(config);
  if (!extension) {
    extension = {
      base: config.styles,
      variants: config.variants as RecipeExtension<string>['variants'],
    };
    extensions.set(config, extension);
  }
  return extension;
}

/**
 * components 拆成默认值与样式定制两份，交给 mergeDefaults、mergeStyles 按层合并（createUi、Provider 用）。
 * 旧的 defaults / styles 选项与它并存时排在它前面（同一层里 components 的盖过旧选项的）
 * @internal
 */
export function splitComponents(
  components: ComponentsOptions | undefined,
): { defaults: ComponentDefaults; styles: ComponentStyles } | undefined {
  if (!components) return undefined;
  const defaults: Record<string, object> = {};
  const styles: Record<string, RecipeExtension<string>> = {};
  for (const [name, config] of Object.entries(components) as [
    string,
    ComponentConfig<string, object>,
  ][]) {
    if (!config) continue;
    if (config.defaults) defaults[name] = config.defaults;
    const extension = extensionOf(config);
    if (extension) styles[name] = extension;
  }
  return { defaults: defaults as ComponentDefaults, styles: styles as ComponentStyles };
}

/**
 * 组件的外观：档位的默认值（createUi / Provider 的 `components.Xxx.defaults` 与组件自己的 fallback）加上配方与它的定制，
 * 一次调用。名字取自配方（只收登记过的），在 setup 里调用，渲染时调用返回的函数：
 *
 *   const ui = useComponent(alertRecipe, () => ({ variant, size, radius }), { variant: 'soft', radius: 'md' });
 *   return () => {
 *     const { options, parts } = ui({ tone });   // 参数：这次渲染的状态（不进默认值的档位，如 tone、extra）
 *     return <div {...mergeAttrs<'div'>(parts.root, rest)}>…</div>;
 *   };
 */
export function useComponent<
  P extends string,
  V,
  N extends ComponentName,
  Own extends OptionsOf<N>,
  const Fallback extends { [K in keyof Own]?: Exclude<Own[K], undefined> } = {},
>(
  recipe: Recipe<P, V, N>,
  read: () => Own,
  fallback?: Fallback,
): (state?: object) => {
  readonly options: ResolvedDefaults<Own, Fallback>;
  readonly parts: Readonly<Record<P, PartLayer>>;
} {
  if (!recipe.name)
    throw new Error('useComponent：配方要有 name（同 UiComponents 里登记的组件名）');
  const options = useDefaults(
    recipe.name,
    read as () => OptionsOf<N>,
    fallback,
  ) as () => ResolvedDefaults<Own, Fallback>;
  const parts = useRecipe(recipe);
  return (state) => {
    const resolved = options();
    return { options: resolved, parts: parts(state ? { ...resolved, ...state } : resolved) };
  };
}
