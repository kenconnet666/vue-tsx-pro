/**
 * 全栈：流程引擎（@zerodep-dev/flow-ts-*）。定义、引擎、扩展点、试运行、流程图与设计器
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock, H2, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { ProcessDiagram } from '@zerodep-dev/flow-ts-ui';
import { templates } from '@zerodep-dev/flow-ts-model';
import { DocPage } from '../../site/DocPage';

const meta = {
  title: 'Flow 流程引擎',
  description:
    '审批流程引擎：图是数据，设计器与代码读写同一份定义；一个命令入口，扩展点是选项里的函数；持久层是 easy-query，界面是组件库。',
};

const engine = `import { createFlowEngine } from '@zerodep-dev/flow-ts-engine';

const engine = createFlowEngine({
  adapter: mysql(pool),                       // easy-query 的适配器，引擎在这个库里建自己的表
  org: { members: (source) => findMembers(source) },
  extensions: {
    resolvers: { deptLeader: ({ instance }) => leaderOf(instance.startedBy) },
    guards: { budget: ({ read }) => (Number(read('amount')) > 100000 ? '超出预算' : true) },
    actions: { syncErp: async ({ variables }) => ({ outcome: (await erp.push(variables)) ? 'synced' : 'skipped' }) },
  },
  on: { 'instance.finished': (event) => notify(event) },   // 提交后执行
});

await engine.publish(leave);
const { workItems } = await engine.run({ type: 'start', process: 'leave', variables: { days: 5 } }, alice);
await engine.run({ type: 'complete', workItem: workItems[0].id, outcome: 'approve' }, bob);
await engine.query.todo(carol);
await engine.jobs.runDue();                   // 定时、时限、提醒、异步动作：定时调用`;

const define = `import { defineProcess, type OutcomeOf } from '@zerodep-dev/flow-ts-model';

export const leave = defineProcess({
  key: 'leave',
  name: '请假',
  variables: [{ name: 'days', type: 'number' }],
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    { id: 'manager', type: 'task', name: '经理审批', assignees: [{ role: '1' }],
      outcomes: [{ key: 'approve', label: '同意' }, { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' }] },
    …
  ],
  edges: [ … ],
});
type Outcome = OutcomeOf<typeof leave, 'manager'>;   // 'approve' | 'reject'`;

const simulate = `import { simulate } from '@zerodep-dev/flow-ts-engine/testing';

const run = await simulate(leave, {
  variables: { days: 5 },
  steps: [{ node: 'manager', outcome: 'approve' }, { wait: { hours: 4 } }],
});
run.status; run.open; run.path; run.error;`;

export default _component(() => () => (
  <DocPage meta={meta} wide>
    <H2 id="definition" size="xl" anchor>
      定义
    </H2>
    <Paragraph>
      模型是图（节点 + 连线）：开始、结束、人工节点、排他 / 并行 /
      包容网关、自动节点、调用流程、定时、等待外部事件、抄送。
      <Code>defineProcess</Code>{' '}
      从字面量推出节点、处理结果与变量的类型；从库里、设计器来的定义发布时按{' '}
      <Code>validateProcess</Code> 校验。
    </Paragraph>
    <CodeBlock title="processes.ts" code={define} lang="ts" />
    <ProcessDiagram definition={templates.leave()} aria-label="请假流程（模板）" />
    <H2 id="engine" size="xl" anchor>
      引擎
    </H2>
    <Paragraph>
      一个入口 <Code>engine.run(command, actor)</Code>
      ：发起、认领、处理、转办、撤回、终止、暂停恢复、催办、留言、抄送、改派、跳转、跳过失败的作业。每个命令一个事务，第一条语句锁住实例行，并发的会签不会卡死；提交待办用带状态条件的更新，重复提交报
      <Code>already-handled</Code>。外部事件经 <Code>engine.signal</Code>。
    </Paragraph>
    <CodeBlock title="flow.ts" code={engine} lang="ts" />
    <List>
      <ListItem>
        会签：全部、任一、按比例、依次；退回到上一步或运行时选的上游环节，跳出并行区域时取消另一条分支。
      </ListItem>
      <ListItem>
        时限、超时（标记或自动处理）、到期前与超时后的提醒、收件箱无人认领的提醒，按工作日算。
      </ListItem>
      <ListItem>
        自动节点同步或异步（作业重试，失败的能重试、跳过），同步调用子流程，等待外部事件与超时。
      </ListItem>
      <ListItem>Java 版 flow 的 37 个场景里跑通了 20 个；没做的能力在设计文档里写明。</ListItem>
    </List>
    <H2 id="simulate" size="xl" anchor>
      试运行
    </H2>
    <Paragraph>
      <Code>simulate</Code>{' '}
      在内存库与假时钟上按步骤走一遍，返回走过的路、停在哪、等谁；设计器的“试运行”经接口调用它，与真实引擎同一套规则。
    </Paragraph>
    <CodeBlock title="试运行" code={simulate} lang="ts" />
    <H2 id="designer" size="xl" anchor>
      流程图与设计器
    </H2>
    <Paragraph>
      <Code>@zerodep-dev/flow-ts-ui</Code> 的 <Code>ProcessDiagram</Code>{' '}
      画流程图（标出正在处理的与走过的），<Code>ProcessDesigner</Code>
      像低代码一样从模板起步：一步加审批环节、金额分支，点环节改谁来处理、几个人一起审、时限与按钮，问题用业务的话列出、点一下定位，开发者“切到代码”直接改定义。完整的例子在{' '}
      <Code>apps/flow-demo</Code>。
    </Paragraph>
  </DocPage>
));
