/**
 * 带说明的插图（figure + figcaption）：图片、图表、代码、表格下面（或上面）配一行说明，读屏把说明当作这块内容的名称。
 *
 *   <Figure caption="图 1：近 12 个月的采购额">
 *     <Image src={chart} alt="…" />
 *   </Figure>
 *   <Figure caption="表 2：各供应商的交付周期" captionSide="top">
 *     <Table>…</Table>
 *   </Figure>
 *
 * 说明默认在下面、次要色、小一号；表格的说明习惯放上面（captionSide="top"）。内容与说明都跟着 align 对齐。
 * 部件：Root（figure）、Caption（figcaption）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { partAttrs } from '../config/styles';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 说明放在内容的哪一边 */
export interface FigureCaptionSides {
  /** 下面（默认）：图片、图表 */
  bottom: unknown;
  /** 上面：表格 */
  top: unknown;
}

/** 内容与说明的对齐 */
export interface FigureAligns {
  /** 靠起始边（默认） */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 靠结束边 */
  end: unknown;
}

/** 未声明的属性落到 figure 上 */
export interface FigureProps extends PartProps<'figure'> {
  /** 说明文字；没有时就是一个没有外边距的 figure */
  caption?: VNodeChild;
  /**
   * 说明在内容的上面还是下面
   * @default 'bottom'
   */
  captionSide?: keyof FigureCaptionSides;
  /**
   * 内容与说明的对齐
   * @default 'start'
   */
  align?: keyof FigureAligns;
  /** 说明（figcaption）的部件属性 */
  propsCaption?: PartProps<'figcaption'>;
  /** 插图：图片、图表、代码、表格 */
  children?: VNodeChild;
}

/** 部件的标记（data-scope="figure"） */
const figurePart = (part: string) => partAttrs({ name: 'Figure' }, part);

/** Figure 的样式：root、top、start、center、end、caption */
const figureStyles = css.create({
  // 去掉浏览器给 figure 的外边距（间距交给布局）；minWidth: 0 让里面的宽内容（表格、代码）自己滚动
  root: { display: 'flex', flexDirection: 'column', gap: '_sm', margin: 0, minWidth: 0 },
  top: { flexDirection: 'column-reverse' },
  start: { alignItems: 'stretch', textAlign: 'start' },
  center: { alignItems: 'center', textAlign: 'center' },
  end: { alignItems: 'flex-end', textAlign: 'end' },
  caption: { color: '_textMuted', fontSize: '_sm', lineHeight: '_normal' },
});

/** 带说明的插图 */
export const Figure = _component(
  ({
    caption,
    captionSide = 'bottom',
    align = 'start',
    propsCaption,
    children,
    ...rest
  }: FigureProps) =>
    () => (
      <figure
        {...mergeAttrs<'figure'>(
          {
            sx: [figureStyles.root, captionSide === 'top' && figureStyles.top, figureStyles[align]],
            ...figurePart('root'),
          },
          rest,
        )}
      >
        {children}
        {hasContent(caption) && (
          <figcaption
            {...mergeAttrs<'figcaption'>(
              { sx: figureStyles.caption, ...figurePart('caption') },
              propsCaption,
            )}
          >
            {caption}
          </figcaption>
        )}
      </figure>
    ),
);
