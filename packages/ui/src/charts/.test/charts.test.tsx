// 图表：系列配色、图例、读屏的数据表、空与加载状态（绘图本身见文档站的浏览器测试）
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { colors } from '../../config/theme/tokens.stylex';
import { mount } from '../../utils/.test/mount';
import { AreaChart } from '../AreaChart';
import { BarChart } from '../BarChart';
import { ChordChart } from '../ChordChart';
import { DonutChart } from '../DonutChart';
import { flowData, resolveFlowNodes } from '../flow';
import { LineChart } from '../LineChart';
import { SankeyChart } from '../SankeyChart';
import { ScatterChart } from '../ScatterChart';
import { resolveColor, resolveSeries, seriesNumber, seriesValue } from '../series';

interface Row {
  name: string;
  planned: number;
  actual: number | null;
}

const rows: Row[] = [
  { name: '项目 01', planned: 272, actual: 438.4 },
  { name: '项目 02', planned: 280.5, actual: null },
];
const series = [
  { key: 'planned', label: '预期降本' },
  { key: 'actual', label: '实际降本' },
] as const;

describe('系列', () => {
  it('默认按顺序取图表色板；可以写色板名或任意 CSS 颜色', () => {
    const resolved = resolveSeries<Row>([
      { key: 'planned', label: 'a' },
      { key: 'actual', label: 'b' },
      { key: 'planned', label: 'c', color: 'chart5' },
      { key: 'actual', label: 'd', color: '#e5484d' },
    ]);
    expect(resolved.map((item) => item.color)).toEqual([
      colors.chart1,
      colors.chart2,
      colors.chart5,
      '#e5484d',
    ]);
  });

  it('空值与非数字取不到值（不画、不当成 0）', () => {
    expect(seriesValue(rows[0]!, 'actual')).toBe(438.4);
    expect(seriesValue(rows[1]!, 'actual')).toBeUndefined();
    expect(seriesNumber({ v: Number.NaN }, 'v')).toBeUndefined();
    expect(seriesNumber({ v: new Decimal(Number.NaN) }, 'v')).toBeUndefined();
  });

  it('值可以是 bigint、Decimal：画图转成 number，数据表按原值格式化、不丢精度', () => {
    const ledger = [
      {
        month: '9 月',
        revenue: new Decimal('12345678901234567.89'),
        orders: 9_007_199_254_740_993n,
      },
    ];
    expect(seriesNumber(ledger[0]!, 'revenue')).toBe(12345678901234568);
    expect(seriesValue(ledger[0]!, 'orders')).toBe(9_007_199_254_740_993n);
    const root = mount(() => (
      <BarChart
        aria-label="营收"
        data={ledger}
        index="month"
        series={[
          { key: 'revenue', label: '营收' },
          { key: 'orders', label: '订单' },
        ]}
      />
    ));
    expect([...root.querySelectorAll('tbody td')].map((td) => td.textContent)).toEqual([
      '12,345,678,901,234,567.89',
      '9,007,199,254,740,993',
    ]);
  });
});

describe('BarChart、LineChart', () => {
  it('外层是带名称的 figure；单位显示在上方；读屏的数据表按语言格式化，空值写“—”', () => {
    const root = mount(() => (
      <BarChart
        aria-label="项目降本金额"
        data={rows}
        index="name"
        series={[...series]}
        unit="万元"
      />
    ));
    const figure = root.querySelector('[role="figure"]')!;
    expect(figure.getAttribute('aria-label')).toBe('项目降本金额');
    expect(figure.textContent).toContain('万元');
    const table = figure.querySelector('table')!;
    expect([...table.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '类目',
      '预期降本（万元）',
      '实际降本（万元）',
    ]);
    expect([...table.querySelectorAll('tbody tr')].map((tr) => tr.textContent)).toEqual([
      '项目 01272438.4',
      '项目 02280.5—',
    ]);
    // 绘图区只给眼睛看
    expect(figure.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('图例：多于一个系列时显示，点一下隐藏系列（aria-pressed、写回 hiddenSeries）', async () => {
    const hidden = shallowRef<string[]>([]);
    const root = mount(() => (
      <LineChart
        aria-label="趋势"
        data={rows}
        index="name"
        series={[...series]}
        hiddenSeries={hidden.value}
        {...{ 'onUpdate:hiddenSeries': (next: string[]) => (hidden.value = next) }}
      />
    ));
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[role="group"] button')];
    expect(
      buttons.map((button) => [button.textContent, button.getAttribute('aria-pressed')]),
    ).toEqual([
      ['预期降本', 'true'],
      ['实际降本', 'true'],
    ]);
    buttons[1]!.click();
    await nextTick();
    expect(hidden.value).toEqual(['actual']);
    expect(buttons[1]!.getAttribute('aria-pressed')).toBe('false');
    buttons[1]!.click();
    await nextTick();
    expect(hidden.value).toEqual([]);
  });

  it('只有一个系列时不显示图例；legend 可以强制显示', () => {
    const one = [{ key: 'planned', label: '预期降本' }] as const;
    const root = mount(() => (
      <>
        <BarChart aria-label="a" data={rows} index="name" series={[...one]} />
        <BarChart aria-label="b" data={rows} index="name" series={[...one]} legend />
      </>
    ));
    // Unovis 画出的 svg 自己也是 role="figure"：按名称找外层
    expect(root.querySelector('[aria-label="a"] [role="group"]')).toBeNull();
    expect(root.querySelector('[aria-label="b"] [role="group"]')).not.toBeNull();
  });

  it('没有数据时显示“暂无数据”、没有数据表；加载中不显示空状态', () => {
    const root = mount(() => (
      <>
        <BarChart aria-label="空" data={[] as Row[]} index="name" series={[...series]} />
        <BarChart aria-label="加载" data={[] as Row[]} index="name" series={[...series]} loading />
      </>
    ));
    const [empty, loading] = root.querySelectorAll('[role="figure"]');
    expect(empty!.textContent).toContain('暂无数据');
    expect(empty!.querySelector('table')).toBeNull();
    expect(loading!.textContent).not.toContain('暂无数据');
    expect(loading!.getAttribute('aria-busy')).toBe('true');
    expect(empty!.hasAttribute('aria-busy')).toBe(false);
  });

  it('加载中：柱状图的骨架是一排高低不一的柱，折线图是一整块，都对读屏隐藏', () => {
    const root = mount(() => (
      <>
        <BarChart aria-label="柱" data={[] as Row[]} index="name" series={[...series]} loading />
        <LineChart aria-label="线" data={[] as Row[]} index="name" series={[...series]} loading />
      </>
    ));
    const [bar, line] = root.querySelectorAll<HTMLElement>('[role="figure"]');
    const bars = bar!.querySelector('[aria-hidden="true"]')!;
    expect(bars.children.length).toBeGreaterThan(3);
    const heights = new Set([...bars.children].map((el) => el.getAttribute('style')));
    expect(heights.size).toBeGreaterThan(1);
    const block = line!.querySelectorAll('[aria-hidden="true"]');
    expect(block).toHaveLength(1);
    expect(block[0]!.children).toHaveLength(0);
  });
});

describe('DonutChart、ScatterChart、AreaChart', () => {
  const sources = [
    { name: '搜索', visits: 300 },
    { name: '直接', visits: 100 },
  ];

  it('环形图：数据表列出数值与占比；点图例隐藏一项后占比按剩下的算', async () => {
    const root = mount(() => (
      <DonutChart aria-label="来源" data={sources} index="name" value="visits" unit="次" />
    ));
    const table = root.querySelector('table')!;
    expect([...table.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '类目',
      '数值（次）',
      '占比',
    ]);
    expect([...table.querySelectorAll('tbody tr')].map((tr) => tr.textContent)).toEqual([
      '搜索30075%',
      '直接10025%',
    ]);
    root.querySelector<HTMLButtonElement>('[role="group"] button')!.click();
    await nextTick();
    expect([...table.querySelectorAll('tbody tr')].map((tr) => tr.textContent)).toEqual([
      '直接100100%',
    ]);
  });

  it('散点图：数据表多一列横轴的值', () => {
    const root = mount(() => (
      <ScatterChart
        aria-label="城市"
        data={[{ name: '北京', gdp: 20, commute: 47 }]}
        index="name"
        x="gdp"
        xLabel="人均 GDP"
        series={[{ key: 'commute', label: '通勤' }]}
      />
    ));
    expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '类目',
      '人均 GDP',
      '通勤',
    ]);
    expect(root.querySelector('tbody tr')!.textContent).toBe('北京2047');
  });

  it('面积图：外层 figure 与数据表同折线图；没有数据时显示空状态', () => {
    const root = mount(() => (
      <>
        <AreaChart aria-label="面积" data={rows} index="name" series={[...series]} stacked />
        <AreaChart aria-label="空" data={[] as Row[]} index="name" series={[...series]} />
      </>
    ));
    // 只取外层：Unovis 画出的 svg 自己也带 role="figure"
    const [area, empty] = root.querySelectorAll(':scope > [role="figure"]');
    expect(area!.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(empty!.textContent).toContain('暂无数据');
  });
});

describe('SankeyChart、ChordChart', () => {
  const nodes = [
    { id: 'visit', label: '访问' },
    { id: 'signup', label: '注册' },
    { id: 'pay', label: '付费', color: 'red' },
  ];
  const links = [
    { source: 'visit', target: 'signup', value: 300 },
    { source: 'signup', target: 'pay', value: new Decimal('120.5') },
    { source: 'visit', target: 'ghost', value: 10 },
    { source: 'visit', target: 'pay', value: 0 },
  ];

  it('流向数据：节点按顺序取色板；交给 Unovis 前去掉指向不存在节点、值不为正的流向', () => {
    const resolved = resolveFlowNodes(nodes);
    expect(resolved.get('visit')).toMatchObject({
      label: '访问',
      color: resolveColor(undefined, 0),
    });
    expect(resolved.get('pay')!.color).toBe('red');
    const data = flowData(resolved, links);
    expect(data.links.map((link) => [link.source, link.target, link.amount])).toEqual([
      ['visit', 'signup', 300],
      ['signup', 'pay', 120.5],
    ]);
    // 复制一份：Unovis 往节点上写布局字段，不能改到调用方的数据
    expect(data.nodes[0]).not.toBe(resolved.get('visit'));
  });

  it('桑基图：数据表每条流向一行，写“起点 → 终点”，数值按原值格式化', () => {
    const root = mount(() => (
      <SankeyChart aria-label="转化" nodes={nodes} links={links.slice(0, 2)} unit="人" />
    ));
    expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '流向',
      '数值（人）',
    ]);
    expect([...root.querySelectorAll('tbody tr')].map((tr) => tr.textContent)).toEqual([
      '访问 → 注册300',
      '注册 → 付费120.5',
    ]);
    expect(root.querySelector('[role="group"]')).toBeNull();
  });

  it('弦图：图例是节点，点一下隐藏节点，连同它的流向（写回 hiddenNodes）', async () => {
    const hidden = shallowRef<string[]>([]);
    const root = mount(() => (
      <ChordChart
        aria-label="往来"
        nodes={nodes}
        links={links.slice(0, 2)}
        hiddenNodes={hidden.value}
        {...{ 'onUpdate:hiddenNodes': (next: string[]) => (hidden.value = next) }}
      />
    ));
    const buttons = root.querySelectorAll<HTMLButtonElement>('[role="group"] button');
    expect([...buttons].map((button) => button.textContent)).toEqual(['访问', '注册', '付费']);
    buttons[0]!.click();
    await nextTick();
    expect(hidden.value).toEqual(['visit']);
    expect(buttons[0]!.getAttribute('aria-pressed')).toBe('false');
    expect([...root.querySelectorAll('tbody tr')].map((tr) => tr.textContent)).toEqual([
      '注册 → 付费120.5',
    ]);
  });
});
