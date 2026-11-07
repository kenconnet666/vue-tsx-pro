// SlideCaptcha 的键盘操作：方向键一步 2px、Home / End 到两头，Enter 松手交出位置；判定中滑块不可用
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Basic from '../demo/Basic';

it('方向键、Home / End 移动滑块，Enter 松手交给判定', async () => {
  const root = mount(Basic);
  await expect.poll(() => root.querySelector('[role="slider"]')).not.toBeNull();
  const slider = root.querySelector<HTMLElement>('[role="slider"]')!;
  const value = () => Number(slider.getAttribute('aria-valuenow'));
  const max = Number(slider.getAttribute('aria-valuemax'));
  expect(max).toBeGreaterThan(0);

  slider.focus();
  await userEvent.keyboard('{End}');
  expect(value()).toBe(max);
  await userEvent.keyboard('{ArrowLeft}');
  expect(value()).toBe(max - 2);
  await userEvent.keyboard('{Home}');
  expect(value()).toBe(0);
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  expect(value()).toBe(4);

  await userEvent.keyboard('{Enter}');
  // 判定中：滑块不可用、离开 Tab 顺序
  await expect.poll(() => slider.getAttribute('aria-disabled')).toBe('true');
  expect(slider.tabIndex).toBe(-1);
  // 示例自己判定后写出交上去的位置
  await expect.poll(() => root.textContent).toContain('位置 4px');
});
