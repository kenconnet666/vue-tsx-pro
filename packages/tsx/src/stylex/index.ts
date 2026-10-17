/**
 * StyleX 入口：运行时与 @stylexjs/stylex 完全相同，只是类型带中文注释。
 *
 *   import * as stylex from '@vue-tsx-pro/tsx/stylex';
 *
 * 为什么要另开入口：stylex.create 的参数整体是泛型，TypeScript 悬停时显示的是推导出的字面量，
 * 属性上看不到注释。这里只让样式组名参与推导，组内属性的上下文类型固定为带注释的
 * DocumentedStyles（值类型仍直接引用 StyleX 的定义），悬停、补全、跳转就都能看到说明。
 * Vite 预设已让 StyleX 编译器识别这个入口。
 */
import type * as stylex from '@stylexjs/stylex';
import type { CSSProperties, InlineStyles, MapNamespaces } from '@stylexjs/stylex';
import type { DocumentedStyles } from './styles';

export * from '@stylexjs/stylex';
export type { DocumentedStyles } from './styles';
export type { StyleValue } from './value';

/** 动态样式：参数在运行时决定，编译为 CSS 变量与行内 style */
type DynamicStyles = (...args: never[]) => DocumentedStyles;

type HasDynamic<S> = true extends {
  [Name in keyof S]: S[Name] extends DynamicStyles ? true : false;
}[keyof S]
  ? true
  : false;

/**
 * 一个样式组编译后的样式引用，与 StyleX 由自己的 CSSProperties 推出的类型相同，
 * 因此能直接交给 attrs / props 与 StyleXStyles 类型的 prop（输入侧才用带注释的类型）。
 */
type CompiledGroup = MapNamespaces<{ group: CSSProperties }>['group'];

/** 静态样式组 → 样式引用；动态样式组 → 返回 [样式引用, 行内 style] 的函数 */
type MapStyles<S> = Readonly<{
  [Name in keyof S]: S[Name] extends (...args: infer Args) => unknown
    ? (...args: Args) => Readonly<[CompiledGroup, InlineStyles]>
    : CompiledGroup;
}>;

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
  }): Readonly<{ [N in Name]: CompiledGroup }>;
  /**
   * 含动态样式函数时（`(width: number) => ({ width })`）走这个签名：保留函数参数类型，
   * 但组内属性没有中文悬停提示——动态样式建议单独写一个 create。
   */
  <const S extends { readonly [name: string]: DocumentedStyles | DynamicStyles }>(
    styles: HasDynamic<S> extends true ? S : never,
  ): MapStyles<S>;
}

/** 定义样式，编译期生成原子类（见 {@link Create}）。 */
export declare const create: Create;

/**
 * 把多个样式合并成元素属性 `{ class, style }`，后面的覆盖前面的；
 * 假值（false、null、undefined）会被忽略，便于按条件组合。Vue 的 JSX 用它：
 * `<div {...stylex.attrs(styles.base, active && styles.active, sx)} />`
 */
export declare const attrs: typeof stylex.attrs;

/** 与 attrs 相同，但返回 React 风格的 `{ className, style }`；Vue 里请用 attrs。 */
export declare const props: typeof stylex.props;

/**
 * 定义一组 CSS 变量（主题 tokens），必须写在 `*.stylex.ts` 文件中并导出；
 * 返回的变量可以直接作为 create 里的属性值，也可以由 createTheme 覆盖。
 */
export declare const defineVars: typeof stylex.defineVars;

/** 基于 defineVars 定义的变量创建一套主题，作为样式应用在容器上即可覆盖内部的变量值。 */
export declare const createTheme: typeof stylex.createTheme;

/** 定义编译期常量（不生成 CSS 变量），同样必须写在 `*.stylex.ts` 文件中。 */
export declare const defineConsts: typeof stylex.defineConsts;

/** 按顺序提供回退值，浏览器使用第一个支持的值：`stylex.firstThatWorks('dvh', 'vh')`。 */
export declare const firstThatWorks: typeof stylex.firstThatWorks;

/** 定义关键帧动画，返回动画名，作为 animationName 的值使用。 */
export declare const keyframes: typeof stylex.keyframes;

/** 定义锚点定位的备选位置，返回名称，作为 positionTryFallbacks 的值使用。 */
export declare const positionTry: typeof stylex.positionTry;

/** 定义视图过渡（View Transitions）的类名，作为 viewTransitionClass 的值使用。 */
export declare const viewTransitionClass: typeof stylex.viewTransitionClass;
