// 降本台账：金额以元保存、按万元显示并在底部合计；状态列取自状态映射；商务金额没谈定时显示“待定价”。
// 已关闭的任务不能勾选；勾选后上方出现批量操作栏；“列”菜单切换哪些列显示
import { Columns3, Download, Ellipsis, FileText, Send } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  createStatusMap,
  DataTable,
  Flex,
  IconButton,
  Menu,
  MenuCheckboxItem,
  MenuItem,
  SelectionBar,
  Small,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

const statuses = createStatusMap({
  designing: { label: '方案设计中', tone: 'info' },
  verifying: { label: '验证中', tone: 'info' },
  awaiting: { label: '待认定', tone: 'warning' },
  negotiating: { label: '商务洽谈中', tone: 'warning' },
  closed: { label: '关闭', tone: 'success' },
});

interface Task {
  code: string;
  name: string;
  category: string;
  team: string;
  /** 测算金额 A（元） */
  estimate: Decimal;
  /** 商务谈定金额 B（元）；没谈定时为 null */
  agreed: Decimal | null;
  /** 降 DMC（美元/FH） */
  dmc: Decimal | null;
  status: string;
}

const tasks: Task[] = [
  [
    'DJ-2026-FC-1',
    '机型 A 平尾翼根整流罩设计优化',
    '设计优化',
    '复合材料结构',
    '155353.20',
    null,
    null,
    'verifying',
  ],
  [
    'DJ-2026-ZZ-2',
    '机型 A 机身支架工艺优化',
    '工艺优化',
    '总体技术集成',
    '109600.00',
    '98000.00',
    '3.20',
    'closed',
  ],
  [
    'DJ-2026-CG-3',
    '舱门密封件第二货源',
    '多货源',
    '采购',
    '143000.00',
    '150500.00',
    null,
    'negotiating',
  ],
  [
    'DJ-2026-FC-4',
    '客舱地板支撑件设计优化',
    '设计优化',
    '复合材料结构',
    '178800.00',
    null,
    '1.75',
    'awaiting',
  ],
  [
    'DJ-2026-ZZ-5',
    '线束支架工艺优化',
    '工艺优化',
    '总体技术集成',
    '217000.00',
    null,
    null,
    'designing',
  ],
  [
    'DJ-2026-CG-6',
    '内饰连接件多货源',
    '多货源',
    '采购',
    '257600.00',
    '240000.00',
    '0.80',
    'closed',
  ],
].map(([code, name, category, team, estimate, agreed, dmc, status]) => ({
  code: code!,
  name: name!,
  category: category!,
  team: team!,
  estimate: new Decimal(estimate!),
  agreed: agreed ? new Decimal(agreed) : null,
  dmc: dmc ? new Decimal(dmc) : null,
  status: status!,
}));

// 以元保存、按万元显示：表头写单位，数字列更整齐
const WAN = { scale: 10_000, minimumFractionDigits: 2, maximumFractionDigits: 2 };

const columns: DataTableColumn<Task>[] = [
  { key: 'code', header: '降本项目编码', width: 132, sticky: 'start', sortable: true },
  { key: 'name', header: '项目名称', width: 240, sortable: true },
  { key: 'category', header: '类别', width: 96 },
  { key: 'team', header: '责任团队', width: 120 },
  {
    key: 'estimate',
    header: '测算 A（万元）',
    width: 128,
    format: WAN,
    sortable: true,
    summary: 'sum',
  },
  {
    key: 'agreed',
    header: '谈定 B（万元）',
    width: 128,
    format: WAN,
    empty: '待定价',
    summary: 'sum',
  },
  { key: 'dmc', header: '降 DMC（美元/FH）', width: 140, format: { minimumFractionDigits: 2 } },
  { key: 'status', header: '状态', width: 120, statuses },
  {
    key: 'actions',
    header: '操作',
    width: 112,
    sticky: 'end',
    cell: (task) => (
      <Flex align="center" gap="xs">
        <Button size="sm" variant="ghost">
          查看
        </Button>
        <Menu
          trigger={(props) => (
            <IconButton {...props} size="sm" icon={Ellipsis} aria-label={`更多：${task.code}`} />
          )}
        >
          <MenuItem icon={FileText}>任务卡</MenuItem>
          <MenuItem icon={Send}>提交认定</MenuItem>
        </Menu>
      </Flex>
    ),
  },
];

// 可以隐藏的列（编码、名称、操作一直显示）
const optional = columns.filter((column) => !['code', 'name', 'actions'].includes(column.key));

const styles = css.create({ table: { maxHeight: '24rem' } });

export default _component(() => {
  let selected = _state<string[]>([]);
  let hidden = _state<string[]>(['dmc']);
  const toggleColumn = (key: string, on: boolean) =>
    (hidden = on ? hidden.filter((item) => item !== key) : [...hidden, key]);

  return () => (
    <Flex direction="column" gap="sm">
      <Flex align="center" justify="between" gap="sm" wrap>
        <Small tone="muted">共 {tasks.length} 项 · 已关闭的不能勾选</Small>
        <Flex gap="sm">
          <Menu
            trigger={(props) => (
              <Button {...props} size="sm" variant="outline" tone="neutral" icon={Columns3}>
                列
              </Button>
            )}
          >
            {optional.map((column) => (
              <MenuCheckboxItem
                key={column.key}
                checked={_bind(
                  () => !hidden.includes(column.key),
                  (on: boolean) => toggleColumn(column.key, on),
                )}
              >
                {column.header}
              </MenuCheckboxItem>
            ))}
          </Menu>
        </Flex>
      </Flex>
      <SelectionBar count={selected.length} onClear={() => (selected = [])}>
        <Button size="sm" variant="outline" tone="neutral" icon={Download}>
          导出所选
        </Button>
        <Button size="sm" icon={Send}>
          批量提交认定
        </Button>
      </SelectionBar>
      <DataTable
        rows={tasks}
        columns={columns}
        getKey={(task) => task.code}
        selectionMode="multiple"
        selected={_bind(selected)}
        isRowSelectable={(task) => task.status !== 'closed'}
        hiddenColumns={hidden}
        aria-label="降本台账"
        propsRoot={{ sx: styles.table }}
      />
    </Flex>
  );
});
