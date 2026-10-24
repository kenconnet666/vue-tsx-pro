// Descriptions：dl > div > dt + dd；跨列不超过栏数；columns="auto" 按宽度定栏数；copyable 的复制按钮
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

// 整个应用共用一个 ResizeObserver（第一次用时创建）：换成假的，测试里自己报尺寸
let notify: ((width: number) => void) | undefined;
beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      notify = (width) =>
        callback(
          [...observed].map(
            (target) => ({ target, contentRect: { width } }) as unknown as ResizeObserverEntry,
          ),
          this as unknown as ResizeObserver,
        );
    }
    observe(target: Element) {
      observed.add(target);
    }
    unobserve(target: Element) {
      observed.delete(target);
    }
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
const observed = new Set<Element>();
import { mount } from '../../utils/.test/mount';
import { Descriptions } from '../Descriptions';

describe('Descriptions', () => {
  it('每项是 dl 里的 div > dt + dd；标题与部件属性', () => {
    const root = mount(() => (
      <Descriptions
        title="订单信息"
        columns={2}
        items={[
          { label: '订单号', value: 'A-1024' },
          { label: '地址', value: '上海', span: 5 },
        ]}
        propsItem={(_, index) => ({ class: `item-${index}` })}
      />
    ));
    const list = root.querySelector('dl')!;
    expect([...list.children].map((item) => item.tagName)).toEqual(['DIV', 'DIV']);
    expect(list.querySelector('.item-0 dt')!.textContent).toBe('订单号');
    expect(list.querySelector('.item-0 dd')!.textContent).toBe('A-1024');
    expect(root.textContent!.startsWith('订单信息')).toBe(true);
  });
});

describe('Descriptions 的自适应栏数与复制', () => {
  it('columns="auto"：按宽度与 minItemWidth 算栏数，最多 maxColumns；跨列按算出的栏数封顶', async () => {
    const root = mount(() => (
      <Descriptions
        columns="auto"
        minItemWidth={200}
        maxColumns={3}
        items={[
          { label: '编号', value: 'A-1' },
          { label: '团队', value: '复材' },
          { label: '地址', value: '上海', span: 5 },
        ]}
      />
    ));
    const list = root.querySelector('dl')!;
    // 动态样式写在 style 属性里（CSS 变量）
    const columnsOf = () => list.getAttribute('style') ?? '';
    // 挂载后才开始观察
    await nextTick();
    notify?.(450);
    await nextTick();
    const two = columnsOf();
    notify?.(1000);
    await nextTick();
    const three = columnsOf();
    expect(two).not.toBe(three);
    expect(two).toContain('repeat(2');
    expect(three).toContain('repeat(3');
  });

  it('copyable：值后面有复制按钮，名称带标签，复制 copyText 或值的文字', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const root = mount(() => (
      <Descriptions
        items={[
          { label: '订单号', value: 'A-1024', copyable: true },
          { label: '收货地址', value: <b>上海浦东</b>, copyable: true, copyText: '上海市浦东新区' },
        ]}
      />
    ));
    const buttons = [...root.querySelectorAll('dd button')];
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      '复制订单号',
      '复制收货地址',
    ]);
    (buttons[1] as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve));
    expect(writeText).toHaveBeenCalledWith('上海市浦东新区');
  });
});
