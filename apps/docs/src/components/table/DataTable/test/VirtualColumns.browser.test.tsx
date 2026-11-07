// DataTable 的列虚拟化在真实浏览器里：只渲染看得见的列，占位格补齐列数；横向滚动后换一批列；分组表头的格数对得上
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Wide from '../demo/Wide';

/** 一行里各格占的列数之和（colspan 加起来） */
const spanOf = (row: Element) =>
  [...row.children].reduce((sum, cell) => sum + Number(cell.getAttribute('colspan') ?? 1), 0);

it('只渲染看得见的列；滚到中间换一批；每行占的列数都等于总列数', async () => {
  await page.viewport(1000, 800);
  const root = mount(Wide);
  const table = root.querySelector('table')!;
  const total = Number(table.getAttribute('aria-colcount'));
  expect(total).toBe(122);
  const firstRow = () => table.querySelector('tbody tr[data-key]')!;
  await expect.poll(() => firstRow().querySelectorAll('td[aria-colindex]').length).toBeLessThan(40);
  expect(spanOf(firstRow())).toBe(total);
  const headerTexts = () => [...table.querySelectorAll('thead th')].map((cell) => cell.textContent);
  // 第一天那列（门店之后）是第 2 列
  const dayOne = () => firstRow().querySelector('td[aria-colindex="2"]');
  expect(dayOne()).not.toBeNull();

  const viewport = table.closest('[data-part="viewport"]') as HTMLElement;
  viewport.scrollLeft = 64 * 60;
  await expect.poll(() => dayOne()).toBeNull();
  expect(headerTexts()).toContain('门店');
  expect(headerTexts()).toContain('合计');
  expect(spanOf(firstRow())).toBe(total);
  // 分组表头：第一行（组、跨两行的列、占位）加起来也是全部列
  expect(spanOf(table.querySelector('thead tr')!)).toBe(total);
});
