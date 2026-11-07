// ModelViewer 的键盘：能操作时可聚焦，方向键转、+ / - 缩放（zoom 时），这些键不再滚动页面；controls={false} 时不可聚焦
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Angles from '../demo/Angles';
import Product from '../demo/Product';

/** 按下的键是否被查看器接住（不再滚动页面） */
async function handled(key: string): Promise<boolean> {
  let prevented = false;
  const listener = (event: KeyboardEvent) => (prevented = event.defaultPrevented);
  document.addEventListener('keydown', listener);
  await userEvent.keyboard(key);
  document.removeEventListener('keydown', listener);
  return prevented;
}

it('可操作时：方向键、+ / - 由查看器处理，别的键照常', async () => {
  const root = mount(Product);
  const viewer = root.querySelector<HTMLElement>('[role="img"]')!;
  expect(viewer.tabIndex).toBe(0);
  viewer.focus();
  for (const key of ['{ArrowLeft}', '{ArrowRight}', '{ArrowUp}', '{ArrowDown}', '+', '-'])
    expect(await handled(key), key).toBe(true);
  expect(await handled('a')).toBe(false);
});

it('controls={false}：不可聚焦', () => {
  const root = mount(Angles);
  const viewers = [...root.querySelectorAll<HTMLElement>('[role="img"]')];
  expect(viewers.length).toBeGreaterThan(0);
  for (const viewer of viewers) expect(viewer.hasAttribute('tabindex')).toBe(false);
});
