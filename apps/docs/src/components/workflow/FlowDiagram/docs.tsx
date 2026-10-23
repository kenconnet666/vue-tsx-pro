import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/FlowDiagramProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Compact from './demo/Compact.tsx?demo';
import Designer from './demo/Designer.tsx?demo';
import Progress from './demo/Progress.tsx?demo';

export const meta = {
  title: 'FlowDiagram 流程图',
  description:
    '按流程定义（ProcessDefinition，BPMN 的子集）画泳道流程图：节点状态、走过的连线、退回与提级、线下动作；可点选节点、标出校验问题。流程的执行在后端引擎，前端描述流程与显示进度。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { FlowDiagram, processProgress, validateProcess } from '@vue-tsx-pro/ui/workflow';"
  >
    <Examples>
      <ExampleColumn wide>
        <Example id="progress" title="审批进度" demo={Progress}>
          流程定义是可序列化的
          JSON：泳道（岗位）、人工节点与处理结果、排他与并行网关、带条件的连线。
          <Code>processProgress</Code>{' '}
          从后端的流转记录推出进度：走过的节点、正在处理的节点、走过的连线；退回的连线画红色虚线。
        </Example>
        <Example id="designer" title="点选与校验" demo={Designer}>
          <Code>selectable</Code> 让节点成为按钮，<Code>selected</Code> 双向绑定选中的节点；
          <Code>validateProcess</Code> 查出的问题传给 <Code>problems</Code>，有问题的节点标红。
        </Example>
        <Example id="compact" title="紧凑尺寸、缩放与节点说明" demo={Compact}>
          <Code>size="sm"</Code> 与 <Code>fit</Code>（放不下时按比例缩小到容器宽）放进卡片、侧栏；
          <Code>nodeDetail</Code> 在名称下写处理人、时限。会签节点（
          <Code>multi</Code>）、线下动作（<Code>offline</Code>，虚线框）、提级（黄色虚线）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
