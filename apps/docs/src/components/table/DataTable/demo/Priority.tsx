// 需求排期：拖动把手（或聚焦后空格拿起、↑↓ 移动、空格放下）调整优先级，序号跟着变；
// 点“预计工时”排序时显示的不是排期顺序，把手收起，取消排序后又能拖
import { _component } from '@vue-tsx-pro/tsx';
import {
  createStatusMap,
  DataTable,
  Flex,
  Small,
  type DataTableColumn,
  type SortState,
} from '@vue-tsx-pro/ui';

interface Requirement {
  id: string;
  title: string;
  owner: string;
  hours: number;
  status: 'todo' | 'doing' | 'review';
}

const statuses = createStatusMap({
  todo: { label: '未开始', tone: 'neutral' },
  doing: { label: '进行中', tone: 'info' },
  review: { label: '待验收', tone: 'warning' },
});

export default _component(() => {
  let rows = _state<Requirement[]>([
    {
      id: 'R-201',
      title: '台账导出按分组表头合并单元格',
      owner: '林小满',
      hours: 16,
      status: 'doing',
    },
    { id: 'R-198', title: '供应商报价单批量导入', owner: '周一航', hours: 24, status: 'todo' },
    { id: 'R-205', title: '审批流超时自动提醒', owner: '陈默', hours: 8, status: 'review' },
    { id: 'R-187', title: '移动端看板只读视图', owner: '许悠', hours: 32, status: 'todo' },
    { id: 'R-210', title: '降本认定单打印模板', owner: '王晴', hours: 6, status: 'todo' },
    { id: 'R-193', title: '项目编码规则可配置', owner: '赵浩然', hours: 12, status: 'doing' },
  ]);
  let sort = _state<SortState | null>(null);

  const columns: DataTableColumn<Requirement>[] = [
    {
      key: 'rank',
      header: '排期',
      width: 88,
      cell: (row) => rows.indexOf(row) + 1,
    },
    { key: 'title', header: '需求', minWidth: 240 },
    { key: 'id', header: '编号', width: 90 },
    { key: 'owner', header: '负责人', width: 100 },
    { key: 'hours', header: '预计工时', width: 110, type: 'number', sortable: true },
    { key: 'status', header: '状态', width: 100, statuses },
  ];

  return () => (
    <Flex direction="column" gap="sm">
      <DataTable
        rows={rows}
        columns={columns}
        getKey={(row) => row.id}
        _sort={sort}
        onReorder={(next) => (rows = next)}
        aria-label="需求排期"
      />
      <Small tone="muted">
        {sort ? '按工时排序中：取消排序后才能拖动调整排期' : '拖动把手调整排期，排在前面的先做'}
      </Small>
    </Flex>
  );
});
