/**
 * 统计看板（首页）：口径按《需求定义方案》“收益测算与一本账”，数据由后端按同一套算法算好（dashboardSummary）。
 * 数字都能点：表格里是链接；图表点了下钻（鼠标的捷径），同样的去处在卡片标题旁另有链接
 */
import {
  AlarmClock,
  BadgeCheck,
  CalendarClock,
  FileWarning,
  Hourglass,
  PackageCheck,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  Flex,
  Grid,
  gridItemDynamicStyles,
  gridItemStyles,
  Link,
  Small,
  ProportionBar,
  Stat,
  StatGroup,
  StatusBadge,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabList,
  Tabs,
  Text,
  useConfig,
  useFormat,
  useRequest,
  type IconData,
} from '@vue-tsx-pro/ui';
import { BarChart, FunnelChart, LineChart, WaterfallChart } from '@vue-tsx-pro/ui/charts';
import { getDashboard } from '../../api/benefit';
import { PageNav } from '../../app/layout/PageNav';
import { dict, shortTeam } from '../../app/master';
import { paths } from '../../app/paths';
import {
  pricedStates,
  valueStateOrder,
  type DashboardSummary,
  type DashboardTodos,
} from '../../domain/ledger/dashboard';
import { statusGroups } from '../../domain/task/status';
import type { CostKind } from '../../domain/task/types';
import { costKindKeys, costKinds } from '../../shared/kinds';
import { MoreLink } from '../../shared/MoreLink';
import { RequestView } from '../../shared/RequestView';
import { taskStatuses, valueStates } from '../../shared/statuses';

/** 三桶的色调：已确认收益是好事，挂账待定要盯，方案待定是在路上 */
const bucketTones = { confirmed: 'success', unpriced: 'warning', plan: 'info' } as const;

/** 需要处理的一项：名称、图标、是否紧急（有数时标红）、去哪儿处理 */
const todoItems = (
  kind: CostKind,
): {
  key: keyof DashboardTodos;
  label: string;
  icon: IconData;
  urgent: boolean;
  href: string;
}[] => [
  {
    key: 'overdue',
    label: '超时',
    icon: AlarmClock,
    urgent: true,
    href: paths.ledger(kind, { view: 'overdue' }),
  },
  {
    key: 'soon',
    label: '7 天内到期',
    icon: CalendarClock,
    urgent: false,
    href: paths.ledger(kind, { view: 'soon' }),
  },
  {
    key: 'awaiting',
    label: '待认定',
    icon: BadgeCheck,
    urgent: false,
    href: paths.confirm({ kind, tab: 'awaiting' }),
  },
  {
    key: 'confirmOverdue',
    label: '认定超期',
    icon: Hourglass,
    urgent: true,
    href: paths.confirm({ kind, tab: 'awaiting' }),
  },
  {
    key: 'closable',
    label: '可关闭',
    icon: PackageCheck,
    urgent: false,
    href: paths.ledger(kind, { view: 'closable' }),
  },
  {
    key: 'missing',
    label: '关闭材料不全',
    icon: FileWarning,
    urgent: false,
    href: paths.ledger(kind, { view: 'missing' }),
  },
];

/** 推进漏斗的环节点进哪里：有对应页签的环节才能点 */
const progressHref = (kind: CostKind, key: string) =>
  ({
    pool: paths.ledger(kind),
    realized: paths.ledger(kind, { view: 'realized' }),
    closed: paths.ledger(kind, { view: 'closed' }),
  })[key];

/** 一种降本类型的看板 */
const Board = _component(({ summary }: { summary: DashboardSummary }) => {
  const format = useFormat();
  const router = useConfig().router;
  const go = (href: string | undefined) => {
    if (href) router?.navigate(href);
  };
  return () => {
    const { kind } = summary;
    const amount = costKinds[kind];
    const money = (value: Parameters<typeof format.number>[0]) =>
      format.number(value, amount.format);
    return (
      <Grid columns={12} gap="md">
        {/* 需要处理：件数在这里，点进去是对应页签里的那几项 */}
        <Card padding="md" sx={gridItemStyles.full} header="需要处理">
          <StatGroup>
            {todoItems(kind).map((item) => {
              const count = summary.todos[item.key];
              return (
                <Stat
                  key={item.key}
                  label={item.label}
                  icon={item.icon}
                  value={count}
                  unit="项"
                  tone={item.urgent && count > 0 ? 'danger' : undefined}
                  footer={
                    count > 0 ? (
                      <MoreLink href={item.href}>去处理</MoreLink>
                    ) : (
                      <Small tone="muted">没有</Small>
                    )
                  }
                />
              );
            })}
          </StatGroup>
        </Card>

        {/* 三桶：任务池总数只在这里出现一次 */}
        <Card padding="md" sx={gridItemDynamicStyles.span(6)} header="任务池构成">
          <Flex direction="column" gap="md">
            <Stat
              label="任务池"
              value={summary.pool}
              unit="项"
              description={`三桶互斥，加总等于总数（终止 ${summary.terminated} 项回流储备库，不计入）`}
            />
            <ProportionBar
              aria-label="任务池的三桶"
              segments={summary.buckets.map((bucket) => ({
                key: bucket.value,
                label: bucket.label,
                value: bucket.count,
                tone: bucketTones[bucket.value as keyof typeof bucketTones],
              }))}
              valueText={(segment) => `${segment.value} 项`}
              legendExtra={(segment) =>
                segment.key === 'unpriced' && <Small tone="muted">待定价</Small>
              }
            />
          </Flex>
        </Card>

        {/* 三种收益分开挂账：各自的金额与条数，不相加；金额与一本账一致，点进去看一本账 */}
        {summary.states.map((item) => (
          <Card
            key={item.state}
            padding="md"
            sx={gridItemDynamicStyles.span(2)}
            header={valueStates.label(item.state)}
          >
            <Stat
              label={`${item.count} 项`}
              value={item.amount.toNumber()}
              format={amount.format}
              unit={amount.unit}
              footer={<MoreLink href={paths.valueLedger({ kind })}>看一本账</MoreLink>}
            />
          </Card>
        ))}

        {/* 预期与实际：按月累计，年度指标是目标线；实际值到今天为止 */}
        <Card
          padding="md"
          sx={gridItemDynamicStyles.span(8)}
          header={`预期与实际（今年按月累计，${amount.unit}）`}
          extra={<MoreLink href={paths.valueLedger({ kind })}>看一本账</MoreLink>}
        >
          <LineChart
            aria-label="今年按月累计的预期与实际降本"
            data={summary.monthly}
            index="month"
            series={[
              { key: 'expected', label: '预期（按计划完成月）' },
              { key: 'realized', label: '实际（按收益确认月）', color: 'success' },
            ]}
            valueFormat={amount.format}
            targets={summary.target ? [{ value: summary.target, label: '年度指标' }] : []}
            dots="hollow"
            height={200}
          />
        </Card>

        {/* 推进漏斗：按里程碑逐级筛下去，看卡在哪一步 */}
        <Card padding="md" sx={gridItemDynamicStyles.span(4)} header="推进漏斗（项）">
          <FunnelChart
            aria-label="任务的推进漏斗"
            stages={summary.progress.map((stage) => ({ label: stage.label, value: stage.count }))}
            onItemClick={(_stage, index) => go(progressHref(kind, summary.progress[index]!.key))}
          />
        </Card>

        {/* 进度 × 收益状态：行与台账的页签一致，格子跳到“页签 + 收益状态” */}
        <Card padding="md" sx={gridItemDynamicStyles.span(7)} header="进度 × 收益状态（项）">
          <Table aria-label="进度与收益状态" density="compact" variant="ghost">
            <TableHead>
              <TableRow>
                <TableHeaderCell>进度</TableHeaderCell>
                {valueStateOrder.map((state) => (
                  <TableHeaderCell key={state} align="end">
                    <StatusBadge statuses={valueStates} value={state} />
                  </TableHeaderCell>
                ))}
                <TableHeaderCell align="end">小计</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.matrix.map((row) => (
                <TableRow key={row.group}>
                  <TableHeaderCell scope="row">{row.label}</TableHeaderCell>
                  {valueStateOrder.map((state) => (
                    <TableCell key={state} align="end">
                      {row.counts[state] ? (
                        <Link href={paths.ledger(kind, { view: row.group, valueState: state })}>
                          <Text numeric>{row.counts[state]}</Text>
                        </Link>
                      ) : (
                        <Small tone="muted">—</Small>
                      )}
                    </TableCell>
                  ))}
                  <TableCell align="end">
                    <Link href={paths.ledger(kind, { view: row.group })}>
                      <Text numeric>{row.total}</Text>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFoot>
              <TableRow>
                <TableHeaderCell scope="row">小计</TableHeaderCell>
                {valueStateOrder.map((state) => (
                  <TableCell key={state} align="end">
                    <Text numeric>{summary.stateTotals[state]}</Text>
                  </TableCell>
                ))}
                {/* 总数已在“任务池构成”里：这里不再重复 */}
                <TableCell align="end">
                  <Small tone="muted">—</Small>
                </TableCell>
              </TableRow>
            </TableFoot>
          </Table>
        </Card>

        {/* 超时最久的几项：直接去详情推进 */}
        <Card
          padding="md"
          sx={gridItemDynamicStyles.span(5)}
          header="超时最久的项目"
          extra={<MoreLink href={paths.ledger(kind, { view: 'overdue' })}>全部超时</MoreLink>}
        >
          {summary.late.length ? (
            <Table aria-label="超时最久的项目" density="compact" variant="ghost">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>编码</TableHeaderCell>
                  <TableHeaderCell>项目名称</TableHeaderCell>
                  <TableHeaderCell>状态</TableHeaderCell>
                  <TableHeaderCell align="end">超时</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.late.map((task) => (
                  <TableRow key={task.code}>
                    <TableCell>
                      <Link href={paths.task(task.code)}>
                        <Text mono size="sm">
                          {task.code}
                        </Text>
                      </Link>
                    </TableCell>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>
                      <StatusBadge statuses={taskStatuses} value={task.status} />
                    </TableCell>
                    <TableCell align="end">
                      <Text tone="danger" weight="semibold" numeric>
                        {task.days} 天
                      </Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Small tone="muted">没有超时的项目</Small>
          )}
        </Card>

        {/* 各团队的进度分布：点一个团队看它在台账里的项目 */}
        <Card padding="md" sx={gridItemDynamicStyles.span(4)} header="责任团队 × 进度（项）">
          <BarChart
            aria-label="各责任团队在各进度的任务数"
            data={summary.teams.map((row) => ({
              team: shortTeam(row.team),
              name: row.team,
              ...row.counts,
            }))}
            index="team"
            series={statusGroups.map((group) => ({ key: group.value, label: group.label }))}
            unit="项"
            orientation="horizontal"
            stacked
            height={190}
            onItemClick={(row) => go(paths.ledger(kind, { team: row.name }))}
          />
        </Card>

        {/* 测算到商务：A 合计按差额归因一步步加减到 B 合计，用来校准测算模型、分析让利结构 */}
        <Card
          padding="md"
          sx={gridItemDynamicStyles.span(4)}
          header={`测算 A → 商务 B（${amount.unit}）`}
        >
          {summary.bridge.a.isZero() ? (
            <Small tone="muted">还没有谈定的项目</Small>
          ) : (
            <WaterfallChart
              aria-label="测算金额到商务金额的差额归因"
              steps={[
                { label: '测算 A', value: summary.bridge.a, total: true },
                ...summary.bridge.reasons.map((item) => ({
                  label: item.reason,
                  value: item.amount,
                })),
                { label: '商务 B', total: true },
              ]}
              valueFormat={amount.format}
              fromZero={false}
              height={190}
            />
          )}
        </Card>

        {/* 金额口径三分法：三栏分开，不混总数；点了去一本账（带单位与口径） */}
        <Card padding="md" sx={gridItemDynamicStyles.span(4)} header={`金额口径（${amount.unit}）`}>
          <Table aria-label="金额口径" density="compact" variant="ghost">
            <TableHead>
              <TableRow>
                <TableHeaderCell>收益</TableHeaderCell>
                {dict('amountBases').map((basis) => (
                  <TableHeaderCell key={basis.value} align="end">
                    {basis.label}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pricedStates.map((state) => (
                <TableRow key={state}>
                  <TableHeaderCell scope="row">{valueStates.label(state)}</TableHeaderCell>
                  {dict('amountBases').map((basis) => {
                    const cell = summary.bases.find(
                      (item) => item.state === state && item.basis === basis.value,
                    );
                    return (
                      <TableCell key={basis.value} align="end">
                        {cell?.amount ? (
                          <Link href={paths.valueLedger({ kind, basis: basis.value })}>
                            <Text numeric>{money(cell.amount)}</Text>
                          </Link>
                        ) : (
                          <Small tone="muted">—</Small>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Grid>
    );
  };
});

export default _component(() => {
  let kind = _state<CostKind>('unit');
  const summary = useRequest((current: CostKind, signal) => getDashboard(current, signal), {
    params: () => kind,
  });
  return () => (
    <>
      <PageNav>
        <Tabs value={_bind(kind)}>
          <TabList aria-label="降本类型">
            {costKindKeys.map((value) => (
              <Tab key={value} value={value}>
                {costKinds[value].label}（{costKinds[value].unit}）
              </Tab>
            ))}
          </TabList>
        </Tabs>
      </PageNav>
      <RequestView request={summary}>{(data) => <Board summary={data} />}</RequestView>
    </>
  );
});
