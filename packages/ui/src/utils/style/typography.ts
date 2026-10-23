/**
 * 文字相关的共用样式表：Text、Heading、Icon、Button 等按同一套档位取字号、字重、色调。
 * 档位与主题 tokens 同名（COMPONENTS.md §6.2）。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
// 取值类型写成带注释接口的 keyof：补全与悬停能看到每个取值的效果（见 styles.ts）

/** 界面文字的字号档位，对应主题的 fontSizes；组件的 size 档位也用它，括号里是默认主题的值 */
export interface TextSizes {
  /** 12px：辅助说明、标签 */
  xs: unknown;
  /** 13px：紧凑控件 */
  sm: unknown;
  /** 14px：正文与默认控件 */
  md: unknown;
  /** 16px：宽松控件、小标题 */
  lg: unknown;
  /** 18px：强调文字、卡片标题 */
  xl: unknown;
}

/** 字号档位：界面文字的五档，加上标题用的两档 */
export interface FontSizes extends TextSizes {
  /** 24px：页面标题 */
  xxl: unknown;
  /** 30px：大标题 */
  xxxl: unknown;
}

/** 界面文字的字号档位：xs–xl */
export type TextSize = keyof TextSizes;
/** 字号档位：xs–xl，加上标题用的 xxl、xxxl */
export type FontSize = keyof FontSizes;

/** 字重，对应主题的 fontWeights */
export interface FontWeights {
  /** 300：细 */
  light: unknown;
  /** 400：正文 */
  normal: unknown;
  /** 500：标签、表头 */
  medium: unknown;
  /** 600：按钮、标题 */
  semibold: unknown;
  /** 700：粗 */
  bold: unknown;
}

/** 字重档位 */
export type FontWeight = keyof FontWeights;

/**
 * 文字色调，对应主题的文字颜色。与状态色调（StatusTones：neutral、accent、info、success、warning、danger）同名，
 * 再加文字专用的 muted：Text、Link、Icon 与 Button、Badge 写同一个值得到同一种颜色
 */
export interface Tones {
  /** 中性：正文色 */
  neutral: unknown;
  /** 次要文字色：说明、辅助信息 */
  muted: unknown;
  /** 品牌色文字：链接、强调 */
  accent: unknown;
  /** 危险：错误提示、破坏性操作的说明 */
  danger: unknown;
  /** 成功 */
  success: unknown;
  /** 警告 */
  warning: unknown;
  /** 信息 */
  info: unknown;
  /** 跟随所在的文字颜色：放在有底色的通栏（Banner 的实底）、标记里时用，对比度由底色保证 */
  inherit: unknown;
}

/** 文字色调 */
export type Tone = keyof Tones;

/** 文字的水平对齐（text-align），按书写方向 */
export interface TextAligns {
  /** 对齐起始边：从左到右排版时靠左 */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 对齐结束边：从左到右排版时靠右 */
  end: unknown;
}

/** 水平对齐 */
export type TextAlign = keyof TextAligns;

/** 换行方式（text-wrap） */
export interface TextWraps {
  /** 正常换行 */
  wrap: unknown;
  /** 不换行，超出容器时溢出（配合 truncate 省略） */
  nowrap: unknown;
  /** 各行长度尽量均衡：标题、短文本 */
  balance: unknown;
  /** 避免最后一行只剩一个字：段落 */
  pretty: unknown;
}

/** 换行方式 */
export type TextWrap = keyof TextWraps;

/** 字号档位 → fontSizes token */
export const fontSizeStyles = stylex.create({
  xs: { fontSize: '_xs' },
  sm: { fontSize: '_sm' },
  md: { fontSize: '_md' },
  lg: { fontSize: '_lg' },
  xl: { fontSize: '_xl' },
  xxl: { fontSize: '_xxl' },
  xxxl: { fontSize: '_xxxl' },
});

/**
 * 相对所在字号的档位（em）：组件内部的小字、标题用它，跟着根上的 size 或所在文字一起缩放。
 * 比例取主题默认字号（md 14px）下与各档的比值：sm ≈ 13px、xs ≈ 12px、lg ≈ 16px、xl ≈ 18px
 */
export const relativeFontSizeStyles = stylex.create({
  xs: { fontSize: '0.86em' },
  sm: { fontSize: '0.93em' },
  lg: { fontSize: '1.14em' },
  xl: { fontSize: '1.29em' },
});

/** 字重档位 → fontWeights token */
export const fontWeightStyles = stylex.create({
  light: { fontWeight: '_light' },
  normal: { fontWeight: '_normal' },
  medium: { fontWeight: '_medium' },
  semibold: { fontWeight: '_semibold' },
  bold: { fontWeight: '_bold' },
});

/** 色调 → 文字颜色 token */
export const toneStyles = stylex.create({
  neutral: { color: '_text' },
  muted: { color: '_textMuted' },
  accent: { color: '_accentText' },
  danger: { color: '_dangerText' },
  success: { color: '_successText' },
  warning: { color: '_warningText' },
  info: { color: '_infoText' },
  inherit: { color: 'inherit' },
});

/** 水平对齐（按书写方向） */
export const textAlignStyles = stylex.create({
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
});

/** 换行方式（text-wrap） */
export const textWrapStyles = stylex.create({
  wrap: { textWrap: 'wrap' },
  nowrap: { textWrap: 'nowrap' },
  // 标题：各行长度尽量均衡
  balance: { textWrap: 'balance' },
  // 段落：避免最后一行只剩一个字
  pretty: { textWrap: 'pretty' },
});

/** 截断：truncate 单行省略，clamp 多行截断（行数见 lineClampStyles） */
export const textStyles = stylex.create({
  // 单行省略：在块级元素或 flex 子项上生效
  truncate: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
  // 多行截断用带 -webkit- 前缀的写法（标准的 line-clamp 尚无浏览器支持），行数见 lineClampStyles
  clamp: { display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  // 数字等宽：表格、金额、计数上下对齐，变化时不跳动
  numeric: { fontVariantNumeric: 'tabular-nums' },
  // 等宽字体：编号、件号、代码片段
  mono: { fontFamily: '_mono' },
});

/** 多行截断的行数：任意值，用动态样式（编译为 CSS 变量），与 textStyles.clamp 一起用 */
export const lineClampStyles = stylex.create({
  lines: (count: number) => ({ WebkitLineClamp: count }),
});
