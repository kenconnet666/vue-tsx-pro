// 每个文档页都能渲染：标题是 meta 里的标题，本页的锚点不重复
import { describe, expect, it } from 'vitest';
import { allPages } from '../site/nav';
import { mount } from './mount';

// 第一次读 API 数据要建 TypeScript 程序（几秒），整套测试一起跑时更慢
describe('文档页', { timeout: 30_000 }, () => {
  it.each(allPages.map((page) => [page.path, page] as const))('%s', async (_path, page) => {
    const { default: component } = await page.component();
    const host = mount(component);
    await new Promise((resolve) => setTimeout(resolve));
    expect(host.querySelector('h1')!.textContent).toBe(page.title);
    const ids = [...host.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
