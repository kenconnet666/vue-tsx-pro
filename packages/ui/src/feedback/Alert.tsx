/**
 * 提示条（div）：页面或区块里的说明、成功、警告、错误信息。图标按色调自动选（Lucide），可以换或去掉；可以关闭。
 *
 *   <Alert tone="warning" title="即将过期">你的订阅将在 3 天后到期。</Alert>
 *   <Alert tone="danger" live="assertive" onClose={dismiss}>保存失败，请重试</Alert>
 *
 * 页面加载时就在的提示不需要读屏打断；操作后才出现的用 live 让读屏播报。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { CloseButton, type PresetIconButtonProps } from '../base/CloseButton';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useDefaults } from '../config/defaults';
import { focusAfterRemoval } from '../utils/overlay';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { statusIcons, statusToneSx, type StatusTone } from '../utils/tone-styles';

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
}

/** 角色由 live 决定；原生的 title 属性（悬停提示）让给标题 */
type Managed = 'role' | 'title';

/** 未声明的属性落到外层 div 上 */
export interface AlertProps extends PartProps<'div', Managed>, AlertOptions {
  /** 色调，默认 info */
  tone?: StatusTone;
  /** 标题（加粗的第一行） */
  title?: VNodeChild;
  /** 图标；不写时按色调选，false 不显示 */
  icon?: IconData | false;
  /** 读屏播报方式，默认 off */
  live?: keyof AlertLives;
  /** 右侧的操作（如“重试”按钮） */
  action?: VNodeChild;
  /** 给了就显示关闭按钮，点击时调用；提示条随后被移除时，焦点交给相邻的可聚焦元素 */
  onClose?: () => void;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 文字区（标题与正文的容器）的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 正文（标题下面的内容）的部件属性 */
  propsDescription?: PartProps<'div'>;
  /** 操作区的部件属性 */
  propsAction?: PartProps<'div'>;
  /** 关闭按钮的部件属性 */
  propsClose?: Partial<PresetIconButtonProps>;
  children?: VNodeChild;
}

const styles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '_sm',
    padding: '_md',
    borderRadius: '_md',
    lineHeight: '_normal',
  },
  // 图标与第一行文字对齐：行高 1.5em 里居中 1em 的图标
  icon: { flexShrink: 0, marginBlock: '0.25em' },
  body: { flexGrow: 1, minWidth: 0, display: 'grid', gap: '_xs' },
  title: { fontWeight: '_semibold' },
  description: { color: '_text' },
  action: { flexShrink: 0, alignSelf: 'center' },
  close: { flexShrink: 0, marginBlock: 'calc(-1 * _space.xs)', color: 'inherit' },
});

const ROLES = { off: undefined, polite: 'status', assertive: 'alert' } as const;

/** 提示条：图标 + 标题 + 正文 + 操作 + 关闭 */
export const Alert = _component(
  ({
    variant,
    tone = 'info',
    title,
    icon,
    live = 'off',
    action,
    onClose,
    propsIcon,
    propsBody,
    propsTitle,
    propsDescription,
    propsAction,
    propsClose,
    children,
    ...rest
  }: AlertProps) => {
    const defaults = useDefaults('Alert');
    return () => {
      const shownIcon = icon === false ? undefined : (icon ?? statusIcons[tone]);
      return (
        <div
          {...elementProps(
            mergeProps<'div'>(
              { sx: [styles.root, statusToneSx(variant ?? defaults.variant ?? 'soft', tone)] },
              rest,
              { role: ROLES[live] },
            ),
          )}
          data-tone={tone}
        >
          {shownIcon && (
            <Icon {...mergePartProps<IconProps>({ icon: shownIcon, sx: styles.icon }, propsIcon)} />
          )}
          <div {...elementProps(mergeProps<'div'>({ sx: styles.body }, propsBody))}>
            {title != null && (
              <div {...elementProps(mergeProps<'div'>({ sx: styles.title }, propsTitle))}>
                {title}
              </div>
            )}
            {children != null && (
              <div
                {...elementProps(mergeProps<'div'>({ sx: styles.description }, propsDescription))}
              >
                {children}
              </div>
            )}
          </div>
          {action != null && (
            <div {...elementProps(mergeProps<'div'>({ sx: styles.action }, propsAction))}>
              {action}
            </div>
          )}
          {onClose && (
            <CloseButton
              {...mergeProps<PresetIconButtonProps>({ sx: styles.close, size: 'sm' }, propsClose, {
                onClick: (event: MouseEvent) => {
                  focusAfterRemoval((event.currentTarget as HTMLElement).parentElement!);
                  onClose();
                },
              })}
            />
          )}
        </div>
      );
    };
  },
);
