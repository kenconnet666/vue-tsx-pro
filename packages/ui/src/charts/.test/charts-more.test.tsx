// 瀑布图、漏斗图、网络图与语义色：画图前的数据换算、给读屏的数据表、下钻（绘图本身见文档站的截图）
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { colors } from '../../config/theme/tokens';
import { mount } from '../../utils/.test/mount';
import { FunnelChart } from '../FunnelChart';
import { GraphChart } from '../GraphChart';
import { resolveColor } from '../series';
import { WaterfallChart, waterfallRows } from '../WaterfallChart';

const cells = (root: Element) =>
  [...root.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.children].map((cell) => cell.textContent),
  );

describe('语义色', () => {
  it('图表颜色认色板名、语义色名，其余原样当作 CSS 颜色', () => {
    expect(resolveColor('chart2', 0)).toBe(colors.chart2);
    expect(resolveColor('danger', 0)).toBe(colors.danger);
    expect(resolveColor('success', 3)).toBe(colors.success);
    expect(resolveColor('#e5484d', 0)).toBe('#e5484d');
  });
});

describe('WaterfallChart', () => {
  it('各步算出累计与柱子的上下沿；合计柱从 0 起，写了值时作为新的起点', () => {
    const rows = waterfallRows([
      { label: 'V1', value: 100, total: true },
      { label: '降', value: -30 },
      { label: '升', value: new Decimal('12.5') },
      { label: 'V2', total: true },
    ]);
    expect(rows.map((row) => [row.kind, row.cumulative, row.low, row.high])).toEqual([
      ['total', 100, 0, 100],
      ['decrease', 70, 70, 100],
      ['increase', 82.5, 70, 82.5],
      ['total', 82.5, 0, 82.5],
    ]);
    // 不跨 0：透明的垫底到较低的一端，看得见的一段补上差
    expect(rows[1]).toMatchObject({ base: 70, bar: 30, below: 0 });
  });

  it('跨过 0 的一步分成正负两段；全在 0 以下的从 0 往下叠', () => {
    const [, cross, under] = waterfallRows([
      { label: '起', value: 20, total: true },
      { label: '跌穿', value: -50 },
      { label: '再跌', value: -10 },
    ]);
    expect(cross).toMatchObject({ low: -30, high: 20, base: 0, bar: 20, below: -30 });
    expect(under).toMatchObject({ low: -40, high: -30, base: -30, bar: -10, below: 0 });
  });

  it('数据表列出变动（带正负号）与累计；合计柱的变动写“—”', () => {
    const root = mount(() => (
      <WaterfallChart
        aria-label="差异"
        steps={[
          { label: 'V1', value: 100, total: true },
          { label: '材料', value: -30 },
          { label: 'V2', total: true },
        ]}
        unit="万元"
      />
    ));
    expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '类目',
      '变动（万元）',
      '累计（万元）',
    ]);
    expect(cells(root)).toEqual([
      ['V1', '—', '100'],
      ['材料', '-30', '70'],
      ['V2', '—', '70'],
    ]);
    // 没有图例：颜色的含义写在提示框里
    expect(root.querySelector('[role="group"]')).toBeNull();
  });
});

describe('FunnelChart', () => {
  const stages = [
    { label: '提交', value: 200 },
    { label: '立项', value: 50 },
    { label: '复购', value: new Decimal(10) },
  ];

  it('数据表列出数值、比上一环节与比第一环节的转化率', () => {
    const root = mount(() => <FunnelChart aria-label="转化" stages={stages} unit="项" />);
    expect(cells(root)).toEqual([
      ['提交', '200', '—', '—'],
      ['立项', '50', '25%', '25%'],
      ['复购', '10', '20%', '5%'],
    ]);
    expect(root.textContent).toContain('总转化 5%');
  });

  it('点一个环节下钻：参数是这个环节与它的位置', () => {
    const picked: string[] = [];
    const root = mount(() => (
      <FunnelChart
        aria-label="转化"
        stages={stages}
        onItemClick={(stage, index) => picked.push(`${index}:${stage.label}`)}
      />
    ));
    const rows = root.querySelectorAll<HTMLElement>('[aria-hidden="true"] > div > div');
    [...rows].find((row) => row.textContent?.startsWith('立项'))!.click();
    expect(picked).toEqual(['1:立项']);
  });

  it('没有环节时显示空状态，没有数据表', () => {
    const root = mount(() => <FunnelChart aria-label="转化" stages={[]} />);
    expect(root.textContent).toContain('暂无数据');
    expect(root.querySelector('table')).toBeNull();
  });
});

describe('GraphChart', () => {
  it('数据表每条连线一行（起点 → 终点、数值与标签）；指向不存在节点的连线去掉', () => {
    const root = mount(() => (
      <GraphChart
        aria-label="协作"
        nodes={[{ id: 'a', label: '技术部' }, { id: 'b', label: '供应商甲' }, { id: 'c' }]}
        links={[
          { source: 'a', target: 'b', value: 12, label: '主力' },
          { source: 'a', target: 'c' },
          { source: 'a', target: 'ghost', value: 1 },
        ]}
        unit="项"
      />
    ));
    expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '连接',
      '数值（项）',
    ]);
    expect(cells(root)).toEqual([
      ['技术部 → 供应商甲', '12 · 主力'],
      ['技术部 → c', '—'],
    ]);
  });
});
