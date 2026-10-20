import { _component } from '@vue-tsx-pro/tsx';
import { LineChart } from '@vue-tsx-pro/ui/charts';

const weeks = Array.from({ length: 10 }, (_, index) => ({
  week: `第 ${index + 1} 周`,
  web: 40 + index * 6 + (index % 3) * 4,
  ios: 30 + index * 4 + (index % 2) * 6,
  android: 35 + index * 5 - (index % 4) * 3,
  mini: 10 + index * 7,
  desktop: 20 + index * 2,
}));

export default _component(() => () => (
  <LineChart
    aria-label="各端周活跃用户"
    data={weeks}
    index="week"
    series={[
      { key: 'web', label: '网页' },
      { key: 'ios', label: 'iOS' },
      { key: 'android', label: 'Android' },
      { key: 'mini', label: '小程序' },
      { key: 'desktop', label: '桌面端' },
    ]}
    unit="千人"
    curve="monotone"
  />
));
