import { defineComponent as vueDefineComponent, h, watch } from 'vue'
import { component } from '../../src'
import { Switch } from './Switch'
import { settings } from './store'
import { useDoubled, useIncrement, usePointerLike, useStorageLike } from './composables'

/** 模拟第三方组件库：Options API + 标准 v-model 协议（modelValue / update:modelValue） */
export const ThirdPartyInput = vueDefineComponent({
  props: { modelValue: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', { class: 'tp', value: props.modelValue, onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value) })
  },
})

export const Page = component(() => {
  let on = _state(false)
  let name = _state('a')
  let count = _state(1)

  // 接入组合式函数返回的 Ref
  let theme = _from(useStorageLike('theme', 'dark'))
  const { x, y } = _from(usePointerLike())

  // 交给 Vue API：getter 或 _ref
  const doubled = _from(useDoubled(() => count))
  const increment = useIncrement(_ref(count))
  watch(() => on, (value) => (lastOn = value))
  let lastOn = _state<boolean | null>(null)

  return () => (
    <div>
      <Switch v-model:checked={on}>开关</Switch>
      <p class="on">{String(on)}</p>
      <p class="last">{String(lastOn)}</p>

      <input class="native" v-model={name} />
      <ThirdPartyInput v-model={name} />
      <p class="name">{name}</p>

      <input class="font" type="number" v-model_number={settings.fontSize} />
      <p class="size">{settings.fontSize}</p>

      <p class="theme">{theme}</p>
      <button class="dark" onClick={() => (theme = theme === 'dark' ? 'light' : 'dark')}>切换</button>
      <p class="xy">{x},{y}</p>

      <p class="doubled">{doubled}</p>
      <button class="inc" onClick={increment}>+1</button>
    </div>
  )
})
