// Diagram 的键盘：节点上 Enter 选中（Shift 加选），Ctrl+A 全选，Esc 清空
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Selection from '../demo/Selection';

it('Enter 选中、Shift+Enter 加选、Ctrl+A 全选、Esc 清空', async () => {
  const root = mount(Selection);
  await expect
    .poll(() => root.querySelectorAll('[data-node][role="button"]').length)
    .toBeGreaterThan(2);
  const nodes = [...root.querySelectorAll<HTMLElement>('[data-node][role="button"]')];
  const pressed = () => nodes.filter((node) => node.getAttribute('aria-pressed') === 'true').length;
  // 先清掉示例一开始选中的
  nodes[0]!.focus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(pressed).toBe(0);

  await userEvent.keyboard('{Enter}');
  await expect.poll(() => nodes[0]!.getAttribute('aria-pressed')).toBe('true');
  nodes[1]!.focus();
  await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
  await expect.poll(pressed).toBe(2);
  await userEvent.keyboard('{Control>}a{/Control}');
  await expect.poll(pressed).toBe(nodes.length);
  await userEvent.keyboard('{Escape}');
  await expect.poll(pressed).toBe(0);
});
