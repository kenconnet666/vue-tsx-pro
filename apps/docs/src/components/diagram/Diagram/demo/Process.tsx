// 流程图（只看）：layoutLayers 按连线分列排版；开始、结束是圆，分支、汇合是菱形——shape 写在节点数据上，DiagramNode 跟着画，
// 连线接到形状的轮廓上。走过的节点与连线用 success，正在处理的 accent 加 active，出错的 danger，还没走到的虚线边框；
// 退回的线不参与排版，从底边出、进底边，绕开中间的节点画成红色虚线。不开 selectable、draggable 就是只看
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small, StatusDot } from '@zerodep-dev/vue-tsx-pro-ui';
import {
  Diagram,
  DiagramControls,
  DiagramNode,
  layoutLayers,
  type DiagramEdgeItem,
  type DiagramNodeShape,
} from '@zerodep-dev/vue-tsx-pro-ui/diagram';

type StepState = 'done' | 'current' | 'error' | 'todo';

interface Step {
  id: string;
  name: string;
  kind: 'event' | 'gateway' | 'task';
  state: StepState;
  /** 处理人，或出错的原因 */
  note?: string;
}

interface Link extends DiagramEdgeItem {
  text?: string;
}

const STATES: Record<
  StepState,
  { label: string; tone: 'success' | 'accent' | 'danger' | 'neutral' }
> = {
  done: { label: '已走过', tone: 'success' },
  current: { label: '正在处理', tone: 'accent' },
  error: { label: '出错', tone: 'danger' },
  todo: { label: '还没走到', tone: 'neutral' },
};

const SHAPES: Record<Step['kind'], { shape: DiagramNodeShape; width: number; height: number }> = {
  event: { shape: 'circle', width: 52, height: 52 },
  gateway: { shape: 'diamond', width: 56, height: 56 },
  task: { shape: 'rect', width: 136, height: 56 },
};

const steps: Step[] = [
  { id: 'start', name: '提交', kind: 'event', state: 'done' },
  { id: 'manager', name: '部门经理审批', kind: 'task', state: 'done', note: '王经理' },
  { id: 'split', name: '并行', kind: 'gateway', state: 'done' },
  { id: 'ceo', name: '总经理审批', kind: 'task', state: 'current', note: '李总' },
  { id: 'budget', name: '同步预算', kind: 'task', state: 'error', note: '预算接口超时' },
  { id: 'join', name: '汇合', kind: 'gateway', state: 'todo' },
  { id: 'pay', name: '财务付款', kind: 'task', state: 'todo', note: '财务部' },
  { id: 'end', name: '结束', kind: 'event', state: 'todo' },
];

const forward = [
  { from: 'start', to: 'manager', done: true },
  { from: 'manager', to: 'split', done: true, text: '同意' },
  { from: 'split', to: 'ceo', done: true },
  { from: 'split', to: 'budget', done: true },
  { from: 'ceo', to: 'join' },
  { from: 'budget', to: 'join' },
  { from: 'join', to: 'pay' },
  { from: 'pay', to: 'end' },
];

// 排版只看前进的线；节点数据带上形状与位置
const placed = layoutLayers(
  steps.map((step) => ({ id: step.id, ...SHAPES[step.kind] })),
  forward,
  { roots: ['start'], columnGap: 176, rowGap: 104 },
);
const nodes = steps.map((step, index) => ({
  ...step,
  ...placed[index]!,
  shape: SHAPES[step.kind].shape,
}));

const links: Link[] = [
  ...forward.map(({ from, to, done, text }) => ({
    id: `${from}-${to}`,
    from,
    to,
    text,
    tone: done ? ('success' as const) : undefined,
  })),
  {
    id: 'ceo-manager',
    from: 'ceo',
    to: 'manager',
    text: '退回',
    tone: 'danger',
    dashed: true,
    fromSide: 'bottom',
    toSide: 'bottom',
  },
];

const GATEWAY_MARK = '+';

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    <Diagram
      nodes={nodes}
      edges={links}
      getNodeLabel={(step) =>
        `${step.name}，${STATES[step.state].label}${step.note ? `，${step.note}` : ''}`
      }
      edgeText={(link) => link.text}
      routing="orthogonal"
      fitView
      height="20rem"
      overlay={<DiagramControls />}
      aria-label="采购申请的审批进度"
    >
      {(step) => (
        <DiagramNode
          title={step.kind === 'gateway' ? GATEWAY_MARK : step.name}
          description={step.note}
          tone={STATES[step.state].tone}
          active={step.state === 'current'}
          dashed={step.state === 'todo'}
        />
      )}
    </Diagram>
    <Flex gap="lg" wrap>
      {Object.values(STATES).map((state) => (
        <Flex key={state.label} gap="xs" align="center">
          <StatusDot tone={state.tone} />
          <Small tone="muted">{state.label}</Small>
        </Flex>
      ))}
    </Flex>
  </Flex>
));
