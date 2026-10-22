/**
 * 一本账（表格页，成本团队）：单机降本与降 DMC 分页签，金额口径一次看一种；机会、预测、承诺、实现四栏，
 * 每一项的金额只落在所属状态那一栏，挂账待定写“待定价”；底部只按栏合计。一期的参考实现，按新的设计规格重建
 */
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  DataTable,
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
  queryCodecs,
  useQueryState,
  useRequest,
  Flex,
  ViewportFill,
} from '@vue-tsx-pro/ui';
import { getValueLedger } from '../../api/benefit';
import { PageNav } from '../../app/layout/PageNav';
import { dict, dictLabel, shortTeam, teamNames } from '../../app/master';
import type { ValueLedgerQuery, ValueLedgerRow as Row } from '../../domain/ledger/value';
import type { CostKind } from '../../domain/task/types';
import { CodeLink } from '../../shared/CodeLink';

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
  search: { width: '16rem' },
  team: { width: '14rem' },
});

export default _component(() => {
  // 单位与金额口径在地址里：从统计看板跳过来时带着，刷新、分享也还是这份
  let kind = _fromRef(useQueryState<CostKind>('kind', 'unit', queryCodecs.oneOf(['unit', 'dmc'])));
  let basis = _fromRef(useQueryState('basis', 'hard'));
  let keyword = _state('');
  let team = _state<string | null>(null);

  // 当前单位、口径与条件下的行；两种单位各有几行（页签上的数）一起取回
  const ledger = useRequest((query: ValueLedgerQuery, signal) => getValueLedger(query, signal), {
    params: () => ({ kind, basis, keyword, team }),
    debounce: 300,
  });

  const columns = (): DataTableColumn<Row>[] => {
    const current = kinds.find((item) => item.value === kind)!;
    return [
      {
        key: 'code',
        header: '编码',
        width: 150,
        sticky: 'start',
        sortable: true,
        // 机会（渠道里的建议、方案）还没有卡的详情：只显示编号
        cell: (row) => <CodeLink code={row.code} />,
      },
      // 写宽度：更宽时多出来的按比例摊给各列，不只撑大名称
      { key: 'name', header: '项目名称', width: 240, sortable: true },
      {
        key: 'source',
        header: '来源',
        width: 150,
        value: (row) => `${dictLabel('channels', row.channel)}${row.inPool ? '' : '（未入池）'}`,
      },
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
        value: (row) => (row.column === state.key ? row.amount : null),
        summary: 'sum',
        empty: '',
      })),
      {
        key: 'unpriced',
        header: '挂账待定',
        width: 110,
        align: 'end',
        value: (row) => (row.column === 'unpriced' ? 1 : null),
        cell: (row) => (row.column === 'unpriced' ? <Small tone="warning">待定价</Small> : ''),
        summary: (rows) => {
          const count = rows.filter((row) => row.column === 'unpriced').length;
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
        header: `收益（${current.unit}，${dictLabel('amountBases', basis)}）`,
        columns: [...states.map((state) => state.key), 'unpriced'],
      },
    ];
  };

  return () => (
    <>
      <PageNav>
        <Tabs value={_bind(kind)}>
          <TabList aria-label="降本类型">
            {kinds.map((item) => (
              <Tab key={item.value} value={item.value}>
                {item.label}
                <Badge radius="full" tone={kind === item.value ? 'accent' : 'neutral'}>
                  {ledger.data?.counts[item.value] ?? '…'}
                </Badge>
              </Tab>
            ))}
          </TabList>
        </Tabs>
      </PageNav>
      <ViewportFill gap="sm">
        <Flex align="center" gap="md" wrap>
          <ToggleGroup value={_bind(basis)} aria-label="金额口径" required>
            {dict('amountBases').map((item) => (
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
            items={teamNames()}
            value={_bind(team)}
            placeholder="全部团队"
            clearable
            aria-label="责任一级团队"
            sx={styles.team}
          />
          <Small tone="muted">四种状态分开挂账、只按栏合计；金额口径一次看一种，不混总数</Small>
        </Flex>
        <DataTable
          rows={ledger.data?.rows ?? []}
          loading={ledger.loading}
          columns={columns()}
          columnGroups={groups()}
          getKey={(row) => row.code}
          summaryLabel="按栏合计"
          aria-label="一本账"
          flexible
        />
      </ViewportFill>
    </>
  );
});
