import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import api from 'virtual:api/FlowDesignerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Purchase from './demo/Purchase.tsx?demo';

export const meta = {
  title: 'FlowDesigner 流程设计器',
  description:
    '在流程图上选节点，属性面板里改处理人、时限、超时与提醒，随改随校验，问题标在图上；有改动、没有错误时发布新版本。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { FlowDesigner } from '@vue-tsx-pro/ui/workflow';">
    <Example id="purchase" title="采购审批" demo={Purchase}>
      <Code>definition</Code>{' '}
      双向绑定流程定义的草稿，每次修改写回一份新的（可以存草稿、做撤销）。流程图上点节点，右边改它的名称、泳道、处理人（泳道的岗位收件箱、指定岗位收件箱
      <Code>groups</Code>、指定的人 <Code>users</Code>
      、发起人、同另一节点的处理人）、时限（工作日或自然日，留空没有时限）、超时（只标出，或自动按某个处理结果完成）与超时提醒；结束节点改结果与是否终止流程。取流程变量的处理人、时限只显示变量名。每次修改都跑{' '}
      <Code>validateProcess</Code>
      ：问题标在图上、列在下面，点一下选中对应的节点；和当前版本比有改动时标出“有未发布的修改”，没有改动或有错误时不能发布。
      <Code>onPublish</Code> 收到版本加一的定义，返回 Promise
      时按钮转圈，成功后草稿的版本跟着加一。只改节点的属性，加删节点与连线走 JSON
      或后端的建模工具；只看流程用 <Link href="/components/flow-diagram">FlowDiagram</Link>。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
