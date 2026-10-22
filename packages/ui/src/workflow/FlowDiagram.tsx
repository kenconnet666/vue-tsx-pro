/**
 * 流程图：按流程定义画泳道流程图（岗位是泳道，节点从左往右），叠上运行时的进度（走过的节点与连线、正在处理的节点），
 * 或设计器的校验问题。人工节点是矩形、开始与结束是胶囊、网关是菱形，线下动作画虚线框；退回的连线红色虚线、
 * 提级的连线黄色虚线，走过的连线用强调色。节点可以选中（selectable），选中的节点 selected 可以双向绑定。
 *
 *   <FlowDiagram definition={flow} progress={processProgress(instance, events)} aria-label="建议的流程" />
 *   <FlowDiagram definition={flow} problems={validateProcess(flow)} selectable selected={_bind(node)} />
 *
 * 排布见 layoutProcess；连线画在 SVG 里，节点是叠在上面的 HTML（文字换行、焦点、主题都照常）。
 * 部件：Root（滚动容器）、Canvas、Lane（泳道名称）、Node（每个节点）、EdgeLabel（连线的文字）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { useResizeObserver } from '../utils/dom/resize';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { interactionTransitions } from '../utils/style/transitions';
import { processOutcome, type ProcessDefinition, type ProcessNode } from './definition';
import { layoutProcess, type FlowLayoutEdge, type FlowLayoutOptions } from './layout';
import type { ProcessNodeStates, ProcessProgress } from './runtime';
import type { ProcessProblem } from './validate';
import { useMessages } from '../config/lang/messages';
import { workflowMessages } from './messages';

/** 流程图的尺寸档位 */
export interface FlowDiagramSizes {
  /** 紧凑：收件箱的预览、卡片里 */
  sm: unknown;
  /** 默认 */
  md: unknown;
}

/** 节点在图上的状态：进度的三种，加上校验出问题的 */
export type FlowNodeState = keyof ProcessNodeStates | 'invalid';

/** 未声明的属性落到滚动容器（ScrollArea）上 */
export interface FlowDiagramProps extends Partial<ScrollAreaProps> {
  /** 流程定义 */
  definition: ProcessDefinition;
  /** 运行时的进度：走过的节点与连线、正在处理的节点（processProgress 算出） */
  progress?: ProcessProgress;
  /** 校验的问题：有错误或警告的节点、连线标出来 */
  problems?: readonly ProcessProblem[];
  /** 节点可以点选（设计器、点节点看那一步的记录） */
  selectable?: boolean;
  /** 选中的节点：父级可以写 selected={_bind(x)} */
  selected?: string | null;
  /** 尺寸，默认 md */
  size?: keyof FlowDiagramSizes;
  /** 容器放不下时按比例缩小到容器的宽（不放大）；默认 false：保持原大、横向滚动 */
  fit?: boolean;
  /** 节点名称下面的一行小字（处理人、时限、完成日期） */
  nodeDetail?: (node: ProcessNode) => VNodeChild;
  /** 画布（节点与连线的定位容器）的部件属性 */
  propsCanvas?: PartProps<'div'>;
  /** 泳道名称的部件属性 */
  propsLane?: PartProps<'div'>;
  /** 每个节点（可选中时是 button，否则是 div）的部件属性，可以按节点计算 */
  propsNode?: PartProps<'div'> | ((node: ProcessNode) => PartProps<'div'>);
  /** 连线文字的部件属性 */
  propsEdgeLabel?: PartProps<'span'>;
}

const sizes: Record<keyof FlowDiagramSizes, FlowLayoutOptions> = {
  sm: {
    nodeWidth: 104,
    nodeHeight: 40,
    columnGap: 40,
    rowGap: 12,
    lanePadding: 20,
    laneHeaderWidth: 76,
  },
  md: {},
};

/** FlowDiagram 的样式：canvas、lane、node 与各状态、edge 与各种类、edgeLabel */
export const flowDiagramStyles = stylex.create({
  root: { borderWidth: '_xs', borderStyle: 'solid', borderColor: '_border', borderRadius: '_md' },
  canvas: { position: 'relative', fontSize: '_sm', color: '_text' },
  canvasSm: { fontSize: '_xs' },
  svg: { position: 'absolute', insetBlockStart: 0, insetInlineStart: 0, overflow: 'visible' },
  laneBand: { fill: 'transparent' },
  laneBandAlt: { fill: '_surfaceMuted' },
  laneLine: { stroke: '_borderMuted', strokeWidth: 1 },
  lane: {
    position: 'absolute',
    insetInlineStart: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: '_sm',
    textAlign: 'center',
    fontWeight: '_semibold',
    color: '_textMuted',
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_borderMuted',
    boxSizing: 'border-box',
  },
  // 节点：绝对定位，内容居中；可选中时是 button，去掉按钮的默认外观
  node: {
    position: 'absolute',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    paddingInline: '_xs',
    margin: 0,
    font: 'inherit',
    lineHeight: '_tight',
    textAlign: 'center',
    color: '_text',
    backgroundColor: '_surface',
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderColor: '_borderStrong',
    borderRadius: '_md',
    overflow: 'hidden',
  },
  nodeButton: {
    cursor: 'pointer',
    backgroundColor: { default: '_surface', ':hover': '_fillHover' },
  },
  terminal: { borderRadius: '_full' },
  // 网关：菱形画在节点里的 SVG 上，节点本身透明
  gateway: { borderWidth: 0, backgroundColor: 'transparent', overflow: 'visible' },
  gatewayShape: { position: 'absolute', inset: 0, overflow: 'visible' },
  gatewayLabel: { position: 'relative', fontSize: '0.85em', paddingInline: '18%' },
  offline: { borderStyle: 'dashed' },
  name: { fontWeight: '_medium', overflowWrap: 'anywhere' },
  detail: { fontSize: '0.85em', color: '_textMuted' },
  // 进度
  done: { borderColor: '_successBorder', color: '_text' },
  // 正在处理：强调色的边框与底色，外面一圈光晕（不用 outline，留给焦点环与选中）
  active: {
    borderColor: '_accent',
    backgroundColor: '_accentSoft',
    boxShadow: '0 0 0 3px _colors.accentBorder',
  },
  pending: { color: '_textMuted' },
  invalid: { borderColor: '_danger', color: '_dangerText' },
  selected: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: '_accent',
    outlineOffset: '2px',
  },
  // 菱形的描边与底色跟着状态走
  shape: { fill: '_surface', stroke: '_borderStrong', strokeWidth: 2 },
  shapeDone: { stroke: '_successBorder' },
  shapeActive: { fill: '_accentSoft', stroke: '_accent' },
  shapeInvalid: { stroke: '_danger' },
  // 连线
  edge: { fill: 'none', stroke: '_borderStrong', strokeWidth: 1.5 },
  edgeTraversed: { stroke: '_accent', strokeWidth: 2 },
  edgeReturn: { stroke: '_dangerText', strokeDasharray: '6 4' },
  edgeEscalate: { stroke: '_warningText', strokeDasharray: '6 4' },
  edgeInvalid: { stroke: '_danger', strokeWidth: 2 },
  edgeDim: { opacity: 0.45 },
  arrow: { fill: '_borderStrong' },
  arrowTraversed: { fill: '_accent' },
  arrowReturn: { fill: '_dangerText' },
  arrowEscalate: { fill: '_warningText' },
  arrowInvalid: { fill: '_danger' },
  edgeLabel: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    paddingInline: '4px',
    borderRadius: '_sm',
    fontSize: '0.8em',
    lineHeight: '_tight',
    whiteSpace: 'nowrap',
    color: '_textMuted',
    backgroundColor: '_surface',
    pointerEvents: 'none',
  },
  edgeLabelReturn: { color: '_dangerText' },
  edgeLabelEscalate: { color: '_warningText' },
});

/** 连线的种类（决定颜色与箭头） */
type EdgeTone = 'plain' | 'traversed' | 'return' | 'escalate' | 'invalid';

const edgeStyles: Record<EdgeTone, readonly [StyleXStyles, StyleXStyles]> = {
  plain: [null, flowDiagramStyles.arrow],
  traversed: [flowDiagramStyles.edgeTraversed, flowDiagramStyles.arrowTraversed],
  return: [flowDiagramStyles.edgeReturn, flowDiagramStyles.arrowReturn],
  escalate: [flowDiagramStyles.edgeEscalate, flowDiagramStyles.arrowEscalate],
  invalid: [flowDiagramStyles.edgeInvalid, flowDiagramStyles.arrowInvalid],
};

let diagrams = 0;

/** 泳道流程图 */
export const FlowDiagram = _component(
  ({
    definition,
    progress,
    problems = [],
    selectable = false,
    selected = _bindable<string | null>(null),
    size = 'md',
    fit = false,
    nodeDetail,
    propsCanvas,
    propsLane,
    propsNode,
    propsEdgeLabel,
    ...rest
  }: FlowDiagramProps) => {
    // 箭头的 marker 要在页面里唯一的 id
    const prefix = `flow-${++diagrams}`;
    const messages = useMessages('workflow', workflowMessages);
    // fit：量滚动区域的宽，画布按比例缩小
    let viewport = _state.raw<HTMLElement | null>(null);
    let available = _state(0);
    useResizeObserver(
      () => (fit ? viewport : null),
      () => {
        if (viewport) available = viewport.clientWidth;
      },
    );
    const stateLabel = (state: FlowNodeState) =>
      ({
        done: messages.nodeDone,
        active: messages.nodeActive,
        pending: messages.nodePending,
        invalid: messages.nodeInvalid,
      })[state];
    return () => {
      const layout = layoutProcess(definition, sizes[size]);
      const scale = fit && available > 0 ? Math.min(1, available / layout.width) : 1;
      const invalidNodes = new Set(problems.flatMap((item) => item.node ?? []));
      const invalidEdges = new Set(problems.flatMap((item) => item.edge ?? []));
      const stateOf = (id: string): FlowNodeState =>
        invalidNodes.has(id) ? 'invalid' : (progress?.nodes[id] ?? 'pending');

      const toneOf = (item: FlowLayoutEdge): EdgeTone => {
        if (invalidEdges.has(item.id)) return 'invalid';
        if (item.edge.kind === 'return') return 'return';
        if (item.edge.kind === 'escalate') return 'escalate';
        return progress?.edges.has(item.id) ? 'traversed' : 'plain';
      };
      /** 连线的文字：写了 label 用它；人工节点有几个出边时写处理结果的名字 */
      const labelOf = (item: FlowLayoutEdge) => {
        if (item.edge.label) return item.edge.label;
        const source = definition.nodes.find((node) => node.id === item.edge.from);
        const siblings = definition.edges.filter((edge) => edge.from === item.edge.from).length;
        return siblings > 1 && item.edge.outcome
          ? processOutcome(source, item.edge.outcome)?.label
          : undefined;
      };
      const description = layout.nodes
        .filter((item) => progress && stateOf(item.id) === 'active')
        .map((item) => item.node.name)
        .join('、');

      return (
        <ScrollArea
          {...mergePartProps<ScrollAreaProps>(
            { axis: 'x', sx: flowDiagramStyles.root },
            rest as Partial<ScrollAreaProps>,
            { propsViewport: { ref: _toRef(viewport) } },
          )}
        >
          <div style={{ width: `${layout.width * scale}px`, height: `${layout.height * scale}px` }}>
            <div
              {...mergeAttrs<'div'>(
                { sx: [flowDiagramStyles.canvas, size === 'sm' && flowDiagramStyles.canvasSm] },
                propsCanvas,
                {
                  role: 'group',
                  'aria-roledescription': messages.diagram,
                  'aria-label': `${definition.name}${description ? messages.diagramActive(description) : ''}`,
                  style: {
                    width: `${layout.width}px`,
                    height: `${layout.height}px`,
                    ...(scale < 1 ? { transform: `scale(${scale})`, transformOrigin: '0 0' } : {}),
                  },
                },
              )}
            >
              <svg
                {...stylex.attrs(flowDiagramStyles.svg)}
                width={layout.width}
                height={layout.height}
                aria-hidden="true"
              >
                <defs>
                  {(Object.keys(edgeStyles) as EdgeTone[]).map((tone) => (
                    <marker
                      key={tone}
                      id={`${prefix}-${tone}`}
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M0 0 L10 5 L0 10 z" {...stylex.attrs(edgeStyles[tone][1])} />
                    </marker>
                  ))}
                </defs>
                {layout.lanes.map((lane, index) => (
                  <g key={lane.id ?? 'none'}>
                    <rect
                      x={0}
                      y={lane.y}
                      width={layout.width}
                      height={lane.height}
                      {...stylex.attrs(
                        index % 2 ? flowDiagramStyles.laneBandAlt : flowDiagramStyles.laneBand,
                      )}
                    />
                    {index > 0 && (
                      <line
                        x1={0}
                        x2={layout.width}
                        y1={lane.y}
                        y2={lane.y}
                        {...stylex.attrs(flowDiagramStyles.laneLine)}
                      />
                    )}
                  </g>
                ))}
                {layout.edges.map((item) => {
                  const tone = toneOf(item);
                  const dim = progress && tone === 'plain';
                  return (
                    <path
                      key={item.id}
                      d={item.points
                        .map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`)
                        .join(' ')}
                      marker-end={`url(#${prefix}-${tone})`}
                      data-edge={item.id}
                      data-state={progress?.edges.has(item.id) ? 'traversed' : undefined}
                      {...stylex.attrs(
                        flowDiagramStyles.edge,
                        edgeStyles[tone][0],
                        dim && flowDiagramStyles.edgeDim,
                      )}
                    />
                  );
                })}
              </svg>

              {definition.lanes?.length
                ? layout.lanes.map((lane) => (
                    <div
                      key={lane.id ?? 'none'}
                      {...mergeAttrs<'div'>({ sx: flowDiagramStyles.lane }, propsLane, {
                        style: {
                          top: `${lane.y}px`,
                          height: `${lane.height}px`,
                          width: `${sizes[size].laneHeaderWidth ?? 96}px`,
                        },
                      })}
                    >
                      {lane.name}
                    </div>
                  ))
                : null}

              {layout.edges.map((item) => {
                const label = labelOf(item);
                const tone = toneOf(item);
                return (
                  label && (
                    <span
                      key={item.id}
                      {...mergeAttrs<'span'>(
                        {
                          sx: [
                            flowDiagramStyles.edgeLabel,
                            tone === 'return' && flowDiagramStyles.edgeLabelReturn,
                            tone === 'escalate' && flowDiagramStyles.edgeLabelEscalate,
                          ],
                        },
                        propsEdgeLabel,
                        { style: { left: `${item.label.x}px`, top: `${item.label.y}px` } },
                      )}
                    >
                      {label}
                    </span>
                  )
                );
              })}

              {layout.nodes.map((item) => {
                const { node } = item;
                const state = stateOf(item.id);
                const gateway = node.type === 'exclusive' || node.type === 'parallel';
                const own = typeof propsNode === 'function' ? propsNode(node) : propsNode;
                const isSelected = selectable && selected === node.id;
                const detail = nodeDetail?.(node);
                const attrs = mergeAttrs<'div'>(
                  {
                    sx: [
                      flowDiagramStyles.node,
                      selectable && flowDiagramStyles.nodeButton,
                      selectable && focusRingStyles.visible,
                      selectable && interactionTransitions.colors,
                      (node.type === 'start' || node.type === 'end') && flowDiagramStyles.terminal,
                      gateway && flowDiagramStyles.gateway,
                      node.offline && flowDiagramStyles.offline,
                      !gateway && state === 'done' && flowDiagramStyles.done,
                      !gateway && state === 'active' && flowDiagramStyles.active,
                      state === 'pending' && progress && flowDiagramStyles.pending,
                      !gateway && state === 'invalid' && flowDiagramStyles.invalid,
                      isSelected && flowDiagramStyles.selected,
                    ],
                  },
                  own,
                  {
                    style: {
                      left: `${item.x}px`,
                      top: `${item.y}px`,
                      width: `${item.width}px`,
                      height: `${item.height}px`,
                    },
                    title: node.description,
                  },
                );
                const content = (
                  <>
                    {gateway && (
                      <svg
                        {...stylex.attrs(flowDiagramStyles.gatewayShape)}
                        viewBox={`0 0 ${item.width} ${item.height}`}
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <polygon
                          points={`${item.width / 2},1 ${item.width - 1},${item.height / 2} ${item.width / 2},${item.height - 1} 1,${item.height / 2}`}
                          {...stylex.attrs(
                            flowDiagramStyles.shape,
                            state === 'done' && flowDiagramStyles.shapeDone,
                            state === 'active' && flowDiagramStyles.shapeActive,
                            state === 'invalid' && flowDiagramStyles.shapeInvalid,
                          )}
                        />
                      </svg>
                    )}
                    <span
                      {...stylex.attrs(
                        flowDiagramStyles.name,
                        gateway && flowDiagramStyles.gatewayLabel,
                      )}
                    >
                      {node.name}
                    </span>
                    {detail != null && detail !== false && (
                      <span {...stylex.attrs(flowDiagramStyles.detail)}>{detail}</span>
                    )}
                  </>
                );
                const accessibleName = `${node.name}${progress || state === 'invalid' ? `：${stateLabel(state)}` : ''}`;
                return selectable ? (
                  <button
                    key={node.id}
                    type="button"
                    {...(attrs as PartProps<'button'>)}
                    data-node={node.id}
                    data-state={state}
                    aria-pressed={isSelected}
                    aria-label={accessibleName}
                    onClick={() => (selected = node.id)}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    key={node.id}
                    {...attrs}
                    data-node={node.id}
                    data-state={state}
                    role="img"
                    aria-label={accessibleName}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      );
    };
  },
);
