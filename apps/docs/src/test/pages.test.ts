// 每个文档页都能渲染：标题是 meta 里的标题，本页的锚点不重复
import { beforeAll, describe, expect, it } from 'vitest';
import { allPages } from '../site/nav';
import { mount } from './mount';

// 第一次读 API 数据要建 TypeScript 程序（几秒，整套测试一起跑时十几秒）：先导入第一页把它建好，给单独的超时，
// 不算进某一页的 30 秒里
describe('文档页', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await allPages[0]!.component();
  }, 120_000);

  it.each(allPages.map((page) => [page.path, page] as const))('%s', async (_path, page) => {
    const { default: component } = await page.component();
    const host = mount(component);
    await new Promise((resolve) => setTimeout(resolve));
    expect(host.querySelector('h1')!.textContent).toBe(page.title);
    const ids = [...host.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
