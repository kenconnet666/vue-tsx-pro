// 从右到左排版（lang.direction = 'rtl'）：方向键反过来，有方向的图标镜像
import { _component } from '@vue-tsx-pro/tsx';
import {
  Breadcrumbs,
  Pagination,
  Provider,
  Slider,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@vue-tsx-pro/ui';
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, type App } from 'vue';

let app: App;
let root: HTMLElement;
let volume = 50;

const Page = _component(() => {
  let value = _state(50);
  return () => (
    <Provider lang={{ direction: 'rtl' }}>
      <Slider
        value={_bind(value)}
        aria-label="音量"
        onValueCommit={(next) => (volume = next)}
        propsRoot={{ class: 'slider' }}
      />
      <Tabs class="tabs">
        <TabList aria-label="标签">
          <Tab value="a">一</Tab>
          <Tab value="b">二</Tab>
        </TabList>
        <TabPanel value="a">一</TabPanel>
        <TabPanel value="b">二</TabPanel>
      </Tabs>
      <Pagination class="pagination" pageCount={5} />
      <Breadcrumbs class="crumbs" items={[{ label: '首页', href: '/' }, { label: '当前' }]} />
    </Provider>
  );
});

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(Page);
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
});

/** 元素的水平缩放：镜像时为 -1 */
const scaleX = (element: Element) => new DOMMatrix(getComputedStyle(element).transform).a;

describe('从右到左排版', () => {
  it('Slider：左键增大（起点在右边）', async () => {
    root.querySelector<HTMLElement>('[role="slider"]')!.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(volume).toBe(51);
  });

  it('Tabs：左键移到下一个标签', async () => {
    const tabs = root.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs[0]!.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('Pagination 的上一页、下一页与面包屑的分隔符镜像显示', () => {
    const next = [...root.querySelectorAll('.pagination button')].find(
      (button) => button.getAttribute('aria-label') === '下一页',
    )!;
    expect(scaleX(next.querySelector('svg')!)).toBe(-1);
    expect(scaleX(root.querySelector('.crumbs [aria-hidden="true"] svg')!)).toBe(-1);
  });
});
