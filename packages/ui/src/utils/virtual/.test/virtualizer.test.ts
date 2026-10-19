// 虚拟滚动核心：位置表、可见范围、测量与滚动调整；真实浏览器里的滚动见 apps/host-demo/test/base.browser.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computeMeasurements,
  defaultRangeExtractor,
  findVisibleRange,
  Virtualizer,
  type VirtualizerOptions,
} from '../virtualizer';

const fixed = (count: number, size = 10) =>
  computeMeasurements(
    count,
    () => size,
    (index) => index,
  );

describe('位置表与可见范围', () => {
  it('按大小依次排开，测量值按 key 取', () => {
    const sizes = new Map<PropertyKey, number>([['b', 30]]);
    const items = computeMeasurements(
      3,
      (_, key) => sizes.get(key) ?? 10,
      (index) => 'abc'[index]!,
    );
    expect(items.map(({ start, end }) => [start, end])).toEqual([
      [0, 10],
      [10, 40],
      [40, 50],
    ]);
  });

  it.each([
    [0, 30, 0, 2],
    [15, 30, 1, 4],
    [95, 30, 9, 9],
    [-50, 30, 0, 0],
    [25, 0, 2, 2],
  ])('offset %i、视口 %i：第 %i 到 %i 项', (offset, viewport, start, end) => {
    expect(findVisibleRange(fixed(10), offset, viewport)).toEqual({
      startIndex: start,
      endIndex: end,
    });
  });

  it('没有项时为 null；overscan 不越界', () => {
    expect(findVisibleRange([], 0, 100)).toBeNull();
    expect(defaultRangeExtractor({ startIndex: 1, endIndex: 2, overscan: 3, count: 5 })).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });
});

/** 假的滚动容器：可控的视口与滚动位置，scrollTo / scrollBy 直接改 scrollTop */
function fakeScroller(viewport = 100) {
  const element = document.createElement('div');
  let scrollTop = 0;
  Object.defineProperties(element, {
    clientHeight: { get: () => viewport },
    scrollTop: {
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    },
  });
  element.scrollTo = ((options: ScrollToOptions) => {
    scrollTop = options.top ?? scrollTop;
    element.dispatchEvent(new Event('scroll'));
  }) as typeof element.scrollTo;
  element.scrollBy = ((options: ScrollToOptions) => {
    scrollTop += options.top ?? 0;
  }) as typeof element.scrollBy;
  document.body.append(element);
  return element;
}

/** 渲染一项：带 data-index 与指定高度 */
function itemElement(index: number, height: number) {
  const element = document.createElement('div');
  element.dataset.index = String(index);
  element.getBoundingClientRect = () => ({ height, width: 100 }) as DOMRect;
  document.body.append(element);
  return element;
}

describe('Virtualizer', () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    document.body.innerHTML = '';
  });

  const create = (options: Partial<VirtualizerOptions> = {}) => {
    const element = fakeScroller();
    const onChange = vi.fn();
    const virtualizer = new Virtualizer({
      count: 1000,
      estimateSize: () => 20,
      getScrollElement: () => element,
      overscan: 2,
      onChange,
      ...options,
    });
    cleanups.push(virtualizer.mount());
    return { element, virtualizer, onChange };
  };
  const indices = (virtualizer: Virtualizer) => virtualizer.getVirtualItems().map((i) => i.index);

  it('挂载后按视口算出渲染范围（含 overscan），总大小按估计值', () => {
    const { virtualizer } = create();
    expect(indices(virtualizer)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(virtualizer.getVisibleRange()).toEqual({ startIndex: 0, endIndex: 4 });
    expect(virtualizer.getTotalSize()).toBe(20000);
  });

  it('滚动时范围变了才通知', () => {
    const { element, virtualizer, onChange } = create();
    element.scrollTop = 10;
    element.dispatchEvent(new Event('scroll'));
    onChange.mockClear();
    // 10 → 15：可见的仍是第 0–5 项
    element.scrollTop = 15;
    element.dispatchEvent(new Event('scroll'));
    expect(onChange).not.toHaveBeenCalled();
    element.scrollTop = 400;
    element.dispatchEvent(new Event('scroll'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(virtualizer.getVisibleRange()).toEqual({ startIndex: 20, endIndex: 24 });
  });

  it('测量到真实大小后重排位置；可视区上方的项变大时同步调整滚动位置', () => {
    const { element, virtualizer } = create();
    virtualizer.measureElement(itemElement(0, 50));
    expect(virtualizer.getMeasurements()[1]!.start).toBe(50);
    expect(virtualizer.getTotalSize()).toBe(20030);

    virtualizer.scrollToOffset(1000);
    virtualizer.measureElement(itemElement(1, 70));
    // 第 1 项在可视区上方，变大 50：滚动位置跟着加 50，看到的内容不动
    expect(element.scrollTop).toBe(1050);
  });

  it('大小为 0（还没排版）的测量值不采用', () => {
    const { virtualizer } = create();
    virtualizer.measureElement(itemElement(0, 0));
    expect(virtualizer.getMeasurements()[0]!.size).toBe(20);
  });

  it('测量结果按 key 缓存：数据重排后仍对得上', () => {
    let order = ['a', 'b', 'c'];
    const options = (): Partial<VirtualizerOptions> => ({
      count: order.length,
      getItemKey: (index) => order[index]!,
    });
    const { virtualizer, element } = create(options());
    virtualizer.measureElement(itemElement(0, 60));
    order = ['c', 'b', 'a'];
    virtualizer.setOptions({
      count: 3,
      estimateSize: () => 20,
      getScrollElement: () => element,
      ...options(),
    });
    expect(virtualizer.getMeasurements().map((item) => item.size)).toEqual([20, 20, 60]);
  });

  it.each([
    ['start', 2000],
    ['end', 1920],
    ['center', 1960],
  ] as const)('scrollToIndex align=%s', (align, expected) => {
    const { element, virtualizer } = create();
    virtualizer.scrollToIndex(100, { align });
    expect(element.scrollTop).toBe(expected);
  });

  it('scrollToIndex auto：已经可见就不动；在下方时对齐末尾；超出范围时夹在两端', () => {
    const { element, virtualizer } = create();
    virtualizer.scrollToIndex(2);
    expect(element.scrollTop).toBe(0);
    virtualizer.scrollToIndex(10);
    expect(element.scrollTop).toBe(120);
    virtualizer.scrollToIndex(5000, { align: 'start' });
    expect(element.scrollTop).toBe(20000 - 100);
  });

  it('scrollMargin：列表不在滚动内容开头时，滚动位置减去它再算范围', () => {
    const { element, virtualizer } = create({ scrollMargin: () => 300 });
    expect(virtualizer.getVisibleRange()).toEqual({ startIndex: 0, endIndex: 0 });
    virtualizer.scrollToOffset(0);
    expect(element.scrollTop).toBe(300);
    expect(virtualizer.getVisibleRange()).toEqual({ startIndex: 0, endIndex: 4 });
  });

  it('rangeExtractor 可以加上固定渲染的项（吸顶行的扩展点）', () => {
    const { element, virtualizer } = create({
      rangeExtractor: (range) => [0, ...defaultRangeExtractor(range).filter((i) => i !== 0)],
    });
    element.scrollTop = 1000;
    element.dispatchEvent(new Event('scroll'));
    expect(indices(virtualizer)[0]).toBe(0);
    expect(indices(virtualizer)[1]).toBe(48);
  });
});
