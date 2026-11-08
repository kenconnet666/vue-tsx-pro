/**
 * 全栈：流程引擎（@zerodep-dev/flow-ts-*）。定义、引擎、扩展点、试运行、流程图与设计器
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Workflow } from '@lucide/icons';
import {
  Alert,
  Code,
  CodeBlock,
  H2,
  Link,
  LinkButton,
  List,
  ListItem,
  Paragraph,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { Diagram } from '@zerodep-dev/vue-tsx-pro-ui/diagram';
import { templates } from '@zerodep-dev/flow-ts-model';
import { processDiagram, renderStep, stepLabel } from '@zerodep-dev/flow-ts-ui';
import { DocPage } from '../../site/DocPage';

const leave = processDiagram(templates.leave());

const meta = {
  title: 'Flow 流程引擎',
  description:
    '审批流程引擎：图是数据，设计器与代码读写同一份定义；一个命令入口，扩展点是选项里的函数；持久层是 PostgreSQL 上的 easy-query，界面是组件库。',
};

const engine = `import { createFlowEngine } from '@zerodep-dev/flow-ts-engine';
import { postgres } from '@zerodep-dev/easy-query-ts-pg';

const engine = createFlowEngine({
  adapter: postgres(pool),                    // PostgreSQL（pg 连接池或 PGlite），引擎在这个库里建自己的表
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

const server = `// server/flow.ts（只在服务端）import pg from 'pg';
import { postgres } from '@zerodep-dev/easy-query-ts-pg';
import { createFlowEngine, flowEndpoint, flowHttpHandler } from '@zerodep-dev/flow-ts-engine';
import { createOrgDirectory } from '@zerodep-dev/flow-ts-engine/org';
import { createInvalidationHub, type KitModule } from '@zerodep-dev/vue-tsx-pro-kit/server';

const adapter = postgres(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
// 组织目录：部门、角色、员工的表；有 HR 系统时定时 directory.sync(从 HR 拉的数据)
export const directory = createOrgDirectory({ adapter, isAdmin: (e) => e.roles.includes('admin') });
export const engine = createFlowEngine({
  adapter,
  org: directory.org,
  extensions: { resolvers: directory.resolvers },
});

// 页面的调用：身份按会话定，页面传不进来
const endpoint = flowEndpoint<Request>(engine, {
  actor: async (request) => (await directory.actorOf(userOfSession(request))) ?? anonymous(),
});
export const handleFlow = flowHttpHandler(endpoint);

// 数据变了推给浏览器：接到 kit 的失效推送上（createRenderer({ invalidation: hub })）
export const hub = createInvalidationHub();
endpoint.onChange(() => hub.publish(['flow']));

// 到点的作业（时限、提醒、异步动作）：多实例部署时靠作业表上的抢占，不会重复做
export const flowModule: KitModule = {
  name: 'flow',
  start: () => void setInterval(() => void engine.jobs.runDue().then((ran) => ran > 0 && endpoint.changed()), 10_000),
};

// server/api/flow.post.ts（Nitro 的路由）
export default defineEventHandler((event) => handleFlow(toWebRequest(event)));`;

const client = `// 页面：不导入引擎，只经客户端调用；与流程中心（Worker 里的引擎）同一套页面代码
import { createFlowClient, httpTransport } from '@zerodep-dev/flow-ts-engine/client';
import { listenInvalidation } from '@zerodep-dev/vue-tsx-pro-kit';

export const flow = createFlowClient(
  httpTransport('/api/flow', {
    subscribe: (changed) => listenInvalidation((tags) => (!tags || tags.includes('flow')) && changed()),
  }),
);
const todo = await flow.todo();
await flow.run({ type: 'complete', workItem: todo[0].id, outcome: 'approve' });`;

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
    <Alert
      tone="accent"
      title="流程中心"
      description="引擎、PostgreSQL（PGlite）都跑在浏览器里的一个完整演示：工作台、审批单、发起，可以切换演示身份、快进时钟。"
      action={
        <LinkButton href="/flow/work" size="sm" icon={Workflow}>
          打开流程中心
        </LinkButton>
      }
    />
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
    <Diagram
      nodes={leave.nodes}
      edges={leave.edges}
      getNodeLabel={stepLabel}
      edgeText={(flow) => flow.text}
      routing="orthogonal"
      fitView
      height="16rem"
      aria-label="请假流程（模板）"
    >
      {renderStep}
    </Diagram>
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
    <H2 id="server" size="xl" anchor>
      服务端接入（kit + PostgreSQL）
    </H2>
    <Paragraph>
      引擎、组织目录跑在服务端，库是 PostgreSQL；页面经 <Code>flow-ts-engine/client</Code>{' '}
      的客户端调用，命令与查询都不带身份——身份由服务端的端点按会话定。端点只认列出的方法，实例详情只给经手的人与管理员看，全部异常与重试只给管理员。处理函数用
      Web 标准的 Request / Response，Nitro、Hono、Bun 的路由里都能直接挂；“数据变了”接到 kit
      的失效推送上，列表与待办数实时刷新。
    </Paragraph>
    <CodeBlock title="server/flow.ts" code={server} lang="ts" />
    <CodeBlock title="client.ts" code={client} lang="ts" />
    <H2 id="designer" size="xl" anchor>
      流程图与设计器
    </H2>
    <Paragraph>
      流程图、设计器、审批面板没有单独的包，都是组件库拼的：流程图是画布{' '}
      <Link href="/components/diagram">Diagram</Link>
      {'（开始、结束画圆，网关画菱形，正在处理的加光晕，退回的线从下面绕回），设计器与审批面板见 '}
      <Link href="/components/workflow">流程设计与审批</Link>
      {
        '：从模板起步，一步加审批环节、金额分支，点环节改谁来处理、几个人一起审、时限与按钮，问题用业务的话列出、点一下定位，开发者在“代码”页直接改定义。流程的增删改是模型包的函数。接上引擎的完整例子在 '
      }
      <Code>apps/flow-demo</Code>。
    </Paragraph>
  </DocPage>
));
