// JsonViewer 在真实浏览器里：全部展开到最深、循环引用停下；搜索留下匹配的项与祖先；五千条只渲染看得见的行
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { JsonViewer } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { nextTick } from 'vue';
import { mount } from '../../../../test/mount';
import Response from '../demo/Response';

const rows = (root: Element) =>
  [...root.querySelectorAll('[role="treeitem"]')].map((item) => item.textContent ?? '');
const button = (root: Element, text: string) =>
  [...root.querySelectorAll('button')].find((item) => item.textContent?.includes(text))!;

it('全部展开到最深；循环引用显示 [Circular]', async () => {
  await page.viewport(1000, 900);
  const node: Record<string, unknown> = { name: '根', child: { leaf: 1 } };
  node.self = node;
  const root = mount(_component(() => () => <JsonViewer value={node} maxHeight="40rem" />));
  button(root, '全部展开').click();
  await expect.poll(() => rows(root)).toContain('self:[Circular]');
  expect(rows(root)).toContain('leaf:1');
});

it('搜索留下匹配的项与祖先', async () => {
  await page.viewport(1000, 900);
  const root = mount(Response);
  const search = root.querySelector<HTMLInputElement>('input[type="search"]')!;
  search.value = 'TEA-12';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  await nextTick();
  await expect
    .poll(() => rows(root))
    .toEqual(['data:{…}10 项', 'items:[…]2 项', '1:{…}4 项', 'sku:"TEA-12"']);
});

it('五千条只渲染看得见的行', async () => {
  await page.viewport(1000, 900);
  const logs = Array.from({ length: 5000 }, (_, index) => ({ id: index }));
  const root = mount(_component(() => () => <JsonViewer value={logs} expandDepth={0} />));
  await expect.poll(() => rows(root).length).toBeGreaterThan(5);
  expect(rows(root).length).toBeLessThan(60);
  expect(root.querySelector('[role="treeitem"]')!.getAttribute('aria-setsize')).toBe('5000');
});
