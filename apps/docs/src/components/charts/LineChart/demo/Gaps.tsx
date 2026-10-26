import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { LineChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

// 6 月设备检修，没有数据：线在这里断开
const months = [
  { month: '1月', yield: 0.962 },
  { month: '2月', yield: 0.958 },
  { month: '3月', yield: 0.971 },
  { month: '4月', yield: 0.968 },
  { month: '5月', yield: 0.975 },
  { month: '6月', yield: null },
  { month: '7月', yield: 0.981 },
  { month: '8月', yield: 0.979 },
];

export default _component(() => () => (
  <LineChart
    aria-label="月度良品率"
    data={months}
    index="month"
    series={[{ key: 'yield', label: '良品率' }]}
    valueFormat={{ style: 'percent', maximumFractionDigits: 1 }}
    valueDomain={[0.9, 1]}
    dots="filled"
  />
));
