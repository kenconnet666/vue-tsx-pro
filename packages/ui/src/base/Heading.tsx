/**
 * 标题：level 决定标签（h1–h6）与默认字号，size 可以单独改（视觉层级与文档结构分开）。
 * 紧凑行高、text-wrap: balance（各行长度均衡），大字号略收紧字间距；去掉浏览器默认的外边距，间距交给布局。
 *
 *   <Heading level={1}>订单详情</Heading>
 *   <Heading level={2} size="lg">收货地址</Heading>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import {
  fontSizeStyles,
  fontWeightStyles,
  textAlignStyles,
  textStyles,
  toneStyles,
  type FontSize,
  type FontWeight,
  type TextAlign,
  type Tone,
} from '../utils/typography';

/** 标题级别：决定 h1–h6 标签（文档结构）与默认字号；级别要连续，不要为了字号跳级（字号用 size 改） */
export interface HeadingLevels {
  /** h1：页面主标题，每页一个；默认 xxxl（30px） */
  1: unknown;
  /** h2：页面里的一级分区；默认 xxl（24px） */
  2: unknown;
  /** h3：分区里的小节；默认 xl（18px） */
  3: unknown;
  /** h4：默认 lg（16px） */
  4: unknown;
  /** h5：默认 md（14px） */
  5: unknown;
  /** h6：默认 md（14px） */
  6: unknown;
}

type Level = keyof HeadingLevels;
type Tag = `h${Level}`;

export interface HeadingProps extends PartProps<Tag> {
  /** 标题级别，决定标签与默认字号，默认 2 */
  level?: Level;
  /** 字号档位，不写时按级别：h1 xxxl、h2 xxl、h3 xl、h4 lg、h5–h6 md */
  size?: FontSize;
  /** 默认 semibold */
  weight?: FontWeight;
  tone?: Tone;
  align?: TextAlign;
  /** 单行省略 */
  truncate?: boolean;
  children?: VNodeChild;
}

const LEVEL_SIZE: Record<Level, FontSize> = {
  1: 'xxxl',
  2: 'xxl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'md',
};

const styles = stylex.create({
  root: { margin: 0, lineHeight: '_tight', textWrap: 'balance' },
  // 大字号的字形间距显得松，略收紧
  xxl: { letterSpacing: '_tight' },
  xxxl: { letterSpacing: '_tighter' },
});

export const Heading = _component(
  ({
    level = 2,
    size,
    weight = 'semibold',
    tone,
    align,
    truncate = false,
    children,
    ...rest
  }: HeadingProps) =>
    () => {
      const Tag: Tag = `h${level}`;
      const fontSize = size ?? LEVEL_SIZE[level];
      const sx = [
        styles.root,
        fontSizeStyles[fontSize],
        (fontSize === 'xxl' || fontSize === 'xxxl') && styles[fontSize],
        fontWeightStyles[weight],
        tone && toneStyles[tone],
        align && textAlignStyles[align],
        truncate && textStyles.truncate,
      ];
      return <Tag {...elementProps(mergeProps<Tag>({ sx }, rest))}>{children}</Tag>;
    },
);
