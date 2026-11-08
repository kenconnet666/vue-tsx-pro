/**
 * 管理（只给管理员，docs/decisions/0009 第 4 节）：异常——自动处理失败的作业，重试或跳过，点一行看审批单；
 * 组织——部门、员工的维护，改完引擎马上按新的组织找处理人。实例的干预在“单据”里打开审批单做。
 * 选中的页签记在地址栏里（tab）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { Incident } from '@zerodep-dev/flow-ts-engine';
import {
  Alert,
  Button,
  DataTable,
  Drawer,
  Empty,
  Flex,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApprovalPanel } from '../parts/ApprovalPanel';
import { useIncidentActions } from '../parts/incidents';
import { OrgEditor } from '../parts/OrgEditor';
import { showError } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';

/** 作业的种类（引擎的 FlowJob.kind） */
const KIND_TEXT: Readonly<Record<string, string>> = {
  action: '自动动作',
  timer: '定时',
  receiveTimeout: '等消息超时',
  overdue: '超时',
  remind: '提醒',
  unclaimed: '没人认领',
};

export default _component(() => {
  const center = useFlowCenter();
  const route = useRoute();
  const router = useRouter();
  const { retry, skip } = useIncidentActions();
  let incidents = _state.raw<readonly Incident[]>([]);
  let open = _state(false);
  let active = _state<number | null>(null);

  const tab = () => (route.query['tab'] === 'org' ? 'org' : 'incidents');

  watch(
    () => [center.state.revision, center.state.actor] as const,
    async () => {
      if (!center.admin()) return;
      try {
        incidents = await center.client.incidents();
      } catch (error) {
        showError(error);
      }
    },
    { immediate: true },
  );

  const columns: DataTableColumn<Incident>[] = [
    {
      key: 'instanceTitle',
      header: '单据',
      minWidth: 200,
      cell: (i) => i.instanceTitle ?? `#${i.instanceId}`,
    },
    { key: 'nodeName', header: '节点', width: 140, cell: (i) => i.nodeName ?? i.node ?? '—' },
    { key: 'kind', header: '种类', width: 100, cell: (i) => KIND_TEXT[i.kind] ?? i.kind },
    { key: 'attempts', header: '试了几次', width: 90, type: 'number' },
    { key: 'error', header: '错误', minWidth: 220, wrap: true, cell: (i) => i.error ?? '—' },
    {
      key: 'actions',
      header: '',
      width: 140,
      cell: (i) => (
        <Flex gap="xs">
          <Button size="sm" variant="outline" tone="neutral" onClick={() => void retry(i)}>
            重试
          </Button>
          {i.skippable && (
            <Button size="sm" variant="ghost" tone="neutral" onClick={() => void skip(i)}>
              跳过
            </Button>
          )}
        </Flex>
      ),
    },
  ];

  return () => {
    if (!center.admin())
      return (
        <Alert
          tone="warning"
          title="只有管理员能用"
          description="顶栏把演示身份换成顾承远（总经理）。"
        />
      );
    return (
      <>
        <Tabs
          _value={tab()}
          onUpdate:_value={(value: string) => void router.replace({ query: { tab: value } })}
        >
          <TabList aria-label="管理">
            <Tab value="incidents">异常{incidents.length > 0 ? `（${incidents.length}）` : ''}</Tab>
            <Tab value="org">组织</Tab>
          </TabList>
          <TabPanel value="incidents">
            {incidents.length === 0 ? (
              <Empty title="没有异常" description="自动处理失败的作业会出现在这里。" />
            ) : (
              <DataTable
                aria-label="异常"
                rows={incidents}
                columns={columns}
                getKey={(i) => String(i.jobId)}
                activeKey={open && active !== null ? String(active) : null}
                onRowClick={(i) => {
                  active = i.instanceId;
                  open = true;
                }}
              />
            )}
          </TabPanel>
          <TabPanel value="org">
            <OrgEditor />
          </TabPanel>
        </Tabs>
        <Drawer _open={open} size="lg" title="审批单">
          {active !== null && <ApprovalPanel key={active} instance={active} />}
        </Drawer>
      </>
    );
  };
});
