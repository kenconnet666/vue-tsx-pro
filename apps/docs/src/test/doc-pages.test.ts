// virtual:doc-pages：组件页带上各个示例的锚点、标题与说明里写到的属性名（站内搜索用）
import componentPages from 'virtual:doc-pages';
import { expect, it } from 'vitest';

it('示例的锚点、标题与说明里的属性名', () => {
  const table = componentPages.find((page) => page.name === 'DataTable')!;
  const wide = table.examples.find((example) => example.id === 'wide')!;
  expect(wide.title).toBe('宽表：列也虚拟滚动');
  expect(wide.keywords).toContain('virtualColumns');
  // 整页示例（自闭合的 <Example … />）也收进来，只是没有关键字
  const shell = componentPages.find((page) => page.name === 'AppShell')!;
  expect(shell.examples.length).toBeGreaterThan(0);
  const ids = componentPages.flatMap((page) =>
    page.examples.map((example) => `${page.name}#${example.id}`),
  );
  expect(new Set(ids).size).toBe(ids.length);
});
