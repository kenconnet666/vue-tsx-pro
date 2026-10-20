// Button 的示例：文档里展示的用法本身就是被测对象
import { afterEach, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../../../test/mount';
import Disabled from '../demo/Disabled';
import Loading from '../demo/Loading';
import Tones from '../demo/Tones';
import Variants from '../demo/Variants';

afterEach(() => vi.useRealTimers());

it('Variants：六种样式各不相同', () => {
  const buttons = [...mount(Variants).querySelectorAll('button')];
  expect(buttons.map((button) => button.textContent)).toEqual([
    'solid',
    'soft',
    'surface',
    'outline',
    'ghost',
    'link',
  ]);
  expect(new Set(buttons.map((button) => button.className)).size).toBe(6);
});

it('Tones：三种色调 × 三种样式', () => {
  const buttons = mount(Tones).querySelectorAll('button');
  expect(buttons).toHaveLength(9);
});

it('Loading：点击后加载中（aria-busy），完成后恢复', async () => {
  vi.useFakeTimers();
  const button = mount(Loading).querySelector('button')!;
  button.click();
  await nextTick();
  expect(button.getAttribute('aria-busy')).toBe('true');
  await vi.advanceTimersByTimeAsync(1500);
  expect(button.hasAttribute('aria-busy')).toBe(false);
});

it('Disabled：原生不可用；focusableWhenDisabled 仍可聚焦', () => {
  const [hard, soft] = mount(Disabled).querySelectorAll('button');
  expect(hard!.disabled).toBe(true);
  expect([soft!.disabled, soft!.getAttribute('aria-disabled')]).toEqual([false, 'true']);
});
