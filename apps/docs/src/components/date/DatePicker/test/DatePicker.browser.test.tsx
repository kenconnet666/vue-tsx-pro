// DatePicker 选季度时弹出的 QuarterCalendar：键盘移动焦点（到头换年、Page Up / Down 换年、Home / End），Enter 选中并关闭
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Granularity from '../demo/Granularity';

it('季度：←→、Page Up、Home / End 移动，Enter 选中', async () => {
  const root = mount(Granularity);
  // 标签所在的那一项（标签、选择器、说明）
  const field = [...root.querySelectorAll('label')].find((label) =>
    label.textContent?.includes('考核季度'),
  )!.parentElement!;
  await userEvent.click(field.querySelector<HTMLElement>('button[aria-haspopup]')!);
  const focused = () => document.activeElement?.getAttribute('data-quarter');
  await expect.poll(focused).toBe('2026-Q4');
  const press = async (keys: string, quarter: string) => {
    await userEvent.keyboard(keys);
    await expect.poll(focused).toBe(quarter);
  };
  await press('{ArrowRight}', '2027-Q1');
  await press('{PageUp}', '2026-Q1');
  await press('{End}', '2026-Q4');
  await press('{ArrowLeft}', '2026-Q3');
  await press('{Home}', '2026-Q1');
  await press('{ArrowRight}{ArrowRight}', '2026-Q3');
  await userEvent.keyboard('{Enter}');
  await expect.poll(() => field.textContent).toContain('2026-Q3');
  await expect.poll(() => document.querySelector(':popover-open')).toBeNull();
});
