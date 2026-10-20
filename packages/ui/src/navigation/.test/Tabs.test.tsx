// Tabs、Toolbar、Steps 的结构、键盘与无障碍属性；真实焦点移动见 apps/host-demo 的浏览器测试
import { Star } from '@lucide/icons';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Steps } from '../Steps';
import { Tab, TabList, TabPanel, Tabs } from '../Tabs';
import { Toolbar } from '../Toolbar';

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
});

describe('Toolbar', () => {
  it('role="toolbar"，整组只有一个 Tab 进入点，方向键在按钮之间移动', async () => {
    const root = mount(() => (
      <Toolbar aria-label="格式">
        <button>粗</button>
        <button>斜</button>
        <input aria-label="字号" />
      </Toolbar>
    ));
    await nextTick();
    const toolbar = root.querySelector('[role="toolbar"]')!;
    expect(toolbar.getAttribute('aria-orientation')).toBe('horizontal');
    const [bold, italic] = toolbar.querySelectorAll('button');
    expect([bold!.tabIndex, italic!.tabIndex]).toEqual([0, -1]);
    // 输入框不参与方向键移动
    expect(toolbar.querySelector('input')!.hasAttribute('tabindex')).toBe(false);
    bold!.focus();
    key(bold!, 'ArrowRight');
    expect(document.activeElement).toBe(italic);
  });
});

describe('Steps', () => {
  const items = [{ title: '填写' }, { title: '确认', description: '核对信息' }, { title: '完成' }];

  it('ol 列表；当前步骤带 aria-current="step"；状态写在 data-state', () => {
    const root = mount(() => <Steps items={items} current={1} aria-label="下单" />);
    const steps = [...root.querySelectorAll('li')];
    expect(steps.map((step) => step.dataset.state)).toEqual(['complete', 'current', 'upcoming']);
    expect(steps[1]!.getAttribute('aria-current')).toBe('step');
    expect(steps[1]!.textContent).toContain('核对信息');
    // 已完成的显示对勾图标，其余显示序号
    expect(steps[0]!.querySelector('svg')).not.toBeNull();
    expect(steps[2]!.textContent).toContain('3');
  });

  it('给了 onStepChange 才能点回已完成的步骤', () => {
    const onStepChange = vi.fn();
    const root = mount(() => <Steps items={items} current={2} onStepChange={onStepChange} />);
    const buttons = root.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    buttons[0]!.click();
    expect(onStepChange).toHaveBeenCalledWith(0);
    expect(mount(() => <Steps items={items} current={2} />).querySelector('button')).toBeNull();
  });

  it('步骤的 icon 代替序号；已完成的仍显示对勾', () => {
    const withIcons = items.map((item) => ({ ...item, icon: Star }));
    const steps = [...mount(() => <Steps items={withIcons} current={1} />).querySelectorAll('li')];
    expect(steps.map((step) => step.querySelector('svg') != null)).toEqual([true, true, true]);
    expect(steps[2]!.textContent).not.toContain('3');
  });
});
