// SearchField 在真实浏览器里：打字时列表跟着过滤，onSearch 不等停手——按回车立即触发；点清空按钮立即触发并清掉
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Search from '../demo/Search';

it('打字过滤列表；回车立即触发 onSearch；清空按钮清掉并触发', async () => {
  const root = mount(Search);
  const input = root.querySelector<HTMLInputElement>('input[type="search"]')!;
  const items = () => [...root.querySelectorAll('li')].map((item) => item.textContent);
  const note = () => root.querySelector('small')!.textContent!;
  expect(items()).toHaveLength(6);
  expect(note()).toContain('还没有');

  await userEvent.click(input);
  await userEvent.keyboard('支架');
  // _value 每敲一个字都更新：列表马上过滤
  await expect.poll(items).toEqual(['显示器支架', '支架底座']);
  await userEvent.keyboard('{Enter}');
  await expect.poll(note).toContain('最近几次：支架');

  await userEvent.click(root.querySelector<HTMLElement>('button')!);
  await expect.poll(() => input.value).toBe('');
  await expect.poll(note).toContain('（清空）');
  expect(items()).toHaveLength(6);
  expect(document.activeElement).toBe(input);
});
