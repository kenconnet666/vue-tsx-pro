// 展示类：Empty 的预设与操作、NoticeBar 放不下时滚动与关闭、Grid 的列宽与徽标、Collapse 的展开与手风琴、Steps 的状态；小程序端的折叠
import { Wallet } from '@lucide/icons';
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { measureAs, WithHost } from '../../utils/.test/touch';
import { Collapse, CollapseItem } from '../Collapse';
import { Empty } from '../Empty';
import { Grid, GridItem } from '../Grid';
import { NoticeBar } from '../NoticeBar';
import { Steps } from '../Steps';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Empty / NoticeBar', () => {
  it('Empty：默认说明来自语言包，下面放操作', () => {
    const root = mount(() => (
      <Empty preset="network">
        <button>重试</button>
      </Empty>
    ));
    expect(root.textContent).toBe('暂无数据重试');
  });

  it('NoticeBar：文字比可视区宽时滚动（时长按速度算）；关闭后不再显示', async () => {
    const onClose = vi.fn();
    let call = 0;
    // 第一次量可视区（200），第二次量文字（500）
    const measure = vi.fn(async () => ({
      top: 0,
      left: 0,
      height: 20,
      width: call++ % 2 ? 500 : 200,
    }));
    const root = mount(() => (
      <WithHost host={{ measure }}>
        <NoticeBar mode="closeable" speed={100} onClose={onClose}>
          很长很长的公告
        </NoticeBar>
      </WithHost>
    ));
    await wait();
    await nextTick();
    const text = root.querySelector<HTMLElement>('[role="alert"] span')!;
    expect(text.style.animationDuration).toBe('7s');
    expect(text.style.paddingInlineStart).toBe('200px');
    root.querySelector<HTMLButtonElement>('button[aria-label="关闭"]')!.click();
    await nextTick();
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('Grid', () => {
  it('每格的宽度按列数；有 onClick 时可点；徽标', () => {
    const onClick = vi.fn();
    const root = mount(() => (
      <WithHost host={{ measure: measureAs({}) }}>
        <Grid columns={3}>
          <GridItem icon={Wallet} text="待付款" badge={2} onClick={onClick} />
          <GridItem text="待发货" />
        </Grid>
      </WithHost>
    ));
    const items = root.querySelectorAll<HTMLElement>('[role="listitem"]');
    expect(items[0]!.style.flexBasis).toMatch(/^33\.33/);
    expect(items[0]!.dataset.clickable).toBe('true');
    expect(items[1]!.dataset.clickable).toBeUndefined();
    items[0]!.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(items[0]!.textContent).toContain('2');
  });
});

describe('Collapse', () => {
  it('点标题展开、再点收起；手风琴只开一个', async () => {
    const open = ref<string[] | string | null>([]);
    const root = mount(() => (
      <Collapse _value={open.value}>
        <CollapseItem name="a" title="甲">
          内容甲
        </CollapseItem>
        <CollapseItem name="b" title="乙">
          内容乙
        </CollapseItem>
      </Collapse>
    ));
    const [a, b] = root.querySelectorAll<HTMLButtonElement>('button');
    a!.click();
    b!.click();
    await nextTick();
    expect(open.value).toEqual(['a', 'b']);
    expect(a!.getAttribute('aria-expanded')).toBe('true');
    a!.click();
    expect(open.value).toEqual(['b']);

    const single = ref<string[] | string | null>(null);
    const accordion = mount(() => (
      <Collapse _value={single.value} accordion>
        <CollapseItem name="a" title="甲">
          内容甲
        </CollapseItem>
        <CollapseItem name="b" title="乙">
          内容乙
        </CollapseItem>
      </Collapse>
    ));
    const [x, y] = accordion.querySelectorAll<HTMLButtonElement>('button');
    x!.click();
    y!.click();
    expect(single.value).toBe('b');
  });

  it('小程序：展开的状态写在 data-open 上，网格行展开成 1fr', async () => {
    const Demo = defineComponent(() => () => (
      <Collapse _value={['a']}>
        <CollapseItem name="a" title="甲">
          内容甲
        </CollapseItem>
      </Collapse>
    ));
    const page = mountPage(Demo);
    await page.settle();
    expect(page.find((node) => node.st?.includes('grid-template-rows:1fr') ?? false)).toBeDefined();
  });
});

describe('Steps', () => {
  it('active 之前已完成、当前进行中、之后未开始；显式的 status 优先', () => {
    const root = mount(() => (
      <Steps
        active={1}
        items={[
          { title: '下单' },
          { title: '付款' },
          { title: '发货', status: 'error' },
          { title: '收货' },
        ]}
      />
    ));
    const statuses = [...root.querySelectorAll<HTMLElement>('[role="listitem"]')].map(
      (item) => item.dataset.status,
    );
    expect(statuses).toEqual(['done', 'process', 'error', 'wait']);
    expect(root.querySelector('[aria-current="step"]')!.textContent).toBe('付款');
  });
});
