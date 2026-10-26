import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ComboChartProps';
import seriesApi from 'virtual:api/ComboSeries';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Savings from './demo/Savings.tsx?demo';
import Volume from './demo/Volume.tsx?demo';

export const meta = {
  title: 'ComboChart 组合图',
  description:
    '同一组类目上既有柱又有线（金额与比率、数量与单价）；单位不同的系列画在右侧的第二数值轴上，两条轴的刻度对齐。',
  order: 2.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ComboChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="savings" title="金额与完成率" demo={Savings}>
          系列的 <Code>type</Code> 是 <Code>bar</Code>（默认）或 <Code>line</Code>，
          <Code>axis</Code> 是 <Code>primary</Code>（左侧，默认）或 <Code>secondary</Code>
          （右侧的第二数值轴）。第二数值轴的刻度与主轴取同样多的格、每格都是整齐的步长，两边落在同一组网格线上；
          <Code>secondaryFormat</Code>、<Code>secondaryUnit</Code>{' '}
          是它的格式与单位（单位写在右上方），提示框与数据表里按各自的格式显示。目标线、标注、区间、下钻同柱状图。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="volume" title="堆叠的柱与平滑的线" demo={Volume}>
          <Code>stacked</Code> 把柱叠起（线不参与堆叠），<Code>curve</Code>、<Code>dots</Code>{' '}
          同折线图。十字线只在线上画圆点。点图例隐藏系列时，各自的数值轴按剩下的系列重新取范围。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, seriesApi]} />
  </DocPage>
));
