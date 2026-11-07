// Select 的远程分页在真实浏览器里：打开后取第一页，滚到列表末尾接着取下一页，选项接在后面、不重复
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Suppliers from '../demo/Suppliers';

it('滚到末尾取下一页', async () => {
  await page.viewport(900, 700);
  const root = mount(Suppliers);
  root.querySelector<HTMLButtonElement>('button[aria-haspopup]')!.click();
  const listbox = await expect
    .poll(() => document.querySelector('[role="listbox"]'))
    .toBeTruthy()
    .then(() => document.querySelector<HTMLElement>('[role="listbox"]')!);
  const setsize = () =>
    Number(listbox.querySelector('[role="option"]')?.getAttribute('aria-setsize') ?? 0);
  await expect.poll(setsize, { timeout: 3000 }).toBe(20);

  const scroller = listbox.closest('[data-part="viewport"]') as HTMLElement;
  scroller.scrollTop = scroller.scrollHeight;
  await expect.poll(setsize, { timeout: 3000 }).toBe(40);
  const values = [...listbox.querySelectorAll('[role="option"]')].map((option) => option.id);
  expect(new Set(values).size).toBe(values.length);
});
