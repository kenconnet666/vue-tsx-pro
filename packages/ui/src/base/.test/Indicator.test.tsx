// Indicator：计数超过 max 显示 max+；0 默认不显示；读屏念完整的说明
import { expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Indicator } from '../Indicator';

const badge = (root: Element) => root.querySelector('[data-placement]');

it('计数：超过 max 显示“max+”，数字对读屏隐藏，另有说明', () => {
  const root = mount(() => (
    <Indicator count={120}>
      <button>通知</button>
    </Indicator>
  ));
  expect(badge(root)!.querySelector('[aria-hidden]')!.textContent).toBe('99+');
  expect(badge(root)!.textContent).toBe('99+120 条新消息');
});

it('0 默认不显示，showZero 时显示；dot 只显示小圆点，说明可以改', () => {
  const root = mount(() => (
    <>
      <Indicator count={0} class="zero" />
      <Indicator count={0} showZero class="shown" />
      <Indicator dot label="在线" placement="bottom-end" class="dot" />
    </>
  ));
  expect(badge(root.querySelector('.zero')!)).toBeNull();
  expect(badge(root.querySelector('.shown')!)!.textContent).toBe('00 条新消息');
  const dot = badge(root.querySelector('.dot')!)!;
  expect(dot.textContent).toBe('在线');
  expect(dot.getAttribute('data-placement')).toBe('bottom-end');
});

it('部件属性：计数文字，始终对读屏隐藏', () => {
  const root = mount(() => (
    <Indicator count={5} propsCount={{ class: 'count' }}>
      <span>消息</span>
    </Indicator>
  ));
  const count = root.querySelector('.count')!;
  expect([count.textContent, count.getAttribute('aria-hidden')]).toEqual(['5', 'true']);
});
