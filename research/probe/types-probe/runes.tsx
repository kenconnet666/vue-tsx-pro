// 类型探针：符文在类型层面就是普通值
import { Switch } from '../src/runes-demo/Switch'

let on = _state(false)
let label = _state('x')
const size = _derived(label.length)
export const ok1 = <Switch v-model:checked={on}>{label}</Switch>
export const ok2: number = size
on = true

// —— 应报错 ——
export const bad1 = <Switch v-model:checked={label} />  // 应报错：string 不能绑到 boolean
label = 1                                               // 应报错：number 不能赋给 string
