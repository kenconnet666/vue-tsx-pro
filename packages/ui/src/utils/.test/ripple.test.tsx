// 波纹的开关与生命周期；扩散动画的样子见 apps/host-demo 的浏览器测试
import { describe, expect, it } from 'vitest';
import { Provider } from '../../config/Provider';
import { mount } from './mount';
import { startRipple, useRipple } from '../ripple';
import { _component } from '@vue-tsx-pro/tsx';

const down = (x = 5, y = 5) =>
  new PointerEvent('pointerdown', { clientX: x, clientY: y, button: 0, bubbles: true });
const ripples = (host: Element) => host.querySelectorAll('span[aria-hidden="true"]');

describe('startRipple', () => {
  const host = () => {
    const button = document.createElement('button');
    button.addEventListener('pointerdown', startRipple);
    button.addEventListener('keydown', startRipple);
    document.body.append(button);
    return button;
  };

  it('按下时加一个波纹，松开后移除（happy-dom 没有过渡，立即移除）', async () => {
    const button = host();
    button.dispatchEvent(down());
    expect(ripples(button)).toHaveLength(1);
    window.dispatchEvent(new PointerEvent('pointerup'));
    await new Promise((resolve) => setTimeout(resolve));
    expect(ripples(button)).toHaveLength(0);
  });

  it('键盘只认 Enter 与空格，按住的重复事件忽略；不可用时不出', () => {
    const button = host();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true }),
    );
    expect(ripples(button)).toHaveLength(0);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(ripples(button)).toHaveLength(1);

    const disabled = host();
    disabled.disabled = true;
    disabled.dispatchEvent(down());
    expect(ripples(disabled)).toHaveLength(0);
  });
});

describe('useRipple 的开关', () => {
  const Clickable = _component(({ ripple }: { ripple?: boolean }) => {
    const handlers = useRipple(() => ripple);
    return () => <button {...handlers}>x</button>;
  });

  it('默认开启；Provider 可以全局关闭，组件的 prop 优先', () => {
    const root = mount(() => (
      <>
        <Clickable />
        <Provider ripple={false}>
          <Clickable />
          <Clickable ripple />
        </Provider>
      </>
    ));
    const [on, off, forced] = root.querySelectorAll('button');
    for (const button of [on, off, forced]) button!.dispatchEvent(down());
    expect([on, off, forced].map((button) => ripples(button!).length)).toEqual([1, 0, 1]);
  });
});
