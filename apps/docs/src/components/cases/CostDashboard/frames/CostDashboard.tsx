// 案例：统计看板（图表页，与表格页分开）。口径按《需求定义方案》的“收益测算与一本账”：
// - 顶栏按降本类型切换：单机降本（万元）与降 DMC（美元 / FH）单位不同，一个视图里只有一种单位，不混着相加；
// - 任务池总数在这一页只出现一次；已确认收益、挂账待定、方案待定三桶互斥、加总等于总数（终止的回流储备库，不计入）；
// - 预测、承诺、实现三种收益分开挂账，不跨状态合计；挂账待定写“待定价”，不写零；
// - 进度 × 收益状态交叉成矩阵（行与任务池的页签一致），不用“其中”；金额口径硬节约、成本规避、软节约分栏。
// 数字都能点：跳到筛好条件的任务池（页签 + 收益状态 + 降本类型 + 金额口径）
import { ArrowUpRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Card,
  Flex,
  Icon,
  Link,
  Small,
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
} from '@vue-tsx-pro/ui';
import { BarChart, DonutChart } from '@vue-tsx-pro/ui/charts';
import Decimal from 'decimal.js';
import {
  amountBases,
  gapReasons,
  statusGroups,
  taskStore,
  teams,
  valueStates,
  type CostTask,
} from '../../data';
import { CaseShell, casePath } from '../../shell';

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
    views: ['business', 'realized', 'closed'],
  },
  {
    value: 'unpriced',
    label: '挂账待定',
    tone: 'warning',
    statuses: ['unpriced'],
    views: ['abnormal'],
  },
  {
    value: 'plan',
    label: '方案待定',
    tone: 'info',
    statuses: ['pending', 'designing', 'verifying', 'awaiting', 'paused'],
    views: ['doing', 'awaiting'],
  },
] as const;

/** 一项任务在它的收益状态下挂账的金额：预测值用 A（认定前用预期收益），承诺、实现用 B（还没谈定用 A） */
const amountOf = (task: CostTask): Decimal | null =>
  task.valueState === 'unpriced'
    ? null
    : task.valueState === 'forecast'
      ? (task.a ?? task.expected)
      : (task.b ?? task.a);

/** 各团队在各状态分组里的任务数（条形图的一行） */
type TeamCounts = { team: string } & Record<(typeof statusGroups)[number]['value'], number>;

const sum = (rows: readonly CostTask[], pick: (task: CostTask) => Decimal | null) =>
  rows.reduce((total, task) => total.plus(pick(task) ?? 0), new Decimal(0));

const styles = stylex.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: '_md',
  },
  span2: { gridColumn: 'span 2' },
  span3: { gridColumn: 'span 3' },
  span4: { gridColumn: 'span 4' },
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
  amount: {
    fontSize: '_xl',
    fontWeight: '_bold',
    lineHeight: '_tight',
    fontVariantNumeric: 'tabular-nums',
  },
  unit: { color: '_textMuted', fontSize: '_xs', marginInlineStart: '0.25em' },
  number: { fontVariantNumeric: 'tabular-nums' },
  segment: (share: number) => ({ flexGrow: share, flexBasis: 0 }),
});

/** 跳到任务池的小链接：“明细 ↗” */
function detailLink(query: Record<string, string>, label = '明细') {
  return (
    <Link href={casePath('TaskPool', query)}>
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
    const gapRows = gapReasons.map((reason) => ({
      reason,
      amount: sum(
        pool.filter((task) => task.gapReason === reason),
        (task) => (task.a && task.b ? task.b.minus(task.a).abs() : null),
      ),
    }));
    const teamRows = teams.map((team) => ({
      team: team.replace('集成团队', ''),
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
          {/* 三桶：任务池总数只在这里出现一次 */}
          <Card padding="md" sx={styles.span3} header="任务池构成">
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

          {/* 三种收益分开挂账：各自的金额与条数，不相加 */}
          {states.map((state) => {
            const rows = pool.filter((task) => task.valueState === state);
            return (
              <Card key={state} padding="md" header={valueStates.label(state)}>
                <Flex direction="column" gap="sm">
                  <span>
                    <span {...stylex.attrs(styles.amount)}>{money(sum(rows, amountOf))}</span>
                    <span {...stylex.attrs(styles.unit)}>{current().unit}</span>
                  </span>
                  <Flex justify="between" align="center">
                    <Small tone="muted">{rows.length} 项</Small>
                    {detailLink({ valueState: state, kind })}
                  </Flex>
                </Flex>
              </Card>
            );
          })}

          {/* 进度 × 收益状态：行与任务池的页签一致，格子跳到“页签 + 收益状态” */}
          <Card padding="md" sx={styles.span4} header="进度 × 收益状态（项）">
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
                                href={casePath('TaskPool', {
                                  view: group.value,
                                  valueState: state,
                                  kind,
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
                          href={casePath('TaskPool', { view: group.value, kind })}
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

          {/* 差额 D 的归因：用来校准测算模型、分析让利结构 */}
          <Card padding="md" sx={styles.span2} header={`差额 D 归因（${current().unit}）`}>
            <DonutChart
              aria-label="差额 D 的归因"
              data={gapRows.filter((row) => !row.amount.isZero())}
              index="reason"
              value="amount"
              unit={current().unit}
              valueFormat={current().format}
              height={200}
            />
          </Card>

          {/* 各团队的进度分布 */}
          <Card padding="md" sx={styles.span4} header="责任团队 × 进度（项）">
            <BarChart
              aria-label="各责任团队在各进度的任务数"
              data={teamRows}
              index="team"
              series={statusGroups.map((group) => ({ key: group.value, label: group.label }))}
              unit="项"
              orientation="horizontal"
              stacked
              height={180}
            />
          </Card>

          {/* 金额口径三分法：三栏分开，不混总数 */}
          <Card padding="md" sx={styles.span2} header={`金额口径（${current().unit}）`}>
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
                              href={casePath('TaskPool', {
                                valueState: state,
                                basis: basis.value,
                                kind,
                              })}
                              sx={styles.number}
                            >
                              {money(sum(rows, amountOf))}
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
