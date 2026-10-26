// 紧凑的排法：表格的格子里用 layout="icons"（只有一排状态图标，悬停与读屏有每一项的说明），
// 详情行、卡片的一角用 layout="inline"（一行排开、放不下换行）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Checklist,
  ColumnTable,
  Flex,
  Small,
  type ChecklistItem,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface Project {
  code: string;
  name: string;
  nodes: ChecklistItem[];
}

const node = (label: string, status: ChecklistItem['status'], date?: string): ChecklistItem => ({
  label,
  status,
  date,
});

const projects: Project[] = [
  {
    code: 'PO-2026-0187',
    name: '官网首页改版',
    nodes: [
      node('评审', 'done', '08-12'),
      node('样品', 'done', '09-20'),
      node('切换', 'overdue', '计划 10-15'),
      node('关闭', 'todo'),
    ],
  },
  {
    code: 'PO-2026-0203',
    name: '线缆收纳夹国产化',
    nodes: [
      node('评审', 'done', '09-02'),
      node('样品', 'todo', '计划 11-05'),
      node('切换', 'todo'),
      node('关闭', 'todo'),
    ],
  },
  {
    code: 'PO-2026-0211',
    name: '门店照明改造',
    nodes: [
      node('评审', 'done', '07-30'),
      node('样品', 'done', '08-28'),
      node('切换', 'done', '09-30'),
      node('关闭', 'blocked', '等财务复核'),
    ],
  },
];

const columns: DataTableColumn<Project>[] = [
  { key: 'code', header: '编号', width: 130 },
  { key: 'name', header: '名称' },
  {
    key: 'nodes',
    header: '节点',
    cell: (project) => <Checklist layout="icons" items={project.nodes} />,
  },
];

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <ColumnTable rows={projects} columns={columns} getKey={(row) => row.code} aria-label="项目" />
    <Flex direction="column" gap="xs">
      <Small tone="muted">PO-2026-0187 的实施节点</Small>
      <Checklist layout="inline" items={projects[0]!.nodes} />
    </Flex>
  </Flex>
));
