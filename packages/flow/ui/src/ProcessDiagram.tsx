/**
 * 流程图（ROADMAP 14.8）：按定义画节点与连线，标出正在处理的与走过的。布局用模型包的 autoLayout（定义里写了坐标的用坐标）；
 * 开始、结束画圆，网关画菱形，其余画圆角矩形；退回、提级的连线画成回头的虚线。点节点报告节点标识（设计器选中、详情页看记录）。
 *
 *   <ProcessDiagram definition={purchase} current={['review']} done={['start']} onSelect={(id) => (selected = id)} />
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
// 样式用的主题 token 在这个模块里登记（组件库的 tokens 是有副作用的模块）
import '@zerodep-dev/vue-tsx-pro-ui/tokens';
import { useId } from 'vue';
import {
  autoLayout,
  type NodePosition,
  type ProcessDefinition,
  type ProcessEdge,
  type ProcessNode,
} from '@zerodep-dev/flow-ts-model';

/** ProcessDiagram 的属性 */
export interface ProcessDiagramProps {
  definition: ProcessDefinition;
  /** 正在处理的节点 */
  current?: readonly string[];
  /** 走过的节点与连线（实例的流转记录里的） */
  done?: readonly string[];
  /** 选中的节点（设计器） */
  selected?: string | null;
  /** 点了节点 */
  onSelect?: (node: string) => void;
  /** 图的名称（读屏） */
  'aria-label'?: string;
}

/** ProcessDiagram 的样式 */
export const processDiagramStyles = css.create({
  root: { display: 'block', maxWidth: '100%', height: 'auto', fontSize: '12px' },
  edge: { fill: 'none', stroke: '_border', strokeWidth: 1.5 },
  edgeBack: { strokeDasharray: '5 4' },
  edgeDone: { stroke: '_success' },
  edgeLabel: { fill: '_textMuted', fontSize: '11px' },
  node: { cursor: 'pointer', outline: 'none' },
  shape: { fill: '_surface', stroke: '_border', strokeWidth: 1.5 },
  shapeDone: { stroke: '_success', fill: '_successSoft' },
  shapeCurrent: { stroke: '_accent', fill: '_accentSoft', strokeWidth: 2.5 },
  shapeSelected: { stroke: '_accent', strokeWidth: 2.5, strokeDasharray: '4 3' },
  label: {
    fill: '_text',
    textAnchor: 'middle',
    dominantBaseline: 'central',
    pointerEvents: 'none',
  },
  arrow: { fill: '_border' },
});

const TASK_WIDTH = 124;
const TASK_HEIGHT = 44;
const CIRCLE = 18;
const DIAMOND = 22;

/** 节点的半宽：连线从它的右边出、左边进 */
const halfWidth = (node: ProcessNode) =>
  node.type === 'start' || node.type === 'end'
    ? CIRCLE
    : node.type === 'exclusive' || node.type === 'parallel' || node.type === 'inclusive'
      ? DIAMOND
      : TASK_WIDTH / 2;

/** 网关里画的符号 */
const GATEWAY_MARK: Record<string, string> = { exclusive: '×', parallel: '+', inclusive: '○' };

/** 名字太长时截断（画在固定宽度的框里） */
const clip = (text: string, max = 9) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** 流程图 */
export const ProcessDiagram = _component(
  ({
    definition,
    current = [],
    done = [],
    selected = null,
    onSelect,
    ...rest
  }: ProcessDiagramProps) => {
    // 箭头的 id 用 useId：服务端渲染与水合时一致
    const markerId = `flow-arrow-${useId()}`;

    /** 一条连线的路径：前进的从右边到左边走折线，回头的从下面绕回去 */
    function edgePath(edge: ProcessEdge, from: NodePosition, to: NodePosition): string {
      const fromNode = definition.nodes.find((n) => n.id === edge.from)!;
      const toNode = definition.nodes.find((n) => n.id === edge.to)!;
      const back = to.x <= from.x;
      if (back) {
        const below = Math.max(from.y, to.y) + TASK_HEIGHT + 12;
        return `M ${from.x} ${from.y + TASK_HEIGHT / 2} V ${below} H ${to.x} V ${to.y + TASK_HEIGHT / 2}`;
      }
      const x1 = from.x + halfWidth(fromNode);
      const x2 = to.x - halfWidth(toNode);
      const middle = (x1 + x2) / 2;
      return from.y === to.y
        ? `M ${x1} ${from.y} H ${x2}`
        : `M ${x1} ${from.y} H ${middle} V ${to.y} H ${x2}`;
    }

    function shape(node: ProcessNode, at: NodePosition, sx: unknown[]) {
      const attrs = css.attrs(processDiagramStyles.shape, ...(sx as never[]));
      if (node.type === 'start' || node.type === 'end') {
        return (
          <circle
            cx={at.x}
            cy={at.y}
            r={CIRCLE}
            {...attrs}
            stroke-width={node.type === 'end' ? 3 : undefined}
          />
        );
      }
      if (node.type === 'exclusive' || node.type === 'parallel' || node.type === 'inclusive') {
        const d = DIAMOND;
        return (
          <polygon
            points={`${at.x},${at.y - d} ${at.x + d},${at.y} ${at.x},${at.y + d} ${at.x - d},${at.y}`}
            {...attrs}
          />
        );
      }
      return (
        <rect
          x={at.x - TASK_WIDTH / 2}
          y={at.y - TASK_HEIGHT / 2}
          width={TASK_WIDTH}
          height={TASK_HEIGHT}
          rx={8}
          {...attrs}
        />
      );
    }

    return () => {
      const layout = autoLayout(definition);
      const doneSet = new Set(done);
      const currentSet = new Set(current);
      return (
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          role="img"
          aria-label={rest['aria-label'] ?? definition.name}
          {...css.attrs(processDiagramStyles.root)}
        >
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" {...css.attrs(processDiagramStyles.arrow)} />
            </marker>
          </defs>
          {definition.edges.map((edge) => {
            const from = layout.nodes.get(edge.from);
            const to = layout.nodes.get(edge.to);
            if (!from || !to) return null;
            const back = edge.kind === 'return' || edge.kind === 'escalate' || to.x <= from.x;
            const label = edge.label ?? edge.outcome;
            return (
              <g key={edge.id} data-edge={edge.id}>
                <path
                  d={edgePath(edge, from, to)}
                  marker-end={`url(#${markerId})`}
                  {...css.attrs(
                    processDiagramStyles.edge,
                    back && processDiagramStyles.edgeBack,
                    doneSet.has(edge.id) && processDiagramStyles.edgeDone,
                  )}
                />
                {label && !back && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={Math.min(from.y, to.y) - 8}
                    {...css.attrs(processDiagramStyles.edgeLabel)}
                  >
                    {clip(label, 8)}
                  </text>
                )}
              </g>
            );
          })}
          {definition.nodes.map((node) => {
            const at = layout.nodes.get(node.id)!;
            const state = currentSet.has(node.id)
              ? 'current'
              : doneSet.has(node.id)
                ? 'done'
                : 'idle';
            const select = () => onSelect?.(node.id);
            return (
              <g
                key={node.id}
                data-node={node.id}
                data-state={state}
                data-selected={selected === node.id || undefined}
                tabindex={onSelect ? 0 : undefined}
                role={onSelect ? 'button' : undefined}
                aria-label={`${node.name}${state === 'current' ? '（正在处理）' : state === 'done' ? '（已走过）' : ''}`}
                onClick={select}
                onKeydown={(event: KeyboardEvent) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    select();
                  }
                }}
                {...css.attrs(processDiagramStyles.node)}
              >
                {shape(node, at, [
                  state === 'done' && processDiagramStyles.shapeDone,
                  state === 'current' && processDiagramStyles.shapeCurrent,
                  selected === node.id && processDiagramStyles.shapeSelected,
                ])}
                {GATEWAY_MARK[node.type] ? (
                  <text x={at.x} y={at.y} {...css.attrs(processDiagramStyles.label)}>
                    {GATEWAY_MARK[node.type]}
                  </text>
                ) : (
                  node.type !== 'start' &&
                  node.type !== 'end' && (
                    <text x={at.x} y={at.y} {...css.attrs(processDiagramStyles.label)}>
                      {clip(node.name)}
                    </text>
                  )
                )}
                <title>{node.name}</title>
              </g>
            );
          })}
        </svg>
      );
    };
  },
);
