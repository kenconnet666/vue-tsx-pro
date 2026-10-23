/**
 * 顶栏的工作台入口：我的待办（收件箱）、我负责的任务、通知。图标按钮右上角是条数，点开看最近几条；
 * 认领、处理之后（流程变了的信号）各自重新取
 */
import { Inbox, ListTodo } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Card,
  IconButton,
  Indicator,
  ItemList,
  ItemListItem,
  Link,
  Popover,
  Small,
  StatusBadge,
  StatusDot,
  Text,
  useRequest,
  type IconData,
} from '@vue-tsx-pro/ui';
import { DeadlineBadge, NotificationCenter } from '@vue-tsx-pro/ui/patterns';
import { watch, type VNodeChild } from 'vue';
import { getMyTasks, getNotifications, markNotificationsRead } from '../../api/session';
import { listWorkItems } from '../../api/workflow';
import { demoNow, TODAY } from '../../domain/clock';
import { processOf } from '../../domain/workflow';
import { notificationTypes } from '../../domain/workflow/notifications';
import { taskStatuses } from '../../shared/statuses';
import { notifyError } from '../feedback';
import { paths } from '../paths';
import { workflowVersion } from '../sync';

const styles = stylex.create({
  // 弹出层自己不留内边距：里面的卡片给
  panel: { width: '24rem', padding: 0 },
});

/** 一个工作台入口：图标按钮、右上角的条数，点开是列表 */
const Tray = _component(
  ({
    icon,
    label,
    count,
    action,
    actionHref,
    children,
  }: {
    icon: IconData;
    label: string;
    /** 条数；还没取回时为 undefined */
    count: number | undefined;
    action: string;
    actionHref: string;
    /** ItemListItem */
    children?: VNodeChild;
  }) =>
    () => (
      <Popover
        placement="bottom-end"
        sx={styles.panel}
        trigger={(trigger) => (
          <Indicator count={count ?? 0} label={`${label}：${count ?? 0} 项`}>
            <IconButton {...trigger} icon={icon} aria-label={label} />
          </Indicator>
        )}
      >
        <Card
          variant="ghost"
          padding="sm"
          header={
            <Text size="sm" weight="semibold">
              {label}
            </Text>
          }
          extra={<Small tone="muted">{count ?? '…'} 项</Small>}
          footer={<Link href={actionHref}>{action}</Link>}
        >
          <ItemList divided hoverable>
            {children}
          </ItemList>
        </Card>
      </Popover>
    ),
);

/** 我的待办：认领的、指定给我的、流程直接给我的；最早到的在前 */
export const InboxTray = _component(() => {
  const inbox = useRequest((_version: number, signal) => listWorkItems('mine', signal), {
    params: workflowVersion,
  });
  return () => {
    const items = inbox.data?.items;
    return (
      <Tray
        icon={Inbox}
        label="我的待办"
        count={items?.length}
        action="打开收件箱"
        actionHref={paths.inbox()}
      >
        {items?.slice(0, 5).map((item) => (
          <ItemListItem
            key={item.id}
            align="start"
            // 退回、提级来的醒目一些
            start={
              <StatusDot
                tone={
                  item.arrival === 'return' || item.arrival === 'escalate' ? 'warning' : 'accent'
                }
              />
            }
            title={<Link href={paths.inbox({ item: item.id })}>{item.name}</Link>}
            description={`${item.businessKey} · ${processOf(item.processKey)?.name ?? item.processKey}`}
            end={<DeadlineBadge due={item.dueOn} today={TODAY} />}
          />
        ))}
      </Tray>
    );
  };
});

/** 通知：新的待办、被退回、提级、催办、超时、待指定；打开时重新取 */
export const NotificationTray = _component(() => {
  const notices = useRequest((_version: number, signal) => getNotifications(signal), {
    params: workflowVersion,
  });
  let open = _state(false);
  watch(
    () => open,
    (value) => {
      if (value) void notices.refresh();
    },
  );
  async function read(ids: string[]) {
    try {
      await markNotificationsRead(ids);
      await notices.refresh();
    } catch (error) {
      notifyError('没能标为已读', error);
    }
  }
  return () => (
    <NotificationCenter
      open={_bind(open)}
      items={(notices.data ?? []).map((notice) => ({
        ...notice,
        href: paths.inbox({ view: notice.view, item: notice.workItem }),
      }))}
      types={notificationTypes}
      onRead={(ids) => void read(ids)}
      now={demoNow()}
      footer={<Link href={paths.inbox()}>打开收件箱</Link>}
    />
  );
});

/** 我负责的任务：我主办、还没结束的，最近到期的在前 */
export const MyTasksTray = _component(() => {
  const tasks = useRequest((_version: number, signal) => getMyTasks(signal), {
    params: workflowVersion,
  });
  return () => (
    <Tray
      icon={ListTodo}
      label="我负责的任务"
      count={tasks.data?.length}
      action={`查看全部 ${tasks.data?.length ?? ''} 项`}
      actionHref={paths.ledger('unit')}
    >
      {tasks.data?.slice(0, 5).map((task) => (
        <ItemListItem
          key={task.code}
          align="start"
          start={<StatusBadge statuses={taskStatuses} value={task.status} />}
          title={<Link href={paths.task(task.code)}>{task.name}</Link>}
          description={`${task.code} · 截止 ${task.due}`}
          end={<DeadlineBadge due={task.due} today={TODAY} soon={5} />}
        />
      ))}
    </Tray>
  );
});
