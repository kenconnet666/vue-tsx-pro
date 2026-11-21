// Embed、Video 里的 iframe / video 铺满定比例的外框（issue #7：它们把自己的部件标记交给 AspectRatio，按部件标记选的铺满规则选不中）
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Embedded from '../demo/Embedded';
import Player from '../demo/Player';

const size = (element: Element) => {
  const { width, height } = element.getBoundingClientRect();
  return [Math.round(width), Math.round(height)];
};
/** 外框的内容区（不算边框）：里面的元素铺满的是这块 */
const inner = (element: Element) => [element.clientWidth, element.clientHeight];

it('Embed 的 iframe 和外框一样大', async () => {
  const root = mount(Embedded);
  const frame = root.querySelector('[data-scope="embed"][data-part="root"]')!;
  await expect.poll(() => root.querySelector('iframe')).not.toBeNull();
  expect(size(root.querySelector('iframe')!)).toEqual(inner(frame));
});

it('Video 的 video 和外框一样大', () => {
  const root = mount(Player);
  const frame = root.querySelector('[data-scope="video"][data-part="root"]')!;
  expect(size(root.querySelector('video')!)).toEqual(inner(frame));
});
