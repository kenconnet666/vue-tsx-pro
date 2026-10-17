// 记录 vue-jsx 3.3.0-rc.3 的已知问题：断言“当前的错误行为”，上游修复后这里会变红，提醒更新结论
import { it, expect } from 'vitest'
import { createApp } from 'vue'
import { component } from '../src/component'

const StyledCard = component(({ color = 'red' }: { color?: string }) => {
  // defineStyle 的 JS 变量插值 + 参数解构：宏把调用处改写了，但 render 里的 style 变量未被重写
  defineStyle(`
    .card { color: ${color}; padding: 8px; }
  `)
  return () => <div class="card">x</div>
})

it('已知问题：defineStyle 插值引用解构 prop 时运行时报 ReferenceError', () => {
  const el = document.createElement('div')
  let error: unknown
  const app = createApp(component(() => () => <StyledCard color="blue" />))
  app.config.errorHandler = (e) => { error = e }
  app.mount(el)
  expect(String(error)).toContain('ReferenceError')
})
