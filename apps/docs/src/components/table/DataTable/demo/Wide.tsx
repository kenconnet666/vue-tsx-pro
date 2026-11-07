// 宽表：60 家门店 × 120 天的日销量，按月分组；门店固定在起始边、合计固定在结束边。
// virtualColumns 只渲染看得见的列（行本来就是虚拟滚动的），横着拖也不卡
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  DataTable,
  Flex,
  Small,
  type DataTableColumn,
  type DataTableColumnGroup,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface StoreSales {
  store: string;
  days: number[];
}

const DAYS = 120;
const start = new Date(2026, 6, 1);
const dates = Array.from({ length: DAYS }, (_, index) => {
  const date = new Date(start);
  date.setDate(start.getDate() + index);
  return date;
});
const cities = ['杭州', '宁波', '苏州', '南京', '合肥', '上海'];
const stores: StoreSales[] = Array.from({ length: 60 }, (_, store) => ({
  store: `${cities[store % cities.length]} ${String(store + 1).padStart(2, '0')} 店`,
  days: dates.map((_, day) => 40 + ((store * 37 + day * 13) % 90)),
}));

const columns: DataTableColumn<StoreSales>[] = [
  { key: 'store', header: '门店', width: 120, sticky: 'start' },
  ...dates.map((date, day): DataTableColumn<StoreSales> => ({
    key: `d${day}`,
    header: `${date.getDate()} 日`,
    width: 64,
    align: 'end',
    value: (row) => row.days[day],
  })),
  {
    key: 'total',
    header: '合计',
    width: 96,
    sticky: 'end',
    align: 'end',
    value: (row) => row.days.reduce((sum, value) => sum + value, 0),
  },
];

/** 按月份分组：同一个月的日期列放在一组下面 */
const columnGroups: DataTableColumnGroup[] = [];
dates.forEach((date, day) => {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
  let group = columnGroups.at(-1);
  if (group?.key !== key) {
    group = { key, header: `${date.getMonth() + 1} 月`, columns: [] };
    columnGroups.push(group);
  }
  (group.columns as string[]).push(`d${day}`);
});

const styles = css.create({ table: { height: '22rem' } });

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    <DataTable
      rows={stores}
      columns={columns}
      columnGroups={columnGroups}
      getKey={(row) => row.store}
      density="compact"
      virtualColumns
      aria-label="门店日销量"
      propsRoot={{ sx: styles.table }}
    />
    <Small tone="muted">
      {stores.length} 行 × {columns.length} 列，只渲染看得见的几十格
    </Small>
  </Flex>
));
