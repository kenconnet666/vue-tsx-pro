// 零件更改对比：更改前、更改后各一组表头（件号、单价、单机数量），单机降本 = 更改前金额 − 更改后金额，底部合计。
// 分组标题跨组里的几列，没分组的列跨两行；组与相邻的列之间有竖线
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { DataTable, type DataTableColumn, type DataTableColumnGroup } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

interface Change {
  no: number;
  name: string;
  before: { part: string; price: Decimal; quantity: number };
  after: { part: string; price: Decimal; quantity: number };
}

const changes: Change[] = [
  ['整流罩蒙皮', 'G26', '4520.00', 2, 'G29', '3980.00', 2],
  ['整流罩支架', 'G31', '860.00', 4, 'G33', '720.00', 4],
  ['紧固件组件', 'G40', '12.50', 36, 'G40A', '9.80', 32],
  ['密封条', 'G73', '38.80', 6, 'G73', '38.80', 4],
  ['口盖', 'G81', '1260.00', 1, 'G85', '1310.00', 1],
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

// 更改后反而更贵：单机降本是负数，标红
const styles = css.create({ increase: { color: '_dangerText' } });

const columns: DataTableColumn<Change>[] = [
  { key: 'no', header: '序号', width: 64, sticky: 'start' },
  { key: 'name', header: '零件名称', width: 140, sticky: 'start' },
  { key: 'beforePart', header: '件号', width: 88, value: (change) => change.before.part },
  {
    key: 'beforePrice',
    header: '单价（元）',
    width: 112,
    value: (change) => change.before.price,
    format: MONEY,
  },
  { key: 'beforeQuantity', header: '数量', width: 72, value: (change) => change.before.quantity },
  { key: 'afterPart', header: '件号', width: 88, value: (change) => change.after.part },
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
    header: '单机降本（元）',
    width: 132,
    value: saving,
    format: MONEY,
    summary: 'sum',
  },
];

const groups: DataTableColumnGroup[] = [
  { key: 'before', header: '更改前', columns: ['beforePart', 'beforePrice', 'beforeQuantity'] },
  { key: 'after', header: '更改后', columns: ['afterPart', 'afterPrice', 'afterQuantity'] },
];

export default _component(() => () => (
  <DataTable
    rows={changes}
    columns={columns}
    columnGroups={groups}
    getKey={(change) => String(change.no)}
    density="compact"
    aria-label="零件更改对比"
    propsCell={(change, column) =>
      column.key === 'saving' && saving(change).isNegative() ? { sx: styles.increase } : {}
    }
  />
));
