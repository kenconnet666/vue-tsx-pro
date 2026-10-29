// GraphChart 在真实浏览器里：布局算好后画出全部节点与连线；点一个节点选中它（selected 双向绑定），点空白处取消
import { expect, it } from 'vitest';
import { click } from '../../../../test/chart';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Network from '../demo/Network';

const nodes = (root: Element) => [...root.querySelectorAll('[data-part="node"]')];
const links = (root: Element) => [...root.querySelectorAll('[data-part="link"]')];

it('8 个节点、8 条连线，节点写名称', async () => {
  const root = mount(Network);
  await until(() => nodes(root).length === 8 && links(root).length === 8);
  const text = root.querySelector('svg')!.textContent!;
  for (const label of ['技术部', '研发中心', '供应商甲']) expect(text).toContain(label);
});

it('点“技术部”选中它，点空白处取消', async () => {
  const root = mount(Network);
  const all = await until(() => nodes(root).length === 8 && nodes(root));
  const node = all.find((item) => item.textContent!.includes('技术部'))!;
  click(node);
  await until(() => root.textContent!.includes('选中：技术部'));
  click(root.querySelector('[data-part="background"]')!);
  await until(() => root.textContent!.includes('点一个节点'));
  expect(root.textContent).not.toContain('选中：');
});
