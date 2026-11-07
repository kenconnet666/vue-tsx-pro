// Calendar 在真实浏览器里：用指针点月份、年份格（浏览器先聚焦、再点击），逐级回到日期视图时焦点仍是原来那天
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Views from '../demo/Views';

it('点标题切到年份视图，点年、点月逐级回来：焦点保留原来的月、日', async () => {
  const root = mount(Views);
  // 第一列是生日（1995-06-18）
  const birthday = root.firstElementChild!.firstElementChild as HTMLElement;
  const heading = () => birthday.querySelector<HTMLElement>('button[aria-label^="选择"]')!;
  const cell = (iso: string) => birthday.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;
  const focused = () => birthday.querySelector<HTMLElement>('[data-focused]')?.dataset.date;

  await expect.poll(focused).toBe('1995-06-18');
  await userEvent.click(heading());
  await userEvent.click(heading());
  await expect.poll(() => cell('1998-01-01')).toBeTruthy();
  await userEvent.click(cell('1998-01-01'));
  await expect.poll(focused).toBe('1998-06-01');
  await userEvent.click(cell('1998-09-01'));
  await expect.poll(focused).toBe('1998-09-18');
});
