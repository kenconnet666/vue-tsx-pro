/**
 * 流程设计器（ROADMAP 14.8、14.8a）：像低代码一样从模板起步，常见结构一步加上（审批环节、金额分支），点图上的环节在右边改
 * （名称、谁来处理、几个人一起审、时限、按钮），问题用业务的话列出来、点一下定位；开发者“切到代码”直接改定义。
 * 试运行交给使用方（onSimulate：经接口调用引擎的 simulate，与真实引擎同一套规则）。
 *
 *   <ProcessDesigner _definition={draft} onSimulate={(definition) => run(definition)} />
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
  NumberField,
  Paragraph,
  Select,
  Small,
  Strong,
  TextField,
  Textarea,
} from '@zerodep-dev/vue-tsx-pro-ui';
import {
  addAmountBranch,
  addApprovalStep,
  problemMessage,
  removeStep,
  templates,
  validateProcess,
  type AssigneeSource,
  type ProcessDefinition,
  type ProcessEdge,
  type TaskNode,
} from '@zerodep-dev/flow-ts-model';
import { ProcessDiagram } from './ProcessDiagram.tsx';

/** ProcessDesigner 的属性 */
export interface ProcessDesignerProps {
  /** 正在设计的定义；没有时先选模板。父级写 _definition={x} 拿到改过的 */
  _definition?: ProcessDefinition | null;
  /** 试运行：拿到当前的定义（没有错误时才能点） */
  onSimulate?: (definition: ProcessDefinition) => void;
}

/** ProcessDesigner 的样式 */
export const processDesignerStyles = css.create({
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 18rem',
    gap: '_lg',
    alignItems: 'start',
  },
  canvas: {
    overflow: 'auto',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    padding: '_sm',
  },
  code: { fontFamily: '_mono', minHeight: '24rem' },
  problem: { cursor: 'pointer', textAlign: 'start' },
});

/** 去掉对象的一个属性（不改原对象） */
function omit<T extends object, K extends keyof T>(object: T, key: K): Omit<T, K> {
  const copy = { ...object };
  delete copy[key];
  return copy;
}

/** 处理人的种类（设计器里只给常用的三种；更多写在代码里） */
type AssigneeKind = 'initiator' | 'role' | 'user';
const ASSIGNEE_KINDS: readonly { value: AssigneeKind; label: string }[] = [
  { value: 'initiator', label: '发起人自己' },
  { value: 'role', label: '某个角色的人（谁有空谁认领）' },
  { value: 'user', label: '指定的人' },
];

/** 处理人来源的种类与值 */
function assigneeOf(node: TaskNode): { kind: AssigneeKind; value: string } {
  const first = node.assignees?.[0];
  if (!first || 'initiator' in first) return { kind: 'initiator', value: '' };
  if ('role' in first) return { kind: 'role', value: String(first.role as string | number) };
  if ('user' in first) return { kind: 'user', value: String(first.user as string | number) };
  return { kind: 'initiator', value: '' };
}

/** 种类与值 → 处理人来源 */
function assigneesFrom(kind: AssigneeKind, value: string): AssigneeSource[] {
  if (kind === 'initiator' || !value.trim()) return [{ initiator: true }];
  return kind === 'role'
    ? [{ role: value.trim() as `${bigint}` }]
    : [{ user: value.trim() as `${bigint}` }];
}

/** 流程设计器 */
export const ProcessDesigner = _component(
  ({
    _definition: definition = _bindable<ProcessDefinition | null>(null),
    onSimulate,
  }: ProcessDesignerProps) => {
    let selected = _state<string | null>(null);
    let coding = _state(false);
    let codeText = _state('');
    let codeProblem = _state('');
    let actionProblem = _state('');

    const problems = _derived(
      definition ? validateProcess(definition).filter((p) => p.severity === 'error') : [],
    );
    const selectedNode = _derived(definition?.nodes.find((n) => n.id === selected) ?? null);

    /** 改定义：编辑操作报错时（比如分支加在了分叉的地方）把原因显示出来 */
    function change(edit: (current: ProcessDefinition) => ProcessDefinition) {
      if (!definition) return;
      try {
        definition = edit(definition);
        actionProblem = '';
      } catch (error) {
        actionProblem = error instanceof Error ? error.message : String(error);
      }
    }

    /** 改选中的人工环节 */
    function patchTask(patch: (node: TaskNode) => TaskNode) {
      const id = selected;
      change((current) => ({
        ...current,
        nodes: current.nodes.map((n) => (n.id === id && n.type === 'task' ? patch(n) : n)),
      }));
    }

    /** 分支网关后面“超过多少”的那条线 */
    const branchEdge = (id: string): ProcessEdge | undefined =>
      definition?.edges.find((e) => e.from === id && e.when && 'field' in e.when);

    function patchBranch(over: number | null) {
      const id = selected;
      if (id === null || over === null) return;
      change((current) => ({
        ...current,
        edges: current.edges.map((e) =>
          e.from === id && e.when && 'field' in e.when
            ? { ...e, when: { ...e.when, value: over }, label: `超过 ${over}` }
            : e,
        ),
      }));
    }

    function toggleCode() {
      if (!coding && definition) codeText = JSON.stringify(definition, null, 2);
      coding = !coding;
      codeProblem = '';
    }

    function applyCode(text: string) {
      codeText = text;
      try {
        definition = JSON.parse(text) as ProcessDefinition;
        codeProblem = '';
      } catch (error) {
        codeProblem = `JSON 写得不对：${error instanceof Error ? error.message : String(error)}`;
      }
    }

    const after = () =>
      selected ?? definition?.nodes.find((n) => n.type === 'start')?.id ?? 'start';

    function renderTemplates() {
      const choices = [
        { make: templates.leave, title: '请假', text: '经理审批，超过 3 天再给人事备案' },
        {
          make: templates.purchase,
          title: '采购申请',
          text: '部门经理审批，金额超过一万再给总经理',
        },
        { make: templates.expense, title: '报销', text: '财务复核（财务的人谁有空谁认领）' },
      ];
      return (
        <Flex direction="column" gap="md">
          <Paragraph>
            先选一个最接近的模板，再在图上点环节改；也可以之后再加环节、加分支。
          </Paragraph>
          <Flex gap="md" wrap>
            {choices.map((choice) => (
              <Card key={choice.title} padding="md">
                <Flex direction="column" gap="sm" align="start">
                  <Strong>{choice.title}</Strong>
                  <Small>{choice.text}</Small>
                  <Button size="sm" onClick={() => (definition = choice.make())}>
                    用这个模板
                  </Button>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Flex>
      );
    }

    function renderPanel() {
      const node = selectedNode;
      if (!node) return <Small>点图上的环节在这里改；没选时“加审批环节”加在开始之后。</Small>;
      if (node.type === 'exclusive') {
        const edge = branchEdge(node.id);
        const value = edge?.when && 'value' in edge.when ? Number(edge.when.value) : null;
        return (
          <Flex direction="column" gap="md">
            <Strong>{node.name}</Strong>
            {edge && (
              <Field label="超过多少走加审的那条路">
                <NumberField
                  _value={value}
                  onUpdate:_value={(v: unknown) => patchBranch(v as number | null)}
                />
              </Field>
            )}
          </Flex>
        );
      }
      if (node.type !== 'task') return <Strong>{node.name}</Strong>;
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
              items={ASSIGNEE_KINDS.map((k) => ({ value: k.value, label: k.label }))}
              _value={assignee.kind}
              onUpdate:_value={(kind: unknown) =>
                patchTask((n) => ({
                  ...n,
                  assignees: assigneesFrom(kind as AssigneeKind, assignee.value),
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
            onChange={(event: Event) => {
              const on = (event.target as HTMLInputElement).checked;
              patchTask((n) =>
                on
                  ? { ...n, multi: { participants: n.assignees ?? [], complete: 'all' } }
                  : omit(n, 'multi'),
              );
            }}
          >
            几个人一起审（全部同意才通过）
          </Checkbox>
          <Field label="多久内处理（小时，不填不限）">
            <NumberField
              _value={node.due && 'hours' in node.due ? node.due.hours : null}
              onUpdate:_value={(hours: unknown) =>
                patchTask((n) =>
                  typeof hours === 'number' && hours > 0
                    ? { ...n, due: { hours } }
                    : omit(n, 'due'),
                )
              }
            />
          </Field>
          <Strong>按钮</Strong>
          {node.outcomes.map((outcome, index) => (
            <Flex key={outcome.key} gap="sm" align="center">
              <TextField
                aria-label={`按钮 ${index + 1} 的文字`}
                _value={outcome.label}
                onUpdate:_value={(label: string) =>
                  patchTask((n) => ({
                    ...n,
                    outcomes: n.outcomes.map((o) => (o.key === outcome.key ? { ...o, label } : o)),
                  }))
                }
              />
              <Checkbox
                _checked={outcome.comment === 'required'}
                onChange={(event: Event) => {
                  const required = (event.target as HTMLInputElement).checked;
                  patchTask((n) => ({
                    ...n,
                    outcomes: n.outcomes.map((o) =>
                      o.key === outcome.key
                        ? required
                          ? { ...o, comment: 'required' as const }
                          : omit(o, 'comment')
                        : o,
                    ),
                  }));
                }}
              >
                要写意见
              </Checkbox>
            </Flex>
          ))}
        </Flex>
      );
    }

    return () => {
      if (!definition) return renderTemplates();
      return (
        <Flex direction="column" gap="md">
          <Flex gap="sm" wrap aria-label="设计器的操作">
            <Button
              size="sm"
              disabled={coding}
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
              disabled={coding}
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
              disabled={
                coding ||
                !selectedNode ||
                selectedNode.type === 'start' ||
                selectedNode.type === 'end'
              }
              onClick={() => {
                const id = selected!;
                change((d) => removeStep(d, id));
                selected = null;
              }}
            >
              删除这一步
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleCode}>
              {coding ? '切回设计' : '切到代码'}
            </Button>
            {onSimulate && (
              <Button
                size="sm"
                variant="soft"
                disabled={problems.length > 0}
                onClick={() => onSimulate(definition!)}
              >
                试运行
              </Button>
            )}
          </Flex>
          {actionProblem && <Alert tone="warning">{actionProblem}</Alert>}
          {coding ? (
            <Flex direction="column" gap="sm">
              {codeProblem && <Alert tone="danger">{codeProblem}</Alert>}
              <Textarea
                aria-label="流程定义（JSON）"
                _value={codeText}
                onUpdate:_value={applyCode}
                sx={processDesignerStyles.code}
              />
            </Flex>
          ) : (
            <div {...css.attrs(processDesignerStyles.layout)}>
              <div {...css.attrs(processDesignerStyles.canvas)}>
                <ProcessDiagram
                  definition={definition}
                  selected={selected}
                  onSelect={(id) => (selected = id)}
                />
              </div>
              <div aria-label="环节设置">{renderPanel()}</div>
            </div>
          )}
          {problems.length > 0 ? (
            <Flex direction="column" gap="xs" aria-label="问题">
              <Strong>还有 {problems.length} 个问题要处理</Strong>
              {problems.map((problem, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  tone="danger"
                  sx={processDesignerStyles.problem}
                  onClick={() => (selected = problem.node ?? null)}
                >
                  {problemMessage(problem, definition!)}
                </Button>
              ))}
            </Flex>
          ) : (
            <Small>没有问题，可以试运行、发布。</Small>
          )}
        </Flex>
      );
    };
  },
);
