/**
 * 顶栏的工作台入口：我的待办（收件箱）、我负责的任务、通知。图标按钮右上角是条数，点开看最近几条；
 * 认领、处理之后（流程变了的信号）各自重新取
 */
import { Inbox, ListTodo } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  DeadlineTag,
  IconButton,
  Indicator,
  Link,
  NotificationCenter,
  Popover,
  Small,
  StatusBadge,
  Text,
  useRequest,
  type IconData,
} from '@vue-tsx-pro/ui';
import { watch, type VNodeChild } from 'vue';
import { getMyTasks, getNotifications, markNotificationsRead } from '../../api/session';
import { listWorkItems } from '../../api/workflow';
import { demoNow, TODAY } from '../../domain/clock';
import { daysToDue } from '../../domain/task/status';
import { processOf } from '../../domain/workflow';
import { notificationTypes } from '../../domain/workflow/notifications';
import { taskStatuses } from '../../shared/statuses';
import { notifyError } from '../feedback';
import { paths } from '../paths';
import { workflowVersion } from '../sync';

const styles = stylex.create({
  panel: { width: '24rem', padding: 0 },
  panelHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
  },
  list: { listStyle: 'none', margin: 0, padding: 0 },
  item: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'start',
    columnGap: '_sm',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
    backgroundColor: { default: null, ':hover': '_fillHover' },
  },
  dot: { width: '0.5rem', height: '0.5rem', marginBlockStart: '0.45em', borderRadius: '_full' },
  accent: { backgroundColor: '_accent' },
  warning: { backgroundColor: '_warning' },
  danger: { backgroundColor: '_danger' },
  itemText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  panelFoot: { display: 'flex', justifyContent: 'center', paddingBlock: '_sm' },
});

/** 计划完成的说明：逾期几天、还剩几天 */
function dueText(due: string): { text: string; tone: 'danger' | 'warning' | 'muted' } {
  const days = daysToDue({ due });
  if (days < 0) return { text: `逾期 ${-days} 天`, tone: 'danger' };
  if (days === 0) return { text: '今天到期', tone: 'warning' };
  return { text: `还剩 ${days} 天`, tone: days <= 7 ? 'warning' : 'muted' };
}

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
        <div {...stylex.attrs(styles.panelHead)}>
          <Text size="sm" weight="semibold">
            {label}
          </Text>
          <Small tone="muted">{count ?? '…'} 项</Small>
        </div>
        <ul {...stylex.attrs(styles.list)}>{children}</ul>
        <div {...stylex.attrs(styles.panelFoot)}>
          <Link href={actionHref}>{action}</Link>
        </div>
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
          <li key={item.id} {...stylex.attrs(styles.item)}>
            <span
              {...stylex.attrs(
                styles.dot,
                item.arrival === 'return' || item.arrival === 'escalate'
                  ? styles.warning
                  : styles.accent,
              )}
            />
            <span {...stylex.attrs(styles.itemText)}>
              <Link href={paths.inbox({ item: item.id })}>{item.name}</Link>
              <Small tone="muted">
                {item.businessKey} · {processOf(item.processKey)?.name ?? item.processKey}
              </Small>
            </span>
            <DeadlineTag due={item.dueOn} today={TODAY} />
          </li>
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
  const tasks = useRequest((_: undefined, signal) => getMyTasks(signal));
  return () => (
    <Tray
      icon={ListTodo}
      label="我负责的任务"
      count={tasks.data?.length}
      action={`查看全部 ${tasks.data?.length ?? ''} 项`}
      actionHref={paths.ledger('unit')}
    >
      {tasks.data?.slice(0, 5).map((task) => {
        const due = dueText(task.due);
        return (
          <li key={task.code} {...stylex.attrs(styles.item)}>
            <StatusBadge statuses={taskStatuses} value={task.status} />
            <span {...stylex.attrs(styles.itemText)}>
              <Link href={paths.task(task.code)}>{task.name}</Link>
              <Small tone="muted">
                {task.code} · 截止 {task.due}
              </Small>
            </span>
            <Small tone={due.tone}>{due.text}</Small>
          </li>
        );
      })}
    </Tray>
  );
});
