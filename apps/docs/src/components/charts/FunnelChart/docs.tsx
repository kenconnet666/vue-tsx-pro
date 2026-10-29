import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/FunnelChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Channel from './demo/Channel.tsx?demo';
import Options from './demo/Options.tsx?demo';

export const meta = {
  title: 'FunnelChart 漏斗图',
  description:
    '一串前后相接的环节，看每一步留下多少、在哪一步流失最多。用主题 tokens 直接画；外层结构与其他图表一致。',
  order: 9,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { FunnelChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="channel" title="渠道转化" demo={Channel}>
          <Code>stages</Code> 从上到下，每个环节是 <Code>label</Code> 与 <Code>value</Code>
          ；横条长短按数值（最大的占满），环节之间写比上一环节的转化率，末尾写总转化。
          <Code>onItemClick</Code> 点环节下钻。环节之间不是一条流向时（有分支、有回流）用
          SankeyChart。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="options" title="颜色、金额与状态" demo={Options}>
          横条默认同一个颜色（<Code>color</Code>，默认 chart1），环节也可以单独给；值可以是
          Decimal，
          <Code>valueFormat</Code> 缩放到万元。<Code>rates</Code>{' '}
          关掉转化率；加载中显示骨架，没有数据时显示 <Code>empty</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
