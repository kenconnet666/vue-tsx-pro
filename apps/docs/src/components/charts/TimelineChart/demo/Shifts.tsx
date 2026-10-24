// 设备的排班（按小时）：时间是 ISO 日期时间，刻度写成“时:分”；每个系列一种用途（生产、换模、保养），
// 同一台设备一天里排几段
import { _component } from '@vue-tsx-pro/tsx';
import { TimelineChart, type TimelineChartItem } from '@vue-tsx-pro/ui/charts';

const at = (time: string) => `2026-10-24T${time}`;
const items: TimelineChartItem[] = [
  { row: '1 号压铸机', series: 'run', start: at('08:00'), end: at('11:30') },
  { row: '1 号压铸机', series: 'setup', start: at('11:30'), end: at('12:15') },
  { row: '1 号压铸机', series: 'run', start: at('12:15'), end: at('17:00') },
  { row: '2 号压铸机', series: 'maintain', start: at('08:00'), end: at('10:00') },
  { row: '2 号压铸机', series: 'run', start: at('10:00'), end: at('18:30') },
  { row: '数控 5 轴', series: 'run', start: at('09:00'), end: at('13:00') },
  { row: '数控 5 轴', series: 'setup', start: at('13:00'), end: at('13:40') },
  { row: '数控 5 轴', series: 'run', start: at('13:40'), end: at('20:00') },
];

export default _component(() => () => (
  <TimelineChart
    aria-label="设备排班"
    items={items}
    series={[
      { key: 'run', label: '生产' },
      { key: 'setup', label: '换模', color: 'warning' },
      { key: 'maintain', label: '保养', color: 'info' },
    ]}
    rowHeight={28}
    dateFormat={{ hour: '2-digit', minute: '2-digit' }}
  />
));
