// 详情抽屉：列表留在原处，点一行（或编号）从结束边滑出详情——关键信息、时限、流转记录；关上后焦点回到那一行的编号，
// 正在看的那一行一直高亮（activeKey）
import { ExternalLink } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  DataTable,
  Descriptions,
  Drawer,
  Flex,
  H3,
  LinkButton,
  StatusBadge,
  Text,
  Timeline,
  createStatusMap,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import { DeadlineBadge } from '@vue-tsx-pro/ui/patterns';

interface Project {
  id: string;
  code: string;
  name: string;
  team: string;
  owner: string;
  status: 'designing' | 'verifying' | 'confirming';
  saving: number;
  due: string;
  records: { title: string; time: string; tone?: 'success' | 'warning' | 'accent' }[];
}

const TODAY = '2026-10-21';
const statuses = createStatusMap({
  designing: { label: '方案设计中', tone: 'info' },
  verifying: { label: '验证中', tone: 'accent' },
  confirming: { label: '待认定', tone: 'warning' },
});

const projects: Project[] = [
  {
    id: 'p1',
    code: 'PO-2026-0187',
    name: '显示器支架合并为一体成型',
    team: '研发中心',
    owner: '林小满',
    status: 'verifying',
    saving: 174752,
    due: '2026-10-23',
    records: [
      { title: '林小满 发起', time: '09-02 10:12', tone: 'accent' },
      { title: '王晴 · 齐全性检查：通过', time: '09-05 14:30', tone: 'success' },
      { title: '周宁 · 方案设计：提交方案', time: '09-28 16:05', tone: 'success' },
      { title: '到达 验证实施', time: '10-08 09:00' },
    ],
  },
  {
    id: 'p2',
    code: 'PO-2026-0214',
    name: '线束卡箍改用铝合金',
    team: '机体结构',
    owner: '周宁',
    status: 'designing',
    saving: 86400,
    due: '2026-10-16',
    records: [
      { title: '周宁 发起', time: '09-20 09:40', tone: 'accent' },
      { title: '陆川 · 部门审批：退回修改', time: '10-10 11:20', tone: 'warning' },
    ],
  },
  {
    id: 'p3',
    code: 'PO-2026-0233',
    name: '机柜导轨第二供应商',
    team: '供应链管理',
    owner: '韩笑',
    status: 'confirming',
    saving: 312000,
    due: '2026-10-30',
    records: [
      { title: '韩笑 发起', time: '08-12 15:00', tone: 'accent' },
      { title: '方圆 · 费用核算：出测算', time: '09-30 10:30', tone: 'success' },
    ],
  },
  {
    id: 'p4',
    code: 'FA-2026-0142',
    name: '密封件国产化',
    team: '产品部',
    owner: '陆川',
    status: 'verifying',
    saving: 128900,
    due: TODAY,
    records: [{ title: '陆川 发起', time: '09-11 08:50', tone: 'accent' }],
  },
  {
    id: 'p5',
    code: 'PO-2026-0179',
    name: '地板梁紧固件减量',
    team: '机体结构',
    owner: '方圆',
    status: 'designing',
    saving: 52600,
    due: '2026-11-12',
    records: [{ title: '方圆 发起', time: '10-15 13:25', tone: 'accent' }],
  },
];

const money = (value: number) => `¥${value.toLocaleString('zh-CN')}`;

export default _component(() => {
  let active = _state<string | null>(null);
  let open = _state(false);
  const show = (id: string) => {
    active = id;
    open = true;
  };
  const columns: DataTableColumn<Project>[] = [
    {
      key: 'code',
      header: '编号',
      width: 150,
      cell: (row) => (
        <Button size="sm" variant="link" onClick={() => show(row.id)}>
          {row.code}
        </Button>
      ),
    },
    { key: 'name', header: '名称', width: 240 },
    { key: 'team', header: '责任团队', width: 140 },
    {
      key: 'status',
      header: '状态',
      width: 120,
      cell: (row) => <StatusBadge statuses={statuses} value={row.status} />,
    },
    { key: 'saving', header: '预计年销售', width: 140, align: 'end', format: { currency: 'CNY' } },
    {
      key: 'due',
      header: '当前环节时限',
      width: 150,
      cell: (row) => <DeadlineBadge due={row.due} today={TODAY} />,
    },
  ];

  return () => {
    const current = projects.find((row) => row.id === active);
    return (
      <>
        <DataTable
          aria-label="项目"
          rows={projects}
          columns={columns}
          getKey={(row) => row.id}
          activeKey={open ? active : null}
          onRowClick={(row) => show(row.id)}
          density="compact"
        />
        <Drawer
          _open={open}
          size="sm"
          title={current?.name ?? ''}
          description={current && `${current.code} · ${current.team}`}
          footer={
            <LinkButton href="#detail" variant="soft" tone="neutral" icon={ExternalLink}>
              打开完整详情
            </LinkButton>
          }
        >
          {current && (
            <Flex direction="column" gap="lg">
              <Flex align="center" gap="sm">
                <StatusBadge statuses={statuses} value={current.status} />
                <DeadlineBadge due={current.due} today={TODAY} />
              </Flex>
              <Descriptions
                columns={2}
                items={[
                  { label: '主办', value: current.owner },
                  { label: '责任团队', value: current.team },
                  {
                    label: '预计年销售',
                    value: <Text numeric>{money(current.saving)}</Text>,
                  },
                  { label: '当前环节截止', value: current.due },
                ]}
              />
              <Flex direction="column" gap="sm">
                <H3 size="sm">流转记录</H3>
                <Timeline
                  size="sm"
                  reverse
                  items={current.records.map((record) => ({
                    title: record.title,
                    time: record.time,
                    tone: record.tone,
                  }))}
                />
              </Flex>
            </Flex>
          )}
        </Drawer>
      </>
    );
  };
});
