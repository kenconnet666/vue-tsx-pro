import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/WaterfallChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Budget from './demo/Budget.tsx?demo';
import Versions from './demo/Versions.tsx?demo';

export const meta = {
  title: 'WaterfallChart 瀑布图',
  description:
    '从起点一步步加减到终点，看总数是怎么变过来的：测算版本差异、预算到实际。基于 Unovis 的堆叠柱，跟随主题；需要安装 @unovis/ts。',
  order: 8,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { WaterfallChart } from '@vue-tsx-pro/ui/charts';">
    <Examples>
      <ExampleColumn>
        <Example id="versions" title="测算版本差异" demo={Versions}>
          <Code>steps</Code> 的每一步是 <Code>label</Code> 与 <Code>value</Code>
          （这一步的变动，正数往上、负数往下，可以是 Decimal）；<Code>total</Code> 的是合计柱，从 0
          画到当时的累计，写了 <Code>value</Code>{' '}
          时作为新的起点。悬停看变动与累计，读屏的数据表也是这两列。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="budget" title="预算到实际：颜色、目标线、下钻" demo={Budget}>
          往上默认 success、往下 danger：成本超支这类“增加是坏事”的图用 <Code>increaseColor</Code>、
          <Code>decreaseColor</Code> 对调。<Code>targets</Code> 画目标线（同柱状图），
          <Code>valueDomain</Code> 让数值轴不从 0 起、差异更显眼；<Code>onItemClick</Code>{' '}
          点一步下钻（同样的去处页面上还要有链接）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
