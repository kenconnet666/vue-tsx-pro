/**
 * 样式入口：运行时样式引擎（runtime.ts）加上中文注释的类型。
 *
 *   import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';   // 编辑器能自动导入；css 是只有静态方法的类（见文件末尾）
 *   import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';   // 模块对象，上面有同名的具名导出，编译结果一样
 *
 * create 的参数只让样式组名参与推导，组内属性的上下文类型固定为带注释的 DocumentedStyles，
 * 悬停、补全、跳转都能看到说明（整个参数做泛型推导时，TypeScript 悬停只显示推导出的字面量）。
 */
import {
  attrs as runtimeAttrs,
  bind as runtimeBind,
  create as runtimeCreate,
  createTheme as runtimeCreateTheme,
  defineMarker as runtimeDefineMarker,
  defineTokens as runtimeDefineTokens,
  defineVars as runtimeDefineVars,
  globalRule as runtimeGlobalRule,
  keyframes as runtimeKeyframes,
  layers as runtimeLayers,
  select as runtimeSelect,
  when as runtimeWhen,
} from './runtime';
import type { CSSProperties } from './css-properties';
import type { DocumentedStyles } from './documented';
import {
  recipe,
  type PartStyles,
  type Recipe,
  type RecipeConfig,
  type RecipeExtension,
  type Variants,
  type VariantSelection,
} from './recipe';
import { CONDITIONS, renderStyleTag, setStyleNonce, styleText } from './runtime';
import type { ConditionAliases, StyleValue } from './value';
import type { VAR_GROUP } from './vars';

export type { CSSProperties } from './css-properties';
export type { DocumentedStyles } from './documented';
export {
  recipe,
  type PartStyles,
  type Recipe,
  type RecipeConfig,
  type RecipeExtension,
  type VariantSelection,
} from './recipe';
export { CONDITIONS as conditions, renderStyleTag, setStyleNonce, styleText } from './runtime';

/*
 * 主题 tokens 的短写（`fontSize: '_xs'`）：每组一个接口，主题库（@zerodep-dev/vue-tsx-pro-ui 的 token-names.ts）用
 * declare module '@zerodep-dev/vue-tsx-pro-tsx/styles' 填入以 `_` 开头的 token 名。接口必须声明在这个入口模块里：
 * 增补与声明在同一个模块，WebStorm 才能把 '_xs' 解析到唯一的那一组（跳转、悬停注释、补全都靠它）；
 * 声明在别的文件再转出时，它会列出所有同名的 token 让人选。
 */
/** 间距 token（`_space.*`）：gap、padding、margin 等 */
export interface SpaceTokens {}
/** 颜色 token（`_colors.*`） */
export interface ColorsTokens {}
/** 字体族 token */
export interface FontsTokens {}
/** 字号 token */
export interface FontSizesTokens {}
/** 字重 token */
export interface FontWeightsTokens {}
/** 行高 token */
export interface LineHeightsTokens {}
/** 字距 token */
export interface LetterSpacingsTokens {}
/** 尺寸 token：width、height 等 */
export interface SizesTokens {}
/** 边框宽度 token */
export interface BorderWidthsTokens {}
/** 不透明度 token */
export interface OpacitiesTokens {}
/** 描边宽度 token：SVG 的 strokeWidth */
export interface StrokeWidthsTokens {}
/** 圆角 token */
export interface RadiiTokens {}
/** 阴影 token */
export interface ShadowsTokens {}
/** 时长 token：transition、animation */
export interface DurationsTokens {}
/** 缓动 token */
export interface EasingsTokens {}

/*
 * 带组名的写法（`width: '_space.md'`、`outlineWidth: '_borderWidths.sm'`）：任何属性都能用，同样由主题库填入。
 * 生成的取值类型按属性接受的值类型并上相应的组：长度属性列出间距、尺寸、边框宽度、圆角等，颜色属性列出颜色
 */
/** 带组名的间距 token（`'_space.md'`） */
export interface QualifiedSpaceTokens {}
/** 带组名的颜色 token（`'_colors.accent'`） */
export interface QualifiedColorsTokens {}
/** 带组名的字体族 token */
export interface QualifiedFontsTokens {}
/** 带组名的字号 token */
export interface QualifiedFontSizesTokens {}
/** 带组名的字重 token */
export interface QualifiedFontWeightsTokens {}
/** 带组名的行高 token */
export interface QualifiedLineHeightsTokens {}
/** 带组名的字距 token */
export interface QualifiedLetterSpacingsTokens {}
/** 带组名的尺寸 token */
export interface QualifiedSizesTokens {}
/** 带组名的边框宽度 token（`'_borderWidths.sm'`） */
export interface QualifiedBorderWidthsTokens {}
/** 带组名的不透明度 token */
export interface QualifiedOpacitiesTokens {}
/** 带组名的描边宽度 token */
export interface QualifiedStrokeWidthsTokens {}
/** 带组名的圆角 token */
export interface QualifiedRadiiTokens {}
/** 带组名的阴影 token */
export interface QualifiedShadowsTokens {}
/** 带组名的时长 token */
export interface QualifiedDurationsTokens {}
/** 带组名的缓动 token */
export interface QualifiedEasingsTokens {}
export type { ConditionAliases, StyleValue } from './value';

/** 动态样式：参数在运行时决定，编译为 CSS 变量与行内 style */
type DynamicStyles = (...args: never[]) => DocumentedStyles;

type HasDynamic<S> = true extends {
  [Name in keyof S]: S[Name] extends DynamicStyles ? true : false;
}[keyof S]
  ? true
  : false;

declare const COMPILED: unique symbol;
declare const MARKER: unique symbol;

/**
 * 一个样式组（create 的结果之一）：交给 attrs 与 sx。不透明，只由 create、createTheme、defineMarker 产出。
 * 写成导出的具名接口：create 的结果不必标注类型，生成声明文件时也能写出它的名字（否则报 TS2883）
 */
export interface CompiledStyles {
  /** 只在类型上：样式组的标记 */
  readonly [COMPILED]: true;
}

/** 动态样式的行内部分：CSS 变量名 → 值 */
export type InlineStyles = Readonly<Record<string, string>>;

/** 可以嵌套的数组 */
type StyleArray<T> = T | ReadonlyArray<StyleArray<T>>;

/**
 * sx 与 attrs 收的样式：样式组、动态样式的结果、假值（便于按条件组合），可以嵌套成数组；
 * 一次性的覆盖可以直接写样式对象（`sx={{ marginTop: '_md' }}`，按内容缓存，不必先 create）。
 * 值一直在变的（宽度、进度）别写成对象：每个新值一条新规则，用 create 里的动态样式
 */
export type SxStyles = StyleArray<
  | null
  | undefined
  | boolean
  | CompiledStyles
  | Readonly<[CompiledStyles, InlineStyles]>
  | DocumentedStyles
>;

/** CSS 变量的引用 `var(--名字)`：变量组里的 token，直接作为属性值，或写进模板字符串 */
export type CssVar = string;

/** defineVars 的结果：token 名 → `var(--组名-token)`，悬停 token 能看到定义处的注释 */
export type VarGroup<T = Record<string, unknown>> = { readonly [K in keyof T]: CssVar } & {
  readonly [VAR_GROUP]: string;
};

/** createTheme 的结果：只改一组变量的类，作为样式放进 attrs、sx */
export interface VarTheme<Group extends VarGroup = VarGroup> extends CompiledStyles {
  /** 只在类型上：区分不同变量组的主题 */
  readonly __group?: Group;
}

/** defineMarker 的结果：挂到元素上的标记类，when.* 按它找被观察的元素 */
export interface Marker extends CompiledStyles {
  /** 只在类型上：标记与普通样式组区分开，when.* 只收标记 */
  readonly [MARKER]: true;
}

/** defineVars、createTheme 的取值：普通值，或按条件取（`{ default: '200ms', '@media (…)': '0ms' }`） */
type VarValue = StyleValue<string | number>;

/** 静态样式组 → 样式引用；动态样式组 → 返回 [样式引用, 行内 style] 的函数 */
type MapStyles<S> = Readonly<{
  [Name in keyof S]: S[Name] extends (...args: infer Args) => unknown
    ? (...args: Args) => Readonly<[CompiledStyles, InlineStyles]>
    : CompiledStyles;
}>;

/** attrs 的结果：交给元素的 class 与行内样式（动态样式的变量与值） */
export interface StyleAttrs {
  /** 生成的类：一个组合类，加上主题、标记的类 */
  class?: string;
  /** 行内样式：动态样式写的 CSS 变量（名字原样）与值 */
  style?: InlineStyles;
  /** 有响应式绑定（bind、select）时：元素挂上后由 effect 改变量、换类，卸载时停掉 */
  ref?: (element: unknown) => void;
}

/** 关系条件：被观察元素（标记）处于某伪类时，如 `':hover'`、`':focus-visible'` */
type When = (pseudo: `:${string}`, marker: Marker) => `:where(${string})`;

/** 按祖先、后代、兄弟（用 defineMarker 标记）的状态取样式（css.when） */
interface Relations {
  /** 祖先处于某状态时 */
  readonly ancestor: When;
  /** 有后代处于某状态时 */
  readonly descendant: When;
  /** 前面的兄弟处于某状态时 */
  readonly siblingBefore: When;
  /** 后面的兄弟处于某状态时 */
  readonly siblingAfter: When;
  /** 任一兄弟处于某状态时 */
  readonly anySibling: When;
}

/**
 * 样式入口：`import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles'`，用 `css.create`、`css.attrs`……，类型是
 * `css.CompiledStyles` 这些（同名的命名空间，见下面）。`import * as css` 拿到的是模块对象，用法一样，编译器两种写法都认。
 *
 * 写成只有静态方法的类（方法都标了 `this: void`：不用 this，可以单独拿出来用），而不是 `export * as css`：JetBrains 的 IDE 把命名空间的名字画成没有颜色（JSX 里的对象常量也一样），
 * 只有类在哪都按类着色、方法按函数着色、悬停有说明（2026-11-20 在 CLion 里对比过）。静态方法只转调运行时，不用 this，
 * 所以也能单独拿出来用（下面的同名具名导出就是它们）。
 */
export class css {
  private constructor() {}

  /**
   * 定义一组静态样式，用到时由运行时引擎合成类、插入规则；属性悬停可看到中文说明。
   *
   * ```ts
   * const styles = css.create({
   *   base: { display: 'flex', gap: '0.5em' },
   *   active: { color: { default: 'black', ':hover': 'blue' } },
   * });
   * ```
   *
   * 样式组名保留推导，组内属性值的上下文类型固定为带注释的 DocumentedStyles（COMPONENTS.md §9.2）。
   */
  static create<const Name extends string>(
    this: void,
    styles: {
      readonly [N in Name]: DocumentedStyles;
    },
  ): Readonly<{ [N in Name]: CompiledStyles }>;
  /**
   * 含动态样式函数时（`(width: number) => ({ width })`）走这个签名：保留函数参数类型，
   * 但组内属性没有中文悬停提示——动态样式建议单独写一个 create。
   */
  static create<const S extends { readonly [name: string]: DocumentedStyles | DynamicStyles }>(
    this: void,
    styles: HasDynamic<S> extends true ? S : never,
  ): MapStyles<S>;
  /** 实现：转调运行时（调用方只看得到上面两个重载） */
  static create(this: void, styles: never): unknown {
    return runtimeCreate(styles);
  }

  /**
   * 把多个样式合并成元素属性 `{ class, style }`，后面的覆盖前面的；
   * 假值（false、null、undefined）会被忽略，便于按条件组合。Vue 的 JSX 用它：
   * `<div {...css.attrs(styles.base, active && styles.active, sx)} />`
   */
  static attrs(this: void, ...styles: readonly SxStyles[]): StyleAttrs {
    return runtimeAttrs(...(styles as never[])) as StyleAttrs;
  }

  /**
   * 分段：每组各合成一个类、各进一层级联层，后面的组盖过前面的组，合并语义与写在一起相同。
   * 组件库用它把"组件自己的样式 / 每层主题定制 / 使用方的 sx"分开，组合数随组相加而不是相乘：
   * `css.attrs(css.layers(组件的样式, 使用方的 sx))`。空的组不算，只剩一组时就是一个类
   */
  static layers(this: void, ...groups: readonly SxStyles[]): SxStyles {
    return runtimeLayers(...(groups as never[])) as SxStyles;
  }

  /**
   * 声明一组 CSS 变量（主题 tokens、组件之间约定的变量）：`defineVars('vtp-colors', { accent: '#3e63dd' })`
   * 在 :root 上声明 `--vtp-colors-accent`，返回 `{ accent: 'var(--vtp-colors-accent)' }`。
   * 名字决定变量名，带上自己的前缀免得和宿主页面的变量重名；值可以按条件取
   */
  static defineVars<const T extends Readonly<Record<string, VarValue>>>(
    this: void,
    name: string,
    tokens: T,
  ): VarGroup<T> {
    return runtimeDefineVars(name, tokens as never) as never;
  }

  /**
   * 登记主题 tokens，样式里才能写短写 `'_md'` 与 `'_space.md'`：组名 → defineVars 的结果，返回原对象。
   * 组名按 token-map.ts 的约定（space、colors、fontSizes…）；主题库调用一次，使用方一般不用
   */
  static defineTokens<const Groups extends Readonly<Record<string, VarGroup>>>(
    this: void,
    groups: Groups,
  ): Groups {
    return runtimeDefineTokens(groups as never) as never;
  }

  /** 基于 defineVars 定义的变量创建一套主题，作为样式应用在容器上即可覆盖内部的变量值。 */
  static createTheme<Group extends VarGroup>(
    this: void,
    group: Group,
    overrides: { readonly [K in Exclude<keyof Group, typeof VAR_GROUP>]?: VarValue },
  ): VarTheme<Group> {
    return runtimeCreateTheme(group as never, overrides as never) as never;
  }

  /** 定义标记：`defineMarker('vtp-heading')`，挂到元素上（放进 attrs），子元素用 when.* 按它的状态取样式 */
  static defineMarker(this: void, name: string): Marker {
    return runtimeDefineMarker(name) as never;
  }

  /** 定义关键帧动画，返回动画名，作为 animationName 的值使用。 */
  static keyframes(this: void, frames: Readonly<Record<string, DocumentedStyles>>): string {
    return runtimeKeyframes(frames as never);
  }

  /**
   * 一条全局的基础规则，放在最前面的级联层（组件库与宿主的样式都盖得过它），如组件库给自己的部件统一 box-sizing：
   * `css.globalRule('part-box', ':where([data-part])', { boxSizing: 'border-box' })`。
   * 选择器自己限定范围、用 :where 不加特异性；同名再调用换成新的规则；服务端渲染总会带上
   */
  static globalRule(
    this: void,
    name: string,
    selector: string,
    styles: { [K in keyof DocumentedStyles]?: Exclude<DocumentedStyles[K], object | null> },
  ): void {
    runtimeGlobalRule(name, selector, styles as never);
  }

  /** 按祖先、后代、兄弟（用 defineMarker 标记）的状态取样式：`[css.when.ancestor(':hover', marker)]: …` */
  static readonly when: Relations = runtimeWhen as never;

  /** 条件键的别名（`'@dark'` 这些）和它们展开成的条件 */
  static readonly conditions: typeof CONDITIONS = CONDITIONS;

  /**
   * 动态样式的响应式绑定：参数变化时只改元素上的变量，不重新渲染组件。
   * JSX 里写 `styles.bar(item.width)` 时编译器自动改写成 `css.bind(styles.bar, () => [item.width])`，
   * 一般不用手写；类型与直接调用动态样式的结果相同，能放进 attrs 与 sx
   */
  static bind<Args extends unknown[]>(
    this: void,
    style: (...args: Args) => Readonly<[CompiledStyles, InlineStyles]>,
    args: () => NoInfer<Args>,
    /** 读取函数只读渲染函数外面的来源（编译器判断后填 true）：重新渲染时不必重新收集依赖 */
    stable?: boolean,
  ): Readonly<[CompiledStyles, InlineStyles]> {
    return runtimeBind(style as never, args as never, stable) as never;
  }

  /**
   * 按状态选样式的响应式绑定：状态变化时由元素上的 effect 就地换类，不重新渲染组件。
   * JSX 里写 `item.hot && styles.hot`、`active ? styles.on : styles.off`、`sizeStyles[size]`（本文件顶层 create 的样式）
   * 且读到的状态在渲染里没有别处用到时，编译器自动改写成 `css.select(() => item.hot && styles.hot)`，一般不用手写
   */
  static select(
    this: void,
    read: () => CompiledStyles | null | undefined | false | '' | 0,
    /** 读取函数只读渲染函数外面的来源（编译器判断后填 true）：重新渲染时不必重新收集依赖 */
    stable?: boolean,
  ): CompiledStyles {
    return runtimeSelect(read as never, stable) as never;
  }

  /** 定义配方：部件 × 档位 × 组合档位 × 默认值写在一处，按选择返回每个部件的样式（见 recipe.ts 开头） */
  static recipe<
    const P extends string,
    const V extends Variants<P> = {},
    const N extends string = string,
  >(this: void, config: RecipeConfig<P, V, N>): Recipe<P, V, N> {
    return recipe(config);
  }

  /** 服务端渲染：已插入的规则写成 `<style>` 标签的文本（见 runtime.ts） */
  static renderStyleTag(
    this: void,
    ...args: Parameters<typeof renderStyleTag>
  ): ReturnType<typeof renderStyleTag> {
    return renderStyleTag(...args);
  }

  /** 内容安全策略：插入的 `<style>` 带上这个 nonce */
  static setStyleNonce(
    this: void,
    ...args: Parameters<typeof setStyleNonce>
  ): ReturnType<typeof setStyleNonce> {
    return setStyleNonce(...args);
  }

  /** 已插入的全部规则原文，一条一行，最前面是层的顺序（小程序的构建、测试断言用） */
  static styleText(this: void): string {
    return styleText();
  }
}

/** css.create 的类型（两个重载，见 css.create） */
export type Create = typeof css.create;

// 具名导出：和 css 上的同名方法是同一个函数（`import { create }`、`import * as css` 用）
/** 见 {@link css.create} */
export const create: typeof css.create = css.create;
/** 见 {@link css.attrs} */
export const attrs: typeof css.attrs = css.attrs;
/** 见 {@link css.layers} */
export const layers: typeof css.layers = css.layers;
/** 见 {@link css.defineVars} */
export const defineVars: typeof css.defineVars = css.defineVars;
/** 见 {@link css.defineTokens} */
export const defineTokens: typeof css.defineTokens = css.defineTokens;
/** 见 {@link css.createTheme} */
export const createTheme: typeof css.createTheme = css.createTheme;
/** 见 {@link css.defineMarker} */
export const defineMarker: typeof css.defineMarker = css.defineMarker;
/** 见 {@link css.keyframes} */
export const keyframes: typeof css.keyframes = css.keyframes;
/** 见 {@link css.globalRule} */
export const globalRule: typeof css.globalRule = css.globalRule;
/** 见 {@link css.when} */
export const when: Relations = css.when;
/** 见 {@link css.bind} */
export const bind: typeof css.bind = css.bind;
/** 见 {@link css.select} */
export const select: typeof css.select = css.select;

/*
 * 类型挂在同名的命名空间上（`css.CompiledStyles`）：命名空间里写 `export type CompiledStyles = CompiledStyles` 会指到自己，
 * 所以先在模块里另起一个名字（下面的 Outer*）。不用 `import type * as self from './index'`：声明打包会把它改写成
 * `declare namespace`，JetBrains 又跟不进去了。
 */
type OuterCSSProperties = CSSProperties;
type OuterConditionAliases = ConditionAliases;
type OuterDocumentedStyles = DocumentedStyles;
type OuterStyleValue<V> = StyleValue<V>;
type OuterPartStyles<P extends string> = PartStyles<P>;
type OuterRecipe<P extends string, V, N extends string = string> = Recipe<P, V, N>;
type OuterRecipeConfig<
  P extends string,
  V extends Variants<P>,
  N extends string = string,
> = RecipeConfig<P, V, N>;
type OuterRecipeExtension<P extends string = string> = RecipeExtension<P>;
type OuterVariantSelection<V> = VariantSelection<V>;
type OuterCompiledStyles = CompiledStyles;
type OuterInlineStyles = InlineStyles;
type OuterSxStyles = SxStyles;
type OuterCssVar = CssVar;
type OuterVarGroup<T = Record<string, unknown>> = VarGroup<T>;
type OuterVarTheme<Group extends VarGroup = VarGroup> = VarTheme<Group>;
type OuterMarker = Marker;
type OuterCreate = Create;
type OuterStyleAttrs = StyleAttrs;
type OuterSpaceTokens = SpaceTokens;
type OuterColorsTokens = ColorsTokens;
type OuterFontsTokens = FontsTokens;
type OuterFontSizesTokens = FontSizesTokens;
type OuterFontWeightsTokens = FontWeightsTokens;
type OuterLineHeightsTokens = LineHeightsTokens;
type OuterLetterSpacingsTokens = LetterSpacingsTokens;
type OuterSizesTokens = SizesTokens;
type OuterBorderWidthsTokens = BorderWidthsTokens;
type OuterOpacitiesTokens = OpacitiesTokens;
type OuterStrokeWidthsTokens = StrokeWidthsTokens;
type OuterRadiiTokens = RadiiTokens;
type OuterShadowsTokens = ShadowsTokens;
type OuterDurationsTokens = DurationsTokens;
type OuterEasingsTokens = EasingsTokens;
type OuterQualifiedSpaceTokens = QualifiedSpaceTokens;
type OuterQualifiedColorsTokens = QualifiedColorsTokens;
type OuterQualifiedFontsTokens = QualifiedFontsTokens;
type OuterQualifiedFontSizesTokens = QualifiedFontSizesTokens;
type OuterQualifiedFontWeightsTokens = QualifiedFontWeightsTokens;
type OuterQualifiedLineHeightsTokens = QualifiedLineHeightsTokens;
type OuterQualifiedLetterSpacingsTokens = QualifiedLetterSpacingsTokens;
type OuterQualifiedSizesTokens = QualifiedSizesTokens;
type OuterQualifiedBorderWidthsTokens = QualifiedBorderWidthsTokens;
type OuterQualifiedOpacitiesTokens = QualifiedOpacitiesTokens;
type OuterQualifiedStrokeWidthsTokens = QualifiedStrokeWidthsTokens;
type OuterQualifiedRadiiTokens = QualifiedRadiiTokens;
type OuterQualifiedShadowsTokens = QualifiedShadowsTokens;
type OuterQualifiedDurationsTokens = QualifiedDurationsTokens;
type OuterQualifiedEasingsTokens = QualifiedEasingsTokens;

export declare namespace css {
  /** 同具名导出的 {@link CSSProperties}（`css.CSSProperties` 和它是同一个类型） */
  export type CSSProperties = OuterCSSProperties;
  /** 同具名导出的 {@link ConditionAliases}（`css.ConditionAliases` 和它是同一个类型） */
  export type ConditionAliases = OuterConditionAliases;
  /** 同具名导出的 {@link DocumentedStyles}（`css.DocumentedStyles` 和它是同一个类型） */
  export type DocumentedStyles = OuterDocumentedStyles;
  /** 同具名导出的 {@link StyleValue}（`css.StyleValue` 和它是同一个类型） */
  export type StyleValue<V> = OuterStyleValue<V>;
  /** 同具名导出的 {@link PartStyles}（`css.PartStyles` 和它是同一个类型） */
  export type PartStyles<P extends string> = OuterPartStyles<P>;
  /** 同具名导出的 {@link Recipe}（`css.Recipe` 和它是同一个类型） */
  export type Recipe<P extends string, V, N extends string = string> = OuterRecipe<P, V, N>;
  /** 同具名导出的 {@link RecipeConfig}（`css.RecipeConfig` 和它是同一个类型） */
  export type RecipeConfig<
    P extends string,
    V extends Variants<P>,
    N extends string = string,
  > = OuterRecipeConfig<P, V, N>;
  /** 同具名导出的 {@link RecipeExtension}（`css.RecipeExtension` 和它是同一个类型） */
  export type RecipeExtension<P extends string = string> = OuterRecipeExtension<P>;
  /** 同具名导出的 {@link VariantSelection}（`css.VariantSelection` 和它是同一个类型） */
  export type VariantSelection<V> = OuterVariantSelection<V>;
  /** 同具名导出的 {@link CompiledStyles}（`css.CompiledStyles` 和它是同一个类型） */
  export type CompiledStyles = OuterCompiledStyles;
  /** 同具名导出的 {@link InlineStyles}（`css.InlineStyles` 和它是同一个类型） */
  export type InlineStyles = OuterInlineStyles;
  /** 同具名导出的 {@link SxStyles}（`css.SxStyles` 和它是同一个类型） */
  export type SxStyles = OuterSxStyles;
  /** 同具名导出的 {@link CssVar}（`css.CssVar` 和它是同一个类型） */
  export type CssVar = OuterCssVar;
  /** 同具名导出的 {@link VarGroup}（`css.VarGroup` 和它是同一个类型） */
  export type VarGroup<T = Record<string, unknown>> = OuterVarGroup<T>;
  /** 同具名导出的 {@link VarTheme}（`css.VarTheme` 和它是同一个类型） */
  export type VarTheme<Group extends OuterVarGroup = OuterVarGroup> = OuterVarTheme<Group>;
  /** 同具名导出的 {@link Marker}（`css.Marker` 和它是同一个类型） */
  export type Marker = OuterMarker;
  /** 同具名导出的 {@link Create}（`css.Create` 和它是同一个类型） */
  export type Create = OuterCreate;
  /** 同具名导出的 {@link StyleAttrs}（`css.StyleAttrs` 和它是同一个类型） */
  export type StyleAttrs = OuterStyleAttrs;
  /** 同具名导出的 {@link SpaceTokens}（`css.SpaceTokens` 和它是同一个类型） */
  export type SpaceTokens = OuterSpaceTokens;
  /** 同具名导出的 {@link ColorsTokens}（`css.ColorsTokens` 和它是同一个类型） */
  export type ColorsTokens = OuterColorsTokens;
  /** 同具名导出的 {@link FontsTokens}（`css.FontsTokens` 和它是同一个类型） */
  export type FontsTokens = OuterFontsTokens;
  /** 同具名导出的 {@link FontSizesTokens}（`css.FontSizesTokens` 和它是同一个类型） */
  export type FontSizesTokens = OuterFontSizesTokens;
  /** 同具名导出的 {@link FontWeightsTokens}（`css.FontWeightsTokens` 和它是同一个类型） */
  export type FontWeightsTokens = OuterFontWeightsTokens;
  /** 同具名导出的 {@link LineHeightsTokens}（`css.LineHeightsTokens` 和它是同一个类型） */
  export type LineHeightsTokens = OuterLineHeightsTokens;
  /** 同具名导出的 {@link LetterSpacingsTokens}（`css.LetterSpacingsTokens` 和它是同一个类型） */
  export type LetterSpacingsTokens = OuterLetterSpacingsTokens;
  /** 同具名导出的 {@link SizesTokens}（`css.SizesTokens` 和它是同一个类型） */
  export type SizesTokens = OuterSizesTokens;
  /** 同具名导出的 {@link BorderWidthsTokens}（`css.BorderWidthsTokens` 和它是同一个类型） */
  export type BorderWidthsTokens = OuterBorderWidthsTokens;
  /** 同具名导出的 {@link OpacitiesTokens}（`css.OpacitiesTokens` 和它是同一个类型） */
  export type OpacitiesTokens = OuterOpacitiesTokens;
  /** 同具名导出的 {@link StrokeWidthsTokens}（`css.StrokeWidthsTokens` 和它是同一个类型） */
  export type StrokeWidthsTokens = OuterStrokeWidthsTokens;
  /** 同具名导出的 {@link RadiiTokens}（`css.RadiiTokens` 和它是同一个类型） */
  export type RadiiTokens = OuterRadiiTokens;
  /** 同具名导出的 {@link ShadowsTokens}（`css.ShadowsTokens` 和它是同一个类型） */
  export type ShadowsTokens = OuterShadowsTokens;
  /** 同具名导出的 {@link DurationsTokens}（`css.DurationsTokens` 和它是同一个类型） */
  export type DurationsTokens = OuterDurationsTokens;
  /** 同具名导出的 {@link EasingsTokens}（`css.EasingsTokens` 和它是同一个类型） */
  export type EasingsTokens = OuterEasingsTokens;
  /** 同具名导出的 {@link QualifiedSpaceTokens}（`css.QualifiedSpaceTokens` 和它是同一个类型） */
  export type QualifiedSpaceTokens = OuterQualifiedSpaceTokens;
  /** 同具名导出的 {@link QualifiedColorsTokens}（`css.QualifiedColorsTokens` 和它是同一个类型） */
  export type QualifiedColorsTokens = OuterQualifiedColorsTokens;
  /** 同具名导出的 {@link QualifiedFontsTokens}（`css.QualifiedFontsTokens` 和它是同一个类型） */
  export type QualifiedFontsTokens = OuterQualifiedFontsTokens;
  /** 同具名导出的 {@link QualifiedFontSizesTokens}（`css.QualifiedFontSizesTokens` 和它是同一个类型） */
  export type QualifiedFontSizesTokens = OuterQualifiedFontSizesTokens;
  /** 同具名导出的 {@link QualifiedFontWeightsTokens}（`css.QualifiedFontWeightsTokens` 和它是同一个类型） */
  export type QualifiedFontWeightsTokens = OuterQualifiedFontWeightsTokens;
  /** 同具名导出的 {@link QualifiedLineHeightsTokens}（`css.QualifiedLineHeightsTokens` 和它是同一个类型） */
  export type QualifiedLineHeightsTokens = OuterQualifiedLineHeightsTokens;
  /** 同具名导出的 {@link QualifiedLetterSpacingsTokens}（`css.QualifiedLetterSpacingsTokens` 和它是同一个类型） */
  export type QualifiedLetterSpacingsTokens = OuterQualifiedLetterSpacingsTokens;
  /** 同具名导出的 {@link QualifiedSizesTokens}（`css.QualifiedSizesTokens` 和它是同一个类型） */
  export type QualifiedSizesTokens = OuterQualifiedSizesTokens;
  /** 同具名导出的 {@link QualifiedBorderWidthsTokens}（`css.QualifiedBorderWidthsTokens` 和它是同一个类型） */
  export type QualifiedBorderWidthsTokens = OuterQualifiedBorderWidthsTokens;
  /** 同具名导出的 {@link QualifiedOpacitiesTokens}（`css.QualifiedOpacitiesTokens` 和它是同一个类型） */
  export type QualifiedOpacitiesTokens = OuterQualifiedOpacitiesTokens;
  /** 同具名导出的 {@link QualifiedStrokeWidthsTokens}（`css.QualifiedStrokeWidthsTokens` 和它是同一个类型） */
  export type QualifiedStrokeWidthsTokens = OuterQualifiedStrokeWidthsTokens;
  /** 同具名导出的 {@link QualifiedRadiiTokens}（`css.QualifiedRadiiTokens` 和它是同一个类型） */
  export type QualifiedRadiiTokens = OuterQualifiedRadiiTokens;
  /** 同具名导出的 {@link QualifiedShadowsTokens}（`css.QualifiedShadowsTokens` 和它是同一个类型） */
  export type QualifiedShadowsTokens = OuterQualifiedShadowsTokens;
  /** 同具名导出的 {@link QualifiedDurationsTokens}（`css.QualifiedDurationsTokens` 和它是同一个类型） */
  export type QualifiedDurationsTokens = OuterQualifiedDurationsTokens;
  /** 同具名导出的 {@link QualifiedEasingsTokens}（`css.QualifiedEasingsTokens` 和它是同一个类型） */
  export type QualifiedEasingsTokens = OuterQualifiedEasingsTokens;
}
