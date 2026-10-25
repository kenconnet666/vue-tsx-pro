// 项目的进度：计划是浅色的轨道，实际画在上面；拖期的一段标红（color），还在进行的实际到“今天”为止。
// 里程碑（年度评审、预算截止）是竖线；点图例隐藏“计划”只看实际
import { _component } from '@vue-tsx-pro/tsx';
import { TimelineChart, type TimelineChartItem } from '@vue-tsx-pro/ui/charts';

const TODAY = '2026-10-24';

const items: TimelineChartItem[] = [
  { row: '官网首页改版', series: 'plan', start: '2026-03-01', end: '2026-06-30' },
  { row: '官网首页改版', series: 'actual', start: '2026-03-10', end: '2026-06-30' },
  {
    row: '官网首页改版',
    series: 'actual',
    start: '2026-07-01',
    end: '2026-07-24',
    color: 'danger',
    label: '官网首页改版（拖期）',
  },
  { row: '线缆收纳夹国产化', series: 'plan', start: '2026-05-01', end: '2026-09-30' },
  { row: '线缆收纳夹国产化', series: 'actual', start: '2026-05-06', end: '2026-09-12' },
  { row: '门店照明改造', series: 'plan', start: '2026-06-15', end: '2026-12-31' },
  { row: '门店照明改造', series: 'actual', start: '2026-07-01', end: TODAY },
  { row: '包装材料复用', series: 'plan', start: '2026-09-01', end: '2027-01-31' },
  { row: '包装材料复用', series: 'actual', start: '2026-09-20', end: TODAY },
  { row: '供应商年度议价', series: 'plan', start: '2026-11-01', end: '2026-12-15' },
];

export default _component(() => () => (
  <TimelineChart
    aria-label="项目进度"
    items={items}
    series={[
      { key: 'plan', label: '计划', variant: 'track', color: 'chart1' },
      { key: 'actual', label: '实际', color: 'chart1' },
    ]}
    today={TODAY}
    markers={[
      { at: '2026-07-15', label: '年中评审' },
      { at: '2026-12-20', label: '预算截止', color: 'warning' },
    ]}
  />
));
