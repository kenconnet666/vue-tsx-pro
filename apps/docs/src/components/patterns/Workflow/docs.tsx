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
            '，引擎不读。右边的环节设置是 Field、TextField、Select、Checkbox、NumberField，改动经模型包的 '
          }
          <Code>addApprovalStep</Code>、<Code>addAmountBranch</Code>、<Code>removeStep</Code>
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
            '。下面的标签页是流转记录（Timeline）与留言（CommentThread）。真实的应用里这些数据来自引擎的查询，处理调用 '
          }
          <Code>engine.run</Code>
          {'，见 apps/flow-demo。'}
        </Example>
      </ExampleColumn>
    </Examples>
  </DocPage>
));
