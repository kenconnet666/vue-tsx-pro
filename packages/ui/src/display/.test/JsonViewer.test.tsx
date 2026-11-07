// JsonViewer：第一层展开、值按类型显示（bigint、Decimal、Date 照实）、全部展开 / 收起、选中后路径栏的路径；深层与搜索见文档站的浏览器测试
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { JsonViewer } from '../JsonViewer';

class Money {
  readonly #text: string;
  constructor(text: string) {
    this.#text = text;
  }
  toFixed() {
    return this.#text;
  }
  toString() {
    return this.#text;
  }
}

const sample = () => {
  const order: Record<string, unknown> = {
    id: 9007199254740993n,
    'unit-price': new Money('12.50'),
    placedAt: new Date('2026-11-08T08:00:00Z'),
    paid: true,
    note: null,
    items: [{ sku: 'A-1', qty: 2 }],
  };
  order.self = order;
  return order;
};

const rows = (root: Element) =>
  [...root.querySelectorAll('[role="treeitem"]')].map((item) => item.textContent);

describe('JsonViewer', () => {
  it('第一层的容器展开；bigint、Decimal、Date 照实显示；循环引用不无限展开', async () => {
    const root = mount(() => <JsonViewer value={sample()} aria-label="订单" />);
    await nextTick();
    const texts = rows(root);
    expect(texts).toContain('id:9007199254740993');
    expect(texts).toContain('unit-price:12.50');
    expect(texts).toContain('placedAt:2026-11-08T08:00:00.000Z');
    expect(texts).toContain('items:[…]1 项');
    expect(texts).toContain('0:{…}2 项');
    expect(root.querySelector('[role="tree"]')!.getAttribute('aria-label')).toBe('订单');
  });

  it('全部收起、全部展开改的是各项的 aria-expanded', async () => {
    const root = mount(() => <JsonViewer value={sample()} />);
    await nextTick();
    const expandedOf = (name: string) =>
      [...root.querySelectorAll('[role="treeitem"]')]
        .find((item) => item.textContent?.startsWith(name))!
        .getAttribute('aria-expanded');
    const button = (text: string) =>
      [...root.querySelectorAll('button')].find((item) => item.textContent?.includes(text))!;
    button('全部收起').click();
    await nextTick();
    expect(expandedOf('items')).toBe('false');
    button('全部展开').click();
    await nextTick();
    expect([expandedOf('items'), expandedOf('0:')]).toEqual(['true', 'true']);
  });

  it('选中一项后路径栏显示它的路径（不是标识符的键写成 ["…"]）', async () => {
    const root = mount(() => <JsonViewer value={sample()} />);
    await nextTick();
    const price = [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')].find((item) =>
      item.textContent?.startsWith('unit-price'),
    )!;
    price.click();
    await nextTick();
    expect(root.textContent).toContain('$["unit-price"]');
    expect(root.querySelectorAll('button[aria-label^="复制"]')).toHaveLength(2);
  });
});
