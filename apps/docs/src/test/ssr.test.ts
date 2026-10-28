// @vitest-environment node
// 服务端渲染体检：每个示例在没有 DOM 的服务端 renderToString，不能抛错、不能有 Vue 的警告（ROADMAP 12.1）。
// 浏览器里的水合一致性见 ROADMAP 12.4
import { expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { createUi } from '@zerodep-dev/vue-tsx-pro-ui';
import { demoLoaders } from './demos';

it('每个示例都能在服务端渲染，没有报错与警告', { timeout: 600_000 }, async () => {
  const failed: string[] = [];
  for (const [path, load] of demoLoaders) {
    const messages: string[] = [];
    const spies = (['warn', 'error'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        messages.push(args.map(String).join(' ').split('\n')[0]!);
      }),
    );
    try {
      const demo = await load();
      const html = await renderToString(
        createSSRApp(_component(() => () => h(demo))).use(createUi()),
      );
      if (messages.length) failed.push(`${path}：${messages[0]}`);
      else if (!html) failed.push(`${path}：没有输出`);
    } catch (error) {
      failed.push(`${path}：${String(error).split('\n')[0]}`);
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  }
  expect(failed).toEqual([]);
});
