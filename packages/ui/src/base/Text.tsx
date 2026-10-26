/**
 * 正文文字：字号、字重、色调、对齐、截断。一个元素一个组件（COMPONENTS.md §1），由同一个工厂生成：
 *   Text（span）、Paragraph（p）、Strong（strong）、Em（em）、Small（small）。
 * 不写的属性都继承上下文；Paragraph、Strong、Small 各有自己的默认值。表单标签以后由 Label 组件负责。
 *
 *   <Text tone="muted" size="sm">更新于 3 分钟前</Text>
 *   <Paragraph lineClamp={2}>很长的描述…</Paragraph>
 *   <Text mono size="sm">PO-2026-0187</Text>         编号、件号：等宽字体
 *   <Text numeric tone="danger">超时 3 天</Text>       金额、计数：等宽数字，上下对齐
 */
import { _component, type TsxComponent } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
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
  type Tone,
} from '../utils/style/typography';

/** 文字组件可用的标签 */
export type TextTag = 'span' | 'p' | 'strong' | 'em' | 'small';

/** 文字的样式选项，五个文字组件共用 */
export interface TextOptions {
  /** 字号档位，对应主题的 fontSizes；不写时继承（Small 默认 xs） */
  size?: TextSize;
  /** 字重，对应主题的 fontWeights；不写时继承（Strong 默认 semibold） */
  weight?: FontWeight;
  /** 色调：muted 次要说明，其余为品牌色与提示色的文字色；不写时继承 */
  tone?: Tone;
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

/** Text 系列 的样式：paragraph */
export const textComponentStyles = css.create({
  // 段落之间的距离交给布局（Flex 的 gap），与标题一致
  paragraph: { margin: 0 },
});

/** 生成文字组件：标签、组件名与默认的字号、字重、换行（Text、Paragraph、Strong、Em、Small 由它生成） */
export function createText<Tag extends TextTag>(
  tag: Tag,
  name: string,
  defaults: Pick<TextOptions, 'size' | 'weight' | 'wrap'> = {},
): TsxComponent<TextProps<Tag>> {
  // 实现按五种标签共有的属性写，对外每个组件只接受自己元素的属性
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
          tag === 'p' && textComponentStyles.paragraph,
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
