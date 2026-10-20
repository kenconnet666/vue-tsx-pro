// 示例按分类放在页面上，亮、暗两套主题下 axe-core 都没有违规；整页示例（frames）各自单独检查。
// 其余内置主题的对比度由 themes:check 逐对 token 静态检查，不在浏览器里把全部示例再挂一遍（WebKit 上一套主题就要三分多钟）
import axe from 'axe-core';
import { _component } from '@vue-tsx-pro/tsx';
import { createUi, darkTheme, lightTheme } from '@vue-tsx-pro/ui';
import { afterEach, expect, it } from 'vitest';
import { createApp, h, type App, type Component } from 'vue';
import { demos } from './demos';

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

/** 把 render 挂到 tag 元素里，跑一遍 axe，返回违规（规则与元素） */
async function violationsOf(tag: string, render: () => unknown, theme = lightTheme) {
  host = document.createElement(tag);
  document.body.append(host);
  app = createApp(_component(() => render as () => ReturnType<typeof h>)).use(
    createUi({ theme, paintDocument: true }),
  );
  app.mount(host);
  await settle();
  const { violations } = await axe.run(host);
  return violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

/** 示例按分类分组（components/<分类>/…）：每组一个测试，单个测试不会因示例变多而超时，出错时也知道在哪一类 */
const categories = new Map<string, [string, Component][]>();
for (const entry of demos) {
  if (isFrame(entry[0])) continue;
  const category = entry[0].split('/')[1]!;
  categories.set(category, [...(categories.get(category) ?? []), entry]);
}
const cases = [lightTheme, darkTheme].flatMap((theme) =>
  [...categories].map(([category, items]) => [theme.name, category, theme, items] as const),
);

it.each(cases)(
  '无障碍：%s 主题下 %s 分类的示例没有 axe 违规',
  async (_name, _category, theme, items) => {
    expect(
      await violationsOf(
        'main',
        () => items.map(([path, demo]) => h('section', { key: path }, [h(demo)])),
        theme,
      ),
    ).toEqual([]);
  },
);

it.each(demos.filter(([path]) => isFrame(path)))(
  '无障碍：整页示例 %s 没有 axe 违规',
  async (_path, demo: Component) => {
    expect(await violationsOf('div', () => h(demo))).toEqual([]);
  },
);
