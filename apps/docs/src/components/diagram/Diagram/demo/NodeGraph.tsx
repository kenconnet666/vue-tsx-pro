// 节点图（材质、着色器、数据流）：节点上有名字的端口（ports，输入在左、输出在右，颜色按数据类型），连线接在端口上
// （fromPort、toPort），routing="bezier" 画成从端口水平伸出的曲线、没有箭头。从输出端口拖到输入端口连线，一个输入只接一条
// （新的替换旧的）。节点是 DiagramPortNode：标题栏下一行一个端口，portNodeLayout 按同样的行高算出节点的高和端口的 at，
// 端口点对着行、不用量 DOM；“数值”节点的参数放在端口行下面（参数区里拖数值不拖节点）。
// 拖动空白处平移、滚轮缩放；选中节点或连线按 Delete 删掉
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { NumberField } from '@zerodep-dev/vue-tsx-pro-ui';
import {
  Diagram,
  DiagramControls,
  DiagramPortNode,
  portNodeLayout,
  type DiagramConnection,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramNodeMove,
  type DiagramSelection,
  type PortNodePort,
} from '@zerodep-dev/vue-tsx-pro-ui/diagram';

type PortType = 'float' | 'color';

interface Socket {
  name: string;
  type: PortType;
}

interface Kind {
  title: string;
  inputs: Socket[];
  outputs: Socket[];
}

const KINDS: Record<string, Kind> = {
  texture: {
    title: '贴图',
    inputs: [],
    outputs: [
      { name: '颜色', type: 'color' },
      { name: '透明度', type: 'float' },
    ],
  },
  number: { title: '数值', inputs: [], outputs: [{ name: '值', type: 'float' }] },
  multiply: {
    title: '乘',
    inputs: [
      { name: '颜色', type: 'color' },
      { name: '系数', type: 'float' },
    ],
    outputs: [{ name: '结果', type: 'color' }],
  },
  output: {
    title: '材质输出',
    inputs: [
      { name: '基础色', type: 'color' },
      { name: '粗糙度', type: 'float' },
    ],
    outputs: [],
  },
};

const COLORS: Record<PortType, string> = { float: '#9aa0a6', color: '#e8a33d' };
const WIDTH = 150;
/** 参数区的高（px）：一个数值框 */
const PARAMS = 40;

interface Card extends DiagramNodeItem {
  kind: string;
}

const ports = (sockets: Socket[]): PortNodePort[] =>
  sockets.map((s) => ({ id: s.name, label: s.name, color: COLORS[s.type] }));

/** 一张卡片：输出、输入各一行一个端口；数值节点下面多一块参数区 */
function card(id: string, kind: string, x: number, y: number): Card {
  const { inputs, outputs } = KINDS[kind]!;
  // 高、端口，还有数值节点的参数区里有控件（controls：节点框不当按钮）
  const layout = portNodeLayout({
    outputs: ports(outputs),
    inputs: ports(inputs),
    body: kind === 'number' ? PARAMS : 0,
  });
  return { id, kind, x, y, width: WIDTH, ...layout };
}

export default _component(() => {
  let nodes = _state<Card[]>([
    card('tex', 'texture', 0, 0),
    card('rough', 'number', 0, 130),
    card('mul', 'multiply', 220, 20),
    card('out', 'output', 440, 40),
  ]);
  let edges = _state<DiagramEdgeItem[]>([
    { id: 'mul:颜色', from: 'tex', fromPort: '颜色', to: 'mul', toPort: '颜色' },
    { id: 'mul:系数', from: 'tex', fromPort: '透明度', to: 'mul', toPort: '系数' },
    { id: 'out:基础色', from: 'mul', fromPort: '结果', to: 'out', toPort: '基础色' },
    { id: 'out:粗糙度', from: 'rough', fromPort: '值', to: 'out', toPort: '粗糙度' },
  ]);
  let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
  let roughness = _state<number | null>(0.4);

  /** 连线的 id 是“终点:输入端口”：同一个输入再连一条就替换旧的 */
  const connect = ({ from, fromPort, to, toPort }: DiagramConnection) => {
    if (!fromPort || !toPort) return;
    const id = `${to}:${toPort}`;
    edges = [...edges.filter((edge) => edge.id !== id), { id, from, fromPort, to, toPort }];
  };
  const move = (moves: DiagramNodeMove[]) => {
    nodes = nodes.map((node) => {
      const moved = moves.find((m) => m.id === node.id);
      return moved ? { ...node, x: moved.x, y: moved.y } : node;
    });
  };
  const remove = (event: KeyboardEvent) => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    const gone = new Set(selection.nodes);
    nodes = nodes.filter((node) => !gone.has(node.id));
    edges = edges.filter(
      (edge) => !selection.edges.includes(edge.id) && !gone.has(edge.from) && !gone.has(edge.to),
    );
    selection = { nodes: [], edges: [] };
  };

  return () => (
    <Diagram
      nodes={nodes}
      edges={edges}
      height={280}
      routing="bezier"
      selectable
      _selected={selection}
      draggable
      onNodesMove={move}
      connectable
      onConnect={connect}
      onKeydown={remove}
      fitView
      // 端口的名字跟在标题后面一起读出来（卡片里的行对读屏藏起来）；用空格隔开：名称要按词包含看得见的标题
      getNodeLabel={(node) => {
        const { title, inputs, outputs } = KINDS[node.kind]!;
        return [title, ...[...outputs, ...inputs].map((s) => s.name)].join(' ');
      }}
      overlay={<DiagramControls />}
      aria-label="材质节点图"
    >
      {(node: Card) => {
        const { title, inputs, outputs } = KINDS[node.kind]!;
        return (
          <DiagramPortNode title={title} outputs={ports(outputs)} inputs={ports(inputs)}>
            {node.kind === 'number' && (
              <NumberField
                _value={roughness}
                size="xs"
                min={0}
                max={1}
                step={0.05}
                aria-label="粗糙度的值"
              />
            )}
          </DiagramPortNode>
        );
      }}
    </Diagram>
  );
});
