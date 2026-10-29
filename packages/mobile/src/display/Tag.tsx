/**
 * 标签：状态、分类、筛选条件。可关闭（右边一个 ×，点了调用 onClose）。
 *
 *   <Tag tone="success">已付款</Tag>
 *   <Tag variant="outline" radius="full">新品</Tag>
 *   <Tag closable onClose={() => remove(item)}>{item.name}</Tag>
 */
import { X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { useConfig } from '../config/context';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { MobileTone } from '../utils/scales';

/** 标签样式 */
export interface TagVariants {
  /** 实底 */
  solid: unknown;
  /** 浅色底 */
  soft: unknown;
  /** 描边 */
  outline: unknown;
}

/** 未声明的属性落到根元素（span）上 */
export interface TagProps extends PartProps<'span'> {
  /**
   * 样式
   * @default 'soft'
   */
  variant?: keyof TagVariants;
  /**
   * 色调
   * @default 'neutral'
   */
  tone?: MobileTone;
  /**
   * 尺寸
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 圆角
   * @default 'sm'
   */
  radius?: 'sm' | 'full';
  /** 右边显示关闭按钮 */
  closable?: boolean;
  /** 点了关闭按钮 */
  onClose?: (event: Event) => void;
  /** 标签文字 */
  children?: VNodeChild;
  /** 关闭按钮的部件属性 */
  propsClose?: PartProps<'button'>;
  /** 关闭图标的部件属性 */
  propsCloseIcon?: Partial<IconProps>;
}

/** Tag 的部件 */
export type TagPart = 'root' | 'close';

/** Tag 的配方：样式 × 色调 × 尺寸 × 圆角 */
export const tagRecipe = css.recipe({
  name: 'Tag',
  parts: ['root', 'close'],
  base: {
    root: {
      boxSizing: 'border-box',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.2em',
      paddingInline: '0.45em',
      borderWidth: '_xs',
      borderStyle: 'solid',
      borderColor: 'transparent',
      lineHeight: '1.5',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
    },
    close: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      marginInlineEnd: '-0.2em',
      padding: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      color: 'inherit',
      fontSize: '1em',
      opacity: { default: 0.7, ':active': 1 },
      cursor: 'pointer',
    },
  },
  variants: {
    size: {
      sm: { root: { fontSize: '_xs', lineHeight: '1.25', paddingInline: '0.3em' } },
      md: { root: { fontSize: '_xs' } },
      lg: { root: { fontSize: '_sm', paddingInline: '0.6em' } },
    },
    radius: {
      sm: { root: { borderRadius: '_sm' } },
      full: { root: { borderRadius: '_full' } },
    },
    variant: { solid: {}, soft: {}, outline: {} },
    tone: { accent: {}, neutral: {}, danger: {}, success: {}, warning: {}, info: {} },
  },
  compound: [
    {
      when: { variant: 'solid', tone: 'accent' },
      root: { color: '_accentContrast', backgroundColor: '_accent' },
    },
    {
      when: { variant: 'solid', tone: 'neutral' },
      root: { color: '_inverseText', backgroundColor: '_inverseSurface' },
    },
    {
      when: { variant: 'solid', tone: 'danger' },
      root: { color: '_dangerContrast', backgroundColor: '_danger' },
    },
    {
      when: { variant: 'solid', tone: 'success' },
      root: { color: '_successContrast', backgroundColor: '_success' },
    },
    {
      when: { variant: 'solid', tone: 'warning' },
      root: { color: '_warningContrast', backgroundColor: '_warning' },
    },
    {
      when: { variant: 'solid', tone: 'info' },
      root: { color: '_infoContrast', backgroundColor: '_info' },
    },
    {
      when: { variant: 'soft', tone: 'accent' },
      root: { color: '_accentText', backgroundColor: '_accentSoft' },
    },
    {
      when: { variant: 'soft', tone: 'neutral' },
      root: { color: '_textMuted', backgroundColor: '_fill' },
    },
    {
      when: { variant: 'soft', tone: 'danger' },
      root: { color: '_dangerText', backgroundColor: '_dangerSoft' },
    },
    {
      when: { variant: 'soft', tone: 'success' },
      root: { color: '_successText', backgroundColor: '_successSoft' },
    },
    {
      when: { variant: 'soft', tone: 'warning' },
      root: { color: '_warningText', backgroundColor: '_warningSoft' },
    },
    {
      when: { variant: 'soft', tone: 'info' },
      root: { color: '_infoText', backgroundColor: '_infoSoft' },
    },
    {
      when: { variant: 'outline', tone: 'accent' },
      root: { color: '_accentText', borderColor: '_accentBorder' },
    },
    {
      when: { variant: 'outline', tone: 'neutral' },
      root: { color: '_textMuted', borderColor: '_borderStrong' },
    },
    {
      when: { variant: 'outline', tone: 'danger' },
      root: { color: '_dangerText', borderColor: '_dangerBorder' },
    },
    {
      when: { variant: 'outline', tone: 'success' },
      root: { color: '_successText', borderColor: '_successBorder' },
    },
    {
      when: { variant: 'outline', tone: 'warning' },
      root: { color: '_warningText', borderColor: '_warningBorder' },
    },
    {
      when: { variant: 'outline', tone: 'info' },
      root: { color: '_infoText', borderColor: '_infoBorder' },
    },
  ],
  defaults: { variant: 'soft', tone: 'neutral', size: 'md', radius: 'sm' },
});

/** 标签（span > 文字 + 关闭按钮） */
export const Tag = _component(
  ({
    variant,
    tone,
    size,
    radius,
    closable = false,
    onClose,
    children,
    propsClose,
    propsCloseIcon,
    ...rest
  }: TagProps) => {
    const config = useConfig();
    return () => {
      const s = tagRecipe({ variant, tone, size, radius });
      return (
        <span {...mergeAttrs<'span'>({ sx: s.root }, rest)}>
          {children}
          {closable && (
            <button
              {...mergeAttrs<'button'>({ sx: s.close }, propsClose, {
                type: 'button',
                'aria-label': config.lang.close,
                onClick: (event: Event) => {
                  // 标签常放在可点击的单元格、卡片里：关闭不连带触发外层的点击
                  event.stopPropagation();
                  onClose?.(event);
                },
              })}
            >
              <Icon {...mergePartProps<IconProps>({ icon: X }, propsCloseIcon)} />
            </button>
          )}
        </span>
      );
    };
  },
);
