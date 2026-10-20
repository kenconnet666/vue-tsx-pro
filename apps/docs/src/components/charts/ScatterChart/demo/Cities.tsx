// 城市的人均 GDP 与平均通勤时间：每座城市一个点，横纵轴都是数值；悬停看城市名与两个值
import { _component } from '@vue-tsx-pro/tsx';
import { ScatterChart } from '@vue-tsx-pro/ui/charts';

const cities = [
  { name: '北京', gdp: 20.0, commute: 47 },
  { name: '上海', gdp: 19.0, commute: 45 },
  { name: '深圳', gdp: 18.3, commute: 37 },
  { name: '广州', gdp: 15.4, commute: 40 },
  { name: '杭州', gdp: 15.3, commute: 36 },
  { name: '南京', gdp: 17.4, commute: 35 },
  { name: '成都', gdp: 10.4, commute: 38 },
  { name: '武汉', gdp: 14.0, commute: 39 },
  { name: '西安', gdp: 9.2, commute: 37 },
  { name: '重庆', gdp: 9.4, commute: 40 },
  { name: '苏州', gdp: 18.6, commute: 30 },
  { name: '长沙', gdp: 13.2, commute: 33 },
];

export default _component(() => () => (
  <ScatterChart
    aria-label="人均 GDP 与通勤时间"
    data={cities}
    index="name"
    x="gdp"
    xLabel="人均 GDP（万元）"
    xFormat={{ maximumFractionDigits: 1 }}
    series={[{ key: 'commute', label: '平均通勤（分钟）' }]}
  />
));
