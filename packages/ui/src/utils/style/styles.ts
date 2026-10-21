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

/**
 * 一组按名字取的样式（如按变体分组的色调表 Record<变体, StyleTable<色调>>）。
 * stylex.create 的结果不用写它：create 返回具名的 CompiledStyles，类型直接推导
 */
export type StyleTable<Key extends string> = Readonly<Record<Key, StyleXStyles>>;

/** 间距 gap：Flex、Grid */
export const gapStyles = stylex.create({
  none: { gap: '_none' },
  xs: { gap: '_xs' },
  sm: { gap: '_sm' },
  md: { gap: '_md' },
  lg: { gap: '_lg' },
  xl: { gap: '_xl' },
});

/** 行间距：Grid 单独指定时 */
export const rowGapStyles = stylex.create({
  none: { rowGap: '_none' },
  xs: { rowGap: '_xs' },
  sm: { rowGap: '_sm' },
  md: { rowGap: '_md' },
  lg: { rowGap: '_lg' },
  xl: { rowGap: '_xl' },
});

/** 列间距：Grid 单独指定时 */
export const columnGapStyles = stylex.create({
  none: { columnGap: '_none' },
  xs: { columnGap: '_xs' },
  sm: { columnGap: '_sm' },
  md: { columnGap: '_md' },
  lg: { columnGap: '_lg' },
  xl: { columnGap: '_xl' },
});

/**
 * 焦点环：宽度、颜色全站一致，只有触发的伪类与偏移不同。
 * - visible：键盘聚焦本元素（Link、Button 等），环离开元素一点；
 * - tight：同上但贴着边框（勾选框、单选、开关这类小控件，环离远了显得松）；
 * - hasVisible：里面的元素键盘聚焦时画在整块上（FileDrop：原生 input 视觉上隐藏）；
 * - within：里面的元素聚焦（含鼠标）时画在外壳上，往里收压住边框（输入框外壳）
 */
export const focusRingStyles = stylex.create({
  visible: {
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: '_sm',
  },
  tight: {
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: '_borderWidths.sm',
  },
  hasVisible: {
    outlineStyle: { default: 'none', ':has(:focus-visible)': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: '_borderWidths.sm',
  },
  within: {
    outlineStyle: { default: 'none', ':focus-within': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: 'calc(-1 * _xs)',
  },
});

/**
 * 列表元素（ul、ol）当布局容器时去掉默认的圆点与缩进。
 * Safari 去掉圆点后会把它当成普通容器，读屏不再报“列表”，所以组件同时补上 role="list"（见 listRole）
 */
export const listStyles = stylex.create({
  reset: { margin: 0, paddingInlineStart: 0, listStyleType: 'none' },
});

/** 布局组件的工厂（createFlex、createGrid、createContainer）可用的语义容器标签 */
export type LayoutTag =
  | 'div'
  | 'section'
  | 'article'
  | 'ul'
  | 'ol'
  | 'li'
  | 'nav'
  | 'header'
  | 'footer'
  | 'main'
  | 'aside'
  | 'form';

/** 列表标签需要的 role（见 listStyles），其他标签不加 */
export const listRole = (tag: string) => (tag === 'ul' || tag === 'ol' ? 'list' : undefined);
