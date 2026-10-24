// ChordChart 在真实浏览器里：每个部门一段弧、每条往来一根弦，部门名在图例里；悬停弦看两个部门之间的量
import { expect, it } from 'vitest';
import { hover, tooltipText } from '../../../../test/chart';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Teams from '../demo/Teams';

const arcs = (root: Element) => [
  ...root.querySelectorAll('[class*="chord-diagram-component"] path[class*="node"]'),
];
const chords = (root: Element) => [
  ...root.querySelectorAll('[class*="chord-diagram-component"] path[class*="link"]'),
];

it('6 段弧、10 根弦；有图例时部门名写在图例里', async () => {
  const root = mount(Teams);
  await until(() => arcs(root).length === 6 && chords(root).length === 10);
  const legend = [...root.querySelectorAll('[role="figure"] [role="group"] button')].map(
    (button) => button.textContent,
  );
  expect(legend).toEqual(['产品', '设计', '前端', '后端', '测试', '运维']);
});

it('悬停第一根弦：提示框写两个部门与需求数', async () => {
  const root = mount(Teams);
  const all = await until(() => chords(root).length === 10 && chords(root));
  await new Promise((resolve) => setTimeout(resolve, 500));
  hover(all[0]!);
  const text = await until(() => tooltipText(root).includes('个需求') && tooltipText(root));
  expect(text).toMatch(/产品|设计|前端|后端|测试|运维/);
});
