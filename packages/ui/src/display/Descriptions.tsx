/**
 * 描述列表（div > dl）：键值对的详情（订单信息、用户资料），可分栏、可跨列，标签在左（横排）或在上（竖排）。
 * 语义是 dl > div > dt + dd（HTML 允许用 div 给 dt / dd 分组），读屏按“名称、值”念。参考 Ant Design Descriptions。
 *
 *   <Descriptions
 *     title="订单信息"
 *     columns={3}
 *     items={[
 *       { label: '订单号', value: 'A-1024' },
 *       { label: '状态', value: <Badge tone="success">已发货</Badge> },
 *       { label: '收货地址', value: address, span: 3 },
 *     ]}
 *   />
 *
 * 容器变窄（不到 32em）时自动排成一列（容器查询）。部件：Root（div）、Title、List（dl）、Item（div）、Label（dt）、Value（dd）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { clamp } from '../utils/data/number';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

/** 描述列表里的一项 */
export interface DescriptionItem {
  /** 唯一的 key；不写时用 label（label 是文字时） */
  key?: string;
  /** 名称 */
  label: VNodeChild;
  /** 值 */
  value: VNodeChild;
  /** 占几列，默认 1；超过 columns 时按 columns */
  span?: number;
}

/** 标签与值的排列 */
export interface DescriptionsLayouts {
  /** 横排（默认）：标签在左、值在右 */
  horizontal: unknown;
  /** 竖排：标签在上、值在下 */
  vertical: unknown;
  /** 行内：各项一行排开、放不下换行（页头里的编号、团队、主办这类关键信息）；columns 不起作用 */
  inline: unknown;
}

/** 未声明的属性落到外层 div 上；原生的 title 属性（悬停提示）让给标题 */
export interface DescriptionsProps extends PartProps<'div', 'title'> {
  /** 各项 */
  items: readonly DescriptionItem[];
  /** 标题 */
  title?: VNodeChild;
  /** 分几栏，默认 1 */
  columns?: number;
  /** 标签与值的排列，默认 horizontal */
  layout?: keyof DescriptionsLayouts;
  /** 带边框（表格样式）：标签有底色，各项之间有分隔线 */
  bordered?: boolean;
  /** 字号档位；不写时继承 */
  size?: TextSize;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 列表（dl）的部件属性 */
  propsList?: PartProps<'dl'>;
  /** 每一项（div）的部件属性，可以按项计算 */
  propsItem?: PartProps<'div'> | ((item: DescriptionItem, index: number) => PartProps<'div'>);
  /** 名称（dt）的部件属性 */
  propsLabel?: PartProps<'dt'>;
  /** 值（dd）的部件属性 */
  propsValue?: PartProps<'dd'>;
}

/** Descriptions 的样式：root、title、list、item、label、value 与各排列、边框 */
export const descriptionsStyles = stylex.create({
  // 容器查询的容器：dl 按它的宽度决定要不要排成一列
  root: { containerType: 'inline-size', display: 'grid', gap: '_md' },
  title: { fontWeight: '_semibold', fontSize: '_md' },
  list: {
    display: 'grid',
    columnGap: '_xl',
    rowGap: '_md',
    margin: 0,
  },
  // 用长写：StyleX 里长写优先于简写，gap: 0 压不住 list 的 columnGap / rowGap
  listBordered: {
    columnGap: 0,
    rowGap: 0,
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
    overflow: 'hidden',
  },
  item: { minWidth: 0 },
  itemHorizontal: { display: 'flex', gap: '_md', alignItems: 'baseline' },
  itemVertical: { display: 'grid', gap: '_xs' },
  // 行内：dl 改成换行的一行，项内标签与值挨着
  listInline: { display: 'flex', flexWrap: 'wrap', columnGap: '_xl', rowGap: '_xs' },
  itemInline: { display: 'flex', gap: '_xs', alignItems: 'baseline' },
  itemBordered: {
    alignItems: 'stretch',
    gap: 0,
    // 每格的上、起始边画线，外框由 dl 画；第一行、第一列的线被 dl 的边框盖住
    marginBlockStart: 'calc(-1 * _borderWidths.xs)',
    marginInlineStart: 'calc(-1 * _borderWidths.xs)',
    borderBlockStartWidth: '_xs',
    borderInlineStartWidth: '_xs',
    borderBlockStartStyle: 'solid',
    borderInlineStartStyle: 'solid',
    borderColor: '_borderMuted',
  },
  label: { flexShrink: 0, margin: 0, color: '_textMuted' },
  cellBordered: { paddingBlock: '_sm', paddingInline: '_md' },
  // 暗色主题的 surfaceMuted 与 surface 同色，标签格要在两种模式下都看得出来
  labelBordered: { backgroundColor: '_fill', minWidth: '8em' },
  value: { minWidth: 0, margin: 0, color: '_text', overflowWrap: 'anywhere' },
});

// 栏数与跨度是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Descriptions 的样式：columns（栏数）、span（跨几栏） */
export const descriptionsGridStyles = stylex.create({
  // 容器不到 32em 时排成一列
  columns: (count: number) => ({
    gridTemplateColumns: {
      default: `repeat(${count}, minmax(0, 1fr))`,
      '@container (max-width: 32em)': '1fr',
    },
  }),
  span: (count: number) => ({
    gridColumn: { default: `span ${count}`, '@container (max-width: 32em)': 'auto' },
  }),
});

/** 描述列表：键值对，可分栏、可跨列 */
export const Descriptions = _component(
  ({
    items,
    title,
    columns = 1,
    layout = 'horizontal',
    bordered = false,
    size,
    propsTitle,
    propsList,
    propsItem,
    propsLabel,
    propsValue,
    ...rest
  }: DescriptionsProps) =>
    () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [descriptionsStyles.root, size && fontSizeStyles[size]] },
          rest,
        )}
        data-layout={layout}
      >
        {hasContent(title) && (
          <div {...mergeAttrs<'div'>({ sx: descriptionsStyles.title }, propsTitle)}>{title}</div>
        )}
        <dl
          {...mergeAttrs<'dl'>(
            {
              sx: [
                descriptionsStyles.list,
                layout === 'inline'
                  ? descriptionsStyles.listInline
                  : descriptionsGridStyles.columns(columns),
                bordered && descriptionsStyles.listBordered,
              ],
            },
            propsList,
          )}
        >
          {items.map((item, index) => {
            const own = typeof propsItem === 'function' ? propsItem(item, index) : propsItem;
            const span = clamp(item.span ?? 1, 1, columns);
            return (
              <div
                key={item.key ?? (typeof item.label === 'string' ? item.label : index)}
                {...mergeAttrs<'div'>(
                  {
                    sx: [
                      layout === 'vertical'
                        ? descriptionsStyles.itemVertical
                        : layout === 'inline'
                          ? descriptionsStyles.itemInline
                          : descriptionsStyles.itemHorizontal,
                      bordered && descriptionsStyles.itemBordered,
                      descriptionsStyles.item,
                      layout !== 'inline' && span > 1 && descriptionsGridStyles.span(span),
                    ],
                  },
                  own,
                )}
              >
                <dt
                  {...mergeAttrs<'dt'>(
                    {
                      sx: [
                        descriptionsStyles.label,
                        bordered && [
                          descriptionsStyles.cellBordered,
                          descriptionsStyles.labelBordered,
                        ],
                      ],
                    },
                    propsLabel,
                  )}
                >
                  {item.label}
                </dt>
                <dd
                  {...mergeAttrs<'dd'>(
                    {
                      sx: [descriptionsStyles.value, bordered && descriptionsStyles.cellBordered],
                    },
                    propsValue,
                  )}
                >
                  {item.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    ),
);
