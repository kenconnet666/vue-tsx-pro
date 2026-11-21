// GradientField 在真实浏览器里：色标的键盘（End 挪到最后、重新排序后焦点还在它上面）、Delete 删除
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Lifetime from '../demo/Lifetime';

it('GradientField：End 把色标挪到最后（重新排序，焦点跟着它），Delete 删掉', async () => {
  const root = mount(Lifetime);
  const stops = () =>
    root.querySelectorAll<HTMLElement>('[data-scope="gradient-field"] [role="slider"]');
  stops()[0]!.focus();
  await userEvent.keyboard('{End}');
  await expect.poll(() => document.activeElement?.getAttribute('aria-valuenow')).toBe('100');
  expect(stops()[2]).toBe(document.activeElement);
  await userEvent.keyboard('{Delete}');
  await expect.poll(() => stops().length).toBe(2);
});
