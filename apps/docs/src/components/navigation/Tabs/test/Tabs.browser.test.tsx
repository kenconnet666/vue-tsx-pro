// Tabs 在真实浏览器里：拖动标签越过旁边标签的中线就换位；“全部标签页”菜单列出新建的标签；关掉当前标签后焦点在旁边的标签上
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Workspace from '../demo/Workspace';

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const titles = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('[role="tab"]')].map((tab) => tab.textContent);

it('拖动标签越过旁边标签的中线就换位', async () => {
  const root = mount(Workspace);
  await tick();
  const list = root.querySelector<HTMLElement>('[role="tablist"]')!;
  const [, first, second] = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
  const from = first!.getBoundingClientRect();
  const to = second!.getBoundingClientRect();
  const init = (x: number): PointerEventInit => ({
    bubbles: true,
    pointerId: 3,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    isPrimary: true,
    clientX: x,
    clientY: from.top + from.height / 2,
  });
  first!.dispatchEvent(new PointerEvent('pointerdown', init(from.left + 10)));
  list.dispatchEvent(new PointerEvent('pointermove', init(from.left + 20)));
  list.dispatchEvent(new PointerEvent('pointermove', init(to.left + to.width * 0.75)));
  list.dispatchEvent(new PointerEvent('pointerup', init(to.left + to.width * 0.75)));
  await tick();
  expect(titles(root).slice(0, 3)).toEqual(['工作台', '采购单 PO-2402', '采购单 PO-2401']);
});

it('新建的标签在“全部标签页”菜单里；关掉当前标签后焦点在旁边的标签上', async () => {
  const root = mount(Workspace);
  await tick();
  root.querySelector<HTMLButtonElement>('button[aria-label="新建标签页"]')!.click();
  await tick();
  root.querySelector<HTMLButtonElement>('button[aria-label="全部标签页"]')!.click();
  await tick();
  const items = [...document.querySelectorAll('[role="menuitemradio"]')].map(
    (item) => item.textContent,
  );
  expect(items.at(-1)).toBe('新建草稿 1');
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const current = root.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')!;
  expect(current.textContent).toBe('新建草稿 1');
  current.focus();
  current.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  await tick();
  expect(document.activeElement?.textContent).toBe('合同审批 CT-5');
});
