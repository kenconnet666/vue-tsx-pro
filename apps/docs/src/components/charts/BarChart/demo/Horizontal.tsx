import { _component } from '@vue-tsx-pro/tsx';
import { BarChart } from '@vue-tsx-pro/ui/charts';

const departments = [
  { name: '结构设计部', count: 18 },
  { name: '工艺研究所', count: 14 },
  { name: '采购中心', count: 11 },
  { name: '总装车间', count: 9 },
  { name: '质量管理部', count: 6 },
];

export default _component(() => () => (
  <BarChart
    aria-label="各部门提出的降本项目数"
    data={departments}
    index="name"
    series={[{ key: 'count', label: '项目数' }]}
    unit="项"
    orientation="horizontal"
    height={220}
  />
));
