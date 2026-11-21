// 节点图（材质、着色器、数据流）：节点上有名字的端口（ports，输入在左、输出在右，颜色按数据类型），连线接在端口上
// （fromPort、toPort），routing="bezier" 画成从端口水平伸出的曲线、没有箭头。从输出端口拖到输入端口连线，一个输入只接一条
// （新的替换旧的）；端口按卡片里的行对齐（at 是行中心在节点高度里的比例），卡片的行高是定的，不用量 DOM。
// 拖动空白处平移、滚轮缩放；选中节点或连线按 Delete 删掉
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Diagram,
  DiagramControls,
  type DiagramConnection,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramNodeMove,
  type DiagramSelection,
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
const HEADER = 26;
const ROW = 22;
/** 卡片的边框：行从边框里面排起 */
const BORDER = 1;

interface Card extends DiagramNodeItem {
  kind: string;
}

const styles = css.create({
  card: {
    width: '_full',
    height: '_full',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_surface',
    fontSize: '_xs',
    overflow: 'hidden',
  },
  selected: { borderColor: '_accent' },
  header: {
    boxSizing: 'border-box',
    height: `${HEADER}px`,
    lineHeight: `${HEADER}px`,
    paddingInline: '_sm',
    fontWeight: '_semibold',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
  },
  row: { height: `${ROW}px`, display: 'flex', alignItems: 'center', paddingInline: '_sm' },
  output: { justifyContent: 'flex-end' },
});

/** 一张卡片：标题下面先是输出、再是输入，每行一个端口 */
function card(id: string, kind: string, x: number, y: number): Card {
  const { inputs, outputs } = KINDS[kind]!;
  const height = HEADER + (outputs.length + inputs.length) * ROW + 2 * BORDER;
  const at = (row: number) => (BORDER + HEADER + row * ROW + ROW / 2) / height;
  return {
    id,
    kind,
    x,
    y,
    width: WIDTH,
    height,
    ports: [
      ...outputs.map((s, i) => ({
        id: s.name,
        direction: 'out' as const,
        at: at(i),
        label: s.name,
        color: COLORS[s.type],
      })),
      ...inputs.map((s, i) => ({
        id: s.name,
        direction: 'in' as const,
        at: at(outputs.length + i),
        label: s.name,
        color: COLORS[s.type],
      })),
    ],
  };
}

export default _component(() => {
  let nodes = _state<Card[]>([
    card('tex', 'texture', 0, 0),
    card('rough', 'number', 0, 120),
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
      {(node: Card, state: { selected: boolean }) => {
        const { title, inputs, outputs } = KINDS[node.kind]!;
        return (
          <div {...css.attrs(styles.card, state.selected && styles.selected)}>
            <div {...css.attrs(styles.header)}>{title}</div>
            {outputs.map((s) => (
              <div {...css.attrs(styles.row, styles.output)} aria-hidden="true">
                {s.name}
              </div>
            ))}
            {inputs.map((s) => (
              <div {...css.attrs(styles.row)} aria-hidden="true">
                {s.name}
              </div>
            ))}
          </div>
        );
      }}
    </Diagram>
  );
});
