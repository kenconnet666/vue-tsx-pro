// 导出 Excel：表格怎么显示就怎么导——分组表头导出成两行、组标题合并，金额是真正的数值（按万元换算、带数字格式），
// 状态写名字，底部合计；同一份列定义交给 DataTable 显示
import { Download } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  createStatusMap,
  DataTable,
  Flex,
  type DataTableColumn,
  type DataTableColumnGroup,
} from '@vue-tsx-pro/ui';
import { exportXlsx } from '@vue-tsx-pro/ui/xlsx';

interface Saving {
  code: string;
  name: string;
  team: string;
  target: number;
  actual: number | null;
  status: 'designing' | 'verifying' | 'confirmed';
}

const statuses = createStatusMap({
  designing: { label: '设计中', tone: 'info' },
  verifying: { label: '测试中', tone: 'accent' },
  confirmed: { label: '已验收', tone: 'success' },
});

const rows: Saving[] = [
  {
    code: 'PO-2026-0187',
    name: '显示器支架合并为一体成型',
    team: '研发中心',
    target: 174_752,
    actual: 160_300,
    status: 'verifying',
  },
  {
    code: 'PO-2026-0214',
    name: '线束卡箍改用铝合金',
    team: '生产部',
    target: 86_400,
    actual: null,
    status: 'designing',
  },
  {
    code: 'PO-2026-0233',
    name: '机柜导轨第二供应商',
    team: '供应链管理',
    target: 312_000,
    actual: 335_800,
    status: 'confirmed',
  },
  {
    code: 'PO-2026-0203',
    name: '检修口盖板减重',
    team: '生产部',
    target: 52_600,
    actual: 48_900,
    status: 'confirmed',
  },
];

const columns: DataTableColumn<Saving>[] = [
  { key: 'code', header: '项目编码', width: 150, sticky: 'start' },
  { key: 'name', header: '项目名称', minWidth: 220 },
  { key: 'team', header: '责任团队', width: 130 },
  {
    key: 'target',
    header: '目标',
    width: 110,
    type: 'currency',
    summary: 'sum',
    format: { scale: 10_000 },
  },
  {
    key: 'actual',
    header: '实际',
    width: 110,
    type: 'currency',
    summary: 'sum',
    format: { scale: 10_000 },
    empty: '待验收',
  },
  { key: 'status', header: '状态', width: 120, statuses },
];

const groups: DataTableColumnGroup[] = [
  { key: 'saving', header: '收益（万元）', columns: ['target', 'actual'] },
];

export default _component(() => {
  let exporting = _state(false);

  async function download() {
    exporting = true;
    try {
      await exportXlsx('销售台账', [{ name: '台账', rows, columns, groups }]);
    } finally {
      exporting = false;
    }
  }

  return () => (
    <Flex direction="column" gap="sm">
      <Flex justify="end">
        <Button
          size="sm"
          variant="outline"
          tone="neutral"
          icon={Download}
          loading={exporting}
          onClick={() => void download()}
        >
          导出 Excel
        </Button>
      </Flex>
      <DataTable
        rows={rows}
        columns={columns}
        columnGroups={groups}
        getKey={(row) => row.code}
        aria-label="销售台账"
      />
    </Flex>
  );
});
