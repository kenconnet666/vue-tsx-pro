// Carousel：带名称的区域（aria-roledescription="carousel"），每张是“第 n 张，共 m 张”的 group；
// 上一张 / 下一张、页点写回 _index，不循环时两头的按钮不可用（滚动本身由浏览器做，见浏览器测试）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Carousel } from '../Carousel';

const slides = ['春', '夏', '秋'];

describe('Carousel', () => {
  it('区域与每一张的名称', () => {
    const root = mount(() => (
      <Carousel items={slides} aria-label="四季">
        {(season) => season}
      </Carousel>
    ));
    const region = root.querySelector('section')!;
    expect([
      region.getAttribute('aria-roledescription'),
      region.getAttribute('aria-label'),
    ]).toEqual(['carousel', '四季']);
    const names = [...root.querySelectorAll('[aria-roledescription="slide"]')].map((slide) =>
      slide.getAttribute('aria-label'),
    );
    expect(names).toEqual(['第 1 张，共 3 张', '第 2 张，共 3 张', '第 3 张，共 3 张']);
  });

  it('按钮与页点写回 _index；不循环时两头的按钮不可用', async () => {
    let index = _state(0);
    const root = mount(() => (
      <Carousel items={slides} _index={index} loop={false} aria-label="四季">
        {(season) => season}
      </Carousel>
    ));
    const button = (label: string) =>
      root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    expect(button('上一张').disabled).toBe(true);
    button('下一张').click();
    await nextTick();
    expect(index).toBe(1);
    button('第 3 张，共 3 张').click();
    await nextTick();
    expect(index).toBe(2);
    expect(button('下一张').disabled).toBe(true);
    expect(button('第 3 张，共 3 张').getAttribute('aria-current')).toBe('true');
  });
});
