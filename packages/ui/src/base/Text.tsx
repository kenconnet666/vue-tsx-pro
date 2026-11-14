/**
 * 正文文字：字号、字重、色调、对齐、截断。一个元素一个组件（COMPONENTS.md §1），由同一个工厂生成：
 *   Text（span）、Paragraph（p）、Strong（strong）、Em（em）、Small（small）、
 *   Sub（sub）、Sup（sup）、Del（del）、Ins（ins）、Strike（s）。
 * 不写的属性都继承上下文；Paragraph、Strong、Small 各有自己的默认值。表单标签以后由 Label 组件负责。
 *
 *   <Text tone="muted" size="sm">更新于 3 分钟前</Text>
 *   <Paragraph lineClamp={2}>很长的描述…</Paragraph>
 *   <Text mono size="sm">PO-2026-0187</Text>         编号、件号：等宽字体
 *   <Text numeric tone="danger">超时 3 天</Text>       金额、计数：等宽数字，上下对齐
 *   面积 86 m<Sup>2</Sup>，H<Sub>2</Sub>O              上下标不撑高所在的行
 *   <Strike>¥199</Strike> ¥149                        不再有效的内容（原价）；文档的增删用 Del、Ins
 */
import { _component, type TsxComponent } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css, type SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  fontSizeStyles,
  fontWeightStyles,
  lineClampStyles,
  textAlignStyles,
  textStyles,
  textWrapStyles,
  toneStyles,
  type FontWeight,
  type TextAlign,
  type TextSize,
  type TextWrap,
  type TextTone,
} from '../utils/style/typography';

/** 文字组件可用的标签 */
export type TextTag =
  'span' | 'p' | 'strong' | 'em' | 'small' | 'sub' | 'sup' | 'del' | 'ins' | 's';

/** 文字的样式选项，各文字组件共用 */
export interface TextOptions {
  /** 字号档位，对应主题的 fontSizes；不写时继承（Small 默认 xs） */
  size?: TextSize;
  /** 字重，对应主题的 fontWeights；不写时继承（Strong 默认 semibold） */
  weight?: FontWeight;
  /** 色调：muted 次要说明，其余为品牌色与提示色的文字色；不写时继承 */
  tone?: TextTone;
  /** 水平对齐，不写时继承（只在块级元素上有效，如 Paragraph） */
  align?: TextAlign;
  /** 单行省略（在块级元素或 flex 子项上生效） */
  truncate?: boolean;
  /** 最多显示几行，超出省略 */
  lineClamp?: number;
  /** 换行方式：pretty 避免最后一行只剩一个字（Paragraph 默认 pretty） */
  wrap?: TextWrap;
  /** 数字等宽（tabular-nums）：金额、计数、日期，上下对齐、变化时不跳动 */
  numeric?: boolean;
  /** 等宽字体：编号、件号、代码片段 */
  mono?: boolean;
  children?: VNodeChild;
}

/** 未声明的属性落到对应元素上：Text 为 span，Paragraph 为 p，以此类推 */
export type TextProps<Tag extends TextTag = 'span'> = PartProps<Tag> & TextOptions;

/** Text 系列 的样式：paragraph、script、sub、sup、del、ins、strike */
const textComponentStyles = css.create({
  // 段落之间的距离交给布局（Flex 的 gap），与标题一致
  paragraph: { margin: 0 },
  // 上下标：浏览器默认的 vertical-align: sub / super 会把所在的行撑高，行距忽大忽小。
  // 改成不占行高、相对基线挪位置（normalize.css 的做法）
  script: { position: 'relative', fontSize: '0.75em', lineHeight: 0, verticalAlign: 'baseline' },
  sub: { bottom: '-0.25em' },
  sup: { top: '-0.5em' },
  // 删掉的内容：划线、次要色；加进来的内容：浅绿底（浏览器默认的下划线和链接分不清）
  del: { color: '_textMuted', textDecorationLine: 'line-through' },
  ins: {
    paddingInline: '0.15em',
    borderRadius: '_xs',
    backgroundColor: '_successSoft',
    textDecorationLine: 'none',
  },
  strike: { textDecorationLine: 'line-through' },
});

/** 各标签自带的样式（排在各项属性的样式之前，属性可以盖过） */
const tagStyles: Partial<Record<TextTag, SxStyles>> = {
  p: textComponentStyles.paragraph,
  sub: [textComponentStyles.script, textComponentStyles.sub],
  sup: [textComponentStyles.script, textComponentStyles.sup],
  del: textComponentStyles.del,
  ins: textComponentStyles.ins,
  s: textComponentStyles.strike,
};

/** 生成文字组件：标签、组件名与默认的字号、字重、换行（Text、Paragraph、Strong、Em、Small 等由它生成） */
export function createText<Tag extends TextTag>(
  tag: Tag,
  name: string,
  defaults: Pick<TextOptions, 'size' | 'weight' | 'wrap'> = {},
): TsxComponent<TextProps<Tag>> {
  // 实现按各标签共有的属性写，对外每个组件只接受自己元素的属性
  return _component(
    ({
      size = defaults.size,
      weight = defaults.weight,
      tone,
      align,
      truncate = false,
      lineClamp,
      wrap = defaults.wrap,
      numeric = false,
      mono = false,
      children,
      ...rest
    }: TextProps<TextTag>) =>
      () => {
        const Tag = tag as TextTag;
        const sx = [
          tagStyles[tag],
          size && fontSizeStyles[size],
          weight && fontWeightStyles[weight],
          tone && toneStyles[tone],
          align && textAlignStyles[align],
          wrap && textWrapStyles[wrap],
          truncate && textStyles.truncate,
          lineClamp != null && [textStyles.clamp, lineClampStyles.lines(lineClamp)],
          numeric && textStyles.numeric,
          mono && textStyles.mono,
        ];
        return <Tag {...mergeAttrs<TextTag>({ sx }, rest)}>{children}</Tag>;
      },
    { name },
  ) as unknown as TsxComponent<TextProps<Tag>>;
}

/** 行内文字（span）：不加任何默认样式，全部继承上下文 */
export const Text = createText('span', 'Text');
/** 段落（p）：去掉浏览器默认外边距（间距交给布局），换行默认 pretty */
export const Paragraph = createText('p', 'Paragraph', { wrap: 'pretty' });
/** 重要的内容（strong）：读屏可能加重语气；默认字重 semibold */
export const Strong = createText('strong', 'Strong', { weight: 'semibold' });
/** 语气上的强调（em）：浏览器默认斜体 */
export const Em = createText('em', 'Em');
/** 附注、版权、细则（small）：默认字号 xs */
export const Small = createText('small', 'Small', { size: 'xs' });
/** 下标（sub）：化学式、变量的下标；不撑高所在的行 */
export const Sub = createText('sub', 'Sub');
/** 上标（sup）：单位的幂、脚注的编号；不撑高所在的行 */
export const Sup = createText('sup', 'Sup');
/** 文档里删掉的内容（del）：划线、次要色；cite、datetime 这些原生属性照常可用 */
export const Del = createText('del', 'Del');
/** 文档里加进来的内容（ins）：浅绿底，不用下划线（和链接分不清） */
export const Ins = createText('ins', 'Ins');
/** 不再准确、不再有效的内容（s）：原价、过期的说明；文档的增删用 Del、Ins */
export const Strike = createText('s', 'Strike');
