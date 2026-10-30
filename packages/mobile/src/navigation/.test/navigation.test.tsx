// 导航：NavBar 的左右点击与占位、TabBar 的选中、Tabs（默认第一个、懒渲染、切走保留、滑动切换、禁用跳过）、BackTop 按滚动出现；小程序端的 Tabs
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { swipe, WithHost } from '../../utils/.test/touch';
import { BackTop } from '../BackTop';
import { NavBar } from '../NavBar';
import { TabBar, TabBarItem } from '../TabBar';
import { Tab, Tabs } from '../Tabs';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe('NavBar / TabBar', () => {
  it('NavBar：左右的点击；fixed + placeholder 时多一个占位', () => {
    const onClickLeft = vi.fn();
    const onClickRight = vi.fn();
    const root = mount(() => (
      <NavBar
        title="订单"
        leftArrow
        left="返回"
        right="编辑"
        fixed
        placeholder
        onClickLeft={onClickLeft}
        onClickRight={onClickRight}
      />
    ));
    expect(root.children).toHaveLength(2);
    const [left, right] = root.querySelectorAll('button');
    left!.click();
    right!.click();
    expect(onClickLeft).toHaveBeenCalledOnce();
    expect(onClickRight).toHaveBeenCalledOnce();
    expect(root.querySelector('[role="heading"]')!.textContent).toBe('订单');
  });

  it('TabBar：点一项写回选中的名字', async () => {
    const tab = ref('home');
    const root = mount(() => (
      <TabBar _value={tab.value} fixed={false}>
        <TabBarItem name="home">首页</TabBarItem>
        <TabBarItem name="mine" badge>
          我的
        </TabBarItem>
      </TabBar>
    ));
    const items = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    items[1]!.click();
    await nextTick();
    expect(tab.value).toBe('mine');
    expect(items[1]!.getAttribute('aria-selected')).toBe('true');
  });
});

describe('Tabs', () => {
  it('默认选第一个；内容第一次选中才渲染，切走后藏起来；滑动切到下一个可用的标签', async () => {
    const value = ref<string | undefined>(undefined);
    const root = mount(() => (
      <Tabs _value={value.value} swipeable>
        <Tab name="all" title="全部">
          全部订单
        </Tab>
        <Tab name="unpaid" title="待付款" disabled>
          待付款订单
        </Tab>
        <Tab name="shipped" title="待收货">
          待收货订单
        </Tab>
      </Tabs>
    ));
    await nextTick();
    const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect(root.textContent).not.toContain('待收货订单');

    swipe(root.firstElementChild!, [300, 100], [100, 110]);
    await nextTick();
    expect(value.value).toBe('shipped');
    const panels = root.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(panels).toHaveLength(2);
    expect(panels[0]!.hidden).toBe(true);
    expect(panels[1]!.textContent).toBe('待收货订单');
  });

  it('小程序：点标题切换，内容跟着换', async () => {
    const Demo = defineComponent(() => () => (
      <Tabs>
        <Tab name="a" title="甲">
          内容甲
        </Tab>
        <Tab name="b" title="乙">
          内容乙
        </Tab>
      </Tabs>
    ));
    const page = mountPage(Demo);
    await page.settle();
    expect(page.text()).toContain('内容甲');
    await page.tap(page.find((node) => node.cn?.some((child) => child.v === '乙') ?? false)!);
    expect(page.text()).toContain('内容乙');
  });
});

describe('BackTop', () => {
  it('滚过 offset 才出现，点了滚回顶部', async () => {
    let listener: (top: number) => void = () => {};
    const scrollTo = vi.fn();
    mount(() => (
      <WithHost
        host={{ scrollTop: () => 0, onScroll: (fn) => ((listener = fn), () => {}), scrollTo }}
      >
        <BackTop offset={100} />
      </WithHost>
    ));
    expect(document.body.querySelector('button[aria-label="回到顶部"]')).toBeNull();
    listener(300);
    await nextTick();
    await wait();
    const button = document.body.querySelector<HTMLButtonElement>('button[aria-label="回到顶部"]')!;
    button.click();
    expect(scrollTo).toHaveBeenCalledWith(0, { smooth: true });
  });
});
