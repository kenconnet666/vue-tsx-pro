import { _component } from '@vue-tsx-pro/tsx';
import { BarChart } from '@vue-tsx-pro/ui/charts';

const projects = [
  { name: '项目 01', planned: 272, actual: 438.4 },
  { name: '项目 02', planned: 280, actual: 438.4 },
  { name: '项目 03', planned: 246, actual: 257.4 },
  { name: '项目 04', planned: 252, actual: 214.56 },
  { name: '项目 05', planned: 157.5, actual: 210 },
  { name: '项目 06', planned: 160, actual: 211 },
];

export default _component(() => () => (
  <BarChart
    aria-label="各项目销售额"
    data={projects}
    index="name"
    series={[
      { key: 'planned', label: '预期销售' },
      { key: 'actual', label: '实际销售' },
    ]}
    unit="万元"
    valueFormat={{ maximumFractionDigits: 2 }}
  />
));
