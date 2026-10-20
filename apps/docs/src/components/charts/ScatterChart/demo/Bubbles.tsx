// 商品的价格、评分与销量：size 给成销量字段，点的大小随销量变（气泡图）；两个系列是两个品类
import { _component } from '@vue-tsx-pro/tsx';
import { ScatterChart } from '@vue-tsx-pro/ui/charts';

const products = [
  { name: '入门耳机', price: 199, earphone: 4.2, sales: 3200 },
  { name: '降噪耳机', price: 899, earphone: 4.7, sales: 1800 },
  { name: '运动耳机', price: 399, earphone: 4.4, sales: 2400 },
  { name: '旗舰耳机', price: 1999, earphone: 4.8, sales: 600 },
  { name: '蓝牙音箱', price: 299, speaker: 4.1, sales: 2100 },
  { name: '桌面音箱', price: 699, speaker: 4.5, sales: 900 },
  { name: '回音壁', price: 1499, speaker: 4.3, sales: 500 },
  { name: '便携音箱', price: 149, speaker: 3.9, sales: 2800 },
];

export default _component(() => () => (
  <ScatterChart
    aria-label="价格、评分与销量"
    data={products}
    index="name"
    x="price"
    xLabel="价格（元）"
    series={[
      { key: 'earphone', label: '耳机评分' },
      { key: 'speaker', label: '音箱评分' },
    ]}
    size="sales"
    valueFormat={{ minimumFractionDigits: 1 }}
  />
));
