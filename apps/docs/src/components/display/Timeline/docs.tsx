import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TimelineProps';
import itemApi from 'virtual:api/TimelineItem';
import workflowApi from 'virtual:api/WorkflowTimelineOptions';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Approval from './demo/Approval.tsx?demo';
import Contract from './demo/Contract.tsx?demo';
import Order from './demo/Order.tsx?demo';
import Releases from './demo/Releases.tsx?demo';

export const meta = {
  title: 'Timeline 时间线',
  description:
    '按时间排列的事件（订单进度、操作记录、审批流转、版本历史）：节点带色调与图标，可左右交替、新的在前，进行中的一项显示加载指示。',
  order: 6,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports={
      "import { Timeline } from '@vue-tsx-pro/ui';\n" +
      "import { useWorkflowTimeline } from '@vue-tsx-pro/ui/workflow';"
    }
  >
    <Examples>
      <ExampleColumn>
        <Example id="approval" title="审批流转记录" demo={Approval}>
          流程的流转事件用 <Code>useWorkflowTimeline</Code>{' '}
          写成各项：谁、在哪个节点、做了什么，处理结果按种类着色，认领、指定、催办、超时自动处理各有图标。
          <Code>definition</Code> 给出节点与结果的名称，<Code>actorName</Code> 把工号换成姓名，
          <Code>renderAttachment</Code> 把附件做成链接，默认不显示“到达节点”（
          <Code>hide</Code>）。<Code>reverse</Code> 新的在前，items 仍按时间先后给。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="order" title="订单进度" demo={Order}>
          每项一个节点（圆点或 <Code>icon</Code>）与标题、时间、说明；<Code>dateTime</Code> 写进
          time 元素给机器读；<Code>pending</Code> 是还在进行中的最后一项。
        </Example>
        <Example id="releases" title="左右交替" demo={Releases}>
          <Code>alternate</Code> 让事件左右交替排布，<Code>tone</Code>{' '}
          给节点着色；容器窄时自动排回一侧。
        </Example>
        <Example id="contract" title="流转记录：交替、小一号" demo={Contract}>
          流转记录也是普通的 items，<Code>alternate</Code>、<Code>size</Code>、部件属性照常用；没给{' '}
          <Code>definition</Code> 时节点与结果显示标识。文案在语言包的{' '}
          <Code>messages.workflow</Code> 里可以改写。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, itemApi, workflowApi]} />
  </DocPage>
));
