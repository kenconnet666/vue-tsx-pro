import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/GraphChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Matching from './demo/Matching.tsx?demo';
import Network from './demo/Network.tsx?demo';

export const meta = {
  title: 'GraphChart 网络图',
  description:
    '节点与连线，看谁和谁有关系、关系有多强：匹配推送、协作关系、上下游。基于 Unovis 的 Graph（自动布局、缩放平移、分组框），跟随主题；需要安装 @unovis/ts。',
  order: 10,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { GraphChart } from '@vue-tsx-pro/ui/charts';">
    <Examples>
      <ExampleColumn>
        <Example id="matching" title="分层与分组" demo={Matching}>
          <Code>layout="dagre"</Code> 沿 <Code>direction</Code>{' '}
          一层层排开、连线带箭头，适合有上下游的关系；
          <Code>groups</Code> 把同组的节点框在一起、取同一个颜色（分层、分列布局）。连线的{' '}
          <Code>label</Code> 写在线上，<Code>dashed</Code> 是弱关系。布局异步算好再画；elk
          布局较大（elkjs），用到时才加载。画审批流程用 FlowDiagram（泳道、节点状态）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="network" title="力导向与选中" demo={Network}>
          默认 <Code>layout="force"</Code>：相连的靠近、不相连的推开。连线写了 <Code>value</Code>{' '}
          时按大小加粗，悬停看数值；点节点选中（<Code>_selected</Code>{' '}
          双向绑定），不相连的变淡，点空白处取消。能缩放、拖动画布，双击空白回到全图（
          <Code>{'zoom={false}'}</Code> 关掉）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
