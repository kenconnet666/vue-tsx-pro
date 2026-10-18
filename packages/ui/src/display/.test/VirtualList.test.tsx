// 虚拟列表的渲染与无障碍属性；真实滚动、测量与 scrollToIndex 见 apps/host-demo/test/base.browser.test.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { VirtualList, type VirtualListHandle } from '../VirtualList';

// happy-dom 不排版：给滚动容器一个 200px 的视口
const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { get: () => 200 });
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
});

const rows = Array.from({ length: 1000 }, (_, index) => ({
  id: `row-${index}`,
  label: `第 ${index} 行`,
}));
const listItems = (root: Element) => [...root.querySelectorAll('[role="listitem"]')];

describe('VirtualList', () => {
  it('只渲染可见范围加 overscan 的项；每项带 aria-setsize 与 aria-posinset', async () => {
    const root = mount(() => (
      <VirtualList
        items={rows}
        itemKey={(row) => row.id}
        estimateSize={40}
        overscan={2}
        aria-label="行"
      >
        {(row) => <span>{row.label}</span>}
      </VirtualList>
    ));
    await nextTick();
    const list = root.querySelector('[role="list"]')!;
    expect(list.getAttribute('aria-label')).toBe('行');
    expect(list.getAttribute('tabindex')).toBe('0');
    // 200px 视口、40px 一行：可见 0–4，后面再加 2 行（前面已到开头）
    const items = listItems(root);
    expect(items).toHaveLength(7);
    expect(items[0]!.getAttribute('aria-setsize')).toBe('1000');
    expect(items[3]!.getAttribute('aria-posinset')).toBe('4');
    expect(items[3]!.textContent).toBe('第 3 行');
  });

  it('数据变了重新排：总大小跟着变', async () => {
    let data = _state(rows.slice(0, 3));
    const root = mount(() => (
      <VirtualList items={data} estimateSize={40}>
        {(row) => row.label}
      </VirtualList>
    ));
    await nextTick();
    expect(listItems(root)).toHaveLength(3);
    const spacer = () => root.querySelector('[role="presentation"]')!.getAttribute('style');
    expect(spacer()).toContain('120');
    data = rows.slice(0, 5);
    await nextTick();
    expect(listItems(root)).toHaveLength(5);
    expect(spacer()).toContain('200');
  });

  it('没有数据时显示 empty，不是列表', async () => {
    const root = mount(() => (
      <VirtualList items={[]} empty={<p class="empty">暂无数据</p>}>
        {() => null}
      </VirtualList>
    ));
    await nextTick();
    expect(root.querySelector('.empty')).not.toBeNull();
    expect(root.querySelector('[role="list"]')).toBeNull();
  });

  it('window 模式不是滚动容器：不加 tabindex', async () => {
    const root = mount(() => (
      <VirtualList items={rows} scroll="window">
        {(row) => row.label}
      </VirtualList>
    ));
    await nextTick();
    expect(root.querySelector('[role="list"]')!.hasAttribute('tabindex')).toBe(false);
  });

  it('handle 拿到滚动方法；onRangeChange 报告可见范围', async () => {
    let handle: VirtualListHandle | undefined;
    // 挂载之后才交出：回调里立即滚动也能生效
    let mountedWhenReceived = false;
    const ranges: number[] = [];
    mount(() => (
      <VirtualList
        items={rows}
        handle={(received) => {
          handle = received;
          mountedWhenReceived = document.querySelector('[role="list"]') != null;
        }}
        onRangeChange={(range) => ranges.push(range.endIndex)}
      >
        {(row) => row.label}
      </VirtualList>
    ));
    await nextTick();
    expect(handle?.scrollToIndex).toBeTypeOf('function');
    expect(mountedWhenReceived).toBe(true);
    expect(ranges.at(-1)).toBe(4);
  });
});
