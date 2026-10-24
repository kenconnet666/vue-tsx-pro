/**
 * 流程设计器：在流程图上选节点，属性面板里改处理人、时限、超时与提醒（以及名称、泳道、说明），
 * 随改随校验（validateProcess），问题标在图上、列在下面；有改动、没有错误时发布新版本。
 *
 *   <FlowDesigner
 *     definition={_bind(draft)}                          // 草稿：每次修改写回一份新的流程定义
 *     groups={[{ value: 'cost', label: '成本团队收件箱' }]}  // 岗位收件箱（处理人选“指定岗位收件箱”时）
 *     users={people}                                     // 人（处理人选“指定的人”时）
 *     onPublish={(flow) => api.publish(flow)}            // 收到版本加一的定义；返回 Promise 时按钮转圈
 *   />
 *
 * 只改节点的属性，不加删节点与连线（结构的改动走 JSON 或后端的建模工具）；处理结果在面板里只读列出。
 * 取流程变量的处理人、时限（{ var: 'team' }）在面板里只显示变量名，不改。
 *
 * 部件：Root（div）、Toolbar、Diagram（FlowDiagram）、Panel（属性面板）、Problems（问题列表）。
 */
import { CircleAlert, TriangleAlert, Upload } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { watch, type VNodeChild } from 'vue';
import { Badge } from '../base/Badge';
import { Button, type ButtonProps } from '../base/Button';
import { Icon } from '../base/Icon';
import { useMessages } from '../config/lang/messages';
import { Field } from '../form/Field';
import type { ListboxOption } from '../input/list-state';
import { NumberField } from '../input/NumberField';
import { Select } from '../input/Select';
import { Switch } from '../input/Switch';
import { Textarea } from '../input/Textarea';
import { TextField } from '../input/TextField';
import { ToggleGroup, ToggleItem } from '../input/ToggleGroup';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import type {
  ProcessAssignee,
  ProcessDefinition,
  ProcessDue,
  ProcessNode,
  ProcessOutcomeKind,
  ProcessTaskNode,
  ProcessValue,
  ProcessVariableRef,
} from './definition';
import { FlowDiagram, type FlowDiagramProps } from './FlowDiagram';
import { workflowMessages } from './messages';
import { validateProcess, type ProcessProblem } from './validate';

/** 未声明的属性落到外层 div 上；原生的 title 属性让给工具栏的标题 */
export interface FlowDesignerProps extends PartProps<'div', 'title'> {
  /** 正在编辑的流程定义（草稿）：父级写 definition={_bind(draft)}，每次修改写回一份新的 */
  definition?: ProcessDefinition;
  /** 选中的节点：父级可以写 selected={_bind(x)} */
  selected?: string | null;
  /** 岗位收件箱的选项（处理人选“指定岗位收件箱”时） */
  groups?: readonly ListboxOption[];
  /** 人的选项（处理人选“指定的人”时） */
  users?: readonly ListboxOption[];
  /** 发布：收到版本加一的定义；返回 Promise 时等它完成，成功后草稿的版本跟着加一。不给时没有发布按钮 */
  onPublish?: (definition: ProcessDefinition) => unknown;
  /** 工具栏开头的内容（流程名称、返回按钮）；不写时是流程的名称与版本 */
  title?: VNodeChild;
  /** 流程图的部件属性 */
  propsDiagram?: Partial<FlowDiagramProps>;
  /** 属性面板的部件属性 */
  propsPanel?: PartProps<'section'>;
  /** 发布按钮的部件属性 */
  propsPublish?: Partial<ButtonProps>;
}

/** FlowDesigner 的样式 */
export const flowDesignerStyles = css.create({
  root: { display: 'grid', gap: '_md' },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_sm',
  },
  title: { fontWeight: '_semibold', color: '_text' },
  tools: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '_sm' },
  body: { display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: '_md' },
  diagram: { flexGrow: 1, flexShrink: 1, flexBasis: '32rem', minWidth: 0 },
  panel: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: '20rem',
    minWidth: 0,
    display: 'grid',
    // 列宽不被内容撑开：面板窄时输入框跟着收窄
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '_md',
    padding: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_surface',
  },
  panelHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '_sm' },
  hint: { fontSize: '_sm', color: '_textMuted' },
  row: { display: 'flex', alignItems: 'center', gap: '_sm' },
  grow: { flexGrow: 1, minWidth: 0 },
  outcomes: { display: 'flex', flexWrap: 'wrap', gap: '_xs' },
  problems: { display: 'grid', gap: '_xs', margin: 0, padding: 0, listStyle: 'none' },
  problem: {
    display: 'flex',
    alignItems: 'center',
    gap: '_xs',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    font: 'inherit',
    fontSize: '_sm',
    textAlign: 'start',
    color: '_text',
    cursor: 'pointer',
    textDecorationLine: { default: 'none', ':hover': 'underline' },
  },
  error: { color: '_dangerText', flexShrink: 0 },
  warning: { color: '_warningText', flexShrink: 0 },
  failed: { fontSize: '_sm', color: '_dangerText' },
});

/** 处理结果的种类 → 标记的色调 */
const outcomeTones: Record<ProcessOutcomeKind, StatusTone> = {
  approve: 'success',
  reject: 'danger',
  return: 'warning',
  escalate: 'warning',
  terminate: 'danger',
};

/** 处理人的方式：不写 assignee 时跟随泳道 */
type AssigneeMode = 'lane' | ProcessAssignee['type'];

const isVariable = (value: ProcessValue<string>): value is ProcessVariableRef =>
  typeof value === 'object' && value !== null && 'var' in value;

/** 流程设计器：流程图 + 属性面板 + 校验 + 发布 */
export const FlowDesigner = _component(
  ({
    definition = _bindable<ProcessDefinition>({
      key: '',
      name: '',
      version: 0,
      nodes: [],
      edges: [],
    }),
    selected = _bindable<string | null>(null),
    groups = [],
    users = [],
    onPublish,
    title,
    propsDiagram,
    propsPanel,
    propsPublish,
    ...rest
  }: FlowDesignerProps) => {
    const messages = useMessages('workflow', workflowMessages);
    let publishing = _state(false);
    let failed = _state(false);
    // 当前版本的样子（不含版本号）：和它比就知道有没有未发布的修改；载入或发布了新版本时重记
    const snapshot = () => JSON.stringify({ ...definition, version: 0 });
    let baseline = _state('');
    watch(
      () => definition.version,
      () => (baseline = snapshot()),
      { immediate: true },
    );

    /** 改一个节点：写回一份新的定义 */
    function update(id: string, patch: Partial<ProcessNode>) {
      definition = {
        ...definition,
        nodes: definition.nodes.map((node) =>
          node.id === id ? ({ ...node, ...patch } as ProcessNode) : node,
        ),
      };
      failed = false;
    }

    async function publish() {
      if (!onPublish || publishing) return;
      publishing = true;
      failed = false;
      const next = { ...definition, version: definition.version + 1 };
      try {
        await onPublish(next);
        definition = next;
      } catch {
        failed = true;
      } finally {
        publishing = false;
      }
    }

    /** 带标签的一个字段 */
    const field = (label: string, control: VNodeChild, description?: string) => (
      <Field label={label} description={description}>
        {control}
      </Field>
    );

    const assigneeField = (node: ProcessTaskNode) => {
      const mode: AssigneeMode = node.assignee?.type ?? 'lane';
      const tasks = definition.nodes.filter(
        (item): item is ProcessTaskNode => item.type === 'task' && item.id !== node.id,
      );
      const setMode = (next: AssigneeMode) => {
        const assignee: ProcessAssignee | undefined =
          next === 'lane'
            ? undefined
            : next === 'pool'
              ? { type: 'pool', group: groups[0]?.value ?? '' }
              : next === 'user'
                ? { type: 'user', user: users[0]?.value ?? '' }
                : next === 'sameAs'
                  ? { type: 'sameAs', node: tasks[0]?.id ?? '' }
                  : { type: 'initiator' };
        update(node.id, { assignee });
      };
      const { assignee } = node;
      const pick = (
        items: readonly ListboxOption[],
        value: string,
        write: (next: string) => void,
      ) => (
        <Select
          items={items}
          value={value}
          {...{ 'onUpdate:value': (next: string | null) => next != null && write(next) }}
          aria-label={messages.designerAssignees[mode]}
        />
      );
      const target = () => {
        if (assignee?.type === 'pool')
          return isVariable(assignee.group) ? (
            <span {...css.attrs(flowDesignerStyles.hint)}>
              {messages.designerVariable(assignee.group.var)}
            </span>
          ) : (
            pick(groups, assignee.group, (group) =>
              update(node.id, { assignee: { type: 'pool', group } }),
            )
          );
        if (assignee?.type === 'user')
          return isVariable(assignee.user) ? (
            <span {...css.attrs(flowDesignerStyles.hint)}>
              {messages.designerVariable(assignee.user.var)}
            </span>
          ) : (
            pick(users, assignee.user, (user) =>
              update(node.id, { assignee: { type: 'user', user } }),
            )
          );
        if (assignee?.type === 'sameAs')
          return pick(
            tasks.map((task) => ({ value: task.id, label: task.name })),
            assignee.node,
            (other) => update(node.id, { assignee: { type: 'sameAs', node: other } }),
          );
        return null;
      };
      return (
        <>
          {field(
            messages.designerFields.assignee,
            <Select
              items={(Object.keys(messages.designerAssignees) as AssigneeMode[]).map((key) => ({
                value: key,
                label: messages.designerAssignees[key],
              }))}
              value={mode}
              {...{ 'onUpdate:value': (next: AssigneeMode | null) => next && setMode(next) }}
            />,
          )}
          {target()}
        </>
      );
    };

    const dueField = (node: ProcessTaskNode) => {
      const due = node.due;
      if (due && 'var' in due)
        return field(
          messages.designerFields.due,
          <span {...css.attrs(flowDesignerStyles.hint)}>{messages.designerVariable(due.var)}</span>,
        );
      const unit: 'workdays' | 'days' = due && 'days' in due ? 'days' : 'workdays';
      const amount = due ? ('days' in due ? due.days : due.workdays) : null;
      const write = (next: number | null, nextUnit = unit) =>
        update(node.id, {
          due:
            next == null
              ? undefined
              : ((nextUnit === 'days' ? { days: next } : { workdays: next }) as ProcessDue),
        });
      // 单位切换放在 Field 外面：一个 Field 只关联一个控件（标签、说明与 id 给数字输入框）
      return (
        <div {...css.attrs(flowDesignerStyles.row)}>
          <div {...css.attrs(flowDesignerStyles.grow)}>
            {field(
              messages.designerFields.due,
              <NumberField
                value={amount}
                {...{ 'onUpdate:value': (next: number | null) => write(next) }}
                min={1}
                step={1}
              />,
              messages.designerNoDue,
            )}
          </div>
          <ToggleGroup
            value={unit}
            {...{
              'onUpdate:value': (next: 'workdays' | 'days' | null) => next && write(amount, next),
            }}
            required
            size="sm"
            aria-label={messages.designerFields.due}
          >
            <ToggleItem value="workdays">{messages.designerDueUnits.workdays}</ToggleItem>
            <ToggleItem value="days">{messages.designerDueUnits.days}</ToggleItem>
          </ToggleGroup>
        </div>
      );
    };

    const overdueFields = (node: ProcessTaskNode) => (
      <>
        {field(
          messages.designerFields.overdue,
          <Select
            items={node.outcomes.map((outcome) => ({
              value: outcome.key,
              label: messages.designerOverdueAuto(outcome.label),
            }))}
            value={node.overdue?.outcome ?? null}
            {...{
              'onUpdate:value': (outcome: string | null) =>
                update(node.id, {
                  overdue: { ...node.overdue, outcome: outcome ?? undefined },
                }),
            }}
            placeholder={messages.designerOverdueMark}
            clearable
          />,
        )}
        <Switch
          checked={node.overdue?.remind ?? false}
          {...{
            'onUpdate:checked': (remind: boolean) =>
              update(node.id, { overdue: { ...node.overdue, remind } }),
          }}
        >
          {messages.designerFields.remind}
        </Switch>
      </>
    );

    const panel = (node: ProcessNode | undefined) => {
      if (!node) return <p {...css.attrs(flowDesignerStyles.hint)}>{messages.designerPickNode}</p>;
      const lanes = definition.lanes ?? [];
      return (
        <>
          <div {...css.attrs(flowDesignerStyles.panelHead)}>
            <span {...css.attrs(flowDesignerStyles.title)}>{node.name || node.id}</span>
            <Badge size="sm">{messages.designerNodeTypes[node.type]}</Badge>
          </div>
          {field(
            messages.designerFields.name,
            <TextField
              value={node.name}
              {...{ 'onUpdate:value': (name: string) => update(node.id, { name }) }}
            />,
          )}
          {lanes.length > 0 &&
            field(
              messages.designerFields.lane,
              <Select
                items={lanes.map((lane) => ({ value: lane.id, label: lane.name }))}
                value={node.lane ?? null}
                {...{
                  'onUpdate:value': (lane: string | null) =>
                    update(node.id, { lane: lane ?? undefined }),
                }}
              />,
            )}
          {node.type === 'task' && (
            <>
              {assigneeField(node)}
              {dueField(node)}
              {overdueFields(node)}
              {field(
                messages.designerFields.outcomes,
                <div {...css.attrs(flowDesignerStyles.outcomes)}>
                  {node.outcomes.map((outcome) => (
                    <Badge
                      key={outcome.key}
                      size="sm"
                      tone={outcomeTones[outcome.kind ?? 'approve']}
                    >
                      {outcome.label}
                    </Badge>
                  ))}
                </div>,
              )}
            </>
          )}
          {node.type === 'end' && (
            <>
              {field(
                messages.designerFields.result,
                <TextField
                  value={node.result ?? ''}
                  {...{
                    'onUpdate:value': (result: string) =>
                      update(node.id, { result: result || undefined }),
                  }}
                />,
              )}
              <Field description={messages.designerTerminateHint}>
                <Switch
                  checked={node.terminate ?? false}
                  {...{
                    'onUpdate:checked': (terminate: boolean) =>
                      update(node.id, { terminate: terminate || undefined }),
                  }}
                >
                  {messages.designerFields.terminate}
                </Switch>
              </Field>
            </>
          )}
          {field(
            messages.designerFields.description,
            <Textarea
              value={node.description ?? ''}
              {...{
                'onUpdate:value': (description: string) =>
                  update(node.id, { description: description || undefined }),
              }}
              rows={2}
            />,
          )}
        </>
      );
    };

    const problemList = (problems: readonly ProcessProblem[]) => (
      <ul {...css.attrs(flowDesignerStyles.problems)} aria-label={messages.designerProblemList}>
        {problems.map((problem, index) => {
          const target =
            problem.node ?? definition.edges.find((edge) => edge.id === problem.edge)?.from;
          return (
            <li key={`${problem.code}-${index}`}>
              <button
                type="button"
                {...css.attrs(flowDesignerStyles.problem)}
                disabled={!target}
                onClick={() => target && (selected = target)}
              >
                <Icon
                  icon={problem.severity === 'error' ? CircleAlert : TriangleAlert}
                  sx={
                    problem.severity === 'error'
                      ? flowDesignerStyles.error
                      : flowDesignerStyles.warning
                  }
                />
                {problem.message}
              </button>
            </li>
          );
        })}
      </ul>
    );

    return () => {
      const problems = validateProcess(definition);
      const errors = problems.filter((problem) => problem.severity === 'error').length;
      const warnings = problems.length - errors;
      const node = definition.nodes.find((item) => item.id === selected);
      const dirty = snapshot() !== baseline;
      return (
        <div {...mergeAttrs<'div'>({ sx: flowDesignerStyles.root }, rest)}>
          <div {...css.attrs(flowDesignerStyles.toolbar)}>
            {title ?? (
              <span {...css.attrs(flowDesignerStyles.title)}>
                {definition.name} · v{definition.version}
              </span>
            )}
            <div {...css.attrs(flowDesignerStyles.tools)}>
              {dirty && <Badge tone="info">{messages.designerDirty}</Badge>}
              <Badge tone={errors ? 'danger' : warnings ? 'warning' : 'success'} role="status">
                {messages.designerProblems(errors, warnings)}
              </Badge>
              {failed && (
                <span role="alert" {...css.attrs(flowDesignerStyles.failed)}>
                  {messages.designerPublishFailed}
                </span>
              )}
              {onPublish && (
                <Button
                  {...mergePartProps<ButtonProps>(
                    {
                      icon: Upload,
                      title: errors
                        ? messages.designerPublishBlocked
                        : dirty
                          ? undefined
                          : messages.designerClean(definition.version),
                    },
                    propsPublish,
                    {
                      loading: publishing,
                      disabled: errors > 0 || !dirty,
                      onClick: () => void publish(),
                    },
                  )}
                >
                  {messages.designerPublish(definition.version + 1)}
                </Button>
              )}
            </div>
          </div>
          <div {...css.attrs(flowDesignerStyles.body)}>
            <FlowDiagram
              {...mergePartProps<Partial<FlowDiagramProps>>(
                { sx: flowDesignerStyles.diagram },
                propsDiagram,
              )}
              definition={definition}
              problems={problems}
              selectable
              selected={_bind(selected)}
            />
            <section
              {...mergeAttrs<'section'>({ sx: flowDesignerStyles.panel }, propsPanel, {
                'aria-label': messages.designerProperties,
              })}
            >
              {panel(node)}
            </section>
          </div>
          {problems.length > 0 && problemList(problems)}
        </div>
      );
    };
  },
);
