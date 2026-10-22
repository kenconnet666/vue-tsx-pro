/**
 * 工作台（首页，按角色；DESIGN.md §6.1）：待我处理（按环节分组，超时的标红，点进收件箱带筛选）、岗位收件箱
 * （待认领、超过 2 个工作日没人认领；负责人另有待指定）、我负责的任务、我发起的、关注（按角色的几个数）、
 * 快捷入口、最近通知。数字只是入口：点进去是对应页签里的那几条
 */
import { BadgeCheck, ChartColumn, FilePlus2, Inbox, type LucideIconData } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Card,
  DeadlineTag,
  Flex,
  Grid,
  gridItemDynamicStyles,
  ItemList,
  ItemListItem,
  Link,
  LinkButton,
  Small,
  Stat,
  StatGroup,
  StatusBadge,
  StatusDot,
  Text,
  useFormat,
  useRequest,
  workdaysBetween,
  type WorkItem,
} from '@vue-tsx-pro/ui';
import { getDashboard } from '../../api/benefit';
import { getMyTasks, getNotifications } from '../../api/session';
import { listWorkItems } from '../../api/workflow';
import { master } from '../../app/master';
import { paths } from '../../app/paths';
import { canDo, currentUser, hasAnyRole } from '../../app/session';
import { workflowVersion } from '../../app/sync';
import { demoNow, TODAY } from '../../domain/clock';
import { groupName, groupsOf } from '../../domain/workflow/groups';
import { costKinds } from '../../shared/kinds';
import { MoreLink } from '../../shared/MoreLink';
import { RequestView } from '../../shared/RequestView';
import { taskStatuses } from '../../shared/statuses';
import { handlerText, processName } from '../../shared/work-item-labels';

const styles = stylex.create({
  page: { paddingBlockEnd: '_xl' },
});

/** 一条待办超时了：还开着、过了截止日 */
const overdue = (item: WorkItem) => item.dueOn != null && item.dueOn < TODAY;

/** 待我处理：按环节分组的条数，超时的单独数 */
function groupByNode(items: readonly WorkItem[]) {
  const groups = new Map<string, { name: string; count: number; overdue: number }>();
  for (const item of items) {
    const group = groups.get(item.name) ?? { name: item.name, count: 0, overdue: 0 };
    group.count++;
    if (overdue(item)) group.overdue++;
    groups.set(item.name, group);
  }
  return [...groups.values()].toSorted((a, b) => b.overdue - a.overdue || b.count - a.count);
}

/** 一个人所在的岗位收件箱的名称 */
const poolNames = (person: ReturnType<typeof currentUser>) =>
  groupsOf(person, master().teams).map((pool) => groupName(pool, master().teams));

/** 一个快捷入口 */
interface Shortcut {
  label: string;
  icon: LucideIconData;
  href: string;
}

/** 工作台 */
export default _component(() => {
  const format = useFormat();
  const me = currentUser();
  const internal = hasAnyRole([
    'cost',
    'pemo',
    'product',
    'project',
    'business',
    'finance',
    'admin',
  ]);
  const mine = useRequest((_version: number, signal) => listWorkItems('mine', signal), {
    params: workflowVersion,
  });
  const pool = useRequest((_version: number, signal) => listWorkItems('pool', signal), {
    params: workflowVersion,
  });
  const started = useRequest((_version: number, signal) => listWorkItems('started', signal), {
    params: workflowVersion,
  });
  const tasks = useRequest((_version: number, signal) => getMyTasks(signal), {
    params: workflowVersion,
  });
  const notices = useRequest((_version: number, signal) => getNotifications(signal), {
    params: workflowVersion,
  });
  // 关注：单机降本的几个数（看板的“需要处理”）
  const board = useRequest((_: undefined, signal) => getDashboard('unit', signal), {
    enabled: () => internal,
  });

  const shortcuts = (): Shortcut[] => [
    ...(canDo('task.create')
      ? [
          { label: '新建单机降本项目', icon: FilePlus2, href: paths.newTask('unit') },
          { label: '新建降 DMC 项目', icon: FilePlus2, href: paths.newTask('dmc') },
        ]
      : []),
    ...(internal
      ? [
          { label: '收件箱', icon: Inbox, href: paths.inbox() },
          { label: '收益认定', icon: BadgeCheck, href: paths.confirm() },
          { label: '统计看板', icon: ChartColumn, href: paths.dashboard() },
        ]
      : []),
  ];

  /** 关注：按角色挑看板里的几个数 */
  const watches = (): { label: string; value: number; urgent: boolean; href: string }[] => {
    const todos = board.data?.todos;
    if (!todos) return [];
    const roles = me.roles;
    const list: { label: string; value: number; urgent: boolean; href: string }[] = [];
    if (roles.includes('pemo') || roles.includes('admin'))
      list.push(
        {
          label: '超时',
          value: todos.overdue,
          urgent: true,
          href: paths.ledger('unit', { view: 'overdue' }),
        },
        {
          label: '可关闭',
          value: todos.closable,
          urgent: false,
          href: paths.ledger('unit', { view: 'closable' }),
        },
      );
    if (roles.includes('cost'))
      list.push(
        {
          label: '待认定',
          value: todos.awaiting,
          urgent: false,
          href: paths.confirm({ kind: 'unit' }),
        },
        {
          label: '认定超期',
          value: todos.confirmOverdue,
          urgent: true,
          href: paths.confirm({ kind: 'unit' }),
        },
      );
    if (roles.includes('product'))
      list.push(
        {
          label: '7 天内到期',
          value: todos.soon,
          urgent: false,
          href: paths.ledger('unit', { view: 'soon' }),
        },
        {
          label: '关闭材料不全',
          value: todos.missing,
          urgent: false,
          href: paths.ledger('unit', { view: 'missing' }),
        },
      );
    if (list.length === 0)
      list.push(
        {
          label: '超时',
          value: todos.overdue,
          urgent: true,
          href: paths.ledger('unit', { view: 'overdue' }),
        },
        {
          label: '待认定',
          value: todos.awaiting,
          urgent: false,
          href: paths.confirm({ kind: 'unit' }),
        },
      );
    return list;
  };

  return () => {
    const poolItems = pool.data?.items ?? [];
    const stale = poolItems.filter(
      (item) => workdaysBetween(item.createdAt.slice(0, 10), TODAY) >= 2,
    ).length;
    const counts = mine.data?.counts;
    const leads = me.leads ?? [];
    return (
      <Flex direction="column" gap="md" sx={styles.page}>
        <Flex align="baseline" gap="sm" wrap>
          <Text size="xl" weight="semibold">
            {me.name}，你好
          </Text>
          <Small tone="muted">
            {me.title} · 今天是 {format.date(TODAY, { dateStyle: 'full' })}
          </Small>
        </Flex>
        <Grid columns={12} gap="md">
          {/* 待我处理：按环节分组，点进收件箱带筛选 */}
          <Card
            padding="md"
            sx={gridItemDynamicStyles.span(5)}
            header={`待我处理（${counts?.mine ?? '…'}）`}
            extra={<MoreLink href={paths.inbox({ view: 'mine' })}>打开收件箱</MoreLink>}
          >
            <RequestView request={mine}>
              {({ items }) =>
                items.length ? (
                  <ItemList divided density="compact">
                    {groupByNode(items).map((group) => (
                      <ItemListItem
                        key={group.name}
                        title={
                          <Link href={paths.inbox({ view: 'mine', q: group.name })}>
                            {group.name}
                          </Link>
                        }
                        description={group.overdue ? `其中超时 ${group.overdue} 条` : '都在时限内'}
                        end={
                          <Text
                            numeric
                            weight="semibold"
                            tone={group.overdue > 0 ? 'danger' : undefined}
                          >
                            {group.count} 条
                          </Text>
                        }
                      />
                    ))}
                  </ItemList>
                ) : (
                  <Small tone="muted">手上没有待办</Small>
                )
              }
            </RequestView>
          </Card>

          {/* 岗位收件箱：待认领、超过 2 个工作日没人认领；负责人另有待指定 */}
          <Card padding="md" sx={gridItemDynamicStyles.span(4)} header="岗位收件箱">
            <StatGroup minItemWidth="7rem">
              <Stat
                label="待认领"
                value={counts?.pool ?? 0}
                unit="条"
                footer={<Link href={paths.inbox({ view: 'pool' })}>去认领</Link>}
              />
              <Stat
                label="超 2 个工作日没人认领"
                value={stale}
                unit="条"
                tone={stale > 0 ? 'danger' : undefined}
                footer={<Small tone="muted">超 3 个工作日转负责人指定</Small>}
              />
              {leads.length > 0 && (
                <Stat
                  label="待指定"
                  value={counts?.designate ?? 0}
                  unit="条"
                  tone={(counts?.designate ?? 0) > 0 ? 'danger' : undefined}
                  footer={<Link href={paths.inbox({ view: 'designate' })}>去指定</Link>}
                />
              )}
            </StatGroup>
            <Small tone="muted">我所在：{poolNames(me).join('、') || '—'}</Small>
          </Card>

          {/* 快捷入口 */}
          <Card padding="md" sx={gridItemDynamicStyles.span(3)} header="快捷入口">
            <Flex direction="column" gap="xs" align="stretch">
              {shortcuts().map((item) => (
                <LinkButton
                  key={item.label}
                  href={item.href}
                  icon={item.icon}
                  variant="soft"
                  tone="neutral"
                >
                  {item.label}
                </LinkButton>
              ))}
            </Flex>
          </Card>

          {/* 我负责的任务：按计划完成排 */}
          <Card
            padding="md"
            sx={gridItemDynamicStyles.span(5)}
            header={`我负责的任务（${tasks.data?.length ?? '…'}）`}
          >
            <RequestView request={tasks}>
              {(list) =>
                list.length ? (
                  <ItemList divided density="compact">
                    {list.slice(0, 6).map((task) => (
                      <ItemListItem
                        key={task.code}
                        title={<Link href={paths.task(task.code)}>{task.name}</Link>}
                        description={`${task.code} · ${costKinds[task.kind].label}`}
                        end={
                          <>
                            <StatusBadge statuses={taskStatuses} value={task.status} />
                            <DeadlineTag due={task.due} today={TODAY} soon={5} />
                          </>
                        }
                      />
                    ))}
                  </ItemList>
                ) : (
                  <Small tone="muted">没有我主办、还没结束的任务</Small>
                )
              }
            </RequestView>
          </Card>

          {/* 我发起的：在哪个环节、谁在处理、何时答复 */}
          <Card
            padding="md"
            sx={gridItemDynamicStyles.span(4)}
            header="我发起的"
            extra={<MoreLink href={paths.inbox({ view: 'started' })}>全部</MoreLink>}
          >
            <RequestView request={started}>
              {({ items }) =>
                items.length ? (
                  <ItemList divided density="compact">
                    {items.slice(0, 6).map((item) => (
                      <ItemListItem
                        key={item.id}
                        title={
                          <Link href={paths.inbox({ view: 'started', item: item.id })}>
                            {item.businessKey} · {item.title}
                          </Link>
                        }
                        description={`${processName(item.processKey)} · ${item.name} · ${handlerText(item)}`}
                        end={<DeadlineTag due={item.dueOn} today={TODAY} />}
                      />
                    ))}
                  </ItemList>
                ) : (
                  <Small tone="muted">没有在流转中的</Small>
                )
              }
            </RequestView>
          </Card>

          {/* 关注：按角色的几个数（单机降本） */}
          {internal && (
            <Card padding="md" sx={gridItemDynamicStyles.span(3)} header="关注（单机降本）">
              <StatGroup minItemWidth="7rem">
                {watches().map((item) => (
                  <Stat
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    unit="项"
                    tone={item.urgent && item.value > 0 ? 'danger' : undefined}
                    footer={<Link href={item.href}>去看看</Link>}
                  />
                ))}
              </StatGroup>
            </Card>
          )}

          {/* 最近通知 */}
          <Card padding="md" sx={gridItemDynamicStyles.span(12)} header="最近通知">
            <RequestView request={notices}>
              {(list) =>
                list.length ? (
                  <ItemList divided density="compact">
                    {list.slice(0, 5).map((notice) => (
                      <ItemListItem
                        key={notice.id}
                        align="start"
                        start={
                          <StatusDot
                            tone={notice.read ? 'neutral' : notice.tone}
                            label={notice.read ? undefined : '未读'}
                          />
                        }
                        title={
                          <Link href={paths.inbox({ view: notice.view, item: notice.workItem })}>
                            {notice.title}
                          </Link>
                        }
                        description={notice.description}
                        end={
                          <Small tone="muted">
                            {format.relative(notice.time, { now: demoNow() })}
                          </Small>
                        }
                      />
                    ))}
                  </ItemList>
                ) : (
                  <Small tone="muted">没有通知</Small>
                )
              }
            </RequestView>
          </Card>
        </Grid>
      </Flex>
    );
  };
});
