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
  Checkbox,
  Field,
  Flex,
  Grid,
  H1,
  ItemList,
  ItemListItem,
  NumberField,
  Paragraph,
  Select,
  Small,
  Strong,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
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
  problemMessage,
  removeStep,
  templates,
  validateProcess,
  type AssigneeSource,
  type ProcessDefinition,
  type TaskNode,
} from '@zerodep-dev/flow-ts-model';
import { ActionError } from '@zerodep-dev/vue-tsx-pro-kit';
import { watch } from 'vue';
import { actions } from '../client.ts';
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

/** 处理人：设计器里给常用的三种，更多的写在代码里 */
type AssigneeKind = 'initiator' | 'role' | 'user';
const ASSIGNEE_KINDS = [
  { value: 'initiator', label: '发起人自己' },
  { value: 'role', label: '某个角色的人（谁有空谁认领）' },
  { value: 'user', label: '指定的人' },
];

/** 编号：写死的编号显示出来，引用变量（{ ref }）的在代码里改 */
const idText = (id: unknown) =>
  typeof id === 'string' || typeof id === 'number' ? String(id) : '';

function assigneeOf(node: TaskNode): { kind: AssigneeKind; value: string } {
  const first = node.assignees?.[0];
  if (first && 'role' in first) return { kind: 'role', value: idText(first.role) };
  if (first && 'user' in first) return { kind: 'user', value: idText(first.user) };
  return { kind: 'initiator', value: '' };
}

function assigneesFrom(kind: AssigneeKind, value: string): AssigneeSource[] {
  const id = value.trim() as `${bigint}`;
  if (kind === 'initiator' || !id) return [{ initiator: true }];
  return kind === 'role' ? [{ role: id }] : [{ user: id }];
}

/** 去掉一个可选字段（不改原对象） */
function without<T extends object, K extends keyof T>(object: T, key: K): Omit<T, K> {
  const copy = { ...object };
  delete copy[key];
  return copy;
}

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

  function patchTask(patch: (node: TaskNode) => TaskNode) {
    const id = selected?.id;
    change((current) => ({
      ...current,
      nodes: current.nodes.map((n) => (n.id === id && n.type === 'task' ? patch(n) : n)),
    }));
  }

  /** 金额分支“超过多少”的那条线 */
  function patchBranch(over: number | null) {
    const id = selected?.id;
    if (over === null) return;
    change((current) => ({
      ...current,
      edges: current.edges.map((e) =>
        e.from === id && e.when && 'field' in e.when
          ? { ...e, when: { ...e.when, value: over }, label: `超过 ${over}` }
          : e,
      ),
    }));
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
            <Card key={choice.title} padding="md">
              <Flex direction="column" gap="sm" align="start">
                <Strong>{choice.title}</Strong>
                <Small tone="muted">{choice.text}</Small>
                <Button size="sm" onClick={() => (definition = choice.make())}>
                  用这个模板
                </Button>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Flex>
    );
  }

  function renderPanel() {
    const node = selected;
    if (!node)
      return <Small tone="muted">点图上的环节在这里改；没选时“加审批环节”加在开始之后。</Small>;
    if (node.type === 'exclusive') {
      const edge = definition?.edges.find((e) => e.from === node.id && e.when && 'field' in e.when);
      const over = edge?.when && 'value' in edge.when ? Number(edge.when.value) : null;
      return edge ? (
        <Field label="超过多少走加审的那条路">
          <NumberField _value={over} onUpdate:_value={patchBranch} min={0} step={1000} />
        </Field>
      ) : (
        <Small tone="muted">分支的条件在“代码”里改。</Small>
      );
    }
    if (node.type !== 'task') return <Small tone="muted">这种环节的设置在“代码”里改。</Small>;
    const assignee = assigneeOf(node);
    return (
      <Flex direction="column" gap="md">
        <Field label="环节名称">
          <TextField
            _value={node.name}
            onUpdate:_value={(name: string) => patchTask((n) => ({ ...n, name }))}
          />
        </Field>
        <Field label="谁来处理">
          <Select
            items={ASSIGNEE_KINDS}
            _value={assignee.kind}
            onUpdate:_value={(kind: string | null) =>
              patchTask((n) => ({
                ...n,
                assignees: assigneesFrom((kind ?? 'initiator') as AssigneeKind, assignee.value),
              }))
            }
          />
        </Field>
        {assignee.kind !== 'initiator' && (
          <Field label={assignee.kind === 'role' ? '角色编号' : '人员编号'}>
            <TextField
              _value={assignee.value}
              onUpdate:_value={(value: string) =>
                patchTask((n) => ({ ...n, assignees: assigneesFrom(assignee.kind, value) }))
              }
            />
          </Field>
        )}
        <Checkbox
          _checked={!!node.multi}
          onUpdate:_checked={(on: boolean) =>
            patchTask((n) =>
              on
                ? { ...n, multi: { participants: n.assignees ?? [], complete: 'all' } }
                : without(n, 'multi'),
            )
          }
        >
          几个人一起审（全部同意才通过）
        </Checkbox>
        <Field label="多久内处理" description="小时，不填不限">
          <NumberField
            _value={node.due && 'hours' in node.due ? node.due.hours : null}
            onUpdate:_value={(hours: number | null) =>
              patchTask((n) => (hours && hours > 0 ? { ...n, due: { hours } } : without(n, 'due')))
            }
            min={0}
          />
        </Field>
        <Field label="按钮" description="勾上的按钮要写意见">
          <Flex direction="column" gap="sm">
            {node.outcomes.map((outcome, index) => (
              <Flex key={outcome.key} gap="sm" align="center">
                <TextField
                  aria-label={`按钮 ${index + 1} 的文字`}
                  _value={outcome.label}
                  onUpdate:_value={(label: string) =>
                    patchTask((n) => ({
                      ...n,
                      outcomes: n.outcomes.map((o) =>
                        o.key === outcome.key ? { ...o, label } : o,
                      ),
                    }))
                  }
                />
                <Checkbox
                  aria-label={`“${outcome.label}”要写意见`}
                  _checked={outcome.comment === 'required'}
                  onUpdate:_checked={(required: boolean) =>
                    patchTask((n) => ({
                      ...n,
                      outcomes: n.outcomes.map((o) =>
                        o.key !== outcome.key
                          ? o
                          : required
                            ? { ...o, comment: 'required' as const }
                            : without(o, 'comment'),
                      ),
                    }))
                  }
                />
              </Flex>
            ))}
          </Flex>
        </Field>
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
                {renderPanel()}
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
