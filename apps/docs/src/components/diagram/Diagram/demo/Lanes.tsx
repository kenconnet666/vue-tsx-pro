// 泳道与画布外的工具栏：backdrop 画泳道（画布坐标的 HTML，随视口平移缩放），propsEdge 按连线改颜色、画虚线；
// useDiagram() 建的控制器交给画布，画布外的按钮用它缩放、适应画布，“定位到”选一个节点就平移过去并选中它；
// extent 写上泳道的范围，适应画布时把泳道整个放进来；propsNode 让胶囊形节点的选中描边也是胶囊形
import { Maximize2, ZoomIn, ZoomOut } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Flex, IconButton, Select, Toolbar } from '@vue-tsx-pro/ui';
import {
  Diagram,
  useDiagram,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramSelection,
} from '@vue-tsx-pro/ui/diagram';

const LANE = 120;
const HEADER = 88;
const WIDTH = 860;

const lanes = ['申请人', '部门经理', '财务'];

interface Step extends DiagramNodeItem {
  name: string;
  round?: boolean;
}

interface Flow extends DiagramEdgeItem {
  kind?: 'return';
  text?: string;
}

const step = (id: string, name: string, lane: number, column: number, round = false): Step => ({
  id,
  name,
  round,
  x: HEADER + 40 + column * 180,
  y: lane * LANE + (LANE - 48) / 2,
  width: 128,
  height: 48,
});

const steps: Step[] = [
  step('submit', '提交申请', 0, 0, true),
  step('approve', '部门审批', 1, 1),
  step('revise', '修改申请', 0, 2),
  step('review', '财务复核', 2, 2),
  step('pay', '付款', 2, 3, true),
];

// 节点的边中点：右边、左边、上边、下边
const right = (s: Step) => ({ x: s.x + s.width, y: s.y + s.height / 2 });
const left = (s: Step) => ({ x: s.x, y: s.y + s.height / 2 });
const top = (s: Step) => ({ x: s.x + s.width / 2, y: s.y });
const bottom = (s: Step) => ({ x: s.x + s.width / 2, y: s.y + s.height });
const at = Object.fromEntries(steps.map((s) => [s.id, s])) as Record<string, Step>;

const flows: Flow[] = [
  {
    id: 'submit-approve',
    from: 'submit',
    to: 'approve',
    points: [
      right(at.submit!),
      { x: left(at.approve!).x - 40, y: right(at.submit!).y },
      { x: left(at.approve!).x - 40, y: left(at.approve!).y },
      left(at.approve!),
    ],
  },
  {
    id: 'approve-review',
    from: 'approve',
    to: 'review',
    text: '同意',
    points: [
      right(at.approve!),
      { x: top(at.review!).x, y: right(at.approve!).y },
      top(at.review!),
    ],
  },
  {
    id: 'approve-revise',
    from: 'approve',
    to: 'revise',
    kind: 'return',
    text: '退回修改',
    points: [top(at.approve!), { x: top(at.approve!).x, y: left(at.revise!).y }, left(at.revise!)],
  },
  {
    // 从修改申请的底边下来，进部门审批的上边靠右：与“同意”那条线分开走，文字不重叠
    id: 'revise-approve',
    from: 'revise',
    to: 'approve',
    text: '重新提交',
    points: [
      bottom(at.revise!),
      { x: bottom(at.revise!).x, y: top(at.approve!).y - 28 },
      { x: at.approve!.x + 100, y: top(at.approve!).y - 28 },
      { x: at.approve!.x + 100, y: top(at.approve!).y },
    ],
  },
  {
    id: 'review-pay',
    from: 'review',
    to: 'pay',
    text: '付款',
    points: [right(at.review!), left(at.pay!)],
  },
];

const styles = css.create({
  diagram: { height: '24rem' },
  lane: {
    position: 'absolute',
    left: 0,
    width: `${WIDTH}px`,
    height: `${LANE}px`,
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
  },
  laneAlt: { backgroundColor: '_surfaceMuted' },
  laneName: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${HEADER}px`,
    height: '100%',
    fontWeight: '_semibold',
    color: '_textMuted',
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_borderMuted',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '_surfaceRaised',
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderColor: '_borderStrong',
    borderRadius: '_md',
    fontWeight: '_medium',
  },
  round: { borderRadius: '_full' },
  // 节点框（选中、焦点的描边）跟着胶囊形状走
  roundFrame: { borderRadius: '_full' },
  returnEdge: {
    color: { default: '_dangerText', _pressed: '_accent', ':focus-visible': '_accent' },
    strokeDasharray: '6 4',
  },
  returnText: { color: '_dangerText' },
});

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
          `${at[flow.from]!.name} 到 ${at[flow.to]!.name}${flow.text ? `：${flow.text}` : ''}`
        }
        edgeText={(flow) => flow.text}
        selectable
        _selected={selection}
        fitView
        extent={{ x: 0, y: 0, width: WIDTH, height: lanes.length * LANE }}
        sx={styles.diagram}
        propsNode={(s) => (s.round ? { sx: styles.roundFrame } : {})}
        propsEdge={(flow) => (flow.kind === 'return' ? { sx: styles.returnEdge } : {})}
        propsEdgeText={(flow) => (flow.kind === 'return' ? { sx: styles.returnText } : {})}
        backdrop={lanes.map((name, index) => (
          <div
            key={name}
            {...css.attrs(styles.lane, index % 2 === 1 && styles.laneAlt)}
            style={{ top: `${index * LANE}px` }}
          >
            <div {...css.attrs(styles.laneName)}>{name}</div>
          </div>
        ))}
        aria-label="报销流程"
      >
        {(s) => <div {...css.attrs(styles.step, s.round && styles.round)}>{s.name}</div>}
      </Diagram>
    </Flex>
  );
});
