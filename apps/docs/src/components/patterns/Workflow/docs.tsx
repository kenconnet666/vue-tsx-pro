import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Approval from './demo/Approval.tsx?demo';
import Designer from './demo/Designer.tsx?demo';

export const meta = {
  title: 'Workflow 流程设计与审批',
  description:
    '流程设计器与审批面板不是组件，是组合：画布、表单、问题列表、代码编辑器、操作栏、时间线与留言拼起来，流程的增删改交给流程引擎的模型包。照着拼自己的。',
  order: 0.5,
};

export default _component(() => () => (
  <DocPage meta={meta} wide>
    <Examples>
      <ExampleColumn wide>
        <Example id="designer" title="流程设计器" demo={Designer}>
          {'先选模板；画布（'}
          <Link href="/components/diagram">Diagram</Link>
          {'）可以点选、拖动摆位置，位置存进定义的 '}
          <Code>layout</Code>
          {
            '，引擎不读。右边的环节设置（源码目录里的 node-panel.tsx）按环节类型给出能改的：谁来处理、几个人一起审（全部、任一、按比例、依次）、时限与超时、到期前提醒、允许转办与催办、按钮、这一步每个字段能不能看能不能改；分支的条件用 '
          }
          <Link href="/components/condition-builder">ConditionBuilder</Link>
          {' 编辑（就是引擎认的条件 JSON）；调用流程选流程、抄送选人。增删环节经模型包的 '}
          <Code>addApprovalStep</Code>、<Code>addAmountBranch</Code>、<Code>addCallStep</Code>、
          <Code>addCcStep</Code>、<Code>removeStep</Code>
          {' 写回定义；'}
          <Code>validateProcess</Code>
          {' 的问题用 '}
          <Code>problemMessage</Code>
          {
            ' 写成业务的话列在 Alert 里，点一条把画布平移过去并选中那个环节。“代码”页用 CodeEditor 直接改 JSON。定义换成画布节点的 '
          }
          <Code>processDiagram</Code>
          {
            '（开始、结束画圆，网关画菱形，退回的线从下面绕回）放在这一页的源码目录里，设计器与审批面板共用。'
          }
        </Example>
        <Example id="approval" title="审批面板" demo={Approval}>
          {
            'Descriptions 是单据摘要，只看的 Diagram 标出走过的（success）与正在处理的（accent 加光晕）；“我的处理”是意见加 '
          }
          <Link href="/components/action-bar">ActionBar</Link>
          {' 上的按钮，按钮的名字、要不要写意见取自环节的 '}
          <Code>outcomes</Code>
          {
            '；转办选一个人、抄送多选几个人，都是 useFormDialog（select 的 multiple）。下面的标签页是流转记录（Timeline）与留言（CommentThread）。真实的应用里这些数据来自引擎的查询，处理调用 '
          }
          <Code>engine.run</Code>
          {
            '：apps/flow-demo 里还有工作台（待办、已办、抄送我的、我发起的）、退回到处理人选的环节、按环节的表单权限改字段、管理员的暂停跳转改派与异常作业。'
          }
        </Example>
      </ExampleColumn>
    </Examples>
  </DocPage>
));
