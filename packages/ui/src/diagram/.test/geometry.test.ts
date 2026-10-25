// 画布的几何：边界、相交与包含、边框上的点、折线的路径与中点、箭头与线尾让出箭头
import { describe, expect, it } from 'vitest';
import {
  arrowHead,
  borderPoint,
  boundsOf,
  polylineMidpoint,
  polylinePath,
  rectContains,
  rectFromCorners,
  rectsIntersect,
  trimEnd,
} from '../geometry';

describe('矩形', () => {
  it('boundsOf 包住全部矩形与点；什么都没有时 undefined', () => {
    expect(boundsOf([])).toBeUndefined();
    expect(
      boundsOf(
        [
          { x: 10, y: 10, width: 20, height: 10 },
          { x: -5, y: 30, width: 10, height: 10 },
        ],
        [{ x: 50, y: 0 }],
      ),
    ).toEqual({ x: -5, y: 0, width: 55, height: 40 });
  });

  it('rectFromCorners 与两个角点的先后无关', () => {
    expect(rectFromCorners({ x: 30, y: 5 }, { x: 10, y: 25 })).toEqual({
      x: 10,
      y: 5,
      width: 20,
      height: 20,
    });
  });

  it('相交：只碰到边不算；包含：边重合也算', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    expect(rectsIntersect(a, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(rectsIntersect(a, { x: 10, y: 0, width: 5, height: 5 })).toBe(false);
    expect(rectContains(a, { x: 0, y: 0, width: 10, height: 10 })).toBe(true);
    expect(rectContains(a, { x: 5, y: 5, width: 10, height: 2 })).toBe(false);
  });

  it('borderPoint：从中心朝目标的射线落在边框上', () => {
    const box = { x: 0, y: 0, width: 100, height: 40 };
    expect(borderPoint(box, { x: 300, y: 20 })).toEqual({ x: 100, y: 20 });
    expect(borderPoint(box, { x: 50, y: -100 })).toEqual({ x: 50, y: 0 });
    // 斜着出去：先碰到上下边（高度比宽度小）
    expect(borderPoint(box, { x: 90, y: 60 })).toEqual({ x: 70, y: 40 });
    expect(borderPoint(box, { x: 50, y: 20 })).toEqual({ x: 50, y: 20 });
  });
});

describe('折线', () => {
  const corner = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
  ];

  it('polylinePath：直角写成 L，有圆角时拐角写成二次曲线，圆角不超过相邻两段的一半', () => {
    expect(polylinePath(corner)).toBe('M0 0 L100 0 L100 50');
    expect(polylinePath(corner, 6)).toBe('M0 0 L94 0 Q100 0 100 6 L100 50');
    const short = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 40 },
    ];
    expect(polylinePath(short, 10)).toBe('M0 0 L2 0 Q4 0 4 2 L4 40');
    expect(polylinePath([])).toBe('');
  });

  it('polylineMidpoint：走到总长一半的点', () => {
    expect(polylineMidpoint(corner)).toEqual({ x: 75, y: 0 });
    expect(polylineMidpoint([{ x: 3, y: 4 }])).toEqual({ x: 3, y: 4 });
  });

  it('arrowHead：尖端在终点，沿最后一段的方向；终点重复时往前找方向，没有方向时是空串', () => {
    expect(arrowHead(corner, 8)).toBe('100,50 104,42 96,42');
    expect(arrowHead([...corner, { x: 100, y: 50 }], 8)).toBe('100,50 104,42 96,42');
    expect(arrowHead([{ x: 1, y: 1 }])).toBe('');
  });

  it('trimEnd：最后一段让出箭头的长度；段比它短时不动', () => {
    expect(trimEnd(corner, 6)).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 44 },
    ]);
    expect(trimEnd(corner, 80)).toEqual(corner);
  });
});
