// 表单与选择器在真实浏览器里（手机视口、触摸屏）：真实触摸的点按、真实键入、滚轮按真实行高对齐
import { expect, it } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import { FormPage } from '../src/pages/FormPage.tsx';
import { PickersPage } from '../src/pages/PickersPage.tsx';
import { drag, mount } from './helpers.ts';

it('真实触摸点按复选框：选中状态跟着变', async () => {
  mount(FormPage);
  const tea = () =>
    [...document.querySelectorAll('[role="checkbox"]')].find((node) => node.textContent === '茶')!;
  expect(tea().getAttribute('aria-checked')).toBe('false');
  await commands.tap('茶');
  await expect.poll(() => tea().getAttribute('aria-checked')).toBe('true');
});

it('多行输入框：键入后字数跟着变', async () => {
  mount(FormPage);
  await userEvent.fill(page.getByPlaceholder('配送时间、门牌号等'), '放门口');
  await expect.poll(() => document.body.textContent).toContain('3/120');
});

it('滚轮：往上拖三行，按真实行高对齐到第四项', async () => {
  mount(PickersPage);
  await commands.tap('水果');
  const find = () => document.querySelector<HTMLElement>('[role="dialog"] [role="listbox"]');
  await expect.poll(find).toBeTruthy();
  const column = find()!;
  const row = column.querySelector('[role="option"]')!.getBoundingClientRect().height;
  expect(row).toBeGreaterThan(30);
  const { left, width, top, height } = column.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  await drag(column, [x, y], [x, y - row * 3]);
  await expect.poll(() => column.querySelector('[aria-selected="true"]')?.textContent).toBe('葡萄');
});
