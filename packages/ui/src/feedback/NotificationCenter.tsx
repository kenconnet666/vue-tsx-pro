/**
 * 通知中心：顶栏的铃铛，右上角是未读数，点开是通知列表（新的在前）。按类型筛选、只看未读、全部标为已读；
 * 点一条标为已读并去它的地址（走路由适配）。通知存在哪、何时算已读由应用决定：组件只报告 onRead。
 *
 *   <NotificationCenter
 *     items={notices}                                       // { id, title, description?, time, type?, read, href?, tone? }
 *     types={[{ key: 'todo', label: '待办' }, { key: 'remind', label: '催办' }]}
 *     onRead={(ids) => markRead(ids)}
 *     footer={<Link href="/inbox">打开收件箱</Link>}
 *   />
 *
 * 时间写成相对现在（3 分钟前、昨天），悬停看完整时间。未读的前面一个色点（tone 决定颜色，默认 accent），
 * 读屏念“未读”。列表为空时显示 empty（默认“没有通知”）。和 Toast 的分工：Toast 是此刻发生的事、几秒后消失；
 * 通知中心是留着、可以回头看的。
 */
import { Bell } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { Indicator } from '../base/Indicator';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { Switch } from '../input/Switch';
import { ToggleGroup, ToggleItem } from '../input/ToggleGroup';
import { Popover, type PopoverProps } from '../overlay/Popover';
import { useRouterLink } from '../utils/dom/link';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import type { StatusTone } from '../utils/style/tone-styles';
import { StatusDot } from '../display/StatusDot';
import { Empty } from './Empty';

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

/** 未声明的属性落到弹出层的面板上 */
export interface NotificationCenterProps extends Omit<PopoverProps, 'trigger' | 'children'> {
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
  /** 铃铛按钮的部件属性 */
  propsTrigger?: Partial<IconButtonProps>;
  /** 列表（ul）的部件属性 */
  propsList?: PartProps<'ul'>;
}

/** NotificationCenter 的样式：panel、head、list、item、dot… */
export const notificationCenterStyles = stylex.create({
  panel: { width: 'min(24rem, calc(100vw - 2rem))', padding: 0 },
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
  title: { fontWeight: '_semibold' },
  // 类型多时筛选按钮换行；“只看未读”总在最后、靠结束边
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
  list: { listStyle: 'none', margin: 0, padding: 0, maxHeight: '24rem', overflowY: 'auto' },
  item: {
    display: 'grid',
    gridTemplateColumns: '0.5rem minmax(0, 1fr)',
    columnGap: '_sm',
    paddingBlock: '_sm',
    paddingInline: '_md',
    color: 'inherit',
    textDecoration: 'none',
    borderBlockStartWidth: '_xs',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_borderMuted',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    cursor: 'pointer',
  },
  // 未读的色点贴着标题的第一行
  dot: { display: 'flex', alignItems: 'center', height: '1lh' },
  body: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  itemTitle: { fontSize: '_sm' },
  itemTitleUnread: { fontWeight: '_semibold' },
  muted: { color: '_textMuted', fontSize: '_xs' },
  foot: {
    display: 'flex',
    justifyContent: 'center',
    paddingBlock: '_sm',
    borderBlockStartWidth: '_xs',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_border',
  },
  empty: { paddingBlock: '_lg' },
});

/** 通知中心 */
export const NotificationCenter = _component(
  ({
    items,
    types,
    onRead,
    onItemClick,
    footer,
    empty,
    now,
    open = _bindable(false),
    propsTrigger,
    propsList,
    sx,
    ...rest
  }: NotificationCenterProps) => {
    const lang = useLang();
    const format = useFormat();
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
      open = false;
    }

    return () => (
      <Popover
        {...rest}
        placement={rest.placement ?? 'bottom-end'}
        sx={[notificationCenterStyles.panel, sx]}
        open={_bind(open)}
        trigger={(trigger) => (
          <Indicator count={unread} label={lang.notificationsUnread(unread)}>
            <IconButton
              {...mergePartProps<IconButtonProps>(
                { icon: Bell, 'aria-label': lang.notificationsUnread(unread) },
                propsTrigger,
                trigger,
              )}
            />
          </Indicator>
        )}
      >
        <div {...stylex.attrs(notificationCenterStyles.head)}>
          <span {...stylex.attrs(notificationCenterStyles.title)}>{lang.notifications}</span>
          <Button
            size="xs"
            variant="ghost"
            disabled={unread === 0}
            onClick={() => onRead?.(items.filter((item) => !item.read).map((item) => item.id))}
          >
            {lang.notificationsMarkAllRead}
          </Button>
        </div>
        <div {...stylex.attrs(notificationCenterStyles.filters)}>
          {types?.length ? (
            <ToggleGroup
              size="xs"
              sx={notificationCenterStyles.types}
              aria-label={lang.notifications}
              value={_bind(
                () => type || 'all',
                (next: string | null) => (type = !next || next === 'all' ? '' : next),
              )}
            >
              <ToggleItem value="all">{lang.notificationsAll}</ToggleItem>
              {types.map((item) => (
                <ToggleItem key={item.key} value={item.key}>
                  {item.label}
                </ToggleItem>
              ))}
            </ToggleGroup>
          ) : null}
          <Switch size="sm" checked={_bind(unreadOnly)} sx={notificationCenterStyles.unreadOnly}>
            {lang.notificationsUnreadOnly}
          </Switch>
        </div>
        {shown.length === 0 ? (
          <div {...stylex.attrs(notificationCenterStyles.empty)}>
            {empty ?? <Empty size="sm" title={lang.notificationsEmpty} />}
          </div>
        ) : (
          <ul {...mergeAttrs<'ul'>({ sx: notificationCenterStyles.list }, propsList)}>
            {shown.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href ? router.href(item.href) : undefined}
                  role={item.href ? undefined : 'button'}
                  tabindex={0}
                  {...stylex.attrs(notificationCenterStyles.item, focusRingStyles.visible)}
                  data-state={item.read ? 'read' : 'unread'}
                  onClick={(event: MouseEvent) => select(item, event)}
                  onKeydown={(event: KeyboardEvent) => {
                    if (!item.href && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      select(item, event as unknown as MouseEvent);
                    }
                  }}
                >
                  <span {...stylex.attrs(notificationCenterStyles.dot)}>
                    {!item.read && <StatusDot tone={item.tone ?? 'accent'} />}
                  </span>
                  <span {...stylex.attrs(notificationCenterStyles.body)}>
                    <span
                      {...stylex.attrs(
                        notificationCenterStyles.itemTitle,
                        !item.read && notificationCenterStyles.itemTitleUnread,
                      )}
                    >
                      {!item.read && (
                        <VisuallyHidden>{lang.notificationUnreadMark} </VisuallyHidden>
                      )}
                      {item.title}
                    </span>
                    {item.description && (
                      <span {...stylex.attrs(notificationCenterStyles.muted)}>
                        {item.description}
                      </span>
                    )}
                    <time
                      datetime={item.time}
                      title={format.date(item.time, { dateStyle: 'medium', timeStyle: 'short' })}
                      {...stylex.attrs(notificationCenterStyles.muted)}
                    >
                      {format.relative(item.time, { now })}
                    </time>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {footer != null && <div {...stylex.attrs(notificationCenterStyles.foot)}>{footer}</div>}
      </Popover>
    );
  },
);
