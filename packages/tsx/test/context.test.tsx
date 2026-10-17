// createContext：复合组件之间共享状态
import { afterEach, expect, it } from 'vitest';
import { createApp, nextTick, type VNodeChild } from 'vue';
import { _component, createContext } from '../src';

interface TabsState {
  active: string;
}
const TabsContext = createContext<TabsState>('Tabs');

const Tabs = _component(
  ({ active = _bindable('a'), children }: { active?: string; children?: VNodeChild }) => {
    // 共享响应式 prop：提供 getter，子组件读取时总是最新值
    TabsContext.provide({
      get active() {
        return active;
      },
    });
    return () => <div>{children}</div>;
  },
);

const Tab = _component(({ name }: { name: string }) => {
  const tabs = TabsContext.inject();
  return () => <i data-active={String(tabs.active === name)}>{name}</i>;
});

const OptionalTab = _component(() => {
  const tabs = TabsContext.inject(null);
  return () => <i>{tabs ? 'inside' : 'outside'}</i>;
});

const apps: ReturnType<typeof createApp>[] = [];
afterEach(() => {
  while (apps.length) apps.pop()!.unmount();
});
function mount(render: () => VNodeChild) {
  const el = document.createElement('div');
  const app = createApp(_component(() => render));
  app.config.warnHandler = () => {};
  apps.push(app);
  app.mount(el);
  return el;
}

it('父组件提供、子组件读取，状态随父组件更新', async () => {
  let active = _state('a');
  const el = mount(() => (
    <Tabs active={active}>
      <Tab name="a" />
      <Tab name="b" />
    </Tabs>
  ));
  const flags = () => [...el.querySelectorAll('i')].map((i) => i.dataset.active);
  expect(flags()).toEqual(['true', 'false']);
  active = 'b';
  await nextTick();
  expect(flags()).toEqual(['false', 'true']);
});

it('不在父组件内：inject() 报错说明，inject(fallback) 返回给定值', () => {
  expect(() => mount(() => <Tab name="a" />)).toThrow('Tabs 的子组件需要放在 <Tabs> 之内使用');
  expect(mount(() => <OptionalTab />).textContent).toBe('outside');
});
