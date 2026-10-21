/**
 * 一维布局（flex）。不拆 Stack / Group：竖排写 direction="column"。
 * 一个元素一个组件（COMPONENTS.md §1）：Flex 是 div，FlexList 是 ul；
 * 其他语义容器用 createFlex 生成，如 `const Toolbar = createFlex('nav', 'Toolbar')`。
 *
 *   <Flex gap="sm" align="center">…</Flex>
 *   <FlexList direction="column" gap="xs">…</FlexList>   列表：去掉圆点并保留列表语义（有序的用 FlexOrderedList）
 */
import { _component, type TsxComponent } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  columnGapStyles,
  gapStyles,
  listRole,
  listStyles,
  rowGapStyles,
  type LayoutTag,
  type Space,
} from '../utils/style/styles';

/** 主轴方向（flex-direction） */
export interface FlexDirections {
  /** 横排：子元素从起始边排到结束边 */
  row: unknown;
  /** 竖排：子元素从上到下 */
  column: unknown;
  /** 横排，顺序反过来 */
  'row-reverse': unknown;
  /** 竖排，顺序反过来 */
  'column-reverse': unknown;
}

/** 交叉轴对齐（align-items）：横排时是竖直方向，竖排时是水平方向 */
export interface FlexAligns {
  /** 贴着交叉轴的起点（横排时顶部对齐） */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 贴着交叉轴的终点（横排时底部对齐） */
  end: unknown;
  /** 拉伸填满交叉轴（默认） */
  stretch: unknown;
  /** 按文字基线对齐：字号不同的文字、图标与文字混排 */
  baseline: unknown;
}

/** 主轴分布（justify-content） */
export interface FlexJustifies {
  /** 靠主轴起点（默认） */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 靠主轴终点 */
  end: unknown;
  /** 两端对齐，中间等距：首尾贴边 */
  between: unknown;
  /** 每项两侧留白相等：首尾留白是中间的一半 */
  around: unknown;
  /** 所有空隙相等，包括首尾 */
  evenly: unknown;
}

/** flex 布局的选项，Flex、FlexList 与 createFlex 生成的组件共用 */
export interface FlexOptions {
  /** 主轴方向，默认 row */
  direction?: keyof FlexDirections;
  /** 交叉轴对齐（align-items），默认 stretch */
  align?: keyof FlexAligns;
  /** 主轴分布（justify-content），默认 start */
  justify?: keyof FlexJustifies;
  /** 换行；'reverse' 为反向换行 */
  wrap?: boolean | 'reverse';
  /** 间距档位，对应主题的 space */
  gap?: Space;
  /** 换行时行与行之间的间距，盖过 gap（同 Grid） */
  rowGap?: Space;
  /** 同一行里项与项之间的间距，盖过 gap（同 Grid） */
  columnGap?: Space;
  /** 行内 flex（inline-flex） */
  inline?: boolean;
  /** 在父级的 flex 布局里占满剩余空间，并允许收缩到比内容窄（里面的文字才能截断）：头像旁边的正文、图标旁边的说明 */
  grow?: boolean;
  children?: VNodeChild;
}

/** Flex 的样式：root、inline、row、column、row-reverse、column-reverse、wrap、grow 等 */
export const flexStyles = stylex.create({
  root: { display: 'flex' },
  inline: { display: 'inline-flex' },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  'row-reverse': { flexDirection: 'row-reverse' },
  'column-reverse': { flexDirection: 'column-reverse' },
  wrap: { flexWrap: 'wrap' },
  wrapReverse: { flexWrap: 'wrap-reverse' },
  grow: { flexGrow: 1, minWidth: 0 },
});

/** Flex 的样式：start、center、end、stretch、baseline */
export const flexAlignStyles = stylex.create({
  start: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
  stretch: { alignItems: 'stretch' },
  baseline: { alignItems: 'baseline' },
});

/** Flex 的样式：start、center、end、between、around、evenly */
export const flexJustifyStyles = stylex.create({
  start: { justifyContent: 'flex-start' },
  center: { justifyContent: 'center' },
  end: { justifyContent: 'flex-end' },
  between: { justifyContent: 'space-between' },
  around: { justifyContent: 'space-around' },
  evenly: { justifyContent: 'space-evenly' },
});

/** 未声明的属性落到元素上：Flex 为 div，FlexList 为 ul，createFlex 生成的为给定的标签 */
export type FlexProps<Tag extends LayoutTag = 'div'> = PartProps<Tag> & FlexOptions;

/**
 * 生成渲染为指定语义标签的 flex 布局组件；列表标签（ul、ol）自动去掉圆点并补上 role="list"。
 * name 是 DevTools 与警告信息里显示的组件名。
 */
export function createFlex<Tag extends LayoutTag>(
  tag: Tag,
  name: string,
): TsxComponent<FlexProps<Tag>> {
  // 实现按布局标签共有的属性写，对外每个组件只接受自己元素的属性
  return _component(
    ({
      direction = 'row',
      align,
      justify,
      wrap = false,
      gap,
      rowGap,
      columnGap,
      inline = false,
      grow = false,
      children,
      ...rest
    }: FlexProps<LayoutTag>) =>
      () => {
        const Tag = tag as LayoutTag;
        const sx = [
          inline ? flexStyles.inline : flexStyles.root,
          flexStyles[direction],
          wrap && (wrap === 'reverse' ? flexStyles.wrapReverse : flexStyles.wrap),
          align && flexAlignStyles[align],
          justify && flexJustifyStyles[justify],
          gap && gapStyles[gap],
          rowGap && rowGapStyles[rowGap],
          columnGap && columnGapStyles[columnGap],
          grow && flexStyles.grow,
          listRole(tag) && listStyles.reset,
        ];
        return <Tag {...mergeAttrs<LayoutTag>({ sx, role: listRole(tag) }, rest)}>{children}</Tag>;
      },
    { name },
  ) as unknown as TsxComponent<FlexProps<Tag>>;
}

/** flex 布局（div） */
export const Flex = createFlex('div', 'Flex');
/** flex 布局的列表（ul）：去掉圆点与缩进，保留列表语义；子元素用 li */
export const FlexList = createFlex('ul', 'FlexList');

/** 有序列表（ol）的 flex 布局：顺序有意义的一组（面包屑、步骤、时间线、通知），去掉编号并保留列表语义 */
export const FlexOrderedList = createFlex('ol', 'FlexOrderedList');
