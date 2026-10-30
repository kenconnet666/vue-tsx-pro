// 跟滚动、滑动有关的展示组件：List（不满一屏时连续加载、加载完、失败重试）、Swiper（滑动切换、首尾相连、自动切换）、IndexBar（点字母跳转、按滚动算当前组）
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { measureAs, swipe, WithHost } from '../../utils/.test/touch';
import type { Host } from '../../utils/host';
import { IndexAnchor, IndexBar } from '../IndexBar';
import { List } from '../List';
import { Swiper, SwiperItem } from '../Swiper';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = async () => {
  for (let round = 0; round < 6; round++) {
    await wait();
    await nextTick();
  }
};

describe('List', () => {
  it('底部在可视区里时连续加载，直到 finished；Promise 失败时显示重试，点了再加载', async () => {
    const rows = ref<number[]>([]);
    const finished = ref(false);
    let fail = false;
    const onLoad = vi.fn(async () => {
      if (fail) {
        fail = false;
        throw new Error('网络错误');
      }
      rows.value = [...rows.value, rows.value.length];
      if (rows.value.length >= 3) finished.value = true;
    });
    // 底部总在可视区里（top 100，窗口高 667）：不满一屏的情形
    const root = mount(() => (
      <WithHost host={{ measure: measureAs({ top: 100 }), onScroll: () => () => {} }}>
        <List finished={finished.value} onLoad={onLoad}>
          {rows.value.map((row) => (
            <p>第 {row} 行</p>
          ))}
        </List>
      </WithHost>
    ));
    await settle();
    expect(onLoad).toHaveBeenCalledTimes(3);
    expect(root.textContent).toContain('没有更多了');

    finished.value = false;
    fail = true;
    await settle();
    expect(root.textContent).toContain('加载失败，点击重试');
    root.querySelector<HTMLElement>('[role="button"]')!.click();
    await settle();
    expect(rows.value).toHaveLength(4);
  });
});

describe('Swiper', () => {
  it('左滑过两成换下一张，最后一张往后回到第一张；圆点跟着变', async () => {
    const index = ref(0);
    const root = mount(() => (
      <WithHost host={{ measure: measureAs({ width: 300 }) }}>
        <Swiper _value={index.value}>
          <SwiperItem>一</SwiperItem>
          <SwiperItem>二</SwiperItem>
        </Swiper>
      </WithHost>
    ));
    await nextTick();
    const box = root.firstElementChild!;
    swipe(box, [250, 50], [150, 52]);
    await settle();
    expect(index.value).toBe(1);
    swipe(box, [250, 50], [150, 52]);
    await settle();
    expect(index.value).toBe(0);
    swipe(box, [250, 50], [230, 52]);
    await settle();
    expect(index.value).toBe(0);
  });

  it('自动切换', async () => {
    vi.useFakeTimers();
    const index = ref(0);
    mount(() => (
      <Swiper _value={index.value} autoplay={1000}>
        <SwiperItem>一</SwiperItem>
        <SwiperItem>二</SwiperItem>
        <SwiperItem>三</SwiperItem>
      </Swiper>
    ));
    await nextTick();
    vi.advanceTimersByTime(2100);
    expect(index.value).toBe(2);
    vi.useRealTimers();
  });
});

describe('IndexBar', () => {
  it('点字母滚到那一组；滚动时当前组跟着变', async () => {
    let scrollListener: (top: number) => void = () => {};
    const scrollTo = vi.fn();
    const tops: Record<string, number> = { A: 0, B: 400, C: 900 };
    const host: Partial<Host> = {
      scrollTop: () => 0,
      onScroll: (listener) => ((scrollListener = listener), () => {}),
      scrollTo,
      measure: async (element) => ({
        top: tops[(element as HTMLElement).textContent!] ?? 0,
        left: 0,
        width: 10,
        height: 20,
      }),
    };
    const root = mount(() => (
      <WithHost host={host}>
        <IndexBar>
          <IndexAnchor index="A" />
          <IndexAnchor index="B" />
          <IndexAnchor index="C" />
        </IndexBar>
      </WithHost>
    ));
    await settle();
    root.querySelector<HTMLElement>('[aria-label="C"]')!.click();
    expect(scrollTo).toHaveBeenCalledWith(900);
    scrollListener(450);
    await nextTick();
    expect(root.querySelector('[aria-label="B"]')!.hasAttribute('data-active')).toBe(true);
  });
});
