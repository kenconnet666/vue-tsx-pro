// JS 动画参数取主题 tokens 的当前值；useAnimate 取主题并在卸载时取消（真实浏览器里的效果见 apps/host-demo/test）
import { createApp } from 'vue';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { afterEach, describe, expect, it } from 'vitest';
import { readToken } from '../../../config/theme/theme';
import { durations, easings } from '../../../config/theme/tokens';
import {
  animate,
  cubicBezier,
  setValues,
  spring,
  themeTransition,
  themeTransitionOrInstant,
  useAnimate,
  type JSAnimation,
} from '../animation';

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
    expect(ease!(0.4)).toBeCloseTo(cubicBezier(0.05, 0.7, 0.1, 1)(0.4));
  });

  it('给了 bounce 用弹簧：时长是弹簧停稳的时间，比感知时长长', () => {
    const el = element([[durations.md, '200ms']]);
    const params = themeTransition(el, { bounce: 0.3 });
    expect(params.duration).toBeGreaterThan(200);
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

it('themeTransitionOrInstant：没有主题样式时直接到位；token 写错了格式照常报错', () => {
  expect(themeTransitionOrInstant(element([]))).toEqual({ duration: 0 });
  const wrong = element([
    [durations.md, '200'],
    [easings.standard, 'cubic-bezier(0.2, 0, 0, 1)'],
  ]);
  expect(() => themeTransitionOrInstant(wrong)).toThrow(/无法识别的时长/);
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

  // 运行时样式下 token 的默认值随模块导入注入到 :root，读不到的情形用一个不在文档里的 scope 模拟
  it('scope 上读不到主题 token 时直接到位，不抛错', () => {
    const target = { value: 0 };
    let animation: JSAnimation | undefined;
    const app = createApp(
      _component(() => {
        animation = useAnimate()(target, { value: 1 }, { scope: document.createElement('div') });
        return () => null;
      }),
    );
    app.mount(document.createElement('div'));
    expect(animation!.duration).toBe(0);
    expect(animation!.completed).toBe(true);
    expect(target.value).toBe(1);
    app.unmount();
  });
});

describe('animate', () => {
  it('JS 对象：逐帧写值并回调，播完到终值、可以 await', async () => {
    const target = { value: 0 };
    const seen: number[] = [];
    const animation = animate(target, {
      value: 100,
      duration: 40,
      onUpdate: () => seen.push(target.value),
    });
    expect(animation.completed).toBe(false);
    await animation;
    expect(animation.completed).toBe(true);
    expect(target.value).toBe(100);
    expect(seen.at(-1)).toBe(100);
  });

  it('元素：x、y、scale 写进 transform 并保留其它函数，从当前值接着动；opacity、宽度写内联样式', () => {
    const el = element([]);
    el.style.transform = 'rotate(5deg) translateX(10px)';
    setValues(el, { y: 3, scale: 2, opacity: 0.5, width: 40 });
    expect(el.style.transform).toBe('rotate(5deg) translateX(10px) translateY(3px) scale(2)');
    expect(el.style.opacity).toBe('0.5');
    expect(el.style.width).toBe('40px');
    void animate(el, { x: 30, duration: 0 });
    expect(el.style.transform).toBe('rotate(5deg) translateX(30px) translateY(3px) scale(2)');
  });

  it('同一属性上的新动画替换旧的：旧的算取消，不再改值也不会完成；别的属性继续跑', async () => {
    const target = { a: 0, b: 0 };
    let oldFinished = false;
    const old = animate(target, { a: 100, duration: 10_000 });
    void old.then(() => (oldFinished = true));
    const both = animate(target, { a: 1, b: 1, duration: 20 });
    expect(old.cancelled).toBe(true);
    const partly = animate(target, { b: 5, duration: 20 });
    expect(both.cancelled).toBe(false);
    await both;
    await partly;
    expect(target).toEqual({ a: 1, b: 5 });
    expect(oldFinished).toBe(false);
  });

  it('cancel 停在当前值；set 停掉同一属性上的动画', async () => {
    const target = { value: 0 };
    const animation = animate(target, { value: 100, duration: 10_000 });
    animation.cancel();
    expect(animation.cancelled).toBe(true);
    const next = animate(target, { value: 100, duration: 10_000 });
    setValues(target, { value: 7 });
    expect(next.cancelled).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(target.value).toBe(7);
  });
});

it('cubicBezier：端点固定；直线曲线等于进度；曲线上的取值与手算一致', () => {
  const ease = cubicBezier(0, 0, 0.58, 1);
  expect([ease(0), ease(1)]).toEqual([0, 1]);
  expect(cubicBezier(0.25, 0.25, 0.75, 0.75)(0.3)).toBeCloseTo(0.3);
  // x(t) = 0.5 时 t ≈ 0.6258，y = 3t² − 2t³
  expect(ease(0.5)).toBeCloseTo(0.6846, 3);
});

describe('spring', () => {
  const samples = (ease: (progress: number) => number) =>
    Array.from({ length: 200 }, (_, index) => ease((index + 1) / 200));

  it('bounce 为 0 不越过终点；有回弹时越过终点；都停在终点附近', () => {
    const still = spring({ bounce: 0, duration: 300 });
    const bouncy = spring({ bounce: 0.4, duration: 300 });
    expect(Math.max(...samples(still.ease))).toBeLessThanOrEqual(1);
    expect(Math.max(...samples(bouncy.ease))).toBeGreaterThan(1);
    expect(still.ease(1)).toBeCloseTo(1, 2);
    expect(bouncy.ease(1)).toBeCloseTo(1, 2);
  });

  it('回弹越大，停稳越久', () => {
    expect(spring({ bounce: 0.4, duration: 300 }).duration).toBeGreaterThan(
      spring({ bounce: 0, duration: 300 }).duration,
    );
  });
});
