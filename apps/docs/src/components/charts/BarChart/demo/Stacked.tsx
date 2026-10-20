import { _component } from '@vue-tsx-pro/tsx';
import { BarChart } from '@vue-tsx-pro/ui/charts';

const quarters = [
  { quarter: '一季度', material: 120, labor: 80, overhead: 40 },
  { quarter: '二季度', material: 150, labor: 85, overhead: 45 },
  { quarter: '三季度', material: 110, labor: 90, overhead: 38 },
  { quarter: '四季度', material: 170, labor: 95, overhead: 52 },
];

export default _component(() => () => (
  <BarChart
    aria-label="各季度成本构成"
    data={quarters}
    index="quarter"
    series={[
      { key: 'material', label: '材料' },
      { key: 'labor', label: '人工' },
      { key: 'overhead', label: '制造费用' },
    ]}
    unit="万元"
    stacked
  />
));
