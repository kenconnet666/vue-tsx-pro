// 采购申请明细：就地编辑。零件、数量、单价、交期可以改（交期用自定义编辑器 DateField），小计跟着算；
// 列的 validate 拦下不合理的值，validateRow 标出整行的问题（交期早于今天），onCellChange 模拟保存（已下单的行不能改数量）
import { _component } from '@vue-tsx-pro/tsx';
import {
  createStatusMap,
  DataTable,
  DateField,
  Flex,
  Small,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';

interface Line {
  id: string;
  part: string;
  quantity: number;
  price: number;
  due: string;
  status: 'draft' | 'ordered';
}

const TODAY = '2026-10-24';

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  ordered: { label: '已下单', tone: 'info' },
});

const columns: DataTableColumn<Line>[] = [
  { key: 'id', header: '行号', width: 70 },
  {
    key: 'part',
    header: '零件',
    minWidth: 180,
    editable: true,
    validate: (value) => (typeof value === 'string' && value.trim() ? null : '零件名称不能为空'),
  },
  {
    key: 'quantity',
    header: '数量',
    width: 100,
    type: 'number',
    editable: true,
    validate: (value) =>
      typeof value === 'number' && Number.isInteger(value) && value > 0 ? null : '数量是正整数',
  },
  {
    key: 'price',
    header: '单价',
    width: 120,
    type: 'currency',
    editable: true,
    validate: (value) => (typeof value === 'number' && value >= 0 ? null : '单价不能为负'),
  },
  {
    key: 'subtotal',
    header: '小计',
    width: 130,
    type: 'currency',
    value: (line) => line.quantity * line.price,
    summary: 'sum',
  },
  {
    key: 'due',
    header: '交期',
    width: 150,
    type: 'date',
    editable: true,
    // 自定义编辑器：拿到草稿、提交与放弃
    editor: ({ value, onChange, error }) => (
      <DateField
        _value={(value as string | null) ?? null}
        onUpdate:_value={onChange}
        size="sm"
        invalid={!!error}
        aria-label="交期"
      />
    ),
  },
  { key: 'status', header: '状态', width: 100, statuses },
];

export default _component(() => {
  let lines = _state<Line[]>([
    { id: '1', part: '整流罩支架', quantity: 40, price: 128, due: '2026-11-05', status: 'ordered' },
    { id: '2', part: '铰链底座', quantity: 80, price: 76.5, due: '2026-11-12', status: 'draft' },
    { id: '3', part: '检修口盖板', quantity: 24, price: 212, due: '2026-10-20', status: 'draft' },
    { id: '4', part: '线束卡箍', quantity: 300, price: 3.2, due: '2026-11-30', status: 'draft' },
  ]);
  let saved = _state('');

  async function save(line: Line, key: string, value: unknown) {
    // 模拟保存：已下单的行不能改数量（接口拒绝时返回原因，编辑器留着并显示它）
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (line.status === 'ordered' && key === 'quantity') return '已下单的行不能改数量，请走变更单';
    lines = lines.map((item) => (item.id === line.id ? { ...item, [key]: value } : item));
    saved = `第 ${line.id} 行已保存`;
  }

  return () => (
    <Flex direction="column" gap="sm">
      <DataTable
        rows={lines}
        columns={columns}
        getKey={(line) => line.id}
        onCellChange={save}
        validateRow={(line) => (line.due < TODAY ? { due: '交期早于今天，请重新约定' } : null)}
        aria-label="采购申请明细"
      />
      <Small tone="muted" aria-live="polite">
        {saved ||
          '方向键在格之间走；在可编辑的格上按 Enter、F2、双击或直接打字开始编辑，Enter 提交，Tab 到下一格，Esc 放弃'}
      </Small>
    </Flex>
  );
});
