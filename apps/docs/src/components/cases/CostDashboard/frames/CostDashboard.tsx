// 案例：统计看板，也是联合降本管理的首页（图表页，与表格页分开）。口径按《需求定义方案》的“收益测算与一本账”：
// - 顶栏按降本类型切换：单机降本（万元）与降 DMC（美元 / FH）单位不同，一个视图里只有一种单位，不混着相加；
// - 最上面一排是需要处理的事（超时、快到期、待认定、认定超期、可关闭、关闭材料不全），点了去对应的页签；
// - 任务池总数在这一页只出现一次；已确认收益、挂账待定、方案待定三桶互斥、加总等于总数（终止的回流储备库，不计入）；
// - 预测、承诺、实现三种收益分开挂账，不跨状态合计；挂账待定写“待定价”，不写零；金额与一本账同一套算法；
// - 进度 × 收益状态交叉成矩阵（行与台账的页签一致），不用“其中”；金额口径硬节约、成本规避、软节约分栏。
// 数字都能点：件数去台账（带页签与筛选），金额去一本账（带单位与口径），待认定去收益认定，项目去详情
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
  type IconData,
} from '@vue-tsx-pro/ui';
import { BarChart, DonutChart } from '@vue-tsx-pro/ui/charts';
import Decimal from 'decimal.js';
import {
  amountBases,
  confirmWorkdaysLeft,
  gapReasons,
  ledgerAmount,
  overdueDays,
  statusGroups,
  taskStatuses,
  taskStore,
  teams,
  valueStates,
  type CostTask,
} from '../../data';
import { focuses, shortTeam } from '../../ledger';
import { CaseShell, casePath, type CasePage } from '../../shell';

/** 降本类型：各自的单位与格式 */
const kinds = [
  {
    value: 'unit',
    label: '单机降本',
    unit: '万元',
    format: { scale: 10_000, minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
  {
    value: 'dmc',
    label: '降 DMC',
    unit: '美元/FH',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
] as const;

/** 三桶：互斥，加总等于任务池总数 */
const buckets = [
  {
    value: 'confirmed',
    label: '已确认收益',
    tone: 'success',
    statuses: ['confirmed', 'negotiating', 'realized', 'closed'],
  },
  { value: 'unpriced', label: '挂账待定', tone: 'warning', statuses: ['unpriced'] },
  {
    value: 'plan',
    label: '方案待定',
    tone: 'info',
    statuses: ['pending', 'designing', 'verifying', 'awaiting', 'paused'],
  },
] as const;

/** 各团队在各状态分组里的任务数（条形图的一行） */
type TeamCounts = { team: string } & Record<(typeof statusGroups)[number]['value'], number>;

const sum = (rows: readonly CostTask[]) =>
  rows.reduce((total, task) => total.plus(ledgerAmount(task) ?? 0), new Decimal(0));

const styles = stylex.create({
  // 十二栏：各块按内容分宽，一屏放下
  grid: { display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '_md' },
  span2: { gridColumn: 'span 2' },
  span3: { gridColumn: 'span 3' },
  span4: { gridColumn: 'span 4' },
  span5: { gridColumn: 'span 5' },
  span6: { gridColumn: 'span 6' },
  span7: { gridColumn: 'span 7' },
  span12: { gridColumn: 'span 12' },
  // 需要处理：六项一排，项与项之间一条竖线
  todo: { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' },
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
  success: { backgroundColor: '_success' },
  warning: { backgroundColor: '_warning' },
  info: { backgroundColor: '_info' },
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

/** 降本类型对应的台账 */
const ledgerOf = (kind: string): CasePage => (kind === 'dmc' ? 'DmcLedger' : 'UnitLedger');

/** 跳转的小链接：“去处理 ↗”“明细 ↗” */
function jump(page: CasePage, query: Record<string, string>, label: string) {
  return (
    <Link href={casePath(page, query)}>
      {label}
      <Icon icon={ArrowUpRight} />
    </Link>
  );
}

export default _component(() => {
  const format = useFormat();
  let kind = _state<(typeof kinds)[number]['value']>('unit');
  const current = () => kinds.find((item) => item.value === kind)!;
  const money = (value: Decimal) => format.number(value, current().format);

  return () => {
    const tasks = taskStore.value.filter((task) => task.kind === kind);
    // 终止的回流储备库：不计入任务池
    const pool = tasks.filter((task) => task.status !== 'terminated');
    const terminated = tasks.length - pool.length;
    const byBucket = buckets.map((bucket) => ({
      ...bucket,
      rows: pool.filter((task) => (bucket.statuses as readonly string[]).includes(task.status)),
    }));
    const states = valueStates.keys.filter((state) => state !== 'unpriced');
    const awaiting = pool.filter((task) => task.status === 'awaiting');
    const focusCount = (value: string) =>
      pool.filter(focuses.find((item) => item.value === value)!.test).length;

    // 需要处理：每一项去对应的页签或页面
    const todos: {
      label: string;
      icon: IconData;
      count: number;
      urgent: boolean;
      page: CasePage;
      query: Record<string, string>;
    }[] = [
      {
        label: '超时',
        icon: AlarmClock,
        count: focusCount('overdue'),
        urgent: true,
        page: ledgerOf(kind),
        query: { view: 'overdue' },
      },
      {
        label: '7 天内到期',
        icon: CalendarClock,
        count: focusCount('soon'),
        urgent: false,
        page: ledgerOf(kind),
        query: { view: 'soon' },
      },
      {
        label: '待认定',
        icon: BadgeCheck,
        count: awaiting.length,
        urgent: false,
        page: 'BenefitConfirm',
        query: { kind, tab: 'awaiting' },
      },
      {
        label: '认定超期',
        icon: Hourglass,
        count: awaiting.filter((task) => (confirmWorkdaysLeft(task) ?? 0) < 0).length,
        urgent: true,
        page: 'BenefitConfirm',
        query: { kind, tab: 'awaiting' },
      },
      {
        label: '可关闭',
        icon: PackageCheck,
        count: focusCount('closable'),
        urgent: false,
        page: ledgerOf(kind),
        query: { view: 'closable' },
      },
      {
        label: '关闭材料不全',
        icon: FileWarning,
        count: focusCount('missing'),
        urgent: false,
        page: ledgerOf(kind),
        query: { view: 'missing' },
      },
    ];

    const gapRows = gapReasons.map((reason) => ({
      reason,
      amount: pool
        .filter((task) => task.gapReason === reason && task.a && task.b)
        .reduce((total, task) => total.plus(task.b!.minus(task.a!).abs()), new Decimal(0)),
    }));
    const teamRows = teams.map((team) => ({
      team: shortTeam(team),
      ...Object.fromEntries(
        statusGroups.map((group) => [
          group.value,
          pool.filter(
            (task) =>
              task.team === team && (group.statuses as readonly string[]).includes(task.status),
          ).length,
        ]),
      ),
    })) as TeamCounts[];
    const groups = statusGroups.filter(
      (group) =>
        group.value !== 'abnormal' ||
        pool.some((task) => (group.statuses as readonly string[]).includes(task.status)),
    );
    // 超时最久的几项：直接去详情
    const lateTasks = pool
      .filter((task) => overdueDays(task) > 0)
      .toSorted((a, b) => overdueDays(b) - overdueDays(a))
      .slice(0, 6);

    return (
      <CaseShell
        current="dashboard"
        nav={
          <Tabs value={_bind(kind)}>
            <TabList aria-label="降本类型">
              {kinds.map((item) => (
                <Tab key={item.value} value={item.value}>
                  {item.label}（{item.unit}）
                </Tab>
              ))}
            </TabList>
          </Tabs>
        }
      >
        <div {...stylex.attrs(styles.grid)}>
          {/* 需要处理：件数在这里，点进去是对应页签里的那几项 */}
          <Card padding="md" sx={styles.span12} header="需要处理">
            <div {...stylex.attrs(styles.todo)}>
              {todos.map((item) => (
                <div key={item.label} {...stylex.attrs(styles.todoItem)}>
                  <Stat
                    label={item.label}
                    icon={item.icon}
                    value={item.count}
                    unit="项"
                    propsNumber={{ sx: item.urgent && item.count > 0 && styles.danger }}
                    footer={
                      item.count > 0 ? (
                        jump(item.page, item.query, '去处理')
                      ) : (
                        <Small tone="muted">没有</Small>
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* 三桶：任务池总数只在这里出现一次 */}
          <Card padding="md" sx={styles.span6} header="任务池构成">
            <Flex direction="column" gap="md">
              <Flex align="baseline" gap="sm">
                <span {...stylex.attrs(styles.total)}>{pool.length}</span>
                <Small tone="muted">
                  项任务 · 三桶互斥，加总等于总数（终止 {terminated} 项回流储备库，不计入）
                </Small>
              </Flex>
              <div
                {...stylex.attrs(styles.bar)}
                role="img"
                aria-label={byBucket
                  .map((bucket) => `${bucket.label} ${bucket.rows.length} 项`)
                  .join('，')}
              >
                {byBucket.map((bucket) => (
                  <span
                    key={bucket.value}
                    {...stylex.attrs(styles[bucket.tone], styles.segment(bucket.rows.length))}
                  />
                ))}
              </div>
              <Flex justify="between" gap="md" wrap>
                {byBucket.map((bucket) => (
                  <Flex key={bucket.value} align="center" gap="sm">
                    <span {...stylex.attrs(styles.dot, styles[bucket.tone])} />
                    <Text size="sm">{bucket.label}</Text>
                    <Text size="sm" weight="semibold" sx={styles.number}>
                      {bucket.rows.length} 项
                    </Text>
                    {bucket.value === 'unpriced' && <Small tone="muted">待定价</Small>}
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Card>

          {/* 三种收益分开挂账：各自的金额与条数，不相加；金额与一本账一致，点进去看一本账 */}
          {states.map((state) => {
            const rows = pool.filter((task) => task.valueState === state);
            return (
              <Card key={state} padding="md" sx={styles.span2} header={valueStates.label(state)}>
                <Stat
                  label={`${rows.length} 项`}
                  value={sum(rows).toNumber()}
                  format={current().format}
                  unit={current().unit}
                  footer={jump('ValueLedger', { kind }, '看一本账')}
                />
              </Card>
            );
          })}

          {/* 进度 × 收益状态：行与台账的页签一致，格子跳到“页签 + 收益状态” */}
          <Card padding="md" sx={styles.span7} header="进度 × 收益状态（项）">
            <Table aria-label="进度与收益状态" density="compact" variant="ghost">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>进度</TableHeaderCell>
                  {valueStates.keys.map((state) => (
                    <TableHeaderCell key={state} align="end">
                      <StatusBadge statuses={valueStates} value={state} />
                    </TableHeaderCell>
                  ))}
                  <TableHeaderCell align="end">小计</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map((group) => {
                  const inGroup = pool.filter((task) =>
                    (group.statuses as readonly string[]).includes(task.status),
                  );
                  return (
                    <TableRow key={group.value}>
                      <TableHeaderCell scope="row">{group.label}</TableHeaderCell>
                      {valueStates.keys.map((state) => {
                        const count = inGroup.filter((task) => task.valueState === state).length;
                        return (
                          <TableCell key={state} align="end">
                            {count ? (
                              <Link
                                href={casePath(ledgerOf(kind), {
                                  view: group.value,
                                  valueState: state,
                                })}
                                sx={styles.number}
                              >
                                {count}
                              </Link>
                            ) : (
                              <Small tone="muted">—</Small>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="end">
                        <Link
                          href={casePath(ledgerOf(kind), { view: group.value })}
                          sx={styles.number}
                        >
                          {inGroup.length}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFoot>
                <TableRow>
                  <TableHeaderCell scope="row">小计</TableHeaderCell>
                  {valueStates.keys.map((state) => (
                    <TableCell key={state} align="end">
                      <span {...stylex.attrs(styles.number)}>
                        {pool.filter((task) => task.valueState === state).length}
                      </span>
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
            sx={styles.span5}
            header={
              <Flex justify="between" align="center" gap="sm">
                <span>超时最久的项目</span>
                {jump(ledgerOf(kind), { view: 'overdue' }, '全部超时')}
              </Flex>
            }
          >
            {lateTasks.length ? (
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
                  {lateTasks.map((task) => (
                    <TableRow key={task.code}>
                      <TableCell>
                        <Link href={casePath('TaskDetail', { code: task.code })} sx={styles.code}>
                          {task.code}
                        </Link>
                      </TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>
                        <StatusBadge statuses={taskStatuses} value={task.status} />
                      </TableCell>
                      <TableCell align="end">
                        <span {...stylex.attrs(styles.late)}>{overdueDays(task)} 天</span>
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
          <Card padding="md" sx={styles.span5} header="责任团队 × 进度（项）">
            <BarChart
              aria-label="各责任团队在各进度的任务数"
              data={teamRows}
              index="team"
              series={statusGroups.map((group) => ({ key: group.value, label: group.label }))}
              unit="项"
              orientation="horizontal"
              stacked
              height={170}
            />
          </Card>

          {/* 差额 D 的归因：用来校准测算模型、分析让利结构 */}
          <Card padding="md" sx={styles.span3} header={`差额 D 归因（${current().unit}）`}>
            <DonutChart
              aria-label="差额 D 的归因"
              data={gapRows.filter((row) => !row.amount.isZero())}
              index="reason"
              value="amount"
              unit={current().unit}
              valueFormat={current().format}
              height={170}
            />
          </Card>

          {/* 金额口径三分法：三栏分开，不混总数；点了去一本账（带单位与口径） */}
          <Card padding="md" sx={styles.span4} header={`金额口径（${current().unit}）`}>
            <Table aria-label="金额口径" density="compact" variant="ghost">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>收益</TableHeaderCell>
                  {amountBases.map((basis) => (
                    <TableHeaderCell key={basis.value} align="end">
                      {basis.label}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {states.map((state) => (
                  <TableRow key={state}>
                    <TableHeaderCell scope="row">{valueStates.label(state)}</TableHeaderCell>
                    {amountBases.map((basis) => {
                      const rows = pool.filter(
                        (task) => task.valueState === state && task.basis === basis.value,
                      );
                      return (
                        <TableCell key={basis.value} align="end">
                          {rows.length ? (
                            <Link
                              href={casePath('ValueLedger', { kind, basis: basis.value })}
                              sx={styles.number}
                            >
                              {money(sum(rows))}
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
        </div>
      </CaseShell>
    );
  };
});
