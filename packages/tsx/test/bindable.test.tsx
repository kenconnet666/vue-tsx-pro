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

const Counter = _component(({ _value: value = _bindable(0) }: { _value?: number }) => {
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
  const el = mount(() => <Counter _value={clamped.value} />);
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
    <Switch _checked={on.value} onChange={(value) => seen.push(value)}>
      x
    </Switch>
  ));
  el.querySelector('button')!.click();
  expect(seen).toEqual([true]);
});

it('自己处理更新：另写 onUpdate:_value 时不再自动写回，值可以是表达式（可以顺带做别的事）', async () => {
  let count = _state(1);
  let writes = _state(0);
  const el = mount(() => (
    <Counter
      _value={count * 10}
      onUpdate:_value={(next) => {
        count = next / 10;
        writes++;
      }}
    />
  ));
  const button = el.querySelector('button')!;
  expect(button.textContent).toBe('10');
  button.click();
  await nextTick();
  expect([count, writes, button.textContent]).toEqual([1.1, 1, '11']);
});

it('onUpdate:_checked 可以是函数名：由它决定改不改', async () => {
  let on = _state(false);
  const seen: boolean[] = [];
  const toggle = (next: boolean) => {
    seen.push(next);
    on = next;
  };
  const el = mount(() => (
    <Switch _checked={on} onUpdate:_checked={toggle}>
      x
    </Switch>
  ));
  el.querySelector('button')!.click();
  await nextTick();
  expect([seen, on]).toEqual([[true], true]);
});

it('可写的值自动双向绑定：let 声明的 _state 与对象属性', async () => {
  let on = _state(false);
  const form = _state({ count: 2 });
  const el = mount(() => (
    <div>
      <Switch _checked={on}>x</Switch>
      <Counter _value={form.count} />
    </div>
  ));
  const [toggle, counter] = el.querySelectorAll('button');
  toggle!.click();
  counter!.click();
  await nextTick();
  expect([on, form.count]).toEqual([true, 3]);
});

it('受控：父级值为 undefined 时使用默认值', () => {
  const value = ref<number | undefined>(undefined);
  const el = mount(() => <Counter _value={value.value} />);
  expect(el.textContent).toBe('0');
});

it('只传值（值是表达式，不是可写的位置）：子组件可本地修改，父级值变化时以父级为准', async () => {
  const on = ref(true);
  const initial = () => on.value;
  const el = mount(() => <Switch _checked={initial()}>x</Switch>);
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
