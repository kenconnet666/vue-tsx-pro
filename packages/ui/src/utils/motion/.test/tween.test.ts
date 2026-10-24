// useTween / useSpring：目标变化时 current 过渡过去；时长为 0（减少动态效果、读不到主题）时当场到位
import { _component } from '@vue-tsx-pro/tsx';
import { h, nextTick, shallowRef } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { durations, easings } from '../../../config/theme/tokens';
import { mount } from '../../.test/mount';
import { useSpring, useTween, type Tweened } from '../tween';

const variable = (token: unknown) => /^var\((--[\w-]+)\)$/.exec(String(token))![1]!;

function setTheme(duration: string) {
  const root = document.documentElement.style;
  root.setProperty(variable(durations.md), duration);
  root.setProperty(variable(easings.standard), 'cubic-bezier(0.2, 0, 0, 1)');
}

afterEach(() => document.documentElement.removeAttribute('style'));

function setup(create: (read: () => number) => Tweened) {
  const value = shallowRef(0);
  let tween!: Tweened;
  const Probe = _component(() => {
    tween = create(() => value.value);
    return () => null;
  });
  mount(() => h(Probe));
  return { value, tween: () => tween };
}

describe.each([
  ['useTween', (read: () => number, from?: number) => useTween(read, { from })],
  ['useSpring', (read: () => number, from?: number) => useSpring(read, { from })],
])('%s', (_, create) => {
  it('一开始直接显示目标', () => {
    const { tween } = setup((read) => create(read));
    expect(tween().current).toBe(0);
  });

  it('时长为 0 时目标一变就到位', async () => {
    setTheme('0ms');
    const { value, tween } = setup((read) => create(read));
    value.value = 42;
    await nextTick();
    expect(tween().target).toBe(42);
    expect(tween().current).toBe(42);
  });

  it('有时长时过渡中还停在旧值附近', async () => {
    setTheme('5s');
    const { value, tween } = setup((read) => create(read));
    value.value = 100;
    await nextTick();
    expect(tween().target).toBe(100);
    expect(tween().current).toBeLessThan(100);
  });

  it('给了 from 时挂载就从它过渡到目标', () => {
    setTheme('5s');
    const { tween } = setup((read) => create(read, -50));
    expect(tween().target).toBe(0);
    expect(tween().current).toBeLessThan(0);
  });
});
