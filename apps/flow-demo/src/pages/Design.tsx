/**
 * 设计流程（要求 flow.admin）：从模板起步改，试运行看走到哪、停在谁那里，没问题就发布，发起页马上能用。
 * 设计器是组合（照文档站“流程设计与审批”一页）：画布点选环节、拖动摆位置，右边改环节的设置；问题列出来、点一下定位；
 * “代码”页直接改定义。流程的增删改都交给模型包的函数，试运行、发布经 action 调用引擎
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Alert,
  Button,
  Card,
  Flex,
  Grid,
  H1,
  ItemList,
  ItemListItem,
  Paragraph,
  Small,
  Strong,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { CodeEditor } from '@zerodep-dev/vue-tsx-pro-ui/code-editor';
import {
  Diagram,
  DiagramControls,
  useDiagram,
  type DiagramNodeMove,
  type DiagramSelection,
} from '@zerodep-dev/vue-tsx-pro-ui/diagram';
import {
  addAmountBranch,
  addApprovalStep,
  addCallStep,
  addCcStep,
  problemMessage,
  removeStep,
  templates,
  validateProcess,
  type ProcessDefinition,
} from '@zerodep-dev/flow-ts-model';
import { ActionError } from '@zerodep-dev/vue-tsx-pro-kit';
import { watch } from 'vue';
import { actions, usePageData } from '../client.ts';
import { NodePanel, without } from '../node-panel.tsx';
import { processDiagram, renderStep, stepLabel } from '../process-diagram.tsx';

/** 试运行的结果 */
type Trial = Awaited<ReturnType<typeof actions.simulate>>;

const styles = css.create({
  workspace: { display: 'flex', flexWrap: 'wrap', gap: '_lg', alignItems: 'flex-start' },
  canvas: { flex: '1 1 28rem', minWidth: 0 },
  panel: { flex: '1 1 16rem', maxWidth: '22rem' },
  code: { height: '26rem' },
});

const TEMPLATES = [
  { make: templates.leave, title: '请假', text: '经理审批，超过 3 天再给人事备案' },
  { make: templates.purchase, title: '采购申请', text: '部门经理审批，金额超过一万再给总经理' },
  { make: templates.expense, title: '报销', text: '财务复核（财务的人谁有空谁认领）' },
];

export default _component(() => {
  const diagram = useDiagram({ maxScale: 1.5 });
  let definition = _state.raw<ProcessDefinition | null>(null);
  let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
  let tab = _state('design');
  let code = _state('');
  let codeProblem = _state('');
  let actionProblem = _state('');
  let trial = _state.raw<Trial | null>(null);
  let message = _state('');
  let busy = _state(false);
  // 调用流程时能选的：已发布的流程
  const published = usePageData('/design');

  const view = _derived(definition ? processDiagram(definition) : null);
  const problems = _derived(
    definition ? validateProcess(definition).filter((p) => p.severity === 'error') : [],
  );
  const selected = _derived(
    selection.nodes.length === 1
      ? (definition?.nodes.find((n) => n.id === selection.nodes[0]) ?? null)
      : null,
  );

  // 切到“代码”时写出当前的定义；改代码时能解析就换掉定义
  watch(
    () => tab,
    (now) => {
      if (now === 'code' && definition) code = JSON.stringify(definition, null, 2);
      codeProblem = '';
    },
  );
  watch(
    () => code,
    (text) => {
      if (tab !== 'code') return;
      try {
        definition = JSON.parse(text) as ProcessDefinition;
        codeProblem = '';
      } catch (error) {
        codeProblem = `JSON 写得不对：${error instanceof Error ? error.message : String(error)}`;
      }
    },
  );

  /** 改定义：模型包的编辑函数报错时（比如分支加在了分叉的地方）把原因显示出来 */
  function change(edit: (current: ProcessDefinition) => ProcessDefinition) {
    if (!definition) return;
    try {
      definition = edit(definition);
      actionProblem = '';
    } catch (error) {
      actionProblem = error instanceof Error ? error.message : String(error);
    }
  }

  /** 拖动后的位置存进定义的 layout（引擎不读，只给画布） */
  function move(moves: DiagramNodeMove[]) {
    change((current) => ({
      ...current,
      layout: {
        ...current.layout,
        nodes: {
          ...current.layout?.nodes,
          ...Object.fromEntries(moves.map(({ id, x, y }) => [id, { x, y }])),
        },
      },
    }));
  }

  /** 定位到有问题的环节：平移到看得见并选中它 */
  function locate(id: string | undefined) {
    const step = view?.nodes.find((n) => n.id === id);
    if (!step) return;
    tab = 'design';
    diagram.reveal(step, 48);
    selection = { nodes: [step.id], edges: [] };
  }

  /** 试运行、发布：引擎的错误（ActionError）原样显示 */
  async function call(work: () => Promise<void>) {
    busy = true;
    message = '';
    try {
      await work();
    } catch (error) {
      message = error instanceof ActionError ? error.message : String(error);
    } finally {
      busy = false;
    }
  }
  const simulate = (current: ProcessDefinition) =>
    call(async () => {
      trial = await actions.simulate({ definition: current });
    });
  const publish = (current: ProcessDefinition) =>
    call(async () => {
      const { key, version } = await actions.publish({ definition: current });
      message = `已发布 ${key} 第 ${version} 版，发起页可以用了`;
    });

  /** 新环节加在选中的之后，没选时加在开始之后 */
  const after = () =>
    selected?.id ?? definition?.nodes.find((n) => n.type === 'start')?.id ?? 'start';

  function renderTemplates() {
    return (
      <Flex direction="column" gap="md">
        <Paragraph>先选一个最接近的模板，再在图上点环节改；之后也能加环节、加分支。</Paragraph>
        <Grid minItemWidth="14rem" gap="md">
          {TEMPLATES.map((choice) => (
            <Card
              key={choice.title}
              padding="md"
              footer={
                <Button size="sm" onClick={() => (definition = choice.make())}>
                  用这个模板
                </Button>
              }
            >
              <Flex direction="column" gap="xs">
                <Strong>{choice.title}</Strong>
                <Small tone="muted">{choice.text}</Small>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Flex>
    );
  }

  function renderDesigner() {
    if (!definition || !view) return renderTemplates();
    const steps = view;
    return (
      <Flex direction="column" gap="md">
        <Flex gap="sm" wrap align="center">
          <Button
            size="sm"
            onClick={() =>
              change((d) =>
                addApprovalStep(d, after(), { name: '新的审批', assignees: [{ role: '1' }] }),
              )
            }
          >
            加审批环节
          </Button>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              change((d) =>
                addAmountBranch(d, after(), {
                  field: d.variables?.find((v) => v.type === 'number')?.name ?? 'amount',
                  over: 10000,
                  step: { name: '加审', assignees: [{ role: '1' }] },
                }),
              )
            }
          >
            加金额分支
          </Button>
          <Button
            size="sm"
            variant="soft"
            disabled={!published.value?.length}
            onClick={() =>
              change((d) =>
                addCallStep(d, after(), { name: '调用流程', process: published.value![0]!.value }),
              )
            }
          >
            加子流程
          </Button>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              change((d) => addCcStep(d, after(), { name: '抄送', to: [{ role: '2' }] }))
            }
          >
            加抄送
          </Button>
          <Button
            size="sm"
            variant="ghost"
            tone="danger"
            disabled={!selected || selected.type === 'start' || selected.type === 'end'}
            onClick={() => {
              const id = selected!.id;
              change((d) => removeStep(d, id));
              selection = { nodes: [], edges: [] };
            }}
          >
            删除这一步
          </Button>
          <Button
            size="sm"
            variant="ghost"
            tone="neutral"
            disabled={!definition.layout}
            onClick={() => change((d) => without(d, 'layout'))}
          >
            重新排版
          </Button>
          <Button
            size="sm"
            variant="soft"
            tone="neutral"
            disabled={busy || problems.length > 0}
            onClick={() => void simulate(definition!)}
          >
            试运行
          </Button>
        </Flex>
        {actionProblem && (
          <Alert tone="warning" description={actionProblem} onClose={() => (actionProblem = '')} />
        )}
        <Tabs _value={tab}>
          <TabList aria-label="设计器">
            <Tab value="design">设计</Tab>
            <Tab value="code">代码</Tab>
          </TabList>
          <TabPanel value="design">
            <div {...css.attrs(styles.workspace)}>
              <Diagram
                controller={diagram}
                nodes={steps.nodes}
                edges={steps.edges}
                getNodeLabel={stepLabel}
                edgeText={(flow) => flow.text}
                routing="orthogonal"
                selectable
                _selected={selection}
                draggable
                snapToGrid
                onNodesMove={move}
                grid="dots"
                fitView
                height="24rem"
                overlay={<DiagramControls />}
                aria-label={`${definition.name}（设计中）`}
                sx={styles.canvas}
              >
                {renderStep}
              </Diagram>
              <Card padding="md" header="环节设置" sx={styles.panel}>
                <NodePanel
                  definition={definition}
                  node={selected}
                  processes={published.value ?? []}
                  onChange={change}
                />
              </Card>
            </div>
          </TabPanel>
          <TabPanel value="code">
            <Flex direction="column" gap="sm">
              {codeProblem && <Alert tone="danger" description={codeProblem} />}
              <CodeEditor _value={code} aria-label="流程定义（JSON）" sx={styles.code} />
            </Flex>
          </TabPanel>
        </Tabs>
        {problems.length > 0 ? (
          <Alert tone="danger" title={`还有 ${problems.length} 个问题要处理`}>
            <ItemList density="compact">
              {problems.map((problem, index) => (
                <ItemListItem
                  key={index}
                  title={problemMessage(problem, definition!)}
                  onSelect={() => locate(problem.node)}
                />
              ))}
            </ItemList>
          </Alert>
        ) : (
          <Alert tone="success" description="没有问题，可以试运行、发布。" />
        )}
      </Flex>
    );
  }

  return () => (
    <Flex direction="column" gap="lg">
      <H1>设计流程</H1>
      {renderDesigner()}
      {trial && (
        <Alert
          tone={trial.error ? 'warning' : 'info'}
          aria-label="试运行"
          description={
            trial.error
              ? `试运行停在第 ${trial.error.step} 步：${trial.error.message}`
              : trial.open.length > 0
                ? `发起后停在：${trial.open.map((o) => `${o.nodeName}（等 ${o.assignee ?? o.candidates.join('、')}）`).join('；')}`
                : `直接走完了：${trial.result ?? trial.status}`
          }
        />
      )}
      {definition && (
        <Flex gap="sm" align="center" wrap>
          <Button disabled={busy || problems.length > 0} onClick={() => void publish(definition!)}>
            发布
          </Button>
          <Small tone="muted">
            发布后定义不再改；再发布是新的版本，进行中的审批单按原来的版本走完。
          </Small>
        </Flex>
      )}
      {message && <Paragraph data-testid="design-message">{message}</Paragraph>}
    </Flex>
  );
});
