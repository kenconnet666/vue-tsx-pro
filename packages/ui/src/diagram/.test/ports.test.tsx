// 节点图：有名字的端口的位置、连线接在端口上并画成贝塞尔曲线、能不能连按端口判断
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Diagram, type DiagramEdgeItem, type DiagramNodeItem } from '../Diagram';
import { bezierRoute, portPoint, type DiagramPortItem } from '../ports';

const noise: DiagramNodeItem = {
  id: 'noise',
  x: 0,
  y: 0,
  width: 100,
  height: 60,
  ports: [
    { id: 'uv', direction: 'in' },
    { id: 'value', direction: 'out', color: '#9aa0a6' },
  ],
};
const output: DiagramNodeItem = {
  id: 'output',
  x: 300,
  y: 0,
  width: 100,
  height: 90,
  ports: [
    { id: 'baseColor', direction: 'in' },
    { id: 'roughness', direction: 'in' },
    { id: 'metalness', direction: 'in', at: 0.9 },
  ],
};

describe('端口的几何', () => {
  it('输入默认在左、输出在右；同一边没给 at 的均匀排开，给了 at 的按它', () => {
    expect(portPoint(noise, noise.ports![0]!)).toEqual({ x: 0, y: 30 });
    expect(portPoint(noise, noise.ports![1]!)).toEqual({ x: 100, y: 30 });
    expect(portPoint(output, output.ports![0]!)).toEqual({ x: 300, y: 30 });
    expect(portPoint(output, output.ports![1]!)).toEqual({ x: 300, y: 60 });
    expect(portPoint(output, output.ports![2]!)).toEqual({ x: 300, y: 81 });
  });

  it('贝塞尔曲线的控制点沿两端的朝向伸出去', () => {
    const [p0, c1, c2, p3] = bezierRoute({ x: 0, y: 0 }, 'right', { x: 200, y: 0 }, 'left');
    expect(p0).toEqual({ x: 0, y: 0 });
    expect(c1).toEqual({ x: 100, y: 0 });
    expect(c2).toEqual({ x: 100, y: 0 });
    expect(p3).toEqual({ x: 200, y: 0 });
  });
});

describe('Diagram 的端口', () => {
  it('端口一直画着（带颜色、名称）；连线接在端口上、画成曲线、没有箭头', () => {
    const edges: DiagramEdgeItem[] = [
      { id: 'e', from: 'noise', fromPort: 'value', to: 'output', toPort: 'roughness' },
    ];
    const root = mount(() => (
      <Diagram
        nodes={[noise, output]}
        edges={edges}
        routing="bezier"
        getNodeLabel={(node) => node.id}
        aria-label="材质"
      />
    ));
    const ports = root.querySelectorAll('[data-diagram-port-id]');
    expect(ports.length).toBe(5);
    const value = root.querySelector<HTMLElement>(
      '[data-node="noise"] [data-diagram-port-id="value"]',
    )!;
    expect(value.getAttribute('data-diagram-port-direction')).toBe('out');
    const line = root.querySelector('[data-part="edgeLine"]')!;
    // 从 noise 的输出端口（100, 30）出发、落到 output 的第二个输入端口（300, 60）；控制点在两边水平伸出去
    expect(line.getAttribute('d')).toMatch(/^M100,30C[\d.]+,30 [\d.]+,60 300,60$/);
    expect(root.querySelector('[data-part="edgeArrow"]')).toBeNull();
  });

  it('canConnect 收到两个端口', () => {
    const seen: [DiagramPortItem | undefined, DiagramPortItem | undefined][] = [];
    mount(() => (
      <Diagram
        nodes={[noise, output]}
        connectable
        canConnect={(_from, _to, ports) => {
          seen.push([ports?.from, ports?.to]);
          return true;
        }}
        getNodeLabel={(node) => node.id}
        aria-label="材质"
      />
    ));
    // 只有拖动时才问；这里只确认签名能接两个端口（类型）
    expect(seen).toEqual([]);
  });
});
