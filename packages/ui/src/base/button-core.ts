/**
 * 按钮家族（Button、LinkButton、IconButton、CloseButton、ClearButton）的内核：共用的外观、选项、内容排布与行为。
 * 一个元素一个组件（COMPONENTS.md §1）：各组件只管自己元素的行为，样式与内容排布都从这里取。
 *
 * 外观 = variant（样式）× tone（色调）× size（字号档位，内部尺寸随之按 em 缩放）× radius（圆角）。
 */
import { h, type VNodeChild } from 'vue';
import { createContext } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { Icon, type IconData, type IconProps } from './Icon';
import { Spinner, type SpinnerProps } from './Spinner';
import { useDefaults } from '../config/defaults';
import { rippleHostStyles, useRipple, type RippleHandlers } from '../utils/dom/ripple';
import { mergeAttrs, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles, type StyleTable } from '../utils/style/styles';
import { interactionTransitions } from '../utils/style/transitions';
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
  /**
   * 样式；可以用 createUi / Provider 的 defaults.Button 统一改
   * @default 'solid'
   */
  variant?: keyof ButtonVariants;
  /**
   * 色调
   * @default 'accent'
   */
  tone?: keyof ButtonTones;
  /** 字号档位，内部尺寸随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /**
   * 圆角
   * @default 'md'
   */
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
  /** 按钮文字；加载中仍保留（读屏名称不变） */
  children?: VNodeChild;
}

/** 按钮的基础样式：去掉默认外观，继承文字样式，指针与触摸的反馈；Button 家族也用它 */
export const buttonBaseStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    textAlign: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    // 触摸时不等双击缩放的判定，点击立即响应
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  disabled: { cursor: 'not-allowed' },
});

/** 按钮家族 的样式：root、square、fullWidth、disabled、content、hidden 等 */
export const buttonStyles = stylex.create({
  // 去掉默认外观、指针与触摸反馈、颜色过渡来自 buttonBaseStyles 与 interactionTransitions（buttonSx 里排在前面）
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_sm',
    minHeight: 'max(_sizes.control, _sizes.minTarget)',
    paddingBlock: '_xs',
    paddingInline: '_lg',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: 'transparent',
    fontWeight: '_semibold',
    lineHeight: '_tight',
    whiteSpace: 'nowrap',
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
export const buttonRadiusStyles = stylex.create({
  none: { borderRadius: 0 },
  sm: { borderRadius: '_sm' },
  md: { borderRadius: '_md' },
  full: { borderRadius: '_full' },
});

// 每种样式按色调各一组；中性色没有专门的实底色，用反色表面。
// 实底悬停时混入黑色加深，而不是用 accentHover / dangerHover：两套主题里白字的对比度都只升不降
const solid = stylex.create({
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

const soft = stylex.create({
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

const surface = stylex.create({
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

const outline = stylex.create({
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

const ghost = stylex.create({
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

const link = stylex.create({
  accent: { color: '_accentText' },
  neutral: { color: '_text' },
  danger: { color: '_dangerText' },
});

/** 按钮家族 的样式：root */
export const buttonLinkStyles = stylex.create({
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

/** 按钮组的排列方向 */
export type ButtonGroupOrientation = 'horizontal' | 'vertical';

/** ButtonGroup 交给组里按钮的状态：统一的外观与排列方向 */
export interface ButtonGroupState {
  /** 组上写的外观，组里的按钮没写的项用它 */
  readonly appearance: Pick<ButtonOptions, 'variant' | 'tone' | 'size' | 'radius'>;
  /** 排列方向：决定去掉哪一侧的圆角 */
  readonly orientation: ButtonGroupOrientation;
}

/** 按钮组的上下文：组里的按钮家族据此相连、共用外观 */
export const ButtonGroupContext = createContext<ButtonGroupState>('ButtonGroup');

/** 合并后的外观：每一项都有值（size 不写时继承字号）；在 ButtonGroup 里时带上相连的方向 */
export type ButtonAppearance = Required<Pick<ButtonOptions, 'variant' | 'tone' | 'radius'>> &
  Pick<ButtonOptions, 'size'> & { attached?: ButtonGroupOrientation };

/**
 * 按钮的外观：显式写的 prop > 所在 ButtonGroup 写的 > createUi / Provider 的 defaults.Button > 组件自己的默认样式。
 * 在 setup 里调用，返回的函数在渲染时调用（读到最新的 prop 与配置）
 */
export function useButtonAppearance(
  read: () => Pick<ButtonOptions, 'variant' | 'tone' | 'size' | 'radius'>,
  fallbackVariant: keyof ButtonVariants,
): () => ButtonAppearance {
  const group = ButtonGroupContext.inject(null);
  return useDefaults(
    'Button',
    () => {
      const { variant, tone, size, radius } = read();
      const shared = group?.appearance;
      return {
        variant: variant ?? shared?.variant,
        tone: tone ?? shared?.tone,
        size: size ?? shared?.size,
        radius: radius ?? shared?.radius,
        attached: group?.orientation,
      };
    },
    { variant: fallbackVariant, tone: 'accent', radius: 'md' },
  );
}

// 组里相连的按钮：去掉相邻一侧的圆角，边框叠在一起（不显得加粗）；悬停、聚焦的那个浮到上面，边框与焦点环不被邻居盖住
const attachedStyles = stylex.create({
  horizontal: {
    position: 'relative',
    zIndex: { default: null, ':hover': 1, ':focus-visible': 2 },
    marginInlineStart: { default: 'calc(-1 * _borderWidths.xs)', ':first-child': 0 },
    borderStartStartRadius: { default: 0, ':first-child': null },
    borderEndStartRadius: { default: 0, ':first-child': null },
    borderStartEndRadius: { default: 0, ':last-child': null },
    borderEndEndRadius: { default: 0, ':last-child': null },
  },
  vertical: {
    position: 'relative',
    zIndex: { default: null, ':hover': 1, ':focus-visible': 2 },
    marginBlockStart: { default: 'calc(-1 * _borderWidths.xs)', ':first-child': 0 },
    borderStartStartRadius: { default: 0, ':first-child': null },
    borderStartEndRadius: { default: 0, ':first-child': null },
    borderEndStartRadius: { default: 0, ':last-child': null },
    borderEndEndRadius: { default: 0, ':last-child': null },
  },
});

/** 外观（已合并默认值）与状态 → 按钮根元素的样式 */
export function buttonSx(
  { variant, tone, size, radius, attached }: ButtonAppearance,
  state: { disabled: boolean; square?: boolean; fullWidth?: boolean },
): StyleXStyles {
  return [
    buttonBaseStyles.root,
    interactionTransitions.colors,
    buttonStyles.root,
    focusRingStyles.visible,
    rippleHostStyles.host,
    buttonVariantStyles[variant][tone],
    variant === 'link' && buttonLinkStyles.root,
    buttonRadiusStyles[radius],
    attached && attachedStyles[attached],
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
      mergeAttrs<'span'>({ sx: buttonStyles.content }, propsContent, {
        sx: loading && buttonStyles.hidden,
      }),
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

/** useButtonBehavior 每次渲染读取的状态 */
export interface ButtonBehaviorState {
  /** 不可用 */
  disabled: boolean;
  /** 加载中：点击无效，焦点保留 */
  loading: boolean;
  /** 不可用时仍可聚焦：用 aria-disabled 代替原生 disabled。链接没有原生 disabled，总是写 true */
  focusableWhenDisabled?: boolean;
  /** 波纹；不写时沿用配置 */
  ripple?: boolean;
}

/** useButtonBehavior 给出的受管属性：展开到 mergeProps 的受管层 */
export interface ButtonBehaviorProps<E extends MouseEvent = MouseEvent> extends RippleHandlers {
  /** 原生 disabled（不可聚焦的不可用） */
  disabled?: boolean;
  /** 可聚焦的不可用 */
  'aria-disabled'?: true;
  /** 加载中 */
  'aria-busy'?: true;
  /** 加载中、可聚焦的不可用时拦下点击，否则交给使用方的 onClick */
  onClick: (event: E) => void;
  /** 状态写成 data 属性，样式与测试据此选择 */
  'data-loading'?: true;
  /** 不可用（两种方式都有） */
  'data-disabled'?: true;
}

/**
 * 按钮家族的行为：不可用（原生 disabled 或可聚焦的 aria-disabled）、加载中、拦截点击、波纹、状态 data 属性。
 * 被拦下的点击会 preventDefault：不触发使用方的 onClick，也不提交表单、不跟随链接。
 *
 *   const behavior = useButtonBehavior(() => ({ disabled, loading, focusableWhenDisabled, ripple }), () => onClick);
 *   mergeProps<'button'>(默认, rest, behavior())
 */
export function useButtonBehavior<E extends MouseEvent>(
  read: () => ButtonBehaviorState,
  onClick: () => ((event: E) => void) | undefined,
): () => ButtonBehaviorProps<E> {
  const ripple = useRipple(() => read().ripple);
  function click(event: E) {
    const { disabled, loading, focusableWhenDisabled = false } = read();
    if (loading || (disabled && focusableWhenDisabled)) {
      event.preventDefault();
      return;
    }
    onClick()?.(event);
  }
  return () => {
    const { disabled, loading, focusableWhenDisabled = false } = read();
    const soft = disabled && focusableWhenDisabled;
    return {
      disabled: (disabled && !focusableWhenDisabled) || undefined,
      'aria-disabled': soft || undefined,
      'aria-busy': loading || undefined,
      onClick: click,
      ...ripple,
      'data-loading': loading || undefined,
      'data-disabled': disabled || undefined,
    };
  };
}
