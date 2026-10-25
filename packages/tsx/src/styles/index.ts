/**
 * 样式入口：运行时样式引擎（runtime.ts）加上中文注释的类型。
 *
 *   import * as css from '@vue-tsx-pro/tsx/styles';
 *
 * create 的参数只让样式组名参与推导，组内属性的上下文类型固定为带注释的 DocumentedStyles，
 * 悬停、补全、跳转都能看到说明（整个参数做泛型推导时，TypeScript 悬停只显示推导出的字面量）。
 */
import * as runtime from './runtime';
import type { DocumentedStyles } from './documented';
import type { StyleValue } from './value';
import type { VAR_GROUP } from './vars';

export type { CSSProperties } from './css-properties';
export type { DocumentedStyles } from './documented';
export { recipe, type Recipe, type RecipeConfig, type VariantSelection } from './recipe';
export { CONDITIONS as conditions, hotStyles, styleText } from './runtime';

/*
 * 主题 tokens 的短写（`fontSize: '_xs'`）：每组一个接口，主题库（@vue-tsx-pro/ui 的 token-names.ts）用
 * declare module '@vue-tsx-pro/tsx/styles' 填入以 `_` 开头的 token 名。接口必须声明在这个入口模块里：
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
export type { StyleValue } from './value';

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
export interface Theme<Group extends VarGroup = VarGroup> extends CompiledStyles {
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

/** css.create 的类型：样式组名保留推导，组内属性值的上下文类型固定为带注释的 DocumentedStyles（COMPONENTS.md §9.2） */
export interface Create {
  /**
   * 定义一组静态样式，用到时由运行时引擎合成类、插入规则；属性悬停可看到中文说明。
   *
   * ```ts
   * const styles = css.create({
   *   base: { display: 'flex', gap: '0.5em' },
   *   active: { color: { default: 'black', ':hover': 'blue' } },
   * });
   * ```
   */
  <const Name extends string>(styles: {
    readonly [N in Name]: DocumentedStyles;
  }): Readonly<{ [N in Name]: CompiledStyles }>;
  /**
   * 含动态样式函数时（`(width: number) => ({ width })`）走这个签名：保留函数参数类型，
   * 但组内属性没有中文悬停提示——动态样式建议单独写一个 create。
   */
  <const S extends { readonly [name: string]: DocumentedStyles | DynamicStyles }>(
    styles: HasDynamic<S> extends true ? S : never,
  ): MapStyles<S>;
}

/** 定义样式（见 {@link Create}）：产出片段，attrs 合成一个类时才插入规则（runtime.ts） */
export const create: Create = runtime.create as never;

/**
 * 把多个样式合并成元素属性 `{ class, style }`，后面的覆盖前面的；
 * 假值（false、null、undefined）会被忽略，便于按条件组合。Vue 的 JSX 用它：
 * `<div {...css.attrs(styles.base, active && styles.active, sx)} />`
 */
export const attrs: (...styles: readonly SxStyles[]) => StyleAttrs = runtime.attrs as never;

/** attrs 的结果：交给元素的 class 与行内样式（动态样式的变量与值） */
export interface StyleAttrs {
  /** 生成的类：一个组合类，加上主题、标记的类 */
  class?: string;
  /** 行内样式：动态样式写的 CSS 变量（名字原样）与值 */
  style?: InlineStyles;
  /** 有响应式绑定（bind、select）时：元素挂上后由 effect 改变量、换类，卸载时停掉 */
  ref?: (element: unknown) => void;
}

/**
 * 声明一组 CSS 变量（主题 tokens、组件之间约定的变量）：`defineVars('vtp-colors', { accent: '#3e63dd' })`
 * 在 :root 上声明 `--vtp-colors-accent`，返回 `{ accent: 'var(--vtp-colors-accent)' }`。
 * 名字决定变量名，带上自己的前缀免得和宿主页面的变量重名；值可以按条件取
 */
export const defineVars: <const T extends Readonly<Record<string, VarValue>>>(
  name: string,
  tokens: T,
) => VarGroup<T> = runtime.defineVars as never;

/**
 * 登记主题 tokens，样式里才能写短写 `'_md'` 与 `'_space.md'`：组名 → defineVars 的结果，返回原对象。
 * 组名按 token-map.ts 的约定（space、colors、fontSizes…）；主题库调用一次，使用方一般不用
 */
export const defineTokens: <const Groups extends Readonly<Record<string, VarGroup>>>(
  groups: Groups,
) => Groups = runtime.defineTokens as never;

/** 基于 defineVars 定义的变量创建一套主题，作为样式应用在容器上即可覆盖内部的变量值。 */
export const createTheme: <Group extends VarGroup>(
  group: Group,
  overrides: { readonly [K in Exclude<keyof Group, typeof VAR_GROUP>]?: VarValue },
) => Theme<Group> = runtime.createTheme as never;

/** 定义标记：`defineMarker('vtp-heading')`，挂到元素上（放进 attrs），子元素用 when.* 按它的状态取样式 */
export const defineMarker: (name: string) => Marker = runtime.defineMarker as never;

/** 定义关键帧动画，返回动画名，作为 animationName 的值使用。 */
export const keyframes: (frames: Readonly<Record<string, DocumentedStyles>>) => string =
  runtime.keyframes as never;

/** 关系条件：被观察元素（标记）处于某伪类时，如 `':hover'`、`':focus-visible'` */
type When = (pseudo: `:${string}`, marker: Marker) => `:where(${string})`;

/** 按祖先、后代、兄弟（用 defineMarker 标记）的状态取样式：`[css.when.ancestor(':hover', marker)]: …` */
export const when: {
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
} = runtime.when as never;

/**
 * 动态样式的响应式绑定：参数变化时只改元素上的变量，不重新渲染组件。
 * JSX 里写 `styles.bar(item.width)` 时编译器自动改写成 `css.bind(styles.bar, () => [item.width])`，
 * 一般不用手写；类型与直接调用动态样式的结果相同，能放进 attrs 与 sx
 */
export const bind: <Args extends unknown[]>(
  style: (...args: Args) => Readonly<[CompiledStyles, InlineStyles]>,
  args: () => NoInfer<Args>,
  /** 读取函数只读渲染函数外面的来源（编译器判断后填 true）：重新渲染时不必重新收集依赖 */
  stable?: boolean,
) => Readonly<[CompiledStyles, InlineStyles]> = runtime.bind as never;

/**
 * 按状态选样式的响应式绑定：状态变化时由元素上的 effect 就地换类，不重新渲染组件。
 * JSX 里写 `item.hot && styles.hot`、`active ? styles.on : styles.off`、`sizeStyles[size]`（本文件顶层 create 的样式）
 * 且读到的状态在渲染里没有别处用到时，编译器自动改写成 `css.select(() => item.hot && styles.hot)`，一般不用手写
 */
export const select: (
  read: () => CompiledStyles | null | undefined | false | '' | 0,
  /** 读取函数只读渲染函数外面的来源（编译器判断后填 true）：重新渲染时不必重新收集依赖 */
  stable?: boolean,
) => CompiledStyles = runtime.select as never;
