/**
 * 卡片（div）：把一组相关内容放在一块表面上。可选的页头、页脚与正文之间有分隔线。
 *
 *   <Card header={<H3 size="md">订单 #1024</H3>} footer={<Button>查看</Button>}>…</Card>
 *   <Card loading={loading} header={…}>…</Card>      正文加载中：换成几行扫光的骨架，卡片带 aria-busy
 *
 * 需要语义容器（article、section）时在外面包，或把语义标签放进 header 里的标题。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useDefaults } from '../config/defaults';
import { SkeletonText, type SkeletonTextProps } from '../feedback/SkeletonText';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { Space } from '../utils/style/styles';

/** 卡片样式 */
export interface CardVariants {
  /** 表面色加细边框（默认） */
  surface: unknown;
  /** 只有边框，底色透明 */
  outline: unknown;
  /** 表面色加阴影，浮在页面上 */
  elevated: unknown;
  /** 没有底色与边框，只保留内边距与分区 */
  ghost: unknown;
}

/** 卡片的外观选项；可以用 createUi / Provider 的 defaults.Card 统一改默认值 */
export interface CardOptions {
  /** 样式，默认 surface */
  variant?: keyof CardVariants;
  /** 内边距档位，对应主题的 space，默认 lg */
  padding?: Space;
}

/** 忙碌由组件按 loading 管理 */
export type CardManaged = 'aria-busy';

/** 未声明的属性落到外层 div 上 */
export interface CardProps extends PartProps<'div', CardManaged>, CardOptions {
  /** 页头：标题、操作；与正文之间有分隔线 */
  header?: VNodeChild;
  /** 页脚：按钮等操作；与正文之间有分隔线 */
  footer?: VNodeChild;
  /**
   * 正文加载中：正文换成几行扫光的骨架（页头、页脚照常显示），卡片带 aria-busy；很快完成时不闪
   * @default false
   */
  loading?: boolean;
  /** 页头的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 正文的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 页脚的部件属性 */
  propsFooter?: PartProps<'div'>;
  /** 加载中的骨架（SkeletonText）的部件属性，如行数 `{ lines: 5 }` */
  propsSkeleton?: Partial<SkeletonTextProps>;
  children?: VNodeChild;
}

/** Card 的样式：root、header、footer */
export const cardStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '_lg',
    color: '_text',
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_borderMuted',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '_sm',
    borderTopWidth: '_xs',
    borderTopStyle: 'solid',
    borderTopColor: '_borderMuted',
  },
});

/** Card 的样式：surface、outline、elevated、ghost */
export const cardVariantStyles = stylex.create({
  surface: { backgroundColor: '_surface', borderColor: '_border' },
  outline: { borderColor: '_border' },
  elevated: { backgroundColor: '_surfaceRaised', boxShadow: '_md' },
  ghost: {},
});

/** Card 的样式：none、xs、sm、md、lg、xl */
export const cardPaddingStyles = stylex.create({
  none: { padding: '_none' },
  xs: { padding: '_xs' },
  sm: { padding: '_sm' },
  md: { padding: '_md' },
  lg: { padding: '_lg' },
  xl: { padding: '_xl' },
});

/** 卡片：表面 + 可选的页头与页脚，正文可以显示加载骨架 */
export const Card = _component(
  ({
    variant,
    padding,
    header,
    footer,
    loading = false,
    propsHeader,
    propsBody,
    propsFooter,
    propsSkeleton,
    children,
    ...rest
  }: CardProps) => {
    const appearance = useDefaults('Card', () => ({ variant, padding }), {
      variant: 'surface',
      padding: 'lg',
    });
    // 骨架防闪烁；aria-busy 按真实的 loading
    const skeleton = useDelayedLoading(() => loading);
    return () => {
      const space = cardPaddingStyles[appearance().padding];
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [cardStyles.root, cardVariantStyles[appearance().variant]],
            },
            rest,
            { 'aria-busy': loading || undefined },
          )}
        >
          {header != null && (
            <div {...mergeAttrs<'div'>({ sx: [cardStyles.header, space] }, propsHeader)}>
              {header}
            </div>
          )}
          <div {...mergeAttrs<'div'>({ sx: space }, propsBody)}>
            {skeleton.value ? <SkeletonText {...propsSkeleton} /> : children}
          </div>
          {footer != null && (
            <div {...mergeAttrs<'div'>({ sx: [cardStyles.footer, space] }, propsFooter)}>
              {footer}
            </div>
          )}
        </div>
      );
    };
  },
);
