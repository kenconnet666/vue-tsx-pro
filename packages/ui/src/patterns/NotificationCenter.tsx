/**
 * 通知：顶栏的铃铛 NotificationCenter（右上角是未读数，点开是通知列表），与列表本身 NotificationList
 * （通知页面、侧边抽屉里直接放）。列表新的在前：按类型筛选、只看未读、全部标为已读；点一条标为已读并去它的地址（走路由适配）。
 * 通知存在哪、何时算已读由应用决定：组件只报告 onRead。
 *
 *   <NotificationCenter
 *     items={notices}                                       // { id, title, description?, time, type?, read, href?, tone? }
 *     types={[{ key: 'todo', label: '待办' }, { key: 'remind', label: '催办' }]}
 *     onRead={(ids) => markRead(ids)}
 *     footer={<Link href="/inbox">打开收件箱</Link>}
 *   />
 *   <NotificationList items={notices} types={types} onRead={markRead} />    通知页面：同一份列表，不放进弹出层
 *
 * 时间写成相对现在（3 分钟前、昨天），悬停看完整时间。未读的前面一个色点（tone 决定颜色，默认 accent），
 * 读屏念“未读”。列表为空时显示 empty（默认“没有通知”）。和 Toast 的分工：Toast 是此刻发生的事、几秒后消失；
 * 通知是留着、可以回头看的。
 *
 * NotificationList 的部件：Root（div）、Head（div）、Title（span）、MarkAll（Button）、Filters（div）、Types（ToggleGroup）、
 * UnreadOnly（Switch）、List（ul）、Item（a，可以按条计算）、Empty（div）、Footer（div）。
 */
import { Bell } from '@lucide/icons';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { Indicator } from '../base/Indicator';
import { StatusDot } from '../base/StatusDot';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useMessages } from '../config/lang/messages';
import { RelativeTime } from '../date/RelativeTime';
import { Empty } from '../feedback/Empty';
import { Switch, type SwitchProps } from '../input/Switch';
import { ToggleGroup, ToggleItem, type ToggleGroupBaseProps } from '../input/ToggleGroup';
import { Popover, type PopoverProps } from '../overlay/Popover';
import { useRouterLink } from '../utils/dom/link';
import { hasContent, mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import type { SingleSelectionProps } from '../utils/data/selection';
import type { StatusTone } from '../utils/style/tone-styles';
import { patternsMessages } from './messages';
import { useComponent } from '../config/components';
import type { PartLayer } from '../config/styles';

/** 一条通知 */
export interface NotificationItem {
  /** 标识 */
  id: string;
  /** 标题：一句话说清发生了什么 */
  title: string;
  /** 补充说明（谁、哪张单） */
  description?: string;
  /** 发生的时间（ISO） */
  time: string;
  /** 类型：按 types 筛选 */
  type?: string;
  /** 读过了 */
  read: boolean;
  /** 点了去哪儿 */
  href?: string;
  /** 未读色点的色调，默认 accent；超时、被退回用 danger、warning */
  tone?: StatusTone;
}

/** 通知的一种类型（筛选按钮） */
export interface NotificationType {
  /** 类型：对应 NotificationItem.type */
  key: string;
  /** 名称 */
  label: string;
}

/** 通知列表的内容与回调：NotificationList 与 NotificationCenter 共用 */
export interface NotificationListOptions {
  /** 通知：新的在前（组件不排序） */
  items: readonly NotificationItem[];
  /** 类型：写了时列表上方有按类型筛选的按钮 */
  types?: readonly NotificationType[];
  /** 这些通知读过了：点了一条、全部标为已读 */
  onRead?: (ids: string[]) => void;
  /** 点了一条（标为已读之后）；有 href 时还会去那里 */
  onItemClick?: (item: NotificationItem) => void;
  /** 列表下面的内容（“查看全部”） */
  footer?: VNodeChild;
  /** 没有通知时显示的内容，默认是“没有通知” */
  empty?: VNodeChild;
  /** 相对时间以哪个时刻为现在（毫秒时间戳），默认此刻；演示数据固定日期时传 */
  now?: number;
}

/** 未声明的属性落到外层 div 上；原生的 title 属性（悬停提示）让给标题 */
export interface NotificationListProps extends PartProps<'div', 'title'>, NotificationListOptions {
  /** 标题，默认“通知”；false 不要标题行（“全部标为已读”挪到筛选那一行） */
  title?: VNodeChild | false;
  /** 标题行的部件属性 */
  propsHead?: PartProps<'div'>;
  /** “全部标为已读”按钮的部件属性 */
  propsMarkAll?: Partial<ButtonProps>;
  /** 筛选行的部件属性 */
  propsFilters?: PartProps<'div'>;
  /** 类型筛选按钮组的部件属性 */
  propsTypes?: Partial<ToggleGroupBaseProps>;
  /** “只看未读”开关的部件属性 */
  propsUnreadOnly?: Partial<SwitchProps>;
  /** 列表（ul）的部件属性 */
  propsList?: PartProps<'ul'>;
  /** 列表外面的滚动区域（ScrollArea）的部件属性：最大高度给它 */
  propsScroll?: Partial<ScrollAreaProps>;
  /** 每一条（a）的部件属性，可以按条计算 */
  propsItem?: PartProps<'a'> | ((item: NotificationItem) => PartProps<'a'>);
  /** 列表为空时那一块的部件属性 */
  propsEmpty?: PartProps<'div'>;
  /** 列表下面那一行的部件属性 */
  propsFooter?: PartProps<'div'>;
}

/**
 * NotificationList 的配方（createUi / Provider 的 components.NotificationList 按它定制）：root、head（标题行）、title、
 * markAll（“全部标为已读”）、filters（筛选行）、types（类型按钮组）、unreadOnly（开关）、scroll（滚动区域）、list、item（一条）、
 * dot（未读色点）、body、itemTitle、description、time、empty、footer。未读、没有标题行时按条叠在部件层之后
 */
export const notificationListRecipe = css.recipe({
  name: 'NotificationList',
  parts: [
    'root',
    'head',
    'title',
    'markAll',
    'filters',
    'types',
    'unreadOnly',
    'scroll',
    'list',
    'item',
    'dot',
    'body',
    'itemTitle',
    'description',
    'time',
    'empty',
    'footer',
  ],
  base: {
    root: { display: 'flex', flexDirection: 'column', minWidth: 0 },
    head: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '_sm',
      paddingBlock: '_sm',
      paddingInline: '_md',
      borderBlockEndWidth: '_xs',
      borderBlockEndStyle: 'solid',
      borderBlockEndColor: '_border',
    },
    title: { fontWeight: '_medium' },
    // 类型多时筛选按钮换行；“只看未读”靠结束边（没有标题行时“全部标为已读”跟在它后面）
    filters: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '_sm',
      paddingBlock: '_sm',
      paddingInline: '_md',
    },
    types: { flexWrap: 'wrap' },
    unreadOnly: { marginInlineStart: 'auto' },
    list: { listStyle: 'none', margin: 0, padding: 0 },
    // 整行贴着滚动区域的边：焦点环画在里面，画在外面会被裁掉
    item: [
      focusRingStyles.inset,
      {
        display: 'grid',
        gridTemplateColumns: '0.5rem minmax(0, 1fr) auto',
        columnGap: '_sm',
        alignItems: 'baseline',
        paddingBlock: '_sm',
        paddingInline: '_md',
        color: 'inherit',
        textDecoration: 'none',
        borderBlockStartWidth: '_xs',
        borderBlockStartStyle: 'solid',
        borderBlockStartColor: '_borderMuted',
        backgroundColor: { default: 'transparent', _hover: '_fillHover' },
        cursor: 'pointer',
      },
    ],
    // 未读的色点贴着标题的第一行
    dot: { display: 'flex', alignItems: 'center', height: '1lh', alignSelf: 'start' },
    body: { display: 'flex', flexDirection: 'column', gap: '_xxs', minWidth: 0 },
    itemTitle: { fontSize: '_sm' },
    description: { color: '_textMuted', fontSize: '_xs' },
    time: { color: '_textMuted', fontSize: '_xs', whiteSpace: 'nowrap' },
    footer: {
      display: 'flex',
      justifyContent: 'center',
      paddingBlock: '_sm',
      borderBlockStartWidth: '_xs',
      borderBlockStartStyle: 'solid',
      borderBlockStartColor: '_border',
    },
    empty: { paddingBlock: '_lg' },
  },
});

/** NotificationList 的部件（createUi / Provider 的 components.NotificationList.styles 按它定制） */
export type NotificationListPart = (typeof notificationListRecipe.parts)[number];

/** 按条变的样式，追加在部件层之后：未读的标题加粗 */
const notificationListStateStyles = css.create({
  unread: { fontWeight: '_semibold' },
});

/** 通知列表：标题行、筛选、通知（新的在前）、底部；直接放在页面、抽屉里，或由 NotificationCenter 放进弹出层 */
export const NotificationList = _component(
  ({
    items,
    types,
    onRead,
    onItemClick,
    footer,
    empty,
    now,
    title,
    propsHead,
    propsMarkAll,
    propsFilters,
    propsTypes,
    propsUnreadOnly,
    propsList,
    propsScroll,
    propsItem,
    propsEmpty,
    propsFooter,
    ...rest
  }: NotificationListProps) => {
    const ui = useComponent(notificationListRecipe, () => ({}));
    const messages = useMessages('patterns', patternsMessages);
    const router = useRouterLink();
    let type = _state('');
    let unreadOnly = _state(false);
    const unread = _derived(items.filter((item) => !item.read).length);
    const shown = _derived(
      items.filter((item) => (!type || item.type === type) && (!unreadOnly || !item.read)),
    );

    function select(item: NotificationItem, event: MouseEvent) {
      if (!item.read) onRead?.([item.id]);
      onItemClick?.(item);
      if (item.href) router.onClick(event, item.href);
    }

    return () => {
      const s = ui().parts;
      const markAll = (
        <Button
          {...mergePartProps<ButtonProps>(
            { ...s.markAll, size: 'xs', variant: 'ghost' },
            propsMarkAll,
            {
              disabled: unread === 0,
              onClick: () => onRead?.(items.filter((item) => !item.read).map((item) => item.id)),
            },
          )}
        >
          {messages.notificationsMarkAllRead}
        </Button>
      );
      return (
        <div {...mergeAttrs<'div'>(s.root, rest)}>
          {title !== false && (
            <div {...mergeAttrs<'div'>(s.head, propsHead)}>
              <span {...mergeAttrs<'span'>(s.title)}>{title ?? messages.notifications}</span>
              {markAll}
            </div>
          )}
          <div {...mergeAttrs<'div'>(s.filters, propsFilters)}>
            {types?.length ? (
              <ToggleGroup
                {...mergePartProps<ToggleGroupBaseProps & SingleSelectionProps>(
                  { ...s.types, size: 'xs', 'aria-label': messages.notifications },
                  propsTypes,
                )}
                _value={type || 'all'}
                onUpdate:_value={(next: string | null) =>
                  (type = !next || next === 'all' ? '' : next)
                }
              >
                <ToggleItem value="all">{messages.notificationsAll}</ToggleItem>
                {types.map((item) => (
                  <ToggleItem key={item.key} value={item.key}>
                    {item.label}
                  </ToggleItem>
                ))}
              </ToggleGroup>
            ) : null}
            <Switch
              {...mergePartProps<SwitchProps>(
                { size: 'sm', propsRoot: s.unreadOnly },
                propsUnreadOnly,
              )}
              _checked={unreadOnly}
            >
              {messages.notificationsUnreadOnly}
            </Switch>
            {title === false && markAll}
          </div>
          {shown.length === 0 ? (
            <div {...mergeAttrs<'div'>(s.empty, propsEmpty)}>
              {empty ?? <Empty size="sm" title={messages.notificationsEmpty} />}
            </div>
          ) : (
            <ScrollArea {...mergePartProps<ScrollAreaProps>(s.scroll, propsScroll)}>
              <ul {...mergeAttrs<'ul'>(s.list, propsList)}>
                {shown.map((item) => (
                  <li key={item.id}>
                    <a
                      {...mergeAttrs<'a'>(
                        s.item,
                        typeof propsItem === 'function' ? propsItem(item) : propsItem,
                        {
                          href: item.href ? router.href(item.href) : undefined,
                          role: item.href ? undefined : 'button',
                          tabindex: 0,
                          onClick: (event: MouseEvent) => select(item, event),
                          onKeydown: (event: KeyboardEvent) => {
                            if (!item.href && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault();
                              select(item, event as unknown as MouseEvent);
                            }
                          },
                        },
                      )}
                      data-state={item.read ? 'read' : 'unread'}
                    >
                      <span {...mergeAttrs<'span'>(s.dot)}>
                        {!item.read && <StatusDot tone={item.tone ?? 'accent'} />}
                      </span>
                      <span {...mergeAttrs<'span'>(s.body)}>
                        <span
                          {...mergeAttrs<'span'>({
                            ...s.itemTitle,
                            sx: [s.itemTitle.sx, !item.read && notificationListStateStyles.unread],
                          })}
                        >
                          {!item.read && (
                            <VisuallyHidden>{messages.notificationUnreadMark} </VisuallyHidden>
                          )}
                          {item.title}
                        </span>
                        {item.description && (
                          <span {...mergeAttrs<'span'>(s.description)}>{item.description}</span>
                        )}
                      </span>
                      <RelativeTime {...s.time} value={item.time} now={now} />
                    </a>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
          {hasContent(footer) && <div {...mergeAttrs<'div'>(s.footer, propsFooter)}>{footer}</div>}
        </div>
      );
    };
  },
);

/** 未声明的属性落到弹出层的面板上 */
export interface NotificationCenterProps
  extends Omit<PopoverProps, 'trigger' | 'children'>, NotificationListOptions {
  /** 铃铛按钮的部件属性 */
  propsTrigger?: Partial<IconButtonProps>;
  /** 面板里的通知列表的部件属性 */
  propsNotificationList?: Partial<NotificationListProps>;
}

/**
 * NotificationCenter 的配方（createUi / Provider 的 components.NotificationCenter 按它定制）：panel（弹出层）、indicator（未读数）、
 * trigger（铃铛按钮）、list（面板里的 NotificationList 的滚动区域：最大高度）
 */
export const notificationCenterRecipe = css.recipe({
  name: 'NotificationCenter',
  parts: ['panel', 'indicator', 'trigger', 'list'],
  base: {
    panel: { width: 'min(26rem, calc(100vw - 2rem))', padding: 0 },
    list: { maxHeight: '24rem' },
  },
});

/** NotificationCenter 的部件（createUi / Provider 的 components.NotificationCenter.styles 按它定制） */
export type NotificationCenterPart = (typeof notificationCenterRecipe.parts)[number];

/** 通知中心：顶栏的铃铛（带未读数），点开是 NotificationList；点了一条就收起 */
export const NotificationCenter = _component(
  ({
    items,
    types,
    onRead,
    onItemClick,
    footer,
    empty,
    now,
    _open: open = _bindable(false),
    propsTrigger,
    propsNotificationList,
    ...rest
  }: NotificationCenterProps) => {
    const ui = useComponent(notificationCenterRecipe, () => ({}));
    const messages = useMessages('patterns', patternsMessages);
    const unread = _derived(items.filter((item) => !item.read).length);
    return () => {
      const s: Readonly<Record<NotificationCenterPart, PartLayer>> = ui().parts;
      return (
        <Popover
          {...mergeProps<PopoverProps>({ ...s.panel, placement: 'bottom-end' }, rest)}
          _open={open}
          trigger={(trigger) => (
            <Indicator {...s.indicator} count={unread} label={messages.notificationsUnread(unread)}>
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  { ...s.trigger, icon: Bell, 'aria-label': messages.notificationsUnread(unread) },
                  propsTrigger,
                  trigger,
                )}
              />
            </Indicator>
          )}
        >
          <NotificationList
            {...mergePartProps<NotificationListProps>(
              { items, propsScroll: s.list },
              propsNotificationList,
              {
                types,
                onRead,
                footer,
                empty,
                now,
                onItemClick: (item: NotificationItem) => {
                  onItemClick?.(item);
                  open = false;
                },
              },
            )}
          />
        </Popover>
      );
    };
  },
);
