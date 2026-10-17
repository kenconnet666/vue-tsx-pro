// 冒烟测试：符文经 Vite 预设编译后，在 Vue 中的运行时语义
import { describe, it, expect } from 'vitest';
import { createApp, nextTick, ref } from 'vue';
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

  it('_derived 解构：每个变量各自是派生值，支持嵌套、默认值与 ...rest', async () => {
    let renders = 0;
    const Profile = _component(() => {
      let user = _state({ name: 'Ada', tags: ['math'], age: 36 });
      const {
        name,
        tags: [first = '-'],
        ...rest
      } = _derived(user);
      return () => {
        renders++;
        return (
          <button type="button" onClick={() => (user = { name: 'Grace', tags: [], age: 45 })}>
            {name}/{first}/{rest.age}
          </button>
        );
      };
    });
    const el = mount(Profile);
    expect(el.textContent).toBe('Ada/math/36');
    el.querySelector('button')!.click();
    await nextTick();
    expect(el.textContent).toBe('Grace/-/45');
    expect(renders).toBe(2);
  });

  it('_bindable + _bind 双向同步，子组件写入后同步读到新值', async () => {
    const on = ref(false);
    const seen: boolean[] = [];
    const el = mount(
      _component(() => () => (
        <Switch checked={_bind(on.value)} onChange={(value) => seen.push(value)}>
          x
        </Switch>
      )),
    );
    el.querySelector('button')!.click();
    await nextTick();
    expect(on.value).toBe(true);
    expect(seen).toEqual([true]);
  });
});
