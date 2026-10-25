// 组合图与双轴：刻度对齐的计算、数据表与单位按各自的轴；百分比堆叠时轴上方不写单位（绘图见文档站的浏览器测试）
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { alignedTicks, niceStep } from '../axis-ticks';
import { BarChart } from '../BarChart';
import { ComboChart } from '../ComboChart';

describe('alignedTicks', () => {
  it('好看的步长：1、2、2.5、5 乘 10 的幂，不小于原值', () => {
    expect([0.7, 1, 1.3, 2.2, 3, 7, 12, 0.031].map(niceStep)).toEqual([
      1, 1, 2, 2.5, 5, 10, 20, 0.05,
    ]);
  });

  it('第二轴与主轴同样多的格，范围盖住数据，换算两端对齐', () => {
    const axes = alignedTicks([0, 236, 210], [0.72, 1.12]);
    expect(axes.primary.domain).toEqual([0, 250]);
    expect(axes.primary.ticks).toEqual([0, 50, 100, 150, 200, 250]);
    expect(axes.secondary.ticks).toEqual([0, 0.25, 0.5, 0.75, 1, 1.25]);
    expect(axes.toPrimary(1.25)).toBe(250);
    expect(axes.toPrimary(0.5)).toBe(100);
  });

  it('第二轴的起点向下取整盖不住最大值时换下一档步长', () => {
    const axes = alignedTicks([0, 100], [0, 99]);
    const intervals = axes.primary.ticks.length - 1;
    expect(axes.secondary.ticks).toHaveLength(intervals + 1);
    expect(axes.secondary.domain[1]).toBeGreaterThanOrEqual(99);
  });
});

describe('ComboChart', () => {
  const months = [
    { month: '1月', planned: 120, rate: 0.72 },
    { month: '2月', planned: 150, rate: 0.945 },
  ];

  it('数据表按各自的轴：第二轴的系列用它的格式与单位；第二轴的单位写在右上方', () => {
    const root = mount(() => (
      <ComboChart
        aria-label="销售与完成率"
        data={months}
        index="month"
        series={[
          { key: 'planned', label: '计划销售' },
          { key: 'rate', label: '完成率', type: 'line', axis: 'secondary' },
        ]}
        unit="万元"
        secondaryFormat={{ style: 'percent', maximumFractionDigits: 1 }}
        secondaryUnit="比率"
      />
    ));
    const figure = root.querySelector('[role="figure"]')!;
    expect([...figure.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '类目',
      '计划销售（万元）',
      '完成率（比率）',
    ]);
    expect([...figure.querySelectorAll('tbody tr')].map((tr) => tr.textContent)).toEqual([
      '1月12072%',
      '2月15094.5%',
    ]);
    const header = figure.firstElementChild!;
    expect(header.firstElementChild!.textContent).toBe('万元');
    expect(header.lastElementChild!.textContent).toBe('比率');
  });
});

describe('百分比堆叠', () => {
  it('数值轴是占比：轴上方不写单位，数据表仍是原值', () => {
    const root = mount(() => (
      <BarChart
        aria-label="成本构成"
        data={[{ quarter: 'Q1', material: 120, labor: 80 }]}
        index="quarter"
        series={[
          { key: 'material', label: '材料' },
          { key: 'labor', label: '人工' },
        ]}
        unit="万元"
        stacked="percent"
      />
    ));
    const figure = root.querySelector('[role="figure"]')!;
    expect(figure.firstElementChild!.textContent).not.toContain('万元');
    expect(figure.querySelector('tbody tr')!.textContent).toBe('Q112080');
  });
});
