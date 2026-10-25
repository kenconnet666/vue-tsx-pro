import { _component } from '@vue-tsx-pro/tsx';
import { LineChart } from '@vue-tsx-pro/ui/charts';

const months = [
  { month: '1月', planned: 120, actual: 40 },
  { month: '2月', planned: 120, actual: 70 },
  { month: '3月', planned: 170, actual: 150 },
  { month: '4月', planned: 190, actual: 205 },
  { month: '5月', planned: 200, actual: 180 },
  { month: '6月', planned: 160, actual: 150 },
  { month: '7月', planned: 200, actual: 185 },
  { month: '8月', planned: 195, actual: 150 },
  { month: '9月', planned: 230, actual: 190 },
  { month: '10月', planned: 250, actual: 205 },
  { month: '11月', planned: 300, actual: 270 },
  { month: '12月', planned: 330, actual: 360 },
];

export default _component(() => () => (
  <LineChart
    aria-label="月度销售趋势"
    data={months}
    index="month"
    series={[
      { key: 'planned', label: '预期销售' },
      { key: 'actual', label: '实际销售' },
    ]}
    unit="万元"
    dots="hollow"
  />
));
