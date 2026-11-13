// 表头的关键字筛选（ColumnFilterButton）在真实浏览器里：打字时不生效（停手才生效），回车立即生效；清空立即恢复
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Columns from '../demo/Columns';

it('关键字：打完按回车立即筛出匹配的行，清空后恢复', async () => {
  const root = mount(Columns);
  // 行是虚拟滚动的，渲染出来的行数会随视口变：总行数看 aria-rowcount
  const total = () => Number(root.querySelector('table')?.getAttribute('aria-rowcount'));
  const shown = () => root.querySelectorAll('tbody tr[aria-rowindex]').length;
  await expect.poll(shown).toBeGreaterThan(1);
  const all = total();

  await userEvent.click(root.querySelector<HTMLElement>('button[aria-label="筛选“采购单号”"]')!);
  const input = () => document.querySelector<HTMLInputElement>('input[aria-label="搜索"]')!;
  await expect.poll(input).toBeTruthy();
  // 弹层打开后焦点在输入框里，直接打字
  await expect.poll(() => document.activeElement).toBe(input());
  const first = root.querySelector('tbody tr[aria-rowindex] td')!.textContent!.trim();
  await userEvent.keyboard(first);
  // 还没停手：行数没变
  expect(total()).toBe(all);
  await userEvent.keyboard('{Enter}');
  await expect.poll(shown).toBe(1);
  expect(root.querySelector('button[aria-label="筛选“采购单号”（已筛选）"]')).not.toBeNull();

  await userEvent.clear(input());
  await expect.poll(total).toBe(all);
});
