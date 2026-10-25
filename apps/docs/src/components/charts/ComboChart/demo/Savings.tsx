// 月度销售：计划与实际是柱（万元，左轴），完成率是线（百分比，右侧的第二数值轴），两条轴的刻度落在同一组网格线上；
// 年度目标线在主轴上，“新供应商切换”是一条标注
import { _component } from '@vue-tsx-pro/tsx';
import { ComboChart } from '@vue-tsx-pro/ui/charts';

const months = [
  { month: '1月', planned: 120, actual: 86, rate: 0.72 },
  { month: '2月', planned: 120, actual: 98, rate: 0.82 },
  { month: '3月', planned: 150, actual: 141, rate: 0.94 },
  { month: '4月', planned: 160, actual: 172, rate: 1.08 },
  { month: '5月', planned: 180, actual: 165, rate: 0.92 },
  { month: '6月', planned: 180, actual: 193, rate: 1.07 },
  { month: '7月', planned: 200, actual: 176, rate: 0.88 },
  { month: '8月', planned: 210, actual: 236, rate: 1.12 },
  { month: '9月', planned: 220, actual: 241, rate: 1.1 },
];

export default _component(() => () => (
  <ComboChart
    aria-label="月度销售与完成率"
    data={months}
    index="month"
    series={[
      { key: 'planned', label: '计划销售', color: 'chart3' },
      { key: 'actual', label: '实际销售' },
      { key: 'rate', label: '完成率', type: 'line', axis: 'secondary', color: 'warning' },
    ]}
    unit="万元"
    secondaryFormat={{ style: 'percent' }}
    height={300}
    targets={[{ value: 200, label: '月均目标', color: 'success' }]}
    annotations={[{ at: '8月', label: '新供应商切换' }]}
  />
));
