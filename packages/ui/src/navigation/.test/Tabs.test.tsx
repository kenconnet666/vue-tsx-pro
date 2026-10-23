// Tabs：WAI-ARIA 关系（tablist / tab / tabpanel）、选中与切换、手动激活、竖排、键盘移动；
// 可关闭（Delete、关闭按钮，关掉当前标签时选旁边的）、新建、Alt + ←→ 排序
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Tab, TabList, TabPanel, Tabs } from '../Tabs';

const key = (element: Element, name: string) =>
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }),
  );

function renderTabs(options: { activation?: 'automatic' | 'manual'; lazy?: boolean } = {}) {
  let value = _state<string | undefined>(undefined);
  const root = mount(() => (
    <Tabs value={_bind(value)} activation={options.activation} lazy={options.lazy}>
      <TabList aria-label="订单">
        <Tab value="all">全部</Tab>
        <Tab value="paid" disabled>
          已付款
        </Tab>
        <Tab value="done">已完成</Tab>
      </TabList>
      <TabPanel value="all">全部订单</TabPanel>
      <TabPanel value="paid">已付款的订单</TabPanel>
      <TabPanel value="done">已完成的订单</TabPanel>
    </Tabs>
  ));
  const tabs = () => [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = () => [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  return { root, tabs, panels, value: () => value };
}

describe('Tabs', () => {
  it('没有选中值时选第一个；标签与面板互相关联；只显示当前面板', async () => {
    const { root, tabs, panels } = renderTabs();
    await nextTick();
    expect(root.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('订单');
    const [first] = tabs();
    expect(first!.getAttribute('aria-selected')).toBe('true');
    expect(first!.getAttribute('aria-controls')).toBe(panels()[0]!.id);
    expect(panels()[0]!.getAttribute('aria-labelledby')).toBe(first!.id);
    expect(panels().map((panel) => panel.hidden)).toEqual([false, true, true]);
    // 只有当前标签是 Tab 进入点
    expect(tabs().map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('只当导航用（没有 TabPanel）时标签不写 aria-controls：不能指向不存在的元素', async () => {
    const root = mount(() => (
      <Tabs>
        <TabList aria-label="分区">
          <Tab value="overview">概览</Tab>
          <Tab value="members">成员</Tab>
        </TabList>
      </Tabs>
    ));
    await nextTick();
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    expect(tabs.map((tab) => tab.hasAttribute('aria-controls'))).toEqual([false, false]);
  });

  it('点击切换并写回；不可用的标签点不了', async () => {
    const { tabs, panels, value } = renderTabs();
    await nextTick();
    tabs()[2]!.click();
    await nextTick();
    expect(value()).toBe('done');
    expect(panels().map((panel) => panel.hidden)).toEqual([true, true, false]);
    expect(tabs()[1]!.disabled).toBe(true);
    expect(tabs()[2]!.dataset.state).toBe('active');
  });

  it('automatic：焦点移到哪个就切换哪个（方向键跳过不可用项）；manual：只移动焦点', async () => {
    const auto = renderTabs();
    await nextTick();
    auto.tabs()[0]!.focus();
    key(auto.tabs()[0]!, 'ArrowRight');
    await nextTick();
    expect(document.activeElement).toBe(auto.tabs()[2]);
    expect(auto.value()).toBe('done');

    const manual = renderTabs({ activation: 'manual' });
    await nextTick();
    manual.tabs()[0]!.focus();
    key(manual.tabs()[0]!, 'End');
    await nextTick();
    expect(document.activeElement).toBe(manual.tabs()[2]);
    expect(manual.value()).toBeUndefined();
  });

  it('使用方的 onClick 先执行，preventDefault 可以拦下切换', async () => {
    let value = _state('a');
    const root = mount(() => (
      <Tabs value={_bind(value)}>
        <TabList aria-label="x">
          <Tab value="a">A</Tab>
          <Tab value="b" onClick={(event) => event.preventDefault()}>
            B
          </Tab>
        </TabList>
      </Tabs>
    ));
    root.querySelectorAll('button')[1]!.click();
    expect(value).toBe('a');
  });

  it('lazy：面板第一次显示时才渲染内容，之后保留', async () => {
    const { tabs, panels } = renderTabs({ lazy: true });
    await nextTick();
    expect(panels().map((panel) => panel.textContent)).toEqual(['全部订单', '', '']);
    tabs()[2]!.click();
    await nextTick();
    tabs()[0]!.click();
    await nextTick();
    expect(panels().map((panel) => panel.textContent)).toEqual(['全部订单', '', '已完成的订单']);
  });

  it('可关闭：Delete 或关闭按钮关闭；关掉当前标签时选它后面的一个，焦点跟过去', async () => {
    let tabs = _state(['a', 'b', 'c']);
    let current = _state('b');
    const root = mount(() => (
      <Tabs value={_bind(current)}>
        <TabList aria-label="页面">
          {tabs.map((tab) => (
            <Tab key={tab} value={tab} onClose={() => (tabs = tabs.filter((item) => item !== tab))}>
              {tab.toUpperCase()}
            </Tab>
          ))}
        </TabList>
      </Tabs>
    ));
    const tab = (name: string) =>
      [...root.querySelectorAll<HTMLElement>('[role="tab"]')].find(
        (item) => item.textContent === name,
      )!;
    // 关闭按钮不在 Tab 顺序里，名称带上标签的文字
    const close = tab('B').parentElement!.querySelector<HTMLButtonElement>('button[aria-label]')!;
    expect(close.getAttribute('aria-label')).toBe('关闭 B');
    expect(close.tabIndex).toBe(-1);
    tab('B').focus();
    tab('B').dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    await nextTick();
    await nextTick();
    expect(tabs).toEqual(['a', 'c']);
    expect(current).toBe('c');
    expect(document.activeElement).toBe(tab('C'));
    // 关掉最后一个：选前面的
    tab('C').parentElement!.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    await nextTick();
    await nextTick();
    expect(current).toBe('a');
  });

  it('新建按钮在标签栏里、tablist 外面；Alt + → 把标签往后挪一位并报告新顺序', async () => {
    let order = _state(['a', 'b', 'c']);
    let added = _state(0);
    const root = mount(() => (
      <Tabs>
        <TabList aria-label="页面" onAdd={() => added++} onReorder={(next) => (order = next)}>
          {order.map((tab) => (
            <Tab key={tab} value={tab}>
              {tab}
            </Tab>
          ))}
        </TabList>
      </Tabs>
    ));
    const list = root.querySelector<HTMLElement>('[role="tablist"]')!;
    const add = root.querySelector<HTMLButtonElement>('button[aria-label="新建标签页"]')!;
    expect(list.contains(add)).toBe(false);
    add.click();
    expect(added).toBe(1);
    const first = list.querySelector<HTMLElement>('[role="tab"]')!;
    first.focus();
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }),
    );
    await nextTick();
    expect(order).toEqual(['b', 'a', 'c']);
  });
});
