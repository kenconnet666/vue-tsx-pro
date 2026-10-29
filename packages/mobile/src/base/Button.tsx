/**
 * 按钮（button）：样式 × 色调 × 尺寸 × 圆角，图标、加载中、占满一行。按下时变深一档（触屏没有悬停）。
 *
 *   <Button onClick={save}>保存</Button>
 *   <Button variant="outline" tone="neutral" size="sm">取消</Button>
 *   <Button tone="danger" icon={Trash2} loading={removing}>删除</Button>
 *   <Button size="lg" fullWidth radius="full">提交订单</Button>
 *
 * 加载中与禁用时不响应点击（使用方的 onClick 不会被调用）；加载中保持原宽度、不变灰，读屏得知 aria-busy。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Loading, type LoadingProps } from '../feedback/Loading';
import { dataAttrs, hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { MobileRadius, MobileSize, MobileTone } from '../utils/scales';
import { Icon, type IconData, type IconProps } from './Icon';

/** 按钮样式 */
export interface ButtonVariants {
  /** 实底：一组操作里的主要操作 */
  solid: unknown;
  /** 浅色底：次要但仍需突出的操作 */
  soft: unknown;
  /** 描边：次要操作 */
  outline: unknown;
  /** 无底无边，按下时才有底色：导航栏、列表里的文字按钮 */
  ghost: unknown;
}

/** 状态与语义属性由组件管理 */
export type ButtonManaged = 'disabled' | 'aria-busy' | 'aria-disabled';

/** 未声明的属性落到 button 上 */
export interface ButtonProps extends PartProps<'button', ButtonManaged> {
  /**
   * 样式
   * @default 'solid'
   */
  variant?: keyof ButtonVariants;
  /**
   * 色调
   * @default 'accent'
   */
  tone?: MobileTone;
  /**
   * 尺寸
   * @default 'md'
   */
  size?: MobileSize;
  /**
   * 圆角
   * @default 'md'
   */
  radius?: MobileRadius;
  /** 占满容器宽度 */
  fullWidth?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 加载中：图标换成旋转指示，不响应点击 */
  loading?: boolean;
  /** 加载中显示的文字；不给时保留原来的文字 */
  loadingText?: VNodeChild;
  /** 文字前的图标 */
  icon?: IconData;
  /** 文字后的图标 */
  iconEnd?: IconData;
  /** 按钮文字 */
  children?: VNodeChild;
  /** 内容层（包着图标与文字的 span）的部件属性 */
  propsContent?: PartProps<'span'>;
  /** 前置图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 后置图标的部件属性 */
  propsIconEnd?: Partial<IconProps>;
  /** 加载指示的部件属性 */
  propsLoading?: Partial<LoadingProps>;
}

/** Button 的部件 */
export type ButtonPart = 'root' | 'content' | 'icon';

/** Button 的配方：样式 × 色调 × 尺寸 × 圆角 */
export const buttonRecipe = css.recipe({
  name: 'Button',
  parts: ['root', 'content', 'icon'],
  base: {
    root: {
      boxSizing: 'border-box',
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      borderWidth: '_xs',
      borderStyle: 'solid',
      borderColor: 'transparent',
      fontFamily: 'inherit',
      fontWeight: '_medium',
      lineHeight: '_tight',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      verticalAlign: 'middle',
      userSelect: 'none',
      cursor: { default: 'pointer', _disabled: 'not-allowed' },
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      opacity: { default: 1, '[data-disabled]': '_disabled' },
      transitionProperty: 'background-color, border-color, color, opacity',
      transitionDuration: '_xs',
      transitionTimingFunction: '_standard',
    },
    content: { display: 'inline-flex', alignItems: 'center', gap: '_xs' },
    icon: { fontSize: '1.15em' },
  },
  variants: {
    size: {
      xs: { root: { fontSize: '_xs', minHeight: '2em', paddingInline: '_sm' } },
      sm: { root: { fontSize: '_md', minHeight: '2.3em', paddingInline: '_md' } },
      md: { root: { fontSize: '_lg', minHeight: '_control', paddingInline: '_lg' } },
      lg: { root: { fontSize: '_lg', minHeight: '3.125em', paddingInline: '_xl' } },
    },
    radius: {
      none: { root: { borderRadius: '_none' } },
      sm: { root: { borderRadius: '_sm' } },
      md: { root: { borderRadius: '_md' } },
      lg: { root: { borderRadius: '_lg' } },
      full: { root: { borderRadius: '_full' } },
    },
    fullWidth: { true: { root: { display: 'flex', width: '100%' } } },
    variant: {
      solid: {},
      soft: {},
      outline: { root: { backgroundColor: '_surface' } },
      ghost: { root: { backgroundColor: 'transparent' } },
    },
    tone: {
      accent: {},
      neutral: {},
      danger: {},
      success: {},
      warning: {},
      info: {},
    },
  },
  // 按下（:active）变深一档；禁用时不变（[data-disabled] 上不加按下的样式）
  compound: [
    // ───── 实底 ─────
    {
      when: { variant: 'solid', tone: 'accent' },
      root: {
        color: '_accentContrast',
        backgroundColor: { default: '_accent', ':active:not([data-disabled])': '_accentActive' },
      },
    },
    {
      when: { variant: 'solid', tone: 'neutral' },
      root: {
        color: '_inverseText',
        backgroundColor: '_inverseSurface',
        opacity: {
          default: 1,
          ':active:not([data-disabled])': 0.85,
          '[data-disabled]': '_disabled',
        },
      },
    },
    {
      when: { variant: 'solid', tone: 'danger' },
      root: {
        color: '_dangerContrast',
        backgroundColor: { default: '_danger', ':active:not([data-disabled])': '_dangerActive' },
      },
    },
    {
      when: { variant: 'solid', tone: 'success' },
      root: {
        color: '_successContrast',
        backgroundColor: { default: '_success', ':active:not([data-disabled])': '_successActive' },
      },
    },
    {
      when: { variant: 'solid', tone: 'warning' },
      root: {
        color: '_warningContrast',
        backgroundColor: { default: '_warning', ':active:not([data-disabled])': '_warningActive' },
      },
    },
    {
      when: { variant: 'solid', tone: 'info' },
      root: {
        color: '_infoContrast',
        backgroundColor: { default: '_info', ':active:not([data-disabled])': '_infoActive' },
      },
    },
    // ───── 浅色底 ─────
    {
      when: { variant: 'soft', tone: 'accent' },
      root: {
        color: '_accentText',
        backgroundColor: {
          default: '_accentSoft',
          ':active:not([data-disabled])': '_accentSoftActive',
        },
      },
    },
    {
      when: { variant: 'soft', tone: 'neutral' },
      root: {
        color: '_text',
        backgroundColor: { default: '_fill', ':active:not([data-disabled])': '_fillActive' },
      },
    },
    {
      when: { variant: 'soft', tone: 'danger' },
      root: {
        color: '_dangerText',
        backgroundColor: {
          default: '_dangerSoft',
          ':active:not([data-disabled])': '_dangerSoftActive',
        },
      },
    },
    {
      when: { variant: 'soft', tone: 'success' },
      root: {
        color: '_successText',
        backgroundColor: {
          default: '_successSoft',
          ':active:not([data-disabled])': '_successSoftActive',
        },
      },
    },
    {
      when: { variant: 'soft', tone: 'warning' },
      root: {
        color: '_warningText',
        backgroundColor: {
          default: '_warningSoft',
          ':active:not([data-disabled])': '_warningSoftActive',
        },
      },
    },
    {
      when: { variant: 'soft', tone: 'info' },
      root: {
        color: '_infoText',
        backgroundColor: {
          default: '_infoSoft',
          ':active:not([data-disabled])': '_infoSoftActive',
        },
      },
    },
    // ───── 描边 ─────
    {
      when: { variant: 'outline', tone: 'accent' },
      root: {
        color: '_accentText',
        borderColor: '_accent',
        backgroundColor: { default: '_surface', ':active:not([data-disabled])': '_accentSoft' },
      },
    },
    {
      when: { variant: 'outline', tone: 'neutral' },
      root: {
        color: '_text',
        borderColor: '_borderStrong',
        backgroundColor: { default: '_surface', ':active:not([data-disabled])': '_fill' },
      },
    },
    {
      when: { variant: 'outline', tone: 'danger' },
      root: {
        color: '_dangerText',
        borderColor: '_danger',
        backgroundColor: { default: '_surface', ':active:not([data-disabled])': '_dangerSoft' },
      },
    },
    {
      when: { variant: 'outline', tone: 'success' },
      root: {
        color: '_successText',
        borderColor: '_success',
        backgroundColor: { default: '_surface', ':active:not([data-disabled])': '_successSoft' },
      },
    },
    {
      when: { variant: 'outline', tone: 'warning' },
      root: {
        color: '_warningText',
        borderColor: '_warning',
        backgroundColor: { default: '_surface', ':active:not([data-disabled])': '_warningSoft' },
      },
    },
    {
      when: { variant: 'outline', tone: 'info' },
      root: {
        color: '_infoText',
        borderColor: '_info',
        backgroundColor: { default: '_surface', ':active:not([data-disabled])': '_infoSoft' },
      },
    },
    // ───── 无底无边 ─────
    {
      when: { variant: 'ghost', tone: 'accent' },
      root: {
        color: '_accentText',
        backgroundColor: { default: 'transparent', ':active:not([data-disabled])': '_accentSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'neutral' },
      root: {
        color: '_text',
        backgroundColor: { default: 'transparent', ':active:not([data-disabled])': '_fill' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'danger' },
      root: {
        color: '_dangerText',
        backgroundColor: { default: 'transparent', ':active:not([data-disabled])': '_dangerSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'success' },
      root: {
        color: '_successText',
        backgroundColor: { default: 'transparent', ':active:not([data-disabled])': '_successSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'warning' },
      root: {
        color: '_warningText',
        backgroundColor: { default: 'transparent', ':active:not([data-disabled])': '_warningSoft' },
      },
    },
    {
      when: { variant: 'ghost', tone: 'info' },
      root: {
        color: '_infoText',
        backgroundColor: { default: 'transparent', ':active:not([data-disabled])': '_infoSoft' },
      },
    },
  ],
  defaults: { variant: 'solid', tone: 'accent', size: 'md', radius: 'md' },
});

/** 按钮（button > span 内容） */
export const Button = _component(
  ({
    variant,
    tone,
    size,
    radius,
    fullWidth = false,
    disabled = false,
    loading = false,
    loadingText,
    icon,
    iconEnd,
    children,
    propsContent,
    propsIcon,
    propsIconEnd,
    propsLoading,
    onClick,
    type = 'button',
    ...rest
  }: ButtonProps) =>
    () => {
      const s = buttonRecipe({ variant, tone, size, radius, fullWidth });
      const busy = disabled || loading;
      return (
        <button
          {...mergeAttrs<'button'>({ sx: s.root }, rest, {
            type,
            disabled,
            // 加载中不响应点击（使用方的回调也不调用），但不设 disabled：保持外观与焦点
            onClick: busy ? undefined : onClick,
            'aria-busy': loading || undefined,
            ...dataAttrs({
              'data-disabled': disabled || undefined,
              'data-loading': loading || undefined,
            }),
          })}
        >
          <span {...mergeAttrs<'span'>({ sx: s.content }, propsContent)}>
            {loading ? (
              <Loading {...mergePartProps<LoadingProps>({ sx: s.icon }, propsLoading)} />
            ) : (
              icon && <Icon {...mergePartProps<IconProps>({ icon, sx: s.icon }, propsIcon)} />
            )}
            {loading && hasContent(loadingText) ? loadingText : children}
            {iconEnd && !loading && (
              <Icon {...mergePartProps<IconProps>({ icon: iconEnd, sx: s.icon }, propsIconEnd)} />
            )}
          </span>
        </button>
      );
    },
);
