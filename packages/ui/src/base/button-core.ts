/**
 * 按钮家族（Button、LinkButton、IconButton、CloseButton、ClearButton）的内核：共用的外观、选项、内容排布与行为。
 * 一个元素一个组件（COMPONENTS.md §1）：各组件只管自己元素的行为，样式与内容排布都从这里取。
 *
 * 外观 = variant（样式）× tone（色调）× size（字号档位，内部尺寸随之按 em 缩放）× radius（圆角）。
 */
import { h, type VNodeChild } from 'vue';
import { createContext } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { SxStyles } from '@vue-tsx-pro/tsx/styles';
import { Icon, type IconData, type IconProps } from './Icon';
import { Spinner, type SpinnerProps } from './Spinner';
import { useDefaults } from '../config/defaults';
import { partAttrs, useRecipe } from '../config/styles';
import { rippleHostStyles, useRipple, type RippleHandlers } from '../utils/dom/ripple';
import { mergeAttrs, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles, radiusStyles, type Radius } from '../utils/style/styles';
import type { StatusTone } from '../utils/style/tone-styles';
import {
  AttachedContext,
  attachedStyles,
  type AttachedOrientations,
} from '../utils/style/attached';
import { interactionTransitions } from '../utils/style/transitions';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { t } from '../config/theme/tokens';

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

/** 按钮家族共用的外观选项；可以用 createUi / Provider 的 defaults.Button 统一改默认值 */
export interface ButtonOptions {
  /**
   * 样式；可以用 createUi / Provider 的 defaults.Button 统一改
   * @default 'solid'
   */
  variant?: keyof ButtonVariants;
  /**
   * 色调：与 Badge、Alert 等同一套
   * @default 'accent'
   */
  tone?: StatusTone;
  /** 字号档位，内部尺寸随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /**
   * 圆角
   * @default 'md'
   */
  radius?: Radius;
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
export const buttonBaseStyles = css.create({
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
export const buttonStyles = css.create({
  // 去掉默认外观、指针与触摸反馈、颜色过渡来自 buttonBaseStyles 与 interactionTransitions（buttonSx 里排在前面）
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_sm',
    minHeight: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
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
    width: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
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

/** 悬停变色只在可用时：原生 disabled 的按钮照样匹配 :hover，悬停变色会让人以为还能点 */
const HOVER = ':hover:not(:disabled,[aria-disabled="true"])';

/**
 * 按钮的样式（配方）：样式 × 色调逐项写主题 token（组合档位）。中性色没有专门的实底色，用反色表面。
 * 实底悬停用各色调的 Hover token：主题检查保证它与 Contrast 字色到 4.5:1
 */
export const buttonRecipe = css.recipe({
  name: 'Button',
  parts: ['root'],
  variants: {
    variant: {
      solid: {},
      soft: {},
      surface: {},
      outline: {},
      ghost: {},
      link: {
        root: {
          minHeight: 0,
          paddingInline: 0,
          fontWeight: '_medium',
          textUnderlineOffset: '0.2em',
          textDecorationLine: { default: 'none', [HOVER]: 'underline' },
        },
      },
    },
    tone: { neutral: {}, accent: {}, info: {}, success: {}, warning: {}, danger: {} },
  },
  compound: [
    {
      when: { variant: 'solid', tone: 'neutral' },
      root: {
        color: '_inverseText',
        backgroundColor: {
          default: '_inverseSurface',
          [HOVER]: `color-mix(in oklab, ${t.colors.inverseSurface} 85%, ${t.colors.background})`,
        },
      },
    },
    {
      when: { variant: 'solid', tone: 'accent' },
      root: {
        color: '_accentContrast',
        backgroundColor: { default: '_accent', [HOVER]: '_accentHover' },
      },
    },
    {
      when: { variant: 'solid', tone: 'info' },
      root: {
        color: '_infoContrast',
        backgroundColor: { default: '_info', [HOVER]: '_infoHover' },
      },
    },
    {
      when: { variant: 'solid', tone: 'success' },
      root: {
        color: '_successContrast',
        backgroundColor: { default: '_success', [HOVER]: '_successHover' },
      },
    },
    {
      when: { variant: 'solid', tone: 'warning' },
      root: {
        color: '_warningContrast',
        backgroundColor: { default: '_warning', [HOVER]: '_warningHover' },
      },
    },
    {
      when: { variant: 'solid', tone: 'danger' },
      root: {
        color: '_dangerContrast',
        backgroundColor: { default: '_danger', [HOVER]: '_dangerHover' },
      },
    },
    {
      when: { variant: 'soft', tone: 'neutral' },
      root: { color: '_text', backgroundColor: { default: '_fill', [HOVER]: '_fillHover' } },
    },
    {
      when: { variant: 'soft', tone: 'accent' },
      root: {
        color: '_accentText',
        backgroundColor: { default: '_accentSoft', [HOVER]: '_accentSoftHover' },
      },
    },
    {
      when: { variant: 'soft', tone: 'info' },
      root: {
        color: '_infoText',
        backgroundColor: { default: '_infoSoft', [HOVER]: '_infoSoftHover' },
      },
    },
    {
      when: { variant: 'soft', tone: 'success' },
      root: {
        color: '_successText',
        backgroundColor: { default: '_successSoft', [HOVER]: '_successSoftHover' },
      },
    },
    {
      when: { variant: 'soft', tone: 'warning' },
      root: {
        color: '_warningText',
        backgroundColor: { default: '_warningSoft', [HOVER]: '_warningSoftHover' },
      },
    },
    {
      when: { variant: 'soft', tone: 'danger' },
      root: {
        color: '_dangerText',
        backgroundColor: { default: '_dangerSoft', [HOVER]: '_dangerSoftHover' },
      },
    },
    {
      when: { variant: 'surface', tone: 'neutral' },
      root: {
        color: '_text',
        borderColor: '_border',
        backgroundColor: { default: '_surface', [HOVER]: '_fillHover' },
      },
    },
    {
      when: { variant: 'surface', tone: 'accent' },
      root: {
        color: '_accentText',
        borderColor: '_accentBorder',
        backgroundColor: { default: '_accentSoft', [HOVER]: '_accentSoftHover' },
      },
    },
    {
      when: { variant: 'surface', tone: 'info' },
      root: {
        color: '_infoText',
        borderColor: '_infoBorder',
        backgroundColor: { default: '_infoSoft', [HOVER]: '_infoSoftHover' },
      },
    },
    {
      when: { variant: 'surface', tone: 'success' },
      root: {
        color: '_successText',
        borderColor: '_successBorder',
        backgroundColor: { default: '_successSoft', [HOVER]: '_successSoftHover' },
      },
    },
    {
      when: { variant: 'surface', tone: 'warning' },
      root: {
        color: '_warningText',
        borderColor: '_warningBorder',
        backgroundColor: { default: '_warningSoft', [HOVER]: '_warningSoftHover' },
      },
    },
    {
      when: { variant: 'surface', tone: 'danger' },
      root: {
        color: '_dangerText',
        borderColor: '_dangerBorder',
        backgroundColor: { default: '_dangerSoft', [HOVER]: '_dangerSoftHover' },
      },
    },
    {
      when: { variant: 'outline', tone: 'neutral' },
      root: {
        color: '_text',
        borderColor: '_border',
        backgroundColor: { default: 'transparent', [HOVER]: '_fillHover' },
      },
    },
    {
      when: { variant: 'outline', tone: 'accent' },
      root: {
        color: '_accentText',
        borderColor: '_accentBorder',
        backgroundColor: { default: 'transparent', [HOVER]: '_accentSoft' },
      },
    },
    {
      when: { variant: 'outline', tone: 'info' },
      root: {
        color: '_infoText',
        borderColor: '_infoBorder',
        backgroundColor: { default: 'transparent', [HOVER]: '_infoSoft' },
      },
    },
    {
      when: { variant: 'outline', tone: 'success' },
      root: {
        color: '_successText',
        borderColor: '_successBorder',
        backgroundColor: { default: 'transparent', [HOVER]: '_successSoft' },
      },
    },
    {
      when: { variant: 'outline', tone: 'warning' },
      root: {
        color: '_warningText',
        borderColor: '_warningBorder',
        backgroundColor: { default: 'transparent', [HOVER]: '_warningSoft' },
      },
    },
    {
      when: { variant: 'outline', tone: 'danger' },
      root: {
        color: '_dangerText',
        borderColor: '_dangerBorder',
        backgroundColor: { default: 'transparent', [HOVER]: '_dangerSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'neutral' },
      root: { color: '_text', backgroundColor: { default: 'transparent', [HOVER]: '_fillHover' } },
    },
    {
      when: { variant: 'ghost', tone: 'accent' },
      root: {
        color: '_accentText',
        backgroundColor: { default: 'transparent', [HOVER]: '_accentSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'info' },
      root: {
        color: '_infoText',
        backgroundColor: { default: 'transparent', [HOVER]: '_infoSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'success' },
      root: {
        color: '_successText',
        backgroundColor: { default: 'transparent', [HOVER]: '_successSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'warning' },
      root: {
        color: '_warningText',
        backgroundColor: { default: 'transparent', [HOVER]: '_warningSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'danger' },
      root: {
        color: '_dangerText',
        backgroundColor: { default: 'transparent', [HOVER]: '_dangerSoft' },
      },
    },
    { when: { variant: 'link', tone: 'neutral' }, root: { color: '_text' } },
    { when: { variant: 'link', tone: 'accent' }, root: { color: '_accentText' } },
    { when: { variant: 'link', tone: 'info' }, root: { color: '_infoText' } },
    { when: { variant: 'link', tone: 'success' }, root: { color: '_successText' } },
    { when: { variant: 'link', tone: 'warning' }, root: { color: '_warningText' } },
    { when: { variant: 'link', tone: 'danger' }, root: { color: '_dangerText' } },
  ],
});

/** 按钮的部件（createUi / Provider 的 styles.Button 按它定制） */
export type ButtonPart = (typeof buttonRecipe.parts)[number];

/** 按钮根元素的部件标记：`data-scope="button" data-part="root"` */
export const buttonPart = partAttrs(buttonRecipe, 'root');

/** ButtonGroup 交给组里按钮的状态：统一的外观（相连的方向经 AttachedContext 给出） */
export interface ButtonGroupState {
  /** 组上写的外观，组里的按钮没写的项用它 */
  readonly appearance: Pick<ButtonOptions, 'variant' | 'tone' | 'size' | 'radius'>;
}

/** 按钮组的上下文：组里的按钮家族据此相连、共用外观 */
export const ButtonGroupContext = createContext<ButtonGroupState>('ButtonGroup');

/** 合并后的外观：每一项都有值（size 不写时继承字号）；在 ButtonGroup、ControlGroup 里时带上相连的方向 */
export type ButtonAppearance = Required<Pick<ButtonOptions, 'variant' | 'tone' | 'radius'>> &
  Pick<ButtonOptions, 'size'> & {
    attached?: keyof AttachedOrientations;
    /** 按钮的配方，带上 createUi / Provider 里 styles.Button 的定制 */
    recipe: ReturnType<typeof useRecipe<ButtonPart, unknown>>;
  };

/**
 * 按钮的外观：显式写的 prop > 所在 ButtonGroup 写的 > createUi / Provider 的 defaults.Button > 组件自己的默认样式。
 * 在 setup 里调用，返回的函数在渲染时调用（读到最新的 prop 与配置）
 */
export function useButtonAppearance(
  read: () => Pick<ButtonOptions, 'variant' | 'tone' | 'size' | 'radius'>,
  fallbackVariant: keyof ButtonVariants,
  fallbackTone: StatusTone = 'accent',
): () => ButtonAppearance {
  const group = ButtonGroupContext.inject(null);
  const attachedGroup = AttachedContext.inject(null);
  const recipe = useRecipe(buttonRecipe);
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
        attached: attachedGroup?.orientation,
        recipe,
      };
    },
    // 组里的按钮外观要一致：不论有没有文字都按 Button 的默认色调（拆分按钮的两半同色）
    { variant: fallbackVariant, tone: group ? 'accent' : fallbackTone, radius: 'md' },
  );
}

/** 外观（已合并默认值）与状态 → 按钮根元素的样式 */
export function buttonSx(
  { variant, tone, size, radius, attached, recipe }: ButtonAppearance,
  state: { disabled: boolean; square?: boolean; fullWidth?: boolean },
): SxStyles {
  return [
    buttonBaseStyles.root,
    interactionTransitions.colors,
    buttonStyles.root,
    focusRingStyles.visible,
    rippleHostStyles.host,
    recipe({ variant, tone }).root,
    radiusStyles[radius],
    attached && attachedStyles[attached],
    size && fontSizeStyles[size],
    state.square && buttonStyles.square,
    state.fullWidth && buttonStyles.fullWidth,
    state.disabled && buttonStyles.disabled,
  ] as SxStyles;
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
 *   mergeAttrs<'button'>(默认, rest, behavior())
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
