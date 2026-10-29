import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ChordChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Migration from './demo/Migration.tsx?demo';
import Teams from './demo/Teams.tsx?demo';
import Options from './demo/Options.tsx?demo';

export const meta = {
  title: 'ChordChart 弦图',
  description:
    '看几方之间相互往来的多少：节点排成一圈，两两之间的流量画成弦。自己用 SVG 画，跟随主题，没有第三方依赖。',
  order: 7,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ChordChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="teams" title="基础用法" demo={Teams}>
          数据同 SankeyChart：<Code>nodes</Code> 是节点，<Code>links</Code>{' '}
          是流向。弧的长短是节点的总量，弦取起点节点的颜色；悬停弧看总量，悬停弦看两个节点之间的量。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="migration" title="隐藏节点" demo={Migration}>
          点图例隐藏一个节点，连同它的弦；<Code>hiddenNodes</Code> 存隐藏的 id，可以用{' '}
          <Code>_bind</Code> 双向绑定。往返两个方向的流向各画一根弦。
        </Example>
        <Example id="options" title="图例与状态" demo={Options}>
          <Code>legend</Code>、<Code>tooltip</Code> 可以关掉。加载中（<Code>loading</Code>
          ）显示骨架，没有数据时显示 <Code>empty</Code>（默认“暂无数据”）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
