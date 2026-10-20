// 所有示例一起放在页面上，每套内置主题下 axe-core 都没有违规；整页示例（frames）各自单独检查
import axe from 'axe-core';
import { _component } from '@vue-tsx-pro/tsx';
import { builtinThemes, createUi, lightTheme } from '@vue-tsx-pro/ui';
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

it.each(Object.entries(builtinThemes))(
  '无障碍：%s 主题下所有示例没有 axe 违规',
  // 第一套主题要先加载全部示例模块：示例越来越多，Windows 上的 WebKit 超过了一分钟
  { timeout: 120_000 },
  async (_name, theme) => {
    const inline = demos.filter(([path]) => !isFrame(path));
    expect(
      await violationsOf(
        'main',
        () => inline.map(([path, demo]) => h('section', { key: path }, [h(demo)])),
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
