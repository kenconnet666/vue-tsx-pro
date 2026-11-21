// CurveField 在真实浏览器里：键盘挪关键帧、Insert 加帧（焦点跟到新帧）、Delete 删帧
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Lifetime from '../demo/Lifetime';

it('CurveField：方向键挪关键帧，Insert 加一帧、焦点跟过去，Delete 删掉', async () => {
  const root = mount(Lifetime);
  const keys = () =>
    root.querySelectorAll<HTMLElement>('[data-scope="curve-field"] [data-part="key"]');
  keys()[1]!.focus();
  await userEvent.keyboard('{ArrowUp}');
  // 纵轴 0 到 1.2：一步 0.01
  expect(keys()[1]!.getAttribute('aria-label')).toBe('关键帧 x 0.3，y 1.01');
  await userEvent.keyboard('{Insert}');
  await expect.poll(() => keys().length).toBe(4);
  await expect.poll(() => document.activeElement).toBe(keys()[2]);
  await userEvent.keyboard('{Delete}');
  await expect.poll(() => keys().length).toBe(3);
  expect(root.textContent).toContain('提交了 3 次');
});
