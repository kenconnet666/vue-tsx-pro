// 属性面板在浏览器里：方向键改数写回值、换种类留下共有的字段、自己的种类的编辑器
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Light from '../demo/Light';

const valueOf = (root: Element) =>
  JSON.parse(root.querySelector('pre')!.textContent!) as Record<string, unknown>;

it('方向键改强度，回到默认值时去掉这个键', async () => {
  const root = mount(Light);
  const intensity = root.querySelector<HTMLInputElement>('input[aria-label="强度"]')!;
  intensity.focus();
  await userEvent.keyboard('{ArrowUp}');
  await expect.poll(() => valueOf(root).intensity).toBe(1.1);
  await userEvent.keyboard('{ArrowDown}');
  await expect.poll(() => 'intensity' in valueOf(root)).toBe(false);
});

it('张角在聚光里；遮罩是自己的种类，设上值以后是选择框', async () => {
  const root = mount(Light);
  const angle = root.querySelector<HTMLInputElement>('input[aria-label="张角"]')!;
  angle.focus();
  await userEvent.keyboard('{ArrowUp}');
  await expect.poll(() => (valueOf(root).shape as { angle: number }).angle).toBe(46);
  const set = [...root.querySelectorAll('button')].find((button) =>
    button.textContent?.includes('设置'),
  )!;
  set.click();
  await expect
    .poll(() => (valueOf(root).shape as { cookie: unknown }).cookie)
    .toBe('cookies/window');
  expect(root.querySelector('[aria-label="遮罩"]')).not.toBeNull();
});
