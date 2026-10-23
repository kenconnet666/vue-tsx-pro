import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/WorkflowTimelineProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Ascending from './demo/Ascending.tsx?demo';
import Records from './demo/Records.tsx?demo';

export const meta = {
  title: 'WorkflowTimeline 流转记录',
  description:
    '把后端的流转记录写成时间线：谁、何时、在哪个节点、做了什么，意见与附件；处理结果按种类着色，认领、指定、催办、超时自动处理各有图标。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { WorkflowTimeline } from '@vue-tsx-pro/ui/workflow';">
    <Examples>
      <ExampleColumn>
        <Example id="records" title="审批记录" demo={Records}>
          给 <Code>definition</Code> 时节点与结果显示名称；<Code>actorName</Code> 把工号换成姓名，
          <Code>renderAttachment</Code> 把附件做成链接。默认新的在前、不显示“到达节点”（
          <Code>hide</Code>）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="ascending" title="正序、交替与尺寸" demo={Ascending}>
          <Code>newestFirst={'{false}'}</Code> 旧的在前；Timeline 的 <Code>alternate</Code>、
          <Code>size</Code> 照常可用。没给 <Code>definition</Code>{' '}
          时节点与结果原样显示。留言、暂停、恢复、流程调整各有图标；文案在语言包的{' '}
          <Code>messages.workflow</Code> 里可以改写。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
