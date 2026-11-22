// DiagramPortNode：按行算节点的高和端口位置，卡片里的行和端口对得上；参数区里按下指针不拖节点
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Diagram } from '../Diagram';
import { DiagramPortNode, portNodeLayout, type PortNodePort } from '../DiagramPortNode';

const outputs: PortNodePort[] = [{ id: 'result', label: '结果', color: '#e8a33d' }];
const inputs: PortNodePort[] = [
  { id: 'a', label: '颜色' },
  { id: 'b', label: '系数' },
];

describe('portNodeLayout', () => {
  it('高 = 标题栏 + 每行 + 参数区 + 上下边框；端口的 at 是各行中心，输出在前、输入在后', () => {
    const layout = portNodeLayout({ outputs, inputs, header: 24, row: 20, body: 30, border: 1 });
    expect(layout.height).toBe(24 + 3 * 20 + 30 + 2);
    // 有参数区：节点里有控件
    expect(layout.controls).toBe(true);
    const center = (index: number) => (1 + 24 + (index + 0.5) * 20) / layout.height;
    expect(layout.ports).toEqual([
      { id: 'result', direction: 'out', at: center(0), label: '结果', color: '#e8a33d' },
      { id: 'a', direction: 'in', at: center(1), label: '颜色' },
      { id: 'b', direction: 'in', at: center(2), label: '系数' },
    ]);
  });

  it('默认标题栏 24、行 20、没有参数区；没有端口时只有标题栏', () => {
    expect(portNodeLayout({}).height).toBe(24 + 2);
    expect(portNodeLayout({}).ports).toEqual([]);
    expect(portNodeLayout({}).controls).toBe(false);
  });
});

describe('DiagramPortNode', () => {
  it('标题栏下先是输出（靠右）、再是输入；行对读屏隐藏；参数区里按下指针不往外传', () => {
    let reached = 0;
    const root = mount(() => (
      <div onPointerdown={() => reached++}>
        <DiagramPortNode title="乘" outputs={outputs} inputs={inputs}>
          <input aria-label="系数" />
        </DiagramPortNode>
      </div>
    ));
    const rows = [...root.querySelectorAll<HTMLElement>('[data-part="row"]')];
    expect(rows.map((row) => [row.textContent, row.dataset.direction])).toEqual([
      ['结果', 'out'],
      ['颜色', 'in'],
      ['系数', 'in'],
    ]);
    expect(rows.every((row) => row.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(root.querySelector('[data-part="header"]')!.textContent).toBe('乘');
    root.querySelector('input')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(reached).toBe(0);
    root
      .querySelector('[data-part="header"]')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(reached).toBe(1);
  });

  it('没有参数时没有参数区', () => {
    const root = mount(() => <DiagramPortNode title="输出" inputs={inputs} />);
    expect(root.querySelector('[data-part="body"]')).toBeNull();
  });

  it('节点数据带 controls（里面有控件）时节点框是 group、选中用 aria-current；别的节点照旧是按钮', () => {
    const root = mount(() => (
      <Diagram
        nodes={[
          { id: 'a', x: 0, y: 0, width: 100, height: 60, controls: true },
          { id: 'b', x: 200, y: 0, width: 100, height: 60 },
        ]}
        edges={[]}
        selectable
        _selected={{ nodes: ['a'], edges: [] }}
        getNodeLabel={(node: { id: string }) => node.id}
        aria-label="图"
      />
    ));
    const a = root.querySelector('[data-node="a"]')!;
    const b = root.querySelector('[data-node="b"]')!;
    expect([
      a.getAttribute('role'),
      a.getAttribute('aria-current'),
      a.hasAttribute('aria-pressed'),
    ]).toEqual(['group', 'true', false]);
    expect([b.getAttribute('role'), b.getAttribute('aria-pressed')]).toEqual(['button', 'false']);
  });
});
