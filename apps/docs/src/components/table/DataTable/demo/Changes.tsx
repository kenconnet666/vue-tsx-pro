// 采购方案调整：调整前、调整后各一组表头（型号、单价、数量），节省 = 调整前金额 − 调整后金额，底部合计。
// 分组标题跨组里的几列，没分组的列跨两行；组与相邻的列之间有竖线
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  DataTable,
  type DataTableColumn,
  type DataTableColumnGroup,
} from '@zerodep-dev/vue-tsx-pro-ui';
import Decimal from 'decimal.js';

interface Change {
  no: number;
  name: string;
  before: { part: string; price: Decimal; quantity: number };
  after: { part: string; price: Decimal; quantity: number };
}

const changes: Change[] = [
  ['笔记本电脑', 'LT-14', '4520.00', 20, 'LT-15', '3980.00', 20],
  ['显示器', 'MN-27', '1260.00', 40, 'MN-27S', '1080.00', 40],
  ['键盘鼠标套装', 'KB-200', '129.00', 60, 'KB-210', '99.00', 56],
  ['办公椅', 'CH-01', '860.00', 30, 'CH-01', '860.00', 24],
  ['打印机', 'PR-6', '2380.00', 4, 'PR-8', '2650.00', 4],
].map(([name, partBefore, priceBefore, qtyBefore, partAfter, priceAfter, qtyAfter], index) => ({
  no: index + 1,
  name: name as string,
  before: {
    part: partBefore as string,
    price: new Decimal(priceBefore as string),
    quantity: qtyBefore as number,
  },
  after: {
    part: partAfter as string,
    price: new Decimal(priceAfter as string),
    quantity: qtyAfter as number,
  },
}));

const amount = (side: Change['before']) => side.price.times(side.quantity);
const saving = (change: Change) => amount(change.before).minus(amount(change.after));

const MONEY = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

// 调整后反而更贵：节省是负数，标红
const styles = css.create({ increase: { color: '_dangerText' } });

const columns: DataTableColumn<Change>[] = [
  { key: 'no', header: '序号', width: 64, sticky: 'start' },
  { key: 'name', header: '物品', width: 140, sticky: 'start' },
  { key: 'beforePart', header: '型号', width: 88, value: (change) => change.before.part },
  {
    key: 'beforePrice',
    header: '单价（元）',
    width: 112,
    value: (change) => change.before.price,
    format: MONEY,
  },
  { key: 'beforeQuantity', header: '数量', width: 72, value: (change) => change.before.quantity },
  { key: 'afterPart', header: '型号', width: 88, value: (change) => change.after.part },
  {
    key: 'afterPrice',
    header: '单价（元）',
    width: 112,
    value: (change) => change.after.price,
    format: MONEY,
  },
  { key: 'afterQuantity', header: '数量', width: 72, value: (change) => change.after.quantity },
  {
    key: 'saving',
    header: '节省（元）',
    width: 132,
    value: saving,
    format: MONEY,
    summary: 'sum',
  },
];

const groups: DataTableColumnGroup[] = [
  { key: 'before', header: '调整前', columns: ['beforePart', 'beforePrice', 'beforeQuantity'] },
  { key: 'after', header: '调整后', columns: ['afterPart', 'afterPrice', 'afterQuantity'] },
];

export default _component(() => () => (
  <DataTable
    rows={changes}
    columns={columns}
    columnGroups={groups}
    getKey={(change) => String(change.no)}
    density="compact"
    aria-label="采购方案调整"
    propsCell={(change, column) =>
      column.key === 'saving' && saving(change).isNegative() ? { sx: styles.increase } : {}
    }
  />
));
