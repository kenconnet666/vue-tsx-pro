import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ApprovalActionsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Approve from './demo/Approve.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'ApprovalActions 审批按钮',
  description:
    '人工节点的处理结果排成一组按钮；结果要求意见、附件或业务字段时先弹对话框填写，填好再提交。按钮的样子按结果的种类（通过、否决、退回、提级、终止）。',
  order: 3,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ApprovalActions, workItemOutcomes } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="approve" title="处理一条待办" demo={Approve}>
          <Code>outcomes</Code> 通常是 <Code>workItemOutcomes(definition, item)</Code>；
          <Code>comment</Code>、<Code>attachments</Code> 为 required 时对话框里必填。业务字段由{' '}
          <Code>fields</Code> 给出、<Code>validate</Code> 校验；<Code>onComplete</Code> 返回 Promise
          时按钮显示加载中，失败时对话框留着。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="states" title="不可用、尺寸与按结果定制" demo={States}>
          流程暂停、不是自己的待办时 <Code>disabled</Code>
          。第一个通过类的结果是主按钮，否决、终止红色描边，退回、提级普通描边；
          <Code>propsButton</Code> 可以按结果改某个按钮（加图标）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
