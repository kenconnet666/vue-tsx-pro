// 导入校验：错误行整行浅红、提醒行浅黄（rowTone），不透明的底色盖得住固定列；只有没有错误的行能勾选导入。
// 校验结果放在前面：最要紧的一列不用横向滚动才看到
import { CircleAlert, CircleCheck, TriangleAlert } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Badge,
  Button,
  DataTable,
  Flex,
  Icon,
  Small,
  type DataTableColumn,
  type RowTone,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface Line {
  row: number;
  part: string;
  name: string;
  quantity: number | null;
  price: string | null;
  issue?: { level: 'error' | 'warning'; message: string };
}

const lines: Line[] = [
  { row: 2, part: 'G26', name: '笔记本电脑', quantity: 2, price: '450.00' },
  { row: 3, part: 'G29', name: '笔记本电脑（更改后）', quantity: 2, price: '480.00' },
  {
    row: 4,
    part: '',
    name: '紧固件组件',
    quantity: 36,
    price: '12.50',
    issue: { level: 'error', message: '件号不能为空' },
  },
  {
    row: 5,
    part: 'G43',
    name: '支架',
    quantity: null,
    price: '96.00',
    issue: { level: 'error', message: '数量必须大于 0' },
  },
  {
    row: 6,
    part: 'G44',
    name: '支架（更改后）',
    quantity: 1,
    price: '1960.00',
    issue: { level: 'warning', message: '单价比更改前高 20 倍，请核对' },
  },
  { row: 7, part: 'G73', name: '密封条', quantity: 4, price: '38.80' },
];

const toneOf = (line: Line): RowTone | undefined =>
  line.issue?.level === 'error'
    ? 'danger'
    : line.issue?.level === 'warning'
      ? 'warning'
      : undefined;

const columns: DataTableColumn<Line>[] = [
  { key: 'row', header: '行', width: 56, sticky: 'start' },
  {
    key: 'issue',
    header: '校验结果',
    width: 240,
    wrap: true,
    cell: (line) =>
      line.issue ? (
        <Flex inline align="center" gap="xs">
          <Icon
            icon={line.issue.level === 'error' ? CircleAlert : TriangleAlert}
            tone={line.issue.level === 'error' ? 'danger' : 'warning'}
          />
          {line.issue.message}
        </Flex>
      ) : (
        <Flex inline align="center" gap="xs">
          <Icon icon={CircleCheck} tone="success" />
          通过
        </Flex>
      ),
  },
  { key: 'part', header: '件号', width: 96 },
  { key: 'name', header: '零件名称', width: 180 },
  { key: 'quantity', header: '数量', width: 96 },
  {
    key: 'price',
    header: '材料单价（元）',
    width: 128,
    type: 'number',
    format: { minimumFractionDigits: 2 },
  },
];

const styles = css.create({ spacer: { flexGrow: 1 } });

export default _component(() => {
  let selected = _state<string[]>(['2', '3', '7']);
  const errors = lines.filter((line) => line.issue?.level === 'error').length;
  const warnings = lines.filter((line) => line.issue?.level === 'warning').length;
  return () => (
    <Flex direction="column" gap="sm">
      <Flex align="center" gap="sm" wrap>
        <Badge tone="danger" dot>
          {errors} 行错误
        </Badge>
        <Badge tone="warning" dot>
          {warnings} 行提醒
        </Badge>
        <Small tone="muted">错误行改好后重新上传；提醒行可以照常导入</Small>
        <span {...css.attrs(styles.spacer)} />
        <Button size="sm" disabled={selected.length === 0}>
          导入所选 {selected.length} 行
        </Button>
      </Flex>
      <DataTable
        rows={lines}
        columns={columns}
        getKey={(line) => String(line.row)}
        rowTone={toneOf}
        selectionMode="multiple"
        _selected={selected}
        isRowSelectable={(line) => line.issue?.level !== 'error'}
        density="compact"
        aria-label="导入校验结果"
      />
    </Flex>
  );
});
