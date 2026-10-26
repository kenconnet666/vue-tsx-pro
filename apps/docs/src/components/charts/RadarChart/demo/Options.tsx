// 圆形网格、5 圈，最大值按数据自动取整（不写 max）；只有一个系列时没有图例
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { RadarChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const plan = [
  { item: '材料', saving: 320 },
  { item: '工艺', saving: 180 },
  { item: '设计', saving: 240 },
  { item: '物流', saving: 90 },
  { item: '国产化', saving: 410 },
];

export default _component(() => () => (
  <RadarChart
    aria-label="各类促销活动的销售额"
    data={plan}
    index="item"
    series={[{ key: 'saving', label: '销售额', color: 'chart3' }]}
    grid="circle"
    levels={5}
    unit="万元"
    height={260}
  />
));
