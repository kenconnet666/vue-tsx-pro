import { describe, it, expect } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { component } from '../src/component'
import { Switch } from '../src/runes-demo/Switch'
import { Counter, log } from '../src/runes-demo/Counter'
import { Page } from '../src/runes-demo/Interop'
import { getToken, setToken, settings } from '../src/runes-demo/store'
import { edgeCases } from '../src/runes-demo/edge'

function mount(root: any) {
  const el = document.createElement('div')
  createApp(root).mount(el)
  return el
}
const $ = (el: Element, sel: string) => el.querySelector(sel)!
function type(input: Element, value: string) {
  ;(input as HTMLInputElement).value = value
  input.dispatchEvent(new Event('input'))
}

describe('状态与派生', () => {
  it('_state / _derived / _derived.by；副作用与生命周期直接用 Vue', async () => {
    log.length = 0
    const el = mount(component(() => () => <Counter step={2} />))
    expect([$(el, '.count').textContent, $(el, '.double').textContent, $(el, '.parity').textContent]).toEqual(['0', '0', 'even'])
    ;($(el, 'button') as HTMLButtonElement).click(); await nextTick()
    expect([$(el, '.count').textContent, $(el, '.double').textContent]).toEqual(['2', '4'])
    expect(log).toEqual(['count=0', 'mounted', 'count=2'])
  })
})

describe('_bindable 走标准 v-model 协议', () => {
  it('父级 v-model:checked 双向同步；子组件写入后同步读到新值', async () => {
    const seen: boolean[] = []
    const on = ref(false)
    const el = mount(component(() => () => <><Switch v-model:checked={on.value} onChange={(v) => seen.push(v)}>x</Switch><p>{String(on.value)}</p></>))
    ;($(el, 'button') as HTMLButtonElement).click(); await nextTick()
    expect(on.value).toBe(true)
    expect($(el, 'p').textContent).toBe('true')
    expect(seen).toEqual([true]) // toggle 里 onChange(checked) 读到的是写入后的值
    on.value = false; await nextTick()
    expect($(el, 'button').getAttribute('aria-pressed')).toBe('false')
  })

  it('不绑定时作为组件本地状态，各实例独立', async () => {
    const el = mount(component(() => () => <><Switch>a</Switch><Switch>b</Switch></>))
    const [a, b] = el.querySelectorAll('button')
    a.click(); await nextTick()
    expect([a.getAttribute('aria-pressed'), b.getAttribute('aria-pressed')]).toEqual(['true', 'false'])
  })

  it('普通 Vue 写法（h + onUpdate:checked，即 SFC 的 v-model:checked）也能用', async () => {
    const on = ref(true)
    const el = mount({ render: () => h(Switch, { checked: on.value, 'onUpdate:checked': (v: boolean) => (on.value = v) }, () => 'x') })
    ;($(el, 'button') as HTMLButtonElement).click(); await nextTick()
    expect(on.value).toBe(false)
  })
})

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
