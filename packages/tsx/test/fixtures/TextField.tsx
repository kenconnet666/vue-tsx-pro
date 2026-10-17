import { ref, type Ref } from 'vue'
import { component } from '../../src'

interface TextFieldProps {
  /** 输入值：传入父级 Ref 即双向同步，不传则使用组件自己的 Ref */
  value?: Ref<string>
  placeholder?: string
}

export const TextField = component(({ value = ref(''), placeholder = '', ...rest }: TextFieldProps) => {
  // ...rest 由宏转换为 useAttrs()：aria-*、id、name 等未声明属性显式透传到 input
  // v-model 复用 Vue 的原生输入处理（输入法组合、checkbox/radio/select 等）
  return () => <input {...rest} placeholder={placeholder} v-model={value.value} />
})
