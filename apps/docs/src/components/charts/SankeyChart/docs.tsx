import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/SankeyChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Budget from './demo/Budget.tsx?demo';
import Funnel from './demo/Funnel.tsx?demo';
import Options from './demo/Options.tsx?demo';

export const meta = {
  title: 'SankeyChart 桑基图',
  description:
    '看量从哪来、到哪去、在哪流失：节点之间的流量画成粗细不同的带子。自己用 SVG 画，跟随主题，没有第三方依赖。',
  order: 6,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { SankeyChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="funnel" title="转化漏斗" demo={Funnel}>
          <Code>nodes</Code> 是节点（<Code>id</Code>、<Code>label</Code>、<Code>color</Code>），
          <Code>links</Code> 是流向（<Code>source</Code>、<Code>target</Code>、<Code>value</Code>
          ），不能成环。带子取起点节点的颜色，流失的节点给成灰色更醒目；节点旁写名字与总量，悬停带子看这一步的流量。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="budget" title="预算分配" demo={Budget}>
          数值可以是 Decimal、bigint，<Code>valueFormat</Code>{' '}
          同时作用于节点旁的总量、提示框与读屏的数据表；<Code>align</Code> 决定节点靠哪一侧排。
        </Example>
        <Example id="options" title="状态" demo={Options}>
          <Code>tooltip</Code> 可以关掉。加载中（<Code>loading</Code>）显示骨架，没有数据时显示{' '}
          <Code>empty</Code>（默认“暂无数据”）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
