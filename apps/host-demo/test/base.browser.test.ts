// 基础组件演示页在真实浏览器里的行为与无障碍检查；每加一批组件就在这里补对应的检查
import axe from 'axe-core';
import { afterTransitions, themeTransition } from '@vue-tsx-pro/ui';
import { durations } from '@vue-tsx-pro/ui/tokens.stylex';
import { animate, cubicBezier } from 'animejs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let app: App;
let root: HTMLElement;

beforeEach(async () => {
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/base');
  await host.router.isReady();
  root = document.createElement('div');
  document.body.append(root);
  app = host.app;
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
});

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

it('VisuallyHidden：视觉上不占位，读屏名称仍然在', () => {
  const button = $('.icon-only');
  const hidden = button.querySelector('span')!;
  expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  expect(button.textContent?.trim()).toBe('设置');
});

/** 违规的规则与出问题的元素，失败时能直接看出是哪里 */
const violations = async () =>
  (await axe.run(root)).violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => `${node.target.join(' ')} ${node.any[0]?.message ?? ''}`).join(', ')}`,
  );

it('无障碍：演示页 axe-core 没有违规（亮色与暗色）', async () => {
  expect(await violations()).toEqual([]);
  $('.toggle-theme').click();
  // 主题切换时颜色有过渡，等过渡结束再检查对比度
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.all(document.getAnimations().map((animation) => animation.finished));
  expect(await violations()).toEqual([]);
});

describe('动效：Anime.js 的 JS 动画取主题 tokens', () => {
  it('选项读的是真实主题的取值（StyleX 生成的 CSS 变量）', () => {
    const { duration, ease } = themeTransition($('.ball'));
    expect(duration).toBe(200);
    expect((ease as (t: number) => number)(0.4)).toBeCloseTo(cubicBezier(0.2, 0, 0, 1)(0.4));
  });

  it('点击后小球按弹簧动画移动到位', async () => {
    $('.move-ball').click();
    await expect
      .poll(
        () =>
          $('.ball').getBoundingClientRect().left -
          $('.ball').parentElement!.getBoundingClientRect().left,
        { timeout: 3000 },
      )
      .toBeGreaterThanOrEqual(120);
  });

  it('时长 token 为 0（减少动态效果、主题覆盖）时立即完成，元素与 JS 对象都到位', async () => {
    const element = document.createElement('div');
    element.style.setProperty(/--[\w-]+/.exec(String(durations.md))![0], '0ms');
    root.append(element);
    const options = themeTransition(element);
    expect(options).toEqual({ duration: 0 });

    await animate(element, { opacity: 0, ...options });
    expect(getComputedStyle(element).opacity).toBe('0');
    const target = { x: 0 };
    await animate(target, { x: 100, ...options });
    expect(target.x).toBe(100);
  });
});

describe('折叠：Collapsible 与 Collapse', () => {
  const content = () => $('.details');
  const height = () => content().getBoundingClientRect().height;
  /** 收起后的隐藏方式：支持 until-found 的浏览器用它（可被页内搜索找到），否则用 inert */
  const hiddenWay = () =>
    'onbeforematch' in HTMLElement.prototype
      ? content().getAttribute('hidden')
      : content().hasAttribute('inert') && 'inert';

  it('点击触发器展开，高度有过渡；再点收起，过渡结束后才隐藏内容', async () => {
    const trigger = $('.details-trigger');
    expect(trigger.getAttribute('aria-controls')).toBe(content().id);
    expect(height()).toBe(0);
    expect(hiddenWay()).toBe('onbeforematch' in HTMLElement.prototype ? 'until-found' : 'inert');

    trigger.click();
    await nextFrame();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(content().getAnimations().length).toBeGreaterThan(0);
    await afterTransitions(content());
    expect(height()).toBeGreaterThan(0);
    expect(content().hasAttribute('hidden') || content().hasAttribute('inert')).toBe(false);

    trigger.click();
    await nextFrame();
    // 收起的过程中内容仍然可见，过渡结束后才隐藏
    expect(content().hasAttribute('hidden') || content().hasAttribute('inert')).toBe(false);
    await afterTransitions(content());
    await expect.poll(() => height()).toBe(0);
    await expect.poll(hiddenWay).toBeTruthy();
  });

  it('页内搜索命中收起的内容（beforematch）时展开并写回', async () => {
    content().dispatchEvent(new Event('beforematch'));
    await expect.poll(() => $('.details-trigger').getAttribute('aria-expanded')).toBe('true');
  });
});

describe('布局：Flex、Grid、Container、Separator', () => {
  const px = (value: string) => Number.parseFloat(value);
  const columnCount = (grid: HTMLElement) =>
    getComputedStyle(grid).gridTemplateColumns.split(' ').length;

  it('Flex：gap 档位取主题间距（em，随字号缩放），竖向分隔线随行高拉伸', () => {
    const flex = $('.flex-demo');
    const fontSize = px(getComputedStyle(flex).fontSize);
    expect(px(getComputedStyle(flex).columnGap)).toBeCloseTo(fontSize * 0.5);
    const separator = $('.separator-demo');
    expect(separator.getBoundingClientRect().width).toBeCloseTo(1);
    expect(separator.getBoundingClientRect().height).toBeGreaterThan(fontSize);
    expect(separator.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('Grid：minItemWidth 按容器宽度自动决定列数，比最小宽度还窄时单列且不溢出', () => {
    const grid = $('.grid-demo');
    // 10em 的格子、0.75em 的间距：30em 宽放 2 列，50em 宽放 4 列
    grid.style.width = '30em';
    expect(columnCount(grid)).toBe(2);
    grid.style.width = '50em';
    expect(columnCount(grid)).toBe(4);
    grid.style.width = '5em';
    expect(columnCount(grid)).toBe(1);
    const item = grid.firstElementChild!.getBoundingClientRect();
    expect(item.width).toBeLessThanOrEqual(grid.getBoundingClientRect().width + 0.5);
  });

  it('Container：最大宽度取主题 sizes（rem，跟随浏览器字号），左右内边距取 space', () => {
    const container = $('.container-demo');
    const style = getComputedStyle(container);
    expect(px(style.maxWidth)).toBeCloseTo(
      30 * px(getComputedStyle(document.documentElement).fontSize),
    );
    expect(px(style.paddingLeft)).toBeCloseTo(px(style.fontSize) * 0.75);
  });
});

describe('文本：H1–H6、Text、Link', () => {
  const px = (value: string) => Number.parseFloat(value);

  it('标题按级别取默认字号（H3 为 xl 18px），并去掉浏览器默认外边距', () => {
    const heading = $('.heading-demo');
    expect(heading.tagName).toBe('H3');
    expect(px(getComputedStyle(heading).fontSize)).toBe(18);
    expect(px(getComputedStyle(heading).marginTop)).toBe(0);
  });

  it('Text 的 lineClamp 把高度限制在给定行数之内', () => {
    const text = $('.clamp-demo');
    const lineHeight = px(getComputedStyle(text).lineHeight);
    expect(text.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight * 2 + 1);
    expect(text.scrollHeight).toBeGreaterThan(text.clientHeight);
  });

  it('外部链接在新窗口打开，读屏提示视觉上不占位', () => {
    const link = $<HTMLAnchorElement>('.external-demo');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
    const hint = [...link.querySelectorAll('span')].at(-1)!;
    expect(hint.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });
});
