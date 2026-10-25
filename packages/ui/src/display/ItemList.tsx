/**
 * 条目列表：一行一条，起始边是图标、色点或头像，中间是标题与说明，结束边是标记、数字或操作。
 * 待办、通知、我负责的任务、清单这类“界面里的列表”（正文里的列表用 List）。参考 Ant Design 的 List.Item.Meta。
 *
 *   <ItemList divided>
 *     <ItemListItem start={<StatusDot />} title={<Link href="/inbox">资料审核</Link>}
 *       description="PO-2026-0187 · 官网改版" end={<DeadlineBadge due="2026-10-23" />} />
 *   </ItemList>
 *
 * divided 在条目之间画线；hoverable 悬停时着底色（整条可点时）；inset 是条目两侧的内边距（放在弹出层、
 * 卡片正文里时与容器的内边距对齐）。标题与说明默认单行省略不了时换行；align="start" 让起始边、结束边贴着第一行。
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';
import { paddingInlineStyles, type Space } from '../utils/style/styles';

/** 条目的疏密 */
export interface ItemListDensities {
  /** 紧凑：卡片里的短列表 */
  compact: unknown;
  /** 标准（默认）：弹出层、页面里的列表 */
  standard: unknown;
}

/** ItemList 交给条目的外观 */
interface ItemListLook {
  divided: boolean;
  hoverable: boolean;
  density: keyof ItemListDensities;
  inset: Space | undefined;
}

const ItemListContext = createContext<() => ItemListLook>('ItemList');

/** 未声明的属性落到 ul 上 */
export interface ItemListProps extends PartProps<'ul'> {
  /** 条目之间画线 */
  divided?: boolean;
  /** 悬停时着底色：整条可点时 */
  hoverable?: boolean;
  /**
   * 疏密
   * @default 'standard'
   */
  density?: keyof ItemListDensities;
  /** 条目两侧的内边距（与弹出层、卡片的内边距对齐） */
  inset?: Space;
  /** ItemListItem */
  children?: VNodeChild;
}

/** 未声明的属性落到 li 上；原生的 title 属性让给标题 */
export interface ItemListItemProps extends PartProps<'li', 'title'> {
  /** 起始边：图标、色点、头像、状态 */
  start?: VNodeChild;
  /** 标题：一句话，常是链接 */
  title?: VNodeChild;
  /** 标题下的说明（次要文字） */
  description?: VNodeChild;
  /** 结束边：标记、数字、时间、操作 */
  end?: VNodeChild;
  /**
   * 起始边、结束边与内容的对齐：center 垂直居中，start 贴着第一行（多行内容、色点对齐标题）
   * @default 'center'
   */
  align?: 'center' | 'start';
  /** 标题的部件属性 */
  propsTitle?: PartProps<'span'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'span'>;
  /** 说明下面的更多内容 */
  children?: VNodeChild;
}

/** ItemList 的样式：list、item、divided、hoverable、compact、standard、body、title、description… */
export const itemListStyles = css.create({
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  item: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    columnGap: '_sm',
    alignItems: 'center',
  },
  alignStart: { alignItems: 'start' },
  divided: {
    borderBlockEndWidth: { default: '_xs', ':last-child': 0 },
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
  },
  hoverable: { backgroundColor: { default: null, ':hover': '_fillHover' } },
  compact: { paddingBlock: '_xs' },
  standard: { paddingBlock: '_sm' },
  // 没有 start 时第一列宽度为 0、不留间距
  noStart: { gridTemplateColumns: 'minmax(0, 1fr) auto' },
  // 色点、小图标贴着第一行的中线
  startAligned: { display: 'flex', alignItems: 'center', minHeight: '1lh' },
  body: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  title: { minWidth: 0, overflowWrap: 'anywhere' },
  description: { color: '_textMuted', fontSize: '_xs', minWidth: 0, overflowWrap: 'anywhere' },
  end: { display: 'flex', alignItems: 'center', gap: '_xs', justifySelf: 'end' },
});

/** 条目列表（ul） */
export const ItemList = _component(
  ({
    divided = false,
    hoverable = false,
    density = 'standard',
    inset,
    children,
    ...rest
  }: ItemListProps) => {
    ItemListContext.provide(() => ({ divided, hoverable, density, inset }));
    return () => <ul {...mergeAttrs<'ul'>({ sx: itemListStyles.list }, rest)}>{children}</ul>;
  },
);

/** 条目列表的一条（li） */
export const ItemListItem = _component(
  ({
    start,
    title,
    description,
    end,
    align = 'center',
    propsTitle,
    propsDescription,
    children,
    ...rest
  }: ItemListItemProps) => {
    const look = ItemListContext.inject(() => ({
      divided: false,
      hoverable: false,
      density: 'standard' as const,
      inset: undefined,
    }));
    return () => {
      const { divided, hoverable, density, inset } = look();
      return (
        <li
          {...mergeAttrs<'li'>(
            {
              sx: [
                itemListStyles.item,
                itemListStyles[density],
                start == null && itemListStyles.noStart,
                align === 'start' && itemListStyles.alignStart,
                divided && itemListStyles.divided,
                hoverable && itemListStyles.hoverable,
                inset && paddingInlineStyles[inset],
              ],
            },
            rest,
          )}
        >
          {hasContent(start) && (
            <span {...css.attrs(align === 'start' && itemListStyles.startAligned)}>{start}</span>
          )}
          <span {...css.attrs(itemListStyles.body)}>
            {hasContent(title) && (
              <span {...mergeAttrs<'span'>({ sx: itemListStyles.title }, propsTitle)}>{title}</span>
            )}
            {hasContent(description) && (
              <span {...mergeAttrs<'span'>({ sx: itemListStyles.description }, propsDescription)}>
                {description}
              </span>
            )}
            {children}
          </span>
          {end != null ? <span {...css.attrs(itemListStyles.end)}>{end}</span> : <span />}
        </li>
      );
    };
  },
);
