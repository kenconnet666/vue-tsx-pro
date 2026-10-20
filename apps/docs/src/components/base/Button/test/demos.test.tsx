// Button 的示例：文档里展示的用法本身就是被测对象
import { afterEach, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Button } from '@vue-tsx-pro/ui';
import { mount } from '../../../../test/mount';
import Disabled from '../demo/Disabled';
import Group from '../demo/Group';
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

it('Tones：三种色调 × 六种样式', () => {
  const buttons = mount(Tones).querySelectorAll('button');
  expect(buttons).toHaveLength(18);
});

it('Loading：点击后加载中（aria-busy），完成后恢复', async () => {
  vi.useFakeTimers();
  const button = mount(Loading).querySelector('button')!; // 第一个：保存，1.5 秒
  button.click();
  await nextTick();
  expect(button.getAttribute('aria-busy')).toBe('true');
  await vi.advanceTimersByTimeAsync(1500);
  expect(button.hasAttribute('aria-busy')).toBe(false);
});

it('Disabled：原生不可用；focusableWhenDisabled 仍可聚焦', () => {
  const buttons = [...mount(Disabled).querySelectorAll('button')];
  const [hard, soft] = [buttons[0], buttons.find((button) => button.textContent === '提交')];
  expect(hard!.disabled).toBe(true);
  expect([soft!.disabled, soft!.getAttribute('aria-disabled')]).toEqual([false, 'true']);
});

it('Group：组里的按钮相连，组上的外观是默认值', () => {
  const root = mount(Group);
  const group = root.querySelector('[aria-label="翻页"]')!;
  expect(group.getAttribute('role')).toBe('group');
  const [prev, page] = group.querySelectorAll('button');
  // 组上写了 outline + neutral：与单独写 variant="outline" tone="neutral" 的按钮样式相同
  const outline = mount(() => (
    <Button variant="outline" tone="neutral">
      x
    </Button>
  )).querySelector('button')!;
  expect(page!.className.split(' ')).toEqual(expect.arrayContaining(outline.className.split(' ')));
  expect(prev!.className).not.toBe(page!.className);
});
