// JS 动画参数取主题 tokens 的当前值；useAnimate 取主题并在卸载时取消（真实浏览器里的效果见 apps/host-demo/test）
import { cubicBezier, type JSAnimation } from 'animejs';
import { createApp } from 'vue';
import { _component } from '@vue-tsx-pro/tsx';
import { afterEach, describe, expect, it } from 'vitest';
import { readToken } from '../../config/theme/theme';
import { durations, easings } from '../../config/theme/tokens.stylex';
import { themeTransition, useAnimate } from '../animation';

const variable = (token: unknown) => /^var\((--[\w-]+)\)$/.exec(String(token))![1]!;

function element(values: [unknown, string][]) {
  const el = document.createElement('div');
  for (const [token, value] of values) el.style.setProperty(variable(token), value);
  document.body.append(el);
  return el;
}

afterEach(() => document.body.replaceChildren());

describe('themeTransition', () => {
  it('时长与缓动取 token 的当前值', () => {
    const el = element([
      [durations.lg, '0.3s'],
      [easings.enter, 'cubic-bezier(0.05, 0.7, 0.1, 1)'],
    ]);
    const { duration, ease } = themeTransition(el, { duration: 'lg', ease: 'enter' });
    expect(duration).toBe(300);
    const expected = cubicBezier(0.05, 0.7, 0.1, 1);
    expect((ease as (t: number) => number)(0.4)).toBeCloseTo(expected(0.4));
  });

  it('给了 bounce 用弹簧：时长交给弹簧决定', () => {
    const el = element([[durations.md, '200ms']]);
    const params = themeTransition(el, { bounce: 0.3 });
    expect(params.duration).toBeUndefined();
    expect(params.ease).toBeDefined();
  });

  it('时长为 0（减少动态效果、主题覆盖）时立即完成，弹簧也一样', () => {
    const el = element([[durations.md, '0ms']]);
    expect(themeTransition(el, { bounce: 0.3 })).toEqual({ duration: 0 });
  });

  it('缓动不是 cubic-bezier 时说明原因', () => {
    const el = element([
      [durations.md, '200ms'],
      [easings.standard, 'ease-out'],
    ]);
    expect(() => themeTransition(el)).toThrow(/cubic-bezier/);
  });
});

it('readToken 读不到时说明原因', () => {
  expect(() => readToken(document.createElement('div'), durations.md)).toThrow(/读不到主题 token/);
});

describe('useAnimate', () => {
  it('取主题的时长；组件卸载时取消还在跑的动画', () => {
    const el = element([
      [durations.md, '5s'],
      [easings.standard, 'cubic-bezier(0.2, 0, 0, 1)'],
    ]);
    let animation: JSAnimation | undefined;
    const app = createApp(
      _component(() => {
        const animate = useAnimate();
        animation = animate(el, { x: 100 });
        return () => null;
      }),
    );
    app.mount(document.createElement('div'));
    expect(animation!.duration).toBe(5000);
    expect(animation!.cancelled).toBe(false);
    app.unmount();
    expect(animation!.cancelled).toBe(true);
  });

  it('读不到主题 token（没有加载样式）时直接到位，不抛错', () => {
    const target = { value: 0 };
    let animation: JSAnimation | undefined;
    const app = createApp(
      _component(() => {
        animation = useAnimate()(target, { value: 1 });
        return () => null;
      }),
    );
    app.mount(document.createElement('div'));
    // Anime.js 把 0 当作一个极小的正数
    expect(animation!.duration).toBeLessThan(1);
    app.unmount();
  });
});
