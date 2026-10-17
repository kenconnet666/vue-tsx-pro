import { afterEach, it, expect } from 'vitest';
import { createApp, nextTick, ref } from 'vue';
import { _component } from '../src';
import { Switch } from './fixtures/Switch';

const apps: ReturnType<typeof createApp>[] = [];
afterEach(() => {
  while (apps.length) apps.pop()!.unmount();
});

it('_bindable 单向传值：子组件可本地切换，父级值变化时以父级为准', async () => {
  const on = ref(true);
  const el = document.createElement('div');
  const app = createApp(_component(() => () => <Switch checked={on.value}>x</Switch>));
  apps.push(app);
  app.mount(el);
  const btn = el.querySelector('button')!;
  btn.click();
  await nextTick();
  expect(btn.getAttribute('aria-pressed')).toBe('false'); // 本地切换生效
  expect(on.value).toBe(true); //                            父级不受影响
  on.value = false;
  await nextTick();
  on.value = true;
  await nextTick();
  expect(btn.getAttribute('aria-pressed')).toBe('true'); //  父级更新后重新以父级为准
});
