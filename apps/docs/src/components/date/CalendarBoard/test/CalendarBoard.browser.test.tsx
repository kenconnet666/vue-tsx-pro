// CalendarBoard 的键盘：焦点在日期上时方向键、Page Up / Down 移动（跨月翻页），Enter 选中那一天
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Schedule from '../demo/Schedule';

it('方向键、Page Down 移动焦点，Enter 选中', async () => {
  const root = mount(Schedule);
  const focused = () =>
    document.activeElement?.closest<HTMLElement>('[data-date]')?.getAttribute('data-date');
  await expect.poll(() => root.querySelector('[data-day][data-focused]')).not.toBeNull();
  root.querySelector<HTMLElement>('[data-day][data-focused]')!.focus();
  expect(focused()).toBe('2026-10-19');
  const press = async (keys: string, date: string) => {
    await userEvent.keyboard(keys);
    await expect.poll(focused).toBe(date);
  };
  await press('{ArrowRight}', '2026-10-20');
  await press('{ArrowDown}', '2026-10-27');
  await press('{PageDown}', '2026-11-27');
  await press('{ArrowUp}{ArrowLeft}', '2026-11-19');
  await userEvent.keyboard('{Enter}');
  await expect
    .poll(() => root.querySelector('[data-date="2026-11-19"]')?.getAttribute('aria-selected'))
    .toBe('true');
});
