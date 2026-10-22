/**
 * 顶栏的工作台入口：收件箱与我负责的任务。图标按钮右上角是条数，点开看最近几条
 */
import { Inbox, ListTodo } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  IconButton,
  Indicator,
  Link,
  Popover,
  Small,
  StatusBadge,
  Text,
  useRequest,
  type IconData,
} from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';
import { getMyInbox, getMyTasks } from '../../api/session';
import { daysToDue } from '../../domain/task/status';
import { taskStatuses } from '../../shared/statuses';
import { paths } from '../paths';

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

/** 收件箱：流转到我岗位的事 */
export const InboxTray = _component(() => {
  const inbox = useRequest((_: undefined, signal) => getMyInbox(signal));
  return () => (
    <Tray
      icon={Inbox}
      label="我的收件箱"
      count={inbox.data?.length}
      action="打开收件箱"
      actionHref={`${paths.spec()}#page-inbox`}
    >
      {inbox.data?.map((message) => (
        <li key={message.id} {...stylex.attrs(styles.item)}>
          <span {...stylex.attrs(styles.dot, styles[message.tone])} />
          <span {...stylex.attrs(styles.itemText)}>
            <Text size="sm">{message.title}</Text>
            <Small tone="muted">{message.meta}</Small>
          </span>
          <Small tone="muted">{message.time}</Small>
        </li>
      ))}
    </Tray>
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
