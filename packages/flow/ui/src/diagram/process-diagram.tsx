/**
 * 流程定义 → 画布：模型包的定义换成 Diagram 的节点与连线（形状、大小、状态、退回的线），排版交给 layoutLayers。
 * 设计器、审批单的进度图共用；节点的样子要按业务改时，renderStep 换成自己的。
 *
 *   const { nodes, edges } = processDiagram(definition, { current: ['manager'], done: ['start', 'start-manager'] });
 *   <Diagram nodes={nodes} edges={edges} getNodeLabel={stepLabel} edgeText={(flow) => flow.text} routing="orthogonal">
 *     {renderStep}
 *   </Diagram>
 */
import type { ProcessDefinition, ProcessEdge, ProcessNode } from '@zerodep-dev/flow-ts-model';
import {
  DiagramNode,
  layoutLayers,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramNodeShape,
} from '@zerodep-dev/vue-tsx-pro-ui/diagram';

/** 节点在这次审批里的状态 */
export type StepState = 'done' | 'current' | 'failed' | 'idle';

/** 画布上的一个环节 */
export interface StepItem extends DiagramNodeItem {
  node: ProcessNode;
  state: StepState;
}

/** 画布上的一条线 */
export interface FlowItem extends DiagramEdgeItem {
  /** 线上的字：按钮的名字、分支的条件 */
  text?: string;
}

/** 审批进度：正在处理的节点、走过的节点与连线、出错的节点 */
export interface ProcessProgress {
  current?: readonly string[];
  done?: readonly string[];
  failed?: readonly string[];
}

const STATE_TONES = {
  done: 'success',
  current: 'accent',
  failed: 'danger',
  idle: 'neutral',
} as const;
const STATE_TEXT: Record<StepState, string> = {
  done: '已走过',
  current: '正在处理',
  failed: '出错',
  idle: '',
};
const GATEWAY_MARKS: Partial<Record<string, string>> = {
  exclusive: '×',
  parallel: '+',
  inclusive: '○',
};
const TYPE_TEXT: Partial<Record<string, string>> = {
  service: '自动处理',
  call: '子流程',
  timer: '定时',
  receive: '等外部消息',
  cc: '抄送',
};

/** 节点的形状与大小：开始、结束是圆，网关是菱形，其余是圆角矩形 */
function boxOf(node: ProcessNode): { shape: DiagramNodeShape; width: number; height: number } {
  if (node.type === 'start' || node.type === 'end')
    return { shape: 'circle', width: 52, height: 52 };
  if (GATEWAY_MARKS[node.type]) return { shape: 'diamond', width: 56, height: 56 };
  return { shape: 'rect', width: 136, height: 56 };
}

/** 退回、提级的线往回走：不参与排版，从下面绕回去 */
const isBack = (edge: ProcessEdge) => edge.kind === 'return' || edge.kind === 'escalate';

/** 按钮分出的线对应的按钮 */
function outcomeOf(definition: ProcessDefinition, edge: ProcessEdge) {
  const from = definition.nodes.find((node) => node.id === edge.from);
  return edge.outcome && from?.type === 'task'
    ? from.outcomes.find((outcome) => outcome.key === edge.outcome)
    : undefined;
}

/** 定义换成画布的节点与连线；定义的 layout 里存了位置的节点（设计器拖过的）用它 */
export function processDiagram(
  definition: ProcessDefinition,
  { current = [], done = [], failed = [] }: ProcessProgress = {},
): { nodes: StepItem[]; edges: FlowItem[] } {
  const stateOf = (id: string): StepState =>
    failed.includes(id)
      ? 'failed'
      : current.includes(id)
        ? 'current'
        : done.includes(id)
          ? 'done'
          : 'idle';
  const boxes = definition.nodes.map((node) => ({
    id: node.id,
    ...boxOf(node),
    ...definition.layout?.nodes?.[node.id],
  }));
  const placed = layoutLayers(
    boxes,
    definition.edges.filter((edge) => !isBack(edge)),
    {
      roots: definition.nodes.filter((node) => node.type === 'start').map((node) => node.id),
      columnGap: 208,
      rowGap: 96,
    },
  );
  const centerY = (id: string) => {
    const box = placed.find((node) => node.id === id);
    return box ? box.y + box.height / 2 : 0;
  };
  /** 线怎么走：退回的从下面绕回去；驳回的从上边或下边出去（朝终点那边），右边留给往下走的线 */
  const route = (edge: ProcessEdge): Partial<FlowItem> => {
    if (isBack(edge)) return { tone: 'danger', dashed: true, fromSide: 'bottom', toSide: 'bottom' };
    const toned = done.includes(edge.id) ? { tone: 'success' as const } : {};
    if (outcomeOf(definition, edge)?.kind !== 'reject') return toned;
    return { ...toned, fromSide: centerY(edge.to) < centerY(edge.from) ? 'top' : 'bottom' };
  };
  return {
    nodes: definition.nodes.map((node, index) => ({
      ...placed[index]!,
      shape: boxes[index]!.shape,
      node,
      state: stateOf(node.id),
    })),
    edges: definition.edges.map((edge): FlowItem => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      text: edge.label ?? outcomeOf(definition, edge)?.label,
      ...route(edge),
    })),
  };
}

/** 读屏念的：名称加状态 */
export const stepLabel = (step: StepItem) =>
  [step.node.name, STATE_TEXT[step.state]].filter(Boolean).join('，');

/** 环节的样子：网关画符号，别的写名称与类型；状态用色调，正在处理的加光晕 */
export function renderStep(step: StepItem) {
  const mark = GATEWAY_MARKS[step.node.type];
  return (
    <DiagramNode
      title={mark ?? step.node.name}
      description={mark ? undefined : TYPE_TEXT[step.node.type]}
      tone={STATE_TONES[step.state]}
      active={step.state === 'current'}
    />
  );
}
