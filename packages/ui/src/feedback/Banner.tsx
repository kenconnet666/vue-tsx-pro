/**
 * 横幅：贴着页面（或区域）顶部的一行通栏通知，系统维护、试用到期、新功能上线、只读模式这类整页都相关的消息。
 *
 *   <Banner tone="warning" title="系统维护" action={<Link href="/notice">查看详情</Link>} onClose={hide}>
 *     今晚 22:00–23:00 暂停服务
 *   </Banner>
 *
 * 和 Alert 的分工：Alert 放在内容里、说明某一块的状态，可以有多行正文；Banner 占满宽度、一行说完，内容居中，
 * 没有圆角，放在页面最上方（AppShell 的顶栏之上或之下）。实底（solid）最醒目，用于必须先看到的消息。
 * 关闭时先离场再报告 onClose（useDismissible），使用方移除并记住“已关闭”；没移除就重新出现。
 * 页面加载时就在的横幅不播报；运行中才出现的用 live（同 Alert）。
 * 部件：Root（div）、Icon、Content（div：标题与正文）、Title（strong）、Action、Close。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { CloseButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { hasContent, mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { useDismissible } from '../utils/motion/presence';
import { statusIcons, statusToneSx, type StatusTone } from '../utils/style/tone-styles';
import { presenceStyles } from '../utils/style/transitions';
import { fontSizeStyles, relativeFontSizeStyles, type TextSize } from '../utils/style/typography';
import type { AlertLives } from './Alert';
import { t } from '../config/theme/tokens';

/** 横幅的样式 */
export interface BannerVariants {
  /** 浅色底（默认） */
  soft: unknown;
  /** 实底：最醒目，必须先看到的消息 */
  solid: unknown;
}

/** 角色由 live 决定；原生的 title 属性（悬停提示）让给标题 */
export type BannerManaged = 'role' | 'title';

/** 未声明的属性落到外层 div 上 */
export interface BannerProps extends PartProps<'div', BannerManaged> {
  /** 色调，默认 info */
  tone?: StatusTone;
  /** 样式，默认 soft */
  variant?: keyof BannerVariants;
  /** 字号档位，默认继承上下文字号 */
  size?: TextSize;
  /** 加粗的开头（“系统维护”），与正文在同一行 */
  title?: VNodeChild;
  /** 图标；不写时按色调选，false 不显示 */
  icon?: IconData | false;
  /** 正文后的操作（链接或小按钮） */
  action?: VNodeChild;
  /** 读屏播报方式，默认 off（同 Alert） */
  live?: keyof AlertLives;
  /** 给了就显示关闭按钮：先离场，离场结束再调用；使用方没移除时重新出现 */
  onClose?: () => void;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 文字区的部件属性 */
  propsContent?: PartProps<'div'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'strong'>;
  /** 操作区的部件属性 */
  propsAction?: PartProps<'div'>;
  /** 关闭按钮的部件属性 */
  propsClose?: Partial<PresetIconButtonProps>;
  /** 正文 */
  children?: VNodeChild;
}

/** Banner 的样式：root、icon、content、title、action、close */
export const bannerStyles = css.create({
  // 内容居中、一行说完；窄屏时换行。关闭按钮贴在结束边，不参与居中
  root: {
    boxSizing: 'border-box',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: '_sm',
    rowGap: '_xs',
    width: '100%',
    paddingBlock: '_sm',
    paddingInlineStart: '_lg',
    paddingInlineEnd: `calc(${t.space.lg} + 2em)`,
    lineHeight: '_normal',
    textAlign: 'center',
  },
  // 没有关闭按钮时两边留白一样
  balanced: { paddingInlineEnd: '_lg' },
  icon: { flexShrink: 0 },
  content: { minWidth: 0 },
  title: { fontWeight: '_semibold', marginInlineEnd: '_sm' },
  action: { flexShrink: 0, fontWeight: '_medium' },
  close: {
    position: 'absolute',
    insetInlineEnd: '_sm',
    insetBlockStart: '50%',
    translate: '0 -50%',
    color: 'inherit',
  },
});

const ROLES = { off: undefined, polite: 'status', assertive: 'alert' } as const;

/** 横幅：一行通栏通知，内容居中，可以关闭 */
export const Banner = _component(
  ({
    tone = 'info',
    variant = 'soft',
    size,
    title,
    icon,
    action,
    live = 'off',
    onClose,
    propsIcon,
    propsContent,
    propsTitle,
    propsAction,
    propsClose,
    children,
    ...rest
  }: BannerProps) => {
    // 离场结束才交给使用方移除；使用方没移除时横幅重新出现
    const dismissible = useDismissible(() => onClose?.());
    return () => {
      const shownIcon = icon === false ? undefined : (icon ?? statusIcons[tone]);
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                bannerStyles.root,
                !onClose && bannerStyles.balanced,
                presenceStyles.fade,
                statusToneSx(variant, tone),
                size && fontSizeStyles[size],
                dismissible.dismissing && presenceStyles.leaving,
              ],
            },
            rest,
            { ref: dismissible.ref, role: ROLES[live] },
          )}
          data-tone={tone}
          data-state={dismissible.state}
        >
          {shownIcon && (
            <Icon
              {...mergePartProps<IconProps>({ icon: shownIcon, sx: bannerStyles.icon }, propsIcon)}
            />
          )}
          <div {...mergeAttrs<'div'>({ sx: bannerStyles.content }, propsContent)}>
            {hasContent(title) && (
              <strong {...mergeAttrs<'strong'>({ sx: bannerStyles.title }, propsTitle)}>
                {title}
              </strong>
            )}
            {children}
          </div>
          {hasContent(action) && (
            <div {...mergeAttrs<'div'>({ sx: bannerStyles.action }, propsAction)}>{action}</div>
          )}
          {onClose && (
            <CloseButton
              {...mergeProps<PresetIconButtonProps>(
                { sx: [bannerStyles.close, relativeFontSizeStyles.sm] },
                propsClose,
                { onClick: dismissible.dismiss },
              )}
            />
          )}
        </div>
      );
    };
  },
);
