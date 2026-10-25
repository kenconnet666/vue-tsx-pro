// 采购单：表头筛选（列出出现过的值、状态、关键字）、多列排序（Shift 点追加）、列菜单（固定、前后移动、隐藏）；
// 列设置（顺序、固定、隐藏、宽度）记在浏览器里，下次打开还是这样；上方一行说明当前的筛选与排序，可以一键还原
import { RotateCcw } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  createStatusMap,
  DataTable,
  Flex,
  Small,
  usePersistentState,
  type ColumnStickies,
  type DataTableColumn,
  type SortState,
} from '@vue-tsx-pro/ui';

interface PurchaseOrder {
  id: string;
  supplier: string;
  category: string;
  buyer: string;
  status: 'draft' | 'approving' | 'ordered' | 'received';
  amount: number;
  orderedAt: Date;
}

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  approving: { label: '审批中', tone: 'warning' },
  ordered: { label: '已下单', tone: 'info' },
  received: { label: '已到货', tone: 'success' },
});

const suppliers = ['华辰精密机加', '启航复材', '远山钣金', '恒通紧固件', '北辰电子'];
const categories = ['机加件', '复材件', '钣金件', '标准件', '线缆'];
const buyers = ['林小满', '周一航', '陈默', '许悠', '王晴', '赵浩然'];
const states = statuses.keys;
const LATEST = new Date(2026, 9, 21).getTime();

const orders: PurchaseOrder[] = Array.from({ length: 240 }, (_, index) => ({
  id: `PO-2026-${String(1000 + index)}`,
  supplier: suppliers[(index * 3) % suppliers.length]!,
  category: categories[(index * 7) % categories.length]!,
  buyer: buyers[(index * 5) % buyers.length]!,
  status: states[(index * 11) % states.length]!,
  amount: Math.round(((index * 7919) % 90_000) + 1200),
  orderedAt: new Date(LATEST - ((index * 13) % 60) * 86_400_000),
}));

const columns: DataTableColumn<PurchaseOrder>[] = [
  { key: 'id', header: '采购单号', width: 160, sticky: 'start', filter: { options: 'text' } },
  { key: 'supplier', header: '供应商', sortable: true, filter: true },
  { key: 'category', header: '品类', width: 130, sortable: true, filter: true },
  { key: 'buyer', header: '采购员', width: 140, filter: true },
  { key: 'status', header: '状态', width: 140, statuses, filter: true },
  { key: 'amount', header: '金额', width: 150, type: 'currency', sortable: true },
  { key: 'orderedAt', header: '下单日期', width: 150, type: 'date', sortable: true },
];

const styles = css.create({
  table: { height: '22rem' },
});

export default _component(() => {
  let filters = _state<Record<string, string[]>>({});
  let sorts = _state<SortState[]>([{ key: 'orderedAt', direction: 'descending' }]);
  // 各人的列设置：记在浏览器里
  let hidden = _fromRef(usePersistentState<string[]>('docs:po-hidden', []));
  let order = _fromRef(usePersistentState<string[]>('docs:po-order', []));
  let pins = _fromRef(
    usePersistentState<Record<string, keyof ColumnStickies | null>>('docs:po-pins', {}),
  );
  let widths = _fromRef(usePersistentState<Record<string, number>>('docs:po-widths', {}));

  // 列标题都是文字
  const header = (key: string) =>
    (columns.find((column) => column.key === key)?.header as string | undefined) ?? key;
  const summary = () => {
    const parts = Object.entries(filters)
      .filter(([, values]) => values.length)
      .map(([key, values]) => {
        const labels = key === 'status' ? values.map((value) => statuses.label(value)) : values;
        return `${header(key)}：${labels.join('、')}`;
      });
    const order = sorts.map(
      (sort, index) =>
        `${index + 1}. ${header(sort.key)}${sort.direction === 'ascending' ? '↑' : '↓'}`,
    );
    return [
      parts.length ? `筛选 ${parts.join('；')}` : '没有筛选',
      order.length ? `排序 ${order.join(' ')}` : '没有排序',
    ].join(' · ');
  };
  const customized = () =>
    hidden.length > 0 ||
    order.length > 0 ||
    Object.keys(pins).length > 0 ||
    Object.keys(widths).length > 0;

  function reset() {
    hidden = [];
    order = [];
    pins = {};
    widths = {};
  }

  return () => (
    <Flex direction="column" gap="sm">
      <Flex align="center" justify="between" gap="md" wrap>
        <Small tone="muted">{summary()}</Small>
        <Button size="sm" variant="ghost" icon={RotateCcw} disabled={!customized()} onClick={reset}>
          还原列设置
        </Button>
      </Flex>
      <DataTable
        rows={orders}
        columns={columns}
        getKey={(row) => row.id}
        _filters={_bind(filters)}
        multiSort
        _sorts={_bind(sorts)}
        columnMenu
        resizable
        _hiddenColumns={_bind(hidden)}
        _columnOrder={_bind(order)}
        _columnPins={_bind(pins)}
        _columnWidths={_bind(widths)}
        aria-label="采购单"
        propsRoot={{ sx: styles.table }}
      />
    </Flex>
  );
});
