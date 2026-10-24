import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/RadarChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Options from './demo/Options.tsx?demo';
import Suppliers from './demo/Suppliers.tsx?demo';

export const meta = {
  title: 'RadarChart 雷达图',
  description:
    '几个维度上同时比较几个对象（供应商的各项评分、方案的各项指标）：每个对象连成一个多边形。',
  order: 10.6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { RadarChart } from '@vue-tsx-pro/ui/charts';">
    <Examples>
      <ExampleColumn>
        <Example id="suppliers" title="供应商评分" demo={Suppliers}>
          <Code>data</Code> 的每一行是一个维度，<Code>index</Code> 是维度名的字段，
          <Code>series</Code> 的每一项连成一个多边形。<Code>max</Code> 是轴的最大值（评分写
          100）。悬停一个维度时那根轴加粗、各系列的数值标在顶点旁；点图例隐藏系列。至少三个维度才画得出来；读屏的数据表列出每一维的各系列。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="options" title="圆形网格与自动的最大值" demo={Options}>
          <Code>grid="circle"</Code> 画圆形网格，<Code>levels</Code> 是圈数；不写 <Code>max</Code>{' '}
          时按数据取一个整齐的值（圈数 × 整齐的步长）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
