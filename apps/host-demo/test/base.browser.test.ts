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

it('性能：演示页（含一万行表格、一万个选项）挂载在 2 秒内', async () => {
  // 曾经因为选项列表生成行时 O(n²) 而要 5–10 秒；正常时一两百毫秒，这里给慢的 CI 机器留足余量
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/base');
  await host.router.isReady();
  const target = document.createElement('div');
  document.body.append(target);
  const start = performance.now();
  host.app.mount(target);
  const elapsed = performance.now() - start;
  host.app.unmount();
  target.remove();
  expect(elapsed).toBeLessThan(2000);
});

it('表单：必填标记与输入框的约束来自 zod schema；提交不通过时显示错误并聚焦第一个出错的控件', async () => {
  const form = $('.zod-form-demo');
  const [email, nickname] = form.querySelectorAll('input');
  const [emailLabel, nicknameLabel] = form.querySelectorAll('label');
  expect([email!.type, email!.required]).toEqual(['email', true]);
  expect(nickname!.getAttribute('maxlength')).toBe('12');
  expect(emailLabel!.querySelector('svg')).not.toBeNull();
  expect(nicknameLabel!.querySelector('svg')).toBeNull();
  form.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  await expect.poll(() => document.activeElement).toBe(email);
  expect(form.textContent).toContain('邮箱格式不对');
  expect(form.textContent).toContain('请选择城市');
});

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

it('窄屏（测试视口约 414px）下页面没有横向溢出', async () => {
  // 溢出的元素在视口外，axe 取不到它们的背景色，会按白色算：亮色主题里刚好蒙对，暗色才暴露
  await nextFrame();
  const main = root.querySelector('main')!;
  expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth);
});

// 演示页的组件很多，Firefox、WebKit 里跑两遍 axe 要十几秒
it('无障碍：演示页 axe-core 没有违规（亮色与暗色）', { timeout: 60_000 }, async () => {
  expect(await violations()).toEqual([]);
  $('.toggle-theme').click();
  // 主题切换时颜色有过渡，等过渡结束再检查对比度
  await new Promise((resolve) => requestAnimationFrame(resolve));
  // 无限循环的动画（加载指示）永远不会结束，不等它；Firefox 里个别过渡也停在 running，最多等 1 秒
  // （主题颜色的过渡是 durations.sm，远小于 1 秒）
  await Promise.race([
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
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

  it('Result 的图标挂载时一笔画出：先擦掉、再画完整', async () => {
    $('.result-replay').click();
    await nextFrame();
    const stroke = () => $('.result-demo svg').firstElementChild as SVGGeometryElement;
    // Anime.js 把进度写在 draw 属性上：'起点 终点'（0–1）
    const end = () => Number(stroke().getAttribute('draw')?.split(' ')[1]);
    expect(end()).toBeLessThan(1);
    await expect.poll(end, { timeout: 3000 }).toBe(1);
  });

  it('Checkbox：初次渲染不描线，用户勾上时对勾一笔画出', async () => {
    const input = $<HTMLInputElement>('.agree-demo');
    const stroke = () => input.parentElement!.querySelector('svg')!.firstElementChild!;
    expect(stroke().hasAttribute('draw')).toBe(false);
    input.click();
    await nextFrame();
    const end = () => Number(stroke().getAttribute('draw')?.split(' ')[1]);
    expect(end()).toBeLessThan(1);
    await expect.poll(end, { timeout: 3000 }).toBe(1);
  });

  it('AnimatedNumber：数值变化时滚动，读屏文字直接是终值，滚完两者一致', async () => {
    const number = $('.revenue-demo');
    const shown = () => number.querySelector('[aria-hidden="true"]')!.textContent;
    const label = () =>
      number.querySelector('[aria-hidden="true"]')!.nextElementSibling!.textContent;
    const before = label();
    $('.stats-update').click();
    await expect.poll(label).not.toBe(before);
    expect(shown()).not.toBe(label());
    await expect.poll(() => shown() === label(), { timeout: 3000 }).toBe(true);
  });

  it('布局动画：加一项时原来的项从旧位置平移过去，结束后停在新位置', async () => {
    const list = $('.layout-demo');
    const chip = [...list.children].find((element) => element.textContent === '1') as HTMLElement;
    // 视觉位置（含变换）与布局位置（offsetLeft 不受变换影响）之差：动画中不为 0
    const offset = () =>
      chip.getBoundingClientRect().left -
      list.getBoundingClientRect().left -
      (chip.offsetLeft - list.offsetLeft);
    // offsetLeft 取整，留 1px 余量
    expect(Math.abs(offset())).toBeLessThan(1);
    $('.layout-add').click();
    await expect.poll(() => Math.abs(offset())).toBeGreaterThan(2);
    await expect.poll(() => Math.abs(offset()), { timeout: 3000 }).toBeLessThan(1);
    expect(list.firstElementChild!.textContent).toBe('7');
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
    // WebKit 不一定在下一帧就建好过渡（Chromium 在 getAnimations 时会强制计算样式），轮询等它出现；
    // Linux 上的 WebKit 偶尔在轮询到之前就播完了，此时高度已经展开，同样算过（CI 上曾偶发失败）
    await expect.poll(() => content().getAnimations().length > 0 || height() > 0).toBe(true);
    // Linux 上的 WebKit 偶尔把过渡停在起点（同 Drawer 的测试）：最多等 1 秒，然后让过渡直接到终点
    await Promise.race([
      afterTransitions(content()),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    for (const animation of content().getAnimations()) animation.finish();
    await expect.poll(() => height()).toBeGreaterThan(0);
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

describe('代码块：CodeBlock + Shiki', () => {
  it('应用级注入的 Shiki 高亮器异步替换纯文本，关键字颜色取主题 tokens', async () => {
    const code = () => $('.codeblock-demo code');
    await expect.poll(() => code().querySelector('span'), { timeout: 10000 }).toBeTruthy();
    const keyword = [...code().querySelectorAll('span')].find(
      (span) => span.textContent === 'export',
    )!;
    expect(getComputedStyle(keyword).color).not.toBe(getComputedStyle(code()).color);
    // 行内结构用 br 换行：四行代码
    expect(code().querySelectorAll('br')).toHaveLength(3);
  });

  it('没给语言时是纯文本；pre 可以用键盘聚焦（横向滚动）并显示焦点环', async () => {
    const pre = $('.codeblock-plain');
    expect(pre.querySelector('span')).toBeNull();
    pre.focus();
    expect(document.activeElement).toBe(pre);
  });
});

describe('虚拟列表：VirtualList', () => {
  const list = () => $('.virtual-demo');
  const rendered = () => [...list().querySelectorAll<HTMLElement>('[role="listitem"]')];
  const posinset = (element: Element) => Number(element.getAttribute('aria-posinset'));
  /** 渲染出来的项依次相接：测量后的位置没有重叠或空隙 */
  const contiguous = () =>
    rendered().every((item, index, items) => {
      const next = items[index + 1];
      return (
        !next ||
        Math.abs(next.getBoundingClientRect().top - item.getBoundingClientRect().bottom) < 1
      );
    });

  it('一万行只渲染可见的几十行；总高度撑开滚动区域，读屏知道总数', async () => {
    await nextFrame();
    expect(rendered().length).toBeGreaterThan(5);
    expect(rendered().length).toBeLessThan(40);
    expect(list().scrollHeight).toBeGreaterThan(10000 * 20);
    expect(rendered()[0]!.getAttribute('aria-setsize')).toBe('10000');
  });

  it('行高不固定：渲染后测量，两行文字的行更高，各行首尾相接', async () => {
    await nextFrame();
    const [short, , , tall] = rendered();
    expect(tall!.getBoundingClientRect().height).toBeGreaterThan(
      short!.getBoundingClientRect().height * 1.5,
    );
    await expect.poll(contiguous).toBe(true);
  });

  it('滚动后渲染那一段，滚动位置之后的项接着出现', async () => {
    list().scrollTop = 30000;
    await expect.poll(() => posinset(rendered()[0]!)).toBeGreaterThan(500);
    const listTop = list().getBoundingClientRect().top;
    // 视口顶部附近一定有渲染出来的项
    expect(
      rendered().some((item) => {
        const { top, bottom } = item.getBoundingClientRect();
        return top <= listTop + 1 && bottom > listTop;
      }),
    ).toBe(true);
  });

  it('scrollToIndex：第 5001 行对齐到视口顶部（动态行高下重新对准）', async () => {
    $('.scroll-to-row').click();
    await expect
      .poll(() => {
        const target = rendered().find((item) => posinset(item) === 5001);
        return (
          target &&
          Math.abs(
            Math.round(target.getBoundingClientRect().top - list().getBoundingClientRect().top),
          )
        );
      })
      .toBeLessThanOrEqual(1); // 列表边框 1px
    expect(contiguous()).toBe(true);
  });

  it('容器可以用键盘聚焦并滚动', async () => {
    list().focus();
    expect(document.activeElement).toBe(list());
  });
});

describe('切换按钮组：ToggleGroup', () => {
  it('单选的滑块盖住选中项，切换时滑过去，滑完与新选中项重合', async () => {
    const group = $('.toggle-single');
    const thumb = group.querySelector<HTMLElement>('[aria-hidden="true"]')!;
    const box = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return [rect.left, rect.top, rect.width, rect.height];
    };
    // offsetLeft 等取整，留 1px 余量
    const overlaps = (a: Element, b: Element) =>
      box(a).every((value, index) => Math.abs(value - box(b)[index]!) <= 1);
    const items = group.querySelectorAll('button');
    expect(overlaps(thumb, group.querySelector('[aria-pressed="true"]')!)).toBe(true);
    const target = [...items].find((item) => item.getAttribute('aria-pressed') === 'false')!;
    target.click();
    await nextFrame();
    expect(overlaps(thumb, target)).toBe(false);
    await expect.poll(() => overlaps(thumb, target), { timeout: 3000 }).toBe(true);
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

  it('GridList：minItemWidth 按容器宽度自动决定列数，比最小宽度还窄时单列且不溢出', () => {
    const grid = $('.grid-demo');
    // 列表去掉了圆点与缩进
    expect(grid.tagName).toBe('UL');
    expect(getComputedStyle(grid).paddingInlineStart).toBe('0px');
    expect(getComputedStyle(grid.firstElementChild!).listStyleType).toBe('none');
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

  it('Paragraph 去掉浏览器默认外边距；Small 默认字号 xs（12px）', () => {
    expect(px(getComputedStyle($('.clamp-demo')).marginBlockStart)).toBe(0);
    const small = $('.small-demo');
    expect(small.tagName).toBe('SMALL');
    expect(px(getComputedStyle(small).fontSize)).toBe(12);
  });

  it('外部链接在新窗口打开，读屏提示视觉上不占位', () => {
    const link = $<HTMLAnchorElement>('.external-demo');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
    const hint = [...link.querySelectorAll('span')].at(-1)!;
    expect(hint.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });
});
