/**
 * 结果页：操作完成后的整块反馈（提交成功、支付失败、权限不足）。大图标（挂载时一笔画出）+ 标题 + 说明 + 操作，居中排列。
 *
 *   <Result status="success" title="提交成功" description="审核结果会通过邮件通知你。" action={<Button>返回列表</Button>} />
 *   <Result status="danger" title="支付失败" action={<Button onClick={retry}>重试</Button>}>{details}</Result>
 *
 * 只是展示，不带角色；操作后才出现、需要读屏播报时，由所在区域用 aria-live 或把焦点移到标题上。
 * 部件：Root（div）、Icon、Title（Text）、Description（Paragraph）、Action（div）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon/Icon';
import { Paragraph, Text, type TextProps } from '../base/Text';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { statusIcons } from '../utils/style/tone-styles';
import { fontSizeStyles, toneStyles, type TextSize } from '../utils/style/typography';

/** 结果的状态：决定图标与颜色 */
export interface ResultStatuses {
  /** 成功（默认）：对勾 */
  success: unknown;
  /** 失败：感叹号 */
  danger: unknown;
  /** 警告：三角感叹号 */
  warning: unknown;
  /** 信息：i */
  info: unknown;
}

/** 未声明的属性落到外层 div 上；原生的 title 属性（悬停提示）让给标题 */
export interface ResultProps extends PartProps<'div', 'title'> {
  /** 状态，默认 success */
  status?: keyof ResultStatuses;
  /** 图标；不写时按状态选，false 不显示 */
  icon?: IconData | false;
  /** 挂载时描线画出图标，默认 true；减少动态效果时直接画好 */
  draw?: boolean;
  /** 标题 */
  title?: VNodeChild;
  /** 说明 */
  description?: VNodeChild;
  /** 操作（如“返回”“重试”按钮） */
  action?: VNodeChild;
  /** 字号档位，内部尺寸随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 标题的部件属性 */
  propsTitle?: Partial<TextProps>;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps>;
  /** 操作区的部件属性 */
  propsAction?: PartProps<'div'>;
  /** 说明之后的内容（如错误详情） */
  children?: VNodeChild;
}

/** Result 的样式：root、icon、title、description、action */
export const resultStyles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '_sm',
    paddingBlock: '_xl',
    paddingInline: '_lg',
    textAlign: 'center',
    color: '_text',
  },
  icon: { width: '4em', height: '4em', marginBlockEnd: '_sm', strokeWidth: '_sm' },
  title: { fontSize: '_xl', fontWeight: '_semibold', lineHeight: '_tight' },
  description: { maxWidth: '36em', color: '_textMuted' },
  action: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '_sm',
    marginBlockStart: '_md',
  },
});

/** 结果页：状态图标、标题、说明、操作，居中排列 */
export const Result = _component(
  ({
    status = 'success',
    icon,
    draw = true,
    title,
    description,
    action,
    size,
    propsIcon,
    propsTitle,
    propsDescription,
    propsAction,
    children,
    ...rest
  }: ResultProps) =>
    () => (
      <div
        {...mergeAttrs<'div'>({ sx: [resultStyles.root, size && fontSizeStyles[size]] }, rest)}
        data-status={status}
      >
        {icon !== false && (
          <Icon
            {...mergePartProps<IconProps>(
              {
                icon: icon ?? statusIcons[status],
                draw,
                sx: [resultStyles.icon, toneStyles[status]],
              },
              propsIcon,
            )}
          />
        )}
        {title != null && (
          <Text {...mergePartProps<TextProps>({ sx: resultStyles.title }, propsTitle)}>
            {title}
          </Text>
        )}
        {description != null && (
          <Paragraph
            {...mergePartProps<TextProps>({ sx: resultStyles.description }, propsDescription)}
          >
            {description}
          </Paragraph>
        )}
        {children}
        {action != null && (
          <div {...mergeAttrs<'div'>({ sx: resultStyles.action }, propsAction)}>{action}</div>
        )}
      </div>
    ),
);
