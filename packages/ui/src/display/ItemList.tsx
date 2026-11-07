/**
 * 条目列表：一行一条，起始边是图标、色点或头像，中间是标题与说明，结束边是标记、数字或操作。
 * 待办、通知、我负责的任务、清单这类“界面里的列表”（正文里的列表用 List）。参考 Ant Design 的 List.Item.Meta。
 *
 *   <ItemList divided>
 *     <ItemListItem start={<StatusDot />} title={<Link href="/inbox">资料审核</Link>}
 *       description="PO-2026-0187 · 官网改版" end={<DeadlineBadge due="2026-10-23" />} />
 *   </ItemList>
 *
 * divided 在条目之间画线；hoverable 悬停时着底色；inset 是条目两侧的内边距（放在弹出层、
 * 卡片正文里时与容器的内边距对齐；悬停着底色、整条可点的条目不写时留 sm，底色与焦点环不贴着内容）。标题与说明默认单行省略不了时换行；align="start" 让起始边、结束边贴着第一行。
 *
 * 整条可点：写 href（标题是链接，走路由适配）或 onSelect（标题是按钮），标题伸展盖住整条，点哪里都一样；
 * 结束边的操作叠在上面照常可点。selected 是正在看的一条（主从视图左边的列表、收件箱）：底色换成选中色，
 * 链接或按钮带 aria-current。焦点环画在整条上。
 *
 *   <ItemListItem title={mail.subject} description={mail.from} selected={mail.id === current}
 *     onSelect={() => (current = mail.id)} />
 */
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Link, LinkUnderlineContext, type LinkProps } from '../base/Link';
import { t } from '../config/theme/tokens';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { paddingInlineStyles, type Space } from '../utils/style/styles';
import { partAttrs } from '../config/styles';

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
  /**
   * 条目两侧的内边距（与弹出层、卡片的内边距对齐）
   * @default hoverable 或整条可点时 'sm'，否则不留
   */
  inset?: Space;
  /** ItemListItem */
  children?: VNodeChild;
}

/** 未声明的属性落到 li 上；原生的 title 属性让给标题，onSelect 是点了这一条（不是原生的选中文字事件） */
export interface ItemListItemProps extends PartProps<'li', 'title' | 'onSelect'> {
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
  /** 整条是链接：标题渲染成 Link（走路由适配），盖住整条 */
  href?: string;
  /** 整条是按钮：点了这一条（主从视图里选中、打开详情）；标题渲染成按钮，盖住整条 */
  onSelect?: (event: MouseEvent) => void;
  /** 正在看的一条：选中色的底色，整条可点时链接或按钮带 aria-current */
  selected?: boolean;
  /** 整条可点时不可用：变淡、点不了 */
  disabled?: boolean;
  /** 整条是链接时，标题那个 Link 的部件属性 */
  propsLink?: Partial<LinkProps>;
  /** 整条是按钮时，标题那个 ButtonBase 的部件属性 */
  propsButton?: Partial<ButtonBaseProps>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'span'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'span'>;
  /** 说明下面的更多内容 */
  children?: VNodeChild;
}

/** 部件的标记（data-scope="item-list"） */
const itemListPart = (part: string) => partAttrs({ name: 'ItemList' }, part);

/** ItemList 的样式：list、item、divided、hoverable、compact、standard、body、title、description… */
const itemListStyles = css.create({
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
  hoverable: { backgroundColor: { default: null, _hover: '_fillHover' }, borderRadius: '_sm' },
  compact: { paddingBlock: '_xs' },
  standard: { paddingBlock: '_sm' },
  // 没有 start 时第一列宽度为 0、不留间距
  noStart: { gridTemplateColumns: 'minmax(0, 1fr) auto' },
  // 色点、小图标贴着第一行的中线
  startAligned: { display: 'flex', alignItems: 'center', minHeight: '1lh' },
  body: { display: 'flex', flexDirection: 'column', gap: '_xxs', minWidth: 0 },
  title: { minWidth: 0, overflowWrap: 'anywhere' },
  description: { color: '_textMuted', fontSize: '_xs', minWidth: 0, overflowWrap: 'anywhere' },
  end: { display: 'flex', alignItems: 'center', gap: '_xs', justifySelf: 'end' },
  // 整条可点：悬停着底色；焦点在标题的链接或按钮上时整条画焦点环
  interactive: {
    position: 'relative',
    backgroundColor: { default: null, _hover: '_fillHover' },
    outlineStyle: { default: 'none', ':has([data-item-action]:focus-visible)': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: `calc(-1 * ${t.borderWidths.sm})`,
    borderRadius: '_sm',
  },
  selected: { backgroundColor: { default: '_accentSoft', _hover: '_accentSoftHover' } },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
  // 标题的链接或按钮：看起来就是标题；::after 伸展盖住整条，点哪里都等于点它
  action: {
    // ButtonBase 为波纹定了位：改回 static，::after 才以整条（li）为准
    position: 'static',
    display: 'block',
    width: '_full',
    padding: 0,
    color: 'inherit',
    textAlign: 'start',
    textDecorationLine: 'none',
    outlineStyle: { default: 'none', _focusVisible: 'none' },
    cursor: 'inherit',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
  // 结束边的操作叠在伸展的标题上面，照常可点
  raised: { position: 'relative', zIndex: 1 },
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
    // 条目里的链接（标题、附件）悬停才有下划线：一列下来都带下划线太重
    LinkUnderlineContext.provide(() => 'hover');
    return () => (
      <ul {...mergeAttrs<'ul'>({ sx: itemListStyles.list, ...itemListPart('root') }, rest)}>
        {children}
      </ul>
    );
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
    href,
    onSelect,
    selected = false,
    disabled = false,
    propsLink,
    propsButton,
    propsTitle,
    propsDescription,
    children,
    ...rest
  }: ItemListItemProps) => {
    /** 标题：整条可点时包成伸展的链接或按钮 */
    const renderTitle = () => {
      const action = {
        sx: itemListStyles.action,
        'data-item-action': '',
        'aria-current': selected ? ('true' as const) : undefined,
      };
      if (href != null && !disabled) {
        return (
          <Link {...mergePartProps<LinkProps>({ ...action, href, underline: 'none' }, propsLink)}>
            {title}
          </Link>
        );
      }
      if (onSelect) {
        return (
          <ButtonBase
            {...mergePartProps<ButtonBaseProps>(
              { ...action, ripple: false, disabled, onClick: onSelect },
              propsButton,
            )}
          >
            {title}
          </ButtonBase>
        );
      }
      return title;
    };
    const look = ItemListContext.inject(() => ({
      divided: false,
      hoverable: false,
      density: 'standard' as const,
      inset: undefined,
    }));
    return () => {
      const { divided, hoverable, density, inset } = look();
      const interactive = href != null || onSelect != null;
      const gutter = inset ?? (hoverable || interactive ? 'sm' : undefined);
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
                gutter && paddingInlineStyles[gutter],
                interactive && itemListStyles.interactive,
                selected && itemListStyles.selected,
                interactive && disabled && itemListStyles.disabled,
              ],
              ...itemListPart('item'),
            },
            rest,
          )}
          data-selected={selected || undefined}
          data-disabled={(interactive && disabled) || undefined}
        >
          {hasContent(start) && (
            <span {...css.attrs(align === 'start' && itemListStyles.startAligned)}>{start}</span>
          )}
          <span {...css.attrs(itemListStyles.body)}>
            {hasContent(title) && (
              <span
                {...mergeAttrs<'span'>(
                  { sx: itemListStyles.title, ...itemListPart('title') },
                  propsTitle,
                )}
              >
                {renderTitle()}
              </span>
            )}
            {hasContent(description) && (
              <span
                {...mergeAttrs<'span'>(
                  { sx: itemListStyles.description, ...itemListPart('description') },
                  propsDescription,
                )}
              >
                {description}
              </span>
            )}
            {children}
          </span>
          {end != null ? (
            <span {...css.attrs(itemListStyles.end, interactive && itemListStyles.raised)}>
              {end}
            </span>
          ) : (
            <span />
          )}
        </li>
      );
    };
  },
);
