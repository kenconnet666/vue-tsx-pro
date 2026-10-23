// TreeTransfer 在真实浏览器里：勾上部门就是它下面还没移过去的团队，移过去的是叶子；移过去的在树上勾上且不可用
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Departments from '../demo/Departments';

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

it('勾上部门、移到右边：只移还没移过去的叶子，它们在树上变成不可用', async () => {
  const root = mount(Departments);
  await tick();
  const tree = root.querySelector<HTMLElement>('[role="tree"]')!;
  const item = (text: string) =>
    [...tree.querySelectorAll<HTMLElement>('[role="treeitem"]')].find(
      (node) => node.textContent === text,
    )!;
  // 研发中心已经有前端组移过去了：半选
  expect(item('研发中心').getAttribute('aria-checked')).toBe('mixed');
  item('研发中心').click();
  await tick();
  expect(item('研发中心').getAttribute('aria-checked')).toBe('true');
  root.querySelector<HTMLButtonElement>('button[aria-label="移到通知的团队"]')!.click();
  await tick();
  const right = root.querySelectorAll('[role="listbox"]')[0]!;
  expect([...right.querySelectorAll('[role="option"]')].map((node) => node.textContent)).toEqual([
    '前端组',
    '质量部',
    '后端组',
    '测试组',
  ]);
  tree.focus();
  item('研发中心').click();
  await tick();
  // 展开后子节点都是不可用的
  tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await expect.poll(() => item('后端组')?.getAttribute('aria-disabled')).toBe('true');
});
