// 全国省市区数据接到 Cascader 上：已选的路径显示成名称；打开后三列跟着已选的路径展开
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Region from '../demo/Region';

it('已选路径显示名称；打开后展开到已选的区', async () => {
  await page.viewport(1000, 760);
  const root = mount(Region);
  expect(root.textContent).toContain('浙江省 杭州市 西湖区');
  const trigger = root.querySelector<HTMLButtonElement>('button[aria-haspopup]')!;
  expect(trigger.textContent).toContain('西湖区');
  trigger.click();
  await expect.poll(() => document.querySelectorAll('[role="listbox"]').length).toBe(3);
  const selected = [...document.querySelectorAll('[role="option"][aria-selected="true"]')].map(
    (option) => option.textContent,
  );
  expect(selected).toEqual(['浙江省', '杭州市', '西湖区']);
});
