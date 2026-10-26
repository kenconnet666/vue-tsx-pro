// 网站一周的访问：新访客与回访访客两片面积重叠、半透明，看得出谁多谁少
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { AreaChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const days = [
  { day: '周一', fresh: 3200, returning: 2100 },
  { day: '周二', fresh: 3600, returning: 2400 },
  { day: '周三', fresh: 3100, returning: 2800 },
  { day: '周四', fresh: 4200, returning: 3000 },
  { day: '周五', fresh: 4800, returning: 3300 },
  { day: '周六', fresh: 5600, returning: 2900 },
  { day: '周日', fresh: 5200, returning: 2600 },
];

export default _component(() => () => (
  <AreaChart
    aria-label="一周的访问量"
    data={days}
    index="day"
    series={[
      { key: 'fresh', label: '新访客' },
      { key: 'returning', label: '回访访客' },
    ]}
    unit="人次"
  />
));
