/**
 * StyleX 入口：运行时与 @stylexjs/stylex 相同（只修正了 attrs，见下），类型带中文注释。
 *
 *   import * as stylex from '@vue-tsx-pro/tsx/stylex';
 *
 * 为什么要另开入口：stylex.create 的参数整体是泛型，TypeScript 悬停时显示的是推导出的字面量，
 * 属性上看不到注释。这里只让样式组名参与推导，组内属性的上下文类型固定为带注释的
 * DocumentedStyles（值类型仍直接引用 StyleX 的定义），悬停、补全、跳转就都能看到说明。
 * Vite 预设已让 StyleX 编译器识别这个入口。
 */
import type * as stylex from '@stylexjs/stylex';
import type {
  CompiledStyles as StyleXCompiledStyles,
  CSSProperties,
  InlineStyles,
  MapNamespaces,
  StyleXArray,
} from '@stylexjs/stylex';
import * as runtime from './runtime';
import type { DocumentedStyles } from './styles';

export * from '@stylexjs/stylex';
export type { DocumentedStyles } from './styles';
export { recipe, type Recipe, type RecipeConfig, type VariantSelection } from './recipe';
export { CONDITIONS as conditions, hotStyles, styleText } from './runtime';

/*
 * 主题 tokens 的短写（`fontSize: '_xs'`）：每组一个接口，主题库（@vue-tsx-pro/ui 的 token-names.ts）用
 * declare module '@vue-tsx-pro/tsx/stylex' 填入以 `_` 开头的 token 名。接口必须声明在这个入口模块里：
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

type CompiledGroup = MapNamespaces<{ group: CSSProperties }>['group'];

/**
 * 一个样式组编译后的样式引用，与 StyleX 由自己的 CSSProperties 推出的类型相同，
 * 因此能直接交给 attrs / props 与 StyleXStyles 类型的 prop（输入侧才用带注释的类型）。
 * 写成导出的具名接口：create 的结果不必标注类型，生成声明文件时也能写出它的名字（否则报 TS2883）。
 */
export interface CompiledStyles extends CompiledGroup {}

/** 静态样式组 → 样式引用；动态样式组 → 返回 [样式引用, 行内 style] 的函数 */
type MapStyles<S> = Readonly<{
  [Name in keyof S]: S[Name] extends (...args: infer Args) => unknown
    ? (...args: Args) => Readonly<[CompiledStyles, InlineStyles]>
    : CompiledStyles;
}>;

/** stylex.create 的类型：样式组名保留推导，组内属性值的上下文类型固定为带注释的 DocumentedStyles（COMPONENTS.md §9.2） */
export interface Create {
  /**
   * 定义一组静态样式，编译期生成原子类；属性悬停可看到中文说明。
   *
   * ```ts
   * const styles = stylex.create({
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

/**
 * 定义样式（见 {@link Create}）：运行时模式（styles: 'runtime'）下产出片段，attrs 合成一个类时才插入规则（runtime.ts）；
 * 编译模式下 StyleX 在编译期把它换成原子类
 */
export const create: Create = runtime.create as never;

/**
 * 把多个样式合并成元素属性 `{ class, style }`，后面的覆盖前面的；
 * 假值（false、null、undefined）会被忽略，便于按条件组合。Vue 的 JSX 用它：
 * `<div {...stylex.attrs(styles.base, active && styles.active, sx)} />`
 */
// 不用 StyleX 的 attrs：它把行内样式拼成字符串，属性名一律转成连字符（动态样式的变量 --x-gridTemplateColumns
// 就和类名里引用的对不上），值里的分号还会被当成声明的分隔。runtime.attrs 交出对象，Vue 逐项设置，名字与值都原样；
// 编译版的样式（StyleX 在编译期换好的）它转交给 StyleX 的 props
export const attrs: (...styles: AttrsArgs) => StyleXAttrs = runtime.attrs as never;

/** attrs 的参数：同 StyleX 的 attrs（编译后的样式、动态样式的结果、假值，可以嵌套成数组） */
type AttrsArgs = ReadonlyArray<
  StyleXArray<
    | null
    | undefined
    | boolean
    | StyleXCompiledStyles
    | Readonly<[StyleXCompiledStyles, InlineStyles]>
  >
>;

/** attrs 的结果：交给元素的 class 与行内样式（动态样式的变量与值） */
export interface StyleXAttrs {
  /** 生成的类（运行时模式是一个组合类，加上主题、标记的类） */
  class?: string;
  /** 行内样式：动态样式写的 CSS 变量（名字原样）与值 */
  style?: Readonly<Record<string, string | number>>;
  /** 有响应式绑定（bind）时：元素挂上后由 effect 改变量，卸载时停掉 */
  ref?: (element: unknown) => void;
}

/** 与 attrs 相同，但返回 React 风格的 `{ className, style }`；Vue 里请用 attrs。 */
export declare const props: typeof stylex.props;

/**
 * 定义一组 CSS 变量（主题 tokens），必须写在 `*.stylex.ts` 文件中并导出；
 * 返回的变量可以直接作为 create 里的属性值，也可以由 createTheme 覆盖。
 */
export declare const defineVars: typeof stylex.defineVars;

/** 基于 defineVars 定义的变量创建一套主题，作为样式应用在容器上即可覆盖内部的变量值。 */
export const createTheme: typeof stylex.createTheme = runtime.createTheme as never;

/** 定义编译期常量（不生成 CSS 变量），同样必须写在 `*.stylex.ts` 文件中。 */
export declare const defineConsts: typeof stylex.defineConsts;

/** 按顺序提供回退值，浏览器使用第一个支持的值：`stylex.firstThatWorks('dvh', 'vh')`。 */
export declare const firstThatWorks: typeof stylex.firstThatWorks;

/** 定义关键帧动画，返回动画名，作为 animationName 的值使用。 */
export const keyframes: typeof stylex.keyframes = runtime.keyframes as never;

/** 按祖先、后代、兄弟（用 defineMarker 标记）的状态取样式：`[stylex.when.ancestor(':hover', marker)]: …` */
export const when: typeof stylex.when = runtime.when as never;

/**
 * 动态样式的响应式绑定（运行时模式）：参数变化时只改元素上的变量，不重新渲染组件。
 * JSX 里写 `styles.bar(item.width)` 时编译器自动改写成 `stylex.bind(styles.bar, () => [item.width])`，
 * 一般不用手写；类型与直接调用动态样式的结果相同，能放进 attrs 与 sx
 */
export const bind: <Args extends unknown[]>(
  style: (...args: Args) => Readonly<[CompiledStyles, InlineStyles]>,
  args: () => NoInfer<Args>,
) => Readonly<[CompiledStyles, InlineStyles]> = runtime.bind as never;

/** 定义锚点定位的备选位置，返回名称，作为 positionTryFallbacks 的值使用。 */
export declare const positionTry: typeof stylex.positionTry;

/** 定义视图过渡（View Transitions）的类名，作为 viewTransitionClass 的值使用。 */
export declare const viewTransitionClass: typeof stylex.viewTransitionClass;
