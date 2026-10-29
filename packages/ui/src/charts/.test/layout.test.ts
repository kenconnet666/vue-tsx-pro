// 布局算法：桑基图分列与守恒、弦图的角度、矩形树图的面积与不重叠、网络图各种布局的结构
import { describe, expect, it } from 'vitest';
import { chordLayout } from '../layout/chord';
import { graphLayout } from '../layout/graph';
import { sankeyLayout } from '../layout/sankey';
import { groupTree, treemapLayout, type TreemapNode } from '../layout/treemap';

describe('sankeyLayout', () => {
  const ids = ['a', 'b', 'c', 'd'];
  const links = [
    { source: 'a', target: 'b', value: 30 },
    { source: 'a', target: 'c', value: 10 },
    { source: 'b', target: 'd', value: 30 },
    { source: 'c', target: 'd', value: 10 },
  ];

  it('按离起点的远近分列，节点高度按流量，同一列不重叠、不出界', () => {
    const { nodes } = sankeyLayout(ids, links, {
      width: 300,
      height: 200,
      nodeWidth: 10,
      nodePadding: 10,
    });
    const [a, b, c, d] = nodes;
    expect([a, b, c, d].map((node) => node!.layer)).toEqual([0, 1, 1, 2]);
    expect(a!.x0).toBe(0);
    expect(d!.x1).toBe(300);
    expect(a!.value).toBe(40);
    // 高度与流量成比例：b 是 c 的三倍
    expect((b!.y1 - b!.y0) / (c!.y1 - c!.y0)).toBeCloseTo(3, 5);
    const [upper, lower] = b!.y0 < c!.y0 ? [b!, c!] : [c!, b!];
    expect(lower.y0 - upper.y1).toBeGreaterThanOrEqual(10 - 1e-6);
    for (const node of nodes) {
      expect(node.y0).toBeGreaterThanOrEqual(-1e-6);
      expect(node.y1).toBeLessThanOrEqual(200 + 1e-6);
    }
  });

  it('带子的粗细按流量，在节点上依次排开：流出的总粗细等于节点的高', () => {
    const { nodes, links: laid } = sankeyLayout(ids, links, {
      width: 300,
      height: 200,
      nodeWidth: 10,
      nodePadding: 10,
    });
    const a = nodes[0]!;
    const out = laid.filter((link) => link.source === a);
    expect(out.reduce((sum, link) => sum + link.width, 0)).toBeCloseTo(a.y1 - a.y0, 6);
    expect(Math.min(...out.map((link) => link.y0 - link.width / 2))).toBeCloseTo(a.y0, 6);
  });

  it('靠右：只有流出的节点排到离终点最近的那一列；值不是正数、指向不存在节点的流向不画', () => {
    const { nodes, links: laid } = sankeyLayout(
      ['a', 'b', 'c', 'x'],
      [
        { source: 'a', target: 'b', value: 5 },
        { source: 'b', target: 'c', value: 5 },
        { source: 'x', target: 'c', value: 2 },
        { source: 'x', target: 'ghost', value: 2 },
        { source: 'a', target: 'c', value: 0 },
      ],
      { width: 100, height: 100, nodeWidth: 10, nodePadding: 5, align: 'right' },
    );
    expect(nodes.find((node) => node.id === 'x')!.layer).toBe(1);
    expect(laid).toHaveLength(3);
  });
});

describe('chordLayout', () => {
  it('弧长按流入加流出，弧之间留空；弦的两端各在起点、终点的弧上', () => {
    const { groups, chords } = chordLayout(
      3,
      [
        { source: 0, target: 1, value: 10 },
        { source: 1, target: 2, value: 5 },
        { source: 2, target: 0, value: 5 },
      ],
      0.1,
    );
    const span = (group: { start: number; end: number }) => group.end - group.start;
    expect(span(groups[0]!) / span(groups[2]!)).toBeCloseTo(15 / 10, 6);
    expect(groups[1]!.start - groups[0]!.end).toBeCloseTo(0.1, 6);
    expect(groups[2]!.end + 0.1).toBeCloseTo(Math.PI * 2, 6);
    const [first] = chords;
    expect(first!.source[0]).toBeGreaterThanOrEqual(groups[0]!.start);
    expect(first!.source[1]).toBeLessThanOrEqual(groups[0]!.end + 1e-9);
    expect(first!.target[0]).toBeGreaterThanOrEqual(groups[1]!.start);
    expect(first!.source[1] - first!.source[0]).toBeCloseTo(first!.target[1] - first!.target[0], 9);
  });
});

describe('treemap', () => {
  const rows = [
    { region: '华东', supplier: '甲', amount: 60 },
    { region: '华东', supplier: '乙', amount: 30 },
    { region: '华南', supplier: '丙', amount: 10 },
    { region: '华南', supplier: '丁', amount: 0 },
  ];

  it('明细按字段逐级分组：分组的数值是子节点之和，按数值从大到小；不是正数的明细不要', () => {
    const root = groupTree(rows, [(row) => row.region, (row) => row.supplier], (row) => row.amount);
    expect(root.value).toBe(100);
    expect(root.children!.map((node) => [node.key, node.value])).toEqual([
      ['华东', 90],
      ['华南', 10],
    ]);
    expect(root.children![1]!.children).toHaveLength(1);
    expect(root.children![0]!.children![0]!.data).toBe(rows[0]);
  });

  it('面积与数值成比例、铺满区域；块与块之间留出 padding、互不重叠', () => {
    const root = groupTree(rows, [(row) => row.region, (row) => row.supplier], (row) => row.amount);
    treemapLayout(root, { width: 200, height: 100 });
    const leaves: TreemapNode<(typeof rows)[number]>[] = [];
    const walk = (node: TreemapNode<(typeof rows)[number]>) =>
      node.children ? node.children.forEach(walk) : leaves.push(node);
    walk(root);
    const area = (node: TreemapNode<unknown>) => (node.x1 - node.x0) * (node.y1 - node.y0);
    expect(leaves.reduce((sum, node) => sum + area(node), 0)).toBeCloseTo(200 * 100, 6);
    expect(area(leaves[0]!) / area(leaves[1]!)).toBeCloseTo(2, 6);

    const padded = groupTree(
      rows,
      [(row) => row.region, (row) => row.supplier],
      (row) => row.amount,
    );
    treemapLayout(padded, { width: 200, height: 100, padding: 4 });
    const boxes: TreemapNode<unknown>[] = [];
    const collect = (node: TreemapNode<unknown>) =>
      node.children ? node.children.forEach(collect) : boxes.push(node);
    collect(padded);
    for (const [i, a] of boxes.entries())
      for (const b of boxes.slice(i + 1)) {
        const apart = a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
        expect(apart).toBe(true);
      }
  });
});

describe('graphLayout', () => {
  const nodes = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, width: 40, height: 40 }));
  const links = [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' },
    { source: 'b', target: 'd' },
    { source: 'c', target: 'd' },
    { source: 'd', target: 'e' },
    // 环：不影响分层
    { source: 'e', target: 'a' },
  ];

  it('分层：沿方向一层层排开，连线从前一层指向后一层；同一层不重叠', () => {
    const lr = graphLayout(nodes, links, { layout: 'layered', direction: 'LR' });
    const x = (id: string) => lr.get(id)!.x;
    expect(x('a')).toBeLessThan(x('b'));
    expect(x('b')).toBe(x('c'));
    expect(x('c')).toBeLessThan(x('d'));
    expect(x('d')).toBeLessThan(x('e'));
    expect(Math.abs(lr.get('b')!.y - lr.get('c')!.y)).toBeGreaterThanOrEqual(40);
    const tb = graphLayout(nodes, links, { layout: 'layered', direction: 'TB' });
    expect(tb.get('a')!.y).toBeLessThan(tb.get('e')!.y);
  });

  it('力导向：结果每次相同，节点之间不重叠；环形：到圆心的距离都相同', () => {
    const first = graphLayout(nodes, links, { layout: 'force' });
    const second = graphLayout(nodes, links, { layout: 'force' });
    expect([...first.values()]).toEqual([...second.values()]);
    const points = [...first.values()];
    for (const [i, p] of points.entries())
      for (const q of points.slice(i + 1))
        expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(20);
    const ring = [...graphLayout(nodes, links, { layout: 'circular' }).values()];
    const radii = ring.map((p) => Math.hypot(p.x, p.y));
    for (const r of radii) expect(r).toBeCloseTo(radii[0]!, 6);
  });

  it('分列：每组一列，按 groups 的顺序', () => {
    const grouped = nodes.map((node, index) => ({ ...node, group: index < 2 ? 'g2' : 'g1' }));
    const columns = graphLayout(grouped, links, { layout: 'parallel', groups: ['g1', 'g2'] });
    expect(columns.get('c')!.x).toBeLessThan(columns.get('a')!.x);
    expect(columns.get('a')!.x).toBe(columns.get('b')!.x);
  });
});
