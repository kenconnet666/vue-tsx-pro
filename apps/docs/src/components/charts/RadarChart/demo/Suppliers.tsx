// 供应商的六项评分：每个供应商连成一个多边形，悬停一个维度看各家在这一项的分数；点图例隐藏一家
import { _component } from '@vue-tsx-pro/tsx';
import { RadarChart } from '@vue-tsx-pro/ui/charts';

const scores = [
  { dimension: '质量', huachen: 92, hengyuan: 78, yuehai: 85 },
  { dimension: '交期', huachen: 74, hengyuan: 88, yuehai: 80 },
  { dimension: '价格', huachen: 68, hengyuan: 90, yuehai: 76 },
  { dimension: '服务', huachen: 85, hengyuan: 72, yuehai: 90 },
  { dimension: '技术', huachen: 95, hengyuan: 65, yuehai: 70 },
  { dimension: '合规', huachen: 88, hengyuan: 82, yuehai: 94 },
];

export default _component(() => () => (
  <RadarChart
    aria-label="供应商评分"
    data={scores}
    index="dimension"
    series={[
      { key: 'huachen', label: '华辰精密' },
      { key: 'hengyuan', label: '恒远五金' },
      { key: 'yuehai', label: '粤海机电' },
    ]}
    max={100}
    unit="分"
  />
));
