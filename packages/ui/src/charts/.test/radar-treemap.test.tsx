// 雷达图、矩形树图：读屏的数据表（雷达每个维度一行、各系列一列；树图每块一行，名称是各层分组连起来、带占比）、
// 图例点一下隐藏一个系列或一个顶层分组，没有数据时显示空状态（绘图本身见文档站的浏览器测试）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { RadarChart } from '../RadarChart';
import { TreemapChart } from '../TreemapChart';

const rows = (root: Element) =>
  [...root.querySelectorAll('tbody tr')].map((row) => row.textContent);

describe('RadarChart', () => {
  it('数据表每个维度一行、各系列一列，空值写“—”', () => {
    const root = mount(() => (
      <RadarChart
        aria-label="供应商评分"
        data={[
          { dimension: '质量', huachen: 86, hengyuan: 78 },
          { dimension: '交期', huachen: 72, hengyuan: null },
        ]}
        index="dimension"
        series={[
          { key: 'huachen', label: '华辰' },
          { key: 'hengyuan', label: '恒远' },
        ]}
        max={100}
      />
    ));
    expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '类目',
      '华辰',
      '恒远',
    ]);
    expect(rows(root)).toEqual(['质量8678', '交期72—']);
  });
});

describe('TreemapChart', () => {
  const data = [
    { region: '华东', supplier: '华辰', amount: 60 },
    { region: '华东', supplier: '恒远', amount: 20 },
    { region: '华南', supplier: '南方', amount: 20 },
  ];

  it('数据表每块一行：各层分组连起来、数值与占比；点图例隐藏一个顶层分组', async () => {
    const root = mount(() => (
      <TreemapChart
        aria-label="采购额"
        data={data}
        groups={['region', 'supplier']}
        value="amount"
        unit="万元"
      />
    ));
    expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '类目',
      '数值（万元）',
      '占比',
    ]);
    expect(rows(root)).toEqual(['华东 / 华辰6060%', '华东 / 恒远2020%', '华南 / 南方2020%']);
    const legend = [...root.querySelectorAll<HTMLButtonElement>('[role="group"] button')];
    expect(legend.map((button) => button.textContent)).toEqual(['华东', '华南']);
    legend[1]!.click();
    await nextTick();
    expect(rows(root)).toEqual(['华东 / 华辰6075%', '华东 / 恒远2025%']);
  });

  it('没有数据时显示空状态、没有数据表', () => {
    const root = mount(() => (
      <TreemapChart
        aria-label="采购额"
        data={[] as typeof data}
        groups={['region']}
        value="amount"
      />
    ));
    expect(root.querySelector('table')).toBeNull();
    expect(root.textContent).toContain('暂无数据');
  });
});
