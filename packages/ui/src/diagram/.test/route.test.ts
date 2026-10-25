// 正交路由：选边、只走横竖、绕开中间的节点、拐弯少；一组连线的端口分配
import { describe, expect, it } from 'vitest';
import { rectsIntersect, type DiagramPoint, type DiagramRect } from '../geometry';
import { chooseSides, routeEdges, routeOrthogonal, simplify } from '../route';

const box = (x: number, y: number, width = 100, height = 40): DiagramRect => ({
  x,
  y,
  width,
  height,
});

/** 每一段都是横线或竖线 */
const orthogonal = (points: readonly DiagramPoint[]) =>
  points.every(
    (point, index) =>
      index === 0 || point.x === points[index - 1]!.x || point.y === points[index - 1]!.y,
  );

/** 折线有没有穿过矩形内部（取每段很细的包围盒） */
const hits = (points: readonly DiagramPoint[], rect: DiagramRect) =>
  points.some((point, index) => {
    if (index === 0) return false;
    const a = points[index - 1]!;
    const segment = {
      x: Math.min(a.x, point.x),
      y: Math.min(a.y, point.y),
      width: Math.max(Math.abs(a.x - point.x), 0.01),
      height: Math.max(Math.abs(a.y - point.y), 0.01),
    };
    return rectsIntersect(segment, rect);
  });

describe('routeOrthogonal', () => {
  it('chooseSides：横向隔得开左右连，否则上下连', () => {
    expect(chooseSides(box(0, 0), box(300, 20))).toEqual(['right', 'left']);
    expect(chooseSides(box(300, 0), box(0, 0))).toEqual(['left', 'right']);
    expect(chooseSides(box(0, 0), box(20, 200))).toEqual(['bottom', 'top']);
    expect(chooseSides(box(0, 200), box(20, 0))).toEqual(['top', 'bottom']);
  });

  it('同一行的两个节点：一条直线，从右边中点到左边中点', () => {
    expect(routeOrthogonal({ rect: box(0, 0) }, { rect: box(300, 0) })).toEqual([
      { x: 100, y: 20 },
      { x: 300, y: 20 },
    ]);
  });

  it('错开的两个节点：横竖两段以上，端点在边上', () => {
    const points = routeOrthogonal({ rect: box(0, 0) }, { rect: box(300, 160) });
    expect(orthogonal(points)).toBe(true);
    expect(points[0]).toEqual({ x: 100, y: 20 });
    expect(points[points.length - 1]).toEqual({ x: 300, y: 180 });
    expect(points.length).toBeLessThanOrEqual(4);
  });

  it('绕开挡在中间的节点', () => {
    const blocker = box(150, -20, 100, 80);
    const points = routeOrthogonal({ rect: box(0, 0) }, { rect: box(400, 0) }, [blocker]);
    expect(orthogonal(points)).toBe(true);
    expect(hits(points, blocker)).toBe(false);
    expect(points[0]).toEqual({ x: 100, y: 20 });
    expect(points[points.length - 1]).toEqual({ x: 400, y: 20 });
  });

  it('指定出、进的边：从下边出去，从上边进来（往回的线绕到上方）', () => {
    const points = routeOrthogonal(
      { rect: box(300, 0), side: 'top' },
      { rect: box(0, 0), side: 'top' },
    );
    expect(orthogonal(points)).toBe(true);
    expect(points[0]).toEqual({ x: 350, y: 0 });
    expect(points[points.length - 1]).toEqual({ x: 50, y: 0 });
    expect(Math.min(...points.map((point) => point.y))).toBeLessThan(0);
  });

  it('simplify 去掉共线的中间点与重复点', () => {
    expect(
      simplify([
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
  });
});

describe('routeEdges', () => {
  it('同一条边上的几条线按对端的位置均匀排开，各自绕开别的节点', () => {
    const nodes = [
      { id: 'hub', ...box(0, 100, 100, 90) },
      { id: 'a', ...box(300, 0) },
      { id: 'b', ...box(300, 125) },
      { id: 'c', ...box(300, 250) },
    ];
    const routes = routeEdges(nodes, [
      { id: 'to-c', from: 'hub', to: 'c' },
      { id: 'to-a', from: 'hub', to: 'a' },
      { id: 'to-b', from: 'hub', to: 'b' },
    ]);
    const starts = ['to-a', 'to-b', 'to-c'].map((id) => routes.get(id)![0]!);
    // 都从 hub 的右边出去，按 a、b、c 的上下顺序在 90 高的边上排开：四等分点
    expect(starts).toEqual([
      { x: 100, y: 122.5 },
      { x: 100, y: 145 },
      { x: 100, y: 167.5 },
    ]);
    for (const id of ['to-a', 'to-b', 'to-c']) expect(orthogonal(routes.get(id)!)).toBe(true);
    expect(routeEdges(nodes, [{ id: 'x', from: 'hub', to: 'missing' }]).size).toBe(0);
  });
});
