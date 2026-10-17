// 类型探针：运行 pnpm typecheck，期望只在标注“应报错”的行出现错误
import { computed, readonly, ref, toRef } from 'vue'
import { Toggle } from '../src/Toggle'
import { Card } from '../src/Card'

const on = ref(false)

// —— 应通过 ——
export const ok1 = <Toggle checked={on} disabled onChange={(v) => v.valueOf()}>x</Toggle>
export const ok2 = <Card title="t">正文</Card>
export const ok3 = <Card header={<b>h</b>} />

// —— 应报错 ——
export const bad1 = <Toggle checked={true} />        // 应报错：需要 Ref<boolean>
export const bad2 = <Toggle checked={ref('x')} />    // 应报错：Ref<string>
export const bad3 = <Card title={1} />               // 应报错：title 是 string

// —— 类型无法拦住的只读来源（TS 的 readonly 不影响可赋值性），只能靠约定 + 运行时警告 ——
export const ro1 = <Toggle checked={computed(() => true)} />
export const ro2 = <Toggle checked={readonly(on)} />
export const ro3 = <Toggle checked={toRef(() => on.value)} />
