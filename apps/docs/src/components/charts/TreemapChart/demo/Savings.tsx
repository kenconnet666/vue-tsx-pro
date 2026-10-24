// 降本金额按“区域 → 供应商”分块：面积是金额，同一个区域同一种颜色；悬停看路径、金额与占比，点图例隐藏一个区域
import { _component } from '@vue-tsx-pro/tsx';
import { TreemapChart } from '@vue-tsx-pro/ui/charts';

const savings = [
  { region: '华东', supplier: '华辰精密', amount: 623.2 },
  { region: '华东', supplier: '恒远五金', amount: 239.7 },
  { region: '华东', supplier: '江南铸造', amount: 118.4 },
  { region: '华南', supplier: '粤海机电', amount: 285.2 },
  { region: '华南', supplier: '南方复材', amount: 48.3 },
  { region: '华北', supplier: '京津航材', amount: 170.2 },
  { region: '华北', supplier: '燕山精工', amount: 92.6 },
  { region: '西南', supplier: '蓉城紧固件', amount: 66.1 },
];

export default _component(() => () => (
  <TreemapChart
    aria-label="降本金额构成"
    data={savings}
    groups={['region', 'supplier']}
    value="amount"
    unit="万元"
    valueFormat={{ maximumFractionDigits: 1 }}
    groupLabels
  />
));
