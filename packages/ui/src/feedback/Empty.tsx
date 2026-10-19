/**
 * 空状态：列表、表格、搜索结果、下拉选项没有内容时的说明。图标 + 标题 + 说明 + 操作，居中排列。
 *
 *   <Empty title="还没有订单" description="下单后会显示在这里。" action={<Button>去逛逛</Button>} />
 *   <Empty icon={SearchX} title="没有找到“{keyword}”" size="sm" />
 *
 * 只是展示，不带角色；搜索后才出现的空结果，由所在的列表或区域决定要不要用 aria-live 播报。
 * 部件：Root（div）、Icon、Title（Text）、Description（Paragraph）、Action（div）。
 */
import { Inbox } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { Paragraph, Text, type TextProps } from '../base/Text';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import type { StyleTable } from '../utils/style/styles';

/** 未声明的属性落到外层 div 上；原生的 title 属性（悬停提示）让给标题 */
export interface EmptyProps extends PartProps<'div', 'title'> {
  /** 图标，默认 Lucide 的 Inbox；false 不显示 */
  icon?: IconData | false;
  /** 标题 */
  title?: VNodeChild;
  /** 说明 */
  description?: VNodeChild;
  /** 操作（如“新建”按钮） */
  action?: VNodeChild;
  /** 字号档位，内部尺寸随之缩放；放在下拉框、小卡片里用 sm。不写时继承上下文字号 */
  size?: TextSize;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 标题的部件属性 */
  propsTitle?: Partial<TextProps>;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps>;
  /** 操作区的部件属性 */
  propsAction?: PartProps<'div'>;
  /** 标题与说明之外的内容 */
  children?: VNodeChild;
}

/** Empty 的样式：root、icon、title、description、action */
export const emptyStyles: StyleTable<'root' | 'icon' | 'title' | 'description' | 'action'> =
  stylex.create({
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
    icon: { width: '2.5em', height: '2.5em', color: '_textMuted', strokeWidth: '_sm' },
    title: { fontWeight: '_semibold' },
    description: { maxWidth: '32em', color: '_textMuted' },
    action: { marginBlockStart: '_sm' },
  });

/** 空状态：图标、标题、说明、操作，居中排列 */
export const Empty = _component(
  ({
    icon,
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
  }: EmptyProps) =>
    () => (
      <div
        {...elementProps(
          mergeProps<'div'>({ sx: [emptyStyles.root, size && fontSizeStyles[size]] }, rest),
        )}
      >
        {icon !== false && (
          <Icon
            {...mergePartProps<IconProps>({ icon: icon ?? Inbox, sx: emptyStyles.icon }, propsIcon)}
          />
        )}
        {title != null && (
          <Text {...mergePartProps<TextProps>({ sx: emptyStyles.title }, propsTitle)}>{title}</Text>
        )}
        {description != null && (
          <Paragraph
            {...mergePartProps<TextProps>({ sx: emptyStyles.description }, propsDescription)}
          >
            {description}
          </Paragraph>
        )}
        {children}
        {action != null && (
          <div {...elementProps(mergeProps<'div'>({ sx: emptyStyles.action }, propsAction))}>
            {action}
          </div>
        )}
      </div>
    ),
);
