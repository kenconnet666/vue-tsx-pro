/**
 * 统计看板（首页）：口径按《需求定义方案》“收益测算与一本账”，数据由后端按同一套算法算好（dashboardSummary）。
 * 一期的参考实现，按新的设计规格重建
 */
import {
  AlarmClock,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  FileWarning,
  Hourglass,
  PackageCheck,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Card,
  Flex,
  Grid,
  gridItemDynamicStyles,
  gridItemStyles,
  Icon,
  Link,
  Small,
  Stat,
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
  useFormat,
  useRequest,
  type IconData,
} from '@vue-tsx-pro/ui';
import { BarChart, DonutChart } from '@vue-tsx-pro/ui/charts';
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
import { RequestView } from '../../shared/RequestView';
import { taskStatuses, valueStates } from '../../shared/statuses';

const styles = stylex.create({
  // 需要处理：六项一排（Grid columns=6），项与项之间一条竖线
  todoItem: {
    paddingInline: '_md',
    borderInlineStartWidth: { default: '_xs', ':first-child': 0 },
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_borderMuted',
  },
  danger: { color: '_dangerText' },
  // 三桶的条形：按条数分段
  bar: {
    display: 'flex',
    height: '0.75rem',
    borderRadius: '_full',
    overflow: 'hidden',
    gap: '2px',
  },
  confirmed: { backgroundColor: '_success' },
  unpriced: { backgroundColor: '_warning' },
  plan: { backgroundColor: '_info' },
  dot: { width: '0.625rem', height: '0.625rem', borderRadius: '_full', flexShrink: 0 },
  total: {
    fontSize: '_xxl',
    fontWeight: '_bold',
    lineHeight: '_tight',
    fontVariantNumeric: 'tabular-nums',
  },
  number: { fontVariantNumeric: 'tabular-nums' },
  segment: (share: number) => ({ flexGrow: share, flexBasis: 0 }),
  code: { fontFamily: '_mono', fontSize: '_sm' },
  late: { color: '_dangerText', fontWeight: '_semibold', fontVariantNumeric: 'tabular-nums' },
});

/** 跳转的小链接：“去处理 ↗”“明细 ↗” */
const jump = (href: string, label: string) => (
  <Link href={href}>
    {label}
    <Icon icon={ArrowUpRight} />
  </Link>
);

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

/** 一种降本类型的看板 */
const Board = _component(({ summary }: { summary: DashboardSummary }) => {
  const format = useFormat();
  return () => {
    const { kind } = summary;
    const amount = costKinds[kind];
    const money = (value: Parameters<typeof format.number>[0]) =>
      format.number(value, amount.format);
    return (
      <Grid columns={12} gap="md">
        {/* 需要处理：件数在这里，点进去是对应页签里的那几项 */}
        <Card padding="md" sx={gridItemStyles.full} header="需要处理">
          <Grid columns={6}>
            {todoItems(kind).map((item) => {
              const count = summary.todos[item.key];
              return (
                <div key={item.key} {...stylex.attrs(styles.todoItem)}>
                  <Stat
                    label={item.label}
                    icon={item.icon}
                    value={count}
                    unit="项"
                    propsNumber={{ sx: item.urgent && count > 0 && styles.danger }}
                    footer={
                      count > 0 ? jump(item.href, '去处理') : <Small tone="muted">没有</Small>
                    }
                  />
                </div>
              );
            })}
          </Grid>
        </Card>

        {/* 三桶：任务池总数只在这里出现一次 */}
        <Card padding="md" sx={gridItemDynamicStyles.span(6)} header="任务池构成">
          <Flex direction="column" gap="md">
            <Flex align="baseline" gap="sm">
              <span {...stylex.attrs(styles.total)}>{summary.pool}</span>
              <Small tone="muted">
                项任务 · 三桶互斥，加总等于总数（终止 {summary.terminated} 项回流储备库，不计入）
              </Small>
            </Flex>
            <div
              {...stylex.attrs(styles.bar)}
              role="img"
              aria-label={summary.buckets
                .map((bucket) => `${bucket.label} ${bucket.count} 项`)
                .join('，')}
            >
              {summary.buckets.map((bucket) => (
                <span
                  key={bucket.value}
                  {...stylex.attrs(
                    styles[bucket.value as 'confirmed' | 'unpriced' | 'plan'],
                    styles.segment(bucket.count),
                  )}
                />
              ))}
            </div>
            <Flex justify="between" gap="md" wrap>
              {summary.buckets.map((bucket) => (
                <Flex key={bucket.value} align="center" gap="sm">
                  <span
                    {...stylex.attrs(
                      styles.dot,
                      styles[bucket.value as 'confirmed' | 'unpriced' | 'plan'],
                    )}
                  />
                  <Text size="sm">{bucket.label}</Text>
                  <Text size="sm" weight="semibold" sx={styles.number}>
                    {bucket.count} 项
                  </Text>
                  {bucket.value === 'unpriced' && <Small tone="muted">待定价</Small>}
                </Flex>
              ))}
            </Flex>
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
              footer={jump(paths.valueLedger({ kind }), '看一本账')}
            />
          </Card>
        ))}

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
                        <Link
                          href={paths.ledger(kind, { view: row.group, valueState: state })}
                          sx={styles.number}
                        >
                          {row.counts[state]}
                        </Link>
                      ) : (
                        <Small tone="muted">—</Small>
                      )}
                    </TableCell>
                  ))}
                  <TableCell align="end">
                    <Link href={paths.ledger(kind, { view: row.group })} sx={styles.number}>
                      {row.total}
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
                    <span {...stylex.attrs(styles.number)}>{summary.stateTotals[state]}</span>
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
          header={
            <Flex justify="between" align="center" gap="sm">
              <span>超时最久的项目</span>
              {jump(paths.ledger(kind, { view: 'overdue' }), '全部超时')}
            </Flex>
          }
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
                      <Link href={paths.task(task.code)} sx={styles.code}>
                        {task.code}
                      </Link>
                    </TableCell>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>
                      <StatusBadge statuses={taskStatuses} value={task.status} />
                    </TableCell>
                    <TableCell align="end">
                      <span {...stylex.attrs(styles.late)}>{task.days} 天</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Small tone="muted">没有超时的项目</Small>
          )}
        </Card>

        {/* 各团队的进度分布 */}
        <Card padding="md" sx={gridItemDynamicStyles.span(5)} header="责任团队 × 进度（项）">
          <BarChart
            aria-label="各责任团队在各进度的任务数"
            data={summary.teams.map((row) => ({ team: shortTeam(row.team), ...row.counts }))}
            index="team"
            series={statusGroups.map((group) => ({ key: group.value, label: group.label }))}
            unit="项"
            orientation="horizontal"
            stacked
            height={170}
          />
        </Card>

        {/* 差额 D 的归因：用来校准测算模型、分析让利结构 */}
        <Card
          padding="md"
          sx={gridItemDynamicStyles.span(3)}
          header={`差额 D 归因（${amount.unit}）`}
        >
          <DonutChart
            aria-label="差额 D 的归因"
            data={summary.gaps.filter((row) => !row.amount.isZero())}
            index="reason"
            value="amount"
            unit={amount.unit}
            valueFormat={amount.format}
            height={170}
          />
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
                          <Link
                            href={paths.valueLedger({ kind, basis: basis.value })}
                            sx={styles.number}
                          >
                            {money(cell.amount)}
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
