/**
 * 状态色调的样式表与默认图标：Badge、Tag、Alert、Toast 等“带颜色的标记与提示”共用；按钮家族、Progress 等也用这一套色调。
 * 外观 = variant（实底 / 浅色底 / 浅色底加描边 / 描边）× tone（六种色调）。
 * 实底用该色调的文字色作底色、页面背景色作字色：两套主题里都满足 4.5:1（success、warning、info 没有专门的实底色）。
 */
import { CircleAlert, CircleCheck, Info, TriangleAlert } from '@lucide/icons';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import type { IconData } from '../../base/Icon';
import type { StyleTable } from './styles';

/** 状态色调 */
export interface StatusTones {
  /** 中性：普通的标签、计数，不需要强调的操作（如“取消”） */
  neutral: unknown;
  /** 品牌色：新功能、选中、主要操作 */
  accent: unknown;
  /** 信息：提示、说明 */
  info: unknown;
  /** 成功：已完成、正常 */
  success: unknown;
  /** 警告：需要注意、即将过期 */
  warning: unknown;
  /** 危险：错误、失败、删除等破坏性操作 */
  danger: unknown;
}

/** 标记与提示的样式 */
export interface StatusVariants {
  /** 实底：最醒目，计数、状态点 */
  solid: unknown;
  /** 浅色底（默认） */
  soft: unknown;
  /** 浅色底加描边 */
  surface: unknown;
  /** 只有描边 */
  outline: unknown;
}

/** 状态色调 */
export type StatusTone = keyof StatusTones;
/** 标记与提示的样式 */
export type StatusVariant = keyof StatusVariants;

const solid = stylex.create({
  neutral: { color: '_inverseText', backgroundColor: '_inverseSurface' },
  accent: { color: '_accentContrast', backgroundColor: '_accent' },
  info: { color: '_background', backgroundColor: '_infoText' },
  success: { color: '_background', backgroundColor: '_successText' },
  warning: { color: '_background', backgroundColor: '_warningText' },
  danger: { color: '_dangerContrast', backgroundColor: '_danger' },
});

const soft = stylex.create({
  neutral: { color: '_text', backgroundColor: '_fill' },
  accent: { color: '_accentText', backgroundColor: '_accentSoft' },
  info: { color: '_infoText', backgroundColor: '_infoSoft' },
  success: { color: '_successText', backgroundColor: '_successSoft' },
  warning: { color: '_warningText', backgroundColor: '_warningSoft' },
  danger: { color: '_dangerText', backgroundColor: '_dangerSoft' },
});

const surface = stylex.create({
  neutral: { color: '_text', backgroundColor: '_surface', borderColor: '_border' },
  accent: { color: '_accentText', backgroundColor: '_accentSoft', borderColor: '_accentBorder' },
  info: { color: '_infoText', backgroundColor: '_infoSoft', borderColor: '_infoBorder' },
  success: {
    color: '_successText',
    backgroundColor: '_successSoft',
    borderColor: '_successBorder',
  },
  warning: {
    color: '_warningText',
    backgroundColor: '_warningSoft',
    borderColor: '_warningBorder',
  },
  danger: { color: '_dangerText', backgroundColor: '_dangerSoft', borderColor: '_dangerBorder' },
});

const outline = stylex.create({
  neutral: { color: '_text', borderColor: '_border' },
  accent: { color: '_accentText', borderColor: '_accentBorder' },
  info: { color: '_infoText', borderColor: '_infoBorder' },
  success: { color: '_successText', borderColor: '_successBorder' },
  warning: { color: '_warningText', borderColor: '_warningBorder' },
  danger: { color: '_dangerText', borderColor: '_dangerBorder' },
});

/** 状态色调 的样式：bordered */
export const statusToneBorderStyles = stylex.create({
  // 每种样式都留出边框的位置（实底、浅色底时透明），切换样式时尺寸不变
  bordered: { borderWidth: '_xs', borderStyle: 'solid', borderColor: 'transparent' },
});

/** 样式 × 状态色调 → 样式表：statusToneStyles[variant][tone]（一般用 statusToneSx） */
export const statusToneStyles: Readonly<Record<StatusVariant, StyleTable<StatusTone>>> = {
  solid,
  soft,
  surface,
  outline,
};

/** 每种状态色调默认的图标（Lucide）：提示条、通知、确认对话框按色调自动选图标 */
export const statusIcons: Readonly<Record<StatusTone, IconData>> = {
  neutral: Info,
  accent: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

/** 样式 × 色调 → 颜色、底色与边框 */
export function statusToneSx(variant: StatusVariant, tone: StatusTone): StyleXStyles {
  return [statusToneBorderStyles.bordered, statusToneStyles[variant][tone]] as StyleXStyles;
}

/**
 * 实底色调的颜色变量：选中的勾选框、单选框、开关与滑块的已选部分用 `var(--tone-fill)` 作底色、
 * `var(--tone-on-fill)` 作其上的对勾、圆点、滑块色。组件根元素加 toneFillStyles[tone]，各部件引用变量：
 * 部件的选中样式不随色调再分六份。
 * 配色同 solid，只是 danger 也用文字色：暗色主题里 danger 在轨道（fill）上不到 3:1
 */
export const toneFillStyles = stylex.create({
  neutral: { '--tone-fill': '_colors.inverseSurface', '--tone-on-fill': '_colors.inverseText' },
  accent: { '--tone-fill': '_colors.accent', '--tone-on-fill': '_colors.accentContrast' },
  info: { '--tone-fill': '_colors.infoText', '--tone-on-fill': '_colors.background' },
  success: { '--tone-fill': '_colors.successText', '--tone-on-fill': '_colors.background' },
  warning: { '--tone-fill': '_colors.warningText', '--tone-on-fill': '_colors.background' },
  danger: { '--tone-fill': '_colors.dangerText', '--tone-on-fill': '_colors.background' },
});
