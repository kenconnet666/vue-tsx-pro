import { it, expect } from 'vitest'
import { createApp, nextTick, ref } from 'vue'
import { component } from '../src/component'
import { Switch } from '../src/runes-demo/Switch'

it('_bindable 单向传值：子组件可本地切换，父级值变化时以父级为准', async () => {
  const on = ref(true)
  const el = document.createElement('div')
  createApp(component(() => () => <Switch checked={on.value}>x</Switch>)).mount(el)
  const btn = el.querySelector('button')!
  btn.click(); await nextTick()
  expect(btn.getAttribute('aria-pressed')).toBe('false') // 本地切换生效
  expect(on.value).toBe(true) //                            父级不受影响
  on.value = false; await nextTick(); on.value = true; await nextTick()
  expect(btn.getAttribute('aria-pressed')).toBe('true') //  父级更新后重新以父级为准
})
