/**
 * 设计器右边的环节设置（组合）：选中的环节按类型给出能改的项，改动交给 onChange（设计器统一处理报错）。
 * - 人工环节：名称、谁来处理、几个人一起审（全部、任一、按比例、依次）、时限与超时怎么办、到期前提醒、允许转办与催办、
 *   按钮（文字、要不要写意见）、这一步每个字段能不能看、能不能改（表单权限）
 * - 分支：每条出线的说明与条件（ConditionBuilder 编辑，条件就是引擎认的 JSON），哪条是“其余情况”
 * - 调用流程：调哪个流程；抄送：抄给谁、附言
 * 设计器（文档站的“流程设计与审批”、流程中心的设计页）放在画布旁边
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Checkbox,
  ConditionBuilder,
  ControlGroup,
  Field,
  Flex,
  NumberField,
  Select,
  Small,
  Strong,
  TextField,
  type Condition,
  type ConditionField,
} from '@zerodep-dev/vue-tsx-pro-ui';
import type {
  AssigneeSource,
  CcNode,
  Duration,
  ProcessDefinition,
  ProcessEdge,
  ProcessNode,
  TaskNode,
  VariableDeclaration,
} from '@zerodep-dev/flow-ts-model';
import {
  accessItems,
  accessRows,
  fallbackText,
  patchNodeForm,
  withFieldAccess,
  type DefinitionEdit,
} from './form-access';
import { without } from '../utils/object';

/** NodePanel 的属性 */
export interface NodePanelProps {
  definition: ProcessDefinition;
  /** 选中的环节；没选时显示说明 */
  node: ProcessNode | null;
  /** 调用流程时能选的流程 */
  processes?: readonly { value: string; label: string }[];
  /** 改定义：设计器统一处理（模型包的函数报错时显示原因） */
  onChange: (edit: DefinitionEdit) => void;
}

/** 处理人：设计器里给常用的三种，更多的写在代码里 */
type AssigneeKind = 'initiator' | 'role' | 'user';
const ASSIGNEE_KINDS = [
  { value: 'initiator', label: '发起人自己' },
  { value: 'role', label: '某个角色的人（谁有空谁认领）' },
  { value: 'user', label: '指定的人' },
];

/** 几个人一起审的规则；none 是一个人处理 */
const MULTI_RULES = [
  { value: 'none', label: '一个人处理' },
  { value: 'all', label: '全部同意才通过（有人不同意立即结束）' },
  { value: 'any', label: '任一人处理就算' },
  { value: 'ratio', label: '同意的人数达到比例' },
  { value: 'sequential', label: '依次审批（一个接一个）' },
];

const DUE_UNITS = [
  { value: 'hours', label: '小时' },
  { value: 'days', label: '天' },
  { value: 'workdays', label: '工作日' },
];

const OVERDUE_ACTIONS = [
  { value: 'none', label: '不处理' },
  { value: 'mark', label: '标成超时' },
  { value: 'complete', label: '自动按“通过”处理' },
];

/** 编号：写死的编号显示出来，引用变量（{ ref }）的在代码里改 */
const idText = (id: unknown) =>
  typeof id === 'string' || typeof id === 'number' ? String(id) : '';

function sourceOf(sources: readonly AssigneeSource[] | undefined): {
  kind: AssigneeKind;
  value: string;
} {
  const first = sources?.[0];
  if (first && 'role' in first) return { kind: 'role', value: idText(first.role) };
  if (first && 'user' in first) return { kind: 'user', value: idText(first.user) };
  return { kind: 'initiator', value: '' };
}

function sourcesFrom(kind: AssigneeKind, value: string): AssigneeSource[] {
  const id = value.trim() as `${bigint}`;
  if (kind === 'initiator' || !id) return [{ initiator: true }];
  return kind === 'role' ? [{ role: id }] : [{ user: id }];
}

/** 时长的数值与单位（设计器给小时、天、工作日；分钟写在代码里） */
function durationOf(due: TaskNode['due']): { amount: number | null; unit: string } {
  if (!due || 'until' in due) return { amount: null, unit: 'hours' };
  const [unit, amount] = Object.entries(due)[0] as [string, number];
  return { amount, unit: unit === 'minutes' ? 'hours' : unit };
}

/** 流程变量 → 条件编辑器的字段（类型就近映射） */
function conditionFields(variables: readonly VariableDeclaration[] = []): ConditionField[] {
  const type = (t: VariableDeclaration['type']): ConditionField['type'] =>
    t === 'number' || t === 'decimal'
      ? 'number'
      : t === 'date' || t === 'datetime'
        ? 'date'
        : t === 'boolean'
          ? 'boolean'
          : 'text';
  return variables.map((v) => ({ name: v.name, label: v.label ?? v.name, type: type(v.type) }));
}

/** 环节设置 */
export const NodePanel = _component(
  ({ definition, node, processes = [], onChange }: NodePanelProps) => {
    /** 改选中的那个环节 */
    function patch<N extends ProcessNode>(update: (current: N) => ProcessNode) {
      const id = node?.id;
      onChange((current) => ({
        ...current,
        nodes: current.nodes.map((n) => (n.id === id ? update(n as N) : n)),
      }));
    }
    const patchTask = (update: (current: TaskNode) => TaskNode) => patch<TaskNode>(update);

    function patchEdge(id: string, update: (edge: ProcessEdge) => ProcessEdge) {
      onChange((current) => ({
        ...current,
        edges: current.edges.map((e) => (e.id === id ? update(e) : e)),
      }));
    }

    const nameField = (current: ProcessNode) => (
      <Field label="环节名称">
        <TextField
          _value={current.name}
          onUpdate:_value={(name: string) => patch((n) => ({ ...n, name }))}
        />
      </Field>
    );

    /** 谁来处理 / 抄给谁：种类与编号 */
    function renderSources(
      label: string,
      sources: readonly AssigneeSource[] | undefined,
      set: (next: AssigneeSource[]) => void,
    ) {
      const source = sourceOf(sources);
      return [
        <Field key="kind" label={label}>
          <Select
            items={ASSIGNEE_KINDS}
            _value={source.kind}
            onUpdate:_value={(kind: string | null) =>
              set(sourcesFrom((kind ?? 'initiator') as AssigneeKind, source.value))
            }
          />
        </Field>,
        source.kind !== 'initiator' && (
          <Field key="id" label={source.kind === 'role' ? '角色编号' : '人员编号'}>
            <TextField
              _value={source.value}
              onUpdate:_value={(value: string) => set(sourcesFrom(source.kind, value))}
            />
          </Field>
        ),
      ];
    }

    function renderBranch(gateway: ProcessNode) {
      const edges = definition.edges.filter((e) => e.from === gateway.id);
      const fields = conditionFields(definition.variables);
      return (
        <Flex direction="column" gap="md">
          <Small tone="muted">按顺序找第一条条件成立的线走；都不成立走“其余情况”。</Small>
          {edges.map((edge) => {
            const target = definition.nodes.find((n) => n.id === edge.to)?.name ?? edge.to;
            return (
              <Flex key={edge.id} direction="column" gap="sm">
                <Strong>到“{target}”</Strong>
                <Field label="线上的说明">
                  <TextField
                    _value={edge.label ?? ''}
                    onUpdate:_value={(label: string) =>
                      patchEdge(edge.id, (e) => (label ? { ...e, label } : without(e, 'label')))
                    }
                  />
                </Field>
                <Checkbox
                  _checked={!!edge.default}
                  onUpdate:_checked={(on: boolean) =>
                    patchEdge(edge.id, (e) =>
                      on ? { ...without(e, 'when'), default: true } : without(e, 'default'),
                    )
                  }
                >
                  其余情况走这条
                </Checkbox>
                {!edge.default && (
                  <ConditionBuilder
                    fields={fields}
                    _value={(edge.when as Condition | undefined) ?? null}
                    onUpdate:_value={(when: Condition | null) =>
                      patchEdge(edge.id, (e) => (when ? { ...e, when } : without(e, 'when')))
                    }
                    aria-label={`到“${target}”的条件`}
                  />
                )}
              </Flex>
            );
          })}
        </Flex>
      );
    }

    function renderTask(task: TaskNode) {
      const due = durationOf(task.due);
      const approve = task.outcomes.find((o) => (o.kind ?? 'approve') === 'approve');
      const reminder = task.reminders?.find((r) => 'before' in r);
      const remindHours =
        reminder && 'before' in reminder && 'hours' in reminder.before
          ? reminder.before.hours
          : null;
      return (
        <Flex direction="column" gap="md">
          {nameField(task)}
          {renderSources('谁来处理', task.assignees, (assignees) =>
            patchTask((n) => ({
              ...n,
              assignees,
              ...(n.multi ? { multi: { ...n.multi, participants: assignees } } : {}),
            })),
          )}
          <Field label="几个人一起审">
            <Select
              items={MULTI_RULES}
              _value={task.multi ? String(task.multi.complete) : 'none'}
              onUpdate:_value={(rule: string | null) =>
                patchTask((n) =>
                  !rule || rule === 'none'
                    ? without(n, 'multi')
                    : {
                        ...n,
                        multi: {
                          participants: n.assignees ?? [],
                          complete: rule,
                          ...(rule === 'ratio' ? { ratio: n.multi?.ratio ?? 0.5 } : {}),
                        },
                      },
                )
              }
            />
          </Field>
          {task.multi?.complete === 'ratio' && (
            <Field label="同意的人数达到（%）">
              <NumberField
                _value={Math.round((task.multi.ratio ?? 0.5) * 100)}
                onUpdate:_value={(percent: number | null) =>
                  patchTask((n) => ({
                    ...n,
                    multi: { ...n.multi!, ratio: Math.min(100, Math.max(1, percent ?? 50)) / 100 },
                  }))
                }
                min={1}
                max={100}
              />
            </Field>
          )}
          <Field label="多久内处理" description="不填不限">
            <ControlGroup>
              <NumberField
                _value={due.amount}
                onUpdate:_value={(amount: number | null) =>
                  patchTask((n) =>
                    amount && amount > 0
                      ? { ...n, due: { [due.unit]: amount } as Duration }
                      : without(without(without(n, 'due'), 'overdue'), 'reminders'),
                  )
                }
                min={0}
              />
              <Select
                items={DUE_UNITS}
                _value={due.unit}
                onUpdate:_value={(unit: string | null) =>
                  due.amount &&
                  patchTask((n) => ({ ...n, due: { [unit ?? 'hours']: due.amount } as Duration }))
                }
                aria-label="时限的单位"
              />
            </ControlGroup>
          </Field>
          {task.due && (
            <>
              <Field label="超时怎么办">
                <Select
                  items={OVERDUE_ACTIONS}
                  _value={task.overdue?.action ?? 'none'}
                  onUpdate:_value={(action: string | null) =>
                    patchTask((n) =>
                      action === 'mark'
                        ? { ...n, overdue: { action: 'mark' } }
                        : action === 'complete' && approve
                          ? { ...n, overdue: { action: 'complete', outcome: approve.key } }
                          : without(n, 'overdue'),
                    )
                  }
                />
              </Field>
              <Field label="到期前几小时提醒" description="不填不提醒">
                <NumberField
                  _value={remindHours}
                  onUpdate:_value={(hours: number | null) =>
                    patchTask((n) =>
                      hours && hours > 0
                        ? { ...n, reminders: [{ before: { hours } }] }
                        : without(n, 'reminders'),
                    )
                  }
                  min={0}
                />
              </Field>
            </>
          )}
          <Field label="允许">
            <Flex gap="md" wrap>
              <Checkbox
                _checked={task.allow?.transfer !== false}
                onUpdate:_checked={(on: boolean) =>
                  patchTask((n) => ({ ...n, allow: { ...n.allow, transfer: on } }))
                }
              >
                转办
              </Checkbox>
              <Checkbox
                _checked={task.allow?.remind !== false}
                onUpdate:_checked={(on: boolean) =>
                  patchTask((n) => ({ ...n, allow: { ...n.allow, remind: on } }))
                }
              >
                催办
              </Checkbox>
            </Flex>
          </Field>
          <Field label="按钮" description="勾上的按钮要写意见">
            <Flex direction="column" gap="sm">
              {task.outcomes.map((outcome, index) => (
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
          {accessRows(definition).length > 0 && (
            <Field
              label="这一步的单据"
              description="每个字段能不能看、能不能改；全部环节一起看用权限矩阵"
            >
              <Flex direction="column" gap="sm">
                {accessRows(definition).map((row) => (
                  <Flex key={row.path} gap="sm" align="center" justify="between">
                    <Small>{row.label}</Small>
                    <Select
                      items={accessItems(fallbackText(task, row))}
                      size="sm"
                      _value={task.form?.fields?.[row.path] ?? 'inherit'}
                      onUpdate:_value={(access: string | null) =>
                        onChange(
                          patchNodeForm(task.id, (form) =>
                            withFieldAccess(form, row.path, access ?? 'inherit'),
                          ),
                        )
                      }
                      aria-label={`“${row.label}”在这一步`}
                    />
                  </Flex>
                ))}
              </Flex>
            </Field>
          )}
        </Flex>
      );
    }

    return () => {
      if (!node)
        return <Small tone="muted">点图上的环节在这里改；没选时新环节加在开始之后。</Small>;
      switch (node.type) {
        case 'task':
          return renderTask(node);
        case 'exclusive':
        case 'inclusive':
          return renderBranch(node);
        case 'call':
          return (
            <Flex direction="column" gap="md">
              {nameField(node)}
              <Field label="调用的流程" description="等它结束，按它的结果接着往下走">
                <Select
                  items={processes}
                  _value={node.process || null}
                  onUpdate:_value={(process: string | null) =>
                    patch((n) => ({ ...n, process: process ?? '' }))
                  }
                  placeholder="选一个已发布的流程"
                />
              </Field>
            </Flex>
          );
        case 'cc':
          return (
            <Flex direction="column" gap="md">
              {nameField(node)}
              {renderSources('抄送给', node.to, (to) => patch((n) => ({ ...n, to })))}
              <Field label="附言">
                <TextField
                  _value={node.message ?? ''}
                  onUpdate:_value={(message: string) =>
                    patch<CcNode>((n) => (message ? { ...n, message } : without(n, 'message')))
                  }
                />
              </Field>
            </Flex>
          );
        default:
          return <Small tone="muted">这种环节的设置在“代码”里改。</Small>;
      }
    };
  },
);
