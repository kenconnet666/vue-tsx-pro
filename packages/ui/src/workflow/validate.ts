/**
 * 流程定义的校验：设计器保存、发布前检查，流程图上标出有问题的节点与连线。只查结构，不执行流程。
 *
 *   validateProcess(flow)
 *   // → [{ severity: 'error', code: 'outcome-unrouted', node: 'check', message: '“齐全性检查”的处理结果“退回补充”没有出边' }]
 *
 * 错误（error）的流程不能发布：引擎会走不下去；警告（warning）可以发布，但多半是画漏了。
 */
import {
  processGraph,
  type ProcessDefinition,
  type ProcessEdge,
  type ProcessNode,
} from './definition';

/** 问题的严重程度 */
export interface ProcessProblemSeverities {
  /** 错误：流程走不下去，不能发布 */
  error: unknown;
  /** 警告：能走，但多半是画漏了 */
  warning: unknown;
}

/** 校验发现的一个问题 */
export interface ProcessProblem {
  /** 严重程度 */
  severity: keyof ProcessProblemSeverities;
  /** 问题的代号（'outcome-unrouted'），测试与界面按它区分 */
  code: string;
  /** 说明 */
  message: string;
  /** 出问题的节点 */
  node?: string;
  /** 出问题的连线 */
  edge?: string;
}

const nameOf = (node: ProcessNode) => `“${node.name || node.id}”`;

/** 找出重复的标识 */
function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
}

/** 从 roots 出发沿 next 能到的节点 */
function reachable(roots: readonly string[], next: (id: string) => readonly string[]): Set<string> {
  const visited = new Set<string>();
  const queue = [...roots];
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    queue.push(...next(id));
  }
  return visited;
}

/** 人工节点：处理结果、出边、处理人 */
function checkTask(
  definition: ProcessDefinition,
  node: Extract<ProcessNode, { type: 'task' }>,
  out: readonly ProcessEdge[],
  report: (problem: ProcessProblem) => void,
) {
  const graph = processGraph(definition);
  if (node.outcomes.length === 0)
    report({
      severity: 'error',
      code: 'task-no-outcome',
      node: node.id,
      message: `${nameOf(node)}没有处理结果（按钮）`,
    });
  for (const key of duplicates(node.outcomes.map((outcome) => outcome.key)))
    report({
      severity: 'error',
      code: 'outcome-duplicate',
      node: node.id,
      message: `${nameOf(node)}的处理结果“${key}”重复`,
    });
  for (const outcome of node.outcomes) {
    if (!out.some((edge) => edge.outcome == null || edge.outcome === outcome.key))
      report({
        severity: 'error',
        code: 'outcome-unrouted',
        node: node.id,
        message: `${nameOf(node)}的处理结果“${outcome.label}”没有出边`,
      });
  }
  for (const edge of out) {
    if (edge.outcome != null && !node.outcomes.some((outcome) => outcome.key === edge.outcome))
      report({
        severity: 'error',
        code: 'edge-unknown-outcome',
        edge: edge.id,
        message: `连线 ${edge.id} 指向${nameOf(node)}没有的处理结果“${edge.outcome}”`,
      });
  }
  const assignee = node.assignee;
  // 会签、或签的处理人是参与人列表，不需要 assignee
  if (assignee == null && node.multi == null && !graph.lane(node.lane)?.group)
    report({
      severity: 'error',
      code: 'task-no-assignee',
      node: node.id,
      message: `${nameOf(node)}没有处理人：写 assignee，或放进有岗位收件箱的泳道`,
    });
  if (assignee?.type === 'sameAs' && graph.node(assignee.node)?.type !== 'task')
    report({
      severity: 'error',
      code: 'assignee-unknown-node',
      node: node.id,
      message: `${nameOf(node)}的处理人取自不存在的人工节点“${assignee.node}”`,
    });
  if (node.overdue?.outcome && !node.outcomes.some((item) => item.key === node.overdue!.outcome))
    report({
      severity: 'error',
      code: 'overdue-unknown-outcome',
      node: node.id,
      message: `${nameOf(node)}超时自动完成的处理结果“${node.overdue.outcome}”不存在`,
    });
}

/** 网关：排他网关的条件与默认边，并行网关是分叉或汇合 */
function checkGateway(
  node: Extract<ProcessNode, { type: 'exclusive' | 'parallel' }>,
  out: readonly ProcessEdge[],
  into: readonly ProcessEdge[],
  report: (problem: ProcessProblem) => void,
) {
  if (node.type === 'exclusive') {
    if (out.filter((edge) => edge.default).length > 1)
      report({
        severity: 'error',
        code: 'gateway-multiple-default',
        node: node.id,
        message: `${nameOf(node)}有不止一条默认出边`,
      });
    if (out.length > 1)
      for (const edge of out)
        if (!edge.default && edge.when == null)
          report({
            severity: 'warning',
            code: 'gateway-edge-unconditional',
            edge: edge.id,
            message: `排他网关${nameOf(node)}的出边 ${edge.id} 没有条件，后面的出边永远走不到`,
          });
    return;
  }
  if (out.length < 2 && into.length < 2)
    report({
      severity: 'warning',
      code: 'parallel-useless',
      node: node.id,
      message: `并行网关${nameOf(node)}既不分叉也不汇合`,
    });
  for (const edge of out)
    if (edge.when != null || edge.default)
      report({
        severity: 'warning',
        code: 'parallel-edge-condition',
        edge: edge.id,
        message: `并行网关${nameOf(node)}的出边 ${edge.id} 都会走，条件与默认不起作用`,
      });
}

/** 校验一个流程定义，返回发现的问题（没有问题时是空数组） */
export function validateProcess(definition: ProcessDefinition): ProcessProblem[] {
  const problems: ProcessProblem[] = [];
  const report = (problem: ProcessProblem) => problems.push(problem);
  const graph = processGraph(definition);

  for (const id of duplicates(definition.nodes.map((node) => node.id)))
    report({ severity: 'error', code: 'node-duplicate', node: id, message: `节点标识“${id}”重复` });
  for (const id of duplicates(definition.edges.map((edge) => edge.id)))
    report({ severity: 'error', code: 'edge-duplicate', edge: id, message: `连线标识“${id}”重复` });
  for (const id of duplicates((definition.lanes ?? []).map((lane) => lane.id)))
    report({ severity: 'error', code: 'lane-duplicate', message: `泳道标识“${id}”重复` });

  for (const edge of definition.edges) {
    for (const end of [edge.from, edge.to])
      if (!graph.node(end))
        report({
          severity: 'error',
          code: 'edge-unknown-node',
          edge: edge.id,
          message: `连线 ${edge.id} 连到不存在的节点“${end}”`,
        });
    if (edge.outcome != null && graph.node(edge.from)?.type !== 'task')
      report({
        severity: 'error',
        code: 'edge-outcome-not-task',
        edge: edge.id,
        message: `连线 ${edge.id} 写了处理结果，但起点不是人工节点`,
      });
    if (edge.default && graph.node(edge.from)?.type !== 'exclusive')
      report({
        severity: 'warning',
        code: 'edge-default-not-exclusive',
        edge: edge.id,
        message: `连线 ${edge.id} 是默认出边，但起点不是排他网关`,
      });
  }

  const starts = definition.nodes.filter((node) => node.type === 'start');
  if (starts.length !== 1)
    report({
      severity: 'error',
      code: starts.length ? 'start-multiple' : 'start-missing',
      message: starts.length ? '流程只能有一个开始节点' : '流程没有开始节点',
    });
  if (!definition.nodes.some((node) => node.type === 'end'))
    report({ severity: 'error', code: 'end-missing', message: '流程没有结束节点' });

  for (const node of definition.nodes) {
    const out = graph.outgoing(node.id);
    const into = graph.incoming(node.id);
    if (node.lane != null && !graph.lane(node.lane))
      report({
        severity: 'error',
        code: 'lane-unknown',
        node: node.id,
        message: `${nameOf(node)}在不存在的泳道“${node.lane}”里`,
      });
    if (node.type === 'start' && into.length)
      report({
        severity: 'error',
        code: 'start-incoming',
        node: node.id,
        message: `开始节点${nameOf(node)}不能有入边：要退回给发起人，画一个由发起人处理的人工节点`,
      });
    if (node.type === 'end' && out.length)
      report({
        severity: 'error',
        code: 'end-outgoing',
        node: node.id,
        message: `结束节点${nameOf(node)}不能有出边`,
      });
    if (node.type !== 'end' && out.length === 0)
      report({
        severity: 'error',
        code: 'node-no-outgoing',
        node: node.id,
        message: `${nameOf(node)}没有出边，流程到这里走不下去`,
      });
    if (node.type === 'task') checkTask(definition, node, out, report);
    if (node.type === 'exclusive' || node.type === 'parallel')
      checkGateway(node, out, into, report);
  }

  // 到不了的节点、到不了结束的节点：只在开始节点唯一时检查（否则上面已经报了）
  if (starts.length === 1) {
    const forward = reachable([starts[0]!.id], (id) => graph.outgoing(id).map((edge) => edge.to));
    const ends = definition.nodes.filter((node) => node.type === 'end').map((node) => node.id);
    const backward = reachable(ends, (id) => graph.incoming(id).map((edge) => edge.from));
    for (const node of definition.nodes) {
      if (!forward.has(node.id))
        report({
          severity: 'warning',
          code: 'node-unreachable',
          node: node.id,
          message: `${nameOf(node)}从开始节点走不到`,
        });
      else if (!backward.has(node.id))
        report({
          severity: 'error',
          code: 'node-dead-end',
          node: node.id,
          message: `从${nameOf(node)}走不到任何结束节点`,
        });
    }
  }
  return problems;
}
