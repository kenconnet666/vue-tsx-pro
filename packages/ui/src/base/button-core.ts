/**
 * 按钮家族（Button、LinkButton、IconButton、CloseButton、ClearButton）的内核：共用的外观、选项、内容排布与行为。
 * 一个元素一个组件（COMPONENTS.md §1）：各组件只管自己元素的行为，样式与内容排布都从这里取。
 *
 * 外观 = variant（样式）× tone（色调）× size（字号档位，内部尺寸随之按 em 缩放）× radius（圆角）。
 */
import { h, type VNodeChild } from 'vue';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { Icon, type IconData, type IconProps } from './Icon';
import { Spinner, type SpinnerProps } from './Spinner';
import { useDefaults } from '../config/defaults';
import { rippleHostStyles } from '../utils/dom/ripple';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles, type StyleTable } from '../utils/style/styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

/** 按钮样式 */
export interface ButtonVariants {
  /** 实底：一组操作里的主要操作，每组最多一个 */
  solid: unknown;
  /** 浅色底：次要但仍需突出的操作，如卡片里的操作 */
  soft: unknown;
  /** 浅色底加描边：表单、设置页里常用的次要操作 */
  surface: unknown;
  /** 只有描边：次要操作 */
  outline: unknown;
  /** 无底无边，悬停时才有底色：工具栏、行内操作、图标按钮 */
  ghost: unknown;
  /** 看起来像链接（无底、无内边距、悬停下划线）：文字中间的操作 */
  link: unknown;
}

/** 按钮色调 */
export interface ButtonTones {
  /** 品牌色（默认） */
  accent: unknown;
  /** 中性色：不需要强调的操作，如“取消” */
  neutral: unknown;
  /** 危险：删除等破坏性操作 */
  danger: unknown;
}

/** 按钮圆角 */
export interface ButtonRadii {
  /** 直角 */
  none: unknown;
  /** 小圆角 */
  sm: unknown;
  /** 中圆角（默认） */
  md: unknown;
  /** 胶囊形（图标按钮为圆形） */
  full: unknown;
}

/** 按钮家族共用的外观选项；可以用 createUi / Provider 的 defaults.Button 统一改默认值 */
export interface ButtonOptions {
  /** 样式，默认 solid（IconButton 默认 ghost） */
  variant?: keyof ButtonVariants;
  /** 色调，默认 accent */
  tone?: keyof ButtonTones;
  /** 字号档位，内部尺寸随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 圆角，默认 md */
  radius?: keyof ButtonRadii;
  /** 加载中：显示旋转指示，宽度不变，点击无效，焦点保留；读屏会得知 aria-busy */
  loading?: boolean;
  /** 按下时的波纹效果；不写时沿用 createUi / Provider 的 ripple（默认开启） */
  ripple?: boolean;
  /** 加载指示（Spinner）的部件属性 */
  propsSpinner?: Partial<SpinnerProps>;
}

/** 有文字的按钮（Button、LinkButton）另有的选项 */
export interface ButtonContentOptions {
  /** 文字前的图标：`import { Plus } from '@lucide/icons'` */
  icon?: IconData;
  /** 文字后的图标 */
  iconEnd?: IconData;
  /** 占满容器宽度 */
  fullWidth?: boolean;
  /** 内容层（包着图标与文字的 span）的部件属性 */
  propsContent?: PartProps<'span'>;
  /** 前置图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 后置图标的部件属性 */
  propsIconEnd?: Partial<IconProps>;
  children?: VNodeChild;
}

/** 按钮家族 的样式：root、square、fullWidth、disabled、content、hidden 等 */
export const buttonStyles: StyleTable<
  'root' | 'square' | 'fullWidth' | 'disabled' | 'content' | 'hidden' | 'spinner'
> = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_sm',
    minHeight: 'max(_sizes.control, _sizes.minTarget)',
    margin: 0,
    paddingBlock: '_xs',
    paddingInline: '_lg',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: '_semibold',
    lineHeight: '_tight',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    // 触摸时不等双击缩放的判定，点击立即响应
    touchAction: 'manipulation',
    transition:
      'background-color _durations.sm _easings.standard, border-color _durations.sm _easings.standard, color _durations.sm _easings.standard',
  },
  // 图标按钮：宽高相等
  square: {
    paddingInline: 0,
    width: 'max(_sizes.control, _sizes.minTarget)',
    flexShrink: 0,
  },
  fullWidth: { display: 'flex', width: '_full' },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
  content: { display: 'inline-flex', alignItems: 'center', gap: '_sm' },
  // 加载中隐藏内容但保留占位与无障碍名称（不用 visibility: hidden，那样读屏也读不到）
  hidden: { opacity: 0 },
  spinner: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** 按钮家族 的样式：none、sm、md、full */
export const buttonRadiusStyles: StyleTable<keyof ButtonRadii> = stylex.create({
  none: { borderRadius: 0 },
  sm: { borderRadius: '_sm' },
  md: { borderRadius: '_md' },
  full: { borderRadius: '_full' },
});

// 每种样式按色调各一组；中性色没有专门的实底色，用反色表面。
// 实底悬停时混入黑色加深，而不是用 accentHover / dangerHover：两套主题里白字的对比度都只升不降
const solid: StyleTable<keyof ButtonTones> = stylex.create({
  accent: {
    color: '_accentContrast',
    backgroundColor: {
      default: '_accent',
      ':hover': 'color-mix(in oklab, _colors.accent 85%, black)',
    },
  },
  neutral: {
    color: '_inverseText',
    backgroundColor: {
      default: '_inverseSurface',
      ':hover': 'color-mix(in oklab, _colors.inverseSurface 85%, _colors.background)',
    },
  },
  danger: {
    color: '_dangerContrast',
    backgroundColor: {
      default: '_danger',
      ':hover': 'color-mix(in oklab, _colors.danger 85%, black)',
    },
  },
});

const soft: StyleTable<keyof ButtonTones> = stylex.create({
  accent: {
    color: '_accentText',
    backgroundColor: { default: '_accentSoft', ':hover': '_accentSoftHover' },
  },
  neutral: {
    color: '_text',
    backgroundColor: { default: '_fill', ':hover': '_fillHover' },
  },
  danger: {
    color: '_dangerText',
    backgroundColor: { default: '_dangerSoft', ':hover': '_dangerSoftHover' },
  },
});

const surface: StyleTable<keyof ButtonTones> = stylex.create({
  accent: {
    color: '_accentText',
    borderColor: '_accentBorder',
    backgroundColor: { default: '_accentSoft', ':hover': '_accentSoftHover' },
  },
  neutral: {
    color: '_text',
    borderColor: '_border',
    backgroundColor: { default: '_surface', ':hover': '_fillHover' },
  },
  danger: {
    color: '_dangerText',
    borderColor: '_dangerBorder',
    backgroundColor: { default: '_dangerSoft', ':hover': '_dangerSoftHover' },
  },
});

const outline: StyleTable<keyof ButtonTones> = stylex.create({
  accent: {
    color: '_accentText',
    borderColor: '_accentBorder',
    backgroundColor: { default: 'transparent', ':hover': '_accentSoft' },
  },
  neutral: {
    color: '_text',
    borderColor: '_border',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
  },
  danger: {
    color: '_dangerText',
    borderColor: '_dangerBorder',
    backgroundColor: { default: 'transparent', ':hover': '_dangerSoft' },
  },
});

const ghost: StyleTable<keyof ButtonTones> = stylex.create({
  accent: {
    color: '_accentText',
    backgroundColor: { default: 'transparent', ':hover': '_accentSoft' },
  },
  neutral: {
    color: '_text',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
  },
  danger: {
    color: '_dangerText',
    backgroundColor: { default: 'transparent', ':hover': '_dangerSoft' },
  },
});

const link: StyleTable<keyof ButtonTones> = stylex.create({
  accent: { color: '_accentText' },
  neutral: { color: '_text' },
  danger: { color: '_dangerText' },
});

/** 按钮家族 的样式：root */
export const buttonLinkStyles: StyleTable<'root'> = stylex.create({
  root: {
    minHeight: 0,
    paddingInline: 0,
    fontWeight: '_medium',
    textUnderlineOffset: '0.2em',
    textDecorationLine: { default: 'none', ':hover': 'underline' },
  },
});

/** 样式 × 色调 → 样式表：buttonVariantStyles[variant][tone] */
export const buttonVariantStyles: Readonly<
  Record<keyof ButtonVariants, StyleTable<keyof ButtonTones>>
> = {
  solid,
  soft,
  surface,
  outline,
  ghost,
  link,
};

/** 合并后的外观：每一项都有值（size 不写时继承字号） */
export type ButtonAppearance = Required<Pick<ButtonOptions, 'variant' | 'tone' | 'radius'>> &
  Pick<ButtonOptions, 'size'>;

/**
 * 按钮的外观：显式写的 prop > createUi / Provider 的 defaults.Button > 组件自己的默认样式。
 * 在 setup 里调用，返回的函数在渲染时调用（读到最新的 prop 与配置）
 */
export function useButtonAppearance(
  read: () => Pick<ButtonOptions, 'variant' | 'tone' | 'size' | 'radius'>,
  fallbackVariant: keyof ButtonVariants,
): () => ButtonAppearance {
  return useDefaults('Button', read, { variant: fallbackVariant, tone: 'accent', radius: 'md' });
}

/** 外观（已合并默认值）与状态 → 按钮根元素的样式 */
export function buttonSx(
  { variant, tone, size, radius }: ButtonAppearance,
  state: { disabled: boolean; square?: boolean; fullWidth?: boolean },
): StyleXStyles {
  return [
    buttonStyles.root,
    focusRingStyles.visible,
    rippleHostStyles.host,
    buttonVariantStyles[variant][tone],
    variant === 'link' && buttonLinkStyles.root,
    buttonRadiusStyles[radius],
    size && fontSizeStyles[size],
    state.square && buttonStyles.square,
    state.fullWidth && buttonStyles.fullWidth,
    state.disabled && buttonStyles.disabled,
  ] as StyleXStyles;
}

/** 按钮内容：图标、文字、加载指示；加载中内容透明但保留宽度与无障碍名称 */
export function buttonContent(
  {
    icon,
    iconEnd,
    children,
    propsContent,
    propsIcon,
    propsIconEnd,
  }: Omit<ButtonContentOptions, 'fullWidth'>,
  { loading, propsSpinner }: Pick<ButtonOptions, 'loading' | 'propsSpinner'>,
): VNodeChild {
  return [
    h(
      'span',
      elementProps(
        mergeProps<'span'>({ sx: buttonStyles.content }, propsContent, {
          sx: loading && buttonStyles.hidden,
        }),
      ),
      [
        icon && h(Icon, mergeProps<IconProps>({ icon }, propsIcon) as IconProps),
        children,
        iconEnd && h(Icon, mergeProps<IconProps>({ icon: iconEnd }, propsIconEnd) as IconProps),
      ],
    ),
    loading &&
      h(
        Spinner,
        mergeProps<SpinnerProps>({ sx: buttonStyles.spinner }, propsSpinner) as SpinnerProps,
      ),
  ];
}

/** 加载中或“可聚焦的不可用”时拦下点击：不触发使用方的 onClick，也不提交表单 */
export function guardClick<E extends MouseEvent>(
  blocked: () => boolean,
  onClick: () => ((event: E) => void) | undefined,
): (event: E) => void {
  return (event) => {
    if (blocked()) {
      event.preventDefault();
      return;
    }
    onClick()?.(event);
  };
}
