// 每个示例都能渲染出内容，渲染时没有 Vue 的警告与报错
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadDemos } from './demos';
import { mount } from './mount';

const demos = await loadDemos();

const messages: string[] = [];
beforeEach(() => {
  messages.length = 0;
  for (const level of ['warn', 'error'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      messages.push(`${level}: ${args.map(String).join(' ')}`);
    });
  }
});
afterEach(() => vi.restoreAllMocks());

it('找到了示例', () => {
  expect(demos.length).toBeGreaterThan(10);
});

it.each(demos)('%s', (_path, demo) => {
  const host = mount(demo);
  // 纯画面的示例（3D 场景）没有文字：画布、带名称的图像也算内容
  const visuals = host.querySelectorAll('svg, canvas, [role="img"][aria-label]').length;
  expect(host.textContent!.length + visuals).toBeGreaterThan(0);
  expect(messages).toEqual([]);
});
