/**
 * 提示条（div）：页面或区块里的说明、成功、警告、错误信息。图标按色调自动选（Lucide），可以换或去掉；可以关闭。
 *
 *   <Alert tone="warning" title="即将过期">你的订阅将在 3 天后到期。</Alert>
 *   <Alert tone="danger" live="assertive" onClose={dismiss}>保存失败，请重试</Alert>
 *   <Alert tone="info" title="导入完成" description="成功 120 条，失败 3 条。"><Link href="#log">查看失败原因</Link></Alert>
 *
 * 说明写在 description 或 children 上（同 Empty、Result 的 description）；两个都给时 children 是说明下面的额外内容。
 *
 * 页面加载时就在的提示不需要读屏打断；操作后才出现的用 live 让读屏播报。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { CloseButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { Spinner, type SpinnerProps } from '../base/Spinner';
import { useDefaults } from '../config/defaults';
import { useDismissible } from '../utils/motion/presence';
import { hasContent, mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { statusIcons, statusToneSx, type StatusTone } from '../utils/style/tone-styles';
import { presenceStyles } from '../utils/style/transitions';
import { fontSizeStyles, relativeFontSizeStyles, type TextSize } from '../utils/style/typography';
import { radiusStyles, type Radius } from '../utils/style/styles';
import { t } from '../config/theme/tokens';

/** 提示条的样式（实底不用于大块文字，不提供） */
export interface AlertVariants {
  /** 浅色底（默认） */
  soft: unknown;
  /** 浅色底加描边 */
  surface: unknown;
  /** 只有描边 */
  outline: unknown;
}

/** 读屏怎样播报出现的提示 */
export interface AlertLives {
  /** 不主动播报（默认）：页面加载时就在的提示 */
  off: unknown;
  /** 礼貌播报（role="status"）：等读屏念完当前内容再念，如“已保存” */
  polite: unknown;
  /** 立即播报（role="alert"）：打断当前朗读，只用于错误等紧急信息 */
  assertive: unknown;
}

/** 提示条的外观选项；可以用 createUi / Provider 的 defaults.Alert 统一改默认值 */
export interface AlertOptions {
  /** 样式，默认 soft */
  variant?: keyof AlertVariants;
  /** 圆角，默认 md；贴着页面顶部的通栏写 none */
  radius?: Radius;
}

/** 角色由 live 决定，忙碌由 loading 决定；原生的 title 属性（悬停提示）让给标题 */
export type AlertManaged = 'role' | 'title' | 'aria-busy';

/** 未声明的属性落到外层 div 上 */
export interface AlertProps extends PartProps<'div', AlertManaged>, AlertOptions {
  /** 色调，默认 info */
  tone?: StatusTone;
  /** 字号档位：图标、内边距随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 标题（加粗的第一行） */
  title?: VNodeChild;
  /** 说明（标题下面的正文）；不写时 children 就是说明 */
  description?: VNodeChild;
  /** 图标；不写时按色调选，false 不显示 */
  icon?: IconData | false;
  /** 进行中（如“正在上传”）：图标换成加载指示，带 aria-busy */
  loading?: boolean;
  /** 读屏播报方式，默认 off */
  live?: keyof AlertLives;
  /** 右侧的操作（如“重试”按钮） */
  action?: VNodeChild;
  /** 给了就显示关闭按钮：点击后提示条先淡出，离场结束再调用；提示条随后被移除时，焦点交给相邻的可聚焦元素；没被移除就重新显示 */
  onClose?: () => void;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 加载指示（loading 时代替图标）的部件属性 */
  propsSpinner?: Partial<SpinnerProps>;
  /** 文字区（标题与正文的容器）的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 说明（标题下面的正文）的部件属性 */
  propsDescription?: PartProps<'div'>;
  /** 额外内容（同时给了 description 与 children 时的 children）的部件属性 */
  propsContent?: PartProps<'div'>;
  /** 操作区的部件属性 */
  propsAction?: PartProps<'div'>;
  /** 关闭按钮的部件属性 */
  propsClose?: Partial<PresetIconButtonProps>;
  children?: VNodeChild;
}

/** Alert 的样式：root、icon、body、title、description、content、action、close */
export const alertStyles = css.create({
  // 进场与离场的淡入淡出用 presenceStyles
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '_sm',
    padding: '_md',
    lineHeight: '_normal',
  },
  // 图标与第一行文字对齐：行高 1.5em 里居中 1em 的图标
  icon: { flexShrink: 0, marginBlock: '0.25em' },
  body: { flexGrow: 1, minWidth: 0, display: 'grid', gap: '_xs' },
  title: { fontWeight: '_semibold' },
  description: { color: '_text' },
  content: { minWidth: 0 },
  action: { flexShrink: 0, alignSelf: 'center' },
  close: { flexShrink: 0, marginBlock: `calc(-1 * ${t.space.xs})`, color: 'inherit' },
});

const ROLES = { off: undefined, polite: 'status', assertive: 'alert' } as const;

/** 提示条：图标 + 标题 + 正文 + 操作 + 关闭 */
export const Alert = _component(
  ({
    variant,
    radius,
    tone = 'info',
    size,
    title,
    description,
    icon,
    loading = false,
    live = 'off',
    action,
    onClose,
    propsIcon,
    propsSpinner,
    propsBody,
    propsTitle,
    propsDescription,
    propsContent,
    propsAction,
    propsClose,
    children,
    ...rest
  }: AlertProps) => {
    const appearance = useDefaults('Alert', () => ({ variant, radius }), {
      variant: 'soft',
      radius: 'md',
    });
    // 离场结束才交给使用方移除；使用方没移除时提示条重新出现
    const dismissible = useDismissible(() => onClose?.());
    return () => {
      const shownIcon = icon === false ? undefined : (icon ?? statusIcons[tone]);
      // 说明取 description，没有时取 children；两个都有时 children 放在说明下面
      const extra = hasContent(description) && hasContent(children);
      const text = hasContent(description) ? description : children;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                alertStyles.root,
                presenceStyles.fade,
                statusToneSx(appearance().variant, tone),
                radiusStyles[appearance().radius],
                size && fontSizeStyles[size],
                dismissible.dismissing && presenceStyles.leaving,
              ],
            },
            rest,
            { ref: dismissible.ref, role: ROLES[live], 'aria-busy': loading || undefined },
          )}
          data-tone={tone}
          data-state={dismissible.state}
        >
          {loading ? (
            <Spinner {...mergePartProps<SpinnerProps>({ sx: alertStyles.icon }, propsSpinner)} />
          ) : (
            shownIcon && (
              <Icon
                {...mergePartProps<IconProps>({ icon: shownIcon, sx: alertStyles.icon }, propsIcon)}
              />
            )
          )}
          <div {...mergeAttrs<'div'>({ sx: alertStyles.body }, propsBody)}>
            {hasContent(title) && (
              <div {...mergeAttrs<'div'>({ sx: alertStyles.title }, propsTitle)}>{title}</div>
            )}
            {hasContent(text) && (
              <div {...mergeAttrs<'div'>({ sx: alertStyles.description }, propsDescription)}>
                {text}
              </div>
            )}
            {extra && (
              <div {...mergeAttrs<'div'>({ sx: alertStyles.content }, propsContent)}>
                {children}
              </div>
            )}
          </div>
          {hasContent(action) && (
            <div {...mergeAttrs<'div'>({ sx: alertStyles.action }, propsAction)}>{action}</div>
          )}
          {onClose && (
            <CloseButton
              {...mergeProps<PresetIconButtonProps>(
                { sx: [alertStyles.close, relativeFontSizeStyles.sm] },
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
