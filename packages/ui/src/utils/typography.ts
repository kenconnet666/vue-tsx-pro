/**
 * 文字相关的共用样式表：Text、Heading、Icon、Button 等按同一套档位取字号、字重、色调。
 * 档位与主题 tokens 同名（COMPONENTS.md §6.2）。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import type { Size } from './styles';

// 导出的样式表写明类型：靠推导时，类型声明里会引用 StyleX 内部无法命名的类型
type Table<Key extends string> = Readonly<Record<Key, StyleXStyles>>;

/** 字号档位：xs–xl 是界面文字（也是组件 size 档位），xxl、xxxl 用于标题 */
export type FontSize = Size | 'xxl' | 'xxxl';

export type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';

/** 文字色调：muted 次要说明，其余为品牌色与提示色的文字色 */
export type Tone = 'default' | 'muted' | 'accent' | 'danger' | 'success' | 'warning' | 'info';

export const fontSizeStyles: Table<FontSize> = stylex.create({
  xs: { fontSize: '_xs' },
  sm: { fontSize: '_sm' },
  md: { fontSize: '_md' },
  lg: { fontSize: '_lg' },
  xl: { fontSize: '_xl' },
  xxl: { fontSize: '_xxl' },
  xxxl: { fontSize: '_xxxl' },
});

export const fontWeightStyles: Table<FontWeight> = stylex.create({
  light: { fontWeight: '_light' },
  normal: { fontWeight: '_normal' },
  medium: { fontWeight: '_medium' },
  semibold: { fontWeight: '_semibold' },
  bold: { fontWeight: '_bold' },
});

export const toneStyles: Table<Tone> = stylex.create({
  default: { color: '_text' },
  muted: { color: '_textMuted' },
  accent: { color: '_accentText' },
  danger: { color: '_dangerText' },
  success: { color: '_successText' },
  warning: { color: '_warningText' },
  info: { color: '_infoText' },
});

export const textAlignStyles: Table<'start' | 'center' | 'end'> = stylex.create({
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
});

export const textWrapStyles: Table<'wrap' | 'nowrap' | 'balance' | 'pretty'> = stylex.create({
  wrap: { textWrap: 'wrap' },
  nowrap: { textWrap: 'nowrap' },
  // 标题：各行长度尽量均衡
  balance: { textWrap: 'balance' },
  // 段落：避免最后一行只剩一个字
  pretty: { textWrap: 'pretty' },
});

export const textStyles: Table<'truncate' | 'clamp'> = stylex.create({
  // 单行省略：在块级元素或 flex 子项上生效
  truncate: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
  // 多行截断用带 -webkit- 前缀的写法（标准的 line-clamp 尚无浏览器支持），行数见 lineClampStyles
  clamp: { display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' },
});

/** 多行截断的行数：任意值，用动态样式（编译为 CSS 变量），与 textStyles.clamp 一起用 */
export const lineClampStyles: { readonly lines: (count: number) => StyleXStyles } = stylex.create({
  lines: (count: number) => ({ WebkitLineClamp: count }),
});
