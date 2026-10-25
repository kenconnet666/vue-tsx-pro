// 单选：从几家报价里选一家。每行是同一组的单选框，方向键在行之间移动并选中；选中的行整行高亮
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DataTable, Flex, Small, type DataTableColumn } from '@vue-tsx-pro/ui';

interface Quote {
  id: string;
  supplier: string;
  price: number;
  days: number;
  rating: string;
}

const quotes: Quote[] = [
  { id: 'q1', supplier: '青岩精密', price: 182_400, days: 45, rating: 'A' },
  { id: 'q2', supplier: '北辰研发', price: 169_900, days: 60, rating: 'B' },
  { id: 'q3', supplier: '远航生产', price: 175_000, days: 38, rating: 'A' },
  { id: 'q4', supplier: '星河紧固件', price: 158_600, days: 75, rating: 'C' },
];

const columns: DataTableColumn<Quote>[] = [
  { key: 'supplier', header: '供应商' },
  {
    key: 'price',
    header: '报价（元）',
    width: 128,
    format: { maximumFractionDigits: 0 },
  },
  { key: 'days', header: '交付（天）', width: 104 },
  { key: 'rating', header: '评级', width: 72, align: 'center' },
];

export default _component(() => {
  let picked = _state<string[]>(['q3']);
  return () => (
    <Flex direction="column" gap="sm">
      <DataTable
        rows={quotes}
        columns={columns}
        getKey={(quote) => quote.id}
        selectionMode="single"
        _selected={picked}
        density="compact"
        aria-label="供应商报价"
      />
      <Small tone="muted">
        选中：<Code>{quotes.find((quote) => quote.id === picked[0])?.supplier ?? '无'}</Code>
      </Small>
    </Flex>
  );
});
