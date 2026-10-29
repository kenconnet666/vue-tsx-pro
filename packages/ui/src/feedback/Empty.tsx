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
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { Paragraph, Text, type TextProps } from '../base/Text';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

/** Empty 的外观选项：可以在 ComponentDefaults 里统一设置 */
export interface EmptyOptions {
  /** 字号档位，内部尺寸随之缩放；放在下拉框、小卡片里用 sm。不写时继承上下文字号 */
  size?: TextSize;
}

/** 未声明的属性落到外层 div 上；原生的 title 属性（悬停提示）让给标题 */
export interface EmptyProps extends PartProps<'div', 'title'>, EmptyOptions {
  /** 图标，默认 Lucide 的 Inbox；false 不显示 */
  icon?: IconData | false;
  /** 标题 */
  title?: VNodeChild;
  /** 说明 */
  description?: VNodeChild;
  /** 操作（如“新建”按钮） */
  action?: VNodeChild;
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

/** 空状态的配方：各部件的布局与颜色；字号档位用共用的 fontSizeStyles 另外叠加 */
export const emptyRecipe = css.recipe({
  name: 'Empty',
  parts: ['root', 'icon', 'title', 'description', 'action'],
  base: {
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
  },
});

/** 空状态的部件（createUi / Provider 的 styles.Empty 按它定制） */
export type EmptyPart = (typeof emptyRecipe.parts)[number];

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
  }: EmptyProps) => {
    const appearance = useDefaults('Empty', () => ({ size }));
    const recipe = useRecipe(emptyRecipe);
    return () => {
      const textSize = appearance().size;
      const s = recipe();
      return (
        <div
          {...mergeAttrs<'div'>(
            { ...s.root, sx: [s.root.sx, textSize && fontSizeStyles[textSize]] },
            rest,
          )}
        >
          {icon !== false && (
            <Icon {...mergePartProps<IconProps>({ ...s.icon, icon: icon ?? Inbox }, propsIcon)} />
          )}
          {hasContent(title) && (
            <Text {...mergePartProps<TextProps>(s.title, propsTitle)}>{title}</Text>
          )}
          {hasContent(description) && (
            <Paragraph {...mergePartProps<TextProps>(s.description, propsDescription)}>
              {description}
            </Paragraph>
          )}
          {children}
          {hasContent(action) && <div {...mergeAttrs<'div'>(s.action, propsAction)}>{action}</div>}
        </div>
      );
    };
  },
);
