// 编辑：拖动节点（吸附网格、与别的节点对齐时画对齐线、拖到边上自动平移，Esc 取消），悬停节点从四边的端口拖出连线，
// 选中连线后拖两端的把手改接；routing="orthogonal" 的线绕开节点、同一条边上的几条线排开。
// 位置与连线存在自己的状态里，每次改动 createHistory 记一步：Ctrl+Z 撤销、Ctrl+Shift+Z 重做，Delete 删除选中的。
// 没给 children：节点画成标题为 getNodeLabel 的 DiagramNode。右下是小地图，工具栏还能把整张图导出成 SVG、PNG
import { Download, Redo2, Trash2, Undo2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  createHistory,
  downloadFile,
  Flex,
  IconButton,
  Small,
  toElement,
  Toolbar,
  useHotkeys,
} from '@zerodep-dev/vue-tsx-pro-ui';
import {
  Diagram,
  DiagramControls,
  DiagramMinimap,
  diagramToPng,
  diagramToSvg,
  useDiagram,
  type DiagramConnection,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramNodeMove,
  type DiagramReconnection,
  type DiagramSelection,
} from '@zerodep-dev/vue-tsx-pro-ui/diagram';

interface Step extends DiagramNodeItem {
  name: string;
}

interface Doc {
  steps: Step[];
  links: DiagramEdgeItem[];
}

const step = (id: string, name: string, x: number, y: number): Step => ({
  id,
  name,
  x,
  y,
  width: 120,
  height: 48,
});

const initial: Doc = {
  steps: [
    step('apply', '提交申请', 40, 120),
    step('check', '资料核对', 240, 40),
    step('price', '比价', 240, 200),
    step('approve', '经理审批', 440, 120),
    step('archive', '归档', 640, 120),
  ],
  links: [
    { id: 'l1', from: 'apply', to: 'check' },
    { id: 'l2', from: 'apply', to: 'price' },
    { id: 'l3', from: 'check', to: 'approve' },
    { id: 'l4', from: 'price', to: 'approve' },
    { id: 'l5', from: 'approve', to: 'archive' },
  ],
};

export default _component(() => {
  const doc = _state<Doc>(structuredClone(initial));
  const history = createHistory({ read: () => doc, write: (value) => Object.assign(doc, value) });
  const diagram = useDiagram();
  let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
  let next = 6;
  // 存成响应式的：挂载后 useHotkeys 才能绑到它上面
  let region = _state.raw<HTMLElement | null>(null);

  function move(moves: DiagramNodeMove[]) {
    for (const { id, x, y } of moves) {
      Object.assign(
        doc.steps.find((item) => item.id === id)!,
        { x, y },
      );
    }
    history.commit('移动节点');
  }
  function connect({ from, to }: DiagramConnection) {
    if (doc.links.some((link) => link.from === from && link.to === to)) return;
    doc.links.push({ id: `l${next++}`, from, to });
    history.commit('连线');
  }
  function reconnect({ edge, end, node }: DiagramReconnection) {
    Object.assign(
      doc.links.find((link) => link.id === edge)!,
      { [end]: node },
    );
    history.commit('改接连线');
  }
  function remove() {
    const nodes = new Set(selection.nodes);
    const edges = new Set(selection.edges);
    if (!nodes.size && !edges.size) return;
    doc.steps = doc.steps.filter((item) => !nodes.has(item.id));
    doc.links = doc.links.filter(
      (link) => !edges.has(link.id) && !nodes.has(link.from) && !nodes.has(link.to),
    );
    selection = { nodes: [], edges: [] };
    history.commit('删除');
  }
  async function exportImage(kind: 'svg' | 'png') {
    if (kind === 'svg') downloadFile('流程.svg', diagramToSvg(diagram), 'image/svg+xml');
    else downloadFile('流程.png', await diagramToPng(diagram), 'image/png');
  }

  // 焦点在工具栏或画布里时才生效，不抢页面别处的快捷键
  useHotkeys(
    () => ({
      'Mod+Z': () => history.undo(),
      'Mod+Shift+Z': () => history.redo(),
      Delete: remove,
      Backspace: remove,
    }),
    { target: () => region },
  );

  return () => (
    <Flex direction="column" gap="sm" ref={(value: unknown) => (region = toElement(value))}>
      <Flex gap="sm" align="center" wrap>
        <Toolbar aria-label="编辑">
          <IconButton
            icon={Undo2}
            aria-label={`撤销 ${history.undoLabel ?? ''}`}
            disabled={!history.canUndo}
            onClick={() => history.undo()}
          />
          <IconButton
            icon={Redo2}
            aria-label={`重做 ${history.redoLabel ?? ''}`}
            disabled={!history.canRedo}
            onClick={() => history.redo()}
          />
          <IconButton
            icon={Trash2}
            aria-label="删除选中的"
            disabled={!selection.nodes.length && !selection.edges.length}
            onClick={remove}
          />
        </Toolbar>
        <Button size="sm" variant="soft" icon={Download} onClick={() => void exportImage('svg')}>
          导出 SVG
        </Button>
        <Button size="sm" variant="soft" icon={Download} onClick={() => void exportImage('png')}>
          导出 PNG
        </Button>
        <Small tone="muted">{history.dirty ? '有未保存的改动' : '没有改动'}</Small>
      </Flex>
      <Diagram
        controller={diagram}
        nodes={doc.steps}
        edges={doc.links}
        getNodeLabel={(item) => item.name}
        selectable
        _selected={selection}
        dragMode="select"
        grid="dots"
        routing="orthogonal"
        draggable
        snapToGrid
        connectable
        onNodesMove={move}
        onConnect={connect}
        onReconnect={reconnect}
        fitView
        height="26rem"
        overlay={
          <>
            <DiagramControls />
            <DiagramMinimap />
          </>
        }
        aria-label="可编辑的流程"
      />
    </Flex>
  );
});
