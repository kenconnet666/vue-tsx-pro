// 比例尺、刻度、曲线、扇区与堆叠：结果与 d3 的同名算法一致（对照的数值取自 d3-array、d3-scale、d3-shape 的测试与文档）
import { describe, expect, it } from 'vitest';
import { linearScale, linearTicks, niceDomain, tickIncrement, timeTicks } from '../scale';
import { arcPath, areaPath, barPath, linePath, ribbonPath } from '../shape';
import { stackValues } from '../stack';
import { estimateTextWidth, truncateText } from '../text-size';

describe('比例尺与刻度', () => {
  it('线性比例尺：数值换坐标、坐标换回数值；范围两端相同时取中间', () => {
    const y = linearScale([0, 250], [200, 0]);
    expect(y(0)).toBe(200);
    expect(y(125)).toBe(100);
    expect(y.invert(50)).toBe(187.5);
    expect(linearScale([3, 3], [0, 100])(3)).toBe(50);
  });

  it('好看的刻度：1、2、5 乘 10 的幂，小数不带浮点误差', () => {
    expect(linearTicks(0, 250, 5)).toEqual([0, 50, 100, 150, 200, 250]);
    expect(linearTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(linearTicks(-0.3, 0.3, 6)).toEqual([-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]);
    expect(linearTicks(1, 1, 5)).toEqual([1]);
    expect(tickIncrement(0, 10, 5)).toBe(2);
    expect(tickIncrement(0, 1, 5)).toBe(-5);
  });

  it('范围扩到刻度上（同 d3 的 nice）', () => {
    expect(niceDomain([0, 236], 5)).toEqual([0, 250]);
    expect(niceDomain([-12.3, 87.1], 5)).toEqual([-20, 100]);
    expect(niceDomain([0.12, 0.93], 5)).toEqual([0, 1]);
    expect(niceDomain([5, 1], 5)).toEqual([1, 5]);
  });

  it('时间刻度：跨几个月取各月 1 日，跨几天取每天 0 点，跨几小时取整点', () => {
    const at = (...parts: [number, number, number, number?]) =>
      new Date(parts[0], parts[1], parts[2], parts[3] ?? 0).getTime();
    const months = timeTicks(at(2026, 0, 15), at(2026, 6, 20), 6);
    expect(months.map((date) => [date.getMonth(), date.getDate()])).toEqual([
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
    ]);
    const days = timeTicks(at(2026, 2, 1, 6), at(2026, 2, 7), 6);
    expect(days.map((date) => [date.getDate(), date.getHours()])).toEqual([
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 0],
      [7, 0],
    ]);
    const hours = timeTicks(at(2026, 2, 1, 9), at(2026, 2, 1, 15), 6);
    expect(hours.map((date) => date.getHours())).toEqual([9, 10, 11, 12, 13, 14, 15]);
  });
});

describe('路径', () => {
  it('折线、阶梯；平滑曲线经过每个点，端点的切线不越过数据', () => {
    const points = [
      [0, 10],
      [10, 20],
      [20, 0],
    ] as const;
    expect(linePath(points)).toBe('M0,10L10,20L20,0');
    expect(linePath(points, 'step')).toBe('M0,10L10,10L10,20L20,20L20,0');
    // 中间的点是极大值：两侧斜率异号，切线水平（控制点与它同高）
    expect(linePath(points, 'monotone')).toBe(
      'M0,10C3.333,15,6.667,20,10,20C13.333,20,16.667,10,20,0',
    );
    // 两个点的平滑曲线退化成直线
    expect(linePath(points.slice(0, 2), 'monotone')).toBe('M0,10L10,20');
  });

  it('面积：上沿从左到右、下沿从右到左，闭合', () => {
    expect(
      areaPath(
        [
          [0, 5],
          [10, 2],
        ],
        [
          [0, 10],
          [10, 10],
        ],
      ),
    ).toBe('M0,5L10,2L10,10L0,10Z');
  });

  it('柱子：只有柱顶一端是圆角，圆角不超过宽的一半；为 0 时是矩形', () => {
    expect(barPath(0, 0, 10, 20, 0, 'top')).toBe('M0,0H10V20H0Z');
    expect(barPath(0, 0, 10, 20, 4, 'top')).toBe('M0,20V4A4,4,0,0,1,4,0H6A4,4,0,0,1,10,4V20Z');
    expect(barPath(0, 0, 4, 20, 8, 'top')).toContain('A2,2');
  });

  it('扇区：整圈是两段弧；有圆角时四个角各一段小弧；饼图的扇形回到圆心', () => {
    expect(arcPath({ inner: 0, outer: 10, start: 0, end: Math.PI * 2 })).toBe(
      'M0,-10A10,10,0,0,1,0,10A10,10,0,0,1,0,-10Z',
    );
    const rounded = arcPath({ inner: 60, outer: 90, start: 0, end: Math.PI / 2, corner: 3 });
    expect(rounded.match(/A3,3/g)).toHaveLength(4);
    expect(arcPath({ inner: 0, outer: 10, start: 0, end: Math.PI / 2 })).toBe(
      'M0,-10A10,10,0,0,1,10,0L0,0Z',
    );
    expect(arcPath({ inner: 5, outer: 10, start: 1, end: 1 })).toBe('');
  });

  it('弦：两端各一段弧，中间经圆心的二次曲线', () => {
    const d = ribbonPath(10, [0, Math.PI / 2], [Math.PI, (Math.PI * 3) / 2]);
    expect(d.startsWith('M0,-10A10,10,0,0,1,10,0Q0,0,0,10A10,10,0,0,1,-10,0Q0,0,0,-10Z')).toBe(
      true,
    );
  });
});

describe('堆叠与文字宽度', () => {
  it('正值往上叠、负值往下叠；空值高度为 0、停在正向累计处', () => {
    const [first, second, third] = stackValues([
      [3, 5, 2],
      [2, -1, undefined],
      [-4, 1, 1],
    ]);
    expect(first!.map(({ low, high }) => [low, high])).toEqual([
      [0, 3],
      [0, 5],
      [0, 2],
    ]);
    expect(second!.map(({ low, high }) => [low, high])).toEqual([
      [3, 5],
      [-1, 0],
      [2, 2],
    ]);
    expect(third!.map(({ low, high }) => [low, high])).toEqual([
      [-4, 0],
      [5, 6],
      [2, 3],
    ]);
  });

  it('中日韩文字按一个字号宽、其余按 0.6 个；放不下时截短加省略号', () => {
    expect(estimateTextWidth('华东 AB', 10)).toBe(10 * 2 + 6 * 3);
    expect(truncateText('短', 100)).toBe('短');
    expect(truncateText('一二三四五六七八', 60, 12)).toBe('一二三四…');
  });
});
