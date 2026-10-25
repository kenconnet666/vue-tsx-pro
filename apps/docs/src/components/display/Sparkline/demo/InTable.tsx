// 表格里的一列走势：每行一条迷你图，高度跟行高；有缺的月份时折线在这里断开。
// tone 按走势选：单价降了是好事（success），涨了标危险色
import { _component } from '@vue-tsx-pro/tsx';
import { ColumnTable, Sparkline, type DataTableColumn } from '@vue-tsx-pro/ui';

interface Part {
  code: string;
  name: string;
  prices: (number | null)[];
}

const parts: Part[] = [
  {
    code: 'SKU-21108',
    name: '显示器支架',
    prices: [128.6, 127.9, 126.2, 121.4, 119.4, 118.9, 116.8],
  },
  { code: 'SKU-53214', name: '线束卡箍', prices: [3.2, 3.2, 3.3, null, 3.6, 3.7, 3.9] },
  { code: 'SKU-11802', name: '办公椅', prices: [2150, 2120, 2080, 2075, 2060, 1990, 1985] },
  { code: 'SKU-70431', name: '包装胶带', prices: [86, 88, 85, 91, 89, 93, 95] },
];

const columns: DataTableColumn<Part>[] = [
  { key: 'code', header: '件号', width: 130 },
  { key: 'name', header: '名称' },
  {
    key: 'latest',
    header: '最新单价（元）',
    type: 'number',
    format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    value: (part) => part.prices.at(-1) ?? null,
  },
  {
    key: 'trend',
    header: '近 7 个月',
    width: 160,
    cell: (part) => {
      const first = part.prices.find((price) => price != null)!;
      const last = part.prices.at(-1)!;
      return (
        <Sparkline
          data={part.prices}
          tone={last <= first ? 'success' : 'danger'}
          height="1.5em"
          label={`${part.name}近 7 个月单价`}
        />
      );
    },
  },
];

export default _component(() => () => (
  <ColumnTable
    rows={parts}
    columns={columns}
    getKey={(part) => part.code}
    aria-label="零件单价走势"
  />
));
