// Tree 在真实浏览器里：拖动换层级与顺序（上沿放到前面、中间放进里面），Alt + 方向键移动并播报，
// 搜索过滤留下匹配项与上级，canDrop 拦下不能放的位置，勾选框勾上后是实底色
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Checkable from '../demo/Checkable';
import Outline from '../demo/Outline';

const treeOf = (root: Element) => root.querySelector<HTMLElement>('[role="tree"]')!;
const items = (tree: Element) => [...tree.querySelectorAll<HTMLElement>('[role="treeitem"]')];
const item = (tree: Element, text: string) =>
  items(tree).find((node) => node.textContent === text)!;
const outline = (tree: Element) =>
  items(tree).map((node) => `${node.getAttribute('aria-level')}:${node.textContent}`);
const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

/** 用指针把 from 拖到 to 这一项的 ratio 高度处（0 是上沿，1 是下沿） */
async function drag(tree: HTMLElement, from: string, to: string, ratio: number) {
  const start = item(tree, from).getBoundingClientRect();
  const init = (x: number, y: number): PointerEventInit => ({
    bubbles: true,
    cancelable: true,
    pointerId: 7,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    isPrimary: true,
    clientX: x,
    clientY: y,
  });
  item(tree, from).dispatchEvent(
    new PointerEvent('pointerdown', init(start.left + 24, start.top + 8)),
  );
  tree.dispatchEvent(new PointerEvent('pointermove', init(start.left + 24, start.top + 20)));
  await tick();
  const end = item(tree, to).getBoundingClientRect();
  const y = end.top + end.height * ratio;
  tree.dispatchEvent(new PointerEvent('pointermove', init(end.left + 40, y)));
  await tick();
  tree.dispatchEvent(new PointerEvent('pointerup', init(end.left + 40, y)));
  await tick();
}

it('拖到一项的上沿放到它前面，拖到中间放进它里面', async () => {
  const tree = treeOf(mount(Outline));
  await tick();
  await drag(tree, '请购单', '第三章 来料检验', 0.1);
  expect(outline(tree)).toContain('1:请购单');
  expect(outline(tree).indexOf('1:请购单')).toBe(outline(tree).indexOf('1:第三章 来料检验') - 1);
  await drag(tree, '公司文化', '第三章 来料检验', 0.5);
  // 放进第三章的最后
  expect(outline(tree).slice(-3)).toEqual(['2:检验报告', '2:公司文化', '1:附录 表单模板']);
});

it('canDrop：附录只能在第一层，别的章节不能放进附录', async () => {
  const tree = treeOf(mount(Outline));
  await tick();
  const before = outline(tree);
  await drag(tree, '附录 表单模板', '第一章 入职须知', 0.5);
  await drag(tree, '公司文化', '附录 表单模板', 0.5);
  expect(outline(tree)).toEqual(before);
});

it('Alt + ↑ 在同级里上移，Alt + ← 移到父节点后面，并告诉读屏移到了哪里', async () => {
  const tree = treeOf(mount(Outline));
  await tick();
  item(tree, '合同审批').click();
  const key = (name: string) =>
    tree.dispatchEvent(new KeyboardEvent('keydown', { key: name, altKey: true, bubbles: true }));
  key('ArrowUp');
  await tick();
  expect(outline(tree).slice(3, 7)).toEqual([
    '1:第二章 采购流程',
    '2:请购单',
    '2:合同审批',
    '2:询价与比价',
  ]);
  key('ArrowLeft');
  await tick();
  expect(outline(tree).indexOf('1:合同审批')).toBe(outline(tree).indexOf('1:第三章 来料检验') - 1);
  await expect
    .poll(() => [...document.querySelectorAll('[aria-live]')].map((node) => node.textContent))
    .toContain('合同审批移到第一层第 3 位');
});

it('搜索：留下匹配的节点与它们的上级，匹配的加粗；清空后回到原来的展开状态', async () => {
  const root = mount(Outline);
  const tree = treeOf(root);
  const input = root.querySelector<HTMLInputElement>('input[type="search"]')!;
  input.value = '检验';
  input.dispatchEvent(new Event('input'));
  await tick();
  expect(outline(tree)).toEqual(['1:第三章 来料检验', '2:检验报告']);
  expect(getComputedStyle(item(tree, '检验报告').lastElementChild!).fontWeight).toBe('600');
  input.value = '';
  input.dispatchEvent(new Event('input'));
  await tick();
  expect(outline(tree)).toContain('2:公司文化');
});

it('勾选框勾上后是色调的实底色', async () => {
  const tree = treeOf(mount(Checkable));
  await tick();
  const checked = items(tree).find((node) => node.getAttribute('aria-checked') === 'true');
  const box = checked!.querySelector('[aria-hidden="true"] > span')!;
  expect(getComputedStyle(box).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});
