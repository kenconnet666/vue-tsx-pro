// animated-number 示例里的 Descriptions 放在 align="start" 的 Flex 里：以前宽度按 0 算、内容溢出（issue #8），
// 现在占满所在的容器（测试页面窄于 32em，按容器查询排一栏）
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Numbers from '../demo/Numbers';

it('Descriptions 在按内容收缩的容器里也占满宽度，内容不溢出', () => {
  const root = mount(Numbers);
  const list = root.querySelector<HTMLElement>('[data-scope="descriptions"][data-part="root"]')!;
  const width = list.getBoundingClientRect().width;
  expect(width).toBeGreaterThan(0);
  expect(width).toBe(list.parentElement!.getBoundingClientRect().width);
  expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
});
