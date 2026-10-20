// 所有示例一起放在页面上，亮色、暗色、纸张三套主题下 axe-core 都没有违规
import axe from 'axe-core';
import { _component } from '@vue-tsx-pro/tsx';
import {
  createUi,
  darkTheme,
  highContrastTheme,
  lightTheme,
  midnightTheme,
  paperTheme,
} from '@vue-tsx-pro/ui';
import { afterEach, expect, it } from 'vitest';
import { createApp, h, type App } from 'vue';
import { demos } from './demos';

let app: App | undefined;
let host: HTMLElement | undefined;
afterEach(() => {
  app?.unmount();
  host?.remove();
});

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

it.each([
  ['亮色', lightTheme],
  ['暗色', darkTheme],
  ['纸张', paperTheme],
  ['午夜', midnightTheme],
  ['高对比', highContrastTheme],
] as const)('无障碍：%s主题下所有示例没有 axe 违规', { timeout: 60_000 }, async (_name, theme) => {
  host = document.createElement('main');
  document.body.append(host);
  app = createApp(
    _component(() => () => demos.map(([path, demo]) => h('section', { key: path }, [h(demo)]))),
  ).use(createUi({ theme, paintDocument: true }));
  app.mount(host);
  await settle();
  const { violations } = await axe.run(host);
  expect(
    violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
    ),
  ).toEqual([]);
});
