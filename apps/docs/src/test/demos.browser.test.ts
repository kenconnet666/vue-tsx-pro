// 全部示例在真实浏览器里的通用检查：按分类放在页面上，亮、暗两套主题下 axe-core 都没有违规，原生控件都继承外层的字体；
// 整页示例（frames）各自单独检查。
// 其余内置主题的对比度由 themes:check 逐对 token 静态检查，不在浏览器里把全部示例再挂一遍（WebKit 上一套主题就要三分多钟）
import axe from 'axe-core';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { createUi, darkTheme, lightTheme } from '@zerodep-dev/vue-tsx-pro-ui';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { createApp, h, type App, type Component } from 'vue';
import { demoLoaders, loadDemos } from './demos';

/**
 * 开发模式下样式随模块加载、渲染陆续插入：样式表的规则数一段时间不再变化，才算到齐。
 * 没到齐就挂载会缺样式，比如虚拟列表的滚动容器没有高度，一万行全部渲染，页面卡死
 */
async function stylesSettled() {
  const ruleCount = () =>
    [...document.styleSheets].reduce((total, sheet) => {
      try {
        return total + sheet.cssRules.length;
      } catch {
        return total;
      }
    }, 0);
  let last = -1;
  for (let round = 0; round < 50 && ruleCount() !== last; round++) {
    last = ruleCount();
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/** 全部示例先加载、等样式到齐，再按分类挂载 */
const loaded = new Map<string, Component>();
beforeAll(async () => {
  for (const [path, demo] of await loadDemos()) loaded.set(path, demo);
  await stylesSettled();
}, 120_000);

let app: App | undefined;
let host: HTMLElement | undefined;
afterEach(() => {
  app?.unmount();
  host?.remove();
});

// 整页示例自带 main、header 这些地标，和别的示例放在同一个 main 里会重复
const isFrame = (path: string) => path.includes('/frames/');

/** 等颜色过渡结束（无限循环的加载动画不等），最多 1 秒 */
async function settle() {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.race([
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
}

const NATIVE_CONTROLS = 'input:not([type="hidden"]), button, select, textarea';

/**
 * 字体没人管的原生控件。浏览器给 input、button、select、textarea 的是自己的字体（Chromium 是 13.333px 的系统字体），
 * 不随外层；控件里按 em 定的尺寸（勾选框、开关的轨道）就按它算，和旁边的文字对不上。
 * 不能拿浏览器默认的字号比：WebKit 的按钮默认 13px，和 sm 档按钮自己写的一样。改为在最先声明（优先级最低）的层里
 * 给原生控件一个特殊的字号和字体：算出来还是它，说明组件的样式没写 font: inherit，也没写别的字体。
 * 视觉上隐藏的（hidden、VisuallyHidden 的 1px）看不到字，不管
 */
function uninheritedFonts(root: HTMLElement): string[] {
  const controls = [...root.querySelectorAll<HTMLElement>(NATIVE_CONTROLS)].filter((control) => {
    const { width, height } = control.getBoundingClientRect();
    return width > 1 && height > 1;
  });
  const probe = document.createElement('style');
  probe.textContent = `@layer font-probe { :where(${NATIVE_CONTROLS}) { font-size: 77px; font-family: font-probe; } }`;
  document.head.prepend(probe);
  try {
    return controls
      .filter((control) => {
        const { fontSize, fontFamily } = getComputedStyle(control);
        return fontSize === '77px' || fontFamily.includes('font-probe');
      })
      .map((control) => {
        const kind =
          control instanceof HTMLInputElement ? `input[${control.type}]` : control.localName;
        const scope = control.closest('[data-scope]');
        const part = control.dataset.part ?? scope?.getAttribute('data-part') ?? '-';
        return `font-inherit: ${kind} in ${scope?.getAttribute('data-scope') ?? '-'}/${part}`;
      });
  } finally {
    probe.remove();
  }
}

/** 把 render 挂到 tag 元素里，返回 axe 违规（规则与元素）与没继承字体的原生控件 */
async function problemsOf(tag: string, render: () => unknown, theme = lightTheme) {
  host = document.createElement(tag);
  document.body.append(host);
  app = createApp(_component(() => render as () => ReturnType<typeof h>)).use(
    createUi({ theme, paintDocument: true }),
  );
  app.mount(host);
  await settle();
  const { violations } = await axe.run(host);
  return [
    ...violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
    ),
    ...new Set(uninheritedFonts(host)),
  ];
}

/** 示例按分类分组（components/<分类>/…）：每组一个测试，单个测试不会因示例变多而超时，出错时也知道在哪一类 */
const paths = demoLoaders.map(([path]) => path);
const categories = new Map<string, string[]>();
for (const path of paths.filter((item) => !isFrame(item))) {
  const category = path.split('/')[1]!;
  categories.set(category, [...(categories.get(category) ?? []), path]);
}
const cases = [lightTheme, darkTheme].flatMap((theme) =>
  [...categories].map(([category, items]) => [theme.name, category, theme, items] as const),
);

it.each(cases)(
  '%s 主题下 %s 分类的示例：没有 axe 违规，原生控件继承字体',
  // 日期一类有十几个日历：CI 上 Windows 的 WebKit 超过了默认的 15 秒
  { timeout: 60_000 },
  async (_name, _category, theme, items) => {
    expect(
      await problemsOf(
        'main',
        () => items.map((path) => h('section', { key: path }, [h(loaded.get(path)!)])),
        theme,
      ),
    ).toEqual([]);
  },
);

it.each(paths.filter(isFrame))('整页示例 %s：没有 axe 违规，原生控件继承字体', async (path) => {
  expect(await problemsOf('div', () => h(loaded.get(path)!))).toEqual([]);
});
