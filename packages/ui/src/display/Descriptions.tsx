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
 * 容器变窄（不到 32em）时自动排成一列（容器查询）。columns="auto" 时按容器的宽度自己定栏数：每栏不窄于 minItemWidth，
 * 最多 maxColumns 栏（同一份详情放在抽屉、整页里各自合适）；跨列（span）按算出的栏数封顶。
 * 项写 copyable 时值后面有复制按钮（编号、单号、地址这类要复制去别处的），复制的文字默认是值的文字，可以用 copyText 指定。
 *
 * 部件：Root（div）、Title、List（dl）、Item（div）、Label（dt）、Value（dd）、Copy（CopyButton）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { clamp } from '../utils/data/number';
import { CopyButton, type CopyButtonProps } from '../base/CopyButton';
import { useLang } from '../config/context';
import { plainText } from '../utils/data/text';
import { useResizeObserver } from '../utils/dom/resize';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { t } from '../config/theme/tokens';

/** 描述列表里的一项 */
export interface DescriptionItem {
  /** 唯一的 key；不写时用 label（label 是文字时） */
  key?: string;
  /** 名称 */
  label: VNodeChild;
  /** 值 */
  value: VNodeChild;
  /** 占几列，默认 1；超过栏数时按栏数 */
  span?: number;
  /** 值后面放复制按钮 */
  copyable?: boolean;
  /** 复制的文字；不写时是值的文字（值是文字或数字时） */
  copyText?: string;
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
  /** 分几栏，默认 1；'auto' 时按容器的宽度定（见 minItemWidth、maxColumns） */
  columns?: number | 'auto';
  /** columns 为 'auto' 时每栏的最小宽度（px），默认 240 */
  minItemWidth?: number;
  /** columns 为 'auto' 时最多几栏，默认 4 */
  maxColumns?: number;
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
  /** 复制按钮的部件属性 */
  propsCopy?: Partial<CopyButtonProps>;
}

/** Descriptions 的样式：root、title、list、item、label、value 与各排列、边框 */
export const descriptionsStyles = css.create({
  // 容器查询的容器：dl 按它的宽度决定要不要排成一列
  root: { containerType: 'inline-size', display: 'grid', gap: '_md' },
  title: { fontWeight: '_semibold', fontSize: '_md' },
  list: {
    display: 'grid',
    columnGap: '_xl',
    rowGap: '_md',
    margin: 0,
  },
  // 用长写：长写优先于简写（引擎把简写排在前面），gap: 0 压不住 list 的 columnGap / rowGap
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
    marginBlockStart: `calc(-1 * ${t.borderWidths.xs})`,
    marginInlineStart: `calc(-1 * ${t.borderWidths.xs})`,
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
  // 有复制按钮的值：按钮紧跟在文字后面，文字换行时按钮在第一行
  valueCopyable: { display: 'flex', alignItems: 'baseline', gap: '_xs' },
  copy: { flexShrink: 0, marginBlock: '-0.25em' },
});

// 栏数与跨度是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Descriptions 的样式：columns（栏数）、span（跨几栏） */
export const descriptionsGridStyles = css.create({
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
  // columns="auto"：栏数已经按宽度算好，不再用容器查询
  autoColumns: (count: number) => ({ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }),
  autoSpan: (count: number) => ({ gridColumn: `span ${count}` }),
});

/** 描述列表：键值对，可分栏、可跨列 */
export const Descriptions = _component(
  ({
    items,
    title,
    columns = 1,
    minItemWidth = 240,
    maxColumns = 4,
    layout = 'horizontal',
    bordered = false,
    size,
    propsTitle,
    propsList,
    propsItem,
    propsLabel,
    propsValue,
    propsCopy,
    ...rest
  }: DescriptionsProps) => {
    const lang = useLang();
    let list = _state.raw<HTMLElement | null>(null);
    // columns="auto"：按列表的宽度算栏数
    let width = _state(0);
    useResizeObserver(
      () => list,
      ([entry]) => (width = entry?.contentRect.width ?? 0),
    );
    const auto = () => columns === 'auto';
    const count = () =>
      auto() ? clamp(Math.floor(width / minItemWidth), 1, maxColumns) : (columns as number);

    /** 复制的文字：copyText，否则值是文字或数字时就是它 */
    const copyTextOf = (item: DescriptionItem) =>
      item.copyText ??
      (typeof item.value === 'string' || typeof item.value === 'number' ? String(item.value) : '');

    return () => (
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
                  : auto()
                    ? descriptionsGridStyles.autoColumns(count())
                    : descriptionsGridStyles.columns(count()),
                bordered && descriptionsStyles.listBordered,
              ],
            },
            propsList,
            { ref: _toRef(list) },
          )}
        >
          {items.map((item, index) => {
            const own = typeof propsItem === 'function' ? propsItem(item, index) : propsItem;
            const span = clamp(item.span ?? 1, 1, count());
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
                      layout !== 'inline' &&
                        span > 1 &&
                        (auto()
                          ? descriptionsGridStyles.autoSpan(span)
                          : descriptionsGridStyles.span(span)),
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
                      sx: [
                        descriptionsStyles.value,
                        bordered && descriptionsStyles.cellBordered,
                        item.copyable && descriptionsStyles.valueCopyable,
                      ],
                    },
                    propsValue,
                  )}
                >
                  {item.value}
                  {item.copyable && (
                    <CopyButton
                      {...mergePartProps<Partial<CopyButtonProps>>(
                        {
                          size: 'xs',
                          sx: descriptionsStyles.copy,
                          'aria-label': lang.descriptionsCopy(plainText(item.label) ?? lang.copy),
                        },
                        propsCopy,
                      )}
                      value={() => copyTextOf(item)}
                    />
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  },
);
