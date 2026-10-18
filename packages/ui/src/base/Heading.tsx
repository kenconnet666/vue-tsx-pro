/**
 * 标题：H1–H6 各是一个组件（语义不同的元素分成不同组件，不靠 prop 切换标签），默认字号各不相同，
 * 样式与逻辑由同一个工厂生成。size 可以单独改：视觉层级与文档结构分开。
 * 紧凑行高、text-wrap: balance（各行长度均衡），大字号略收紧字间距；去掉浏览器默认的外边距，间距交给布局。
 *
 *   <H1>订单详情</H1>
 *   <H2 size="lg">收货地址</H2>
 *
 * 级别要连续，不要为了字号跳级（字号用 size 改）。
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

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/** 未声明的属性落到 h1–h6 元素上 */
export interface HeadingProps extends PartProps<HeadingTag> {
  /** 字号档位，不写时按级别：H1 xxxl、H2 xxl、H3 xl、H4 lg、H5–H6 md */
  size?: FontSize;
  /** 字重，默认 semibold */
  weight?: FontWeight;
  /** 色调，不写时继承 */
  tone?: Tone;
  /** 水平对齐，不写时继承 */
  align?: TextAlign;
  /** 单行省略 */
  truncate?: boolean;
  children?: VNodeChild;
}

const styles = stylex.create({
  root: { margin: 0, lineHeight: '_tight', textWrap: 'balance' },
  // 大字号的字形间距显得松，略收紧
  xxl: { letterSpacing: '_tight' },
  xxxl: { letterSpacing: '_tighter' },
});

function createHeading(tag: HeadingTag, defaultSize: FontSize) {
  return _component(
    ({
      size = defaultSize,
      weight = 'semibold',
      tone,
      align,
      truncate = false,
      children,
      ...rest
    }: HeadingProps) =>
      () => {
        const Tag = tag;
        const sx = [
          styles.root,
          fontSizeStyles[size],
          (size === 'xxl' || size === 'xxxl') && styles[size],
          fontWeightStyles[weight],
          tone && toneStyles[tone],
          align && textAlignStyles[align],
          truncate && textStyles.truncate,
        ];
        return <Tag {...elementProps(mergeProps<HeadingTag>({ sx }, rest))}>{children}</Tag>;
      },
    { name: tag.toUpperCase() },
  );
}

/** 页面主标题，每页一个；默认字号 xxxl（30px） */
export const H1 = createHeading('h1', 'xxxl');
/** 页面里的一级分区；默认字号 xxl（24px） */
export const H2 = createHeading('h2', 'xxl');
/** 分区里的小节；默认字号 xl（18px） */
export const H3 = createHeading('h3', 'xl');
/** 四级标题；默认字号 lg（16px） */
export const H4 = createHeading('h4', 'lg');
/** 五级标题；默认字号 md（14px） */
export const H5 = createHeading('h5', 'md');
/** 六级标题；默认字号 md（14px） */
export const H6 = createHeading('h6', 'md');
