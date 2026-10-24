// 采购量与单价：两个供应商的采购量叠成一根柱子（件，左轴），加权单价是平滑的线（元，右轴）；
// 点图例隐藏一个供应商，柱子与左轴跟着变，右轴不动
import { _component } from '@vue-tsx-pro/tsx';
import { ComboChart } from '@vue-tsx-pro/ui/charts';

const quarters = [
  { quarter: '2025 Q1', huachen: 9_800, hengyuan: 0, price: 128.6 },
  { quarter: '2025 Q2', huachen: 10_400, hengyuan: 0, price: 127.1 },
  { quarter: '2025 Q3', huachen: 8_600, hengyuan: 2_400, price: 123.9 },
  { quarter: '2025 Q4', huachen: 6_200, hengyuan: 5_100, price: 120.4 },
  { quarter: '2026 Q1', huachen: 4_800, hengyuan: 7_300, price: 118.2 },
  { quarter: '2026 Q2', huachen: 3_900, hengyuan: 8_800, price: 116.8 },
];

export default _component(() => () => (
  <ComboChart
    aria-label="支架采购量与单价"
    data={quarters}
    index="quarter"
    series={[
      { key: 'huachen', label: '华辰精密' },
      { key: 'hengyuan', label: '恒远五金' },
      { key: 'price', label: '加权单价', type: 'line', axis: 'secondary', color: 'danger' },
    ]}
    stacked
    unit="件"
    secondaryUnit="元"
    secondaryFormat={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
    curve="monotone"
    dots="hollow"
  />
));
