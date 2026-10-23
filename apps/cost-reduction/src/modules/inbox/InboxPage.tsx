/**
 * 收件箱（DESIGN.md §6.2）：流转以收件箱为单位，线上到岗、线下到人。页签：我的待办（认领的、指定给我的、流程直接给我的）、
 * 岗位待认领、待指定（岗位负责人）、我已处理、我发起的。左边列表、右边是选中这一条的预览与处理（分栏可拖、可收起右栏）。
 * 页签、选中的一条、查询条件都在地址里（通知、工作台点进来直接定位）；岗位待认领可以批量认领。
 * 列表在前端筛选：一个页签的待办不多，后端分页等接上自研引擎再说
 */
import { Hand, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Button,
  DataTable,
  Empty,
  queryCodecs,
  Select,
  Small,
  Splitter,
  Switch,
  Tab,
  TabList,
  Tabs,
  TextField,
  useFormat,
  usePersistentState,
  useQueryState,
  useRequest,
  type DataTableColumn,
  type WorkItem,
  Flex,
  Text,
  ViewportFill,
} from '@vue-tsx-pro/ui';
import { DeadlineBadge } from '@vue-tsx-pro/ui/patterns';
import { claimWorkItem, listWorkItems } from '../../api/workflow';
import { notifyError, toaster } from '../../app/feedback';
import { PageNav } from '../../app/layout/PageNav';
import { personName } from '../../app/master';
import { announceWorkflowChange, workflowVersion } from '../../app/sync';
import { TODAY } from '../../domain/clock';
import { processDefinitions } from '../../domain/workflow';
import { inboxViews, type InboxView } from '../../domain/workflow/inbox';
import {
  arrivals,
  fromText,
  handlerText,
  inboxViewLabels,
  outcomeLabel,
  processName,
} from '../../shared/work-item-labels';
import { InboxPreview } from './InboxPreview';

const styles = stylex.create({
  search: { width: '16rem' },
  select: { width: '10rem' },
  // 预览栏里没选中时：空状态在栏里居中
  fill: { height: '100%' },
});

/** 查询：关键字（编号、名称、环节）、流程、到达方式、只看超时 */
interface InboxFilters {
  keyword: string;
  process: string;
  arrival: string;
  overdue: boolean;
}

const matches = (item: WorkItem, filters: InboxFilters) => {
  const keyword = filters.keyword.trim();
  return (
    (!keyword ||
      [item.businessKey, item.title, item.name].some((text) => text.includes(keyword))) &&
    (!filters.process || item.processKey === filters.process) &&
    (!filters.arrival || item.arrival === filters.arrival) &&
    (!filters.overdue || (item.state === 'open' && item.dueOn != null && item.dueOn < TODAY))
  );
};

/** 收件箱 */
export default _component(() => {
  const format = useFormat();
  let view = _fromRef(useQueryState<InboxView>('view', 'mine', queryCodecs.oneOf(inboxViews)));
  let selectedId = _fromRef(useQueryState('item', ''));
  let keyword = _fromRef(useQueryState('q', ''));
  let process = _fromRef(useQueryState('process', ''));
  let arrival = _fromRef(useQueryState('arrival', ''));
  let overdue = _fromRef(useQueryState('overdue', false, queryCodecs.boolean));
  // 分栏的比例、右栏收没收起：各人记住
  let layout = _fromRef(
    usePersistentState('cost-reduction:inbox-layout', { size: 56, previewHidden: false }),
  );
  let checked = _state<string[]>([]);
  let claiming = _state(false);

  const list = useRequest(
    ([current]: [InboxView, number], signal) => listWorkItems(current, signal),
    { params: () => [view, workflowVersion()] as [InboxView, number] },
  );
  const rows = () =>
    (list.data?.items ?? []).filter((item) =>
      matches(item, { keyword, process, arrival, overdue }),
    );
  const selected = () => list.data?.items.find((item) => item.id === selectedId) ?? null;

  function open(item: WorkItem) {
    selectedId = item.id;
    if (layout.previewHidden) layout = { ...layout, previewHidden: false };
  }

  /** 批量认领：先点先得，被别人抢先的提示出来 */
  async function claimChecked() {
    claiming = true;
    const results = await Promise.allSettled(checked.map((id) => claimWorkItem(id)));
    claiming = false;
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length < results.length)
      toaster.show({ title: `已认领 ${results.length - failed.length} 条`, tone: 'success' });
    if (failed.length)
      notifyError(`${failed.length} 条没能认领`, (failed[0] as PromiseRejectedResult).reason);
    checked = [];
    announceWorkflowChange();
  }

  const columns = (): DataTableColumn<WorkItem>[] => [
    {
      key: 'code',
      header: '编号',
      width: 150,
      sortable: true,
      value: (item) => item.businessKey,
      // 键盘的入口：整行点击是鼠标的捷径
      cell: (item) => (
        <Button size="sm" variant="link" onClick={() => open(item)}>
          <Text mono size="sm">
            {item.businessKey}
          </Text>
        </Button>
      ),
    },
    { key: 'title', header: '名称', width: 200, value: (item) => item.title },
    { key: 'node', header: '环节', width: 120, sortable: true, value: (item) => item.name },
    {
      key: 'process',
      header: '流程',
      width: 120,
      value: (item) => processName(item.processKey),
    },
    {
      key: 'arrival',
      header: '到达方式',
      width: 90,
      value: (item) => arrivals[item.arrival].label,
      cell: (item) => (
        <Badge tone={arrivals[item.arrival].tone}>{arrivals[item.arrival].label}</Badge>
      ),
    },
    { key: 'from', header: '来自', width: 160, value: (item) => fromText(item) },
    {
      key: 'arrived',
      header: '到达',
      width: 110,
      sortable: true,
      value: (item) => item.createdAt,
      cell: (item) =>
        format.date(item.createdAt, {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    ...(view === 'done'
      ? [
          {
            key: 'outcome',
            header: '处理结果',
            width: 120,
            value: (item: WorkItem) => outcomeLabel(item),
          } satisfies DataTableColumn<WorkItem>,
          {
            key: 'completedAt',
            header: '处理时间',
            width: 110,
            sortable: true,
            value: (item: WorkItem) => item.completion?.at,
            cell: (item: WorkItem) =>
              item.completion
                ? format.date(item.completion.at, { month: '2-digit', day: '2-digit' })
                : '—',
          } satisfies DataTableColumn<WorkItem>,
        ]
      : [
          {
            key: 'due',
            header: '剩余',
            width: 140,
            sortable: true,
            value: (item: WorkItem) => item.dueOn ?? '9999',
            cell: (item: WorkItem) =>
              item.dueOn ? (
                <DeadlineBadge due={item.dueOn} today={TODAY} />
              ) : (
                <Small tone="muted">不限</Small>
              ),
          } satisfies DataTableColumn<WorkItem>,
          {
            key: 'handler',
            header: view === 'mine' ? '认领人' : '处理人',
            width: 140,
            value: (item: WorkItem) => handlerText(item),
            cell: (item: WorkItem) =>
              item.assignee ? (
                personName(item.assignee)
              ) : (
                <Small tone="muted">{handlerText(item)}</Small>
              ),
          } satisfies DataTableColumn<WorkItem>,
        ]),
  ];

  return () => {
    const current = selected();
    return (
      <>
        <PageNav>
          <Tabs
            value={_bind(
              () => view,
              (next: InboxView) => {
                view = next;
                checked = [];
              },
            )}
          >
            <TabList aria-label="收件箱">
              {inboxViews.map((value) => (
                <Tab key={value} value={value}>
                  {inboxViewLabels[value]}
                  {value !== 'done' && (
                    <Badge
                      radius="full"
                      tone={
                        value === 'designate' && (list.data?.counts.designate ?? 0) > 0
                          ? 'warning'
                          : view === value
                            ? 'accent'
                            : 'neutral'
                      }
                    >
                      {list.data?.counts[value] ?? '…'}
                    </Badge>
                  )}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </PageNav>
        <ViewportFill gap="md">
          <Flex align="center" gap="sm" wrap>
            <TextField
              value={_bind(keyword)}
              icon={Search}
              placeholder="编号 / 名称 / 环节"
              clearable
              aria-label="关键字"
              sx={styles.search}
            />
            <Select
              items={processDefinitions.map((definition) => ({
                value: definition.key,
                label: definition.name,
              }))}
              value={_bind(
                () => process || null,
                (next: string | null) => (process = next ?? ''),
              )}
              placeholder="全部流程"
              clearable
              aria-label="流程"
              sx={styles.select}
            />
            <Select
              items={Object.entries(arrivals).map(([value, { label }]) => ({ value, label }))}
              value={_bind(
                () => arrival || null,
                (next: string | null) => (arrival = next ?? ''),
              )}
              placeholder="全部到达方式"
              clearable
              aria-label="到达方式"
              sx={styles.select}
            />
            {view !== 'done' && <Switch checked={_bind(overdue)}>只看超时</Switch>}
            {view === 'pool' && checked.length > 0 && (
              <Button icon={Hand} loading={claiming} onClick={() => void claimChecked()}>
                认领所选（{checked.length}）
              </Button>
            )}
            <Small tone="muted">
              {view === 'pool'
                ? '岗位成员都能认领，先点先得；认领后别人就看不到了'
                : view === 'designate'
                  ? '超过 3 个工作日没人认领、或有人申请改派的，由你指定承办人'
                  : ''}
            </Small>
          </Flex>
          <Splitter
            bordered
            size={_bind(
              () => layout.size,
              (size: number) => (layout = { ...layout, size }),
            )}
            minSize={35}
            maxSize={75}
            collapsible="end"
            collapsed={_bind(
              () => layout.previewHidden,
              (previewHidden: boolean) => (layout = { ...layout, previewHidden }),
            )}
            label="调整列表与预览的宽度"
            start={
              <DataTable
                aria-label={inboxViewLabels[view]}
                rows={rows()}
                loading={list.loading && !list.data}
                columns={columns()}
                getKey={(item) => item.id}
                selectionMode={view === 'pool' ? 'multiple' : undefined}
                selected={_bind(checked)}
                activeKey={current?.id ?? null}
                onRowClick={(item) => open(item)}
                rowTone={(item) =>
                  item.state === 'open' && item.dueOn != null && item.dueOn < TODAY
                    ? 'danger'
                    : undefined
                }
                empty={
                  list.data?.items.length
                    ? '没有符合条件的待办'
                    : view === 'mine'
                      ? '手上没有待办'
                      : '没有记录'
                }
                variant="ghost"
                flexible
              />
            }
            end={
              current ? (
                <InboxPreview
                  key={current.id}
                  item={current}
                  onChange={() => void list.refresh()}
                />
              ) : (
                <Flex align="center" justify="center" sx={styles.fill}>
                  {list.data && (
                    <Empty
                      size="sm"
                      title={selectedId ? '这一条不在当前页签里' : '选一条看详情'}
                      description={
                        selectedId
                          ? '可能已经被处理、被别人认领，或在别的页签'
                          : '点列表里的一行，在这里预览并处理'
                      }
                    />
                  )}
                </Flex>
              )
            }
          />
        </ViewportFill>
      </>
    );
  };
});
