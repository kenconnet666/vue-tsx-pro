// 访问来源：每个来源一个扇区，中间是合计；悬停看数值与占比，点图例隐藏一项后合计与占比重新算
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { DonutChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const sources = [
  { name: '搜索引擎', visits: 4820 },
  { name: '直接访问', visits: 3150 },
  { name: '社交媒体', visits: 2380 },
  { name: '邮件推广', visits: 960 },
  { name: '外部链接', visits: 640 },
];

export default _component(() => () => (
  <DonutChart
    aria-label="访问来源"
    data={sources}
    index="name"
    value="visits"
    unit="次"
    centerSubLabel="本周访问"
  />
));
