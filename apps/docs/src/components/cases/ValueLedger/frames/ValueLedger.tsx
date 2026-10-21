// 案例：一本账（表格页，成本团队）。按设计规格与统计口径：顶栏页签是单机降本（万元）与降 DMC（美元 / FH），一个视图只有一种单位；
// 金额口径（硬节约、成本规避、软节约）分段切换、一次只看一种，不混总数；
// 机会值、预测值、承诺值、实现值四栏，每一项的金额只落在所属状态那一栏，挂账待定一栏写“待定价”；底部只按栏合计、不跨栏相加。
// 机会值是渠道里还没进任务池的建议与方案；终止的项目没有收益，不上账。编码链到项目详情。数据是虚构的
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  DataTable,
  Link,
  Select,
  Small,
  Tab,
  TabList,
  Tabs,
  TextField,
  ToggleGroup,
  ToggleItem,
  type DataTableColumn,
  type DataTableColumnGroup,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import {
  amountBases,
  channels,
  labelOf,
  ledgerAmount,
  opportunities,
  taskStore,
  teams,
} from '../../data';
import { shortTeam } from '../../ledger';
import { CaseShell, casePath, useCaseQuery } from '../../shell';

/** 一本账的一行：任务池里的任务，或渠道里的机会 */
interface Row {
  code: string;
  name: string;
  team: string;
  /** 来源：渠道一建议、渠道二方案 */
  source: string;
  /** 挂在哪一栏 */
  state: 'opportunity' | 'forecast' | 'committed' | 'realized' | 'unpriced';
  amount: Decimal | null;
  /** 任务池里的任务（链到详情）；机会没有详情页 */
  inPool: boolean;
}

const kinds = [
  { value: 'unit', label: '单机降本（万元）', unit: '万元', format: { scale: 10_000 } },
  { value: 'dmc', label: '降 DMC（美元/FH）', unit: '美元/FH', format: {} },
] as const;

const states = [
  { key: 'opportunity', header: '机会值' },
  { key: 'forecast', header: '预测值' },
  { key: 'committed', header: '承诺值' },
  { key: 'realized', header: '实现值' },
] as const;

const styles = stylex.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    height: 'calc(100dvh - 3rem - 2 * _space.md)',
    minHeight: '28rem',
  },
  toolbar: { display: 'flex', alignItems: 'center', gap: '_md', flexWrap: 'wrap' },
  search: { width: '16rem' },
  team: { width: '14rem' },
  table: { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', maxHeight: 'none', minHeight: 0 },
  code: { fontFamily: '_mono', fontSize: '_sm' },
});

export default _component(() => {
  // 从统计看板跳过来时带着单位与金额口径
  const route = useCaseQuery();
  let kind = _state<'unit' | 'dmc'>(route().kind === 'dmc' ? 'dmc' : 'unit');
  let basis = _state(route().basis ?? 'hard');
  let keyword = _state('');
  let team = _state('');

  /** 当前单位、口径与条件下的行：任务按收益状态上账，机会单独一栏 */
  function rowsOf(view: 'unit' | 'dmc'): Row[] {
    const pool: Row[] = taskStore.value
      .filter((task) => task.kind === view && task.basis === basis && task.status !== 'terminated')
      .map((task) => ({
        code: task.code,
        name: task.name,
        team: task.team,
        source: labelOf(channels, task.channel),
        state: task.valueState as Row['state'],
        amount: ledgerAmount(task),
        inPool: true,
      }));
    const channel: Row[] = opportunities
      .filter((item) => item.kind === view && item.basis === basis)
      .map((item) => ({
        code: item.code,
        name: item.name,
        team: item.team,
        source: `${labelOf(channels, item.channel)}（未入池）`,
        state: 'opportunity',
        amount: item.expected,
        inPool: false,
      }));
    return [...channel, ...pool].filter(
      (row) =>
        (!keyword || row.code.includes(keyword) || row.name.includes(keyword)) &&
        (!team || row.team === team),
    );
  }

  const columns = (): DataTableColumn<Row>[] => {
    const current = kinds.find((item) => item.value === kind)!;
    return [
      {
        key: 'code',
        header: '编码',
        width: 150,
        sticky: 'start',
        sortable: true,
        cell: (row) =>
          row.inPool ? (
            <Link href={casePath('TaskDetail', { code: row.code })} sx={styles.code}>
              {row.code}
            </Link>
          ) : (
            <span {...stylex.attrs(styles.code)}>{row.code}</span>
          ),
      },
      // 写宽度：更宽时多出来的按比例摊给各列，不只撑大名称
      { key: 'name', header: '项目名称', width: 240, sortable: true },
      { key: 'source', header: '来源', width: 150 },
      {
        key: 'team',
        header: '责任团队',
        width: 128,
        value: (row) => shortTeam(row.team),
        cell: (row) => <span title={row.team}>{shortTeam(row.team)}</span>,
      },
      // 四栏：金额只落在所属状态那一栏，合计只在同一栏里加
      ...states.map((state): DataTableColumn<Row> => ({
        key: state.key,
        header: state.header,
        width: 120,
        align: 'end',
        sortable: true,
        format: { ...current.format, minimumFractionDigits: 2, maximumFractionDigits: 2 },
        value: (row) => (row.state === state.key ? row.amount : null),
        summary: 'sum',
        empty: '',
      })),
      {
        key: 'unpriced',
        header: '挂账待定',
        width: 110,
        align: 'end',
        value: (row) => (row.state === 'unpriced' ? 1 : null),
        cell: (row) => (row.state === 'unpriced' ? <Small tone="warning">待定价</Small> : ''),
        summary: (rows) => {
          const count = rows.filter((row) => row.state === 'unpriced').length;
          return count ? `${count} 项待定价` : '—';
        },
      },
    ];
  };

  const groups = (): DataTableColumnGroup[] => {
    const current = kinds.find((item) => item.value === kind)!;
    return [
      {
        key: 'value',
        header: `收益（${current.unit}，${labelOf(amountBases, basis)}）`,
        columns: [...states.map((state) => state.key), 'unpriced'],
      },
    ];
  };

  return () => {
    const rows = rowsOf(kind);
    return (
      <CaseShell
        current="ledger"
        nav={
          <Tabs value={_bind(kind)}>
            <TabList aria-label="降本类型">
              {kinds.map((item) => (
                <Tab key={item.value} value={item.value}>
                  {item.label}
                  <Badge radius="full" tone={kind === item.value ? 'accent' : 'neutral'}>
                    {rowsOf(item.value).length}
                  </Badge>
                </Tab>
              ))}
            </TabList>
          </Tabs>
        }
      >
        <div {...stylex.attrs(styles.page)}>
          <div {...stylex.attrs(styles.toolbar)}>
            <ToggleGroup value={_bind(basis)} aria-label="金额口径" required>
              {amountBases.map((item) => (
                <ToggleItem key={item.value} value={item.value}>
                  {item.label}
                </ToggleItem>
              ))}
            </ToggleGroup>
            <TextField
              value={_bind(keyword)}
              icon={Search}
              placeholder="编码 / 名称"
              clearable
              aria-label="关键字"
              sx={styles.search}
            />
            <Select
              items={teams}
              value={_bind(team)}
              placeholder="全部团队"
              clearable
              aria-label="责任一级团队"
              sx={styles.team}
            />
            <Small tone="muted">四种状态分开挂账、只按栏合计；金额口径一次看一种，不混总数</Small>
          </div>
          <DataTable
            rows={rows}
            columns={columns()}
            columnGroups={groups()}
            getKey={(row) => row.code}
            summaryLabel="按栏合计"
            aria-label="一本账"
            propsRoot={{ sx: styles.table }}
          />
        </div>
      </CaseShell>
    );
  };
});
