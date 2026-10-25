// Diagram：节点与连线的渲染与读屏、点选与加选、框选、键盘（Esc、Ctrl+A、Enter）、_selected 双向绑定、
// 控制器的适应内容与坐标换算、DiagramControls；真实的拖动与焦点见浏览器测试
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { useDiagram, type DiagramController } from '../controller';
import {
  Diagram,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramSelection,
} from '../Diagram';
import { DiagramControls } from '../DiagramControls';

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
});
