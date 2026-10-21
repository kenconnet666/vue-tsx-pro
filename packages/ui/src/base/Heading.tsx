/**
 * 标题：H1–H6 各是一个组件（语义不同的元素分成不同组件，不靠 prop 切换标签），默认字号各不相同，
 * 样式与逻辑由同一个工厂生成。size 可以单独改：视觉层级与文档结构分开。
 * 紧凑行高、text-wrap: balance（各行长度均衡），大字号略收紧字间距；去掉浏览器默认的外边距，间距交给布局。
 *
 *   <H1>订单详情</H1>
 *   <H2 size="lg">收货地址</H2>
 *   <H2 id="install" anchor>安装</H2>   末尾带指向本节的锚点链接（悬停或聚焦时显示）
 *
 * 级别要连续，不要为了字号跳级（字号用 size 改）。
 */
import { Hash } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { mergeAttrs, type PartProps } from '../utils/props';
import { space } from '../config/theme/tokens.stylex';
import { headingMarker } from '../utils/style/markers.stylex';
import { layoutVars } from '../utils/style/vars.stylex';
import { focusRingStyles } from '../utils/style/styles';
import { Icon } from './Icon';
import {
  fontSizeStyles,
  fontWeightStyles,
  lineClampStyles,
  textAlignStyles,
  textStyles,
  textWrapStyles,
  toneStyles,
  type FontSize,
  type FontWeight,
  type TextAlign,
  type TextWrap,
  type Tone,
} from '../utils/style/typography';

/** 标题组件可用的标签 */
export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

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
  /** 最多显示几行，超出的省略（同 Text） */
  lineClamp?: number;
  /** 换行方式，默认 balance（各行长度均衡）；同 Text 的 wrap */
  wrap?: TextWrap;
  /** 有 id 时在末尾放一个指向本节的锚点链接（#），悬停或聚焦时显示：文档里方便复制本节的链接 */
  anchor?: boolean;
  /** 锚点链接的部件属性 */
  propsAnchor?: PartProps<'a'>;
  children?: VNodeChild;
}

/** H1–H6 的样式：root、xxl、xxxl */
export const headingStyles = stylex.create({
  // 字体取 fonts.heading：默认同正文，纸张主题换成衬线
  root: {
    margin: 0,
    fontFamily: '_heading',
    lineHeight: '_tight',
    textWrap: 'balance',
    // 锚点跳转（#install）后让开粘性顶栏，再留一点空
    scrollMarginBlockStart: `calc(${layoutVars.stickyOffset} + ${space.lg})`,
  },
  // 大字号的字形间距显得松，略收紧
  xxl: { letterSpacing: '_tight' },
  xxxl: { letterSpacing: '_tighter' },
  anchor: {
    display: 'inline-flex',
    verticalAlign: 'middle',
    marginInlineStart: '_xs',
    borderRadius: '_xs',
    color: { default: '_textMuted', ':hover': '_accentText' },
    fontSize: '0.75em',
    textDecoration: 'none',
    opacity: {
      default: 0,
      ':focus-visible': 1,
      [stylex.when.ancestor(':hover', headingMarker)]: 1,
    },
    transition: 'opacity _durations.sm _easings.standard',
  },
});

/** 生成标题组件：标签与默认字号（H1–H6 由它生成） */
export function createHeading(tag: HeadingTag, defaultSize: FontSize) {
  return _component(
    ({
      size = defaultSize,
      weight = 'semibold',
      tone,
      align,
      truncate = false,
      lineClamp,
      wrap,
      anchor = false,
      propsAnchor,
      children,
      ...rest
    }: HeadingProps) => {
      const lang = useLang();
      return () => {
        const Tag = tag;
        const sx = [
          headingStyles.root,
          fontSizeStyles[size],
          (size === 'xxl' || size === 'xxxl') && headingStyles[size],
          fontWeightStyles[weight],
          tone && toneStyles[tone],
          align && textAlignStyles[align],
          truncate && textStyles.truncate,
          lineClamp != null && [textStyles.clamp, lineClampStyles.lines(lineClamp)],
          wrap && textWrapStyles[wrap],
          // 标记不是样式，类型上不在 StyleXStyles 里；StyleX 把它当作一个 class 合并
          anchor && (headingMarker as unknown as StyleXStyles),
        ];
        const id = rest.id;
        return (
          <Tag {...mergeAttrs<HeadingTag>({ sx }, rest)}>
            {children}
            {anchor && id && (
              <a
                {...mergeAttrs<'a'>(
                  { sx: [headingStyles.anchor, focusRingStyles.visible] },
                  propsAnchor,
                  { href: `#${id}`, 'aria-label': lang.headingAnchor },
                )}
              >
                <Icon icon={Hash} />
              </a>
            )}
          </Tag>
        );
      };
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
