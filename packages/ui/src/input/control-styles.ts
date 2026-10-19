/**
 * 输入框外壳的样式与选项：TextField、Textarea、NumberField，以后的 Select、Combobox、DatePicker 的触发框共用。
 * 外壳是包着原生 input 的 div：边框、悬停、焦点环（:focus-within）、出错、不可用、只读都画在外壳上，
 * input 本身透明无边框，所以图标、清除按钮、步进按钮可以放进框里。尺寸用 em，随 size 缩放（COMPONENTS.md §3）。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { useDefaults } from '../config/defaults';
import { fontSizeStyles, type TextSize } from '../utils/typography';

/** 输入框的样式 */
export interface ControlVariants {
  /** 表面色加描边（默认） */
  outline: unknown;
  /** 浅色底，没有描边：表单很密、或放在有底色的区域里 */
  soft: unknown;
}

/** 输入框的外观选项；可以用 createUi / Provider 的 defaults.Input 统一改默认值 */
export interface ControlOptions {
  /** 样式，默认 outline */
  variant?: keyof ControlVariants;
  /** 字号档位，内部尺寸随之缩放；不写时继承上下文字号 */
  size?: TextSize;
}

/** 外壳的状态：出错、不可用、只读 */
export interface ControlState {
  /** 校验未通过：红色描边与焦点环 */
  invalid?: boolean;
  /** 不可用：变淡 */
  disabled?: boolean;
  /** 只读：底色变浅，不显示悬停 */
  readonly?: boolean;
}

type Table<Key extends string> = Readonly<Record<Key, StyleXStyles>>;

const shell: Table<'root' | 'soft' | 'invalid' | 'disabled' | 'readonly' | 'multiline'> =
  stylex.create({
    root: {
      boxSizing: 'border-box',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '_sm',
      minWidth: 0,
      minHeight: 'max(_sizes.control, _sizes.minTarget)',
      paddingInline: '_md',
      borderWidth: '_xs',
      borderStyle: 'solid',
      borderColor: { default: '_border', ':hover': '_borderStrong' },
      borderRadius: '_md',
      backgroundColor: '_surface',
      color: '_text',
      lineHeight: '_normal',
      cursor: 'text',
      outlineStyle: { default: 'none', ':focus-within': 'solid' },
      outlineWidth: '_sm',
      outlineColor: '_focusRing',
      // 压住边框
      outlineOffset: 'calc(-1 * _xs)',
      transition: 'border-color _durations.sm _easings.standard',
    },
    soft: {
      borderColor: { default: 'transparent', ':hover': 'transparent' },
      backgroundColor: '_fill',
    },
    invalid: {
      borderColor: { default: '_danger', ':hover': '_danger' },
      outlineColor: '_danger',
    },
    disabled: { opacity: '_disabled', cursor: 'not-allowed' },
    readonly: {
      borderColor: { default: '_borderMuted', ':hover': '_borderMuted' },
      backgroundColor: '_fill',
    },
    // 多行（Textarea）：内容从顶部开始，上下也留内边距
    multiline: { alignItems: 'stretch', paddingBlock: '_xs' },
  });

/** 外壳里的各部分：原生输入元素、前后图标、框里的小按钮（清除、显示密码、步进） */
export const controlStyles: Table<'input' | 'icon' | 'button'> = stylex.create({
  /** 原生 input / textarea：透明、无边框，占满剩余宽度，字体继承外壳 */
  input: {
    flexGrow: 1,
    minWidth: 0,
    margin: 0,
    paddingBlock: '_xs',
    paddingInline: 0,
    borderWidth: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    font: 'inherit',
    cursor: 'inherit',
    '::placeholder': { color: '_textPlaceholder', opacity: 1 },
  },
  /** 前后的图标：次要颜色 */
  icon: { flexShrink: 0, color: '_textMuted' },
  /** 框里的小按钮：比独立的图标按钮紧凑，仍不小于 24px 的点击区域 */
  button: {
    flexShrink: 0,
    width: 'max(1.5em, _sizes.minTarget)',
    minHeight: 'max(1.5em, _sizes.minTarget)',
    marginInline: 'calc(-1 * _space.xs)',
    color: '_textMuted',
  },
});

/** 合并后的外观（默认值已填上） */
export type ControlAppearance = Required<Pick<ControlOptions, 'variant'>> &
  Pick<ControlOptions, 'size'>;

/**
 * 输入框的外观：显式写的 prop > createUi / Provider 的 defaults.Input > 默认（outline）。
 * 在 setup 里调用，返回的函数在渲染时调用
 */
export function useControlAppearance(read: () => ControlOptions): () => ControlAppearance {
  const defaults = useDefaults('Input');
  return () => {
    const own = read();
    return {
      variant: own.variant ?? defaults.variant ?? 'outline',
      size: own.size ?? defaults.size,
    };
  };
}

/** 外观与状态 → 外壳的样式；multiline 给 Textarea */
export function controlSx(
  { variant, size }: ControlAppearance,
  { invalid, disabled, readonly }: ControlState,
  multiline = false,
): StyleXStyles {
  return [
    shell.root,
    variant === 'soft' && shell.soft,
    size && fontSizeStyles[size],
    readonly && shell.readonly,
    invalid && shell.invalid,
    disabled && shell.disabled,
    multiline && shell.multiline,
  ] as StyleXStyles;
}
