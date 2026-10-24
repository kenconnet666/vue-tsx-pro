// SankeyChart 在真实浏览器里：每个节点一个矩形、每条流一根带子，节点写名称与金额；悬停流看起点、终点与金额
import { expect, it } from 'vitest';
import { hover, tooltipText } from '../../../../test/chart';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Budget from '../demo/Budget';

const nodes = (root: Element) => [
  ...root.querySelectorAll(
    '[class*="sankey-component"] rect[class*="node"]:not([class*="selection"])',
  ),
];
const links = (root: Element) => [
  ...root.querySelectorAll('[class*="sankey-component"] path[class*="visible"]'),
];

it('10 个节点、11 条流；节点写名称，金额按货币格式', async () => {
  const root = mount(Budget);
  await until(() => nodes(root).length === 10 && links(root).length === 11);
  const text = root.querySelector('svg')!.textContent!;
  for (const label of ['产品收入', '年度预算', '研发', '云资源']) expect(text).toContain(label);
  expect(text).toMatch(/¥|CN¥/);
});

it('悬停一条流：提示框写起点 → 终点与金额', async () => {
  const root = mount(Budget);
  const all = await until(() => links(root).length === 11 && links(root));
  await new Promise((resolve) => setTimeout(resolve, 500));
  hover(all[0]!);
  const text = await until(() => tooltipText(root).includes('→') && tooltipText(root));
  expect(text).toMatch(/收入 → 年度预算/);
});
