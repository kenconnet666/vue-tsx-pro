// TimelineChart：读屏的数据表（行、系列、起止与天数，只有日期的结束含这一天）、图例隐藏系列、高度按行数
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { TimelineChart } from '../TimelineChart';

const items = [
  { row: '支架换材', series: 'plan', start: '2026-03-01', end: '2026-03-10' },
  { row: '支架换材', series: 'actual', start: '2026-03-03', end: '2026-03-12' },
  { row: '卡箍国产化', series: 'actual', start: '2026-04-01T08:00', end: '2026-04-02T20:00' },
];
const series = [
  { key: 'plan', label: '计划', variant: 'track' as const },
  { key: 'actual', label: '实际' },
];

describe('TimelineChart', () => {
  it('数据表每段一行：系列、开始、结束、天数；高度是行数 × 行高加时间轴', () => {
    const root = mount(() => (
      <TimelineChart aria-label="进度" items={items} series={series} rowHeight={30} />
    ));
    const figure = root.querySelector('[role="figure"]')!;
    expect([...figure.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '类目',
      '系列',
      '开始',
      '结束',
      '时长',
    ]);
    const rows = [...figure.querySelectorAll('tbody tr')].map((tr) =>
      [...tr.children].map((cell) => cell.textContent),
    );
    // 计划（轨道）排在同一行的实际前面；只有日期的结束含这一天：3 月 1 日到 10 日是 10 天
    expect(rows[0]![0]).toBe('支架换材');
    expect(rows[0]![1]).toBe('计划');
    expect(rows[0]![4]).toBe('10 天');
    expect(rows[1]![1]).toBe('实际');
    expect(rows[2]![0]).toBe('卡箍国产化');
    expect(rows[2]![4]).toBe('2 天');
    // 绘图区的高度（动态样式：可能写在类里，也可能在行内变量里）
    expect(
      [...figure.querySelectorAll('div')].some((el) => /height: ?96px/.test(styleTextOf(el))),
    ).toBe(true);
  });

  it('点图例隐藏一个系列：数据表里只剩另一个系列', async () => {
    const root = mount(() => <TimelineChart aria-label="进度" items={items} series={series} />);
    const plan = root.querySelector<HTMLButtonElement>('[role="group"] button')!;
    plan.click();
    await nextTick();
    const labels = [...root.querySelectorAll('tbody tr')].map((tr) => tr.children[1]!.textContent);
    expect(labels).toEqual(['实际', '实际']);
    expect(plan.getAttribute('aria-pressed')).toBe('false');
  });

  it('没有数据时显示空状态', () => {
    const root = mount(() => <TimelineChart aria-label="进度" items={[]} />);
    expect(root.textContent).toContain('暂无数据');
    expect(root.querySelector('table')).toBeNull();
  });
});
