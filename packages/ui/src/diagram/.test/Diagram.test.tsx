// Diagram：节点与连线的渲染与读屏、点选与加选、框选、键盘（Esc、Ctrl+A、Enter、方向键挪动）、_selected 双向绑定、
// 拖动（阈值、吸附、对齐线、Esc 取消）、连线与改接、正交路由、连线的色调与虚线；
// 控制器的适应内容与坐标换算、DiagramControls、DiagramMinimap、导出 SVG；DiagramNode、DiagramLanes
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { hasStyles, mount } from '../../utils/.test/mount';
import { useDiagram, type DiagramController } from '../controller';
import {
  Diagram,
  diagramStyles,
  type DiagramConnection,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramNodeMove,
  type DiagramReconnection,
  type DiagramSelection,
} from '../Diagram';
import { DiagramControls } from '../DiagramControls';
import { DiagramLanes, lanesExtent } from '../DiagramLanes';
import { DiagramMinimap } from '../DiagramMinimap';
import { DiagramNode, diagramNodeStyles } from '../DiagramNode';
import { diagramToSvg } from '../export';

interface Item extends DiagramNodeItem {
  name: string;
}

const nodes: Item[] = [
  { id: 'a', name: '供应商甲', x: 0, y: 0, width: 100, height: 40 },
  { id: 'b', name: '一号工厂', x: 200, y: 0, width: 100, height: 40 },
];
const edges: DiagramEdgeItem[] = [{ id: 'ab', from: 'a', to: 'b' }];

const pointer = (type: string, x: number, y: number, init: PointerEventInit = {}) =>
  new PointerEvent(type, {
    clientX: x,
    clientY: y,
    pointerId: 1,
    button: 0,
    bubbles: true,
    ...init,
  });
const key = (element: Element, name: string, init: KeyboardEventInit = {}) =>
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }),
  );

function render(props: Record<string, unknown> = {}) {
  let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
  const root = mount(() => (
    <Diagram
      nodes={nodes}
      edges={edges}
      getNodeLabel={(item: Item) => item.name}
      edgeText={() => '1200 件/月'}
      _selected={selection}
      aria-label="供货网络"
      {...props}
    >
      {(item: Item) => <span>{item.name}</span>}
    </Diagram>
  ));
  const canvas = root.querySelector<HTMLElement>('[aria-label="供货网络"]')!;
  const node = (id: string) => canvas.querySelector<HTMLElement>(`[data-node="${id}"]`)!;
  const edge = (id: string) => canvas.querySelector<SVGGElement>(`[data-edge="${id}"]`)!;
  return { canvas, node, edge, selection: () => selection };
}

/**
 * 给视口一个位置与大小：左上角在 (-100, -100)、600 × 400，画布坐标 (x, y) 在屏幕上是 (x - 100, y - 100)。
 * 离视口边都远于 32px，拖动时不会自动平移
 */
function stage(canvas: HTMLElement) {
  canvas.getBoundingClientRect = () => new DOMRect(-100, -100, 600, 400);
}
const screen = (x: number, y: number) => [x - 100, y - 100] as const;
const at = (type: string, x: number, y: number, init?: PointerEventInit) =>
  pointer(type, ...screen(x, y), init);
/** 拖过之后 startMove 吞掉紧接着的 click，下一轮宏任务才撤掉 */
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('Diagram', () => {
  it('不可选择时节点是 role="img"、带名称，连线对读屏隐藏；没给折线时画两个节点边框之间的直线', () => {
    const { canvas, node, edge } = render();
    expect(canvas.getAttribute('role')).toBe('group');
    expect(canvas.getAttribute('aria-roledescription')).toBe('画布');
    expect(node('a').getAttribute('role')).toBe('img');
    expect(node('a').getAttribute('aria-label')).toBe('供应商甲');
    expect(node('a').textContent).toBe('供应商甲');
    expect(canvas.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    // 从甲的右边框（100, 20）到乙的左边框（200, 20），线尾让出箭头
    const d = edge('ab').querySelectorAll('path')[0]!.getAttribute('d')!;
    expect(d.startsWith('M100 20 L')).toBe(true);
    expect(edge('ab').querySelector('polygon')!.getAttribute('points')!.startsWith('200,20')).toBe(
      true,
    );
    expect(canvas.textContent).toContain('1200 件/月');
  });

  it('点选只选它；按住 Shift 加选、再点取消；点连线选连线；点空白处清空；_selected 写回父级', async () => {
    const { canvas, node, edge, selection } = render({ selectable: true });
    expect(node('a').getAttribute('role')).toBe('button');
    expect(edge('ab').getAttribute('aria-label')).toBe('从 供应商甲 到 一号工厂');

    node('a').click();
    await nextTick();
    expect(selection()).toEqual({ nodes: ['a'], edges: [] });
    expect(node('a').getAttribute('aria-pressed')).toBe('true');

    node('b').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    await nextTick();
    expect(selection().nodes).toEqual(['a', 'b']);
    node('a').dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    await nextTick();
    expect(selection().nodes).toEqual(['b']);

    edge('ab').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(selection()).toEqual({ nodes: [], edges: ['ab'] });

    canvas.click();
    await nextTick();
    expect(selection()).toEqual({ nodes: [], edges: [] });
  });

  it('键盘：节点上 Enter 选中，Ctrl+A 全选，Esc 清空', async () => {
    const { canvas, node, selection } = render({ selectable: true });
    key(node('b'), 'Enter');
    await nextTick();
    expect(selection().nodes).toEqual(['b']);
    key(canvas, 'a', { ctrlKey: true });
    await nextTick();
    expect(selection()).toEqual({ nodes: ['a', 'b'], edges: ['ab'] });
    key(canvas, 'Escape');
    await nextTick();
    expect(selection()).toEqual({ nodes: [], edges: [] });
  });

  it('框选：按住 Shift 拖动空白处，整个框住的节点选中；框选框松开后消失', async () => {
    const { canvas, selection } = render({ selectable: true });
    canvas.dispatchEvent(pointer('pointerdown', -10, -10, { shiftKey: true }));
    canvas.dispatchEvent(pointer('pointermove', 150, 60));
    await nextTick();
    expect(selection().nodes).toEqual(['a']);
    canvas.dispatchEvent(pointer('pointerup', 150, 60));
    await nextTick();
    expect(selection().nodes).toEqual(['a']);
    // 碰到就算：乙只被框到一半也选中
    const partial = render({ selectable: true, selectionMode: 'partial' });
    partial.canvas.dispatchEvent(pointer('pointerdown', -10, -10, { shiftKey: true }));
    partial.canvas.dispatchEvent(pointer('pointermove', 250, 60));
    await nextTick();
    expect(partial.selection()).toEqual({ nodes: ['a', 'b'], edges: ['ab'] });
    partial.canvas.dispatchEvent(pointer('pointerup', 250, 60));
    // 拖过之后 startMove 吞掉紧接着的一次 click（拖完不误触发点击），下一轮宏任务才撤掉
    await new Promise((resolve) => setTimeout(resolve));
  });

  it('propsNode、propsEdge 可以按项计算', () => {
    const { node, edge } = render({
      propsNode: (item: Item) => ({ 'data-kind': item.id === 'a' ? 'supplier' : 'factory' }),
      propsEdge: () => ({ 'data-tone': 'return' }),
    });
    expect(node('a').getAttribute('data-kind')).toBe('supplier');
    expect(node('b').getAttribute('data-kind')).toBe('factory');
    expect(edge('ab').getAttribute('data-tone')).toBe('return');
  });

  it('连线的 dashed 画虚线、tone 改颜色；没给 children 时节点画成标题为 getNodeLabel 的 DiagramNode', () => {
    const root = mount(() => (
      <Diagram
        nodes={nodes}
        edges={[
          { id: 'plain', from: 'a', to: 'b' },
          { id: 'back', from: 'b', to: 'a', tone: 'danger', dashed: true },
        ]}
        getNodeLabel={(item: Item) => item.name}
        aria-label="画布"
      />
    ));
    const plain = root.querySelector('[data-edge="plain"]')!;
    const back = root.querySelector('[data-edge="back"]')!;
    expect(hasStyles(back, diagramStyles.edgeDashed)).toBe(true);
    expect(hasStyles(plain, diagramStyles.edgeDashed)).toBe(false);
    expect(back.getAttribute('class')).not.toBe(plain.getAttribute('class'));
    const card = root.querySelector('[data-node="a"] [data-diagram-shape]')!;
    expect(card.getAttribute('data-diagram-shape')).toBe('rect');
    expect(card.textContent).toBe('供应商甲');
  });

  it('拖动：过了 3px 才开始并选中它，吸附网格；松开后 onNodesMove 给出新位置；Esc 取消且不清空选择', async () => {
    const moves: DiagramNodeMove[][] = [];
    const { canvas, node, selection } = render({
      selectable: true,
      draggable: true,
      snapToGrid: true,
      guides: false,
      onNodesMove: (list: DiagramNodeMove[]) => moves.push(list),
    });
    stage(canvas);
    node('a').dispatchEvent(at('pointerdown', 10, 10));
    node('a').dispatchEvent(at('pointermove', 11, 11));
    await nextTick();
    expect(selection().nodes).toEqual([]);
    // 挪了 (37, 23)，吸附到 20 的网格是 (40, 20)
    node('a').dispatchEvent(at('pointermove', 47, 33));
    await nextTick();
    expect(selection().nodes).toEqual(['a']);
    node('a').dispatchEvent(at('pointerup', 47, 33));
    expect(moves).toEqual([[{ id: 'a', x: 40, y: 20 }]]);
    await settle();

    node('b').dispatchEvent(at('pointerdown', 210, 10));
    node('b').dispatchEvent(at('pointermove', 260, 10));
    await nextTick();
    key(node('b'), 'Escape');
    node('b').dispatchEvent(at('pointerup', 260, 10));
    await nextTick();
    expect(moves).toHaveLength(1);
    expect(selection().nodes).toEqual(['b']);
    await settle();
  });

  it('拖动时与别的节点对齐就吸过去并画对齐线，松开后对齐线消失', async () => {
    const moves: DiagramNodeMove[][] = [];
    const { canvas, node } = render({
      draggable: true,
      onNodesMove: (list: DiagramNodeMove[]) => moves.push(list),
    });
    stage(canvas);
    node('a').dispatchEvent(at('pointerdown', 10, 10));
    // 往下挪 4：与乙的上边差 4（不到 6）就吸回 0
    node('a').dispatchEvent(at('pointermove', 60, 14));
    await nextTick();
    expect(canvas.querySelectorAll('[data-diagram-transient] line').length).toBeGreaterThan(0);
    node('a').dispatchEvent(at('pointerup', 60, 14));
    await nextTick();
    expect(moves).toEqual([[{ id: 'a', x: 50, y: 0 }]]);
    expect(canvas.querySelector('[data-diagram-transient]')).toBeNull();
    await settle();
  });

  it('方向键挪动聚焦的节点：吸附网格时一次一格，按住 Shift 五格', () => {
    const moves: DiagramNodeMove[][] = [];
    const { node } = render({
      draggable: true,
      snapToGrid: true,
      onNodesMove: (list: DiagramNodeMove[]) => moves.push(list),
    });
    key(node('a'), 'ArrowRight');
    key(node('a'), 'ArrowDown', { shiftKey: true });
    expect(moves).toEqual([[{ id: 'a', x: 20, y: 0 }], [{ id: 'a', x: 0, y: 100 }]]);
  });

  it('连线：悬停节点出现端口，从端口拖到另一个节点上松开调用 onConnect；松开后的 click 不清空选择', async () => {
    const connections: DiagramConnection[] = [];
    const { canvas, node, selection } = render({
      selectable: true,
      connectable: true,
      onConnect: (connection: DiagramConnection) => connections.push(connection),
    });
    stage(canvas);
    node('a').click();
    node('a').dispatchEvent(new PointerEvent('pointerenter'));
    await nextTick();
    const port = node('a').querySelector('[data-diagram-port="right"]')!;
    port.dispatchEvent(at('pointerdown', 100, 20));
    // 指针被画布捕获：之后的事件落在画布上
    canvas.dispatchEvent(at('pointermove', 205, 20));
    await nextTick();
    expect(node('b').hasAttribute('data-link-target')).toBe(true);
    expect(canvas.querySelector('[data-diagram-transient] path')).not.toBeNull();
    canvas.dispatchEvent(at('pointerup', 205, 20));
    canvas.click();
    await nextTick();
    expect(connections).toEqual([{ from: 'a', to: 'b', fromSide: 'right', toSide: 'left' }]);
    expect(selection().nodes).toEqual(['a']);
    expect(canvas.querySelector('[data-diagram-transient]')).toBeNull();
    await settle();

    // 松开在空白处或自己身上：不连
    port.dispatchEvent(at('pointerdown', 100, 20));
    canvas.dispatchEvent(at('pointermove', 50, 20));
    canvas.dispatchEvent(at('pointerup', 50, 20));
    await settle();
    port.dispatchEvent(at('pointerdown', 100, 20));
    canvas.dispatchEvent(at('pointermove', 150, 200));
    canvas.dispatchEvent(at('pointerup', 150, 200));
    await settle();
    expect(connections).toHaveLength(1);
  });

  it('canConnect 不允许的节点不高亮，松开也不连', async () => {
    const connections: DiagramConnection[] = [];
    const { canvas, node } = render({
      connectable: true,
      canConnect: () => false,
      onConnect: (connection: DiagramConnection) => connections.push(connection),
    });
    stage(canvas);
    node('a').dispatchEvent(new PointerEvent('pointerenter'));
    await nextTick();
    node('a')
      .querySelector('[data-diagram-port="right"]')!
      .dispatchEvent(at('pointerdown', 100, 20));
    canvas.dispatchEvent(at('pointermove', 205, 20));
    await nextTick();
    expect(node('b').hasAttribute('data-link-target')).toBe(false);
    canvas.dispatchEvent(at('pointerup', 205, 20));
    expect(connections).toEqual([]);
    await settle();
  });

  it('改接：选中的连线两端有把手（画在节点上面那层），拖到别的节点上松开调用 onReconnect', async () => {
    const reconnections: DiagramReconnection[] = [];
    const { canvas, edge } = render({
      nodes: [...nodes, { id: 'c', name: '二号工厂', x: 200, y: 120, width: 100, height: 40 }],
      selectable: true,
      connectable: true,
      onReconnect: (change: DiagramReconnection) => reconnections.push(change),
    });
    stage(canvas);
    edge('ab').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    const ends = canvas.querySelectorAll('[data-diagram-transient] [data-diagram-end]');
    expect([...ends].map((end) => end.getAttribute('data-diagram-end'))).toEqual(['from', 'to']);
    ends[1]!.dispatchEvent(at('pointerdown', 200, 20));
    await nextTick();
    // 拖动中把手收起来，捕获在画布上，拖动照常进行
    expect(canvas.querySelector('[data-diagram-end]')).toBeNull();
    canvas.dispatchEvent(at('pointermove', 205, 140));
    canvas.dispatchEvent(at('pointerup', 205, 140));
    expect(reconnections).toEqual([{ edge: 'ab', end: 'to', node: 'c', side: 'left' }]);
    await settle();
  });

  it('routing="orthogonal"：没给折线的连线绕开挡在中间的节点', () => {
    const blocked: Item[] = [
      { id: 'a', name: '甲', x: 0, y: 0, width: 100, height: 40 },
      { id: 'm', name: '挡路', x: 150, y: -20, width: 100, height: 80 },
      { id: 'b', name: '乙', x: 300, y: 0, width: 100, height: 40 },
    ];
    const { edge } = render({ nodes: blocked, routing: 'orthogonal' });
    const d = edge('ab').querySelector('path')!.getAttribute('d')!;
    const ys = [...d.matchAll(/[MLQ](-?[\d.]+) (-?[\d.]+)/g)].map((match) => Number(match[2]));
    // 从上面或下面绕过去：有一段在挡路节点的范围（-20 到 60）之外
    expect(ys.some((y) => y < -20 || y > 60)).toBe(true);
  });
});

describe('DiagramNode', () => {
  it('起始边、标题、说明、结束边按有无渲染；shape、dashed 加上对应样式并标在 data-diagram-shape 上', () => {
    const root = mount(() => (
      <>
        <DiagramNode start={<i>图</i>} title="财务复核" description="财务部" end="2" />
        <DiagramNode title="付款" shape="pill" dashed tone="success" />
      </>
    ));
    const [full, pill] = root.querySelectorAll<HTMLElement>('[data-diagram-shape]');
    expect(full!.textContent).toBe('图财务复核财务部2');
    expect(full!.getAttribute('data-diagram-shape')).toBe('rect');
    expect(pill!.children).toHaveLength(1);
    expect(pill!.getAttribute('data-diagram-shape')).toBe('pill');
    expect(hasStyles(pill!, diagramNodeStyles.pill)).toBe(true);
    expect(hasStyles(pill!, diagramNodeStyles.dashed)).toBe(true);
    expect(hasStyles(full!, diagramNodeStyles.dashed)).toBe(false);
  });
});

describe('DiagramLanes', () => {
  it('lanesExtent 累加各条泳道的高（没写 size 的用 laneSize）；泳道名按顺序画出来', () => {
    const lanes = [{ name: '申请人' }, { name: '财务', size: 160 }];
    expect(lanesExtent(lanes, { width: 800, x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 800,
      height: 280,
    });
    const root = mount(() => <DiagramLanes lanes={lanes} width={800} />);
    expect(root.textContent).toBe('申请人财务');
  });
});

describe('useDiagram', () => {
  function withController() {
    let diagram!: DiagramController;
    const root = mount(() =>
      h(
        defineComponent({
          setup() {
            diagram = useDiagram({ maxScale: 2 });
            return () => (
              <Diagram
                controller={diagram}
                nodes={nodes}
                getNodeLabel={(item: Item) => item.name}
                overlay={<DiagramControls />}
                aria-label="画布"
              >
                {(item: Item) => item.name}
              </Diagram>
            );
          },
        }),
      ),
    );
    const canvas = root.querySelector<HTMLElement>('[aria-label="画布"]')!;
    Object.defineProperty(canvas, 'clientWidth', { value: 400 });
    Object.defineProperty(canvas, 'clientHeight', { value: 200 });
    return { root, canvas, diagram: () => diagram };
  }

  it('fit 把内容放进视口并居中（四周留 48，不超过原大）；reveal 只在看不见时平移；toDiagram 换算坐标', () => {
    const { diagram } = withController();
    diagram().fit();
    // 内容 300 × 40，视口 400 × 200：宽方向 (400 - 96) / 300 ≈ 1.01，不超过原大取 1
    expect(diagram().scale).toBe(1);
    expect([diagram().x, diagram().y]).toEqual([50, 80]);
    diagram().reveal({ x: 0, y: 0, width: 100, height: 40 });
    expect([diagram().x, diagram().y]).toEqual([50, 80]);
    diagram().reveal({ x: 600, y: 0, width: 100, height: 40 });
    expect(diagram().x).toBe(400 - 24 - 700);
    expect(diagram().toDiagram(diagram().x + 10, diagram().y + 20)).toEqual({ x: 10, y: 20 });
  });

  it('DiagramControls：放大、缩小、比例按钮回到原大、适应画布；到了上限放大按钮不可用', async () => {
    const { root, diagram } = withController();
    const toolbar = root.querySelector('[role="toolbar"]')!;
    expect(toolbar.getAttribute('aria-label')).toBe('缩放');
    const [zoomOut, level, zoomIn] = toolbar.querySelectorAll('button');
    zoomIn!.click();
    await nextTick();
    expect(diagram().scale).toBeCloseTo(1.2);
    expect(level!.textContent).toBe('120%');
    zoomOut!.click();
    zoomOut!.click();
    await nextTick();
    expect(diagram().scale).toBeCloseTo(1 / 1.2);
    level!.click();
    await nextTick();
    expect(diagram().scale).toBe(1);
    diagram().zoomTo(2);
    await nextTick();
    expect(zoomIn!.disabled).toBe(true);
  });

  it('DiagramMinimap：每个节点一个方块，再加视口的框；读屏不念它', () => {
    const root = mount(() => (
      <Diagram
        nodes={nodes}
        getNodeLabel={(item: Item) => item.name}
        overlay={<DiagramMinimap />}
        aria-label="画布"
      />
    ));
    const minimap = root.querySelector('[data-diagram-overlay] > [aria-hidden="true"]')!;
    expect(minimap.querySelectorAll('rect')).toHaveLength(nodes.length + 1);
  });

  it('diagramToSvg：整张图放进 foreignObject，样式写在元素上、没有类名，去掉端口与选中的描边；没挂载时报错', async () => {
    expect(() => diagramToSvg(useDiagram())).toThrow('还没有挂载');
    const { diagram } = withController();
    await nextTick();
    const svg = diagramToSvg(diagram(), { padding: 10 });
    // 内容 300 × 40，四周各留 10
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="60"')).toBe(
      true,
    );
    expect(svg).toContain('<foreignObject');
    expect(svg).toContain('供应商甲');
    expect(svg).not.toContain('class="');
    expect(svg).not.toContain('data-diagram-port');
  });
});
