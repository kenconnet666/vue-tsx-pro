/**
 * 单据：我经手的、我发起的、全部单据（管理员），按标题或业务编号、流程、状态、发起时间查，分页；点一行在抽屉里看审批单，
 * 管理员在审批单上干预（暂停、终止、跳转、改派、处理异常）。数据变了（别人处理了、作业跑了）、换了身份，这一页重新取。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { InstanceRow, InstanceStatus } from '@zerodep-dev/flow-ts-engine';
import {
  createStatusMap,
  DateRangePicker,
  Drawer,
  Field,
  Select,
  Tab,
  TabList,
  Tabs,
  TextField,
  useTableQuery,
  type DataTableColumn,
  type DateRange,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { QueryTable } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { getLocalTimeZone } from '@internationalized/date';
import { watch } from 'vue';
import { PROCESSES, processOf } from '../processes';
import { ApprovalPanel } from '../parts/ApprovalPanel';
import { STATUS, who } from '../parts/labels';
import { useFlowCenter } from '../runtime/center';

type Scope = 'involved' | 'started' | 'all';

interface Filters {
  text: string;
  process: string | null;
  status: InstanceStatus | null;
  started: DateRange | null;
}

const blank: Filters = { text: '', process: null, status: null, started: null };

const statuses = createStatusMap(STATUS);
const processItems = PROCESSES.map((p) => ({ value: p.definition.key, label: p.definition.name }));

/** 节点编号写成名字（按流程现在的定义；老版本里删掉的节点写编号） */
const nodeName = (row: InstanceRow, node: string) =>
  processOf(row.processKey)?.definition.nodes.find((n) => n.id === node)?.name ?? node;

const columns: DataTableColumn<InstanceRow>[] = [
  {
    key: 'title',
    header: '单据',
    minWidth: 220,
    cell: (row) => row.title ?? processOf(row.processKey)?.definition.name ?? row.processKey,
  },
  {
    key: 'processKey',
    header: '流程',
    width: 120,
    cell: (row) => processOf(row.processKey)?.definition.name ?? row.processKey,
  },
  { key: 'startedBy', header: '发起人', width: 100, cell: (row) => who(row.startedBy) },
  { key: 'status', header: '状态', width: 100, statuses },
  {
    key: 'current',
    header: '现在到',
    minWidth: 140,
    cell: (row) => row.current.map((node) => nodeName(row, node)).join('、') || '—',
  },
  { key: 'startedAt', header: '发起时间', width: 170, type: 'dateTime' },
  { key: 'endedAt', header: '结束时间', width: 170, type: 'dateTime' },
];

export default _component(() => {
  const center = useFlowCenter();
  let scope = _state<Scope>('involved');
  let open = _state(false);
  let active = _state<number | null>(null);

  const timeZone = getLocalTimeZone();
  const documents = useTableQuery(
    (query) => {
      const { text, process, status, started } = query.filters;
      return center.client.search({
        scope: query.params,
        text: text.trim() || undefined,
        processKey: process ?? undefined,
        status: status ? [status] : undefined,
        // 按本地的日子：开始日的零点到结束日的最后一刻
        from: started?.start.toDate(timeZone),
        to: started
          ? new Date(started.end.add({ days: 1 }).toDate(timeZone).getTime() - 1)
          : undefined,
        page: query.page,
        size: query.pageSize,
      });
    },
    { filters: blank, pageSize: 20, params: () => scope },
  );

  watch(
    () => [center.state.revision, center.state.actor] as const,
    () => {
      // 换成了不是管理员的身份：“全部单据”不能查了
      if (scope === 'all' && !center.admin()) scope = 'involved';
      void documents.refresh();
    },
  );

  function show(row: InstanceRow) {
    active = row.id;
    open = true;
  }

  return () => {
    const scopes: { value: Scope; label: string }[] = [
      { value: 'involved', label: '我经手的' },
      { value: 'started', label: '我发起的' },
      ...(center.admin() ? [{ value: 'all' as const, label: '全部单据' }] : []),
    ];
    return (
      <>
        <QueryTable
          query={documents}
          columns={columns}
          getKey={(row) => String(row.id)}
          title="单据"
          persistKey="flow-center:documents"
          blankFilters={blank}
          filters={(draft) => (
            <>
              <Field label="关键字">
                <TextField _value={draft.text} placeholder="标题或业务编号" clearable />
              </Field>
              <Field label="流程">
                <Select items={processItems} _value={draft.process} placeholder="全部" clearable />
              </Field>
              <Field label="状态">
                <Select
                  items={statuses.options()}
                  _value={draft.status}
                  placeholder="全部"
                  clearable
                />
              </Field>
            </>
          )}
          moreFilters={(draft) => (
            <Field label="发起时间">
              <DateRangePicker _value={draft.started} clearable />
            </Field>
          )}
          toolbar={
            <Tabs _value={scope} onUpdate:_value={(value: string) => (scope = value as Scope)}>
              <TabList aria-label="范围">
                {scopes.map((s) => (
                  <Tab key={s.value} value={s.value}>
                    {s.label}
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          }
          propsTable={{ onRowClick: (row) => show(row), activeKey: open ? String(active) : null }}
        />
        <Drawer _open={open} size="lg" title="审批单">
          {active !== null && <ApprovalPanel key={active} instance={active} />}
        </Drawer>
      </>
    );
  };
});
