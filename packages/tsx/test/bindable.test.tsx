// _bindable 的三种用法：受控（_bind）、只传值、不传
import { afterEach, it, expect } from 'vitest';
import { computed, createApp, nextTick, ref, type VNodeChild } from 'vue';
import { _component } from '../src';
import { Switch } from './fixtures/Switch';

const apps: ReturnType<typeof createApp>[] = [];
afterEach(() => {
  while (apps.length) apps.pop()!.unmount();
});
function mount(render: () => VNodeChild) {
  const el = document.createElement('div');
  const app = createApp(_component(() => render));
  apps.push(app);
  app.mount(el);
  return el;
}

const Counter = _component(({ value = _bindable(0) }: { value?: number }) => {
  return () => (
    <button type="button" onClick={() => value++}>
      {value}
    </button>
  );
});

it('受控：父级修正写入的值时，组件回到父级的值', async () => {
  // 拦截或修正写入：绑定到可写的 computed
  const count = ref(4);
  const clamped = computed({
    get: () => count.value,
    set: (next: number) => (count.value = Math.min(next, 5)),
  });
  const el = mount(() => <Counter value={_bind(clamped.value)} />);
  const button = el.querySelector('button')!;
  button.click();
  await nextTick();
  expect([count.value, button.textContent]).toEqual([5, '5']);
  button.click(); // 6 被修正回 5，父级值没变
  await nextTick();
  await nextTick();
  expect([count.value, button.textContent]).toEqual([5, '5']);
});

it('受控：写入后同步读取先拿到新值', () => {
  const seen: boolean[] = [];
  const on = ref(false);
  const el = mount(() => (
    <Switch checked={_bind(on.value)} onChange={(value) => seen.push(value)}>
      x
    </Switch>
  ));
  el.querySelector('button')!.click();
  expect(seen).toEqual([true]);
});

it('函数绑定 _bind(get, set)：值取 get，写回交给 set（可以顺带做别的事）', async () => {
  let count = _state(1);
  let writes = _state(0);
  const el = mount(() => (
    <Counter
      value={_bind(
        () => count * 10,
        (next) => {
          count = next / 10;
          writes++;
        },
      )}
    />
  ));
  const button = el.querySelector('button')!;
  expect(button.textContent).toBe('10');
  button.click();
  await nextTick();
  expect([count, writes, button.textContent]).toEqual([1.1, 1, '11']);
});

it('函数绑定的 set 可以是函数名', async () => {
  let on = _state(false);
  const seen: boolean[] = [];
  const toggle = (next: boolean) => {
    seen.push(next);
    on = next;
  };
  const el = mount(() => <Switch checked={_bind(() => on, toggle)}>x</Switch>);
  el.querySelector('button')!.click();
  await nextTick();
  expect([seen, on]).toEqual([[true], true]);
});

it('受控：父级值为 undefined 时使用默认值', () => {
  const value = ref<number | undefined>(undefined);
  const el = mount(() => <Counter value={_bind(value.value)} />);
  expect(el.textContent).toBe('0');
});

it('只传值：子组件可本地修改，父级值变化时以父级为准', async () => {
  const on = ref(true);
  const el = mount(() => <Switch checked={on.value}>x</Switch>);
  const button = el.querySelector('button')!;
  button.click();
  await nextTick();
  expect(button.getAttribute('aria-pressed')).toBe('false'); // 本地修改生效
  expect(on.value).toBe(true); //                               父级不受影响
  on.value = false;
  await nextTick();
  on.value = true;
  await nextTick();
  expect(button.getAttribute('aria-pressed')).toBe('true'); //  父级更新后重新以父级为准
});
