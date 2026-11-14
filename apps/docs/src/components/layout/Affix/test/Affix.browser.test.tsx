// Affix 在真实浏览器里：贴底的提交栏压着内容时停在滚动面板的底边、写 data-stuck；滚到末尾回到原位、不再算贴住。
// 贴顶的操作条滚下去后贴在面板顶部
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import SubmitBar from '../demo/SubmitBar';
import Toolbar from '../demo/Toolbar';

/** 示例里的固钉与它所在的滚动面板 */
function parts(root: HTMLElement) {
  const bar = root.querySelector<HTMLElement>('[data-scope="affix"][data-part="root"]')!;
  let panel = bar.parentElement!;
  while (!/(auto|scroll)/.test(getComputedStyle(panel).overflowY)) panel = panel.parentElement!;
  return { bar, panel };
}

it('贴底：压着内容时停在面板底边并标记贴住；滚到末尾回到原位', async () => {
  const { bar, panel } = parts(mount(SubmitBar));
  expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
  await expect.poll(() => bar.dataset.stuck).toBe('true');
  const bottom = () => panel.getBoundingClientRect().bottom - bar.getBoundingClientRect().bottom;
  expect(Math.abs(bottom())).toBeLessThan(2);
  expect(bar.textContent).toContain('下面还有内容');

  panel.scrollTop = panel.scrollHeight;
  await expect.poll(() => bar.dataset.stuck).toBeUndefined();
  await expect.poll(() => bar.textContent).toContain('到底了');
});

it('贴顶：滚下去后贴在面板顶部', async () => {
  const { bar, panel } = parts(mount(Toolbar));
  expect(bar.dataset.stuck).toBeUndefined();
  panel.scrollTop = 300;
  await expect.poll(() => bar.dataset.stuck).toBe('true');
  expect(
    Math.abs(bar.getBoundingClientRect().top - panel.getBoundingClientRect().top),
  ).toBeLessThan(2);
});
