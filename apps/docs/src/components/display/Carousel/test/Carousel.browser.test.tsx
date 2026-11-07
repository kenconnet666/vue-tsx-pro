// Carousel 在真实浏览器里：下一张滚过去并写回序号；从第一张往前绕到最后一张；手动滚动后序号跟着变；不循环时到头按钮不可用
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Carousel } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../../../test/mount';

const slides = ['甲', '乙', '丙', '丁'];

function setup(loop = true) {
  let read!: () => number;
  const root = mount(
    _component(() => {
      let index = _state(0);
      read = () => index;
      return () => (
        <Carousel items={slides} _index={index} loop={loop} aria-label="测试">
          {(text) => <div style={{ height: '120px' }}>{text}</div>}
        </Carousel>
      );
    }),
  );
  const button = (label: string) =>
    root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const viewport = root.querySelector<HTMLElement>('section > div')!;
  return { root, read: () => read(), button, viewport };
}

it('下一张：滚过去、序号写回；第一张往前绕到最后一张', async () => {
  await page.viewport(800, 600);
  const { read, button, viewport, root } = setup();
  expect(root.querySelector('section')!.getAttribute('aria-roledescription')).toBe('carousel');
  button('下一张').click();
  await expect.poll(() => read()).toBe(1);
  await expect.poll(() => Math.round(viewport.scrollLeft)).toBe(viewport.clientWidth);
  button('上一张').click();
  button('上一张').click();
  await expect.poll(() => read()).toBe(3);
  expect(button('第 4 张，共 4 张').getAttribute('aria-current')).toBe('true');
});

it('手动滚动停下后序号跟着变；不循环时到头那侧的按钮不可用', async () => {
  await page.viewport(800, 600);
  const { read, button, viewport } = setup(false);
  expect(button('上一张').disabled).toBe(true);
  viewport.scrollTo({ left: viewport.clientWidth * 2, behavior: 'instant' });
  await expect.poll(() => read()).toBe(2);
  viewport.scrollTo({ left: viewport.scrollWidth, behavior: 'instant' });
  await expect.poll(() => button('下一张').disabled).toBe(true);
});
