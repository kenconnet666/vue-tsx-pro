// 冒烟测试：符文经 Vite 预设编译后，在 Vue 中的运行时语义
import { describe, it, expect } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import { _component } from '../src';
import { Counter, log } from './fixtures/Counter';
import { Switch } from './fixtures/Switch';

function mount(root: Parameters<typeof createApp>[0]) {
  const el = document.createElement('div');
  createApp(root).mount(el);
  return el;
}

describe('符文', () => {
  it('_state / _derived / _derived.by；副作用与生命周期直接用 Vue', async () => {
    log.length = 0;
    const el = mount(_component(() => () => <Counter step={2} />));
    const text = (selector: string) => el.querySelector(selector)!.textContent;
    expect([text('.count'), text('.double'), text('.parity')]).toEqual(['0', '0', 'even']);

    el.querySelector('button')!.click();
    await nextTick();
    expect([text('.count'), text('.double')]).toEqual(['2', '4']);
    expect(log).toEqual(['count=0', 'mounted', 'count=2']);
  });

  it('_bindable + v-model:checked 双向同步，子组件写入后同步读到新值', async () => {
    const on = ref(false);
    const seen: boolean[] = [];
    const el = mount(
      _component(() => () => (
        <Switch v-model:checked={on.value} onChange={(value) => seen.push(value)}>
          x
        </Switch>
      )),
    );
    el.querySelector('button')!.click();
    await nextTick();
    expect(on.value).toBe(true);
    expect(seen).toEqual([true]);
  });

  it('_bindable 组件可被普通 Vue 写法（h + onUpdate:checked）使用', async () => {
    const on = ref(true);
    const el = mount({
      render: () =>
        h(
          Switch,
          { checked: on.value, 'onUpdate:checked': (value: boolean) => (on.value = value) },
          () => 'x',
        ),
    });
    el.querySelector('button')!.click();
    await nextTick();
    expect(on.value).toBe(false);
  });
});
