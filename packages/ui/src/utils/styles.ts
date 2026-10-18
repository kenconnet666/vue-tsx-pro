/**
 * 组件共用的档位类型与样式表。档位与主题 tokens 同名（COMPONENTS.md §6.2）：
 * 组件的 size、gap 等 prop 直接用这些类型，取值一一对应到 token。
 * 样式表只放被多个组件复用的；只有一个组件用的写在组件里。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';

/*
 * 取值类型的写法（COMPONENTS.md §1）：写成带注释接口的 keyof，接口的每个键带注释，
 * 补全列表与悬停取值时能看到每个取值的效果（WebStorm 把字符串字面量解析到 keyof 的键上）。
 */

/** 五档尺寸的含义；具体对应什么由用到它的 prop 决定（字号见 TextSizes，间距见 SpaceScale） */
export interface SizeScale {
  /** 最小档 */
  xs: unknown;
  /** 小 */
  sm: unknown;
  /** 中：基准档 */
  md: unknown;
  /** 大 */
  lg: unknown;
  /** 最大档 */
  xl: unknown;
}

/** 五档：字号、间距、圆角、阴影等都按它分档 */
export type Size = keyof SizeScale;

/** 间距档位，对应主题的 space（em，随字号缩放），括号里是默认主题的值 */
export interface SpaceScale {
  /** 无间距（0） */
  none: unknown;
  /** 0.25em：图标与文字之间、紧凑的元素之间 */
  xs: unknown;
  /** 0.5em：控件内部、相关的元素之间 */
  sm: unknown;
  /** 0.75em：一组内容的元素之间 */
  md: unknown;
  /** 1em：表单项之间、段落之间 */
  lg: unknown;
  /** 1.5em：区块之间、卡片与对话框的内边距 */
  xl: unknown;
}

/** 间距档位：五档之外可以是 none */
export type Space = keyof SpaceScale;

// 导出的样式表写明类型：靠推导时，类型声明里会引用 StyleX 内部无法命名的类型
type Table<Key extends string> = Readonly<Record<Key, StyleXStyles>>;

/** 间距 gap：Flex、Grid */
export const gapStyles: Table<Space> = stylex.create({
  none: { gap: '_none' },
  xs: { gap: '_xs' },
  sm: { gap: '_sm' },
  md: { gap: '_md' },
  lg: { gap: '_lg' },
  xl: { gap: '_xl' },
});

/** 行间距：Grid 单独指定时 */
export const rowGapStyles: Table<Space> = stylex.create({
  none: { rowGap: '_none' },
  xs: { rowGap: '_xs' },
  sm: { rowGap: '_sm' },
  md: { rowGap: '_md' },
  lg: { rowGap: '_lg' },
  xl: { rowGap: '_xl' },
});

/** 列间距：Grid 单独指定时 */
export const columnGapStyles: Table<Space> = stylex.create({
  none: { columnGap: '_none' },
  xs: { columnGap: '_xs' },
  sm: { columnGap: '_sm' },
  md: { columnGap: '_md' },
  lg: { columnGap: '_lg' },
  xl: { columnGap: '_xl' },
});

/** 键盘聚焦时的焦点环（:focus-visible）：Link、Button 等可交互元素共用，外观一致 */
export const focusRingStyles: Table<'visible'> = stylex.create({
  visible: {
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: '_sm',
  },
});

/**
 * 列表元素（ul、ol）当布局容器时去掉默认的圆点与缩进。
 * Safari 去掉圆点后会把它当成普通容器，读屏不再报“列表”，所以组件同时补上 role="list"（见 listRole）
 */
export const listStyles: Table<'reset'> = stylex.create({
  reset: { margin: 0, paddingInlineStart: 0, listStyleType: 'none' },
});

/** 列表标签需要的 role（见 listStyles），其他标签不加 */
export const listRole = (tag: string) => (tag === 'ul' || tag === 'ol' ? 'list' : undefined);
