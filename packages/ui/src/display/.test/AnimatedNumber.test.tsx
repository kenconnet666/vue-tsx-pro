// AnimatedNumber：按语言格式化；读屏只读终值；trend 按正负着色（时长按 0 处理，滚动见浏览器）
import { expect, it } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { mount } from '../../utils/.test/mount';
import { AnimatedNumber } from '../AnimatedNumber';

it('金额默认取语言包的币种；滚动中的数字对读屏隐藏，另有终值文字', () => {
  const root = mount(() => <AnimatedNumber value={1234.5} format={{ style: 'currency' }} />);
  const shown = root.querySelector('[aria-hidden="true"]')!;
  expect(shown.textContent).toBe('¥1,234.50');
  expect(shown.nextElementSibling!.textContent).toBe('¥1,234.50');
});

it('值变化后（时长为 0）直接到位；前后缀是部件', async () => {
  const value = shallowRef(1);
  const root = mount(() => (
    <AnimatedNumber value={value.value} prefix="共 " suffix=" 人" propsSuffix={{ class: 'unit' }} />
  ));
  value.value = 2048;
  await nextTick();
  await nextTick();
  expect(root.textContent).toBe('共 2,0482,048 人');
  expect(root.querySelector('.unit')!.textContent).toBe(' 人');
});

it('trend：data-trend 按正负写 up / down / flat', () => {
  const root = mount(() => (
    <>
      <AnimatedNumber value={0.12} trend format={{ style: 'percent' }} />
      <AnimatedNumber value={-3} trend />
      <AnimatedNumber value={0} trend />
    </>
  ));
  expect(
    [...root.querySelectorAll('[data-trend]')].map((el) => el.getAttribute('data-trend')),
  ).toEqual(['up', 'down', 'flat']);
});
