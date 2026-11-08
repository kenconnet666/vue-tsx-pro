/**
 * 监控（docs/decisions/0010 第 4 节，只给管理员）：这段时间发起、结束了多少，进行中、开着的待办、超时、异常；
 * 按天的趋势；各流程平均走多久；最慢的环节（瓶颈）；谁手上压着待办。数据变了（推进、作业）跟着刷新。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { FlowStats } from '@zerodep-dev/flow-ts-engine';
import {
  Card,
  DataTable,
  Select,
  Stat,
  StatGroup,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { LineChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';
import { watch } from 'vue';
import { PROCESSES } from '../processes';
import { who } from '../parts/labels';
import { showError } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';

const styles = css.create({
  page: { display: 'flex', flexDirection: 'column', gap: '_lg', minWidth: 0 },
  filters: { display: 'flex', gap: '_sm', flexWrap: 'wrap' },
  filter: { width: '12rem' },
  tables: {
    display: 'grid',
    gap: '_lg',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 28rem), 1fr))',
    alignItems: 'start',
  },
});

const DAY = 24 * 3_600_000;
const RANGES = [
  { value: '7', label: '近 7 天' },
  { value: '30', label: '近 30 天' },
  { value: '90', label: '近 90 天' },
];
const processItems = PROCESSES.map((p) => ({ value: p.definition.key, label: p.definition.name }));
const processName = (key: string) => processItems.find((p) => p.value === key)?.label ?? key;
const hours = (value: number | null) => (value === null ? '—' : `${value} 小时`);

type ProcessRow = FlowStats['processes'][number];
type NodeRow = FlowStats['nodes'][number];
type LoadRow = FlowStats['workload'][number];

const processColumns: DataTableColumn<ProcessRow>[] = [
  { key: 'processKey', header: '流程', minWidth: 120, cell: (r) => processName(r.processKey) },
  { key: 'active', header: '进行中', width: 90, type: 'number' },
  { key: 'started', header: '发起', width: 80, type: 'number' },
  { key: 'finished', header: '结束', width: 80, type: 'number' },
  { key: 'averageHours', header: '平均走多久', width: 120, cell: (r) => hours(r.averageHours) },
];

const nodeColumns: DataTableColumn<NodeRow>[] = [
  { key: 'nodeName', header: '环节', minWidth: 120 },
  { key: 'processKey', header: '流程', width: 110, cell: (r) => processName(r.processKey) },
  { key: 'averageHours', header: '平均停留', width: 110, cell: (r) => hours(r.averageHours) },
  { key: 'done', header: '办了', width: 70, type: 'number' },
  { key: 'overdue', header: '超时', width: 70, type: 'number' },
];

const loadColumns: DataTableColumn<LoadRow>[] = [
  { key: 'user', header: '处理人', minWidth: 120, cell: (r) => who(r.user) },
  { key: 'open', header: '开着的待办', width: 110, type: 'number' },
  { key: 'overdue', header: '其中超时', width: 100, type: 'number' },
];

export default _component(() => {
  const center = useFlowCenter();
  let stats = _state.raw<FlowStats | null>(null);
  let range = _state('30');
  let process = _state<string | null>(null);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  watch(
    () => [range, process, center.state.revision, center.state.actor] as const,
    async () => {
      if (!center.admin()) return;
      const to = center.state.now;
      try {
        stats = await center.client.stats.overview({
          from: new Date(to.getTime() - Number(range) * DAY),
          to,
          timeZone,
          ...(process ? { processKey: process } : {}),
        });
      } catch (error) {
        showError(error);
      }
    },
    { immediate: true },
  );

  return () => {
    const data = stats;
    const totals = data?.totals;
    return (
      <div {...css.attrs(styles.page)}>
        <div {...css.attrs(styles.filters)}>
          <Select items={RANGES} _value={range} aria-label="时间" sx={styles.filter} />
          <Select
            items={processItems}
            _value={process}
            placeholder="全部流程"
            clearable
            aria-label="流程"
            sx={styles.filter}
          />
        </div>
        <Card padding="lg">
          <StatGroup>
            <Stat label="进行中" value={totals?.active ?? 0} loading={!data} />
            <Stat label="这段时间发起" value={totals?.started ?? 0} loading={!data} />
            <Stat label="结束" value={totals?.finished ?? 0} loading={!data} />
            <Stat label="没走完（终止、撤回）" value={totals?.rejected ?? 0} loading={!data} />
            <Stat label="开着的待办" value={totals?.open ?? 0} loading={!data} />
            <Stat
              label="超时"
              value={totals?.overdue ?? 0}
              tone={totals?.overdue ? 'danger' : undefined}
              loading={!data}
            />
            <Stat
              label="异常"
              value={totals?.incidents ?? 0}
              tone={totals?.incidents ? 'danger' : undefined}
              loading={!data}
            />
          </StatGroup>
        </Card>
        <Card padding="lg" header="每天发起与结束">
          <LineChart
            aria-label="每天发起与结束"
            data={data?.daily ?? []}
            index="date"
            indexFormat={(_, row) => row.date.slice(5)}
            series={[
              { key: 'started', label: '发起' },
              { key: 'finished', label: '结束' },
            ]}
            loading={!data}
            height={240}
          />
        </Card>
        <div {...css.attrs(styles.tables)}>
          <Card padding="md" header="各流程">
            <DataTable
              rows={data?.processes ?? []}
              columns={processColumns}
              getKey={(r) => r.processKey}
              loading={!data}
              aria-label="各流程"
            />
          </Card>
          <Card padding="md" header="最慢的环节">
            <DataTable
              rows={(data?.nodes ?? []).slice(0, 10)}
              columns={nodeColumns}
              getKey={(r) => `${r.processKey}/${r.node}`}
              loading={!data}
              aria-label="最慢的环节"
            />
          </Card>
          <Card padding="md" header="谁手上压着待办">
            <DataTable
              rows={data?.workload ?? []}
              columns={loadColumns}
              getKey={(r) => r.user}
              loading={!data}
              aria-label="谁手上压着待办"
            />
          </Card>
        </div>
      </div>
    );
  };
});
