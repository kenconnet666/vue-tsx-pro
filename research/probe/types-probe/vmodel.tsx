import { ref } from 'vue'
import { component } from '../src/component'
const Sw = component(({ checked = false }: { checked?: boolean }) => () => <i>{checked}</i>)
const on = ref(false)
export const a = <Sw v-model:checked={on.value} />
export const b = <Sw v-model:checked={'x'} />          // 期望报错
export const c = <input v-model={on.value} />
