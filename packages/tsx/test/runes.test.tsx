describe('与 Vue 生态互通', () => {
  it('原生 v-model、第三方组件 v-model、reactive 对象路径', async () => {
    const el = mount(Page)
    type($(el, '.native'), 'bb'); await nextTick()
    expect($(el, '.name').textContent).toBe('bb')
    expect(($(el, '.tp') as HTMLInputElement).value).toBe('bb')
    type($(el, '.tp'), 'cc'); await nextTick()
    expect($(el, '.name').textContent).toBe('cc')
    expect(($(el, '.native') as HTMLInputElement).value).toBe('cc')
    type($(el, '.font'), '20'); await nextTick()
    expect(settings.fontSize).toBe(20) // v-model_number 修饰符也照常工作
  })

  it('_from 接入组合式函数的 Ref；getter 与 _ref 交给 Vue API', async () => {
    const el = mount(Page)
    expect($(el, '.theme').textContent).toBe('dark')
    ;($(el, '.dark') as HTMLButtonElement).click(); await nextTick()
    expect($(el, '.theme').textContent).toBe('light')
    expect($(el, '.xy').textContent).toBe('1,2')
    expect($(el, '.doubled').textContent).toBe('2')
    ;($(el, '.inc') as HTMLButtonElement).click(); await nextTick() // useIncrement(_ref(count)) 写回同一个 Ref
    expect($(el, '.doubled').textContent).toBe('4')
  })

  it('watch(() => x) 用 getter 观察响应式变量', async () => {
    const el = mount(Page)
    ;($(el, 'button') as HTMLButtonElement).click(); await nextTick(); await nextTick()
    expect($(el, '.last').textContent).toBe('true')
  })

  it('跨模块：导出 reactive 对象或读写函数', () => {
    settings.theme = 'dark'
    expect(settings.theme).toBe('dark')
    setToken('t1')
    expect(getToken()).toBe('t1')
  })
})

describe('读写形态', () => {
  it('解构赋值、简写、for-of、逻辑赋值、自增、遮蔽、JSX 标签', () => {
    const r = edgeCases()
    expect([r.a, r.b]).toEqual([2, 1])
    expect(r.shorthand).toEqual({ a: 2 })
    expect(r.last).toBe(6)
    expect(r.s).toBe('x!')
    expect([r.post, r.pre, r.n]).toEqual([9, 11, 11])
    expect(r.shadow).toBe(101)
    expect(r.typed).toBe(2)
    const el = mount(component(() => r.render))
    expect(el.innerHTML).toBe('<b>bar</b>')
  })
})

// 冒烟测试：符文经 Vite 预设编译后，在 Vue 中的运行时语义
import { afterEach, describe, it, expect } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import { component } from '../src';
import { Counter, log } from './fixtures/Counter';
import { Switch } from './fixtures/Switch';
import { Page } from './fixtures/Interop';
import { getToken, setToken, settings } from './fixtures/store';
import { edgeCases } from './fixtures/edge';

const apps: ReturnType<typeof createApp>[] = [];
afterEach(() => { while (apps.length) apps.pop()!.unmount(); });
const $ = (element: Element, selector: string) => element.querySelector(selector)!;
function type(input: Element, value: string) {
  (input as HTMLInputElement).value = value;
  input.dispatchEvent(new Event('input'));
}

function mount(root: Parameters<typeof createApp>[0]) {
  const el = document.createElement('div');
  const app = createApp(root);
  apps.push(app);
  app.mount(el);
  return el;
}

describe('符文', () => {
  it('unbound models keep independent local state', async () => {
    const el = mount(component(() => () => <><Switch>a</Switch><Switch>b</Switch></>));
    const [a, b] = el.querySelectorAll('button');
    a.click(); await nextTick();
    expect([a.getAttribute('aria-pressed'), b.getAttribute('aria-pressed')]).toEqual(['true', 'false']);
  });
  it('_state / _derived / _derived.by；副作用与生命周期直接用 Vue', async () => {
    log.length = 0;
    const el = mount(component(() => () => <Counter step={2} />));
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
      component(() => () => (
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
