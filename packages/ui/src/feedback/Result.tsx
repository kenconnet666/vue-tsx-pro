/**
 * 结果页：操作完成后的整块反馈（提交成功、支付失败、权限不足）。大图标（挂载时一笔画出）+ 标题 + 说明 + 操作，居中排列。
 *
 *   <Result tone="success" title="提交成功" description="审核结果会通过邮件通知你。" action={<Button>返回列表</Button>} />
 *   <Result tone="danger" title="支付失败" action={<Button onClick={retry}>重试</Button>}>{details}</Result>
 *   <Result status="404" action={<LinkButton href="/">回到首页</LinkButton>} />   常见状态：图标、色调、标题与说明都有默认值
 *
 * 只是展示，不带角色；操作后才出现、需要读屏播报时，由所在区域用 aria-live 或把焦点移到标题上。
 * 部件：Root（div）、Icon、Code（状态码，status 时）、Title（Text）、Description（Paragraph）、Action（div）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { FileQuestionMark, ServerCrash, ShieldX } from '@lucide/icons';
import type { VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useLang } from '../config/context';
import { Paragraph, Text, type TextProps } from '../base/Text';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { statusIcons } from '../utils/style/tone-styles';
import {
  fontSizeStyles,
  relativeFontSizeStyles,
  toneStyles,
  type TextSize,
} from '../utils/style/typography';

/** 结果的色调：决定图标与颜色（与 Alert、Toast 的色调同名） */
export interface ResultTones {
  /** 成功（默认）：对勾 */
  success: unknown;
  /** 失败：感叹号 */
  danger: unknown;
  /** 警告：三角感叹号 */
  warning: unknown;
  /** 信息：i */
  info: unknown;
}

/** 常见的出错状态：图标、色调、标题与说明都有默认值（标题与说明取语言包） */
export interface ResultStatuses {
  /** 没有权限 */
  403: unknown;
  /** 找不到页面 */
  404: unknown;
  /** 服务出错 */
  500: unknown;
}

/** 各状态的图标与色调 */
const STATUS_LOOKS: Record<keyof ResultStatuses, { icon: IconData; tone: keyof ResultTones }> = {
  403: { icon: ShieldX, tone: 'warning' },
  404: { icon: FileQuestionMark, tone: 'info' },
  500: { icon: ServerCrash, tone: 'danger' },
};

/** Result 的外观选项：可以在 ComponentDefaults 里统一设置 */
export interface ResultOptions {
  /** 字号档位，内部尺寸随之缩放；不写时继承上下文字号 */
  size?: TextSize;
}

/** 未声明的属性落到外层 div 上；原生的 title 属性（悬停提示）让给标题 */
export interface ResultProps extends PartProps<'div', 'title'>, ResultOptions {
  /** 常见状态（403、404、500）：给出图标、色调、状态码与默认的标题、说明，显式写的优先 */
  status?: `${keyof ResultStatuses}`;
  /** 色调，默认 success（写了 status 时按状态） */
  tone?: keyof ResultTones;
  /** 图标；不写时按色调选，false 不显示 */
  icon?: IconData | false;
  /** 挂载时描线画出图标，默认 true；减少动态效果时直接画好 */
  draw?: boolean;
  /** 标题 */
  title?: VNodeChild;
  /** 说明 */
  description?: VNodeChild;
  /** 操作（如“返回”“重试”按钮） */
  action?: VNodeChild;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 状态码的部件属性 */
  propsCode?: Partial<TextProps>;
  /** 标题的部件属性 */
  propsTitle?: Partial<TextProps>;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps>;
  /** 操作区的部件属性 */
  propsAction?: PartProps<'div'>;
  /** 说明之后的内容（如错误详情） */
  children?: VNodeChild;
}

/**
 * 结果页的配方：各部件的布局与颜色。图标的色调用共用的 toneStyles，排在配方之前，
 * createUi / Provider 的 styles.Result 能盖过它；字号档位用共用的 fontSizeStyles 另外叠加
 */
export const resultRecipe = css.recipe({
  name: 'Result',
  parts: ['root', 'icon', 'code', 'title', 'description', 'action'],
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
    icon: { width: '4em', height: '4em', marginBlockEnd: '_sm', strokeWidth: '_sm' },
    // 状态码：大号（随字号缩放）、次要颜色、等宽数字，压在标题上方
    code: {
      fontSize: '2.5em',
      fontWeight: '_bold',
      lineHeight: 1,
      color: '_textMuted',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '_tight',
    },
    title: { fontWeight: '_semibold', lineHeight: '_tight' },
    description: { maxWidth: '36em', color: '_textMuted' },
    action: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '_sm',
      marginBlockStart: '_md',
    },
  },
});

/** 结果页的部件（createUi / Provider 的 styles.Result 按它定制） */
export type ResultPart = (typeof resultRecipe.parts)[number];

/** 结果页：状态图标、标题、说明、操作，居中排列 */
export const Result = _component(
  ({
    status,
    tone,
    icon,
    draw = true,
    title,
    description,
    action,
    size,
    propsIcon,
    propsCode,
    propsTitle,
    propsDescription,
    propsAction,
    children,
    ...rest
  }: ResultProps) => {
    const lang = useLang();
    const appearance = useDefaults('Result', () => ({ size }));
    const recipe = useRecipe(resultRecipe);
    return () => {
      const textSize = appearance().size;
      const preset = status && STATUS_LOOKS[Number(status) as keyof ResultStatuses];
      const text = status && lang.resultStatus[status];
      const shownTone = tone ?? preset?.tone ?? 'success';
      const shownTitle = title ?? text?.title;
      const shownDescription = description ?? text?.description;
      const s = recipe({ tone: shownTone });
      return (
        <div
          {...mergeAttrs<'div'>(
            { ...s.root, sx: [s.root.sx, textSize && fontSizeStyles[textSize]] },
            rest,
          )}
          data-tone={shownTone}
        >
          {icon !== false && (
            <Icon
              {...mergePartProps<IconProps>(
                {
                  ...s.icon,
                  icon: icon ?? preset?.icon ?? statusIcons[shownTone],
                  draw,
                  sx: [toneStyles[shownTone], s.icon.sx],
                },
                propsIcon,
              )}
            />
          )}
          {status && (
            <Text
              {...mergePartProps<TextProps>(
                s.code,
                propsCode,
                // 标题已经说明了状态，状态码对读屏是重复的
                { 'aria-hidden': true },
              )}
            >
              {status}
            </Text>
          )}
          {hasContent(shownTitle) && (
            <Text
              {...mergePartProps<TextProps>(
                { ...s.title, sx: [s.title.sx, relativeFontSizeStyles.xl] },
                propsTitle,
              )}
            >
              {shownTitle}
            </Text>
          )}
          {hasContent(shownDescription) && (
            <Paragraph {...mergePartProps<TextProps>(s.description, propsDescription)}>
              {shownDescription}
            </Paragraph>
          )}
          {children}
          {hasContent(action) && <div {...mergeAttrs<'div'>(s.action, propsAction)}>{action}</div>}
        </div>
      );
    };
  },
);
