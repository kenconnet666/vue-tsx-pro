// 类型：图表从 data 推出行的类型，index、系列的 key、value、groups 这些字段名跟着它；
// 系列与数值只能取数字字段（number、可空的 number），写错字段或取了文字字段时类型检查报错
import { AreaChart } from '../AreaChart';
import { BarChart } from '../BarChart';
import { ComboChart } from '../ComboChart';
import { DonutChart } from '../DonutChart';
import { LineChart } from '../LineChart';
import { RadarChart } from '../RadarChart';
import { ScatterChart } from '../ScatterChart';
import { TreemapChart } from '../TreemapChart';

interface Month {
  month: string;
  planned: number;
  actual: number | null;
  rate?: number;
}
declare const months: Month[];
const series = [
  { key: 'planned', label: '预期' },
  { key: 'actual', label: '实际' },
] as const;

export const line = <LineChart aria-label="趋势" data={months} index="month" series={series} />;
export const lineTypo = (
  <LineChart
    data={months}
    index="month"
    // @ts-expect-error 行是 Month，没有 sales
    series={[{ key: 'sales', label: '销售' }]}
  />
);
export const lineText = (
  <LineChart
    data={months}
    index="month"
    // @ts-expect-error 系列取数值字段，month 是文字
    series={[{ key: 'month', label: '月份' }]}
  />
);
export const lineIndex = (
  <LineChart
    data={months}
    // @ts-expect-error 行是 Month，没有 date
    index="date"
    series={series}
  />
);

export const bar = <BarChart data={months} index="month" series={series} unit="万元" />;
export const area = <AreaChart data={months} index="month" series={series} stacked="percent" />;
export const combo = (
  <ComboChart
    data={months}
    index="month"
    series={[...series, { key: 'rate', label: '完成率', type: 'line', axis: 'secondary' }]}
  />
);
export const radar = <RadarChart data={months} index="month" series={series} max={100} />;

interface City {
  name: string;
  region: string;
  gdp: number;
  life: number;
}
declare const cities: City[];
export const scatter = (
  <ScatterChart data={cities} index="name" x="gdp" series={[{ key: 'life', label: '寿命' }]} />
);
export const scatterX = (
  <ScatterChart
    data={cities}
    index="name"
    // @ts-expect-error 横轴取数值字段，region 是文字
    x="region"
    series={[{ key: 'life', label: '寿命' }]}
  />
);
export const donut = <DonutChart data={cities} index="name" value="gdp" />;
export const donutValue = (
  <DonutChart
    data={cities}
    index="name"
    // @ts-expect-error 数值取数字字段
    value="region"
  />
);
export const treemap = <TreemapChart data={cities} groups={['region', 'name']} value="gdp" />;
export const treemapGroups = (
  <TreemapChart
    data={cities}
    // @ts-expect-error 行是 City，没有 country
    groups={['country']}
    value="gdp"
  />
);
