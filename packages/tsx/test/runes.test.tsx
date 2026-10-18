// 冒烟测试：符文经 Vite 预设编译后，在 Vue 中的运行时语义
import { describe, it, expect } from 'vitest';
import { createApp, nextTick, ref } from 'vue';
import { _component, effect } from '../src';
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

  it('let 声明的 _derived 可以临时覆盖（乐观更新），依赖变化后重新跟随', async () => {
    const likes = ref(1);
    const Likes = _component(({ count = 0 }: { count?: number }) => {
      let shown = _derived(count);
      return () => (
        <button type="button" onClick={() => (shown += 1)}>
          {shown}
        </button>
      );
    });
    const el = mount(_component(() => () => <Likes count={likes.value} />));
    const button = el.querySelector('button')!;
    button.click();
    await nextTick();
    expect(button.textContent).toBe('2');

    likes.value = 5;
    await nextTick();
    expect(button.textContent).toBe('5');
  });

  it('_state.snapshot：去掉代理的深拷贝，之后互不影响', () => {
    let copy: { tags: string[]; at: Date } | undefined;
    let form: { tags: string[]; at: Date } | undefined;
    mount(
      _component(() => {
        let state = _state({ tags: ['a'], at: new Date(0) });
        copy = _state.snapshot(state);
        state.tags.push('b');
        form = state;
        return () => null;
      }),
    );
    expect(copy).toEqual({ tags: ['a'], at: new Date(0) });
    expect(form!.tags).toEqual(['a', 'b']);
    expect(structuredClone(copy)).toEqual(copy); // 不是代理，可以交给 structuredClone
  });
});

describe('_effect（同 Svelte 的 $effect）', () => {
  function mountApp(root: Parameters<typeof createApp>[0]) {
    const el = document.createElement('div');
    const app = createApp(root);
    app.mount(el);
    return { el, app };
  }

  it('挂载后执行，读到的变量变化时重跑；清理函数在重跑前与卸载时调用', async () => {
    const log: string[] = [];
    let bump = () => {};
    const { app } = mountApp(
      _component(() => {
        let count = _state(0);
        let box = _state.raw<HTMLElement | null>(null);
        bump = () => count++;
        _effect(() => {
          log.push(`run ${count} ${box?.textContent}`);
          return () => log.push(`cleanup ${count}`);
        });
        return () => <b ref={_toRef(box)}>{count}</b>;
      }),
    );
    await nextTick();
    expect(log).toEqual(['run 0 0']); // 挂载后执行：元素已经在 DOM 里

    bump();
    await nextTick();
    expect(log).toEqual(['run 0 0', 'cleanup 1', 'run 1 1']); // DOM 更新后执行

    app.unmount();
    expect(log.at(-1)).toBe('cleanup 1');
  });

  it('_effect.pre 在 DOM 更新前执行', async () => {
    const seen: string[] = [];
    let bump = () => {};
    mountApp(
      _component(() => {
        let count = _state(0);
        let box = _state.raw<HTMLElement | null>(null);
        bump = () => count++;
        _effect.pre(() => {
          seen.push(`${count}/${box?.textContent ?? '-'}`);
        });
        return () => <b ref={_toRef(box)}>{count}</b>;
      }),
    );
    bump();
    await nextTick();
    expect(seen).toEqual(['0/-', '1/0']); // 新值已经可读，DOM 还是旧的
  });

  it('嵌套的 _effect 随外层重跑一起销毁', async () => {
    const log: string[] = [];
    let bump = () => {};
    mountApp(
      _component(() => {
        let outer = _state(0);
        bump = () => outer++;
        _effect(() => {
          const round = outer;
          _effect(() => () => log.push(`inner ${round} destroyed`));
        });
        return () => null;
      }),
    );
    await nextTick();
    bump();
    await nextTick();
    expect(log).toEqual(['inner 0 destroyed']);
  });

  it('_effect.root 不随组件销毁，返回的函数手动清理', async () => {
    const log: string[] = [];
    let count = _state(0);
    const stop = _effect.root(() => {
      _effect(() => {
        log.push(`run ${count}`);
      });
      return () => log.push('root cleanup');
    });
    await nextTick();
    count++;
    await nextTick();
    stop();
    count++;
    await nextTick();
    expect(log).toEqual(['run 0', 'run 1', 'root cleanup']);
  });

  it('不在任何作用域里创建时报错，提示改用 _effect.root', () => {
    expect(() => effect(() => {})).toThrow(/_effect\.root/);
  });
});
