/**
 * 正文文字：字号、字重、色调、对齐、截断。不写的属性都继承上下文。
 *
 *   <Text tone="muted" size="sm">更新于 3 分钟前</Text>
 *   <Text as="p" lineClamp={2}>很长的描述…</Text>
 */
import { _component } from '@vue-tsx-pro/tsx';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type AsProps } from '../utils/props';
import type { Size } from '../utils/styles';
import {
  fontSizeStyles,
  fontWeightStyles,
  lineClampStyles,
  textAlignStyles,
  textStyles,
  textWrapStyles,
  toneStyles,
  type FontWeight,
  type Tone,
} from '../utils/typography';

type Tags = 'span' | 'p' | 'div' | 'label' | 'strong' | 'em' | 'small';

export interface TextProps extends AsProps<Tags> {
  /** 字号档位，对应主题的 fontSizes；不写时继承 */
  size?: Size;
  weight?: FontWeight;
  /** 色调：muted 次要说明，其余为品牌色与提示色的文字色；不写时继承 */
  tone?: Tone;
  align?: 'start' | 'center' | 'end';
  /** 单行省略（在块级元素或 flex 子项上生效） */
  truncate?: boolean;
  /** 最多显示几行，超出省略 */
  lineClamp?: number;
  /** 换行方式：pretty 避免最后一行只剩一个字 */
  wrap?: 'wrap' | 'nowrap' | 'balance' | 'pretty';
  children?: VNodeChild;
}

export const Text = _component(
  ({
    as = 'span',
    size,
    weight,
    tone,
    align,
    truncate = false,
    lineClamp,
    wrap,
    children,
    ...rest
  }: TextProps) =>
    () => {
      const Tag = as;
      const sx = [
        size && fontSizeStyles[size],
        weight && fontWeightStyles[weight],
        tone && toneStyles[tone],
        align && textAlignStyles[align],
        wrap && textWrapStyles[wrap],
        truncate && textStyles.truncate,
        lineClamp != null && [textStyles.clamp, lineClampStyles.lines(lineClamp)],
      ];
      return <Tag {...elementProps(mergeProps<Tags>({ sx }, rest))}>{children}</Tag>;
    },
);
