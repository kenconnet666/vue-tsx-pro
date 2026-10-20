// 正文排版在真实浏览器里：标题的锚点链接平时透明，悬停标题或聚焦链接时显示（StyleX 的 when.ancestor）
import { _component } from '@vue-tsx-pro/tsx';
import { createUi, H2 } from '@vue-tsx-pro/ui';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { createApp, type App } from 'vue';

let app: App | undefined;
let root: HTMLElement;
afterEach(() => {
  app?.unmount();
  root.remove();
});

it('标题的锚点链接：悬停标题时出现', async () => {
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(
    _component(() => () => (
      <H2 id="install" anchor>
        安装
      </H2>
    )),
  );
  app.use(createUi());
  app.mount(root);
  const link = root.querySelector('a')!;
  const opacity = () => getComputedStyle(link).opacity;
  await expect.poll(opacity).toBe('0');
  await userEvent.hover(root.querySelector('h2')!);
  await expect.poll(opacity).toBe('1');
});
