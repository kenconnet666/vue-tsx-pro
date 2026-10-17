/**
 * component()：本研究推荐的唯一组件边界。
 *
 * 它只是 vue-jsx 的 defineComponent 外面薄薄一层，只多做一件事：
 * 把 Vue 的默认插槽映射成 props.children，让作者完全用 props 思考。
 *
 * 编译期能力（参数解构保持响应式、默认值、...rest → attrs）来自 vue-jsx 宏，
 * 需要在 vite.config.ts 里把 'component' 注册为 defineComponent 宏的别名。
 */
import { defineComponent } from 'vue-jsx'

export const component: typeof defineComponent = ((setup: any, options?: any) =>
  defineComponent(((props: any, ctx: any) => {
    // 只拦截 children 这一个键，其余读取原样交给 Vue 的 props 代理（保持依赖收集）
    const view = new Proxy(props, {
      get(target, key, receiver) {
        if (key === 'children' && target.children === undefined) {
          // 每次读取时才执行插槽：读取发生在子组件 render 内，
          // 因此内容是惰性的，依赖也归属子组件，父级不必整体重渲染
          return ctx.slots.default?.()
        }
        return Reflect.get(target, key, receiver)
      },
    })
    return setup(view, ctx)
  }) as any, options)) as any
