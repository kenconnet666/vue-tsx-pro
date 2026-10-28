/**
 * 设计器的编辑操作（ROADMAP 14.8a：像低代码一样简单）：从模板起步，常见结构一步加上，问题用业务的话说清楚。
 * 都是纯函数：拿一份定义、返回新的一份，不改原来的；设计器与测试共用。
 *
 *   let draft = templates.leave();
 *   draft = addApprovalStep(draft, 'manager', { name: '总监审批', assignees: [{ role: '3' }] });
 *   draft = addAmountBranch(draft, 'manager', { field: 'amount', over: 10000, step: { name: '总经理审批', assignees: [{ user: '1004' }] } });
 *   draft = removeStep(draft, 'hr');
 *   problemMessage(problem);   // → '“财务复核”没有处理人'
 */
import type {
  AssigneeSource,
  MultiInstance,
  ProcessDefinition,
  ProcessEdge,
  TaskNode,
} from './definition.ts';
import type { Problem } from './validate.ts';

/** 加一个审批环节时给的 */
export interface StepInput {
  readonly name: string;
  readonly assignees: readonly AssigneeSource[];
  /** 会签：几个人一起审 */
  readonly multi?: MultiInstance;
}

/** 新的、流程里没用过的标识 */
export function uniqueId(definition: ProcessDefinition, base: string): string {
  const used = new Set([
    ...definition.nodes.map((n) => n.id),
    ...definition.edges.map((e) => e.id),
  ]);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}${n}`)) return `${base}${n}`;
}

/** 审批环节：同意往下走，不同意（要写意见）到“不通过”的结束 */
function approvalTask(id: string, input: StepInput): TaskNode {
  return {
    id,
    type: 'task',
    name: input.name,
    assignees: input.assignees,
    ...(input.multi ? { multi: input.multi } : {}),
    outcomes: [
      { key: 'approve', label: '同意' },
      { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
    ],
  };
}

/** 不通过的结束节点：已有就用它，没有就加一个 */
function ensureRejectedEnd(definition: ProcessDefinition): {
  definition: ProcessDefinition;
  id: string;
} {
  const existing = definition.nodes.find((n) => n.type === 'end' && n.result === 'rejected');
  if (existing) return { definition, id: existing.id };
  const id = uniqueId(definition, 'rejected');
  return {
    definition: {
      ...definition,
      nodes: [...definition.nodes, { id, type: 'end', name: '不通过', result: 'rejected' }],
    },
    id,
  };
}

/** 节点往下走的连线（退回、提级不算）；人工节点只算“通过”的 */
function forwardOut(definition: ProcessDefinition, node: string): ProcessEdge[] {
  const task = definition.nodes.find((n) => n.id === node);
  const approve =
    task?.type === 'task'
      ? task.outcomes.find((o) => (o.kind ?? 'approve') === 'approve')?.key
      : undefined;
  return definition.edges.filter(
    (e) =>
      e.from === node &&
      e.kind !== 'return' &&
      e.kind !== 'escalate' &&
      (approve === undefined || e.outcome === undefined || e.outcome === approve),
  );
}

/** 在 after 之后加一个审批环节：after 原来往下走的连线改连到新环节，新环节同意后接着原来的路 */
export function addApprovalStep(
  definition: ProcessDefinition,
  after: string,
  input: StepInput,
): ProcessDefinition {
  const id = uniqueId(definition, 'step');
  const outgoing = forwardOut(definition, after);
  const { definition: withEnd, id: rejected } = ensureRejectedEnd(definition);
  const moved = new Set(outgoing.map((e) => e.id));
  const edges = withEnd.edges.map((e) => (moved.has(e.id) ? { ...e, to: id } : e));
  const continued = outgoing.map((e, index) => ({
    id: uniqueId({ ...withEnd, edges }, `${id}-next${index === 0 ? '' : index + 1}`),
    from: id,
    to: e.to,
    outcome: 'approve',
  }));
  return {
    ...withEnd,
    nodes: [...withEnd.nodes, approvalTask(id, input)],
    edges: [
      ...edges,
      ...continued,
      {
        id: uniqueId({ ...withEnd, edges }, `${id}-reject`),
        from: id,
        to: rejected,
        outcome: 'reject',
      },
    ],
  };
}

/** 在 after 之后按金额（或别的数字）分支：超过 over 的多走一个审批环节，其余照原来的路 */
export function addAmountBranch(
  definition: ProcessDefinition,
  after: string,
  input: { readonly field: string; readonly over: number; readonly step: StepInput },
): ProcessDefinition {
  const gateway = uniqueId(definition, 'branch');
  const outgoing = forwardOut(definition, after);
  if (outgoing.length !== 1) {
    throw new Error(`“${after}”往下走的路不止一条，先选其中一条路上的环节再加分支`);
  }
  const next = outgoing[0]!;
  let draft: ProcessDefinition = {
    ...definition,
    nodes: [
      ...definition.nodes,
      { id: gateway, type: 'exclusive', name: `${input.field} 超过 ${input.over}？` },
    ],
    edges: [
      ...definition.edges.map((e) => (e.id === next.id ? { ...e, to: gateway } : e)),
      {
        id: uniqueId(definition, `${gateway}-small`),
        from: gateway,
        to: next.to,
        default: true,
        label: '其余',
      },
    ],
  };
  // 超过的那条：先连到原来的下一步，再在它前面插审批环节
  const large = uniqueId(draft, `${gateway}-large`);
  draft = {
    ...draft,
    edges: [
      ...draft.edges,
      {
        id: large,
        from: gateway,
        to: next.to,
        when: { field: input.field, op: 'gt', value: input.over },
        label: `超过 ${input.over}`,
      },
    ],
  };
  const step = uniqueId(draft, 'step');
  const { definition: withEnd, id: rejected } = ensureRejectedEnd(draft);
  return {
    ...withEnd,
    nodes: [...withEnd.nodes, approvalTask(step, input.step)],
    edges: [
      ...withEnd.edges.map((e) => (e.id === large ? { ...e, to: step } : e)),
      { id: uniqueId(withEnd, `${step}-next`), from: step, to: next.to, outcome: 'approve' },
      { id: uniqueId(withEnd, `${step}-reject`), from: step, to: rejected, outcome: 'reject' },
    ],
  };
}

/** 删掉一个环节：连到它的路改连到它往下走的那一步，它自己的连线一起删掉 */
export function removeStep(definition: ProcessDefinition, id: string): ProcessDefinition {
  const node = definition.nodes.find((n) => n.id === id);
  if (!node || node.type === 'start' || node.type === 'end') {
    throw new Error('开始与结束不能删');
  }
  const next = forwardOut(definition, id)[0]?.to;
  const edges = definition.edges
    .filter((e) => e.from !== id && !(e.to === id && next === undefined))
    .map((e) => (e.to === id ? { ...e, to: next! } : e));
  return { ...definition, nodes: definition.nodes.filter((n) => n.id !== id), edges };
}

/** 问题的业务说法；没有专门说法的给出代号 */
export function problemMessage(problem: Problem, definition?: ProcessDefinition): string {
  const name = (id: string | undefined) =>
    id ? `“${definition?.nodes.find((n) => n.id === id)?.name ?? id}”` : '这一步';
  const node = name(problem.node);
  const params = problem.params ?? {};
  switch (problem.code) {
    case 'start-missing':
      return '流程还没有开始节点';
    case 'end-missing':
      return '流程还没有结束节点：走到最后要有个结果';
    case 'assignee-missing':
      return `${node}没有处理人：选发起人、角色或指定的人`;
    case 'task-no-outcome':
      return `${node}没有处理按钮：至少要有“同意”`;
    case 'outcome-unrouted':
      return `${node}的“${String(params['outcome'] ?? '')}”按钮按下后不知道去哪：给它连一条线`;
    case 'node-unreachable':
      return `${node}走不到：从开始没有路通到它`;
    case 'node-dead-end':
    case 'node-no-outgoing':
      return `${node}走到这里就停了：给它连到下一步或结束`;
    case 'gateway-unpaired':
      return `${node}分出去的几条路没有汇到一起`;
    case 'condition-incomplete':
      return `${node}后面的条件没写完整`;
    case 'edge-unknown-node':
      return '有一条线连到了不存在的环节';
    case 'outcome-duplicate':
      return `${node}有两个一样的按钮`;
    case 'multi-no-fallback':
      return `${node}按比例会签时要写“都办完还没达到比例按哪个结果”`;
    default:
      return `${node}：${problem.code}`;
  }
}

/** 模板：一键生成再改 */
export const templates = {
  /** 请假：经理审批，超过 3 天再给人事 */
  leave: (): ProcessDefinition =>
    addAmountBranch(
      {
        key: 'leave',
        name: '请假',
        title: '请假：{reason}',
        variables: [
          { name: 'days', type: 'number', label: '天数' },
          { name: 'reason', type: 'text', label: '事由' },
        ],
        nodes: [
          { id: 'start', type: 'start', name: '提交' },
          approvalTask('manager', { name: '经理审批', assignees: [{ role: '1', name: '经理' }] }),
          { id: 'approved', type: 'end', name: '通过', result: 'approved' },
          { id: 'rejected', type: 'end', name: '不通过', result: 'rejected' },
        ],
        edges: [
          { id: 'submit', from: 'start', to: 'manager' },
          { id: 'manager-next', from: 'manager', to: 'approved', outcome: 'approve' },
          { id: 'manager-reject', from: 'manager', to: 'rejected', outcome: 'reject' },
        ],
      },
      'manager',
      {
        field: 'days',
        over: 3,
        step: { name: '人事备案', assignees: [{ role: '2', name: '人事' }] },
      },
    ),
  /** 采购：部门经理审批，金额超过一万再给总经理 */
  purchase: (): ProcessDefinition =>
    addAmountBranch(
      {
        key: 'purchase',
        name: '采购申请',
        title: '采购：{title}',
        variables: [
          { name: 'title', type: 'text', label: '采购什么' },
          { name: 'amount', type: 'number', label: '金额' },
        ],
        nodes: [
          { id: 'start', type: 'start', name: '提交' },
          approvalTask('manager', {
            name: '部门经理审批',
            assignees: [{ role: '1', name: '经理' }],
          }),
          { id: 'approved', type: 'end', name: '通过', result: 'approved' },
          { id: 'rejected', type: 'end', name: '不通过', result: 'rejected' },
        ],
        edges: [
          { id: 'submit', from: 'start', to: 'manager' },
          { id: 'manager-next', from: 'manager', to: 'approved', outcome: 'approve' },
          { id: 'manager-reject', from: 'manager', to: 'rejected', outcome: 'reject' },
        ],
      },
      'manager',
      {
        field: 'amount',
        over: 10000,
        step: { name: '总经理审批', assignees: [{ role: '4', name: '总经理' }] },
      },
    ),
  /** 报销：财务复核（财务收件箱里认领） */
  expense: (): ProcessDefinition => ({
    key: 'expense',
    name: '报销',
    title: '报销：{title}',
    variables: [
      { name: 'title', type: 'text', label: '事由' },
      { name: 'amount', type: 'number', label: '金额' },
    ],
    nodes: [
      { id: 'start', type: 'start', name: '提交' },
      approvalTask('finance', { name: '财务复核', assignees: [{ role: '2', name: '财务' }] }),
      { id: 'approved', type: 'end', name: '通过', result: 'approved' },
      { id: 'rejected', type: 'end', name: '不通过', result: 'rejected' },
    ],
    edges: [
      { id: 'submit', from: 'start', to: 'finance' },
      { id: 'finance-next', from: 'finance', to: 'approved', outcome: 'approve' },
      { id: 'finance-reject', from: 'finance', to: 'rejected', outcome: 'reject' },
    ],
  }),
} as const;
