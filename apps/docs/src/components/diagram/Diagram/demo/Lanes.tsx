// 泳道与画布外的工具栏：backdrop 放 DiagramLanes（画布坐标，随视口平移缩放，点阵透过来），extent 用 lanesExtent
// 算出泳道的范围，适应画布时整个放进来。连线不给折线，routing="orthogonal" 自动走线，fromSide、toSide 指定进出的边。
// 开始、结束是胶囊形的 DiagramNode，退回的连线 tone="danger"、dashed 画成红色虚线。
// useDiagram() 建的控制器交给画布，画布外的按钮用它缩放、适应画布，“定位到”选一个节点就平移过去并选中它
import { Maximize2, ZoomIn, ZoomOut } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, IconButton, Select, Toolbar } from '@vue-tsx-pro/ui';
import {
  Diagram,
  DiagramLanes,
  DiagramNode,
  lanesExtent,
  useDiagram,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramSelection,
} from '@vue-tsx-pro/ui/diagram';

const LANE = 96;
const HEADER = 80;
const COLUMN = 200;
const WIDTH = 900;

const lanes = [{ name: '申请人' }, { name: '部门经理' }, { name: '财务' }];

interface Step extends DiagramNodeItem {
  name: string;
  round?: boolean;
}

interface Flow extends DiagramEdgeItem {
  text?: string;
}

/** 第几条泳道、第几列：节点在泳道里垂直居中 */
const step = (id: string, name: string, lane: number, column: number, round = false): Step => ({
  id,
  name,
  round,
  x: HEADER + 48 + column * COLUMN,
  y: lane * LANE + (LANE - 48) / 2,
  width: 128,
  height: 48,
});

// 每一步往下一条泳道、往右一列：交接的线从底边出、进左边，退回的线从顶边出、进右边，围成一个环
const steps: Step[] = [
  step('submit', '提交申请', 0, 0, true),
  step('approve', '部门审批', 1, 1),
  step('review', '财务复核', 2, 2),
  step('pay', '付款', 2, 3, true),
];

const flows: Flow[] = [
  { id: 'submit-approve', from: 'submit', to: 'approve', fromSide: 'bottom', toSide: 'left' },
  {
    id: 'approve-review',
    from: 'approve',
    to: 'review',
    text: '同意',
    fromSide: 'bottom',
    toSide: 'left',
  },
  {
    id: 'review-approve',
    from: 'review',
    to: 'approve',
    text: '退回',
    tone: 'danger',
    dashed: true,
    fromSide: 'top',
    toSide: 'right',
  },
  { id: 'review-pay', from: 'review', to: 'pay' },
];

const nameOf = (id: string) => steps.find((s) => s.id === id)?.name ?? id;

export default _component(() => {
  const diagram = useDiagram({ maxScale: 1.5 });
  let selection = _state<DiagramSelection>({ nodes: [], edges: [] });

  /** 定位到一个节点：平移到看得见，并选中它 */
  function locate(id: string | null) {
    const target = steps.find((s) => s.id === id);
    if (!target) return;
    diagram.reveal(target, 48);
    selection = { nodes: [target.id], edges: [] };
  }

  return () => (
    <Flex direction="column" gap="sm">
      <Flex gap="sm" align="center" wrap>
        <Toolbar aria-label="画布">
          <IconButton
            icon={ZoomOut}
            aria-label="缩小"
            disabled={!diagram.canZoomOut}
            onClick={() => diagram.zoomOut()}
          />
          <IconButton
            icon={ZoomIn}
            aria-label="放大"
            disabled={!diagram.canZoomIn}
            onClick={() => diagram.zoomIn()}
          />
          <IconButton icon={Maximize2} aria-label="适应画布" onClick={() => diagram.fit()} />
        </Toolbar>
        <Select
          items={steps.map((s) => ({ value: s.id, label: s.name }))}
          _value={selection.nodes[0] ?? null}
          onUpdate:_value={locate}
          placeholder="定位到…"
          size="sm"
          aria-label="定位到节点"
        />
      </Flex>
      <Diagram
        controller={diagram}
        nodes={steps}
        edges={flows}
        getNodeLabel={(s) => s.name}
        getEdgeLabel={(flow) =>
          `${nameOf(flow.from)} 到 ${nameOf(flow.to)}${flow.text ? `：${flow.text}` : ''}`
        }
        edgeText={(flow) => flow.text}
        routing="orthogonal"
        selectable
        _selected={selection}
        grid="dots"
        fitView
        height="24rem"
        extent={lanesExtent(lanes, { width: WIDTH, laneSize: LANE })}
        backdrop={<DiagramLanes lanes={lanes} width={WIDTH} laneSize={LANE} header={HEADER} />}
        aria-label="报销流程"
      >
        {(s) => <DiagramNode title={s.name} shape={s.round ? 'pill' : 'rect'} />}
      </Diagram>
    </Flex>
  );
});
