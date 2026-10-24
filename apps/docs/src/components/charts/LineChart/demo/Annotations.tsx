// 标注与区间：单价走势上标出“换供应商”这类事件（竖线）、圈出最低点与异常值（圈出某个系列的值），
// 验证窗是类目轴上的一段，目标单价区间是数值轴上的一段
import { _component } from '@vue-tsx-pro/tsx';
import { LineChart } from '@vue-tsx-pro/ui/charts';

const months = [
  { month: '1月', price: 128.6, market: 131 },
  { month: '2月', price: 127.9, market: 130.5 },
  { month: '3月', price: 126.2, market: 129.8 },
  { month: '4月', price: 121.4, market: 129.2 },
  { month: '5月', price: 119.35, market: 128.4 },
  { month: '6月', price: 118.9, market: 128.9 },
  { month: '7月', price: 124.6, market: 129.6 },
  { month: '8月', price: 117.5, market: 128.1 },
  { month: '9月', price: 116.8, market: 127.6 },
  { month: '10月', price: 116.8, market: 127.2 },
  { month: '11月', price: 115.2, market: 126.9 },
  { month: '12月', price: 114.9, market: 126.5 },
];

export default _component(() => () => (
  <LineChart
    aria-label="支架单价走势"
    data={months}
    index="month"
    series={[
      { key: 'price', label: '采购单价' },
      { key: 'market', label: '市场均价', color: 'neutral' },
    ]}
    unit="元"
    dots="hollow"
    height={280}
    valueDomain={[105, 135]}
    annotations={[
      { at: '4月', label: '换 6063-T5' },
      { at: '8月', label: '新供应商切换' },
      { at: '7月', series: 'price', label: '模具维修，临时外协', color: 'danger' },
      { at: '12月', series: 'price', label: '年内最低 114.9' },
    ]}
    bands={[
      { from: '5月', to: '6月', label: '验证窗', color: 'info' },
      { axis: 'value', from: 110, to: 116, label: '目标区间', color: 'success' },
    ]}
  />
));
