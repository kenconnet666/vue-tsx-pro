// FloatButton 在真实浏览器里：组停在包含块的结束边底角；滚过阈值后组里多出“回到顶部”；速拨展开后各项可见可点
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Corner from '../demo/Corner';
import SpeedDial from '../demo/SpeedDial';

it('组停在示例框的右下角；滚下去后多出回到顶部', async () => {
  await page.viewport(900, 700);
  const root = mount(Corner);
  const card = root.firstElementChild as HTMLElement;
  const group = root.querySelector<HTMLElement>('[role="group"]')!;
  const box = card.getBoundingClientRect();
  const corner = group.getBoundingClientRect();
  expect(box.right - corner.right).toBeGreaterThan(8);
  expect(box.right - corner.right).toBeLessThan(40);
  expect(box.bottom - corner.bottom).toBeLessThan(40);
  expect(group.querySelectorAll('button:not([aria-hidden])').length).toBe(2);

  root.querySelector('[data-part="viewport"]')!.scrollTop = 400;
  await expect.poll(() => group.querySelectorAll('button:not([aria-hidden])').length).toBe(3);
});

it('速拨：点主按钮展开，选一项后收起', async () => {
  await page.viewport(900, 700);
  const root = mount(SpeedDial);
  const trigger = root.querySelector<HTMLButtonElement>('[aria-label="新建"]')!;
  const actions = document.getElementById(trigger.getAttribute('aria-controls')!)!;
  expect(getComputedStyle(actions).visibility).toBe('hidden');
  trigger.click();
  await expect.poll(() => getComputedStyle(actions).visibility).toBe('visible');
  root.querySelector<HTMLButtonElement>('[aria-label="新建表格"]')!.click();
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false');
  expect(root.textContent).toContain('未命名表格 4');
});
